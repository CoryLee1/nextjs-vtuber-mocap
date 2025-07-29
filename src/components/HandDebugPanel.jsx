import React, { useState, useEffect } from 'react';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';

export const HandDebugPanel = ({ isVisible = true }) => {
    const handDebugInfo = useVideoRecognition((state) => state.handDebugInfo);

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-lg shadow-lg max-w-sm">
            <h3 className="text-lg font-bold mb-3 text-yellow-400">🤚 手部调试面板</h3>
            
            {/* 检测状态 */}
            <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">📡 检测状态</h4>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${handDebugInfo.leftHandDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">左手检测: {handDebugInfo.leftHandDetected ? '✅ 是' : '❌ 否'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${handDebugInfo.rightHandDetected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm">右手检测: {handDebugInfo.rightHandDetected ? '✅ 是' : '❌ 否'}</span>
                    </div>
                </div>
            </div>

            {/* 数据状态 */}
            <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">📊 数据状态</h4>
                <div className="space-y-2">
                    <div className="text-xs">
                        <span className="text-blue-400">左手数据:</span> {handDebugInfo.leftHandData ? '✅ 有数据' : '❌ 无数据'}
                    </div>
                    <div className="text-xs">
                        <span className="text-green-400">右手数据:</span> {handDebugInfo.rightHandData ? '✅ 有数据' : '❌ 无数据'}
                    </div>
                </div>
            </div>

            {/* 映射信息 */}
            <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">🔄 映射信息</h4>
                <div className="text-xs bg-gray-800 p-2 rounded">
                    <div className="mb-2">
                        <span className="text-yellow-400">当前状态:</span> {handDebugInfo.mappingInfo}
                    </div>
                    <div className="text-xs text-gray-300">
                        <div>• 你的右手 → 模型左手 (镜像)</div>
                        <div>• 你的左手 → 模型右手 (镜像)</div>
                    </div>
                </div>
            </div>

            {/* 实时数据 */}
            {(handDebugInfo.leftHandData || handDebugInfo.rightHandData) && (
                <div>
                    <h4 className="text-sm font-semibold mb-2">📈 实时数据</h4>
                    <div className="text-xs space-y-1">
                        {handDebugInfo.leftHandData && (
                            <div className="bg-blue-900/50 p-2 rounded">
                                <div className="text-blue-400">左手腕位置:</div>
                                <div>X: {handDebugInfo.leftHandData.wrist?.x?.toFixed(3) || 'N/A'}</div>
                                <div>Y: {handDebugInfo.leftHandData.wrist?.y?.toFixed(3) || 'N/A'}</div>
                                <div>Z: {handDebugInfo.leftHandData.wrist?.z?.toFixed(3) || 'N/A'}</div>
                            </div>
                        )}
                        {handDebugInfo.rightHandData && (
                            <div className="bg-green-900/50 p-2 rounded">
                                <div className="text-green-400">右手腕位置:</div>
                                <div>X: {handDebugInfo.rightHandData.wrist?.x?.toFixed(3) || 'N/A'}</div>
                                <div>Y: {handDebugInfo.rightHandData.wrist?.y?.toFixed(3) || 'N/A'}</div>
                                <div>Z: {handDebugInfo.rightHandData.wrist?.z?.toFixed(3) || 'N/A'}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 时间戳 */}
            <div className="text-xs text-gray-400 mt-3">
                更新时间: {new Date().toLocaleTimeString()}
            </div>
        </div>
    );
}; 