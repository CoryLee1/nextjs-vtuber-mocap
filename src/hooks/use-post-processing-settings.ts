/**
 * 后期处理设置管理 Hook
 * 
 * 管理后期处理效果的设置，包括保存和加载到 localStorage
 * 使用 zustand store 确保状态在组件间共享
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'vrm-app-post-settings';

// PERF: 默认配置 - 禁用高消耗效果以提升性能
const DEFAULT_SETTINGS = {
  brightness: 0,
  contrast: 0,
  hue: 0, // 色相，范围 -1 到 1
  saturation: 0,
  noiseOpacity: 0,
  vignetteDarkness: 0.5,
  toneMappingMode: 0, // 0 = ACES_FILMIC
  autofocusEnabled: false, // PERF: 默认禁用 - DOF 效果 GPU 密集型
  autofocusBokehScale: 10,
};

export interface PostProcessingSettings {
  brightness: number;
  contrast: number;
  hue: number; // 色相，范围 -1 到 1
  saturation: number;
  noiseOpacity: number;
  vignetteDarkness: number;
  toneMappingMode: number;
  autofocusEnabled: boolean;
  autofocusBokehScale: number;
}

/**
 * 从 localStorage 加载配置
 */
function loadSettings(): PostProcessingSettings {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 合并默认值，确保所有字段都存在
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load post-processing settings from localStorage:', error);
  }

  return { ...DEFAULT_SETTINGS };
}

/**
 * 保存配置到 localStorage
 */
function saveSettings(settings: PostProcessingSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save post-processing settings to localStorage:', error);
  }
}

// Zustand store 接口
interface PostProcessingStore {
  settings: PostProcessingSettings;
  updateSettings: (updates: Partial<PostProcessingSettings>) => void;
  resetSettings: () => void;
}

// 创建 Zustand store（使用 persist 中间件自动保存到 localStorage）
export const usePostProcessingStore = create<PostProcessingStore>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
      resetSettings: () => {
        set({ settings: { ...DEFAULT_SETTINGS } });
      },
    }),
    {
      name: STORAGE_KEY, // localStorage 键名
      // 从 localStorage 恢复时合并默认值
      merge: (persistedState: any, currentState) => ({
        ...currentState,
        settings: { ...DEFAULT_SETTINGS, ...(persistedState?.settings || {}) },
      }),
    }
  )
);

/**
 * 后期处理设置管理 Hook（兼容接口）
 */
export function usePostProcessingSettings() {
  const settings = usePostProcessingStore((state) => state.settings);
  const updateSettings = usePostProcessingStore((state) => state.updateSettings);
  const resetSettings = usePostProcessingStore((state) => state.resetSettings);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}

