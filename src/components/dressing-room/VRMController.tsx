/**
 * VRM 控制器组件
 * 
 * 功能：
 * - 自动眨眼
 * - 头部追踪（平滑跟随相机）
 * - 视线追踪（LookAt）
 * - 相机行为（自动对焦角色）
 * 
 * @file src/components/dressing-room/VRMController.tsx
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { VRM } from '@pixiv/three-vrm';
import { Vector3, Euler, Quaternion } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { VRMExpressionAdapter } from '@/lib/vrm/capabilities';
import { Sparkles } from '@react-three/drei';

interface VRMControllerProps {
  vrm: VRM | null;
  enabled?: boolean;
  autoBlink?: boolean;
  headTracking?: boolean;
  lookAt?: boolean;
  cameraFollow?: boolean;
}

// 临时变量（避免每帧创建新对象）
const tmpVec3 = new Vector3();
const tmpEuler = new Euler();
const tmpQuat = new Quaternion();

/**
 * VRM 控制器组件
 * 
 * 集成自动眨眼、头部追踪、视线追踪和相机行为
 */
export function VRMController({
  vrm,
  enabled = true,
  autoBlink = true,
  headTracking = true,
  lookAt = true,
  cameraFollow = true,
  onHeadPositionUpdate,
}: VRMControllerProps) {
  const { camera } = useThree();
  
  // 眨眼相关
  const blinkTimerRef = useRef<number>(0);
  const nextBlinkTimeRef = useRef<number>(0);
  const isBlinkingRef = useRef<boolean>(false);
  const blinkProgressRef = useRef<number>(0);
  const expressionAdapterRef = useRef<VRMExpressionAdapter | null>(null);
  
  // 头部追踪相关
  const headBoneRef = useRef<any>(null);
  const headRotationRef = useRef<Vector3>(new Vector3());
  const targetHeadRotationRef = useRef<Vector3>(new Vector3());
  
  // 视线追踪相关
  const lookAtTargetRef = useRef<Vector3>(new Vector3());
  
  // 相机追踪相关
  const cameraTargetRef = useRef<Vector3>(new Vector3(0, 1.2, 0));
  
  // 初始化：检测 VRM 版本并创建表情适配器
  useEffect(() => {
    if (!vrm) {
      expressionAdapterRef.current = null;
      headBoneRef.current = null;
      return;
    }
    
    // 创建表情适配器（兼容 VRM 0.x 和 1.0）
    expressionAdapterRef.current = new VRMExpressionAdapter(vrm);
    
    // 获取头部骨骼节点
    // ✅ 修复：getBoneNode() 已被弃用，优先使用 humanBones[].node，降级使用 getNormalizedBoneNode()
    if (vrm.humanoid) {
      if (vrm.humanoid.humanBones?.['head']?.node) {
        headBoneRef.current = vrm.humanoid.humanBones['head'].node;
      } else if (typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
        headBoneRef.current = vrm.humanoid.getNormalizedBoneNode('head');
      }
    }
    
    // 初始化眨眼时间
    nextBlinkTimeRef.current = Math.random() * 4 + 2; // 2-6秒随机间隔
  }, [vrm]);
  
  // 主循环：处理所有动画和追踪
  useFrame((state, delta) => {
    if (!enabled || !vrm) return;
    
    const deltaTime = delta;
    
    // ========== 1. 自动眨眼 ==========
    if (autoBlink && expressionAdapterRef.current) {
      blinkTimerRef.current += deltaTime;
      
      if (isBlinkingRef.current) {
        // 正在眨眼：使用正弦函数实现平滑开合
        blinkProgressRef.current += deltaTime * 8; // 眨眼速度
        if (blinkProgressRef.current >= Math.PI) {
          // 眨眼完成
          isBlinkingRef.current = false;
          blinkProgressRef.current = 0;
          nextBlinkTimeRef.current = Math.random() * 4 + 2; // 设置下次眨眼时间
          blinkTimerRef.current = 0;
          // 重置眨眼值
          expressionAdapterRef.current.setValue('blink', 0);
        } else {
          // 使用正弦函数：0 -> 1 -> 0
          const blinkValue = Math.sin(blinkProgressRef.current);
          expressionAdapterRef.current.setValue('blink', blinkValue);
        }
      } else if (blinkTimerRef.current >= nextBlinkTimeRef.current) {
        // 触发眨眼
        isBlinkingRef.current = true;
        blinkProgressRef.current = 0;
      }
    }
    
    // ========== 2. 头部追踪 ==========
    // 注意：如果启用了 useVRMLookAt（在 VRMAvatar 中），头部追踪可能会冲突
    // 建议：headTracking 和 useVRMLookAt 只启用一个
    if (headTracking && headBoneRef.current) {
      // 获取相机位置（世界坐标）
      camera.getWorldPosition(tmpVec3);
      
      // 获取头部骨骼位置（世界坐标）
      const headWorldPos = new Vector3();
      headBoneRef.current.getWorldPosition(headWorldPos);
      
      // 计算从头部指向相机的方向向量
      const direction = tmpVec3.clone().sub(headWorldPos);
      const distance = direction.length();
      
      // 如果距离太近，跳过更新
      if (distance < 0.01) return;
      
      direction.normalize();
      
      // 将世界方向转换到头部骨骼的本地空间
      const parentBone = headBoneRef.current.parent;
      if (parentBone) {
        // 获取父节点的世界旋转
        const parentWorldQuat = new Quaternion();
        parentBone.getWorldQuaternion(parentWorldQuat);
        
        // 将方向向量转换到父节点的本地空间
        const localDirection = direction.clone().applyQuaternion(parentWorldQuat.invert());
        
        // 计算目标旋转（Euler 角度）
        // 头部默认朝向 +Z（VRM 标准）
        const defaultForward = new Vector3(0, 0, 1);
        const targetQuat = new Quaternion().setFromUnitVectors(
          defaultForward,
          localDirection.normalize()
        );
        
        tmpEuler.setFromQuaternion(targetQuat);
        
        // 限制旋转范围：±45度（约 0.78 弧度）
        const maxAngle = 0.78; // 45度
        tmpEuler.x = Math.max(-maxAngle, Math.min(maxAngle, tmpEuler.x));
        tmpEuler.y = Math.max(-maxAngle, Math.min(maxAngle, tmpEuler.y));
        tmpEuler.z = 0; // 不倾斜
        
        // 更新目标旋转
        targetHeadRotationRef.current.set(tmpEuler.x, tmpEuler.y, tmpEuler.z);
      }
      
      // 平滑插值到目标旋转（使用 lerp 因子）
      const lerpFactor = Math.min(1, deltaTime * 5); // 限制最大插值速度
      headRotationRef.current.lerp(targetHeadRotationRef.current, lerpFactor);
      
      // 应用旋转到头部骨骼（叠加到当前旋转，而不是替换）
      const currentQuat = headBoneRef.current.quaternion.clone();
      tmpEuler.set(
        headRotationRef.current.x,
        headRotationRef.current.y,
        headRotationRef.current.z
      );
      const targetQuat = new Quaternion().setFromEuler(tmpEuler);
      
      // 使用 slerp 平滑混合（叠加模式）
      currentQuat.slerp(targetQuat, lerpFactor * 0.3); // 减小权重，避免覆盖动画
      headBoneRef.current.quaternion.copy(currentQuat);
    }
    
    // ========== 3. 视线追踪 (LookAt) ==========
    if (lookAt && vrm.lookAt) {
      // 检测 LookAt 类型
      const lookAtType = (vrm.lookAt as any).type || 'bone';
      
      if (lookAtType === 'bone') {
        // VRoid 默认：使用 bone 类型，直接调用 lookAt
        // 获取相机位置
        camera.getWorldPosition(lookAtTargetRef.current);
        
        // 调用 VRM 的 lookAt 方法（会自动处理眼球骨骼）
        try {
          vrm.lookAt.lookAt(lookAtTargetRef.current);
        } catch (error) {
          // 如果 lookAt 方法不存在或出错，尝试使用表达式
          if (process.env.NODE_ENV === 'development') {
            console.warn('VRMController: lookAt.lookAt() 失败，尝试使用表达式', error);
          }
          
          // 降级方案：使用表达式驱动视线（如果可用）
          if (expressionAdapterRef.current) {
            // 计算视线方向
            const headWorldPos = new Vector3();
            if (headBoneRef.current) {
              headBoneRef.current.getWorldPosition(headWorldPos);
            } else {
              vrm.scene.getWorldPosition(headWorldPos);
            }
            
            const direction = lookAtTargetRef.current.clone().sub(headWorldPos).normalize();
            
            // 简单的视线表达式驱动（如果模型支持）
            // 注意：这需要模型有 lookUp/Down/Left/Right 表达式
            const lookUp = Math.max(0, direction.y * 0.5);
            const lookDown = Math.max(0, -direction.y * 0.5);
            const lookLeft = Math.max(0, -direction.x * 0.5);
            const lookRight = Math.max(0, direction.x * 0.5);
            
            expressionAdapterRef.current.setValue('lookUp', lookUp);
            expressionAdapterRef.current.setValue('lookDown', lookDown);
            expressionAdapterRef.current.setValue('lookLeft', lookLeft);
            expressionAdapterRef.current.setValue('lookRight', lookRight);
          }
        }
      } else {
        // 其他类型（expression）：使用表达式驱动
        if (expressionAdapterRef.current) {
          camera.getWorldPosition(lookAtTargetRef.current);
          
          const headWorldPos = new Vector3();
          if (headBoneRef.current) {
            headBoneRef.current.getWorldPosition(headWorldPos);
          } else {
            vrm.scene.getWorldPosition(headWorldPos);
          }
          
          const direction = lookAtTargetRef.current.clone().sub(headWorldPos).normalize();
          
          const lookUp = Math.max(0, direction.y * 0.5);
          const lookDown = Math.max(0, -direction.y * 0.5);
          const lookLeft = Math.max(0, -direction.x * 0.5);
          const lookRight = Math.max(0, direction.x * 0.5);
          
          expressionAdapterRef.current.setValue('lookUp', lookUp);
          expressionAdapterRef.current.setValue('lookDown', lookDown);
          expressionAdapterRef.current.setValue('lookLeft', lookLeft);
          expressionAdapterRef.current.setValue('lookRight', lookRight);
        }
      }
    }
    
    // ========== 4. 相机行为 ==========
    if (cameraFollow && vrm.scene) {
      // 计算角色头部或 Hips 偏移位置
      const targetPosition = new Vector3(0, 1.2, 0);
      
      // 如果头部骨骼存在，使用头部位置
      if (headBoneRef.current) {
        headBoneRef.current.getWorldPosition(targetPosition);
        targetPosition.y += 0.2; // 稍微向上偏移
      } else {
        // 否则使用场景根位置 + 偏移
        vrm.scene.getWorldPosition(targetPosition);
        targetPosition.y = 1.2;
      }
      
      // 更新相机目标位置
      cameraTargetRef.current.lerp(targetPosition, lerp(0, 1, deltaTime * 2));
      
      // 让相机看向目标位置
      camera.lookAt(cameraTargetRef.current);
    }
    
    // ========== 5. 更新头部位置（用于 Autofocus） ==========
    if (onHeadPositionUpdate) {
      const headWorldPos = new Vector3();
      if (headBoneRef.current) {
        headBoneRef.current.getWorldPosition(headWorldPos);
      } else if (vrm.scene) {
        vrm.scene.getWorldPosition(headWorldPos);
        headWorldPos.y = 1.2; // 默认头部高度
      }
      onHeadPositionUpdate(headWorldPos);
    }
    
    // 更新 VRM（必须在所有骨骼操作之后）
    vrm.update(deltaTime);
  });
  
  // 组件不渲染任何内容，只负责逻辑控制
  return null;
}

