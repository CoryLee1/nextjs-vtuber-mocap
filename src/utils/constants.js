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
    'Idle': '/models/animations/Idle.fbx',
    'Breakdance 1990': '/models/animations/Breakdance 1990.fbx',
    'Mma Kick': '/models/animations/Mma Kick.fbx',
    'Breakdance Uprock Var 2': '/models/animations/Breakdance Uprock Var 2.fbx',
    'Twist Dance': '/models/animations/Twist Dance.fbx',
    'Sitting Laughing': '/models/animations/Sitting Laughing.fbx',
    'Taunt': '/models/animations/Taunt.fbx',
    'Capoeira': '/models/animations/Capoeira.fbx'
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