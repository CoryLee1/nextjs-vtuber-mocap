// VTuber 相关类型定义
export interface VRMModel {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  category: string;
  description?: string;
  tags?: string[];
  size?: number; // 文件大小（字节）
  type?: string; // MIME类型
  createdAt?: string; // 创建时间
  /** 性别（供 VLM 打 tag、声音分配用） */
  gender?: 'male' | 'female' | 'nonbinary';
  /** 属性标签（如 anime, casual，供 VLM 打 tag 用） */
  attributes?: string[];
  /** 角色身份（如 student, idol, mage） */
  identity?: string;
  /** 二次元风格标签（英文 canonical keys） */
  styleTags?: string[];
  /** 推荐 TTS 音色（Qwen TTS 音色名，由 VLM 打 tag 生成） */
  suggestedVoice?: string;
  /** 推荐音色置信度（0~1） */
  voiceConfidence?: number;
  /** 标签体系版本 */
  taxonomyVersion?: number;
}

export interface Animation {
  id: string;
  name: string;
  url: string;
  type: 'idle' | 'dance' | 'gesture' | 'custom';
  duration?: number;
  thumbnail?: string;
  description?: string;
  tags?: string[];
  size?: number; // 文件大小（字节）
  mimeType?: string; // MIME类型
}

export interface MocapData {
  face: FaceData;
  pose: PoseData;
  hands: HandsData;
  timestamp: number;
}

export interface FaceData {
  landmarks: number[][];
  rotation: [number, number, number];
  translation: [number, number, number];
  eyeBlink: {
    left: number;
    right: number;
  };
  mouthOpen: number;
  mouthSmile: number;
}

export interface PoseData {
  landmarks: number[][];
  rotation: [number, number, number];
  translation: [number, number, number];
  confidence: number;
}

export interface HandsData {
  left: HandData | null;
  right: HandData | null;
}

export interface HandData {
  landmarks: number[][];
  rotation: [number, number, number];
  translation: [number, number, number];
  confidence: number;
  gestures: string[];
}

export interface VTuberState {
  selectedModel: VRMModel | null;
  selectedAnimation: Animation | null;
  isCameraActive: boolean;
  isProcessing: boolean;
  mocapData: MocapData | null;
  error: string | null;
  showBones: boolean;
  showDebug: boolean;
}

export interface CameraSettings {
  width: number;
  height: number;
  fps: number;
  enableAutoTrack: boolean;
  enableUserControl: boolean;
  showHint: boolean;
  useGameStyle: boolean;
}

export interface SensitivitySettings {
  face: number;
  pose: number;
  hands: number;
  smoothing: number;
}

export interface AnimationState {
  current: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  loop: boolean;
} 