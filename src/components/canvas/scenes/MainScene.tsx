'use client';

import React, { useEffect, useRef, Suspense, memo } from 'react';
import { Grid, Environment, Sparkles } from '@react-three/drei';
import { SceneFbxWithGizmo } from './SceneFbxWithGizmo';
import { PostEffectsWithAutofocus } from '@/components/post-processing/PostEffectsWithAutofocus';
import { usePostProcessingSettings } from '@/hooks/use-post-processing-settings';
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
  const { settings: postProcessingSettings } = usePostProcessingSettings();
  // PERF: 获取性能设置
  const { settings: perfSettings } = usePerformance();
  
  // 从 store 读取状态和更新方法
  const {
    vrmModelUrl,
    animationUrl,
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
  const defaultAnimationUrl = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Idle.fbx';

  return (
    <>
      {/* PERF: HDR 环境贴图 - 侧栏可选/上传，无则默认 */}
      <Environment
        files={hdrUrl || '/images/SKY.hdr'}
        background
        resolution={perfSettings.hdrResolution}
      />

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

      {/* VRM 角色 */}
      <group position-y={0}>
        <Suspense fallback={<LoadingIndicator />}>
          <VRMAvatar
            ref={vrmRef}
            modelUrl={vrmModelUrl || defaultModelUrl}
            animationUrl={animationUrl || defaultAnimationUrl}
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
      
      {/* PERF: Sparkles 特效 - 根据性能模式控制 */}
      {perfSettings.sparkles && (
        <Sparkles
          count={perfSettings.particleCount}
          scale={2}
          size={2.5}
          speed={0.3}
          color="#ffffff"
          position={[0, 1.2, 0]}
        />
      )}
      
      {/* PERF: 后期处理 - 根据性能模式控制 */}
      {perfSettings.postProcessing && (
        <PostEffectsWithAutofocus
          autofocusTarget={headPositionRef.current}
          settings={postProcessingSettings}
        />
      )}
    </>
  );
};

