import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, OrbitControls, Loader } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { CameraWidget } from './CameraWidget';
import { VRMAvatar } from './VRMAvatar';
import { UI } from './UI';
import { ModelManager } from './ModelManager';
import { ControlPanel } from './ControlPanel';
import { ArmTestPanel } from './ArmTestPanel'; // 新增：导入调试面板
import { HandDebugPanel } from './HandDebugPanel'; // 新增：导入手部调试面板
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
const Scene = ({ selectedModel, showBones, debugSettings }) => {
    console.log('Scene: 渲染场景', { selectedModel, showBones, debugSettings });
    
    return (
        <>
            {/* 摄像头控制 */}
            <OrbitControls
                enablePan={false}
                maxPolarAngle={Math.PI / 2}
                minDistance={2}
                maxDistance={8}
                target={[0, 1.5, 0]}
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
                        modelUrl={selectedModel}
                        scale={1.2}
                        position={[0, 0, 0]}
                        showBones={showBones}
                        showDebug={debugSettings?.showDebug || false}  // 新增：调试开关
                        testSettings={debugSettings}                   // 新增：调试设置
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
    const handleModelSelect = (modelUrl) => {
        console.log('VTuberApp: handleModelSelect 被调用', modelUrl);
        const allModels = getAllModels();
        const model = allModels.find(m => m.url === modelUrl);
        if (model) {
            console.log('VTuberApp: 找到模型', model.name, model.id);
            selectModel(model.id);
            console.log('VTuberApp: 模型已选择', model.name, modelUrl);
        } else {
            console.warn('VTuberApp: 未找到对应的模型', modelUrl);
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

    return (
        <div className="w-full h-screen relative overflow-hidden bg-gradient-to-br from-vtuber-light via-white to-vtuber-blue-50">
            {/* UI 覆盖层 */}
            <UI />

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
                selectedModel={selectedModel.url}
                onModelChange={handleModelSelect}
                onOpenModelManager={handleOpenModelManager}
                showBones={showBones}
                onToggleBones={handleToggleBones}
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
                    fov: 40,
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
            >
                <color attach="background" args={['#f8fafc']} />
                <fog attach="fog" args={['#f8fafc', 10, 20]} />

                {/* 传递调试设置给场景 */}
                <Scene 
                    selectedModel={selectedModel.url} 
                    showBones={showBones}
                    debugSettings={debugSettings}
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