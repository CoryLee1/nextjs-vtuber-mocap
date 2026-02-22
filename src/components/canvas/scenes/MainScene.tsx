'use client';

import React, { useEffect, useRef, Suspense, memo, useLayoutEffect } from 'react';
import { Grid, Environment, useFBX, useTexture, Cloud, Clouds } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
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

// 加载占位：单朵 drei 粒子云（替代原蓝色球）
const LoadingIndicator = memo(() => (
  <group position={[0, 1, 0]}>
    <Clouds limit={80} material={THREE.MeshBasicMaterial}>
      <Cloud
        segments={24}
        bounds={[0.5, 0.25, 0.25]}
        volume={2}
        color="#e0f2fe"
        opacity={0.9}
        speed={0.3}
        growth={2}
      />
    </Clouds>
  </group>
));

/** 默认环境/背景图（支持 .hdr 或 .png/.jpg 等距柱状图） */
const DEFAULT_ENV_BACKGROUND_URL = '/images/sky (3).png';

/** 根据 URL 扩展名判断是否用 HDR 专用 loader（.hdr / .exr），其余用普通贴图 */
function isHdrEnvUrl(url: string): boolean {
  const u = url.toLowerCase();
  return u.endsWith('.hdr') || u.endsWith('.exr');
}

/** PNG/JPG 等距柱状图做 360° 背景：设置 mapping 后 Three 会按球面采样 */
const EnvBackgroundFromTexture = memo(({ url, intensity = 1, rotationDeg = 0 }: { url: string; intensity?: number; rotationDeg?: number }) => {
  const { scene } = useThree();
  const texture = useTexture(url);
  useLayoutEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    const prevBg = scene.background;
    const prevIntensity = (scene as any).backgroundIntensity;
    const prevRotation = (scene as any).backgroundRotation;
    scene.background = texture;
    if (typeof (scene as any).backgroundIntensity !== 'undefined') (scene as any).backgroundIntensity = intensity;
    if (typeof (scene as any).backgroundRotation !== 'undefined') {
      (scene as any).backgroundRotation = new THREE.Euler(0, (rotationDeg * Math.PI) / 180, 0, 'XYZ');
    }
    return () => {
      scene.background = prevBg;
      if (typeof prevIntensity !== 'undefined') (scene as any).backgroundIntensity = prevIntensity;
      if (typeof prevRotation !== 'undefined') (scene as any).backgroundRotation = prevRotation;
      texture.dispose();
    };
  }, [scene, texture, intensity, rotationDeg]);
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

// ─── 主场景光源（只照到角色/地板，不照天空）────────────────────────────────────────
// 天空是 scene.background 贴图，不参与光照计算；天空发灰/饱和度低来自色调映射，见下。
//
// 1. 主方向光：右前上方 [5,5,5]，投阴影（512 阴影贴图）
// 2. 补光：左后 [-5,3,-5]，不投阴影
// 3. 顶光：[0,10,0]，不投阴影
// 4. 环境光：无方向（略提亮人物）
const Lighting = memo(() => (
  <>
    <directionalLight
      intensity={1.5}
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
    <directionalLight intensity={0.75} position={[-5, 3, -5]} castShadow={false} />
    <directionalLight intensity={0.5} position={[0, 10, 0]} castShadow={false} />
    <ambientLight intensity={0.52} />
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
    envBackgroundIntensity,
    envBackgroundRotation,
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

  const envUrl = hdrUrl || DEFAULT_ENV_BACKGROUND_URL;
  const useHdrEnv = isHdrEnvUrl(envUrl);

  return (
    <>
      {/* PERF: 环境/背景 - 支持 HDR(.hdr/.exr) 或 PNG/JPG 等距柱状图，默认 sky (3).png */}
      {useHdrEnv ? (
        <Environment
          files={envUrl}
          background
          backgroundIntensity={envBackgroundIntensity}
          backgroundRotation={[0, (envBackgroundRotation * Math.PI) / 180, 0]}
          resolution={perfSettings.hdrResolution}
        />
      ) : (
        <Suspense fallback={null}>
          <EnvBackgroundFromTexture url={envUrl} intensity={envBackgroundIntensity} rotationDeg={envBackgroundRotation} />
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
      
      {/* 后期处理已暂时禁用，避免 postprocessing addPass 时 alpha 为 null 报错 */}
    </>
  );
};

