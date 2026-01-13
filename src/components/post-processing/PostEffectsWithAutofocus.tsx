/**
 * 后期处理效果组件（包含 Autofocus）
 * 
 * 功能：
 * - 颜色调节（亮度、对比度、饱和度）
 * - 噪点效果
 * - 晕影效果
 * - 色调映射
 * - 自动对焦（与现有 Autofocus 集成）
 */

'use client';

import React, { useMemo } from 'react';
import {
  EffectComposer,
  BrightnessContrast,
  HueSaturation,
  Noise,
  Vignette,
  ToneMapping,
  Autofocus,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector3 } from 'three';
import type { PostProcessingSettings } from '@/hooks/use-post-processing-settings';

interface PostEffectsWithAutofocusProps {
  /** 自动对焦目标位置（头部位置） */
  autofocusTarget?: Vector3 | [number, number, number];
  /** 后期处理设置 */
  settings: PostProcessingSettings;
}

/**
 * 后期处理效果组件（包含 Autofocus）
 */
export const PostEffectsWithAutofocus: React.FC<PostEffectsWithAutofocusProps> = ({
  autofocusTarget,
  settings,
}) => {

  // 转换 autofocusTarget 为 Vector3（使用 ref 避免频繁创建新对象）
  const autofocusTargetVec3Ref = React.useRef<Vector3 | undefined>(undefined);
  
  React.useEffect(() => {
    if (!autofocusTarget) {
      autofocusTargetVec3Ref.current = undefined;
      return;
    }
    
    if (Array.isArray(autofocusTarget)) {
      const [x, y, z] = autofocusTarget;
      if (!autofocusTargetVec3Ref.current) {
        autofocusTargetVec3Ref.current = new Vector3(x, y, z);
      } else {
        autofocusTargetVec3Ref.current.set(x, y, z);
      }
    } else {
      autofocusTargetVec3Ref.current = autofocusTarget;
    }
  }, [autofocusTarget]);
  
  const autofocusTargetVec3 = autofocusTargetVec3Ref.current;

  return (
    <EffectComposer>
      {/* 自动对焦（如果启用） */}
      {settings.autofocusEnabled && autofocusTargetVec3 && (
        <Autofocus
          bokehScale={settings.autofocusBokehScale}
          target={autofocusTargetVec3}
        />
      )}

      {/* 亮度/对比度 */}
      <BrightnessContrast
        brightness={settings.brightness}
        contrast={settings.contrast}
      />

      {/* 色相/饱和度 */}
      <HueSaturation
        hue={settings.hue}
        saturation={settings.saturation}
      />

      {/* 噪点 */}
      {settings.noiseOpacity > 0 && (
        <Noise
          blendFunction={BlendFunction.OVERLAY}
          opacity={settings.noiseOpacity}
          premultiply={false}
        />
      )}

      {/* 晕影 */}
      <Vignette
        eskil={false}
        offset={0.1}
        darkness={settings.vignetteDarkness}
      />

      {/* 色调映射 */}
      <ToneMapping
        mode={settings.toneMappingMode}
        resolution={256}
      />
    </EffectComposer>
  );
};

