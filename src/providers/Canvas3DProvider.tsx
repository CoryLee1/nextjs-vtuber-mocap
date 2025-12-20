'use client';

import React, { useEffect, Suspense, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
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

  // Canvas 卸载时清理就绪状态
  useEffect(() => {
    return () => {
      setCanvasReady(false);
    };
  }, [setCanvasReady]);

  return (
    <>
      {/* 页面内容 - 覆盖在 Canvas 上方，但容器允许事件穿透 */}
      {children}

      {/* 持久化 Canvas - 固定定位，覆盖整个视口，接收鼠标事件 */}
      {/* 放在 children 之后，确保 Canvas 在 DOM 中最后渲染，能接收到穿透的鼠标事件 */}
      {/* z-index 设置为 0，UI 元素使用更高的 z-index（如 z-50）覆盖在 Canvas 上方 */}
      <div 
        className="fixed inset-0" 
        style={{ 
          zIndex: 0, 
          pointerEvents: 'auto',
          overscrollBehavior: 'contain', // ✅ 防止页面滚动干扰
          touchAction: 'none', // ✅ 禁用触摸默认行为（触摸板/触控更稳）
        }}
      >
        <Canvas
          camera={{ position: [0, 1.5, 3], fov: 50 }}
          shadows={settings.shadows}
          gl={{
            antialias: true, // 强制启用抗锯齿以消除锯齿边缘
            alpha: false, // 不透明背景
            preserveDrawingBuffer: false, // 提升性能（除非需要截图功能）
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

            {/* 性能监控（仅开发环境） */}
            {process.env.NODE_ENV === 'development' && PerfComponent && (
              <Suspense fallback={null}>
                <PerfComponent position="top-left" />
              </Suspense>
            )}

            {/* 预加载所有资源 */}
            <Preload all />
          </Suspense>
        </Canvas>
      </div>
    </>
  );
};

