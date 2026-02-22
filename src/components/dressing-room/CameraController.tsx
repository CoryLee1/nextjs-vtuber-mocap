'use client';

import React, { useRef, useEffect, memo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, CameraShake } from '@react-three/drei';
import { Vector3, MOUSE } from 'three';
import { useSceneStore } from '@/hooks/use-scene-store';
import { ORBIT_CONTROLS_DEFAULTS, CAMERA_SHAKE_DEFAULTS } from '@/config/drei-camera-settings';

/**
 * VRM 相机控制器（drei OrbitControls + CameraShake）
 *
 * 与 R3F/drei 官方示例一致：OrbitControls makeDefault 后，其他组件（如 CameraShake）
 * 会基于 state.controls 协同，不会互相覆盖。任意处可通过 useThree(state => state.controls) 拿到控制器。
 *
 * 特性：自动跟踪 VRM 头部（水平 lerp）、右键控制俯仰、CameraShake 呼吸感、节流+对象池。
 */
interface CameraControllerProps {
  vrmRef?: React.RefObject<any>;
  enableAutoTrack?: boolean;
  enableUserControl?: boolean;
  enableShake?: boolean;
  showHint?: boolean;
  useGameStyle?: boolean;
  trackingSpeed?: number; // 跟踪速度 (0-1)，默认 0.05
  cameraSettings?: {
    minDistance?: number;
    maxDistance?: number;
    enableAutoRotate?: boolean;
    autoRotateSpeed?: number;
    [key: string]: any;
  };
}

const CameraControllerComponent: React.FC<CameraControllerProps> = ({
  vrmRef,
  enableAutoTrack = true,
  enableUserControl = true,
  enableShake = true,
  showHint = true,
  useGameStyle = true,
  trackingSpeed = 0.05, // 默认跟踪速度
  cameraSettings = {},
}) => {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const vrmModel = useSceneStore((state) => state.vrmModel);
  
  // PERF: 对象池，避免每帧创建新对象
  const tmpVec3 = useRef(new Vector3());
  const targetPosition = useRef(new Vector3()); // 目标位置（用于 lerp 插值）
  const frameCount = useRef(0);
  const updateInterval = 3; // 每 3 帧计算一次（节流，从 60fps 降到 20fps）
  const isInitialized = useRef(false);

  // 初始化相机位置和鼠标按钮配置
  useEffect(() => {
    if (controlsRef.current && camera && !isInitialized.current) {
      // 设置初始相机位置（稍微向后，俯视角度）
      camera.position.set(0, 1.5, 2.5);
      // OrbitControls 会自动设置 target
      const initialTarget = new Vector3(0, 0.9, 0); // 初始目标点（VRM 胸部位置）
      controlsRef.current.target.copy(initialTarget);
      targetPosition.current.copy(initialTarget); // 初始化目标位置
      isInitialized.current = true;
    }
  }, [camera]);

  // 自动跟踪 VRM 头部骨骼（使用 lerp 平滑插值，节流计算）
  useFrame(() => {
    if (!enableAutoTrack || !controlsRef.current) return;

    // 节流：每 3 帧计算一次
    frameCount.current++;
    if (frameCount.current % updateInterval !== 0) {
      return; // 跳过这一帧
    }

    // 优先从 store 获取 VRM 模型，否则从 vrmRef 获取
    const targetVrm = vrmModel || vrmRef?.current?.userData?.vrm;

    if (targetVrm?.humanoid) {
      try {
        // 获取头部骨骼
        let headBone = null;
        if (targetVrm.humanoid.humanBones?.['head']?.node) {
          headBone = targetVrm.humanoid.humanBones['head'].node;
        } else if (typeof targetVrm.humanoid.getNormalizedBoneNode === 'function') {
          headBone = targetVrm.humanoid.getNormalizedBoneNode('head');
        }

        if (headBone && typeof headBone.getWorldPosition === 'function') {
          // 获取头部骨骼的世界坐标
          headBone.getWorldPosition(tmpVec3.current);
          // 添加偏移，让相机对准眼睛位置（头部骨骼通常在头顶，下移一点到脸部）
          if (Number.isFinite(tmpVec3.current.y)) {
            tmpVec3.current.y -= 0.15;
          }

          // 验证坐标有效性
          if (
            Number.isFinite(tmpVec3.current.x) &&
            Number.isFinite(tmpVec3.current.y) &&
            Number.isFinite(tmpVec3.current.z)
          ) {
            // ✅ 关键修改：使用 lerp 平滑插值，只更新 X 和 Z 坐标
            // 保留当前目标点的 Y 坐标（垂直角度由用户控制）
            const currentY = controlsRef.current.target.y;
            const currentTarget = controlsRef.current.target;
            
            // 设置目标位置的 X 和 Z（保留 Y）
            targetPosition.current.x = tmpVec3.current.x;
            targetPosition.current.z = tmpVec3.current.z;
            targetPosition.current.y = currentY; // 保持用户控制的垂直位置
            
            // PERF: 使用现有对象，避免创建新 Vector3
            // 使用 lerp 平滑插值到目标位置（只对 X 和 Z 进行插值）
            const newX = currentTarget.x + (targetPosition.current.x - currentTarget.x) * trackingSpeed;
            const newZ = currentTarget.z + (targetPosition.current.z - currentTarget.z) * trackingSpeed;
            
            // 检查距离是否足够大，避免不必要的更新
            const dx = newX - currentTarget.x;
            const dz = newZ - currentTarget.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance > 0.001) {
              // ✅ 关键：只设置 target，不要调用 update()
              // OrbitControls 会在需要时自动调用 update()，避免与 CameraShake 冲突
              currentTarget.x = newX;
              currentTarget.z = newZ;
              // Y 保持不变，由用户控制
            }
          }
        }
      } catch (error) {
        // 静默处理错误，避免 ref 还没准备好时崩溃
        if (process.env.NODE_ENV === 'development') {
          console.warn('CameraController: Failed to get head bone position', error);
        }
      }
    }
  });

  const orbit = { ...ORBIT_CONTROLS_DEFAULTS, ...cameraSettings };

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={enableUserControl}
        enableDamping={orbit.enableDamping}
        dampingFactor={orbit.dampingFactor}
        minDistance={cameraSettings.minDistance ?? orbit.minDistance}
        maxDistance={cameraSettings.maxDistance ?? orbit.maxDistance}
        enablePan={orbit.enablePan}
        minPolarAngle={orbit.minPolarAngle}
        maxPolarAngle={orbit.maxPolarAngle}
        autoRotate={cameraSettings.enableAutoRotate ?? orbit.autoRotate}
        autoRotateSpeed={cameraSettings.autoRotateSpeed ?? orbit.autoRotateSpeed}
        mouseButtons={{
          LEFT: MOUSE.ROTATE,
          MIDDLE: MOUSE.DOLLY,
          RIGHT: MOUSE.ROTATE,
        }}
      />
      {enableShake && <CameraShake {...CAMERA_SHAKE_DEFAULTS} />}
    </>
  );
};

// PERF: 使用 memo 优化性能
export const CameraController = memo(CameraControllerComponent);
