import React, { useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { VRMAvatar } from './VRMAvatar';
import { CameraController } from './CameraController';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { ArmDebugPanel } from './ArmDebugPanel';
import { Environment, OrbitControls, Loader, Grid } from '@react-three/drei';
import { Vector3, MathUtils, Group } from 'three';
import { VTuberState, CameraSettings } from '@/types';
import { usePerformance } from '@/hooks/use-performance';

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
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
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

// 场景组件
interface VTuberSceneProps {
  selectedModel: any;
  selectedAnimation: any;
  showBones: boolean;
  debugSettings: any;
  showArmAxes: boolean;
  axisSettings: any;
  cameraSettings: CameraSettings;
  onVrmRef: (ref: any) => void;
  onAnimationManagerRef: (manager: any) => void;
  onHandDetectionStateRef: (state: any) => void;
  onMocapStatusUpdate: (status: any) => void;
  debugAxisConfig?: any; // 新增：调试面板坐标轴配置
  handDebugAxisConfig?: any; // 新增：手部调试面板坐标轴配置
  onAxisChange?: (config: any) => void; // 新增：坐标轴配置变化回调
  onHandAxisChange?: (config: any) => void; // 新增：手部坐标轴配置变化回调
  onRiggedPoseUpdate?: (pose: any) => void; // 新增：riggedPose更新回调
  onRiggedHandUpdate?: (leftHand: any, rightHand: any) => void; // 新增：riggedHand更新回调
}

export const VTuberScene: React.FC<VTuberSceneProps> = ({
  selectedModel,
  selectedAnimation,
  showBones,
  debugSettings,
  showArmAxes,
  axisSettings,
  cameraSettings,
  onVrmRef,
  onAnimationManagerRef,
  onHandDetectionStateRef,
  onMocapStatusUpdate,
  debugAxisConfig,
  handDebugAxisConfig,
  onAxisChange,
  onHandAxisChange,
  onRiggedPoseUpdate,
  onRiggedHandUpdate
}) => {
  const vrmRef = useRef<Group | null>(null);

  // 传递引用给父组件
  useEffect(() => {
    if (onVrmRef) {
      onVrmRef(vrmRef);
    }
  }, [onVrmRef]);

  return (
    <>
      {/* 设置场景背景色 */}
      <color attach="background" args={['#0036FF']} />
      
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
            modelUrl={selectedModel?.url || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm'}
            animationUrl={selectedAnimation?.url || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Idle.fbx'}
            scale={1}
            position={[0, 0, 0]}
            showBones={showBones}
            showDebug={debugSettings?.showDebug || false}
            testSettings={debugSettings}
            showArmAxes={showArmAxes}
            axisSettings={axisSettings}
            debugAxisConfig={debugAxisConfig}
            handDebugAxisConfig={handDebugAxisConfig}
            onAxisChange={onAxisChange}
            onHandAxisChange={onHandAxisChange}
            onRiggedPoseUpdate={(pose: any) => {
              onRiggedPoseUpdate?.(pose);
            }}
            onRiggedHandUpdate={(leftHand: any, rightHand: any) => {
              onRiggedHandUpdate?.(leftHand, rightHand);
            }}
            onAnimationManagerRef={onAnimationManagerRef}
            onHandDetectionStateRef={onHandDetectionStateRef}
            onMocapStatusUpdate={onMocapStatusUpdate}
          />
        </Suspense>
      </group>

      {/* 优化的后处理效果 */}
      {/* 暂时禁用Bloom效果以避免运行时错误 */}
      {/* <EffectComposer>
        <Bloom 
          intensity={0.3} 
          luminanceThreshold={0.7}
          luminanceSmoothing={0.9}
          mipmapBlur={false}
        />
      </EffectComposer> */}
    </>
  );
};

// 主场景容器
interface VTuberSceneContainerProps {
  sceneProps: VTuberSceneProps;
}

export const VTuberSceneContainer: React.FC<VTuberSceneContainerProps> = ({ sceneProps }) => {
  const riggedPoseRef = useRef(null);
  const riggedLeftHandRef = useRef(null);
  const riggedRightHandRef = useRef(null);
  
  // 使用性能设置
  const { settings } = usePerformance();
  
  // 根据性能设置计算DPR
  const getDPR = () => {
    switch (settings.quality) {
      case 'low':
        return [0.5, 1];
      case 'high':
        return [1, 2];
      case 'medium':
      default:
        return [0.75, 1.5];
    }
  };
  
  // 根据分辨率设置计算DPR
  const getResolutionDPR = () => {
    const baseDPR = getDPR();
    const resolutionMultiplier = settings.resolution;
    return [
      Math.max(0.5, baseDPR[0] * resolutionMultiplier),
      Math.max(1, baseDPR[1] * resolutionMultiplier)
    ];
  };
  
  // 调试面板坐标轴配置状态
  const [debugAxisConfig, setDebugAxisConfig] = React.useState({
    leftArm: { x: -1, y: 1, z: -1 },
    rightArm: { x: -1, y: 1, z: -1 },
    leftLowerArm: { x: -1, y: 1, z: -1 },
    rightLowerArm: { x: -1, y: 1, z: -1 }
  });

  // 手部调试面板坐标轴配置状态
  const [handDebugAxisConfig, setHandDebugAxisConfig] = React.useState({
    leftHand: { x: -1, y: 1, z: -1 },
    rightHand: { x: -1, y: 1, z: -1 },
    // 左手手指
    leftThumb: { x: -1, y: -1, z: 1 },
    leftThumbMetacarpal: { x: -1, y: -1, z: 1 },
    leftThumbDistal: { x: -1, y: -1, z: 1 },
    leftIndex: { x: -1, y: -1, z: 1 },
    leftIndexIntermediate: { x: -1, y: -1, z: 1 },
    leftIndexDistal: { x: -1, y: -1, z: 1 },
    leftMiddle: { x: -1, y: -1, z: 1 },
    leftMiddleIntermediate: { x: -1, y: -1, z: 1 },
    leftMiddleDistal: { x: -1, y: -1, z: 1 },
    leftRing: { x: -1, y: -1, z: 1 },
    leftRingIntermediate: { x: -1, y: -1, z: 1 },
    leftRingDistal: { x: -1, y: -1, z: 1 },
    leftLittle: { x: -1, y: -1, z: 1 },
    leftLittleIntermediate: { x: -1, y: -1, z: 1 },
    leftLittleDistal: { x: -1, y: -1, z: 1 },
    // 右手手指
    rightThumb: { x: -1, y: -1, z: 1 },
    rightThumbMetacarpal: { x: -1, y: -1, z: 1 },
    rightThumbDistal: { x: -1, y: -1, z: 1 },
    rightIndex: { x: -1, y: -1, z: 1 },
    rightIndexIntermediate: { x: -1, y: -1, z: 1 },
    rightIndexDistal: { x: -1, y: -1, z: 1 },
    rightMiddle: { x: -1, y: -1, z: 1 },
    rightMiddleIntermediate: { x: -1, y: -1, z: 1 },
    rightMiddleDistal: { x: -1, y: -1, z: 1 },
    rightRing: { x: -1, y: -1, z: 1 },
    rightRingIntermediate: { x: -1, y: -1, z: 1 },
    rightRingDistal: { x: -1, y: -1, z: 1 },
    rightLittle: { x: -1, y: -1, z: 1 },
    rightLittleIntermediate: { x: -1, y: -1, z: 1 },
    rightLittleDistal: { x: -1, y: -1, z: 1 }
  });

  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        shadows={settings.shadows}
        gl={{ 
          antialias: settings.antialiasing, 
          alpha: false, // 改为false以确保背景色显示
          preserveDrawingBuffer: true,
          powerPreference: "high-performance"
        }}
        dpr={getResolutionDPR()}
        style={{ background: '#0036FF' }}
      >
        <VTuberScene 
          {...sceneProps} 
          debugAxisConfig={debugAxisConfig}
          handDebugAxisConfig={handDebugAxisConfig}
          onAxisChange={setDebugAxisConfig}
          onHandAxisChange={setHandDebugAxisConfig}
          onRiggedPoseUpdate={(pose) => {
            riggedPoseRef.current = pose;
          }}
          onRiggedHandUpdate={(leftHand, rightHand) => {
            riggedLeftHandRef.current = leftHand;
            riggedRightHandRef.current = rightHand;
          }}
        />
      </Canvas>
      
      {/* ARM 坐标轴调试面板 - 在Canvas外部渲染 */}
      {sceneProps.debugSettings?.showDebug && (
        <ArmDebugPanel 
          onAxisChange={setDebugAxisConfig}
          riggedPose={riggedPoseRef}
          currentSettings={debugAxisConfig}
          showPanel={sceneProps.debugSettings?.showDebug}
          // 新增手部相关props
          onHandAxisChange={setHandDebugAxisConfig}
          riggedLeftHand={riggedLeftHandRef}
          riggedRightHand={riggedRightHandRef}
          handDebugAxisConfig={handDebugAxisConfig}
        />
      )}
    </div>
  );
}; 