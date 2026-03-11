'use client';

/**
 * TheatreCamera — Theatre.js 相机编排集成
 *
 * 用法：
 *   <TheatreCameraProvider sheet={sheet}>
 *     （包裹 MainScene 内容作为 children）
 *   </TheatreCameraProvider>
 *
 * 在 <TheatreCameraProvider> 内部：
 *   - 开发模式：自动加载 Studio 编辑器（Alt+\ 切换显示）
 *   - 生产模式：仅播放保存在 JSON 的序列，无编辑器
 *
 * 触发播放：useRenderingConfigStore().playTheatreSequence(true/false)
 */

import React, { useEffect, useRef, useState } from 'react';
import { getProject } from '@theatre/core';
import { SheetProvider, PerspectiveCamera as TheatrePerspectiveCamera } from '@theatre/r3f';
import { useRenderingConfigStore } from '@/stores/use-rendering-config-store';

// ─── Minimal project state (required when @theatre/studio is not loaded) ───────
// Theatre.js throws when config.state is empty and Studio is not loaded.
// This minimal state allows getProject to work without Studio.
// To persist choreography, export from Studio and replace with imported JSON.
const MINIMAL_STATE = {
  sheetsById: {
    MainCamera: {
      instanceId: 'MainCamera',
      sequence: {
        type: 'Sequence',
        length: 0,
        subUnitsByUnit: {},
        tracksByObject: {},
      },
      instances: {},
    },
  },
} as const;

// ─── Project / Sheet (module-level singletons) ────────────────────────────────
let _project: ReturnType<typeof getProject> | null = null;
let _sheet: ReturnType<ReturnType<typeof getProject>['sheet']> | null = null;

type ProjectConfig = { state?: typeof MINIMAL_STATE };

function getOrCreateSheet(config?: ProjectConfig) {
  if (!_project) {
    try {
      // Dev + Studio loaded: {} is OK. Prod or no Studio: need explicit state.
      const cfg = config ?? { state: MINIMAL_STATE };
      _project = getProject('EchuuCamera', cfg);
    } catch {
      return null;
    }
  }
  if (!_project) return null;
  if (!_sheet) {
    _sheet = _project.sheet('MainCamera');
  }
  return _sheet;
}

// ─── SheetProvider wrapper (must be inside R3F Canvas) ────────────────────────
export function TheatreCameraProvider({ children }: { children: React.ReactNode }) {
  // In dev: defer getProject until Studio is loaded (empty state is OK with Studio).
  // In prod: call immediately with minimal state.
  const [studioReady, setStudioReady] = useState(process.env.NODE_ENV !== 'development');
  const sheet = studioReady
    ? getOrCreateSheet(process.env.NODE_ENV === 'development' ? {} : { state: MINIMAL_STATE })
    : null;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@theatre/studio')
        .then(({ default: studio }) => {
          if (!(studio as any)._initialized) {
            studio.initialize();
            (studio as any)._initialized = true;
          }
          setStudioReady(true);
        })
        .catch(() => setStudioReady(true));
    }
  }, []);

  if (!sheet) return <>{children}</>;
  return <SheetProvider sheet={sheet}>{children}</SheetProvider>;
}

// ─── Theatre-controlled PerspectiveCamera ────────────────────────────────────
// When `active` is true, this camera takes over from OrbitControls.
// theatreKey="Camera" registers it with the Studio editor.
export const TheatreCamera = React.memo(function TheatreCamera() {
  const { theatreCameraActive } = useRenderingConfigStore();
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
  const { theatreSequencePlaying, setTheatreSequencePlaying } = useRenderingConfigStore();
  const prevRef = useRef(false);

  useEffect(() => {
    if (theatreSequencePlaying === prevRef.current) return;
    prevRef.current = theatreSequencePlaying;

    const sheet = getOrCreateSheet();
    if (!sheet) return;
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
