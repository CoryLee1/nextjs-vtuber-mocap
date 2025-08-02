import React, { useState, useEffect } from 'react';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { useSensitivitySettings } from '@/hooks/useSensitivitySettings';

export const AnimationDebugPanel = ({ 
    animationManagerRef, 
    handDetectionStateRef,
    onModeSwitch,
    onForceIdleRestart 
}) => {
    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
    const [currentStatus, setCurrentStatus] = useState('待机动画');
    const [mocapDebugInfo, setMocapDebugInfo] = useState({
        mediapipeStatus: '未启动',
        kalidokitStatus: '未处理',
        faceDetection: false,
        poseDetection: false,
        leftHandDetection: false,
        rightHandDetection: false,
        lastResultsTime: null,
        processingTime: 0,
        errorCount: 0,
        successCount: 0
    });

    const { settings } = useSensitivitySettings();
    const { 
        videoElement, 
        isCameraActive, 
        setResultsCallback,
        handDebugInfo 
    } = useVideoRecognition();

    // 更新动捕调试信息
    useEffect(() => {
        const updateMocapDebug = () => {
            const now = new Date();
            setLastUpdateTime(now);
            
            // 检查MediaPipe状态
            let mediapipeStatus = '未启动';
            let kalidokitStatus = '未处理';
            let faceDetection = false;
            let poseDetection = false;
            let leftHandDetection = false;
            let rightHandDetection = false;
            let lastResultsTime = null;
            let processingTime = 0;
            let errorCount = 0;
            let successCount = 0;

            if (isCameraActive && videoElement) {
                mediapipeStatus = '运行中';
                
                // 检查手部检测状态
                if (handDetectionStateRef?.current) {
                    leftHandDetection = handDetectionStateRef.current.hasLeftHand;
                    rightHandDetection = handDetectionStateRef.current.hasRightHand;
                }

                // 检查手部调试信息
                if (handDebugInfo) {
                    leftHandDetection = handDebugInfo.leftHandDetected;
                    rightHandDetection = handDebugInfo.rightHandDetected;
                    
                    // **获取从VRMAvatar传递的动捕调试信息**
                    if (handDebugInfo.mocapDebugInfo) {
                        const mocapInfo = handDebugInfo.mocapDebugInfo;
                        mediapipeStatus = mocapInfo.mediapipeStatus;
                        kalidokitStatus = mocapInfo.kalidokitStatus;
                        faceDetection = mocapInfo.faceDetection;
                        poseDetection = mocapInfo.poseDetection;
                        leftHandDetection = mocapInfo.leftHandDetection;
                        rightHandDetection = mocapInfo.rightHandDetection;
                        lastResultsTime = mocapInfo.lastResultsTime;
                        processingTime = mocapInfo.processingTime;
                        errorCount = mocapInfo.errorCount;
                        successCount = mocapInfo.successCount;
                    }
                }
            }

            setMocapDebugInfo({
                mediapipeStatus,
                kalidokitStatus,
                faceDetection,
                poseDetection,
                leftHandDetection,
                rightHandDetection,
                lastResultsTime,
                processingTime,
                errorCount,
                successCount
            });
        };

        // 立即更新一次
        updateMocapDebug();

        // 每秒更新一次
        const interval = setInterval(updateMocapDebug, 1000);
        return () => clearInterval(interval);
    }, [isCameraActive, videoElement, handDetectionStateRef, handDebugInfo]);

    // 获取当前动画状态
    useEffect(() => {
        if (animationManagerRef) {
            const state = animationManagerRef.getAnimationState();
            setCurrentStatus(state.currentMode === 'idle' ? '待机动画' : '动捕模式');
        }
    }, [animationManagerRef, lastUpdateTime]);

    // 手动模式切换
    const handleModeSwitch = (mode) => {
        if (onModeSwitch) {
            onModeSwitch(mode);
        }
    };

    // 强制重启Idle
    const handleForceIdleRestart = () => {
        if (onForceIdleRestart) {
            onForceIdleRestart();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 w-80 max-h-screen overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                <span className="text-blue-500 mr-2">🎭</span>
                动画调试面板
            </h2>

            {/* 手部检测状态 */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-orange-500 mr-2">✋</span>
                    手部检测
                </h3>
                <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                        <span>检测到手:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            (mocapDebugInfo.leftHandDetection || mocapDebugInfo.rightHandDetection) 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {(mocapDebugInfo.leftHandDetection || mocapDebugInfo.rightHandDetection) ? '✓' : '✗'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>左手:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            mocapDebugInfo.leftHandDetection 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {mocapDebugInfo.leftHandDetection ? '✓' : '✗'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>右手:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            mocapDebugInfo.rightHandDetection 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {mocapDebugInfo.rightHandDetection ? '✓' : '✗'}
                        </span>
                    </div>
                </div>
            </div>

            {/* 动捕调试状态 */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-purple-500 mr-2">🎯</span>
                    动捕调试
                </h3>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                        <span>MediaPipe:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            mocapDebugInfo.mediapipeStatus === '运行中' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {mocapDebugInfo.mediapipeStatus}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Kalidokit:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            mocapDebugInfo.kalidokitStatus === '处理中' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {mocapDebugInfo.kalidokitStatus}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>面部检测:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            mocapDebugInfo.faceDetection 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {mocapDebugInfo.faceDetection ? '✓' : '✗'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>姿态检测:</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                            mocapDebugInfo.poseDetection 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                        }`}>
                            {mocapDebugInfo.poseDetection ? '✓' : '✗'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>处理时间:</span>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {mocapDebugInfo.processingTime}ms
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>成功次数:</span>
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                            {mocapDebugInfo.successCount}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>错误次数:</span>
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                            {mocapDebugInfo.errorCount}
                        </span>
                    </div>
                </div>
            </div>

            {/* 手动控制 */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-green-500 mr-2">🎮</span>
                    手动控制
                </h3>
                <div className="space-y-2">
                    <button
                        onClick={() => handleModeSwitch('idle')}
                        className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                        切换到Idle模式
                    </button>
                    <button
                        onClick={() => handleModeSwitch('mocap')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                        切换到动捕模式
                    </button>
                    <button
                        onClick={handleForceIdleRestart}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium"
                    >
                        强制重启Idle
                    </button>
                </div>
            </div>

            {/* 状态显示 */}
            <div className="mb-4">
                <div className="bg-gray-100 rounded-lg p-3 text-sm">
                    <div className="text-gray-600 mb-1">
                        更新时间: {lastUpdateTime.toLocaleTimeString()}
                    </div>
                    <div className="text-gray-600">
                        状态: {currentStatus}
                    </div>
                </div>
            </div>

            {/* 诊断建议 */}
            <div className="mb-4">
                <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors duration-200 text-sm font-medium flex items-center justify-center">
                    <span className="mr-2">💡</span>
                    诊断建议
                </button>
            </div>

            {/* 使用说明 */}
            <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">•</span>
                    使用说明
                </h3>
                <div className="text-xs text-gray-600 space-y-1">
                    <div>• 点击右下角按钮开启摄像头</div>
                    <div>• 确保光线充足,面部清晰可见</div>
                    <div>• 保持距离摄像头50-100cm</div>
                    <div>• 使用按钮管理模型和动画</div>
                </div>
            </div>

            {/* 当前状态 */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <span className="text-blue-500 mr-2">•</span>
                    当前状态
                </h3>
                <div className="text-xs text-gray-600 space-y-1">
                    <div>模型: Avatar Sample A</div>
                    <div>动画: 待机动画</div>
                    <div>骨骼: 显示</div>
                    <div>摄像头: {isCameraActive ? '开启' : '关闭'}</div>
                    <div>动捕: {mocapDebugInfo.mediapipeStatus}</div>
                </div>
            </div>
        </div>
    );
};