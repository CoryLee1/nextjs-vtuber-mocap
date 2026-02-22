'use client';

import React, { useEffect, useRef, Suspense, memo, useMemo, useLayoutEffect } from 'react';
import { Grid, Environment, useFBX, useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { ConstellationParticles } from '@/components/canvas/ConstellationParticles';
import { SceneFbxWithGizmo } from './SceneFbxWithGizmo';
import { PRELOAD_ANIMATION_URLS, DEFAULT_IDLE_URL } from '@/config/vtuber-animations';

/** 预加载单个 FBX，填满 useLoader 缓存，切换动画时无需再等 */
const PreloadFbx = memo(({ url }: { url: string }) => {
  useFBX(url);
  return null;
});
PreloadFbx.displayName = 'PreloadFbx';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { CameraController } from '@/components/dressing-room/CameraController';
import { VRMAvatar } from '@/components/dressing-room/VRMAvatar';
import { useSceneStore } from '@/hooks/use-scene-store';
import { usePerformance } from '@/hooks/use-performance';

// PERF: 优化的加载指示器组件
const LoadingIndicator = memo(() => (
  <group position={[0, 1, 0]}>
    <mesh>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial 
        color="#3b82f6" 
        emissive="#1e40af"
        emissiveIntensity={0.5}
        transparent
        opacity={0.8}
      />
    </mesh>
  </group>
));

/** 默认环境/背景图（支持 .hdr 或 .png/.jpg 等距柱状图） */
const DEFAULT_ENV_BACKGROUND_URL = '/images/sky (3).png';

/** 根据 URL 扩展名判断是否用 HDR 专用 loader（.hdr / .exr），其余用普通贴图 */
function isHdrEnvUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.endsWith('.hdr') || u.endsWith('.exr');
}

/** 仅当 URL 为 PNG/JPG 时用贴图做背景，避免 drei Environment 只认 HDR */
const EnvBackgroundFromTexture = memo(({ url }: { url: string }) => {
  const { scene } = useThree();
  const texture = useTexture(url);
  useLayoutEffect(() => {
    const prev = scene.background;
    scene.background = texture;
    return () => {
      scene.background = prev;
      texture.dispose();
    };
  }, [scene, texture]);
  return null;
});
EnvBackgroundFromTexture.displayName = 'EnvBackgroundFromTexture';

// PERF: 网格地板组件
const GridFloor = memo(() => (
  <>
    {/* 透明地面 - 用于接收影子 */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
    
    {/* 网格地板 */}
    <Grid
      args={[20, 20]}
      cellSize={1}
      cellThickness={0.5}
      cellColor="#ffffff"
      sectionSize={5}
      sectionThickness={1}
      sectionColor="#ffffff"
      fadeDistance={25}
      fadeStrength={1}
      followCamera={false}
      infiniteGrid={true}
      opacity={0.3}
      transparent={true}
    />
  </>
));

// PERF: 优化的光照组件 - 降低阴影分辨率以提升性能
const Lighting = memo(() => (
  <>
    {/* 主要光源 - 前方 */}
    <directionalLight
      intensity={1.2}
      position={[5, 5, 5]}
      castShadow
      shadow-mapSize-width={512}
      shadow-mapSize-height={512}
      shadow-camera-far={30}
      shadow-camera-left={-8}
      shadow-camera-right={8}
      shadow-camera-top={8}
      shadow-camera-bottom={-8}
      shadow-color="#ffffff"
    />
    
    {/* 补光 - 后方 */}
    <directionalLight
      intensity={0.6}
      position={[-5, 3, -5]}
      castShadow={false}
    />
    
    {/* 顶部补光 */}
    <directionalLight
      intensity={0.4}
      position={[0, 10, 0]}
      castShadow={false}
    />
    
    {/* 环境光 */}
    <ambientLight intensity={0.4} />
  </>
));

/**
 * PERF: 主场景组件
 * 
 * 包含：
 * - 相机控制器
 * - 光照系统
 * - 网格地板
 * - VRM 角色
 * 
 * 从 useSceneStore 读取配置和模型 URL
 */
export const MainScene: React.FC = () => {
  const vrmRef = useRef<any>(null);
  // PERF: 使用 useRef 替代 useState，避免每帧触发重渲染
  const headPositionRef = useRef<[number, number, number]>([0, 1.2, 0]);
  const headPositionVec3Ref = useRef(new Vector3(0, 1.2, 0));
  // PERF: 获取性能设置
  const { settings: perfSettings } = usePerformance();
  
  // 从 store 读取状态和更新方法
  const {
    vrmModelUrl,
    animationUrl,
    nextAnimationUrl,
    cameraSettings,
    debugSettings,
    vrmModel,
    echuuCue,
    echuuAudioPlaying,
    hdrUrl,
    setVrmRef,
    setAnimationManagerRef,
    setHandDetectionStateRef,
    updateDebugSettings,
  } = useSceneStore();
  
  // PERF: 更新头部位置（用于 Autofocus）- 使用 ref 避免重渲染
  useFrame(() => {
    // 从 store 获取 VRM 模型或从 ref 获取
    const vrm = vrmModel || vrmRef.current?.userData?.vrm;
    if (vrm?.humanoid) {
      // ✅ 修复：getBoneNode() 已被弃用，优先使用 humanBones[].node，降级使用 getNormalizedBoneNode()
      let headBone: any = null;
      if (vrm.humanoid.humanBones?.['head']?.node) {
        headBone = vrm.humanoid.humanBones['head'].node;
      } else if (typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
        headBone = vrm.humanoid.getNormalizedBoneNode('head');
      }

      if (headBone) {
        headBone.getWorldPosition(headPositionVec3Ref.current);
        // PERF: 直接更新 ref，不触发重渲染
        headPositionRef.current[0] = headPositionVec3Ref.current.x;
        headPositionRef.current[1] = headPositionVec3Ref.current.y;
        headPositionRef.current[2] = headPositionVec3Ref.current.z;
      } else if (vrm.scene) {
        // 降级方案：使用场景位置
        vrm.scene.getWorldPosition(headPositionVec3Ref.current);
        headPositionVec3Ref.current.y = 1.2;
        headPositionRef.current[0] = headPositionVec3Ref.current.x;
        headPositionRef.current[1] = headPositionVec3Ref.current.y;
        headPositionRef.current[2] = headPositionVec3Ref.current.z;
      }
    }
  });

  // 传递引用给 store
  useEffect(() => {
    setVrmRef(vrmRef);
    return () => {
      setVrmRef(null);
    };
  }, [setVrmRef]);

  // 默认模型 URL
  const defaultModelUrl = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm';
  const defaultAnimationUrl = DEFAULT_IDLE_URL;

  const particleElements = useMemo(
    () => [
      { color: '#ffffff', size: 0.1, count: Math.max(8, Math.floor(perfSettings.particleCount * 0.4)) },
      { color: '#9dfeed', size: 0.06, count: Math.max(10, Math.floor(perfSettings.particleCount * 0.5)) },
      { color: '#cfff21', size: 0.05, count: Math.max(12, Math.floor(perfSettings.particleCount * 0.6)) },
    ],
    [perfSettings.particleCount]
  );

  const envUrl = hdrUrl || DEFAULT_ENV_BACKGROUND_URL;
  const useHdrEnv = isHdrEnvUrl(envUrl);

  return (
    <>
      {/* PERF: 环境/背景 - 支持 HDR(.hdr/.exr) 或 PNG/JPG 等距柱状图，默认 sky (3).png */}
      {useHdrEnv ? (
        <Environment
          files={envUrl}
          background
          resolution={perfSettings.hdrResolution}
        />
      ) : (
        <Suspense fallback={null}>
          <EnvBackgroundFromTexture url={envUrl} />
        </Suspense>
      )}

      {/* 相机控制器 */}
      <CameraController
        vrmRef={vrmRef}
        enableAutoTrack={cameraSettings.enableAutoTrack}
        enableUserControl={cameraSettings.enableUserControl}
        showHint={cameraSettings.showHint}
        useGameStyle={cameraSettings.useGameStyle}
        cameraSettings={cameraSettings}
      />

      {/* 优化的光照系统 */}
      <Lighting />

      {/* 网格地板 */}
      <GridFloor />

      {/* 场景 FBX 道具（可选，带 Gizmo 控制） */}
      <SceneFbxWithGizmo />

      {/* 预加载状态机用到的动画，切换时直接走缓存，减少消失/卡顿 */}
      <Suspense fallback={null}>
        {PRELOAD_ANIMATION_URLS.map((url) => (
          <PreloadFbx key={url} url={url} />
        ))}
      </Suspense>

      {/* VRM 角色 */}
      <group position-y={0}>
        <Suspense fallback={<LoadingIndicator />}>
          <VRMAvatar
            ref={vrmRef}
            modelUrl={vrmModelUrl || defaultModelUrl}
            animationUrl={animationUrl || defaultAnimationUrl}
            nextAnimationUrl={nextAnimationUrl}
            scale={1}
            position={[0, 0, 0]}
            showBones={debugSettings.showBones}
            showDebug={debugSettings.showDebug}
            testSettings={debugSettings}
            showArmAxes={debugSettings.showArmAxes}
            axisSettings={debugSettings.axisSettings || {}}
            debugAxisConfig={debugSettings.debugAxisConfig}
            handDebugAxisConfig={debugSettings.handDebugAxisConfig}
            onAxisChange={(config) => {
              updateDebugSettings({
                debugAxisConfig: config,
              });
            }}
            onHandAxisChange={(config) => {
              updateDebugSettings({
                handDebugAxisConfig: config,
              });
            }}
            onRiggedPoseUpdate={(pose: any) => {
              // 可以在这里处理 riggedPose 更新
            }}
            onRiggedHandUpdate={(leftHand: any, rightHand: any) => {
              // 可以在这里处理 riggedHand 更新
            }}
            onAnimationManagerRef={setAnimationManagerRef}
            onHandDetectionStateRef={setHandDetectionStateRef}
            onMocapStatusUpdate={(status: any) => {
              // 可以在这里处理 mocap 状态更新
            }}
            echuuCue={echuuCue}
            echuuAudioPlaying={echuuAudioPlaying}
          />
        </Suspense>
      </group>
      
      {/* 星座粒子：可定义多种元素，近距离粒子拖尾连线发光 */}
      {perfSettings.sparkles && (
        <ConstellationParticles
          elements={particleElements}
          lineMaxDistance={1.8}
          lineMaxNeighbors={4}
          lineOpacity={0.4}
          lineColor="#88ddff"
          scale={2}
          position={[0, 1.2, 0]}
          drift
        />
      )}
      
      {/* 后期处理已暂时禁用，避免 postprocessing addPass 时 alpha 为 null 报错 */}
    </>
  );
};

