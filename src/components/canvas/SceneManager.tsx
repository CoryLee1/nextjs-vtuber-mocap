'use client';

import React, { memo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@/hooks/use-scene-store';
import { MainScene } from './scenes/MainScene';

const TONE_MAP = {
  aces: THREE.ACESFilmicToneMapping,
  linear: THREE.LinearToneMapping,
  reinhard: THREE.ReinhardToneMapping,
} as const;

/** 同步 store 的色调映射模式与曝光到 renderer；天空饱和度可由 toneMappingMode 切换（linear/reinhard 更艳）. */
const ToneMappingSync = memo(function ToneMappingSync() {
  const gl = useThree((s) => s.gl);
  const toneMappingExposure = useSceneStore((s) => s.toneMappingExposure);
  const toneMappingMode = useSceneStore((s) => s.toneMappingMode);

  useEffect(() => {
    gl.toneMapping = TONE_MAP[toneMappingMode];
    gl.toneMappingExposure = toneMappingExposure;
  }, [gl, toneMappingMode, toneMappingExposure]);

  return null;
});

/**
 * 在 Canvas 内部响应截帧请求（useFrame 时当前帧已绘制，直接 toBlob 即可）
 * UI 只发 takePhotoRequest，不持有 canvas 引用
 */
const TakePhotoCapture = memo(function TakePhotoCapture() {
  const { gl } = useThree();

  useFrame(() => {
    const request = useSceneStore.getState().takePhotoRequest;
    if (request == null) return;

    const canvas = gl.domElement;
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      useSceneStore.getState().setTakePhotoRequest(null);
      return;
    }

    useSceneStore.getState().setTakePhotoRequest(null);

    try {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              useSceneStore.getState().setLastCaptureBlobUrl(url);
            }
          },
          'image/png',
          1
        );
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        useSceneStore.getState().setLastCaptureBlobUrl(dataUrl);
      }
    } catch {
      // 静默失败，UI 可通过 lastCaptureBlobUrl 未变化判断
    }
  });

  return null;
});

/**
 * 场景管理器
 *
 * 根据 activeScene 状态决定渲染哪个场景
 * 使用 visible 属性控制显隐，而非条件渲染，避免重新初始化
 */
export const SceneManager: React.FC = () => {
  const activeScene = useSceneStore((state) => state.activeScene);

  return (
    <>
      <TakePhotoCapture />
      <ToneMappingSync />

      {/* 主场景 - 使用 visible 控制显隐 */}
      {/* 注意：背景色由 Environment 组件控制，不再使用纯色背景 */}
      <group visible={activeScene === 'main'}>
        <MainScene />
      </group>

      {/* 其他场景可以在这里添加 */}
      {/* 例如：设置场景、隐藏场景等 */}
      {activeScene === 'settings' && (
        <group visible={true}>
          {/* SettingsScene 可以在这里添加 */}
        </group>
      )}

      {/* 隐藏场景时不渲染任何内容 */}
      {activeScene === 'hidden' && null}
    </>
  );
};

