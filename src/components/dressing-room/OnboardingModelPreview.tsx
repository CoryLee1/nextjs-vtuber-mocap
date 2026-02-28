'use client';

import React, { createContext, useContext, useEffect, useState, useRef, Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stage, useFBX, useGLTF } from '@react-three/drei';
import { Box3 } from 'three';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import {
  DEFAULT_PREVIEW_MODEL_URL,
  IDLE_ROTATION_ANIMATIONS,
  ONBOARDING_PREVIEW_ANIMATION_URLS,
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
  cameraY: 0,
  cameraZ: 3.5,
  cameraRotationX: 0,
  cameraRotationY: 0,
  cameraRotationZ: 0,
  fov: 40,
  modelScale: 1.0,
  groupPosY: 0,
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

export interface OnboardingPreviewAnimationStatus {
  phase: 'loading' | 'playing' | 'fallback' | 'error';
  effectiveAnimationUrl: string;
  requestedAnimationUrl: string;
  fallbackLevel: number;
  reason?: string;
}

// ─── 在 Canvas 内：与主场景一致用 useAnimationManager，便于统一管理 additive/状态机 ───
function IdleUpdater({
  vrm,
  animationUrl,
  onAnimationStatusChange,
  onAnimationPlayingRef,
}: {
  vrm: any;
  animationUrl?: string;
  onAnimationStatusChange?: (status: OnboardingPreviewAnimationStatus) => void;
  onAnimationPlayingRef?: React.MutableRefObject<boolean>;
}) {
  const requestedAnimationUrl = animationUrl || ONBOARDING_PREVIEW_LOOP_URL || IDLE_URL;
  const [effectiveAnimationUrl, setEffectiveAnimationUrl] = useState<string>(requestedAnimationUrl);
  const fallbackChainRef = useRef<string[]>([IDLE_URL, IDLE_NEXT_URL].filter((u, i, arr) => Boolean(u) && arr.indexOf(u) === i));
  const fallbackLevelRef = useRef(0);
  const reportedPlayingRef = useRef(false);

  useEffect(() => {
    fallbackLevelRef.current = 0;
    reportedPlayingRef.current = false;
    setEffectiveAnimationUrl(requestedAnimationUrl);
    onAnimationStatusChange?.({
      phase: 'loading',
      effectiveAnimationUrl: requestedAnimationUrl,
      requestedAnimationUrl,
      fallbackLevel: 0,
    });
  }, [requestedAnimationUrl, onAnimationStatusChange]);

  const { updateAnimation, getAnimationState, switchToIdleMode, forceIdleRestart } = useAnimationManager(
    vrm,
    effectiveAnimationUrl,
    IDLE_NEXT_URL
  );

  useEffect(() => {
    if (!vrm?.scene || !vrm?.humanoid) return;
    const tryStart = (attempt = 1, max = 8) => {
      const state = getAnimationState();
      if (state?.hasMixer) {
        if (state.currentMode !== 'idle' || !state.isPlayingIdle) {
          switchToIdleMode();
          forceIdleRestart();
        }
        return;
      }
      if (attempt < max) setTimeout(() => tryStart(attempt + 1, max), 250);
    };
    const t = setTimeout(() => tryStart(), 200);
    return () => clearTimeout(t);
  }, [vrm, effectiveAnimationUrl, getAnimationState, switchToIdleMode, forceIdleRestart]);

  useEffect(() => {
    if (!vrm) return;
    const check = () => {
      const state = getAnimationState();
      const animationReady =
        Boolean(state?.hasPlayableIdleAction) &&
        Boolean(state?.idleActionRunning) &&
        state?.currentMode === 'idle' &&
        (state?.lastMappedTrackCount ?? 0) > 0;

      if (animationReady) {
        if (state.currentMode !== 'idle') switchToIdleMode();
        forceIdleRestart();
        if (!reportedPlayingRef.current) {
          const phase = fallbackLevelRef.current > 0 ? 'fallback' : 'playing';
          onAnimationStatusChange?.({
            phase,
            effectiveAnimationUrl,
            requestedAnimationUrl,
            fallbackLevel: fallbackLevelRef.current,
            reason: fallbackLevelRef.current > 0 ? 'step animation unavailable, fallback applied' : undefined,
          });
          reportedPlayingRef.current = true;
        }
        return true;
      }

      if (state?.hasMixer && (state.currentMode !== 'idle' || !state.isPlayingIdle)) {
        switchToIdleMode();
        forceIdleRestart();
        return false;
      }

      if (state?.isLoading) return false;

      const nextFallback = fallbackChainRef.current[fallbackLevelRef.current];
      if (nextFallback && effectiveAnimationUrl !== nextFallback) {
        fallbackLevelRef.current += 1;
        reportedPlayingRef.current = false;
        setEffectiveAnimationUrl(nextFallback);
        onAnimationStatusChange?.({
          phase: 'fallback',
          effectiveAnimationUrl: nextFallback,
          requestedAnimationUrl,
          fallbackLevel: fallbackLevelRef.current,
          reason: `retarget failed: mapped=${state?.lastMappedTrackCount ?? 0}, raw=${state?.lastRawTrackCount ?? 0}`,
        });
      } else {
        onAnimationStatusChange?.({
          phase: 'error',
          effectiveAnimationUrl,
          requestedAnimationUrl,
          fallbackLevel: fallbackLevelRef.current,
          reason: `all fallbacks exhausted: mapped=${state?.lastMappedTrackCount ?? 0}, raw=${state?.lastRawTrackCount ?? 0}`,
        });
      }
      return true;
    };

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const t1 = setTimeout(() => {
      if (check()) return;
      intervalId = setInterval(() => {
        if (check() && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 400);
    }, 500);
    return () => {
      clearTimeout(t1);
      if (intervalId) clearInterval(intervalId);
    };
  }, [vrm, getAnimationState, switchToIdleMode, forceIdleRestart, effectiveAnimationUrl, requestedAnimationUrl, onAnimationStatusChange]);

  useFrame((_, delta) => {
    updateAnimation(delta);
    // vrm.update() propagates normalized bone changes (from the mixer) to the actual
    // mesh skeleton. Without this, AnimationMixer writes to normalized nodes but the
    // visible mesh stays in T-pose. VRMAvatar normally calls this, but it is not
    // rendered during onboarding (isOnboardingActive guard), so we call it here.
    vrm?.update?.(delta);
  });

  return null;
}

// ─── 在 Canvas 内：加载 VRM，自动计算包围盒适配镜头，避免头部截断 ───
function PreviewScene({
  animationUrl,
  onAnimationStatusChange,
  onModelReady,
}: {
  animationUrl?: string;
  onAnimationStatusChange?: (status: OnboardingPreviewAnimationStatus) => void;
  onModelReady?: () => void;
}) {
  // All hooks MUST be called before any early return
  const cfg = usePreviewConfig();
  const { camera } = useThree();
  const rotatingGroupRef = useRef<any>(null);
  const preloadedUrl = useSceneStore((s) => s.preloadedPreviewModelUrl);
  const sceneModelUrl = useSceneStore((s) => s.vrmModelUrl);
  const previewModelUrl = sceneModelUrl || preloadedUrl || DEFAULT_PREVIEW_MODEL_URL;

  const gltf = useGLTF(previewModelUrl, undefined, undefined, (loader: any) => {
    loader.register((parser: any) => new VRMLoaderPlugin(parser));
  });
  const vrm = gltf?.userData?.vrm;

  useEffect(() => {
    if (vrm?.meta?.metaVersion === '0') {
      VRMUtils.rotateVRM0(vrm);
    }
  }, [vrm]);

  // Auto-fit: after VRM loads, compute world-space bounding box and position camera
  // so the full model (head-to-toe) is always visible regardless of model height.
  useEffect(() => {
    if (!vrm?.scene) return;

    // Wait one animation frame for Stage's <Center> to apply its offset
    const rafId = requestAnimationFrame(() => {
      const group = rotatingGroupRef.current;
      if (!group) return;

      // Temporarily reset rotation for an axis-aligned bounding box
      const savedRotY = group.rotation.y;
      group.rotation.y = 0;

      const box = new Box3().setFromObject(group);
      group.rotation.y = savedRotY;

      if (box.isEmpty()) return;

      const height = box.max.y - box.min.y;
      if (height < 0.1) return;

      const centerY = (box.min.y + box.max.y) / 2;

      // Compute camera Z so full model height + 10% padding fits in vertical FOV
      const fovRad = degToRad(cfg.fov);
      const paddedHalf = (height / 2) * 1.10;
      const camZ = Math.max(paddedHalf / Math.tan(fovRad / 2), 2.0);

      camera.position.set(0, centerY, camZ);
      camera.rotation.set(0, 0, 0);
      camera.fov = cfg.fov;
      camera.updateProjectionMatrix();

      onModelReady?.();
    });

    return () => cancelAnimationFrame(rafId);
  }, [vrm, cfg.fov, camera, onModelReady]);

  // 360° rotation
  useFrame((_, delta) => {
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.rotation.y += delta * 0.55;
    }
  });

  if (!vrm?.scene) return null;

  return (
    <Stage
      preset="rembrandt"
      intensity={cfg.stageIntensity}
      environment="studio"
      adjustCamera={false}
      shadows={false}
      center
    >
      <group ref={rotatingGroupRef} position={[0, cfg.groupPosY, 0]} scale={cfg.modelScale}>
        <primitive object={vrm.scene} />
      </group>
      <ambientLight intensity={cfg.ambientIntensity} />
      <IdleUpdater
        vrm={vrm}
        animationUrl={animationUrl}
        onAnimationStatusChange={onAnimationStatusChange}
      />
    </Stage>
  );
}

// ─── 内层：仅客户端渲染的 Canvas ───
function PreviewCanvasInner({
  animationUrl,
  onAnimationStatusChange,
  onModelReady,
}: {
  animationUrl?: string;
  onAnimationStatusChange?: (status: OnboardingPreviewAnimationStatus) => void;
  onModelReady?: () => void;
}) {
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
      <Suspense fallback={null}>
        {/* Step1/2/3 动画统一预加载，避免切换时 useFBX suspend 导致 Stage 重载 */}
        {ONBOARDING_PREVIEW_ANIMATION_URLS.map((url) => (
          <PreloadFbx key={url} url={url} />
        ))}
        {PRELOAD_ANIMATION_URLS.map((url) => (
          <PreloadFbx key={url} url={url} />
        ))}
        <PreviewScene
          animationUrl={animationUrl}
          onAnimationStatusChange={onAnimationStatusChange}
          onModelReady={onModelReady}
        />
      </Suspense>
    </Canvas>
  );
}

const PreviewCanvas = dynamic(
  () => Promise.resolve({ default: PreviewCanvasInner }),
  { ssr: false }
);

interface OnboardingModelPreviewProps {
  /** 镜头/场景调试参数，不传则用默认；与引导页 ?previewDebug=1 面板联动；Step1/2/3 统一沿用 */
  previewConfig?: OnboardingPreviewConfig | null;
  /** 指定当前步骤预览动画；重定向失败会自动回退 Idle */
  animationUrl?: string;
  /** 预览动画状态变更回调：用于引导页显示 Playing / Fallback 指示 */
  onAnimationStatusChange?: (status: OnboardingPreviewAnimationStatus) => void;
}

export function OnboardingModelPreview({
  previewConfig = null,
  animationUrl,
  onAnimationStatusChange,
}: OnboardingModelPreviewProps) {
  const value = previewConfig ?? DEFAULT_ONBOARDING_PREVIEW_CONFIG;

  // Track when the model is ready (auto-fit ran) to hide the loading spinner
  const [modelReady, setModelReady] = useState(false);
  const sceneModelUrl = useSceneStore((s) => s.vrmModelUrl);

  // Reset loading indicator when the user selects a different model
  useEffect(() => {
    setModelReady(false);
  }, [sceneModelUrl]);

  return (
    <PreviewConfigContext.Provider value={value}>
      <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full rounded-lg overflow-hidden bg-transparent">
        {/* Spinner shown while model loads / auto-fit runs */}
        {!modelReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          </div>
        )}
        <PreviewCanvas
          animationUrl={animationUrl}
          onAnimationStatusChange={onAnimationStatusChange}
          onModelReady={() => setModelReady(true)}
        />
      </div>
    </PreviewConfigContext.Provider>
  );
}
