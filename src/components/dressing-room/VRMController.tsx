/**
 * VRM Controller
 *
 * - Auto-blink (sine wave)
 * - Head tracking: face toward camera, slight mouse bias (ergonomic)
 * - Eye tracking: follow mouse cursor via eye bones or lookAt expressions
 *
 * IMPORTANT: This component's useFrame runs AFTER VRMAvatar's useFrame
 * (child mounts after parent), so bone overrides happen after vrm.update().
 * Do NOT call vrm.update() here — VRMAvatar handles it.
 *
 * @file src/components/dressing-room/VRMController.tsx
 */

import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { VRM } from '@pixiv/three-vrm';
import { Vector2, Vector3, Euler, Quaternion, Raycaster, Matrix4, Object3D } from 'three';
import { VRMExpressionAdapter } from '@/lib/vrm/capabilities';

interface VRMControllerProps {
  vrm: VRM | null;
  enabled?: boolean;
  autoBlink?: boolean;
  headTracking?: boolean;
  eyeTracking?: boolean;
  cameraFollow?: boolean;
  onHeadPositionUpdate?: (pos: Vector3) => void;
}

/* ─── Module-level object pool (NEVER allocate in useFrame) ─── */

// Mouse NDC (-1…1), updated via document listener
const _mouseNDC = new Vector2(0, 0);

// Raycaster for mouse→3D
const _raycaster = new Raycaster();

// Temp vectors
const _v3_camPos = new Vector3();
const _v3_headWorld = new Vector3();
const _v3_mouseWorld = new Vector3();
const _v3_headTarget = new Vector3();
const _v3_direction = new Vector3();
const _v3_localDir = new Vector3();
const _v3_toMouse = new Vector3();
const _v3_cameraTarget = new Vector3();

// Temp quaternions
const _q_parent = new Quaternion();
const _q_parentInv = new Quaternion();
const _q_worldTarget = new Quaternion();
const _q_localTarget = new Quaternion();
const _q_eye = new Quaternion();

// Temp euler / matrix
const _euler = new Euler();
const _mat4 = new Matrix4();
const _v3_up = new Vector3(0, 1, 0);

// Eye tracking temps
const _v3_headFwd = new Vector3();
const _v3_headRight = new Vector3();
const _v3_headUp = new Vector3();
const _q_headWorld = new Quaternion();
const _euler_eye = new Euler();

/* ─── Ergonomic constants ─── */
const HEAD_SMOOTHNESS = 0.06;       // Head lerp per frame (~3.6 at 60fps → smooth, no jitter)
const HEAD_MOUSE_WEIGHT = 0.15;     // How much mouse affects head direction (15%)
const HEAD_MAX_YAW = 0.35;          // ±20° head yaw
const HEAD_MAX_PITCH = 0.26;        // ±15° head pitch

const EYE_SMOOTHNESS = 0.18;        // Eyes respond faster than head
const EYE_MAX_YAW_RAD = 0.44;       // ±25° eye horizontal
const EYE_MAX_PITCH_RAD = 0.26;     // ±15° eye vertical

const MOUSE_WORLD_DISTANCE = 5;     // How far along the ray to place the mouse target

export function VRMController({
  vrm,
  enabled = true,
  autoBlink = true,
  headTracking = true,
  eyeTracking = true,
  cameraFollow = false,
  onHeadPositionUpdate,
}: VRMControllerProps) {
  const { camera } = useThree();

  // ─── Refs ───
  const expressionAdapterRef = useRef<VRMExpressionAdapter | null>(null);
  const headBoneRef = useRef<Object3D | null>(null);
  const leftEyeBoneRef = useRef<Object3D | null>(null);
  const rightEyeBoneRef = useRef<Object3D | null>(null);

  // Blink state
  const blinkTimerRef = useRef(0);
  const nextBlinkTimeRef = useRef(Math.random() * 4 + 2);
  const isBlinkingRef = useRef(false);
  const blinkProgressRef = useRef(0);

  // Accumulated head rotation (survives across frames, not reset by animation)
  const headQuatAccum = useRef(new Quaternion());
  const headInitialized = useRef(false);

  // Smooth eye values (for lerping)
  const eyeYawRef = useRef(0);
  const eyePitchRef = useRef(0);

  // Camera follow
  const cameraTargetRef = useRef(new Vector3(0, 1.2, 0));

  /* ─── Mouse tracking via document ─── */
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      _mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      _mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    document.addEventListener('pointermove', handler);
    return () => document.removeEventListener('pointermove', handler);
  }, []);

  /* ─── Init bones & adapter when VRM changes ─── */
  useEffect(() => {
    if (!vrm) {
      expressionAdapterRef.current = null;
      headBoneRef.current = null;
      leftEyeBoneRef.current = null;
      rightEyeBoneRef.current = null;
      headInitialized.current = false;
      return;
    }

    expressionAdapterRef.current = new VRMExpressionAdapter(vrm);

    // Head bone
    const hb = vrm.humanoid?.humanBones?.['head']?.node
      ?? (vrm.humanoid?.getNormalizedBoneNode?.('head') || null);
    headBoneRef.current = hb;

    // Eye bones (may not exist on all models)
    const le = vrm.humanoid?.humanBones?.['leftEye']?.node
      ?? (vrm.humanoid?.getNormalizedBoneNode?.('leftEye') || null);
    const re = vrm.humanoid?.humanBones?.['rightEye']?.node
      ?? (vrm.humanoid?.getNormalizedBoneNode?.('rightEye') || null);
    leftEyeBoneRef.current = le;
    rightEyeBoneRef.current = re;

    // Reset accumulated state
    headInitialized.current = false;
    eyeYawRef.current = 0;
    eyePitchRef.current = 0;
    nextBlinkTimeRef.current = Math.random() * 4 + 2;
  }, [vrm]);

  /* ─── Main animation loop ─── */
  useFrame((_state, delta) => {
    if (!enabled || !vrm) return;

    // ════════════════════════════════════════
    // 1. AUTO-BLINK
    // ════════════════════════════════════════
    if (autoBlink && expressionAdapterRef.current) {
      blinkTimerRef.current += delta;

      if (isBlinkingRef.current) {
        blinkProgressRef.current += delta * 8;
        if (blinkProgressRef.current >= Math.PI) {
          isBlinkingRef.current = false;
          blinkProgressRef.current = 0;
          nextBlinkTimeRef.current = Math.random() * 4 + 2;
          blinkTimerRef.current = 0;
          expressionAdapterRef.current.setValue('blink', 0);
        } else {
          expressionAdapterRef.current.setValue('blink', Math.sin(blinkProgressRef.current));
        }
      } else if (blinkTimerRef.current >= nextBlinkTimeRef.current) {
        isBlinkingRef.current = true;
        blinkProgressRef.current = 0;
      }
    }

    // ════════════════════════════════════════
    // 2. COMPUTE MOUSE WORLD POSITION
    //    (shared by head + eye tracking)
    // ════════════════════════════════════════
    camera.getWorldPosition(_v3_camPos);
    _raycaster.setFromCamera(_mouseNDC, camera);
    _raycaster.ray.at(MOUSE_WORLD_DISTANCE, _v3_mouseWorld);

    // ════════════════════════════════════════
    // 3. HEAD TRACKING — face camera, slight mouse bias
    // ════════════════════════════════════════
    const headBone = headBoneRef.current;
    if (headTracking && headBone) {
      // Seed accumulated quaternion from bone on first frame
      if (!headInitialized.current) {
        headQuatAccum.current.copy(headBone.quaternion);
        headInitialized.current = true;
      }

      // Head target = blend camera position with mouse world position
      _v3_headTarget.copy(_v3_camPos).lerp(_v3_mouseWorld, HEAD_MOUSE_WEIGHT);

      // Direction from head to target (world space)
      headBone.getWorldPosition(_v3_headWorld);
      _v3_direction.subVectors(_v3_headTarget, _v3_headWorld);
      if (_v3_direction.lengthSq() < 0.0001) {
        // Too close, skip
      } else {
        _v3_direction.normalize();

        // World target quaternion via lookAt matrix
        _mat4.lookAt(_v3_headWorld, _v3_headTarget, _v3_up);
        _q_worldTarget.setFromRotationMatrix(_mat4);

        // Convert to local space
        const parentBone = headBone.parent;
        if (parentBone) {
          parentBone.getWorldQuaternion(_q_parent);
          _q_parentInv.copy(_q_parent).invert();
          _q_localTarget.copy(_q_parentInv).multiply(_q_worldTarget);
        } else {
          _q_localTarget.copy(_q_worldTarget);
        }

        // Clamp euler angles
        _euler.setFromQuaternion(_q_localTarget, 'YXZ');
        _euler.y = Math.max(-HEAD_MAX_YAW, Math.min(HEAD_MAX_YAW, _euler.y));
        _euler.x = Math.max(-HEAD_MAX_PITCH, Math.min(HEAD_MAX_PITCH, _euler.x));
        _euler.z = 0;
        _q_localTarget.setFromEuler(_euler);

        // Smooth accumulate (never reads from bone — immune to animation reset)
        headQuatAccum.current.slerp(_q_localTarget, HEAD_SMOOTHNESS);
      }

      // Apply to bone (overrides animation)
      headBone.quaternion.copy(headQuatAccum.current);
    }

    // ════════════════════════════════════════
    // 4. EYE TRACKING — follow mouse cursor
    // ════════════════════════════════════════
    if (eyeTracking && headBone) {
      // Get head world orientation (after our override)
      headBone.updateMatrixWorld(true);
      headBone.getWorldQuaternion(_q_headWorld);
      headBone.getWorldPosition(_v3_headWorld);

      // Direction from head to mouse (world space)
      _v3_toMouse.subVectors(_v3_mouseWorld, _v3_headWorld).normalize();

      // Head's local axes in world space
      _v3_headFwd.set(0, 0, 1).applyQuaternion(_q_headWorld);
      _v3_headRight.set(1, 0, 0).applyQuaternion(_q_headWorld);
      _v3_headUp.set(0, 1, 0).applyQuaternion(_q_headWorld);

      // Project mouse direction onto head's axes to get yaw/pitch
      const rawYaw = Math.atan2(
        _v3_toMouse.dot(_v3_headRight),
        _v3_toMouse.dot(_v3_headFwd)
      );
      const rawPitch = Math.asin(
        Math.max(-1, Math.min(1, _v3_toMouse.dot(_v3_headUp)))
      );

      // Clamp to max eye range
      const clampedYaw = Math.max(-EYE_MAX_YAW_RAD, Math.min(EYE_MAX_YAW_RAD, rawYaw));
      const clampedPitch = Math.max(-EYE_MAX_PITCH_RAD, Math.min(EYE_MAX_PITCH_RAD, rawPitch));

      // Smooth lerp
      eyeYawRef.current += (clampedYaw - eyeYawRef.current) * EYE_SMOOTHNESS;
      eyePitchRef.current += (clampedPitch - eyePitchRef.current) * EYE_SMOOTHNESS;

      const yaw = eyeYawRef.current;
      const pitch = eyePitchRef.current;

      // Try bone-based eye control first (most VRoid models)
      const leftEye = leftEyeBoneRef.current;
      const rightEye = rightEyeBoneRef.current;

      if (leftEye && rightEye) {
        _euler_eye.set(-pitch, yaw, 0, 'YXZ');
        _q_eye.setFromEuler(_euler_eye);
        leftEye.quaternion.copy(_q_eye);
        rightEye.quaternion.copy(_q_eye);
      } else if (expressionAdapterRef.current) {
        // Expression-based fallback (lookLeft/Right/Up/Down)
        const normYaw = yaw / EYE_MAX_YAW_RAD;     // -1…1
        const normPitch = pitch / EYE_MAX_PITCH_RAD; // -1…1

        expressionAdapterRef.current.setValue('lookRight', Math.max(0, normYaw));
        expressionAdapterRef.current.setValue('lookLeft', Math.max(0, -normYaw));
        expressionAdapterRef.current.setValue('lookUp', Math.max(0, normPitch));
        expressionAdapterRef.current.setValue('lookDown', Math.max(0, -normPitch));
      }
    }

    // ════════════════════════════════════════
    // 5. CAMERA FOLLOW (optional)
    // ════════════════════════════════════════
    if (cameraFollow && vrm.scene) {
      if (headBone) {
        headBone.getWorldPosition(_v3_cameraTarget);
        _v3_cameraTarget.y += 0.2;
      } else {
        vrm.scene.getWorldPosition(_v3_cameraTarget);
        _v3_cameraTarget.y = 1.2;
      }
      cameraTargetRef.current.lerp(_v3_cameraTarget, delta * 2);
      camera.lookAt(cameraTargetRef.current);
    }

    // ════════════════════════════════════════
    // 6. HEAD POSITION CALLBACK (for autofocus)
    // ════════════════════════════════════════
    if (onHeadPositionUpdate) {
      if (headBone) {
        headBone.getWorldPosition(_v3_headWorld);
      } else if (vrm.scene) {
        vrm.scene.getWorldPosition(_v3_headWorld);
        _v3_headWorld.y = 1.2;
      }
      onHeadPositionUpdate(_v3_headWorld);
    }

    // NOTE: Do NOT call vrm.update() here — VRMAvatar handles it.
    // Bone overrides take effect immediately. Expression changes (blink)
    // flush on the next frame's vrm.update(), which is imperceptible.
  });

  return null;
}
