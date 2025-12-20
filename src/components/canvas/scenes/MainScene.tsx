'use client';

import React, { useEffect, useRef, Suspense } from 'react';
import { Grid, Environment } from '@react-three/drei';
import { CameraController } from '@/components/dressing-room/CameraController';
import { VRMAvatar } from '@/components/dressing-room/VRMAvatar';
import { useSceneStore } from '@/hooks/use-scene-store';

// 优化的加载指示器组件
const LoadingIndicator = () => (
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
);

// 网格地板组件
const GridFloor = () => (
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
);

// 优化的光照组件
const Lighting = () => (
  <>
    {/* 主要光源 - 前方 */}
    <directionalLight
      intensity={1.2}
      position={[5, 5, 5]}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-far={50}
      shadow-camera-left={-10}
      shadow-camera-right={10}
      shadow-camera-top={10}
      shadow-camera-bottom={-10}
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
);

/**
 * 主场景组件
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
  
  // 从 store 读取状态和更新方法
  const {
    vrmModelUrl,
    animationUrl,
    cameraSettings,
    debugSettings,
    setVrmRef,
    setAnimationManagerRef,
    setHandDetectionStateRef,
    updateDebugSettings,
  } = useSceneStore();

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
      {/* HDR 环境贴图 */}
      <Environment
        files="/HDR_IntoTheClouds.hdr"
        background
        resolution={256}
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
          />
        </Suspense>
      </group>
    </>
  );
};

