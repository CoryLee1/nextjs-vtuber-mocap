'use client';

/**
 * TheatreCamera — Theatre.js 相机编排集成
 *
 * 用法：
 *   <TheatreCameraProvider sheet={sheet}>
 *     {/* 包裹 MainScene 内容 *\/}
 *   <\/TheatreCameraProvider>
 *
 * 在 <TheatreCameraProvider> 内部：
 *   - 开发模式：自动加载 Studio 编辑器（Alt+\ 切换显示）
 *   - 生产模式：仅播放保存在 JSON 的序列，无编辑器
 *
 * 触发播放：useSceneStore().playTheatreSequence(true/false)
 */

import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { getProject, val } from '@theatre/core';
import { SheetProvider, PerspectiveCamera as TheatrePerspectiveCamera, editable as e } from '@theatre/r3f';
import { useSceneStore } from '@/hooks/use-scene-store';

// ─── Project / Sheet (module-level singletons) ────────────────────────────────
// Initialized once; the project state is an empty object by default.
// To persist/replay choreography, export state from Studio and replace `{}` with
// the imported JSON: import state from '@/lib/theatre-camera-state.json'
let _project: ReturnType<typeof getProject> | null = null;
let _sheet: ReturnType<ReturnType<typeof getProject>['sheet']> | null = null;

function getOrCreateSheet() {
  if (!_project) {
    _project = getProject('EchuuCamera');
  }
  if (!_sheet) {
    _sheet = _project.sheet('MainCamera');
  }
  return _sheet;
}

// ─── SheetProvider wrapper (must be inside R3F Canvas) ────────────────────────
export function TheatreCameraProvider({ children }: { children: React.ReactNode }) {
  const sheet = getOrCreateSheet();

  useEffect(() => {
    // Load Studio only in development; it's AGPL and heavy (~500KB).
    // In production this block never runs (process.env.NODE_ENV is compile-time).
    if (process.env.NODE_ENV === 'development') {
      import('@theatre/studio').then(({ default: studio }) => {
        if (!(studio as any)._initialized) {
          studio.initialize();
          (studio as any)._initialized = true;
        }
      }).catch(() => {});
    }
  }, []);

  return <SheetProvider sheet={sheet}>{children}</SheetProvider>;
}

// ─── Theatre-controlled PerspectiveCamera ────────────────────────────────────
// When `active` is true, this camera takes over from OrbitControls.
// theatreKey="Camera" registers it with the Studio editor.
export const TheatreCamera = React.memo(function TheatreCamera() {
  const { theatreCameraActive } = useSceneStore();
  if (!theatreCameraActive) return null;

  return (
    <TheatrePerspectiveCamera
      theatreKey="Camera"
      makeDefault
      position={[0, 1.5, 3.5]}
      fov={40}
      near={0.1}
      far={50}
    />
  );
});

// ─── Sequence play controller ─────────────────────────────────────────────────
// Watches store.theatreSequencePlaying and calls sheet.sequence.play()/pause().
export function TheatreSequenceController() {
  const { theatreSequencePlaying, setTheatreSequencePlaying } = useSceneStore();
  const prevRef = useRef(false);

  useEffect(() => {
    if (theatreSequencePlaying === prevRef.current) return;
    prevRef.current = theatreSequencePlaying;

    const sheet = getOrCreateSheet();
    if (theatreSequencePlaying) {
      sheet.sequence.play({ iterationCount: 1 }).then(() => {
        setTheatreSequencePlaying(false);
      });
    } else {
      sheet.sequence.pause();
    }
  }, [theatreSequencePlaying, setTheatreSequencePlaying]);

  return null;
}
