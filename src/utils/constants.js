// MediaPipe 配置
export const MEDIAPIPE_CONFIG = {
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
  refineFaceLandmarks: true,
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
  
  // 右臂
  mixamorigRightShoulder: "rightShoulder",
  mixamorigRightArm: "rightUpperArm",
  mixamorigRightForeArm: "rightLowerArm",
  mixamorigRightHand: "rightHand",
  
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

// 动画配置
export const ANIMATION_CONFIG = {
  // 动画速度
  LERP_FACTOR: {
    expression: 12,
    bone: 5,
    eye: 5,
  },
  
  // 动画类型
  TYPES: ['None', 'Idle', 'Swing Dancing', 'Thriller Part 2'],
  
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