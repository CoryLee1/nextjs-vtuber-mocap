'use client';

import React, { createContext, useContext, useEffect, useState, useRef, Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stage, useFBX, useGLTF } from '@react-three/drei';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
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
  // onAnimationPlayingRef 保留以兼容，但 360° 旋转已改为模型旋转、始终启用
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
    IDLE_NEXT_URL,
    IDLE_NEXT_URL,
    0.12
  );
  // 与主场景 VRMAvatar 一致：hasMixer 时主动 switchToIdleMode 启动动画，并启用 360° 旋转
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
  }, [vrm, getAnimationState, switchToIdleMode, forceIdleRestart]);

  // 轮询检查动画状态：首次 500ms 后开始，每 400ms 重试，直到得到明确结果（playing/fallback/error）
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
        return true; // 已解决，停止轮询
      }

      // 与 VRMAvatar 一致：hasMixer 时主动启动，避免漏启动
      if (state?.hasMixer && (state.currentMode !== 'idle' || !state.isPlayingIdle)) {
        switchToIdleMode();
        forceIdleRestart();
        return false; // 继续轮询等待 animationReady
      }

      if (state?.isLoading) return false; // 仍在加载，继续轮询

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
      return true; // 已报告 fallback/error，停止轮询
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
  });

  return null;
}

// ─── 在 Canvas 内：与主场景一致用 useGLTF 加载 VRM，Suspense 保证模型就绪后再渲染动画 ───
function PreviewScene({
  animationUrl,
  onAnimationStatusChange,
}: {
  animationUrl?: string;
  onAnimationStatusChange?: (status: OnboardingPreviewAnimationStatus) => void;
}) {
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

  // 360° 展示：模型父 group 旋转，不依赖动画状态，始终启用
  useFrame((_, delta) => {
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.rotation.y += delta * 0.55;
    }
  });

  if (!vrm?.scene) {
    return null;
  }

  const cfg = usePreviewConfig();
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

// ─── 镜头控制：Stage adjustCamera=false 时由此处设置固定机位 ───
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
function PreviewCanvasInner({
  animationUrl,
  onAnimationStatusChange,
}: {
  animationUrl?: string;
  onAnimationStatusChange?: (status: OnboardingPreviewAnimationStatus) => void;
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
        <PreviewScene animationUrl={animationUrl} onAnimationStatusChange={onAnimationStatusChange} />
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
  /** 预览动画状态变更回调：用于引导页显示 Playing / Fallback 指示 */
  onAnimationStatusChange?: (status: OnboardingPreviewAnimationStatus) => void;
}

export function OnboardingModelPreview({
  previewConfig = null,
  animationUrl,
  onAnimationStatusChange,
}: OnboardingModelPreviewProps) {
  const value = previewConfig ?? DEFAULT_ONBOARDING_PREVIEW_CONFIG;
  return (
    <PreviewConfigContext.Provider value={value}>
      <div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full rounded-lg overflow-hidden bg-transparent">
        <PreviewCanvas animationUrl={animationUrl} onAnimationStatusChange={onAnimationStatusChange} />
      </div>
    </PreviewConfigContext.Provider>
  );
}
