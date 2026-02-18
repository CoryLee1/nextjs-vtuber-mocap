/**
 * VRM LookAt 控制器 Hook
 * 
 * 功能：
 * - 让 VRM 头部骨骼平滑地看向目标（通常是相机）
 * - 应用旋转限制（Yaw ±90°, Pitch ±30°, Roll 0°）
 * - 使用 quaternion slerp 平滑插值
 * - 性能优化：节流更新
 * 
 * @file src/hooks/use-vrm-lookat.ts
 */

import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { VRM } from '@pixiv/three-vrm';
import { Vector3, Quaternion, Euler, Object3D, Matrix4 } from 'three';

interface UseVRMLookAtOptions {
  enabled?: boolean;
  smoothness?: number; // 0-1，越高越平滑（但响应越慢）
  maxYaw?: number; // 弧度，左右旋转限制，默认 ±90°
  maxPitch?: number; // 弧度，上下旋转限制，默认 ±30°
  maxRoll?: number; // 弧度，倾斜限制，默认 0°
  updateInterval?: number; // 更新间隔（帧数），默认 1（每帧更新）
  additive?: boolean; // 是否叠加模式（相对于动画的基础旋转），默认 true
}

/**
 * LookAt 更新函数（手动调用版本）
 * 用于在动画更新之后手动应用 LookAt 旋转
 */
export interface VRMLookAtUpdater {
  update: () => void;
}

/**
 * 创建 LookAt 更新器（手动调用版本）
 * 返回一个 update 函数，可以在 useFrame 中手动调用
 */
export function createVRMLookAtUpdater(
  vrm: VRM | null,
  target: Vector3 | Object3D | null,
  camera: Object3D,
  options: UseVRMLookAtOptions = {}
): VRMLookAtUpdater {
  const {
    enabled = true,
    smoothness = 0.1,
    maxYaw = Math.PI / 2,
    maxPitch = Math.PI / 6,
    maxRoll = 0,
    additive = false, // ✅ 强制覆盖模式，不使用叠加
  } = options;

  // PERF: 对象池，避免每帧创建新对象（使用闭包变量）
  const targetPosition = new Vector3();
  const headWorldPos = new Vector3();
  const direction = new Vector3();
  const currentQuaternion = new Quaternion();
  const targetQuaternion = new Quaternion();
  const worldTargetQuaternion = new Quaternion();
  const parentQuaternion = new Quaternion();
  const parentInverseQuaternion = new Quaternion();
  const lookAtMatrix = new Matrix4();
  const defaultUp = new Vector3(0, 1, 0);
  const tmpEuler_lookat = new Euler();

  return {
    update: () => {
      if (!enabled || !vrm) return;

      try {
        // 获取头部骨骼
        let headBone: Object3D | null = null;
        if (vrm.humanoid?.humanBones?.['head']?.node) {
          headBone = vrm.humanoid.humanBones['head'].node;
        } else if (vrm.humanoid && typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
          headBone = vrm.humanoid.getNormalizedBoneNode('head');
        }

        if (!headBone) return;

        // ✅ 关键：每一帧都获取相机的最新世界坐标
        // 优先使用 camera，确保获取最新位置
        camera.updateMatrixWorld(true);
        camera.getWorldPosition(targetPosition);
        
        // 如果提供了 target 且不是 camera，使用 target
        if (target && target !== camera) {
          if (target instanceof Vector3) {
            targetPosition.copy(target);
          } else if (target instanceof Object3D) {
            target.updateMatrixWorld(true);
            target.getWorldPosition(targetPosition);
          }
        }

        // ✅ 获取头部骨骼的世界位置
        headBone.updateMatrixWorld(true);
        headBone.getWorldPosition(headWorldPos);

        // ✅ 计算方向向量（从头部指向目标）
        direction
          .subVectors(targetPosition, headWorldPos)
          .normalize();

        // 如果没有有效方向，跳过
        if (direction.lengthSq() < 0.001) return;

        // ✅ 使用 matrix.lookAt 计算目标旋转（世界空间）
        // lookAtMatrix 会让 Z 轴指向目标方向
        lookAtMatrix.lookAt(headWorldPos, targetPosition, defaultUp);
        
        // 从矩阵中提取四元数（世界空间）
        worldTargetQuaternion.setFromRotationMatrix(lookAtMatrix);
        
        // ✅ 应用旋转限制（在世界空间中限制）
        const parentBone = headBone.parent;
        if (parentBone) {
          // 获取父节点的世界旋转
          parentBone.getWorldQuaternion(parentQuaternion);
          parentInverseQuaternion.copy(parentQuaternion).invert();
          
          // 将世界旋转转换为局部空间
          targetQuaternion.copy(parentInverseQuaternion).multiply(worldTargetQuaternion);
        } else {
          // 如果没有父节点，直接使用世界空间旋转
          targetQuaternion.copy(worldTargetQuaternion);
        }
        
        // ✅ 应用旋转限制（在局部空间中限制欧拉角）
        tmpEuler_lookat.setFromQuaternion(targetQuaternion, 'YXZ');
        tmpEuler_lookat.y = Math.max(-maxYaw, Math.min(maxYaw, tmpEuler_lookat.y));
        tmpEuler_lookat.x = Math.max(-maxPitch, Math.min(maxPitch, tmpEuler_lookat.x));
        tmpEuler_lookat.z = maxRoll;
        targetQuaternion.setFromEuler(tmpEuler_lookat);

        // ✅ 强制覆盖模式：直接使用 slerp，不使用叠加
        // 获取当前头部骨骼的局部旋转（动画更新后的旋转）
        currentQuaternion.copy(headBone.quaternion);
        
        // 使用 slerp 平滑插值到目标旋转
        currentQuaternion.slerp(targetQuaternion, smoothness);
        
        // ✅ 直接覆盖头部骨骼的旋转
        headBone.quaternion.copy(currentQuaternion);
        
        // ✅ 关键：立即更新矩阵，确保旋转生效
        headBone.updateMatrix();
        headBone.updateMatrixWorld(true);

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('VRMLookAtUpdater: Failed to update head rotation', error);
        }
      }
    },
  };
}

/**
 * 让 VRM 头部骨骼平滑地看向目标（Hook 版本）
 * 
 * ⚠️ 注意：如果需要在动画之后应用 LookAt，请使用 createVRMLookAtUpdater 并在 useFrame 中手动调用
 * 
 * @param vrm VRM 模型实例
 * @param target 目标位置（Vector3）或相机对象
 * @param options 配置选项
 */
export function useVRMLookAt(
  vrm: VRM | null,
  target: Vector3 | Object3D | null,
  options: UseVRMLookAtOptions = {}
): void {
  const {
    enabled = true,
    smoothness = 0.1, // 默认每帧移动 10% 的距离（平滑）
    maxYaw = Math.PI / 2, // 90度
    maxPitch = Math.PI / 6, // 30度
    maxRoll = 0, // 不倾斜
    updateInterval = 1, // 默认每帧更新
    additive = true, // 默认叠加模式，以便与动画叠加
  } = options;

  const { camera } = useThree();
  
  // PERF: 对象池，避免每帧创建新对象
  const targetPositionRef = useRef(new Vector3());
  const headWorldPosRef = useRef(new Vector3());
  const directionRef = useRef(new Vector3());
  const currentQuaternionRef = useRef(new Quaternion());
  const targetQuaternionRef = useRef(new Quaternion());
  const eulerRef = useRef(new Euler());
  const frameCountRef = useRef(0);
  // 临时对象（用于计算局部旋转）
  const parentQuaternionRef = useRef(new Quaternion());
  const worldTargetQuaternionRef = useRef(new Quaternion());
  const defaultForwardRef = useRef(new Vector3(0, 0, 1));
  const additiveQuaternionRef = useRef(new Quaternion());

  useEffect(() => {
    // 重置计数器
    frameCountRef.current = 0;
  }, [enabled, vrm]);

  useFrame(() => {
    if (!enabled || !vrm) return;

    // 节流：按间隔更新
    frameCountRef.current++;
    if (frameCountRef.current % updateInterval !== 0) {
      return;
    }

    try {
      // 获取头部骨骼
      let headBone: Object3D | null = null;
      if (vrm.humanoid?.humanBones?.['head']?.node) {
        headBone = vrm.humanoid.humanBones['head'].node;
      } else if (vrm.humanoid && typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
        headBone = vrm.humanoid.getNormalizedBoneNode('head');
      }

      if (!headBone) return;

      // 获取目标位置
      if (target instanceof Vector3) {
        targetPositionRef.current.copy(target);
      } else if (target instanceof Object3D) {
        target.getWorldPosition(targetPositionRef.current);
      } else {
        // 如果没有提供 target，使用相机位置
        camera.getWorldPosition(targetPositionRef.current);
      }

      // 获取头部骨骼的世界位置
      headBone.getWorldPosition(headWorldPosRef.current);

      // 计算方向向量（从头部指向目标）
      directionRef.current
        .subVectors(targetPositionRef.current, headWorldPosRef.current)
        .normalize();

      // 如果没有有效方向，跳过
      if (directionRef.current.lengthSq() < 0.001) return;

      // 计算目标四元数（让头部朝向目标方向）
      // 关键：需要在头部骨骼的局部空间中计算旋转
      // 方法：将世界方向转换到父节点（neck）的局部空间
      
      const parentBone = headBone.parent;
      
      if (parentBone) {
        // 获取父节点的世界旋转
        parentBone.getWorldQuaternion(parentQuaternionRef.current);
        
        // 计算目标四元数（世界空间）
        worldTargetQuaternionRef.current.setFromUnitVectors(
          defaultForwardRef.current, 
          directionRef.current
        );
        
        // 转换为局部空间：localQuaternion = parentQuaternion^-1 * worldQuaternion
        parentQuaternionRef.current.invert();
        targetQuaternionRef.current.multiplyQuaternions(
          parentQuaternionRef.current, 
          worldTargetQuaternionRef.current
        );
      } else {
        // 如果没有父节点，直接使用世界空间的方向
        targetQuaternionRef.current.setFromUnitVectors(
          defaultForwardRef.current, 
          directionRef.current
        );
      }

      // 转换为欧拉角以便应用限制
      eulerRef.current.setFromQuaternion(targetQuaternionRef.current, 'YXZ');

      // 应用旋转限制
      // Yaw (Y 轴旋转，左右)
      eulerRef.current.y = Math.max(-maxYaw, Math.min(maxYaw, eulerRef.current.y));
      
      // Pitch (X 轴旋转，上下)
      eulerRef.current.x = Math.max(-maxPitch, Math.min(maxPitch, eulerRef.current.x));
      
      // Roll (Z 轴旋转，倾斜) - 通常设为 0
      eulerRef.current.z = maxRoll;

      // 将限制后的欧拉角转换回四元数
      targetQuaternionRef.current.setFromEuler(eulerRef.current);

      // 获取当前头部骨骼的局部旋转（可能是动画设置的旋转）
      currentQuaternionRef.current.copy(headBone.quaternion);

      if (additive) {
        // 叠加模式：将 LookAt 旋转叠加到当前旋转（动画）上
        // final = slerp(current, current * target, weight)
        // 这样可以保留动画的基础旋转，LookAt 只作为微调

        // 计算叠加旋转：当前旋转 * LookAt 旋转增量
        additiveQuaternionRef.current.copy(currentQuaternionRef.current).multiply(targetQuaternionRef.current);

        // 使用较小的 smoothness（如 0.1-0.2）进行混合
        currentQuaternionRef.current.slerp(additiveQuaternionRef.current, smoothness * 0.5);

        headBone.quaternion.copy(currentQuaternionRef.current);
      } else {
        // 非叠加模式：直接替换旋转（完全覆盖动画）
        // 使用 slerp 平滑插值（球形线性插值）
        currentQuaternionRef.current.slerp(targetQuaternionRef.current, smoothness);

        // 应用旋转到头部骨骼（局部旋转）
        headBone.quaternion.copy(currentQuaternionRef.current);
      }

    } catch (error) {
      // 静默处理错误，避免崩溃
      if (process.env.NODE_ENV === 'development') {
        console.warn('useVRMLookAt: Failed to update head rotation', error);
      }
    }
  });
}

