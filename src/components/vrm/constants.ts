/**
 * VRM Avatar 常量定义
 *
 * 包含所有预定义的骨骼名称映射和口型键名
 * PERF: 这些常量在组件外部定义，避免每帧创建新对象
 */

import { Vector3, Quaternion, Euler } from 'three';

// 临时变量（复用以避免 GC）
export const tmpVec3 = new Vector3();
export const tmpQuat = new Quaternion();
export const tmpEuler = new Euler();

// 口型键名映射
export const MOUTH_SHAPE_KEYS = ['A', 'I', 'E', 'O', 'U'] as const;
export const MOUTH_EXPRESSION_NAMES = ['aa', 'ih', 'ee', 'oh', 'ou'] as const;

// 左手手指骨骼名称映射
export const LEFT_FINGER_BONE_NAMES = [
  'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
  'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
  'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
  'leftThumbProximal', 'leftThumbMetacarpal', 'leftThumbDistal',
  'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal'
] as const;

// 左手 Kalidokit 数据键名映射
export const LEFT_FINGER_DATA_KEYS = [
  'LeftRingProximal', 'LeftRingIntermediate', 'LeftRingDistal',
  'LeftIndexProximal', 'LeftIndexIntermediate', 'LeftIndexDistal',
  'LeftMiddleProximal', 'LeftMiddleIntermediate', 'LeftMiddleDistal',
  'LeftThumbProximal', 'LeftThumbIntermediate', 'LeftThumbDistal',
  'LeftLittleProximal', 'LeftLittleIntermediate', 'LeftLittleDistal'
] as const;

// 右手手指骨骼名称映射
export const RIGHT_FINGER_BONE_NAMES = [
  'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
  'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
  'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
  'rightThumbProximal', 'rightThumbMetacarpal', 'rightThumbDistal',
  'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal'
] as const;

// 右手 Kalidokit 数据键名映射
export const RIGHT_FINGER_DATA_KEYS = [
  'RightRingProximal', 'RightRingIntermediate', 'RightRingDistal',
  'RightIndexProximal', 'RightIndexIntermediate', 'RightIndexDistal',
  'RightMiddleProximal', 'RightMiddleIntermediate', 'RightMiddleDistal',
  'RightThumbProximal', 'RightThumbIntermediate', 'RightThumbDistal',
  'RightLittleProximal', 'RightLittleIntermediate', 'RightLittleDistal'
] as const;

// 性能优化的批量更新函数
export const batchUpdateDebugInfo = (debugInfo: any, updates: any) => {
  Object.assign(debugInfo, updates);
};

// 错误处理函数
export const handleProcessingError = (error: any, processName: string, debugInfo: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`VRMAvatar: ${processName} 错误`, error.message);
  }
  debugInfo.errorCount++;
};
