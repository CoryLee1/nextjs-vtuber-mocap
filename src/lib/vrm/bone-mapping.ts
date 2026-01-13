/**
 * VRM 骨骼名称映射表
 * 
 * 从 VRMAvatar.tsx 提取的骨骼名称映射常量
 * 用于将 Kalidokit 骨骼名称映射到 VRM 标准骨骼名称
 */

/**
 * Kalidokit 到 VRM 的骨骼名称映射表
 */
export const VRM_BONE_NAME_MAP = {
    // 躯干
    'Spine': 'spine',
    'Chest': 'chest',
    'Neck': 'neck',
    'Head': 'head',
    
    // 左臂 - 使用参考文件中的小写格式
    'LeftShoulder': 'leftShoulder',
    'LeftUpperArm': 'leftUpperArm',
    'LeftLowerArm': 'leftLowerArm',
    'LeftHand': 'leftHand',
    
    // 右臂 - 使用参考文件中的小写格式
    'RightShoulder': 'rightShoulder',
    'RightUpperArm': 'rightUpperArm',
    'RightLowerArm': 'rightLowerArm',
    'RightHand': 'rightHand',
    
    // 左腿
    'LeftUpperLeg': 'leftUpperLeg',
    'LeftLowerLeg': 'leftLowerLeg',
    'LeftFoot': 'leftFoot',
    
    // 右腿
    'RightUpperLeg': 'rightUpperLeg',
    'RightLowerLeg': 'rightLowerLeg',
    'RightFoot': 'rightFoot',
    
    // 左手手指
    'leftRingProximal': 'leftRingProximal',
    'leftRingIntermediate': 'leftRingIntermediate',
    'leftRingDistal': 'leftRingDistal',
    'leftIndexProximal': 'leftIndexProximal',
    'leftIndexIntermediate': 'leftIndexIntermediate',
    'leftIndexDistal': 'leftIndexDistal',
    'leftMiddleProximal': 'leftMiddleProximal',
    'leftMiddleIntermediate': 'leftMiddleIntermediate',
    'leftMiddleDistal': 'leftMiddleDistal',
    'leftThumbProximal': 'leftThumbProximal',
    'leftThumbMetacarpal': 'leftThumbMetacarpal',
    'leftThumbDistal': 'leftThumbDistal',
    'leftLittleProximal': 'leftLittleProximal',
    'leftLittleIntermediate': 'leftLittleIntermediate',
    'leftLittleDistal': 'leftLittleDistal',
    
    // 右手手指
    'rightRingProximal': 'rightRingProximal',
    'rightRingIntermediate': 'rightRingIntermediate',
    'rightRingDistal': 'rightRingDistal',
    'rightIndexProximal': 'rightIndexProximal',
    'rightIndexIntermediate': 'rightIndexIntermediate',
    'rightIndexDistal': 'rightIndexDistal',
    'rightMiddleProximal': 'rightMiddleProximal',
    'rightMiddleIntermediate': 'rightMiddleIntermediate',
    'rightMiddleDistal': 'rightMiddleDistal',
    'rightThumbProximal': 'rightThumbProximal',
    'rightThumbMetacarpal': 'rightThumbMetacarpal',
    'rightThumbDistal': 'rightThumbDistal',
    'rightLittleProximal': 'rightLittleProximal',
    'rightLittleIntermediate': 'rightLittleIntermediate',
    'rightLittleDistal': 'rightLittleDistal',
} as const;

/**
 * 将 Kalidokit 骨骼名称映射到 VRM 标准骨骼名称
 * 
 * @param kalidokitBoneName Kalidokit 骨骼名称
 * @returns VRM 标准骨骼名称，如果不存在映射则返回原名称
 */
export function mapBoneName(kalidokitBoneName: string): string {
    return (VRM_BONE_NAME_MAP as any)[kalidokitBoneName] || kalidokitBoneName;
}





