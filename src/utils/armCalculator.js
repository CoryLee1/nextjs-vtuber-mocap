import { Vector3, Euler, Quaternion } from 'three';

// 常量定义
const PI = Math.PI;
const RIGHT = "Right";
const LEFT = "Left";

// 工具函数
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, factor) => start + (end - start) * factor;

// 人体运动学约束 - 基于官方代码
const HUMAN_LIMITS = {
    // 上臂约束
    upperArm: {
        x: { min: -0.5, max: PI },      // 前后摆动
        y: { min: -PI/2, max: PI/2 },   // 左右摆动  
        z: { min: -PI/2, max: PI/2 }    // 旋转
    },
    // 下臂约束
    lowerArm: {
        x: { min: -0.3, max: 0.3 },     // 肘部弯曲
        y: { min: -PI/2, max: PI/2 },   // 左右摆动
        z: { min: -2.14, max: 0 }       // 肘部旋转
    },
    // 手部约束
    hand: {
        x: { min: -0.3, max: 0.3 },     // 手腕扭转
        y: { min: -1.2, max: 1.6 },     // 手腕弯曲
        z: { min: -PI/2, max: PI/2 }    // 手腕旋转
    }
};

// 计算两点之间的旋转
const findRotation = (start, end) => {
    const direction = new Vector3().subVectors(end, start).normalize();
    const euler = new Euler();
    euler.setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction));
    return {
        x: euler.x,
        y: euler.y,
        z: euler.z
    };
};

// 应用人体运动学约束
const applyHumanConstraints = (rotation, boneType, side) => {
    const invert = side === RIGHT ? 1 : -1;
    const limits = HUMAN_LIMITS[boneType];
    
    if (!limits) return rotation;
    
    // 应用坐标系统修正和人体约束
    let constrainedRotation = { ...rotation };
    
    switch (boneType) {
        case 'upperArm':
            // 上臂约束 - 基于官方 calcArms.ts
            constrainedRotation.x = clamp(rotation.x * -2.3 * invert, limits.x.min, limits.x.max);
            constrainedRotation.y = clamp(rotation.y * PI * invert, limits.y.min, limits.y.max);
            constrainedRotation.z = clamp(rotation.z * -2.3 * invert, limits.z.min, limits.z.max);
            break;
            
        case 'lowerArm':
            // 下臂约束 - 限制肘部弯曲
            constrainedRotation.x = clamp(rotation.x * 2.14 * invert, limits.x.min, limits.x.max);
            constrainedRotation.y = clamp(rotation.y * 2.14 * invert, limits.y.min, limits.y.min);
            constrainedRotation.z = clamp(rotation.z * -2.14 * invert, limits.z.min, limits.z.max);
            break;
            
        case 'hand':
            // 手部约束 - 基于官方 HandSolver
            constrainedRotation.x = clamp(rotation.x * 2 * invert, limits.x.min, limits.x.max);
            constrainedRotation.y = clamp(rotation.y * 2.3, limits.y.min, limits.y.max);
            constrainedRotation.z = clamp(rotation.z * -2.3 * invert, limits.z.min, limits.z.max);
            break;
    }
    
    return constrainedRotation;
};

// 手臂计算主函数 - 基于官方 calcArms.ts
export const calculateArms = (poseLandmarks) => {
    if (!poseLandmarks || poseLandmarks.length < 33) {
        return null;
    }

    // 提取关键点
    const landmarks = poseLandmarks.map(lm => new Vector3(lm.x, lm.y, lm.z));
    
    // 肩膀和肘部关键点
    const leftShoulder = landmarks[11];  // 左肩
    const rightShoulder = landmarks[12]; // 右肩
    const leftElbow = landmarks[13];     // 左肘
    const rightElbow = landmarks[14];    // 右肘
    const leftWrist = landmarks[15];     // 左手腕
    const rightWrist = landmarks[16];    // 右手腕

    // 计算上臂旋转
    const leftUpperArm = findRotation(leftShoulder, leftElbow);
    const rightUpperArm = findRotation(rightShoulder, rightElbow);
    
    // 计算下臂旋转
    const leftLowerArm = findRotation(leftElbow, leftWrist);
    const rightLowerArm = findRotation(rightElbow, rightWrist);

    // 应用人体运动学约束
    const constrainedArms = {
        leftUpperArm: applyHumanConstraints(leftUpperArm, 'upperArm', LEFT),
        rightUpperArm: applyHumanConstraints(rightUpperArm, 'upperArm', RIGHT),
        leftLowerArm: applyHumanConstraints(leftLowerArm, 'lowerArm', LEFT),
        rightLowerArm: applyHumanConstraints(rightLowerArm, 'lowerArm', RIGHT)
    };

    return constrainedArms;
};

// 手部跟随手臂的IK系统 - 基于官方 HandSolver
export const calculateHandIK = (poseLandmarks, handLandmarks, side) => {
    if (!poseLandmarks || !handLandmarks) return null;

    const landmarks = poseLandmarks.map(lm => new Vector3(lm.x, lm.y, lm.z));
    const handPoints = handLandmarks.map(lm => new Vector3(lm.x, lm.y, lm.z));

    // 获取手臂关键点
    const shoulder = side === LEFT ? landmarks[11] : landmarks[12];
    const elbow = side === LEFT ? landmarks[13] : landmarks[14];
    const wrist = side === LEFT ? landmarks[15] : landmarks[16];

    // 计算手部位置相对于手腕的偏移
    const palmCenter = handPoints[0]; // 手掌中心
    const wristOffset = new Vector3().subVectors(palmCenter, wrist);

    // 应用IK约束 - 手部跟随手腕，但保持自然的手部姿态
    const rawHandRotation = {
        x: wristOffset.x * 2 * (side === LEFT ? -1 : 1),
        y: wristOffset.y * 2.3,
        z: wristOffset.z * -2.3 * (side === LEFT ? -1 : 1)
    };

    const handRotation = applyHumanConstraints(rawHandRotation, 'hand', side);

    return {
        wrist: handRotation,
        fingers: calculateFingerRotations(handPoints, side)
    };
};

// 计算手指旋转 - 基于官方 HandSolver
const calculateFingerRotations = (handPoints, side) => {
    const fingers = {};
    const invert = side === LEFT ? -1 : 1;

    // 计算手掌法向量
    const palmNormal = new Vector3();
    const thumb = handPoints[1];
    const index = handPoints[5];
    const pinky = handPoints[17];
    
    const v1 = new Vector3().subVectors(index, thumb);
    const v2 = new Vector3().subVectors(pinky, thumb);
    palmNormal.crossVectors(v1, v2).normalize();

    // 基础手指旋转 - 应用人体约束
    const baseRotation = applyHumanConstraints({
        x: palmNormal.x * invert,
        y: palmNormal.y,
        z: palmNormal.z * invert
    }, 'hand', side);

    // 为每个手指关节应用基础旋转
    const fingerNames = ['thumb', 'index', 'middle', 'ring', 'little'];
    fingerNames.forEach(finger => {
        fingers[finger] = {
            proximal: { ...baseRotation },
            intermediate: { ...baseRotation },
            distal: { ...baseRotation }
        };
    });

    return fingers;
};

// 平滑插值函数
export const smoothArmRotation = (current, target, factor = 0.1) => {
    return {
        x: lerp(current.x, target.x, factor),
        y: lerp(current.y, target.y, factor),
        z: lerp(current.z, target.z, factor)
    };
};

// 检测手臂是否在视野内
export const isArmVisible = (poseLandmarks, side) => {
    if (!poseLandmarks) return false;
    
    const wristIndex = side === LEFT ? 15 : 16;
    const wrist = poseLandmarks[wristIndex];
    
    // 检查手腕是否在合理范围内
    return wrist.y < 0.9 && wrist.visibility > 0.3;
};

// 验证旋转是否在人体范围内
export const validateHumanRotation = (rotation, boneType) => {
    const limits = HUMAN_LIMITS[boneType];
    if (!limits) return true;
    
    return (
        rotation.x >= limits.x.min && rotation.x <= limits.x.max &&
        rotation.y >= limits.y.min && rotation.y <= limits.y.max &&
        rotation.z >= limits.z.min && rotation.z <= limits.z.max
    );
}; 