import { useState, useEffect, useCallback, useRef } from 'react';

// 性能设置类型
export interface PerformanceSettings {
  quality: 'low' | 'medium' | 'high';
  fps: number;
  resolution: number;
  antialiasing: boolean;
  shadows: boolean;
  bloom: boolean;
  optimization: 'auto' | 'manual';
  // PERF: R3F 特定设置
  postProcessing: boolean;
  sparkles: boolean;
  shadowMapSize: number;
  hdrResolution: number;
  particleCount: number;
}

// PERF: 性能预设配置
const PERFORMANCE_PRESETS = {
  low: {
    postProcessing: false,
    sparkles: false,
    shadowMapSize: 256,
    hdrResolution: 64,
    particleCount: 10,
    shadows: false,
    bloom: false,
    antialiasing: false,
  },
  medium: {
    postProcessing: true,
    sparkles: true,
    shadowMapSize: 512,
    hdrResolution: 256,
    particleCount: 25,
    shadows: true,
    bloom: false,
    antialiasing: true,
  },
  high: {
    postProcessing: true,
    sparkles: true,
    shadowMapSize: 1024,
    hdrResolution: 512,
    particleCount: 50,
    shadows: true,
    bloom: true,
    antialiasing: true,
  },
} as const;

// 默认性能设置
const defaultSettings: PerformanceSettings = {
  quality: 'medium',
  fps: 60,
  resolution: 1,
  antialiasing: true,
  shadows: true,
  bloom: false, // PERF: 默认关闭 bloom
  optimization: 'auto',
  // PERF: R3F 特定设置默认值
  postProcessing: true,
  sparkles: true,
  shadowMapSize: 512,
  hdrResolution: 256,
  particleCount: 25,
};

export const usePerformance = () => {
  const [settings, setSettings] = useState<PerformanceSettings>(() => {
    // 从本地存储加载设置
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('vtuber-settings');
      if (savedSettings) {
        try {
          return { ...defaultSettings, ...JSON.parse(savedSettings) };
        } catch (error) {
          console.error('Failed to parse saved settings:', error);
        }
      }
    }
    return defaultSettings;
  });
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [gpuUsage, setGpuUsage] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);
  const pendingQualityRef = useRef<PerformanceSettings['quality'] | null>(null);
  const pendingCountRef = useRef(0);

  // 更新性能设置
  const updateSettings = useCallback((newSettings: Partial<PerformanceSettings>) => {
    setSettings(prev => {
      const updatedSettings = { ...prev, ...newSettings };
      // 保存到本地存储
      if (typeof window !== 'undefined') {
        localStorage.setItem('vtuber-settings', JSON.stringify(updatedSettings));
      }
      return updatedSettings;
    });
  }, []);

  // PERF: 自动性能优化 - 预设 + 滞后（同一档位连续 2 秒才切换），避免 FPS 边界来回跳
  const autoOptimize = useCallback(() => {
    const targetQuality: PerformanceSettings['quality'] =
      fps < 30 ? 'low' : fps < 45 ? 'medium' : fps > 55 ? 'high' : 'medium';

    if (targetQuality !== pendingQualityRef.current) {
      pendingQualityRef.current = targetQuality;
      pendingCountRef.current = 0;
    }
    pendingCountRef.current++;
    if (pendingCountRef.current < 2) return; // 连续 2 次（约 2 秒）同一档位再应用

    if (targetQuality === 'low') {
      setSettings(prev => ({
        ...prev,
        quality: 'low',
        ...PERFORMANCE_PRESETS.low,
        postProcessing: true, // 保持开启，避免画面突然变糊
      }));
    } else if (targetQuality === 'medium') {
      setSettings(prev => ({
        ...prev,
        quality: 'medium',
        ...PERFORMANCE_PRESETS.medium,
      }));
    } else if (targetQuality === 'high') {
      setSettings(prev => ({
        ...prev,
        quality: 'high',
        ...PERFORMANCE_PRESETS.high,
      }));
    }
  }, [fps]);

  // PERF: 手动切换性能模式
  const setPerformanceMode = useCallback((mode: 'low' | 'medium' | 'high') => {
    setSettings(prev => ({
      ...prev,
      quality: mode,
      ...PERFORMANCE_PRESETS[mode],
    }));
  }, []);

  // 监控 FPS
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCountRef.current++;

    if (now - lastTimeRef.current >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      setFps(currentFps);
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  }, []);

  // 监控内存使用
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      setMemoryUsage(Math.round(usage));
    }
  }, []);

  // 组件懒加载
  const lazyLoad = useCallback((importFn: () => Promise<any>) => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        importFn().then(resolve);
      }, 100);
    });
  }, []);

  // 资源预加载
  const preloadResource = useCallback((url: string, type: 'image' | 'model' | 'animation') => {
    return new Promise((resolve, reject) => {
      if (type === 'image') {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = reject;
        img.src = url;
      } else {
        // 对于模型和动画文件，使用 fetch 预加载
        fetch(url, { method: 'HEAD' })
          .then(() => resolve(url))
          .catch(reject);
      }
    });
  }, []);

  // 批量预加载
  const preloadBatch = useCallback(async (resources: Array<{ url: string; type: 'image' | 'model' | 'animation' }>) => {
    const promises = resources.map(({ url, type }) => preloadResource(url, type));
    return Promise.allSettled(promises);
  }, [preloadResource]);

  // 性能监控
  useEffect(() => {
    let animationId: number;
    let memoryInterval: NodeJS.Timeout;

    const monitorPerformance = () => {
      measureFPS();
      animationId = requestAnimationFrame(monitorPerformance);
    };

    // 开始监控
    monitorPerformance();

    // 监控内存使用
    memoryInterval = setInterval(measureMemory, 2000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
    };
  }, [measureFPS, measureMemory]);

  // 自动优化
  useEffect(() => {
    if (settings.optimization === 'auto') {
      autoOptimize();
    }
  }, [fps, settings.optimization, autoOptimize]);

  return {
    settings,
    fps,
    memoryUsage,
    gpuUsage,
    updateSettings,
    autoOptimize,
    setPerformanceMode, // PERF: 新增手动切换模式
    lazyLoad,
    preloadResource,
    preloadBatch,
    PERFORMANCE_PRESETS, // PERF: 导出预设配置供其他组件使用
  };
};

// PERF: 导出预设配置
export { PERFORMANCE_PRESETS }; 