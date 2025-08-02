// VTuber 配置管理系统
// 统一管理所有数值配置，便于后续扩展和维护

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
};

// 主配置数据表
export const CONFIG_DATA_TABLE = {
  // MediaPipe 检测配置
  [CONFIG_CATEGORIES.MEDIAPIPE]: {
    modelComplexity: {
      value: 1,
      min: 0,
      max: 2,
      step: 1,
      type: 'integer',
      description: '模型复杂度 (0=轻量, 1=标准, 2=精细)',
      category: 'detection'
    },
    smoothLandmarks: {
      value: true,
      type: 'boolean',
      description: '平滑关键点',
      category: 'quality'
    },
    minDetectionConfidence: {
      value: 0.3,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      type: 'float',
      description: '最小检测置信度',
      category: 'detection'
    },
    minTrackingConfidence: {
      value: 0.3,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      type: 'float',
      description: '最小跟踪置信度',
      category: 'detection'
    },
    minHandDetectionConfidence: {
      value: 0.3,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      type: 'float',
      description: '手部检测置信度',
      category: 'detection'
    },
    minHandTrackingConfidence: {
      value: 0.3,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      type: 'float',
      description: '手部跟踪置信度',
      category: 'detection'
    },
    refineFaceLandmarks: {
      value: true,
      type: 'boolean',
      description: '精细面部关键点',
      category: 'quality'
    },
    enableSegmentation: {
      value: false,
      type: 'boolean',
      description: '启用分割',
      category: 'performance'
    },
    maxNumHands: {
      value: 2,
      min: 1,
      max: 4,
      step: 1,
      type: 'integer',
      description: '最大手部数量',
      category: 'detection'
    }
  },

  // 摄像头配置
  [CONFIG_CATEGORIES.CAMERA]: {
    width: {
      value: 640,
      min: 320,
      max: 1920,
      step: 160,
      type: 'integer',
      description: '摄像头宽度',
      category: 'resolution'
    },
    height: {
      value: 480,
      min: 240,
      max: 1080,
      step: 120,
      type: 'integer',
      description: '摄像头高度',
      category: 'resolution'
    },
    facingMode: {
      value: 'user',
      type: 'select',
      options: ['user', 'environment'],
      description: '摄像头方向',
      category: 'device'
    },
    frameRate: {
      value: 30,
      min: 15,
      max: 60,
      step: 5,
      type: 'integer',
      description: '目标帧率',
      category: 'performance'
    }
  },

  // 动画配置
  [CONFIG_CATEGORIES.ANIMATION]: {
    expressionLerpFactor: {
      value: 12,
      min: 1,
      max: 20,
      step: 1,
      type: 'integer',
      description: '表情动画阻尼',
      category: 'smoothing'
    },
    boneLerpFactor: {
      value: 4,
      min: 1,
      max: 10,
      step: 1,
      type: 'integer',
      description: '骨骼动画阻尼',
      category: 'smoothing'
    },
    eyeLerpFactor: {
      value: 5,
      min: 1,
      max: 10,
      step: 1,
      type: 'integer',
      description: '眼球动画阻尼',
      category: 'smoothing'
    },
    defaultAnimation: {
      value: 'Idle',
      type: 'select',
      options: ['None', 'Idle', 'Breakdance 1990', 'Mma Kick', 'Twist Dance'],
      description: '默认动画',
      category: 'playback'
    }
  },

  // 灵敏度配置
  [CONFIG_CATEGORIES.SENSITIVITY]: {
    armAmplitude: {
      value: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      type: 'float',
      description: '手臂幅度',
      category: 'response'
    },
    armSpeed: {
      value: 0.6,
      min: 0.1,
      max: 2.0,
      step: 0.1,
      type: 'float',
      description: '手臂速度',
      category: 'response'
    },
    handAmplitude: {
      value: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      type: 'float',
      description: '手部幅度',
      category: 'response'
    },
    handSpeed: {
      value: 0.8,
      min: 0.1,
      max: 2.0,
      step: 0.1,
      type: 'float',
      description: '手部速度',
      category: 'response'
    },
    fingerAmplitude: {
      value: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      type: 'float',
      description: '手指幅度',
      category: 'response'
    },
    fingerSpeed: {
      value: 0.8,
      min: 0.1,
      max: 2.0,
      step: 0.1,
      type: 'float',
      description: '手指速度',
      category: 'response'
    },
    neckAmplitude: {
      value: 1.0,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      type: 'float',
      description: '颈部幅度',
      category: 'response'
    },
    neckSpeed: {
      value: 0.7,
      min: 0.1,
      max: 2.0,
      step: 0.1,
      type: 'float',
      description: '颈部速度',
      category: 'response'
    }
  },

  // 平滑配置
  [CONFIG_CATEGORIES.SMOOTHING]: {
    neckDamping: {
      value: 0.9,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      type: 'float',
      description: '脖子阻尼',
      category: 'smoothing'
    },
    armDamping: {
      value: 0.5,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      type: 'float',
      description: '手臂阻尼',
      category: 'smoothing'
    },
    handDamping: {
      value: 0.95,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      type: 'float',
      description: '手部阻尼',
      category: 'smoothing'
    },
    fingerDamping: {
      value: 0.9,
      min: 0.01,
      max: 1.0,
      step: 0.01,
      type: 'float',
      description: '手指阻尼',
      category: 'smoothing'
    }
  },

  // 性能配置
  [CONFIG_CATEGORIES.PERFORMANCE]: {
    targetFPS: {
      value: 60,
      min: 30,
      max: 120,
      step: 10,
      type: 'integer',
      description: '目标帧率',
      category: 'rendering'
    },
    antialias: {
      value: true,
      type: 'boolean',
      description: '抗锯齿',
      category: 'quality'
    },
    shadowMapEnabled: {
      value: true,
      type: 'boolean',
      description: '阴影映射',
      category: 'quality'
    },
    toneMapping: {
      value: 'ACESFilmicToneMapping',
      type: 'select',
      options: ['NoToneMapping', 'LinearToneMapping', 'ReinhardToneMapping', 'CineonToneMapping', 'ACESFilmicToneMapping'],
      description: '色调映射',
      category: 'quality'
    }
  },

  // UI 配置
  [CONFIG_CATEGORIES.UI]: {
    panelPosition: {
      value: { top: 4, right: 4 },
      type: 'object',
      description: '面板位置',
      category: 'layout'
    },
    cameraWindowSize: {
      value: { width: 320, height: 240 },
      type: 'object',
      description: '摄像头窗口大小',
      category: 'layout'
    },
    theme: {
      value: 'dark',
      type: 'select',
      options: ['light', 'dark', 'auto'],
      description: '主题',
      category: 'appearance'
    },
    showDebugInfo: {
      value: false,
      type: 'boolean',
      description: '显示调试信息',
      category: 'development'
    }
  },

  // VRM 配置
  [CONFIG_CATEGORIES.VRM]: {
    modelScale: {
      value: 1.0,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      type: 'float',
      description: '模型缩放',
      category: 'display'
    },
    enableBoneVisualization: {
      value: false,
      type: 'boolean',
      description: '启用骨骼可视化',
      category: 'debug'
    },
    enableArmAxes: {
      value: false,
      type: 'boolean',
      description: '启用手臂坐标轴',
      category: 'debug'
    },
    expressionSmoothing: {
      value: 0.8,
      min: 0.1,
      max: 1.0,
      step: 0.05,
      type: 'float',
      description: '表情平滑度',
      category: 'animation'
    }
  }
};

// 配置管理器类
export class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.listeners = new Map();
  }

  // 加载配置
  loadConfig() {
    const savedConfig = localStorage.getItem('vtuber-config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        console.warn('Failed to parse saved config:', error);
      }
    }
    return this.getDefaultConfig();
  }

  // 获取默认配置
  getDefaultConfig() {
    const defaultConfig = {};
    Object.keys(CONFIG_DATA_TABLE).forEach(category => {
      defaultConfig[category] = {};
      Object.keys(CONFIG_DATA_TABLE[category]).forEach(key => {
        defaultConfig[category][key] = CONFIG_DATA_TABLE[category][key].value;
      });
    });
    return defaultConfig;
  }

  // 保存配置
  saveConfig() {
    localStorage.setItem('vtuber-config', JSON.stringify(this.config));
  }

  // 获取配置值
  getValue(category, key) {
    return this.config[category]?.[key] ?? CONFIG_DATA_TABLE[category]?.[key]?.value;
  }

  // 设置配置值
  setValue(category, key, value) {
    if (!this.config[category]) {
      this.config[category] = {};
    }
    this.config[category][key] = value;
    this.saveConfig();
    this.notifyListeners(category, key, value);
  }

  // 获取分类配置
  getCategoryConfig(category) {
    return this.config[category] || {};
  }

  // 重置分类配置
  resetCategory(category) {
    const defaultConfig = {};
    Object.keys(CONFIG_DATA_TABLE[category]).forEach(key => {
      defaultConfig[key] = CONFIG_DATA_TABLE[category][key].value;
    });
    this.config[category] = defaultConfig;
    this.saveConfig();
    this.notifyListeners(category, null, null);
  }

  // 重置所有配置
  resetAll() {
    this.config = this.getDefaultConfig();
    this.saveConfig();
    this.notifyListeners(null, null, null);
  }

  // 导出配置
  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  // 导入配置
  importConfig(configString) {
    try {
      const importedConfig = JSON.parse(configString);
      this.config = { ...this.getDefaultConfig(), ...importedConfig };
      this.saveConfig();
      this.notifyListeners(null, null, null);
      return true;
    } catch (error) {
      console.error('Failed to import config:', error);
      return false;
    }
  }

  // 监听器管理
  addListener(category, key, callback) {
    const listenerKey = `${category}:${key}`;
    if (!this.listeners.has(listenerKey)) {
      this.listeners.set(listenerKey, []);
    }
    this.listeners.get(listenerKey).push(callback);
  }

  removeListener(category, key, callback) {
    const listenerKey = `${category}:${key}`;
    const listeners = this.listeners.get(listenerKey);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  notifyListeners(category, key, value) {
    if (category && key) {
      const listenerKey = `${category}:${key}`;
      const listeners = this.listeners.get(listenerKey);
      if (listeners) {
        listeners.forEach(callback => callback(value));
      }
    } else {
      // 通知所有监听器
      this.listeners.forEach((listeners, listenerKey) => {
        listeners.forEach(callback => callback());
      });
    }
  }

  // 获取配置元数据
  getConfigMetadata(category, key) {
    return CONFIG_DATA_TABLE[category]?.[key];
  }

  // 获取分类元数据
  getCategoryMetadata(category) {
    return CONFIG_DATA_TABLE[category];
  }

  // 验证配置值
  validateValue(category, key, value) {
    const metadata = this.getConfigMetadata(category, key);
    if (!metadata) return false;

    switch (metadata.type) {
      case 'integer':
        return Number.isInteger(value) && value >= metadata.min && value <= metadata.max;
      case 'float':
        return typeof value === 'number' && value >= metadata.min && value <= metadata.max;
      case 'boolean':
        return typeof value === 'boolean';
      case 'select':
        return metadata.options.includes(value);
      case 'object':
        return typeof value === 'object';
      default:
        return true;
    }
  }
}

// 创建全局配置管理器实例
export const configManager = new ConfigManager();

// 便捷函数
export const getConfig = (category, key) => configManager.getValue(category, key);
export const setConfig = (category, key, value) => configManager.setValue(category, key, value);
export const getCategoryConfig = (category) => configManager.getCategoryConfig(category);
export const resetCategory = (category) => configManager.resetCategory(category);
export const resetAllConfig = () => configManager.resetAll(); 