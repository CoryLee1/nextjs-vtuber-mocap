'use client';

import React, { memo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@/hooks/use-scene-store';
import { useWebGLContextGuard } from '@/hooks/use-webgl-context-guard';
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
 * 在 Canvas 内部响应截帧请求。
 *
 * preserveDrawingBuffer=false 时 toBlob/toDataURL 是异步的，
 * 回调触发前 buffer 已被 swap/clear → 黑屏。
 * 解法：在 useFrame（帧渲染完毕、buffer swap 之前）用 gl.readPixels 同步读取，
 * 再画到离屏 canvas → toBlob 生成截图。
 */
const TakePhotoCapture = memo(function TakePhotoCapture() {
  const { gl, scene, camera } = useThree();

  useFrame(() => {
    const request = useSceneStore.getState().takePhotoRequest;
    if (request == null) return;

    const canvas = gl.domElement;
    const w = canvas.width;
    const h = canvas.height;
    if (!canvas || w === 0 || h === 0) {
      useSceneStore.getState().setTakePhotoRequest(null);
      return;
    }

    useSceneStore.getState().setTakePhotoRequest(null);

    try {
      // Force a render so the current frame is in the buffer right now
      gl.render(scene, camera);

      // Synchronously read pixels from the GPU framebuffer
      const pixels = new Uint8Array(w * h * 4);
      const ctx2d = gl.getContext() as WebGL2RenderingContext;
      ctx2d.readPixels(0, 0, w, h, ctx2d.RGBA, ctx2d.UNSIGNED_BYTE, pixels);

      // readPixels gives bottom-up rows; flip vertically into an ImageData
      const offscreen = document.createElement('canvas');
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext('2d')!;
      const imageData = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) {
        const srcRow = (h - 1 - y) * w * 4;
        const dstRow = y * w * 4;
        imageData.data.set(pixels.subarray(srcRow, srcRow + w * 4), dstRow);
      }
      ctx.putImageData(imageData, 0, 0);

      offscreen.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            useSceneStore.getState().setLastCaptureBlobUrl(url);
          }
        },
        'image/png',
        1
      );
    } catch {
      // 静默失败，UI 可通过 lastCaptureBlobUrl 未变化判断
    }
  });

  return null;
});

/** WebGL context loss / restore 事件守卫 — 必须在 R3F 树内渲染 */
const WebGLContextGuard = memo(function WebGLContextGuard() {
  useWebGLContextGuard();
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
      <WebGLContextGuard />
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

