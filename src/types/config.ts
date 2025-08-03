// 配置类型定义
export interface ConfigCategory {
  value: any;
  min?: number;
  max?: number;
  step?: number;
  type: 'integer' | 'float' | 'boolean' | 'string';
  description: string;
  category: string;
}

export interface ConfigData {
  [category: string]: {
    [key: string]: ConfigCategory;
  };
}

export interface ConfigListener {
  category: string;
  key: string;
  callback: (value: any) => void;
}

export interface ConfigMetadata {
  category: string;
  key: string;
  metadata: ConfigCategory;
}

// 配置分类枚举
export const CONFIG_CATEGORIES = {
  MEDIAPIPE: 'mediapipe',
  CAMERA: 'camera',
  ANIMATION: 'animation',
  SENSITIVITY: 'sensitivity',
  SMOOTHING: 'smoothing',
  PERFORMANCE: 'performance',
  UI: 'ui',
  VRM: 'vrm'
} as const;

export type ConfigCategoryType = typeof CONFIG_CATEGORIES[keyof typeof CONFIG_CATEGORIES]; 