import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Loader } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Vector3, MathUtils } from 'three';
import { CameraWidget } from './CameraWidget';
import { VRMAvatar } from './VRMAvatar';
import { UI } from './UI';
import { ModelManager } from './ModelManager';
import { AnimationLibrary } from './AnimationLibrary'; // 新增：导入动画库
import { ControlPanel } from './ControlPanel';
import { ArmTestPanel } from './ArmTestPanel'; // 新增：导入调试面板
import { HandDebugPanel } from './HandDebugPanel'; // 新增：导入手部调试面板
import { CameraController } from './CameraController'; // 新增：导入相机控制器
import { CameraControlHint } from './CameraController'; // 新增：导入相机控制提示
import { SmoothSettingsPanel } from './SmoothSettingsPanel'; // 新增：导入平滑设置面板
import { AnimationDebugPanel } from './AnimationDebugPanel'; // 新增：导入动画调试面板
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { useModelManager } from '@/hooks/useModelManager';
import { useAnimationLibrary } from '@/hooks/useAnimationLibrary'; // 新增：导入动画库Hook

// 3D 加载指示器组件
const LoadingIndicator = () => (
    <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="orange" />
    </mesh>
);

// 场景组件 - 更新以支持调试参数
const Scene = ({ 
    selectedModel, 
    selectedAnimation, 
    showBones, 
    debugSettings, 
    showArmAxes, 
    axisSettings, 
    cameraSettings,
    onVrmRef, // 新增：VRM引用回调
    onAnimationManagerRef, // 新增：动画管理器引用回调
    onHandDetectionStateRef, // 新增：手部检测状态引用回调
    onMocapStatusUpdate // 新增：动捕状态更新回调
}) => {
    console.log('Scene: 渲染场景', { selectedModel, selectedAnimation, showBones, debugSettings, axisSettings, cameraSettings });
    console.log('Scene: selectedModel详情', { 
        hasSelectedModel: !!selectedModel,
        modelName: selectedModel?.name,
        modelUrl: selectedModel?.url,
        modelId: selectedModel?.id
    });
    console.log('Scene: selectedAnimation详情', { 
        hasSelectedAnimation: !!selectedAnimation,
        animationName: selectedAnimation?.name,
        animationUrl: selectedAnimation?.url,
        animationId: selectedAnimation?.id
    });
    const vrmRef = useRef();
    
    // 添加调试信息
    useEffect(() => {
        console.log('Scene: VRM ref状态', { 
            vrmRef: !!vrmRef.current,
            cameraSettings: cameraSettings
        });
    }, [cameraSettings]);

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
                        modelUrl={selectedModel?.url || '/models/AvatarSample_A.vrm'}
                        animationUrl={selectedAnimation?.url || '/models/animations/Idle.fbx'}
                        scale={1}
                        position={[0, -1, 0]}
                        showBones={showBones}
                        showDebug={debugSettings?.showDebug || false}
                        testSettings={debugSettings}
                        showArmAxes={showArmAxes}
                        axisSettings={axisSettings}
                        onAnimationManagerRef={onAnimationManagerRef} // 新增：传递动画管理器引用
                        onHandDetectionStateRef={onHandDetectionStateRef} // 新增：传递手部检测状态引用
                        onMocapStatusUpdate={onMocapStatusUpdate} // 新增：传递动捕状态更新回调
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
    console.log('=== VTuberApp 开始渲染 ===');

    // 状态管理
    const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
    const [isAnimationLibraryOpen, setIsAnimationLibraryOpen] = useState(false);
    const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
    const [isArmTestPanelOpen, setIsArmTestPanelOpen] = useState(false);
    const [isHandDebugPanelOpen, setIsHandDebugPanelOpen] = useState(false);
    const [isSmoothSettingsPanelOpen, setIsSmoothSettingsPanelOpen] = useState(false);
    const [showBones, setShowBones] = useState(false);
    const [showArmAxes, setShowArmAxes] = useState(false);
    const [showAnimationDebug, setShowAnimationDebug] = useState(true); // 新增：动画调试面板状态

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
    };

    const setHandDetectionStateRef = (state) => {
        handDetectionStateRef.current = state;
    };

    // Hooks
    const { getSelectedModel, selectModel } = useModelManager();
    const { getSelectedAnimation, selectAnimation } = useAnimationLibrary();
    const { isCameraActive, videoElement } = useVideoRecognition();

    // 获取当前选中的模型和动画
    const selectedModel = getSelectedModel();
    const selectedAnimation = getSelectedAnimation();

    console.log('VTuberApp: 当前状态', {
        selectedModel: selectedModel?.name,
        selectedAnimation: selectedAnimation?.name,
        isModelManagerOpen,
        isAnimationLibraryOpen,
        showBones,
        debugSettings,
        axisSettings,
        cameraSettings,
        mocapStatus
    });

    // 处理模型选择
    const handleModelSelect = (model) => {
        console.log('VTuberApp: handleModelSelect 被调用', model);
        if (model && model.id) {
            console.log('VTuberApp: 找到模型', model.name, model.url);
            selectModel(model.id);
            console.log('VTuberApp: 模型已选择', model.name, model.url);
            console.log('VTuberApp: 当前selectedModel状态', getSelectedModel());
        } else {
            console.warn('VTuberApp: 无效的模型对象', model);
        }
    };

    // 处理动画选择
    const handleAnimationSelect = (animation) => {
        console.log('VTuberApp: handleAnimationSelect 被调用', animation);
        if (animation && animation.id) {
            console.log('VTuberApp: 找到动画', animation.name, animation.url);
            selectAnimation(animation);
            console.log('VTuberApp: 动画已选择', animation.name, animation.url);
            console.log('VTuberApp: 当前selectedAnimation状态', getSelectedAnimation());
            
            // 强制重新渲染VRMAvatar组件以应用新动画
            console.log('VTuberApp: 动画切换完成，VRMAvatar将重新加载动画');
        } else {
            console.warn('VTuberApp: 无效的动画对象', animation);
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

    // 切换骨骼可视化
    const handleToggleBones = () => {
        const newShowBones = !showBones;
        console.log('=== 切换骨骼可视化 ===');
        console.log('VTuberApp: 切换骨骼可视化', { 
            当前状态: showBones, 
            新状态: newShowBones 
        });
        setShowBones(newShowBones);
        
        // 同步更新调试设置中的骨骼显示
        setDebugSettings(prev => ({
            ...prev,
            showBones: newShowBones
        }));
        
        console.log('VTuberApp: showBones 状态已更新');
    };

    // 处理调试设置变化
    const handleDebugSettingsChange = (newSettings) => {
        console.log('VTuberApp: 调试设置变化', newSettings);
        setDebugSettings(newSettings);
        
        // 同步骨骼显示状态
        if (newSettings.showBones !== undefined && newSettings.showBones !== showBones) {
            setShowBones(newSettings.showBones);
        }
    };

    // 处理坐标轴调整
    const handleAxisAdjustment = (arm, axis, value) => {
        console.log('VTuberApp: 坐标轴调整', { arm, axis, value });
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
        console.log('VTuberApp: 相机设置调整', { setting, value });
        setCameraSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    // 添加调试信息
    useEffect(() => {
        console.log('VTuberApp: 相机设置状态', {
            useGameStyle: cameraSettings.useGameStyle,
            enableUserControl: cameraSettings.enableUserControl,
            enableAutoTrack: cameraSettings.enableAutoTrack,
            useLeftMouseButton: cameraSettings.useLeftMouseButton,
            useRightMouseButton: cameraSettings.useRightMouseButton,
            useMiddleMouseButton: cameraSettings.useMiddleMouseButton
        });
    }, [cameraSettings]);

    // 监听动画变化
    useEffect(() => {
        console.log('VTuberApp: 动画变化监听', {
            selectedAnimation: selectedAnimation?.name,
            animationUrl: selectedAnimation?.url
        });
    }, [selectedAnimation]);

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
                        onVrmRef={setVrmRef} // 传递VRM引用
                        onAnimationManagerRef={setAnimationManagerRef} // 传递动画管理器引用
                        onHandDetectionStateRef={setHandDetectionStateRef} // 传递手部检测状态引用
                        onMocapStatusUpdate={(newStatus) => setMocapStatus(newStatus)} // 传递动捕状态更新回调
                    />
                </Canvas>
            </div>

            {/* UI 组件 */}
            <UI
                isCameraActive={isCameraActive}
                onOpenModelManager={handleOpenModelManager}
                onOpenAnimationLibrary={handleOpenAnimationLibrary}
                onToggleBones={handleToggleBones}
                showBones={showBones}
                selectedModel={selectedModel}
                selectedAnimation={selectedAnimation}
                showAnimationDebug={showAnimationDebug}
                onToggleAnimationDebug={() => setShowAnimationDebug(!showAnimationDebug)}
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

            {/* 动画调试面板 */}
            <AnimationDebugPanel 
                animationManager={animationManagerRef.current}
                vrm={vrmRef.current}
                handDetectionState={handDetectionStateRef.current}
                isVisible={showAnimationDebug}
                onClose={() => setShowAnimationDebug(false)}
                onToggle={() => setShowAnimationDebug(!showAnimationDebug)}
            />

            {/* 加载指示器 */}
            <Loader />
        </div>
    );
}