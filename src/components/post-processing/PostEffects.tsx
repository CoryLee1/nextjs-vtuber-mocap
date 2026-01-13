/**
 * 后期处理效果组件
 * 
 * 功能：
 * - 颜色调节（亮度、对比度、饱和度）
 * - 噪点效果
 * - 晕影效果
 * - 色调映射
 * 
 * 使用 Leva 控制面板进行交互式调节
 * 自动保存和加载配置到 localStorage
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import {
  EffectComposer,
  BrightnessContrast,
  HueSaturation,
  Noise,
  Vignette,
  ToneMapping,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useControls } from 'leva';
// ToneMappingMode 是数字枚举，不需要导入

// localStorage 键名
const STORAGE_KEY = 'vrm-app-post-settings';

// 默认配置
const DEFAULT_SETTINGS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  noiseOpacity: 0,
  vignetteDarkness: 0.5,
  toneMappingMode: 0, // 0 = ACES_FILMIC
  toneMappingExposure: 1.0,
};

// 配置接口
interface PostProcessingSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  noiseOpacity: number;
  vignetteDarkness: number;
  toneMappingMode: number; // ToneMappingMode 是数字枚举
  toneMappingExposure: number;
}

/**
 * 从 localStorage 加载配置
 */
function loadSettings(): PostProcessingSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
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

  return DEFAULT_SETTINGS;
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

/**
 * 后期处理效果组件
 */
export const PostEffects: React.FC = () => {
  // 从 localStorage 加载初始配置
  const initialSettings = useMemo(() => loadSettings(), []);

  // Leva 控制面板配置（平铺结构）
  const {
    brightness,
    contrast,
    saturation,
    noiseOpacity,
    vignetteDarkness,
    toneMappingExposure,
  } = useControls(
    'Post Processing',
    {
      // 颜色调节分组
      'Brightness': {
        value: initialSettings.brightness,
        min: -1,
        max: 1,
        step: 0.01,
      },
      'Contrast': {
        value: initialSettings.contrast,
        min: -1,
        max: 1,
        step: 0.01,
      },
      'Saturation': {
        value: initialSettings.saturation,
        min: 0,
        max: 2,
        step: 0.01,
      },
      // 噪点
      'Noise Opacity': {
        value: initialSettings.noiseOpacity,
        min: 0,
        max: 1,
        step: 0.01,
      },
      // 晕影
      'Vignette Darkness': {
        value: initialSettings.vignetteDarkness,
        min: 0,
        max: 2,
        step: 0.01,
      },
      // 色调映射曝光
      'Tone Mapping Exposure': {
        value: initialSettings.toneMappingExposure,
        min: 0.1,
        max: 3,
        step: 0.01,
      },
    },
    { collapsed: true } // 默认折叠
  );

  // 使用直接的值（Leva 返回的就是数字）
  const brightnessValue = brightness ?? initialSettings.brightness;
  const contrastValue = contrast ?? initialSettings.contrast;
  const saturationValue = saturation ?? initialSettings.saturation;
  const noiseOpacityValue = noiseOpacity ?? initialSettings.noiseOpacity;
  const vignetteDarknessValue = vignetteDarkness ?? initialSettings.vignetteDarkness;
  const toneMappingModeValue = initialSettings.toneMappingMode; // 暂时固定，后续可以添加控制
  const toneMappingExposureValue = toneMappingExposure ?? initialSettings.toneMappingExposure;

  // 保存配置到 localStorage
  useEffect(() => {
    const settings: PostProcessingSettings = {
      brightness: brightnessValue,
      contrast: contrastValue,
      saturation: saturationValue,
      noiseOpacity: noiseOpacityValue,
      vignetteDarkness: vignetteDarknessValue,
      toneMappingMode: toneMappingModeValue,
      toneMappingExposure: toneMappingExposureValue,
    };

    // 使用防抖，避免频繁保存
    const timeoutId = setTimeout(() => {
      saveSettings(settings);
    }, 300); // 300ms 防抖

    return () => clearTimeout(timeoutId);
  }, [
    brightnessValue,
    contrastValue,
    saturationValue,
    noiseOpacityValue,
    vignetteDarknessValue,
    toneMappingModeValue,
    toneMappingExposureValue,
  ]);

  return (
    <EffectComposer>
      {/* 亮度/对比度 */}
      <BrightnessContrast
        brightness={brightnessValue}
        contrast={contrastValue}
      />

      {/* 色相/饱和度 */}
      <HueSaturation
        hue={0} // 色相通常保持为 0，只调节饱和度
        saturation={saturationValue}
      />

      {/* 噪点 */}
      {noiseOpacityValue > 0 && (
        <Noise
          blendFunction={BlendFunction.OVERLAY}
          opacity={noiseOpacityValue}
          premultiply={false}
        />
      )}

      {/* 晕影 */}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={vignetteDarknessValue}
      />

      {/* 色调映射 */}
      <ToneMapping
        mode={toneMappingModeValue}
        resolution={256}
      />
    </EffectComposer>
  );
};

