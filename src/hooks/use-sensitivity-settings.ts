import { useState, useEffect } from 'react';

interface SensitivitySettings {
  face: number;
  pose: number;
  hands: number;
  smoothing: number;
  armSpeed: number;
  handSpeed: number;
  fingerSpeed: number;
  // MediaPipe 相关设置
  minDetectionConfidence: number;
  minTrackingConfidence: number;
  minHandDetectionConfidence: number;
  minHandTrackingConfidence: number;
}

const defaultSettings: SensitivitySettings = {
  face: 0.5,
  pose: 0.5,
  hands: 0.5,
  smoothing: 0.5,
  armSpeed: 1.0,
  handSpeed: 1.0,
  fingerSpeed: 1.0,
  // MediaPipe 默认设置
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
  minHandDetectionConfidence: 0.5,
  minHandTrackingConfidence: 0.5,
};

export const useSensitivitySettings = () => {
  const [settings, setSettings] = useState<SensitivitySettings>(defaultSettings);

  // 从本地存储加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('sensitivity-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.error('Failed to parse sensitivity settings:', error);
      }
    }
  }, []);

  // 更新设置
  const updateSettings = (newSettings: Partial<SensitivitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('sensitivity-settings', JSON.stringify(updated));
  };

  // 重置设置
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('sensitivity-settings', JSON.stringify(defaultSettings));
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}; 