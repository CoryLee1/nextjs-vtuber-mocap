'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useSceneStore } from '@/hooks/use-scene-store';

/**
 * WebGL Context Loss / Restore 事件守卫
 *
 * 在 R3F 树内挂载，通过 useThree() 获取 canvas DOM 元素，监听：
 * - webglcontextlost: preventDefault（必须，否则浏览器不会触发 restore）→ 更新 store
 * - webglcontextrestored: 重置渲染器尺寸 → invalidate 强制重绘 → 更新 store
 *
 * 60 秒内丢失 ≥3 次自动降质（关闭后处理、降分辨率）。
 */
export function useWebGLContextGuard() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const size = useThree((s) => s.size);
  const lossTimestamps = useRef<number[]>([]);

  useEffect(() => {
    const canvas = gl.domElement;
    if (!canvas) return;

    const handleContextLost = (event: Event) => {
      // MUST preventDefault — otherwise browser won't fire contextrestored
      event.preventDefault();

      const now = Date.now();
      const store = useSceneStore.getState();
      const newCount = store.webglLossCount + 1;

      console.warn(`[WebGLContextGuard] context lost (#${newCount})`);

      store.setCanvasReady(false);
      useSceneStore.setState({
        webglContextLost: true,
        webglLossCount: newCount,
      });

      // Track timestamps for auto-degradation
      lossTimestamps.current.push(now);
      // Keep only losses within the last 60s
      lossTimestamps.current = lossTimestamps.current.filter(
        (t) => now - t < 60_000
      );

      if (lossTimestamps.current.length >= 3) {
        console.warn('[WebGLContextGuard] 3+ losses in 60s — triggering quality degradation');
        store.triggerQualityDegradation();
        lossTimestamps.current = []; // reset after degradation
      }
    };

    const handleContextRestored = () => {
      console.log('[WebGLContextGuard] context restored');

      // Reset renderer size to force re-creation of internal state
      gl.setSize(size.width, size.height);
      invalidate();

      useSceneStore.setState({ webglContextLost: false });
      useSceneStore.getState().setCanvasReady(true);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // Dev-only: periodic GPU memory logging
    if (process.env.NODE_ENV === 'development') {
      const memInterval = setInterval(() => {
        const info = gl.info;
        if (info?.memory) {
          console.log('[WebGLContextGuard] GPU memory:', {
            geometries: info.memory.geometries,
            textures: info.memory.textures,
          });
        }
      }, 30_000);

      return () => {
        canvas.removeEventListener('webglcontextlost', handleContextLost);
        canvas.removeEventListener('webglcontextrestored', handleContextRestored);
        clearInterval(memInterval);
      };
    }

    return () => {
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, invalidate, size.width, size.height]);
}
