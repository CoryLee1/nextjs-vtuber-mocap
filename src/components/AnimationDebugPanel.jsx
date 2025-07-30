import React, { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';

export const AnimationDebugPanel = ({ 
    animationManager, 
    vrm, 
    handDetectionState,
    isVisible = true,
    onClose = null,
    onToggle = null
}) => {
    const [debugInfo, setDebugInfo] = useState({});

    useEffect(() => {
        if (!animationManager || !isVisible) return;

        const interval = setInterval(() => {
            const animationState = animationManager.getAnimationState();
            const currentMode = animationManager.getCurrentMode();
            
            setDebugInfo({
                // 动画状态
                animationState,
                currentMode,
                
                // VRM状态
                hasVrm: !!vrm,
                hasVrmScene: !!vrm?.scene,
                hasVrmHumanoid: !!vrm?.humanoid,
                
                // 手部检测状态
                hasHandDetection: handDetectionState?.current?.hasHandDetection,
                hasLeftHand: handDetectionState?.current?.hasLeftHand,
                hasRightHand: handDetectionState?.current?.hasRightHand,
                
                // 时间戳
                timestamp: new Date().toLocaleTimeString()
            });
        }, 500); // 每0.5秒更新一次

        return () => clearInterval(interval);
    }, [animationManager, vrm, handDetectionState, isVisible]);

    const handleForceIdleRestart = () => {
        if (animationManager?.forceIdleRestart) {
            animationManager.forceIdleRestart();
            console.log('AnimationDebug: 强制重启idle动画');
        }
    };

    const handleSwitchToIdle = () => {
        if (animationManager?.switchToIdleMode) {
            animationManager.switchToIdleMode();
            console.log('AnimationDebug: 手动切换到idle模式');
        }
    };

    const handleSwitchToMocap = () => {
        if (animationManager?.switchToMocapMode) {
            animationManager.switchToMocapMode();
            console.log('AnimationDebug: 手动切换到动捕模式');
        }
    };

    return (
        <DraggablePanel
            title="🎬 动画调试面板"
            defaultPosition={{ x: 20, y: 80 }}
            minWidth={350}
            minHeight={400}
            maxWidth={500}
            maxHeight={600}
            isVisible={isVisible}
            onClose={onClose}
            onToggle={onToggle}
            showToggle={true}
            showClose={true}
            zIndex={60}
        >
            <div className="p-4 space-y-4 h-full overflow-y-auto">
                {/* 动画状态 */}
                <div className="bg-gray-800 p-3 rounded">
                    <h4 className="text-sm font-semibold mb-2 text-green-400">📊 动画状态</h4>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span>当前模式:</span>
                            <span className={`font-medium ${
                                debugInfo.currentMode === 'idle' ? 'text-green-400' : 'text-orange-400'
                            }`}>
                                {debugInfo.currentMode || 'unknown'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>播放Idle:</span>
                            <span className={debugInfo.animationState?.isPlayingIdle ? 'text-green-400' : 'text-red-400'}>
                                {debugInfo.animationState?.isPlayingIdle ? '✅' : '❌'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>过渡中:</span>
                            <span className={debugInfo.animationState?.isTransitioning ? 'text-yellow-400' : 'text-gray-400'}>
                                {debugInfo.animationState?.isTransitioning ? '🔄' : '⏹️'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>有混合器:</span>
                            <span className={debugInfo.animationState?.hasMixer ? 'text-green-400' : 'text-red-400'}>
                                {debugInfo.animationState?.hasMixer ? '✅' : '❌'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* VRM状态 */}
                <div className="bg-gray-800 p-3 rounded">
                    <h4 className="text-sm font-semibold mb-2 text-purple-400">🎭 VRM状态</h4>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span>VRM加载:</span>
                            <span className={debugInfo.hasVrm ? 'text-green-400' : 'text-red-400'}>
                                {debugInfo.hasVrm ? '✅' : '❌'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>场景:</span>
                            <span className={debugInfo.hasVrmScene ? 'text-green-400' : 'text-red-400'}>
                                {debugInfo.hasVrmScene ? '✅' : '❌'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>骨骼:</span>
                            <span className={debugInfo.hasVrmHumanoid ? 'text-green-400' : 'text-red-400'}>
                                {debugInfo.hasVrmHumanoid ? '✅' : '❌'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 手部检测状态 */}
                <div className="bg-gray-800 p-3 rounded">
                    <h4 className="text-sm font-semibold mb-2 text-cyan-400">🤚 手部检测</h4>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span>检测到手:</span>
                            <span className={debugInfo.hasHandDetection ? 'text-green-400' : 'text-red-400'}>
                                {debugInfo.hasHandDetection ? '✅' : '❌'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>左手:</span>
                            <span className={debugInfo.hasLeftHand ? 'text-green-400' : 'text-gray-400'}>
                                {debugInfo.hasLeftHand ? '🤚' : '❌'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span>右手:</span>
                            <span className={debugInfo.hasRightHand ? 'text-green-400' : 'text-gray-400'}>
                                {debugInfo.hasRightHand ? '🤚' : '❌'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 控制按钮 */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-yellow-400">🎮 手动控制</h4>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={handleSwitchToIdle}
                            className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded text-xs transition-colors"
                        >
                            切换到Idle模式
                        </button>
                        <button
                            onClick={handleSwitchToMocap}
                            className="bg-orange-600 hover:bg-orange-700 text-white py-1 px-2 rounded text-xs transition-colors"
                        >
                            切换到动捕模式
                        </button>
                        <button
                            onClick={handleForceIdleRestart}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-xs transition-colors"
                        >
                            强制重启Idle
                        </button>
                    </div>
                </div>

                {/* 状态指示 */}
                <div className="bg-gray-800 p-2 rounded">
                    <div className="text-xs text-gray-400">
                        <div>更新时间: {debugInfo.timestamp}</div>
                        <div className="mt-1">
                            状态: {debugInfo.hasHandDetection ? 
                                <span className="text-orange-400">动捕控制中</span> : 
                                <span className="text-green-400">Idle动画中</span>
                            }
                        </div>
                    </div>
                </div>

                {/* 诊断建议 */}
                <div className="bg-yellow-900/50 p-2 rounded">
                    <h4 className="text-xs font-semibold text-yellow-400 mb-1">💡 诊断建议</h4>
                    <div className="text-xs text-yellow-200 space-y-1">
                        {!debugInfo.animationState?.hasMixer && (
                            <div>• 动画混合器未初始化</div>
                        )}
                        {!debugInfo.hasVrm && (
                            <div>• VRM模型未加载</div>
                        )}
                        {debugInfo.animationState?.hasMixer && !debugInfo.animationState?.isPlayingIdle && debugInfo.currentMode === 'idle' && (
                            <div>• Idle动画应该播放但未运行</div>
                        )}
                        {debugInfo.hasHandDetection && debugInfo.currentMode === 'idle' && (
                            <div>• 检测到手部但仍在Idle模式</div>
                        )}
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
};