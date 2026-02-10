'use client';

import React, { useEffect, Suspense, lazy, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { usePathname } from 'next/navigation';
import { useSceneStore } from '@/hooks/use-scene-store';
import { usePerformance } from '@/hooks/use-performance';
import { SceneManager } from '@/components/canvas/SceneManager';

// 性能监控组件（仅开发环境，使用 lazy 加载）
const PerfComponent = process.env.NODE_ENV === 'development'
  ? lazy(() =>
      import('r3f-perf')
        .then((mod) => ({ default: mod.Perf }))
        .catch(() => ({ default: () => null }))
    )
  : null;

/**
 * 计算设备像素比（DPR）
 * 限制最大 DPR 以避免性能问题
 */
function calculateDPR(settings: { quality: 'low' | 'medium' | 'high'; resolution: number }): number {
  if (typeof window === 'undefined') return 1;
  
  const deviceDPR = window.devicePixelRatio || 1;
  const maxDPR = 1.5; // 限制最大 DPR 以避免性能问题和锯齿
  
  switch (settings.quality) {
    case 'low':
      return Math.min(deviceDPR * 0.75, 1);
    case 'high':
      return Math.min(deviceDPR, maxDPR);
    case 'medium':
    default:
      return Math.min(deviceDPR * 0.9, maxDPR);
  }
}

/**
 * Canvas 3D Provider
 * 
 * 在 layout 层级创建持久化的 Canvas，确保：
 * - WebGL 上下文在路由切换时不丢失
 * - 3D 场景始终挂载
 * - 性能配置统一管理
 * 
 * 使用固定定位覆盖整个视口，z-index 为 -1 确保在页面内容下方
 * 不使用 pointer-events-none，以支持未来的 3D 交互功能
 */
export const Canvas3DProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = usePerformance();
  const setCanvasReady = useSceneStore((state) => state.setCanvasReady);
  const streamPanelOpen = useSceneStore((state) => state.streamPanelOpen);
  const pathname = usePathname();
  const [perfVisible, setPerfVisible] = useState(false);

  // Ctrl+P 切换性能监控面板显示
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      setPerfVisible((v) => !v);
    }
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 检查是否在测试 Loading 页，如果是则禁用 Canvas 以实现完全隔离
  const isTestingLoading = pathname?.includes('/test-loading');

  // Canvas 卸载时清理就绪状态
  useEffect(() => {
    return () => setCanvasReady(false);
  }, [setCanvasReady]);

  return (
    <>
      {/* 页面内容 - 覆盖在 Canvas 上方，但容器允许事件穿透 */}
      {children}

      {/* 持久化 Canvas - 固定定位，覆盖整个视口，接收鼠标事件 */}
      {!isTestingLoading && (
        <div 
          className="fixed top-0 right-0 bottom-0"
          style={{ 
            zIndex: 0, 
            pointerEvents: 'auto',
            overscrollBehavior: 'contain',
            touchAction: 'none',
            left: streamPanelOpen ? 560 : 0,
            width: streamPanelOpen ? 'calc(100% - 560px)' : '100%',
            transition: 'left 0.3s ease-in-out, width 0.3s ease-in-out',
          }}
        >
          <Canvas
            frameloop="always"
            camera={{ position: [0, 1.5, 3], fov: 50 }}
            shadows={settings.shadows}
            gl={{
              antialias: true, // 强制启用抗锯齿以消除锯齿边缘
              alpha: false, // 不透明背景
              preserveDrawingBuffer: true, // 启用以便截图（仅截 3D 画布，不含 UI）
              powerPreference: 'high-performance',
              stencil: false, // 禁用模板缓冲以提升性能
              depth: true,
              logarithmicDepthBuffer: false,
            }}
            dpr={calculateDPR(settings)}
            style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}
            onCreated={(state) => {
              // Canvas WebGL 上下文创建完成后设置就绪状态
              setCanvasReady(true);
              // 确保 Canvas DOM 元素能接收鼠标事件
              const canvasElement = state.gl.domElement;
              canvasElement.style.pointerEvents = 'auto';
              canvasElement.style.touchAction = 'none'; // 防止触摸事件冲突
              
              // 调试信息
              if (process.env.NODE_ENV === 'development') {
                console.log('Canvas created:', {
                  pointerEvents: canvasElement.style.pointerEvents,
                  zIndex: window.getComputedStyle(canvasElement.parentElement!).zIndex,
                  width: canvasElement.width,
                  height: canvasElement.height
                });
              }
            }}
          >
            <Suspense fallback={null}>
              {/* 场景管理器 - 根据 activeScene 渲染不同场景 */}
              <SceneManager />

              {/* 性能监控（仅开发环境，默认隐藏，Ctrl+P 切换显示） */}
              {process.env.NODE_ENV === 'development' && PerfComponent && perfVisible && (
                <Suspense fallback={null}>
                  <PerfComponent position="top-left" />
                </Suspense>
              )}

              {/* 预加载所有资源 */}
              <Preload all />
            </Suspense>
          </Canvas>
        </div>
      )}
    </>
  );
};

