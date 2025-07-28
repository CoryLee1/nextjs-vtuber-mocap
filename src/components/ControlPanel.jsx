import { useState, useEffect } from 'react';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { SensitivityPanel } from './SensitivityPanel';
import { useSensitivitySettings } from '@/hooks/useSensitivitySettings';

export const ControlPanel = ({ 
    selectedModel, 
    onModelChange, 
    onOpenModelManager,
    showBones,
    onToggleBones
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showSensitivityPanel, setShowSensitivityPanel] = useState(false);
    const { isCameraActive, videoElement } = useVideoRecognition();
    const { settings, updateSettings } = useSensitivitySettings();
    
    // 动捕状态
    const [mocapStatus, setMocapStatus] = useState({
        face: false,
        pose: false,
        leftHand: false,
        rightHand: false
    });

    // 监听动捕状态变化
    useEffect(() => {
        const interval = setInterval(() => {
            if (videoElement) {
                // 从 useVideoRecognition 获取实际的检测状态
                const state = useVideoRecognition.getState();
                // 这里可以通过全局状态来获取实际的检测状态
                // 暂时使用模拟数据，后续可以通过事件系统获取真实状态
                setMocapStatus({
                    face: true, // 面部通常都能检测到
                    pose: true, // 姿态通常都能检测到
                    leftHand: false, // 手部检测不稳定
                    rightHand: false
                });
            } else {
                setMocapStatus({
                    face: false,
                    pose: false,
                    leftHand: false,
                    rightHand: false
                });
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [videoElement]);

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
                                onClick={() => setShowSensitivityPanel(true)}
                                className="w-full px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                调节灵敏度
                            </button>
                        </div>

                        {/* 模型管理 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-600">模型管理</h4>
                            <div className="text-xs text-gray-500 truncate">
                                当前: {selectedModel ? selectedModel.split('/').pop() : '未选择'}
                            </div>
                            <button
                                onClick={onOpenModelManager}
                                className="w-full px-3 py-1.5 bg-vtuber-primary text-white text-xs rounded-lg hover:bg-vtuber-secondary transition-colors"
                            >
                                管理模型
                            </button>
                        </div>

                        {/* 骨骼可视化 */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-medium text-gray-600">调试工具</h4>
                            <button
                                onClick={onToggleBones}
                                className={`w-full px-3 py-1.5 text-xs rounded-lg transition-colors ${
                                    showBones 
                                        ? 'bg-red-500 text-white hover:bg-red-600' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {showBones ? '隐藏骨骼' : '显示骨骼'}
                            </button>
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
            <SensitivityPanel
                isOpen={showSensitivityPanel}
                onClose={() => setShowSensitivityPanel(false)}
                sensitivitySettings={settings}
                onSensitivityChange={updateSettings}
            />
        </>
    );
}; 