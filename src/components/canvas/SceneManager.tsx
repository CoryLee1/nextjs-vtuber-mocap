'use client';

import React from 'react';
import { useSceneStore } from '@/hooks/use-scene-store';
import { MainScene } from './scenes/MainScene';

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

