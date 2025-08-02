import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Loader } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Vector3, MathUtils } from 'three';
import { CameraWidget } from './CameraWidget';
import { VRMAvatar } from './VRMAvatar';
import { UI } from './UI';
import { ModelManager } from './ModelManager';
import { AnimationLibrary } from './AnimationLibrary';
import { ControlPanel } from './ControlPanel';
import { ArmTestPanel } from './ArmTestPanel';
import { HandDebugPanel } from './HandDebugPanel';
import { CameraController } from './CameraController';
import { CameraControlHint } from './CameraController';
import { SmoothSettingsPanel } from './SmoothSettingsPanel';
import { AnimationDebugPanel } from './AnimationDebugPanel';
import { ConfigManagerPanel } from './ConfigManagerPanel';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { useModelManager } from '@/hooks/useModelManager';
import { useAnimationLibrary } from '@/hooks/useAnimationLibrary';

// 3D 加载指示器组件
const LoadingIndicator = () => (
    <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="orange" />
    </mesh>
);

// 场景组件 - 优化调试信息
const Scene = ({ 
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
    onMocapStatusUpdate
}) => {
    const vrmRef = useRef();
    
    // 传递引用给父组件
    useEffect(() => {
        if (onVrmRef) {
            onVrmRef(vrmRef);
        }
    }, [onVrmRef]);

    return (
        <>
            {/* 相机控制器 */}
            <CameraController 
                vrmRef={vrmRef}
                enableAutoTrack={cameraSettings.enableAutoTrack}
                enableUserControl={cameraSettings.enableUserControl}
                showHint={cameraSettings.showHint}
                useGameStyle={cameraSettings.useGameStyle}
                cameraSettings={cameraSettings}
            />

            {/* 环境光照 */}
            <Environment preset="sunset" />

            {/* 主要光源 */}
            <directionalLight
                intensity={1}
                position={[10, 10, 5]}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            <directionalLight
                intensity={0.5}
                position={[-10, 10, 5]}
            />
            <ambientLight intensity={0.3} />

            {/* VRM 角色 */}
            <group position-y={0.5}>
                <Suspense fallback={<LoadingIndicator />}>
                    <VRMAvatar
                        ref={vrmRef}
                        modelUrl={selectedModel?.url || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm'}
                        animationUrl={selectedAnimation?.url || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Idle.fbx'}
                        scale={1}
                        position={[0, -1, 0]}
                        showBones={showBones}
                        showDebug={debugSettings?.showDebug || false}
                        testSettings={debugSettings}
                        showArmAxes={showArmAxes}
                        axisSettings={axisSettings}
                        onAnimationManagerRef={onAnimationManagerRef}
                        onHandDetectionStateRef={onHandDetectionStateRef}
                        onMocapStatusUpdate={onMocapStatusUpdate}
                    />
                </Suspense>
            </group>

            {/* 地面 */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -0.5, 0]}
                receiveShadow
            >
                <planeGeometry args={[10, 10]} />
                <meshStandardMaterial
                    color="#f8fafc"
                    transparent
                    opacity={0.3}
                />
            </mesh>

            {/* 后处理效果 */}
            <EffectComposer>
                <Bloom 
                    intensity={0.5} 
                    luminanceThreshold={0.8} 
                    luminanceSmoothing={0.9} 
                />
            </EffectComposer>
        </>
    );
};

export default function VTuberApp() {
    // 状态管理
    const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
    const [isAnimationLibraryOpen, setIsAnimationLibraryOpen] = useState(false);
    const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
    const [isArmTestPanelOpen, setIsArmTestPanelOpen] = useState(false);
    const [isHandDebugPanelOpen, setIsHandDebugPanelOpen] = useState(false);
    const [isSmoothSettingsPanelOpen, setIsSmoothSettingsPanelOpen] = useState(false);
    const [isConfigManagerPanelOpen, setIsConfigManagerPanelOpen] = useState(false);
    const [showBones, setShowBones] = useState(false);
    const [showArmAxes, setShowArmAxes] = useState(false);
    const [showAnimationDebug, setShowAnimationDebug] = useState(true);

    // 调试设置
    const [debugSettings, setDebugSettings] = useState({
        showDebug: false,
        showBones: false,
        showRawData: false,
        showArmAxes: false
    });

    // 坐标轴设置
    const [axisSettings, setAxisSettings] = useState({
        leftArm: { x: 1, y: 1, z: -1 },
        rightArm: { x: -1, y: 1, z: -1 },
        leftHand: { x: 1, y: 1, z: -1 },
        rightHand: { x: -1, y: 1, z: -1 },
        neck: { x: -1, y: 1, z: -1 }
    });

    // 相机设置
    const [cameraSettings, setCameraSettings] = useState({
        useGameStyle: false,
        enableUserControl: true,
        enableAutoTrack: true,
        showHint: true,
        useLeftMouseButton: true,
        useRightMouseButton: true,
        useMiddleMouseButton: true
    });

    // 动捕状态
    const [mocapStatus, setMocapStatus] = useState({
        face: false,
        pose: false,
        leftHand: false,
        rightHand: false
    });

    // 当前模式状态
    const [currentMode, setCurrentMode] = useState('idle');

    // 引用管理
    const vrmRef = useRef();
    const animationManagerRef = useRef();
    const handDetectionStateRef = useRef();

    // 回调函数来接收引用
    const setVrmRef = (ref) => {
        vrmRef.current = ref?.current;
    };

    const setAnimationManagerRef = (manager) => {
        animationManagerRef.current = manager;
        // 获取当前模式
        if (manager) {
            const state = manager.getAnimationState();
            setCurrentMode(state.currentMode);
        }
    };

    const setHandDetectionStateRef = (state) => {
        handDetectionStateRef.current = state;
    };

    // 动捕状态更新回调
    const handleMocapStatusUpdate = (newStatus) => {
        console.log('VTuberApp: 收到动捕状态更新', newStatus);
        setMocapStatus(newStatus);
    };

    // Hooks
    const { getSelectedModel, selectModel } = useModelManager();
    const { getSelectedAnimation, selectAnimation } = useAnimationLibrary();
    const { isCameraActive, videoElement } = useVideoRecognition();

    // 获取当前选中的模型和动画
    const selectedModel = getSelectedModel();
    const selectedAnimation = getSelectedAnimation();

    // 处理模型选择
    const handleModelSelect = (model) => {
        if (model && model.id) {
            selectModel(model.id);
        }
    };

    // 处理动画选择
    const handleAnimationSelect = (animation) => {
        if (animation && animation.id) {
            selectAnimation(animation);
        }
    };

    // 打开模型管理器
    const handleOpenModelManager = () => {
        setIsModelManagerOpen(true);
    };

    // 关闭模型管理器
    const handleCloseModelManager = () => {
        setIsModelManagerOpen(false);
    };

    // 打开动画库
    const handleOpenAnimationLibrary = () => {
        setIsAnimationLibraryOpen(true);
    };

    // 关闭动画库
    const handleCloseAnimationLibrary = () => {
        setIsAnimationLibraryOpen(false);
    };

    // 打开配置管理器
    const handleOpenConfigManager = () => {
        setIsConfigManagerPanelOpen(true);
    };

    // 关闭配置管理器
    const handleCloseConfigManager = () => {
        setIsConfigManagerPanelOpen(false);
    };

    // 切换骨骼可视化
    const handleToggleBones = () => {
        const newShowBones = !showBones;
        setShowBones(newShowBones);
        
        // 同步更新调试设置中的骨骼显示
        setDebugSettings(prev => ({
            ...prev,
            showBones: newShowBones
        }));
    };

    // 处理调试设置变化
    const handleDebugSettingsChange = (newSettings) => {
        setDebugSettings(newSettings);
        
        // 同步骨骼显示状态
        if (newSettings.showBones !== undefined && newSettings.showBones !== showBones) {
            setShowBones(newSettings.showBones);
        }
    };

    // 处理坐标轴调整
    const handleAxisAdjustment = (arm, axis, value) => {
        setAxisSettings(prev => ({
            ...prev,
            [arm]: {
                ...prev[arm],
                [axis]: value
            }
        }));
    };

    // 处理相机设置调整
    const handleCameraSettingsChange = (setting, value) => {
        setCameraSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    return (
        <div className="w-full h-screen bg-gradient-to-br from-vtuber-light to-vtuber-blue-50 relative overflow-hidden">
            {/* 3D 场景 */}
            <div className="w-full h-full">
                <Canvas
                    camera={{ position: [0, 1.5, 3], fov: 50 }}
                    shadows
                    gl={{ 
                        antialias: true, 
                        alpha: true,
                        preserveDrawingBuffer: true 
                    }}
                >
                    <Scene
                        selectedModel={selectedModel}
                        selectedAnimation={selectedAnimation}
                        showBones={showBones}
                        debugSettings={debugSettings}
                        showArmAxes={showArmAxes}
                        axisSettings={axisSettings}
                        cameraSettings={cameraSettings}
                        onVrmRef={setVrmRef}
                        onAnimationManagerRef={setAnimationManagerRef}
                        onHandDetectionStateRef={setHandDetectionStateRef}
                        onMocapStatusUpdate={handleMocapStatusUpdate}
                    />
                </Canvas>
            </div>

            {/* UI 组件 */}
            <UI
                isCameraActive={isCameraActive}
                onOpenModelManager={handleOpenModelManager}
                onOpenAnimationLibrary={handleOpenAnimationLibrary}
                onOpenConfigManager={handleOpenConfigManager}
                onToggleBones={handleToggleBones}
                showBones={showBones}
                selectedModel={selectedModel}
                selectedAnimation={selectedAnimation}
                showAnimationDebug={showAnimationDebug}
                onToggleAnimationDebug={() => setShowAnimationDebug(!showAnimationDebug)}
                currentMode={currentMode}
            />

            {/* 相机组件 */}
            <CameraWidget />

            {/* 控制面板 */}
            <ControlPanel
                isOpen={isControlPanelOpen}
                onClose={() => setIsControlPanelOpen(false)}
                onOpenArmTest={() => setIsArmTestPanelOpen(true)}
                onOpenHandDebug={() => setIsHandDebugPanelOpen(true)}
                onOpenSmoothSettings={() => setIsSmoothSettingsPanelOpen(true)}
                mocapStatus={mocapStatus}
                onOpenSensitivityPanel={() => setIsSmoothSettingsPanelOpen(true)}
                onOpenModelManager={handleOpenModelManager}
                onOpenAnimationLibrary={handleOpenAnimationLibrary}
                selectedAnimation={selectedAnimation}
                showBones={showBones}
                onToggleBones={setShowBones}
                showArmAxes={showArmAxes}
                onToggleArmAxes={setShowArmAxes}
                axisSettings={axisSettings}
                onAxisAdjustment={handleAxisAdjustment}
                cameraSettings={cameraSettings}
                onCameraSettingsChange={handleCameraSettingsChange}
                debugSettings={debugSettings}
                onDebugSettingsChange={handleDebugSettingsChange}
            />

            {/* 模型管理器 */}
            <ModelManager
                isOpen={isModelManagerOpen}
                onClose={handleCloseModelManager}
                onModelSelect={handleModelSelect}
            />

            {/* 动画库 */}
            <AnimationLibrary
                isOpen={isAnimationLibraryOpen}
                onClose={handleCloseAnimationLibrary}
                onAnimationSelect={handleAnimationSelect}
            />

            {/* 手臂测试面板 */}
            <ArmTestPanel
                isOpen={isArmTestPanelOpen}
                onClose={() => setIsArmTestPanelOpen(false)}
                showArmAxes={showArmAxes}
                onToggleArmAxes={() => setShowArmAxes(!showArmAxes)}
                axisSettings={axisSettings}
                onAxisAdjustment={handleAxisAdjustment}
            />

            {/* 手部调试面板 */}
            <HandDebugPanel
                isOpen={isHandDebugPanelOpen}
                onClose={() => setIsHandDebugPanelOpen(false)}
            />

            {/* 平滑设置面板 */}
            <SmoothSettingsPanel
                isOpen={isSmoothSettingsPanelOpen}
                onClose={() => setIsSmoothSettingsPanelOpen(false)}
            />

            {/* 配置管理器面板 */}
            <ConfigManagerPanel
                isOpen={isConfigManagerPanelOpen}
                onClose={handleCloseConfigManager}
            />

            {/* 动画调试面板 */}
            <AnimationDebugPanel 
                animationManager={animationManagerRef.current}
                vrm={vrmRef.current}
                handDetectionState={handDetectionStateRef.current}
                isVisible={showAnimationDebug}
                onClose={() => setShowAnimationDebug(false)}
                onToggle={() => setShowAnimationDebug(!showAnimationDebug)}
                onModeSwitch={(mode) => {
                    if (animationManagerRef.current) {
                        if (mode === 'idle') {
                            animationManagerRef.current.switchToIdleMode();
                        } else if (mode === 'mocap') {
                            animationManagerRef.current.switchToMocapMode();
                        }
                    }
                }}
                onForceIdleRestart={() => {
                    if (animationManagerRef.current) {
                        animationManagerRef.current.forceIdleRestart();
                    }
                }}
            />

            {/* 加载指示器 */}
            <Loader />
        </div>
    );
}