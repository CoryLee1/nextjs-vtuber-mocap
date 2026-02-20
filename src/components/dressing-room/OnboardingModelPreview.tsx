'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useFrame } from '@react-three/fiber';
import { DEFAULT_PREVIEW_MODEL_URL, DEFAULT_IDLE_URL } from '@/config/vtuber-animations';
import { useAnimationManager } from '@/lib/animation-manager';

/** 引导页占位区用：透明背景、播 idle 的 3D 预览。使用独立加载的 VRM，不写入 useSceneStore。 */

// ─── 在 Canvas 内：用 useAnimationManager 驱动 idle，每帧 updateAnimation ───
function IdleUpdater({ vrm }: { vrm: any }) {
  const { updateAnimation, getAnimationState, switchToIdleMode } = useAnimationManager(
    vrm,
    DEFAULT_IDLE_URL,
    undefined,
    undefined,
    0
  );
  const switchedRef = useRef(false);

  useEffect(() => {
    if (!vrm || switchedRef.current) return;
    const t = setTimeout(() => {
      const state = getAnimationState();
      if (state?.hasMixer && state?.currentMode !== 'idle') {
        switchToIdleMode();
        switchedRef.current = true;
      }
    }, 100);
    return () => clearTimeout(t);
  }, [vrm, getAnimationState, switchToIdleMode]);

  useFrame((_, delta) => {
    updateAnimation(delta);
  });

  return null;
}

// ─── 在 Canvas 内：加载默认 VRM（独立实例），渲染并播 idle ───
function PreviewScene() {
  const [vrm, setVrm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vrmRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { VRMLoaderPlugin, VRMUtils } = await import('@pixiv/three-vrm');

        const loader = new GLTFLoader();
        loader.register((parser: any) => new VRMLoaderPlugin(parser));

        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(DEFAULT_PREVIEW_MODEL_URL, resolve, undefined, reject);
        });

        if (cancelled) return;

        const loadedVrm = gltf?.userData?.vrm;
        if (!loadedVrm?.scene) {
          setError('VRM 未解析');
          return;
        }

        if (loadedVrm.meta?.metaVersion === '0') {
          VRMUtils.rotateVRM0(loadedVrm);
        }

        vrmRef.current = loadedVrm;
        setVrm(loadedVrm);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      const toDispose = vrmRef.current;
      vrmRef.current = null;
      if (toDispose?.scene?.parent) toDispose.scene.parent.remove(toDispose.scene);
      if (toDispose?.scene) {
        toDispose.scene.traverse((obj: any) => {
          if (obj.geometry) obj.geometry.dispose();
          if (obj.material) {
            const m = obj.material;
            if (Array.isArray(m)) m.forEach((mat: any) => mat?.dispose?.());
            else m?.dispose?.();
          }
        });
      }
    };
  }, []);

  if (error) {
    return (
      <group>
        <mesh>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="#333" />
        </mesh>
      </group>
    );
  }

  if (loading || !vrm) {
    return null;
  }

  return (
    <group position={[0, 0, 0]} scale={1}>
      <primitive object={vrm.scene} />
      <IdleUpdater vrm={vrm} />
    </group>
  );
}

function PreviewLights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[2, 3, 2]} intensity={0.9} />
    </>
  );
}

// ─── 内层：仅客户端渲染的 Canvas ───
function PreviewCanvasInner() {
  return (
    <Canvas
      frameloop="always"
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 1, 2.2], fov: 42, near: 0.1, far: 20 }}
      onCreated={({ gl }) => {
        gl.setClearColor(0, 0, 0, 0);
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      dpr={[1, 1.5]}
    >
      <PreviewLights />
      <PreviewScene />
    </Canvas>
  );
}

const PreviewCanvas = dynamic(
  () => Promise.resolve({ default: PreviewCanvasInner }),
  { ssr: false }
);

export function OnboardingModelPreview() {
  return (
    <div className="absolute inset-0 w-full h-full rounded-lg overflow-hidden bg-transparent">
      <PreviewCanvas />
    </div>
  );
}
