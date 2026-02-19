/**
 * Coordinate axis normalization for animations and FBX sources.
 *
 * Fact summary (see plan for full references):
 * - Target internal: Y-up, right-handed, forward +Z (after VRM 0.x rotateVRM0).
 * - VRM 0.x: Y-up, forward Z-; VRM 1.0: Y-up, forward Z+.
 * - Mixamo: Y-up, -Z forward; FBX tracks are already Y-up.
 * - KAWAII/UE4: Z-up (Z = height); FBXLoader applies -90° X to scene root;
 *   animation track data remains in Z-up and must be converted to Y-up.
 *
 * This module only handles up-axis detection and Z-up → Y-up conversion for
 * position and quaternion data. Bone name mapping stays in animation-manager.
 *
 * @file src/lib/coordinate-axes.ts
 */

import * as THREE from 'three';
import type { Object3D } from 'three';

/** Source hint for axis convention: mixamo = Y-up, kawaii = Z-up, auto = detect from fbxRoot or position */
export type AxisSourceHint = 'mixamo' | 'kawaii' | 'auto';

export const AXIS_SOURCE = {
  MIXAMO: 'mixamo' as const,
  KAWAII: 'kawaii' as const,
  AUTO: 'auto' as const,
};

/** Index of the axis that is "up" in position data: 0=X, 1=Y, 2=Z */
export type UpAxisIndex = 0 | 1 | 2;

const TOLERANCE = 0.05;
/** FBXLoader applies -90° X for Z-up; quaternion for -90° X: x = -sin(45°), w = cos(45°) */
const Z_UP_ROOT_X = -Math.SQRT1_2;
const Z_UP_ROOT_W = Math.SQRT1_2;

/** +90° around X: Z→Y, Y→-Z. Used for q_yup = R * q_zup * R_inv */
const R_ZUP_TO_YUP = new THREE.Quaternion(Math.SQRT1_2, 0, 0, Math.SQRT1_2);
const R_ZUP_TO_YUP_INV = new THREE.Quaternion().copy(R_ZUP_TO_YUP).invert();

const _qTemp = new THREE.Quaternion();

/**
 * Detects which component of a position vector is the "up" axis (has largest absolute value).
 * Used to distinguish Y-up (index 1) vs Z-up (index 2) from rest pose or first frame.
 * @returns 0 = X-up, 1 = Y-up, 2 = Z-up
 */
export function detectPositionUpAxis(restPositionXYZ: [number, number, number]): UpAxisIndex {
  const [x, y, z] = restPositionXYZ;
  const absVals = [Math.abs(x), Math.abs(y), Math.abs(z)];
  const maxIdx = absVals.indexOf(Math.max(...absVals));
  return maxIdx as UpAxisIndex;
}

/**
 * Converts position data from Z-up to Y-up in place or into a new array.
 * Formula: X'=X, Y'=Z, Z'=-Y (same as animation-manager.ts and test-kawaii).
 * @param values - Float32Array of position components (xyz, xyz, ...)
 * @param stride - Components per sample; default 3
 * @param inPlace - If true, mutate values; otherwise return a new array
 */
export function convertPositionZUpToYUp(
  values: Float32Array,
  stride: number = 3,
  inPlace: boolean = false
): Float32Array {
  const out = inPlace ? values : new Float32Array(values.length);
  if (!inPlace) out.set(values);
  for (let i = 0; i < out.length; i += stride) {
    if (i + 2 < out.length) {
      const x = out[i];
      const y = out[i + 1];
      const z = out[i + 2];
      out[i] = x;
      out[i + 1] = z;
      out[i + 2] = -y;
    }
  }
  return out;
}

/**
 * Converts a single quaternion from Z-up to Y-up space.
 * q_yup = R_z2y * q_zup * R_z2y_inv (R = +90° around X).
 * Modifies q in place and returns it.
 */
export function convertQuaternionZUpToYUp(q: THREE.Quaternion): THREE.Quaternion {
  _qTemp.copy(q);
  q.copy(_qTemp).premultiply(R_ZUP_TO_YUP).multiply(R_ZUP_TO_YUP_INV);
  return q;
}

/**
 * Converts a single quaternion from Y-up to Z-up space (inverse of convertQuaternionZUpToYUp).
 * q_zup = R_z2y_inv * q_yup * R_z2y. Used when KAWAII rig is loaded as Y-up but track is Z-up.
 */
export function convertQuaternionYUpToZUp(q: THREE.Quaternion): THREE.Quaternion {
  _qTemp.copy(q);
  q.copy(_qTemp).premultiply(R_ZUP_TO_YUP_INV).multiply(R_ZUP_TO_YUP);
  return q;
}

/**
 * Applies Z-up → Y-up to quaternion components in a Float32Array (xyzw per sample).
 * Does not mutate the original; returns a new Float32Array.
 */
export function convertQuaternionTrackZUpToYUp(values: Float32Array): Float32Array {
  const out = new Float32Array(values.length);
  const q = new THREE.Quaternion();
  for (let i = 0; i < values.length; i += 4) {
    q.set(values[i], values[i + 1], values[i + 2], values[i + 3]);
    convertQuaternionZUpToYUp(q);
    out[i] = q.x;
    out[i + 1] = q.y;
    out[i + 2] = q.z;
    out[i + 3] = q.w;
  }
  return out;
}

/**
 * Detects whether the FBX scene root has the Z-up conversion rotation applied by Three.js FBXLoader.
 * FBXLoader applies -90° around X for Z-up files (rootQ.x ≈ -√2/2, rootQ.w ≈ √2/2).
 */
export function detectFbxSceneZUp(fbxRoot: Object3D): boolean {
  const q = fbxRoot.quaternion;
  return Math.abs(q.x - Z_UP_ROOT_X) < TOLERANCE && Math.abs(q.w - Z_UP_ROOT_W) < TOLERANCE;
}

export interface NormalizeAnimationClipOptions {
  /** If set, overrides automatic detection: 'kawaii' = force Z-up conversion, 'mixamo' = skip */
  sourceHint?: AxisSourceHint;
  /** If set and sourceHint is not 'mixamo'|'kawaii', used to detect Z-up via detectFbxSceneZUp */
  fbxRoot?: Object3D;
}

/**
 * Normalizes an animation clip to Y-up: when Z-up is detected (hint or fbxRoot),
 * converts all position and quaternion tracks from Z-up to Y-up.
 * Returns a new clip; does not mutate the original.
 */
export function normalizeAnimationClipToYUp(
  clip: THREE.AnimationClip,
  options: NormalizeAnimationClipOptions = {}
): THREE.AnimationClip {
  const { sourceHint = 'auto', fbxRoot } = options;
  let isZUp: boolean;
  if (sourceHint === 'kawaii') {
    isZUp = true;
  } else if (sourceHint === 'mixamo') {
    isZUp = false;
  } else {
    isZUp = !!fbxRoot && detectFbxSceneZUp(fbxRoot);
  }

  if (!isZUp) return clip.clone();

  const newTracks: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    if (track instanceof THREE.VectorKeyframeTrack && track.name.endsWith('.position')) {
      const values = new Float32Array(track.values.length);
      values.set(track.values);
      convertPositionZUpToYUp(values, 3, true);
      newTracks.push(new THREE.VectorKeyframeTrack(track.name, track.times, values));
    } else if (track instanceof THREE.QuaternionKeyframeTrack && track.name.endsWith('.quaternion')) {
      const values = convertQuaternionTrackZUpToYUp(track.values);
      newTracks.push(new THREE.QuaternionKeyframeTrack(track.name, track.times, values));
    } else {
      newTracks.push(track.clone());
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, newTracks);
}

// ─── Dev self-check (run once when module loads in development) ───
// 自检方式：npm run dev 启动后，打开任意使用动画的页面（或主应用），在浏览器控制台会看到通过/失败。
const isDev =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ||
  (typeof globalThis !== 'undefined' && (globalThis as any).__COORDINATE_AXES_FORCE_SELFCHECK__ === true);

if (isDev) {
  try {
    const up = detectPositionUpAxis([0, 0, 95]);
    if (up !== 2) throw new Error(`detectPositionUpAxis([0,0,95]) expected 2 (Z-up), got ${up}`);
    const upY = detectPositionUpAxis([0, 1, 0]);
    if (upY !== 1) throw new Error(`detectPositionUpAxis([0,1,0]) expected 1 (Y-up), got ${upY}`);
    const pos = new Float32Array([1, 2, 3]);
    convertPositionZUpToYUp(pos, 3, true);
    if (Math.abs(pos[0] - 1) > 1e-6 || Math.abs(pos[1] - 3) > 1e-6 || Math.abs(pos[2] + 2) > 1e-6) {
      throw new Error(`convertPositionZUpToYUp([1,2,3]) expected [1,3,-2], got [${pos[0]},${pos[1]},${pos[2]}]`);
    }
    const q = new THREE.Quaternion(0, 0, 0, 1);
    convertQuaternionZUpToYUp(q);
    if (Math.abs(q.w - 1) > 1e-5) {
      throw new Error(`convertQuaternionZUpToYUp(identity) should keep w≈1, got w=${q.w}`);
    }
    if (typeof console !== 'undefined' && console.info) {
      console.info('[coordinate-axes] 自检通过 (self-check passed)');
    }
  } catch (e) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[coordinate-axes] 自检失败 (self-check failed):', e);
    }
    throw e;
  }
}
