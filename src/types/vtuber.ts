// VTuber 相关类型定义
export interface VRMModel {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  category: string;
  description?: string;
  tags?: string[];
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