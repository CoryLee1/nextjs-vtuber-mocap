// MediaPipe 配置
export const MEDIAPIPE_CONFIG = {
  modelComplexity: 1, // 保持完整模型
  smoothLandmarks: true,
  minDetectionConfidence: 0.7, // 标准阈值
  minTrackingConfidence: 0.7, // 标准阈值
  refineFaceLandmarks: true, // 启用精细面部关键点
  // 移除额外的hand检测设置，使用标准设置
  // minHandDetectionConfidence: 0.7,
  // minHandTrackingConfidence: 0.7,
  // 移除分割设置以提高性能
  // enableSegmentation: false,
  // smoothSegmentation: false,
};

// 摄像头配置
export const CAMERA_CONFIG = {
  width: 640,
  height: 480,
  facingMode: 'user', // 前置摄像头
};

// VRM 表情映射
export const VRM_EXPRESSIONS = {
  // 口型
  MOUTH_SHAPES: ['aa', 'ih', 'ee', 'oh', 'ou'],
  
  // 眼部控制
  EYE_CONTROLS: ['blinkLeft', 'blinkRight'],
  
  // 情绪表情
  EMOTIONS: ['happy', 'sad', 'angry', 'surprised', 'relaxed'],
  
  // 眉毛
  EYEBROWS: ['browUp', 'browDown'],
};

// 骨骼映射
export const BONE_MAPPING = {
  // 面部
  FACE: ['neck', 'head'],
  
  // 上半身
  UPPER_BODY: ['chest', 'spine', 'hips'],
  
  // 手臂
  ARMS: [
    'leftUpperArm', 'leftLowerArm', 
    'rightUpperArm', 'rightLowerArm'
  ],
  
  // 手部
  HANDS: ['leftHand', 'rightHand'],
  
  // 腿部
  LEGS: [
    'leftUpperLeg', 'leftLowerLeg', 
    'rightUpperLeg', 'rightLowerLeg'
  ],
};

/** VRM Humanoid 骨骼名（权威列表，用于重定向校验与 per-bone 修正表键名参考） */
export const VRM_HUMANOID_BONE_NAMES = [
  'hips',
  'spine',
  'chest',
  'upperChest',
  'neck',
  'head',
  'leftEye',
  'rightEye',
  'leftUpperLeg',
  'leftLowerLeg',
  'leftFoot',
  'leftToes',
  'rightUpperLeg',
  'rightLowerLeg',
  'rightFoot',
  'rightToes',
  'leftShoulder',
  'leftUpperArm',
  'leftLowerArm',
  'leftHand',
  'rightShoulder',
  'rightUpperArm',
  'rightLowerArm',
  'rightHand',
  'leftThumbMetacarpal',
  'leftThumbProximal',
  'leftThumbDistal',
  'leftIndexProximal',
  'leftIndexIntermediate',
  'leftIndexDistal',
  'leftMiddleProximal',
  'leftMiddleIntermediate',
  'leftMiddleDistal',
  'leftRingProximal',
  'leftRingIntermediate',
  'leftRingDistal',
  'leftLittleProximal',
  'leftLittleIntermediate',
  'leftLittleDistal',
  'rightThumbMetacarpal',
  'rightThumbProximal',
  'rightThumbDistal',
  'rightIndexProximal',
  'rightIndexIntermediate',
  'rightIndexDistal',
  'rightMiddleProximal',
  'rightMiddleIntermediate',
  'rightMiddleDistal',
  'rightRingProximal',
  'rightRingIntermediate',
  'rightRingDistal',
  'rightLittleProximal',
  'rightLittleIntermediate',
  'rightLittleDistal',
] as const;

// Mixamo 到 VRM 的骨骼映射
export const MIXAMO_VRM_RIG_MAP = {
  mixamorigHips: "hips",
  mixamorigSpine: "spine",
  mixamorigSpine1: "chest",
  mixamorigSpine2: "upperChest",
  mixamorigNeck: "neck",
  mixamorigHead: "head",
  
  // 左臂
  mixamorigLeftShoulder: "leftShoulder",
  mixamorigLeftArm: "leftUpperArm",
  mixamorigLeftForeArm: "leftLowerArm",
  mixamorigLeftHand: "leftHand",
  // 左手手指（Mixamo LeftHandThumb1/2/3 等 → VRM）
  mixamorigLeftHandThumb1: "leftThumbMetacarpal",
  mixamorigLeftHandThumb2: "leftThumbProximal",
  mixamorigLeftHandThumb3: "leftThumbDistal",
  mixamorigLeftHandIndex1: "leftIndexProximal",
  mixamorigLeftHandIndex2: "leftIndexIntermediate",
  mixamorigLeftHandIndex3: "leftIndexDistal",
  mixamorigLeftHandMiddle1: "leftMiddleProximal",
  mixamorigLeftHandMiddle2: "leftMiddleIntermediate",
  mixamorigLeftHandMiddle3: "leftMiddleDistal",
  mixamorigLeftHandRing1: "leftRingProximal",
  mixamorigLeftHandRing2: "leftRingIntermediate",
  mixamorigLeftHandRing3: "leftRingDistal",
  mixamorigLeftHandPinky1: "leftLittleProximal",
  mixamorigLeftHandPinky2: "leftLittleIntermediate",
  mixamorigLeftHandPinky3: "leftLittleDistal",

  // 右臂
  mixamorigRightShoulder: "rightShoulder",
  mixamorigRightArm: "rightUpperArm",
  mixamorigRightForeArm: "rightLowerArm",
  mixamorigRightHand: "rightHand",
  // 右手手指
  mixamorigRightHandPinky1: "rightLittleProximal",
  mixamorigRightHandPinky2: "rightLittleIntermediate",
  mixamorigRightHandPinky3: "rightLittleDistal",
  mixamorigRightHandRing1: "rightRingProximal",
  mixamorigRightHandRing2: "rightRingIntermediate",
  mixamorigRightHandRing3: "rightRingDistal",
  mixamorigRightHandMiddle1: "rightMiddleProximal",
  mixamorigRightHandMiddle2: "rightMiddleIntermediate",
  mixamorigRightHandMiddle3: "rightMiddleDistal",
  mixamorigRightHandIndex1: "rightIndexProximal",
  mixamorigRightHandIndex2: "rightIndexIntermediate",
  mixamorigRightHandIndex3: "rightIndexDistal",
  mixamorigRightHandThumb1: "rightThumbMetacarpal",
  mixamorigRightHandThumb2: "rightThumbProximal",
  mixamorigRightHandThumb3: "rightThumbDistal",

  // 左腿
  mixamorigLeftUpLeg: "leftUpperLeg",
  mixamorigLeftLeg: "leftLowerLeg",
  mixamorigLeftFoot: "leftFoot",
  mixamorigLeftToeBase: "leftToes",
  
  // 右腿
  mixamorigRightUpLeg: "rightUpperLeg",
  mixamorigRightLeg: "rightLowerLeg",
  mixamorigRightFoot: "rightFoot",
  mixamorigRightToeBase: "rightToes",
};

// KAWAII（Unity/Unreal 风格）到 VRM 的骨骼映射
// 来源：public/models/animations/kawaii-test 下 FBX 的 track 名（如 @KA_Idle51_StandingTalk1_2.FBX）
export const KAWAII_VRM_RIG_MAP: Record<string, string> = {
  Hips: "hips",
  Spine: "spine",
  Chest: "chest",
  Upper_Chest: "upperChest",
  Neck: "neck",
  Head: "head",
  Shoulder_L: "leftShoulder",
  Upper_Arm_L: "leftUpperArm",
  Lower_Arm_L: "leftLowerArm",
  Hand_L: "leftHand",
  Shoulder_R: "rightShoulder",
  Upper_Arm_R: "rightUpperArm",
  Lower_Arm_R: "rightLowerArm",
  Hand_R: "rightHand",
  Upper_Leg_L: "leftUpperLeg",
  Lower_Leg_L: "leftLowerLeg",
  Foot_L: "leftFoot",
  Toes_L: "leftToes",
  Upper_Leg_R: "rightUpperLeg",
  Lower_Leg_R: "rightLowerLeg",
  Foot_R: "rightFoot",
  Toes_R: "rightToes",
  // 手指：KAWAII 无 Thumb Metacarpal 命名，Thumb_Proximal 对应 VRM 第一拇指骨
  Thumb_Proximal_L: "leftThumbMetacarpal",
  Thumb_Intermediate_L: "leftThumbProximal",
  Thumb_Distal_L: "leftThumbDistal",
  Index_Proximal_L: "leftIndexProximal",
  Index_Intermediate_L: "leftIndexIntermediate",
  Index_Distal_L: "leftIndexDistal",
  Middle_Proximal_L: "leftMiddleProximal",
  Middle_Intermediate_L: "leftMiddleIntermediate",
  Middle_Distal_L: "leftMiddleDistal",
  Ring_Proximal_L: "leftRingProximal",
  Ring_Intermediate_L: "leftRingIntermediate",
  Ring_Distal_L: "leftRingDistal",
  Little_Proximal_L: "leftLittleProximal",
  Little_Intermediate_L: "leftLittleIntermediate",
  Little_Distal_L: "leftLittleDistal",
  Thumb_Proximal_R: "rightThumbMetacarpal",
  Thumb_Intermediate_R: "rightThumbProximal",
  Thumb_Distal_R: "rightThumbDistal",
  Index_Proximal_R: "rightIndexProximal",
  Index_Intermediate_R: "rightIndexIntermediate",
  Index_Distal_R: "rightIndexDistal",
  Middle_Proximal_R: "rightMiddleProximal",
  Middle_Intermediate_R: "rightMiddleIntermediate",
  Middle_Distal_R: "rightMiddleDistal",
  Ring_Proximal_R: "rightRingProximal",
  Ring_Intermediate_R: "rightRingIntermediate",
  Ring_Distal_R: "rightRingDistal",
  Little_Proximal_R: "rightLittleProximal",
  Little_Intermediate_R: "rightLittleIntermediate",
  Little_Distal_R: "rightLittleDistal",
};

/**
 * KAWAII 重定向后 per-bone 四元数符号修正（可选）。
 * 键：VRM 骨骼名（如 leftUpperArm）；值：[sx, sy, sz, sw]，与四元数 xyzw 逐分量相乘。
 * 可从 Blender 导出 rest/第一帧与当前 log 对比后填入，用于修正仍扭曲的骨骼。
 * 例：左臂需 x,z 取反则填 [-1, 1, -1, 1]。
 */
/** KAWAII 四元数 per-bone 符号修正 [x,y,z,w]。仅当场景为 Z-up 时生效；肩部也需修正否则臂链方向错 */
export const KAWAII_QUAT_SIGN_FLIPS: Record<string, [number, number, number, number]> = {
  leftShoulder: [-1, 1, -1, 1],
  leftUpperArm: [-1, 1, -1, 1],
  leftLowerArm: [-1, 1, -1, 1],
  leftHand: [-1, 1, -1, 1],
  rightShoulder: [1, -1, 1, 1],
  rightUpperArm: [1, -1, 1, 1],
  rightLowerArm: [1, -1, 1, 1],
  rightHand: [1, -1, 1, 1],
  leftUpperLeg: [-1, -1, 1, 1],
  rightUpperLeg: [-1, -1, -1, 1],
};

/**
 * KAWAII 在 Y-up 场景（如 Unreal Take，isZUp=false）下的 per-bone 符号修正。
 * 手臂若看起来拧转而非抬起，可对 y 取反（内旋变外旋）。
 */
export const KAWAII_YUP_QUAT_SIGN_FLIPS: Record<string, [number, number, number, number]> = {};

/** KAWAII Y-up：需做 +X90° 共轭 (R*q*R^-1) 的骨骼，将 FBX 的 Z 轴膝盖弯曲转为 VRM 的 Y 轴旋转 */
export const KAWAII_YUP_LOWERLEG_BONES: readonly string[] = ['leftLowerLeg', 'rightLowerLeg'];

// 动画配置
export const ANIMATION_CONFIG = {
  // 动画速度 - 这些值控制动画的平滑度
  LERP_FACTOR: {
    expression: 12,  // 表情动画阻尼 (0-20)
    bone: 4,         // 骨骼动画阻尼 (0-10) - 从 8 降低到 4，减少抖动
    eye: 5,          // 眼球动画阻尼 (0-10)
  },
  
  // 平滑设置 - 新增阻尼值配置
  SMOOTHING: {
    neckDamping: 0.9,    // 脖子阻尼 (0.1-1.0)
    armDamping: 0.5,    // 手臂阻尼 (0.1-1.0)
    handDamping: 0.95,    // 手部阻尼 (0.1-1.0)
    fingerDamping: 0.9,  // 手指阻尼 (0.1-1.0)
  },
  
  // 动画类型 - 更新为实际的动画文件
  TYPES: [
    'None', 
    'Idle', 
    'Breakdance 1990',
    'Mma Kick',
    'Breakdance Uprock Var 2',
    'Twist Dance',
    'Sitting Laughing',
    'Taunt',
    'Capoeira'
  ],
  
  // 动画文件路径映射
  ANIMATION_FILES: {
    'Idle': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Idle.fbx',
    'Breakdance 1990': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Breakdance%201990.fbx',
    'Mma Kick': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Mma%20Kick.fbx',
    'Breakdance Uprock Var 2': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Breakdance%20Uprock%20Var%202.fbx',
    'Twist Dance': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Twist%20Dance.fbx',
    'Sitting Laughing': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Sitting%20Laughing.fbx',
    'Taunt': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Taunt.fbx',
    'Capoeira': 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/animations/Capoeira.fbx'
  },
  
  // 动画分类
  CATEGORIES: {
    'idle': ['Idle'],
    'dance': ['Breakdance 1990', 'Breakdance Uprock Var 2', 'Twist Dance'],
    'combat': ['Mma Kick', 'Capoeira'],
    'emotion': ['Sitting Laughing', 'Taunt']
  },
  
  // 默认动画
  DEFAULT: 'Idle',
};

// UI 配置
export const UI_CONFIG = {
  // 控制面板位置
  PANEL_POSITION: {
    top: 4,
    right: 4,
  },
  
  // 摄像头窗口大小
  CAMERA_WINDOW: {
    width: 320,
    height: 240,
  },
  
  // 主题色彩
  THEME: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#06b6d4',
    light: '#f8fafc',
    dark: '#0f172a',
  },
};

// 性能配置
export const PERFORMANCE_CONFIG = {
  // 目标帧率
  TARGET_FPS: 60,
  
  // 渲染质量
  RENDER_QUALITY: {
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  },
  
  // Three.js 优化
  THREE_OPTIMIZATION: {
    shadowMapEnabled: true,
    shadowMapType: 'PCFSoftShadowMap',
    toneMapping: 'ACESFilmicToneMapping',
    toneMappingExposure: 1,
  },
};