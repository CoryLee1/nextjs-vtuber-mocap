import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Loader } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Vector3, MathUtils } from 'three';
import { CameraWidget } from './CameraWidget';
import { VRMAvatar } from './VRMAvatar';
import { UI } from './UI';
import { ModelManager } from './ModelManager';
import { ControlPanel } from './ControlPanel';
import { ArmTestPanel } from './ArmTestPanel'; // 新增：导入调试面板
import { HandDebugPanel } from './HandDebugPanel'; // 新增：导入手部调试面板
import { CameraController } from './CameraController'; // 新增：导入相机控制器
import { CameraControlHint } from './CameraController'; // 新增：导入相机控制提示
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { useModelManager } from '@/hooks/useModelManager';

// 3D 加载指示器组件
const LoadingIndicator = () => (
    <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="orange" />
    </mesh>
);

// 场景组件 - 更新以支持调试参数
const Scene = ({ selectedModel, showBones, debugSettings, showArmAxes, axisSettings, cameraSettings }) => {
    console.log('Scene: 渲染场景', { selectedModel, showBones, debugSettings, axisSettings, cameraSettings });
    const vrmRef = useRef();
    
    // 添加调试信息
    useEffect(() => {
        console.log('Scene: VRM ref状态', { 
            vrmRef: !!vrmRef.current,
            cameraSettings: cameraSettings
        });
    }, [vrmRef.current, cameraSettings]);
    
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

            {/* VRM 角色 - 传递调试参数 */}
            <group position-y={0.5}>
                <Suspense fallback={<LoadingIndicator />}>
                    <VRMAvatar
                        ref={vrmRef}
                        modelUrl={selectedModel?.url || '/models/AvatarSample_A.vrm'}
                        scale={1}
                        position={[0, -1, 0]}
                        showBones={showBones}
                        showDebug={debugSettings?.showDebug || false}  // 新增：调试开关
                        testSettings={debugSettings}                   // 新增：调试设置
                        showArmAxes={showArmAxes} // 新增手臂坐标轴控制
                        axisSettings={axisSettings} // 新增坐标轴设置
                    />
                </Suspense>

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
            </group>

            {/* 后处理效果 */}
            <EffectComposer>
                <Bloom
                    mipmapBlur
                    intensity={0.4}
                    luminanceThreshold={0.9}
                    luminanceSmoothing={0.025}
                />
            </EffectComposer>
        </>
    );
};

// 主应用组件
export default function VTuberApp() {
    console.log('=== VTuberApp 开始渲染 ===');
    
    const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
    const [showBones, setShowBones] = useState(false);
    const [showArmAxes, setShowArmAxes] = useState(false); // 新增手臂坐标轴状态
    const [showSensitivityPanel, setShowSensitivityPanel] = useState(false); // 新增灵敏度面板状态
    
    // 新增：坐标轴设置状态
    const [axisSettings, setAxisSettings] = useState({
        leftArm: { x: 1, y: 1, z: -1 },
        rightArm: { x: -1, y: 1, z: -1 },
        leftHand: { x: 1, y: 1, z: -1 },
        rightHand: { x: -1, y: 1, z: -1 },
        neck: { x: -1, y: 1, z: -1 } // 新增脖子设置
    });
    
    // 新增：相机控制状态
    const [cameraSettings, setCameraSettings] = useState({
        enableAutoTrack: true,
        enableUserControl: true,
        showHint: true,
        useGameStyle: true, // 启用游戏风格控制
        autoTrackSpeed: 0.02,
        lookAtSmoothFactor: 0.03,
        swingAmplitude: 2,
        swingSpeed: 0.0005,
        dampingFactor: 0.05,
        rotateSpeed: 0.5,
        zoomSpeed: 0.8,
        minDistance: 1.5,
        maxDistance: 8,
        // 游戏风格设置
        rotationSpeed: 3.5,
        rotationDampening: 10.0,
        zoomDampening: 6.0,
        yMinLimit: -40,
        yMaxLimit: 85,
        useRightMouseButton: true,
        useLeftMouseButton: true,
        useMiddleMouseButton: true,
        invertY: false,
        enableBreathing: false,
        breathingAmplitude: 0.03,
        breathingFrequency: 0.8,
        enableCollisionDetection: true,
        collisionOffset: 0.3,
        panSmoothing: 10
    });
    
    // 新增：动捕状态
    const [mocapStatus, setMocapStatus] = useState({
        face: false,
        pose: false,
        leftHand: false,
        rightHand: false
    });
    
    // 新增：调试设置状态
    const [debugSettings, setDebugSettings] = useState({
        showDebug: true,      // 默认开启调试
        showBones: false,
        showRawData: true,
        leftArmMultiplier: { x: -1, y: 1, z: -1 },
        rightArmMultiplier: { x: 1, y: 1, z: -1 },
        amplitude: 1
    });
    
    const { getSelectedModel, selectModel, getAllModels } = useModelManager();
    
    // 获取当前选中的模型
    const selectedModel = getSelectedModel();
    
    console.log('VTuberApp: 当前状态', { 
        isModelManagerOpen, 
        showBones, 
        debugSettings,
        selectedModel: selectedModel?.name,
        selectedModelUrl: selectedModel?.url 
    });

    // 处理模型选择
    const handleModelSelect = (model) => {
        console.log('VTuberApp: handleModelSelect 被调用', model);
        if (model && model.id) {
            console.log('VTuberApp: 找到模型', model.name, model.url);
            selectModel(model.id);
            console.log('VTuberApp: 模型已选择', model.name, model.url);
        } else {
            console.warn('VTuberApp: 无效的模型对象', model);
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

    // 新增：处理调试设置变化
    const handleDebugSettingsChange = (newSettings) => {
        console.log('VTuberApp: 调试设置变化', newSettings);
        setDebugSettings(newSettings);
        
        // 同步骨骼显示状态
        if (newSettings.showBones !== undefined && newSettings.showBones !== showBones) {
            setShowBones(newSettings.showBones);
        }
    };

    // 新增：处理坐标轴调整
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

    // 新增：处理相机设置调整
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

    return (
        <div className="w-full h-screen relative overflow-hidden bg-gradient-to-br from-vtuber-light via-white to-vtuber-blue-50">
            {/* UI 覆盖层 */}
            <UI />

            {/* 相机控制提示 - 移到Canvas外部 */}
            <CameraControlHint isVisible={cameraSettings.showHint} />

            {/* 新增：调试面板 */}
            <ArmTestPanel 
                onSettingsChange={handleDebugSettingsChange}
                initialSettings={debugSettings}
            />

            {/* 新增：手部调试面板 */}
            <HandDebugPanel 
                isVisible={debugSettings.showDebug}
            />

            {/* 控制面板 */}
            <ControlPanel
                mocapStatus={mocapStatus}
                onOpenSensitivityPanel={() => setShowSensitivityPanel(true)}
                onOpenModelManager={() => setIsModelManagerOpen(true)}
                showBones={showBones}
                onToggleBones={setShowBones}
                showArmAxes={showArmAxes}
                onToggleArmAxes={setShowArmAxes}
                axisSettings={axisSettings}
                onAxisAdjustment={handleAxisAdjustment}
                cameraSettings={cameraSettings}
                onCameraSettingsChange={handleCameraSettingsChange}
            />

            {/* 摄像头组件 */}
            <CameraWidget />

            {/* 模型管理器 */}
            <ModelManager
                isOpen={isModelManagerOpen}
                onClose={handleCloseModelManager}
                onModelSelect={handleModelSelect}
            />

            {/* Loader */}
            <Loader />

            {/* 主 3D 场景 */}
            <Canvas
                camera={{
                    position: [0, 2.5, 4],
                    fov: 35, // 减小FOV以获得更好的景深效果
                    near: 0.1,
                    far: 1000
                }}
                shadows
                gl={{
                    antialias: true,
                    alpha: true,
                    powerPreference: 'high-performance',
                }}
                className="w-full h-full"
                style={{ pointerEvents: 'auto' }} // 确保鼠标事件可以穿透
            >
                <color attach="background" args={['#f8fafc']} />
                <fog attach="fog" args={['#f8fafc', 10, 20]} />

                {/* 传递调试设置给场景 */}
                <Scene 
                    selectedModel={selectedModel?.url || '/models/AvatarSample_A.vrm'} 
                    showBones={showBones}
                    debugSettings={debugSettings}
                    showArmAxes={showArmAxes}
                    axisSettings={axisSettings}
                    cameraSettings={cameraSettings}
                />
            </Canvas>

            {/* 版权信息 - 显示调试状态 */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10">
                <p className="text-vtuber-text-light text-xs">
                    Powered by Next.js + Three.js + MediaPipe 
                    {debugSettings.showDebug && <span className="text-orange-500"> | 🔧 调试模式</span>}
                </p>
            </div>
        </div>
    );
}