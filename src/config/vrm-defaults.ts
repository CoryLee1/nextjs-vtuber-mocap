/**
 * VRM 模型默认配置
 * 
 * 包含默认的坐标轴设置，用于动捕数据到 VRM 骨骼旋转的映射
 * 这些值应该通过调试面板进行动态调整，这里只提供默认值
 */

/**
 * 默认坐标轴设置
 * 用于将动捕数据映射到 VRM 骨骼旋转
 */
export const DEFAULT_AXIS_SETTINGS = {
    leftArm: { x: 1, y: 1, z: 1 },
    rightArm: { x: -1, y: 1, z: 1 },
    leftHand: { x: 1, y: 1, z: -1 },
    rightHand: { x: -1, y: 1, z: -1 },
    neck: { x: -1, y: 1, z: -1 }
} as const;

/**
 * 默认手指坐标轴设置
 */
export const DEFAULT_FINGER_AXIS_SETTINGS = {
    x: -1,
    y: -1,
    z: 1
} as const;





