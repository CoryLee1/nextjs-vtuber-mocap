'use client';

import React, { useMemo, memo, Suspense } from 'react';
import { useGLTF, TransformControls } from '@react-three/drei';
import { useSceneStore } from '@/hooks/use-scene-store';

/**
 * 根据 store.sceneFbxUrl 加载 GLB/GLTF 场景模型并渲染，带 Gizmo 控制（位移）。
 * 限制由上传时 validateSceneModelFile 保证（30MB）。
 */
const SceneModelInner = memo(({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(), [scene]);

  return (
    <TransformControls mode="translate" size={0.5}>
      <primitive object={clone} />
    </TransformControls>
  );
});

export const SceneFbxWithGizmo = memo(() => {
  const sceneFbxUrl = useSceneStore((s) => s.sceneFbxUrl);

  if (!sceneFbxUrl || sceneFbxUrl.trim() === '') return null;

  return (
    <Suspense fallback={null}>
      <SceneModelInner url={sceneFbxUrl} />
    </Suspense>
  );
});

SceneFbxWithGizmo.displayName = 'SceneFbxWithGizmo';
