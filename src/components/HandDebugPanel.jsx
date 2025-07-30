import React, { useState, useEffect } from 'react';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { DraggablePanel } from './DraggablePanel';

export const HandDebugPanel = ({ isOpen, onClose }) => {
    const [handData, setHandData] = useState({
        leftHand: null,
        rightHand: null,
        lastUpdate: null
    });

    const { getHandDebugInfo } = useVideoRecognition();

    useEffect(() => {
        if (!isOpen) return;

        const interval = setInterval(() => {
            const debugInfo = getHandDebugInfo();
            if (debugInfo) {
                setHandData({
                    leftHand: debugInfo.leftHandData,
                    rightHand: debugInfo.rightHandData,
                    lastUpdate: new Date().toLocaleTimeString()
                });
            }
        }, 100); // 每100ms更新一次

        return () => clearInterval(interval);
    }, [isOpen, getHandDebugInfo]);

    const formatVector = (vector) => {
        if (!vector) return '无数据';
        return `X: ${vector.x?.toFixed(3) || 'N/A'}, Y: ${vector.y?.toFixed(3) || 'N/A'}, Z: ${vector.z?.toFixed(3) || 'N/A'}`;
    };

    return (
        <DraggablePanel
            title="🤚 手部调试面板"
            defaultPosition={{ x: 300, y: 300 }}
            minWidth={350}
            minHeight={400}
            maxWidth={500}
            maxHeight={600}
            isVisible={isOpen}
            onClose={onClose}
            showToggle={false}
            showClose={true}
            zIndex={95}
        >
            <div className="p-4 h-full flex flex-col">
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">手部检测状态</h4>
                    <p className="text-xs text-gray-500">
                        实时显示手部检测数据和坐标信息
                    </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto">
                    {/* 左手数据 */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <h5 className="text-sm font-semibold text-blue-800 mb-2">左手数据</h5>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-600">检测状态:</span>
                                <span className={handData.leftHand ? 'text-green-600' : 'text-red-600'}>
                                    {handData.leftHand ? '✅ 已检测' : '❌ 未检测'}
                                </span>
                            </div>
                            {handData.leftHand && (
                                <div className="space-y-1">
                                    <div className="text-gray-600">手腕位置:</div>
                                    <div className="text-blue-700 font-mono text-xs">
                                        {formatVector(handData.leftHand.wrist)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 右手数据 */}
                    <div className="bg-green-50 p-3 rounded-lg">
                        <h5 className="text-sm font-semibold text-green-800 mb-2">右手数据</h5>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-600">检测状态:</span>
                                <span className={handData.rightHand ? 'text-green-600' : 'text-red-600'}>
                                    {handData.rightHand ? '✅ 已检测' : '❌ 未检测'}
                                </span>
                            </div>
                            {handData.rightHand && (
                                <div className="space-y-1">
                                    <div className="text-gray-600">手腕位置:</div>
                                    <div className="text-green-700 font-mono text-xs">
                                        {formatVector(handData.rightHand.wrist)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 检测统计 */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-sm font-semibold text-gray-800 mb-2">检测统计</h5>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-gray-600">左手检测:</span>
                                <span className={handData.leftHand ? 'text-green-600' : 'text-red-600'}>
                                    {handData.leftHand ? '活跃' : '未检测'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">右手检测:</span>
                                <span className={handData.rightHand ? 'text-green-600' : 'text-red-600'}>
                                    {handData.rightHand ? '活跃' : '未检测'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">最后更新:</span>
                                <span className="text-gray-500">
                                    {handData.lastUpdate || '无数据'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 使用说明 */}
                    <div className="bg-yellow-50 p-3 rounded-lg">
                        <h5 className="text-xs font-semibold text-yellow-800 mb-1">💡 使用说明</h5>
                        <div className="text-xs text-yellow-700 space-y-1">
                            <div>• 确保摄像头正常工作</div>
                            <div>• 保持手部在摄像头视野内</div>
                            <div>• 光线充足，背景简单</div>
                            <div>• 数据每100ms更新一次</div>
                        </div>
                    </div>

                    {/* 调试信息 */}
                    <div className="bg-purple-50 p-3 rounded-lg">
                        <h5 className="text-xs font-semibold text-purple-800 mb-1">🔧 调试信息</h5>
                        <div className="text-xs text-purple-700 space-y-1">
                            <div>• 坐标系统: MediaPipe 3D坐标</div>
                            <div>• 检测范围: 摄像头视野内</div>
                            <div>• 精度: 约±5mm</div>
                            <div>• 延迟: &lt;100ms</div>
                        </div>
                    </div>
                </div>

                {/* 底部状态 */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>实时监控中</span>
                        <span>{handData.lastUpdate || '等待数据...'}</span>
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
}; 