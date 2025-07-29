import { useState, useEffect } from 'react';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { SensitivityPanel } from './SensitivityPanel';
import { useSensitivitySettings } from '@/hooks/useSensitivitySettings';

export const ControlPanel = ({
    mocapStatus,
    onOpenSensitivityPanel,
    onOpenModelManager,
    showBones,
    onToggleBones,
    showArmAxes = false,
    onToggleArmAxes,
    axisSettings = { 
        leftArm: { x: 1, y: 1, z: -1 }, 
        rightArm: { x: -1, y: 1, z: -1 },
        leftHand: { x: 1, y: 1, z: -1 },
        rightHand: { x: -1, y: 1, z: -1 },
        neck: { x: -1, y: 1, z: -1 } // 新增脖子设置
    },
    onAxisAdjustment
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [localShowBones, setLocalShowBones] = useState(showBones);
    const [localShowArmAxes, setLocalShowArmAxes] = useState(showArmAxes);
    const [showSensitivityPanel, setShowSensitivityPanel] = useState(false);
    const { isCameraActive } = useVideoRecognition();
    const { settings, updateSettings } = useSensitivitySettings();

    // 同步外部状态变化
    useEffect(() => {
        setLocalShowBones(showBones);
    }, [showBones]);

    useEffect(() => {
        setLocalShowArmAxes(showArmAxes);
    }, [showArmAxes]);

    // 将状态传递给父组件
    useEffect(() => {
        if (onToggleBones) {
            onToggleBones(localShowBones);
        }
    }, [localShowBones, onToggleBones]);

    // 将手臂坐标轴状态传递给父组件
    useEffect(() => {
        if (onToggleArmAxes) {
            onToggleArmAxes(localShowArmAxes);
        }
    }, [localShowArmAxes, onToggleArmAxes]);

    return (
        <>
            <div className={`
                fixed top-2 right-16 z-30 bg-white/90 backdrop-blur-sm rounded-xl shadow-xl
                transition-all duration-300 ease-in-out
                ${isExpanded ? 'w-64' : 'w-10'}
            `}>
                {/* 展开/收起按钮 */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-vtuber-primary text-white rounded-full shadow-lg hover:bg-vtuber-secondary transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                    </svg>
                </button>

                {isExpanded && (
                    <div className="p-4 space-y-3">
                        {/* 标题 */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-800">控制面板</h3>
                            <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        </div>

                        {/* 动捕状态指示器 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-600">动捕状态</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className={`flex items-center space-x-1 ${mocapStatus.face ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${mocapStatus.face ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>面部</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${mocapStatus.pose ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${mocapStatus.pose ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>姿态</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${mocapStatus.leftHand ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${mocapStatus.leftHand ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>左手</span>
                                </div>
                                <div className={`flex items-center space-x-1 ${mocapStatus.rightHand ? 'text-green-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${mocapStatus.rightHand ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>右手</span>
                                </div>
                            </div>
                            
                            {/* 动画状态 */}
                            <div className="text-xs text-purple-600 bg-purple-50 p-2 rounded-lg">
                                💡 已启用默认idle动画 (平滑过渡)
                            </div>
                            
                            {/* 灵敏度提示 */}
                            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                                💡 已优化手臂检测灵敏度 (简化版)
                            </div>
                        </div>

                        {/* 灵敏度调节 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-600">灵敏度调节</h4>
                            <button
                                onClick={onOpenSensitivityPanel}
                                className="w-full px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                调节灵敏度
                            </button>
                        </div>

                        {/* 模型管理 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-600">模型管理</h4>
                            <div className="text-xs text-gray-500 truncate">
                                当前: AvatarSample_A.vrm
                            </div>
                            <button
                                onClick={onOpenModelManager}
                                className="w-full px-3 py-1.5 bg-vtuber-primary text-white text-xs rounded-lg hover:bg-vtuber-secondary transition-colors"
                            >
                                管理模型
                            </button>
                        </div>

                        {/* 调试工具 */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-300">调试工具</h3>
                            
                            {/* 显示骨骼 */}
                            <button
                                onClick={() => setLocalShowBones(!localShowBones)}
                                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    localShowBones
                                        ? 'bg-vtuber-accent text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {localShowBones ? '隐藏骨骼' : '显示骨骼'}
                            </button>

                            {/* 显示手臂坐标轴 */}
                            <button
                                onClick={() => setLocalShowArmAxes(!localShowArmAxes)}
                                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    localShowArmAxes
                                        ? 'bg-vtuber-accent text-white'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                            >
                                {localShowArmAxes ? '隐藏手臂坐标轴' : '显示手臂坐标轴'}
                            </button>

                            {/* 坐标轴调整UI */}
                            {localShowArmAxes && (
                                <div className="mt-3 p-3 bg-gray-800 rounded-lg space-y-3">
                                    <h4 className="text-xs font-medium text-gray-300">坐标轴调整</h4>
                                    
                                    {/* 左手臂调整 */}
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400">左手臂</div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                onClick={() => onAxisAdjustment('leftArm', 'x', -1)}
                                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                X: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftArm', 'y', -1)}
                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Y: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftArm', 'z', -1)}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Z: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftArm', 'x', 1)}
                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                X: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftArm', 'y', 1)}
                                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Y: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftArm', 'z', 1)}
                                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Z: +
                                            </button>
                                        </div>
                                    </div>

                                    {/* 右手臂调整 */}
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400">右手臂</div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                onClick={() => onAxisAdjustment('rightArm', 'x', -1)}
                                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                X: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightArm', 'y', -1)}
                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Y: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightArm', 'z', -1)}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Z: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightArm', 'x', 1)}
                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                X: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightArm', 'y', 1)}
                                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Y: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightArm', 'z', 1)}
                                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Z: +
                                            </button>
                                        </div>
                                    </div>

                                    {/* 左手调整 */}
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400">左手</div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                onClick={() => onAxisAdjustment('leftHand', 'x', -1)}
                                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                X: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftHand', 'y', -1)}
                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Y: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftHand', 'z', -1)}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Z: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftHand', 'x', 1)}
                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                X: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftHand', 'y', 1)}
                                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Y: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('leftHand', 'z', 1)}
                                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Z: +
                                            </button>
                                        </div>
                                    </div>

                                    {/* 右手调整 */}
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400">右手</div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                onClick={() => onAxisAdjustment('rightHand', 'x', -1)}
                                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                X: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightHand', 'y', -1)}
                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Y: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightHand', 'z', -1)}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Z: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightHand', 'x', 1)}
                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                X: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightHand', 'y', 1)}
                                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Y: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('rightHand', 'z', 1)}
                                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Z: +
                                            </button>
                                        </div>
                                    </div>

                                    {/* 脖子调整 */}
                                    <div className="space-y-2">
                                        <div className="text-xs text-gray-400">脖子</div>
                                        <div className="grid grid-cols-3 gap-1">
                                            <button
                                                onClick={() => onAxisAdjustment('neck', 'x', -1)}
                                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                            >
                                                X: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('neck', 'y', -1)}
                                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                            >
                                                Y: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('neck', 'z', -1)}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                                Z: -
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('neck', 'x', 1)}
                                                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                            >
                                                X: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('neck', 'y', 1)}
                                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                                            >
                                                Y: +
                                            </button>
                                            <button
                                                onClick={() => onAxisAdjustment('neck', 'z', 1)}
                                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Z: +
                                            </button>
                                        </div>
                                    </div>

                                    {/* 当前设置显示 */}
                                    <div className="text-xs text-gray-400">
                                        <div>当前设置:</div>
                                        <div>左臂: {JSON.stringify(axisSettings?.leftArm || {})}</div>
                                        <div>右臂: {JSON.stringify(axisSettings?.rightArm || {})}</div>
                                        <div>左手: {JSON.stringify(axisSettings?.leftHand || {})}</div>
                                        <div>右手: {JSON.stringify(axisSettings?.rightHand || {})}</div>
                                        <div>脖子: {JSON.stringify(axisSettings?.neck || {})}</div>
                                    </div>
                                </div>
                            )}

                            <div className="text-xs text-gray-400 space-y-1">
                                <div>• 开启摄像头以获得完整的动捕体验</div>
                                <div>• 手臂坐标轴显示肩部、手肘、手腕的XYZ方向</div>
                                <div>• 红色=X轴(左右)，绿色=Y轴(上下)，蓝色=Z轴(前后)</div>
                            </div>
                        </div>

                        {/* 提示信息 */}
                        {!isCameraActive && (
                            <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded-lg">
                                💡 开启摄像头以获得完整的动捕体验
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 灵敏度调节面板 */}
            {/* <SensitivityPanel
                isOpen={showSensitivityPanel}
                onClose={() => setShowSensitivityPanel(false)}
                sensitivitySettings={settings}
                onSensitivityChange={updateSettings}
            /> */}
        </>
    );
}; 