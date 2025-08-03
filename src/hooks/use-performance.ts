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
}

// 默认性能设置
const defaultSettings: PerformanceSettings = {
  quality: 'medium',
  fps: 60,
  resolution: 1,
  antialiasing: true,
  shadows: true,
  bloom: true,
  optimization: 'auto',
};

export const usePerformance = () => {
  const [settings, setSettings] = useState<PerformanceSettings>(defaultSettings);
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [gpuUsage, setGpuUsage] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  // 更新性能设置
  const updateSettings = useCallback((newSettings: Partial<PerformanceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // 自动性能优化
  const autoOptimize = useCallback(() => {
    if (fps < 30) {
      // 性能较差时降低质量
      setSettings(prev => ({
        ...prev,
        quality: 'low',
        shadows: false,
        bloom: false,
        antialiasing: false,
      }));
    } else if (fps > 50) {
      // 性能良好时提高质量
      setSettings(prev => ({
        ...prev,
        quality: 'high',
        shadows: true,
        bloom: true,
        antialiasing: true,
      }));
    }
  }, [fps]);

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
    lazyLoad,
    preloadResource,
    preloadBatch,
  };
}; 