'use client';

import React, { memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '@/hooks/use-scene-store';
import { MainScene } from './scenes/MainScene';

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

