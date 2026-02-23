'use client';

import React, { createContext, useContext, useEffect, useState, useRef, Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stage, useFBX } from '@react-three/drei';
import {
  DEFAULT_PREVIEW_MODEL_URL,
  IDLE_ROTATION_ANIMATIONS,
  PRELOAD_ANIMATION_URLS,
} from '@/config/vtuber-animations';
import { useAnimationManager } from '@/lib/animation-manager';
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';
import { useSceneStore } from '@/hooks/use-scene-store';

/** 预加载 FBX，与主场景一致，保证 useAnimationManager 的 useFBX 命中缓存 */
const PreloadFbx = memo(({ url }: { url: string }) => {
  useFBX(url);
  return null;
});
PreloadFbx.displayName = 'PreloadFbx';

/** 引导页 3D 预览镜头/场景可调参数（调试面板用） */
export interface OnboardingPreviewConfig {
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  /** 镜头旋转（度）：X=俯仰(负值仰视) Y=偏航 Z=滚转 */
  cameraRotationX: number;
  cameraRotationY: number;
  cameraRotationZ: number;
  fov: number;
  modelScale: number;
  groupPosY: number;
  adjustCamera: number;
  stageIntensity: number;
  ambientIntensity: number;
}

function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export const DEFAULT_ONBOARDING_PREVIEW_CONFIG: OnboardingPreviewConfig = {
  cameraX: 0,
  cameraY: 1.5,
  cameraZ: 2.5,
  cameraRotationX: -10,
  cameraRotationY: 0,
  cameraRotationZ: 0,
  fov: 42,
  modelScale: 1.1,
  groupPosY: -1.1,
  adjustCamera: 0.5,
  stageIntensity: 2.1,
  ambientIntensity: 1.5,
};

const PreviewConfigContext = createContext<OnboardingPreviewConfig | null>(null);

function usePreviewConfig() {
  return useContext(PreviewConfigContext) ?? DEFAULT_ONBOARDING_PREVIEW_CONFIG;
}

/** 引导页占位区用：透明背景、播 idle 的 3D 预览。与主场景一致使用 useAnimationManager（idle 轮播 + additive 同源）。 */

const IDLE_URL = IDLE_ROTATION_ANIMATIONS[0]?.url ?? getS3ObjectReadUrlByKey('animations/Idle.fbx', { proxy: true });
const IDLE_NEXT_URL = IDLE_ROTATION_ANIMATIONS[1]?.url ?? IDLE_ROTATION_ANIMATIONS[0]?.url ?? getS3ObjectReadUrlByKey('animations/Idle.fbx', { proxy: true });
const ONBOARDING_PREVIEW_LOOP_URL = getS3ObjectReadUrlByKey('animations/Standing Greeting (1).fbx', { proxy: true });

// ─── 在 Canvas 内：与主场景一致用 useAnimationManager，便于统一管理 additive/状态机 ───
function IdleUpdater({ vrm, animationUrl }: { vrm: any; animationUrl?: string }) {
  const [effectiveAnimationUrl, setEffectiveAnimationUrl] = useState<string>(animationUrl || ONBOARDING_PREVIEW_LOOP_URL || IDLE_URL);

  useEffect(() => {
    setEffectiveAnimationUrl(animationUrl || ONBOARDING_PREVIEW_LOOP_URL || IDLE_URL);
  }, [animationUrl]);

  const { updateAnimation, getAnimationState, switchToIdleMode, forceIdleRestart } = useAnimationManager(
    vrm,
    effectiveAnimationUrl,
    IDLE_NEXT_URL,
    undefined,
    0
  );
  const switchedRef = useRef(false);

  useEffect(() => {
    if (!vrm) return;
    const t = setTimeout(() => {
      const state = getAnimationState();
      if (state?.hasMixer) {
        if (state.currentMode !== 'idle') switchToIdleMode();
        forceIdleRestart();
        switchedRef.current = true;
      } else if (state?.error && effectiveAnimationUrl !== IDLE_URL) {
        // 目标动画重定向失败时自动回退 Idle，避免一直 T-pose。
        setEffectiveAnimationUrl(IDLE_URL);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [vrm, getAnimationState, switchToIdleMode, forceIdleRestart, effectiveAnimationUrl]);

  useFrame((_, delta) => {
    updateAnimation(delta);
  });

  return null;
}

// ─── 在 Canvas 内：加载默认 VRM（独立实例），动画由 useAnimationManager 驱动 ───
function PreviewScene({ animationUrl }: { animationUrl?: string }) {
  const [vrm, setVrm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const vrmRef = useRef<any>(null);
  const rotatingGroupRef = useRef<any>(null);
  const preloadedUrl = useSceneStore((s) => s.preloadedPreviewModelUrl);
  const sceneModelUrl = useSceneStore((s) => s.vrmModelUrl);
  // 用户选择的模型优先；未选择时用预加载的默认模型
  const previewModelUrl = sceneModelUrl || preloadedUrl || DEFAULT_PREVIEW_MODEL_URL;
  const fallbackPublicDefaultModelUrl = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm';

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

        const candidateUrls = [previewModelUrl, fallbackPublicDefaultModelUrl].filter(
          (url, idx, arr) => Boolean(url) && arr.indexOf(url) === idx
        );

        let gltf: any = null;
        let lastError: unknown = null;

        for (const candidateUrl of candidateUrls) {
          try {
            gltf = await new Promise<any>((resolve, reject) => {
              loader.load(candidateUrl, resolve, undefined, reject);
            });
            if (gltf) break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!gltf) {
          throw lastError ?? new Error('VRM load failed');
        }

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
  }, [previewModelUrl]);

  useFrame((_, delta) => {
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.rotation.y += delta * 0.55;
    }
  });

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

  const cfg = usePreviewConfig();
  return (
      <Stage
        preset="rembrandt"
        intensity={cfg.stageIntensity}
        environment="studio"
        adjustCamera={cfg.adjustCamera}
        shadows={false}
        center
    >
      <group ref={rotatingGroupRef} position={[0, cfg.groupPosY, 0]} scale={cfg.modelScale}>
        <primitive object={vrm.scene} />
      </group>
      <ambientLight intensity={cfg.ambientIntensity} />
      <IdleUpdater vrm={vrm} animationUrl={animationUrl} />
    </Stage>
  );
}

// ─── 每帧应用镜头位置与旋转，覆盖 Stage 对相机的修改，保证平视/俯仰可调 ───
function CameraController() {
  const cfg = usePreviewConfig();
  const { camera } = useThree();
  useFrame(() => {
    camera.position.set(cfg.cameraX, cfg.cameraY, cfg.cameraZ);
    camera.rotation.order = 'XYZ';
    camera.rotation.x = degToRad(cfg.cameraRotationX);
    camera.rotation.y = degToRad(cfg.cameraRotationY);
    camera.rotation.z = degToRad(cfg.cameraRotationZ);
    camera.fov = cfg.fov;
    camera.updateProjectionMatrix();
  });
  return null;
}

// ─── 内层：仅客户端渲染的 Canvas ───
function PreviewCanvasInner({ animationUrl }: { animationUrl?: string }) {
  const cfg = usePreviewConfig();
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
      camera={{
        position: [cfg.cameraX, cfg.cameraY, cfg.cameraZ],
        rotation: [degToRad(cfg.cameraRotationX), degToRad(cfg.cameraRotationY), degToRad(cfg.cameraRotationZ)],
        fov: cfg.fov,
        near: 0.1,
        far: 30,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor(0, 0, 0, 0);
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      dpr={[1, 1.5]}
    >
      <CameraController />
      <Suspense fallback={null}>
        <PreloadFbx url={ONBOARDING_PREVIEW_LOOP_URL} />
        {animationUrl && animationUrl !== ONBOARDING_PREVIEW_LOOP_URL && (
          <PreloadFbx url={animationUrl} />
        )}
        {PRELOAD_ANIMATION_URLS.map((url) => (
          <PreloadFbx key={url} url={url} />
        ))}
        <PreviewScene animationUrl={animationUrl} />
      </Suspense>
    </Canvas>
  );
}

const PreviewCanvas = dynamic(
  () => Promise.resolve({ default: PreviewCanvasInner }),
  { ssr: false }
);

interface OnboardingModelPreviewProps {
  /** 镜头/场景调试参数，不传则用默认；与引导页 ?previewDebug=1 面板联动 */
  previewConfig?: OnboardingPreviewConfig | null;
  /** 指定当前步骤预览动画；重定向失败会自动回退 Idle */
  animationUrl?: string;
}

export function OnboardingModelPreview({ previewConfig = null, animationUrl }: OnboardingModelPreviewProps) {
  const value = previewConfig ?? DEFAULT_ONBOARDING_PREVIEW_CONFIG;
  return (
    <PreviewConfigContext.Provider value={value}>
      <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full rounded-lg overflow-hidden bg-transparent">
        <PreviewCanvas animationUrl={animationUrl} />
      </div>
    </PreviewConfigContext.Provider>
  );
}
