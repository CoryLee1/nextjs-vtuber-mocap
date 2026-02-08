import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
    FACEMESH_TESSELATION,
    HAND_CONNECTIONS,
    Holistic,
    POSE_CONNECTIONS,
} from '@mediapipe/holistic';
import { useVideoRecognition } from '@/hooks/use-video-recognition';
import { useSensitivitySettings } from '@/hooks/use-sensitivity-settings';
import { MEDIAPIPE_CONFIG, CAMERA_CONFIG } from '@/lib/constants';

// 计算眼睛纵横比 (Eye Aspect Ratio)
const calculateEyeAspectRatio = (landmarks: any[], eyeIndices: number[]) => {
    if (!landmarks || landmarks.length < 468) return 1;
    
    // 计算眼睛的垂直和水平距离
    const verticalDistances = [];
    const horizontalDistances = [];
    
    // 计算垂直距离（上下眼睑之间的距离）
    for (let i = 0; i < eyeIndices.length - 1; i += 2) {
        const top = landmarks[eyeIndices[i]];
        const bottom = landmarks[eyeIndices[i + 1]];
        const distance = Math.sqrt(
            Math.pow(top.x - bottom.x, 2) + 
            Math.pow(top.y - bottom.y, 2)
        );
        verticalDistances.push(distance);
    }
    
    // 计算水平距离（眼睛的宽度）
    const leftMost = landmarks[eyeIndices[0]];
    const rightMost = landmarks[eyeIndices[eyeIndices.length - 1]];
    const horizontalDistance = Math.sqrt(
        Math.pow(leftMost.x - rightMost.x, 2) + 
        Math.pow(leftMost.y - rightMost.y, 2)
    );
    
    // 计算平均垂直距离
    const avgVerticalDistance = verticalDistances.reduce((sum, dist) => sum + dist, 0) / verticalDistances.length;
    
    // 返回眼睛纵横比 (EAR)
    return avgVerticalDistance / horizontalDistance;
};

interface CameraWidgetProps {
  isActive?: boolean;
  onToggle?: () => void;
  onError?: (error: string) => void;
}

export const CameraWidget: React.FC<CameraWidgetProps> = ({ 
  isActive = false, 
  onError 
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const holisticRef = useRef<any>(null);
    const cameraRef = useRef<any>(null);
    const { settings } = useSensitivitySettings();

    const {
        setVideoElement,
        setIsCameraActive,
        setError,
        clearError,
        resultsCallback
    } = useVideoRecognition();

    // 获取错误状态
    const error = useVideoRecognition((state) => state.error);

    // 绘制 MediaPipe 结果
    const drawResults = (results: any) => {
        if (!canvasRef.current || !videoRef.current) return;

        // 检查视频元素是否已加载并具有有效的尺寸
        if (!videoRef.current.videoWidth || !videoRef.current.videoHeight) {
            console.warn('视频元素尚未加载完成，跳过绘制');
            return;
        }

        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            console.warn('无法获取 canvas context');
            return;
        }

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 绘制姿态连接线
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: '#00cff7',
            lineWidth: 4,
        });
        drawLandmarks(ctx, results.poseLandmarks, {
            color: '#ff0364',
            lineWidth: 2,
        });

        // 绘制面部网格
        drawConnectors(ctx, results.faceLandmarks, FACEMESH_TESSELATION, {
            color: '#C0C0C070',
            lineWidth: 1,
        });

        // 绘制瞳孔
        if (results.faceLandmarks && results.faceLandmarks.length === 478) {
            drawLandmarks(
                ctx,
                [results.faceLandmarks[468], results.faceLandmarks[468 + 5]],
                {
                    color: '#ffe603',
                    lineWidth: 2,
                }
            );
        }

        // 绘制左手
        drawConnectors(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, {
            color: '#eb1064',
            lineWidth: 5,
        });
        drawLandmarks(ctx, results.leftHandLandmarks, {
            color: '#00cff7',
            lineWidth: 2,
        });

        // 绘制右手
        drawConnectors(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, {
            color: '#22c3e3',
            lineWidth: 5,
        });
        drawLandmarks(ctx, results.rightHandLandmarks, {
            color: '#ff0364',
            lineWidth: 2,
        });

        ctx.restore();
    };

    // 停止摄像头
    const stopCamera = () => {
        try {
            console.log('CameraWidget: 开始停止摄像头');
            
            // 立即清除状态
            setVideoElement(null);
            setIsCameraActive(false);
            
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }

            if (holisticRef.current) {
                holisticRef.current.close();
                holisticRef.current = null;
            }

            console.log('CameraWidget: 摄像头停止完成');

        } catch (error) {
            console.error('Camera stop error:', error);
        }
    };

    // 启动摄像头和 MediaPipe
    const startCamera = async () => {
        try {
            clearError();

            if (!videoRef.current) return;

            console.log('CameraWidget: 开始初始化 MediaPipe');

            // 初始化 Holistic - 使用基本配置
            holisticRef.current = new Holistic({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5.1675471629/${file}`;
                },
            });

            // 设置结果回调
            holisticRef.current.onResults((results: any) => {
                drawResults(results);
                
                // 眨眼检测 - 使用FaceMesh的眼睛关键点
                let blinkData = { leftEye: 1, rightEye: 1 };
                if (results.faceLandmarks && results.faceLandmarks.length >= 468) {
                    // FaceMesh的眼睛关键点索引
                    const LEFT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
                    const RIGHT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
                    
                    // 计算左眼闭合程度
                    const leftEyeHeight = calculateEyeAspectRatio(results.faceLandmarks, LEFT_EYE_INDICES);
                    const rightEyeHeight = calculateEyeAspectRatio(results.faceLandmarks, RIGHT_EYE_INDICES);
                    
                    // 标准化眨眼值（0=完全闭合，1=完全睁开）
                    blinkData = {
                        leftEye: Math.max(0, Math.min(1, leftEyeHeight / 0.3)), // 0.3是正常睁眼时的EAR值
                        rightEye: Math.max(0, Math.min(1, rightEyeHeight / 0.3))
                    };
                }
                
                // 将结果传递给 useVideoRecognition - 关键修复：直接传递 videoRef.current
                if (resultsCallback) {
                    // 将眨眼数据添加到结果中
                    const resultsWithBlink = {
                        ...results,
                        blinkData,
                        videoElement: videoRef.current // 直接传递视频元素引用
                    };
                    resultsCallback(resultsWithBlink);
                }
            });

            // 等待 Holistic 初始化完成
            console.log('CameraWidget: 等待 Holistic 初始化...');
            await holisticRef.current.initialize();
            console.log('CameraWidget: Holistic 初始化完成');

            // 初始化摄像头
            console.log('CameraWidget: 开始初始化摄像头...');
            cameraRef.current = new Camera(videoRef.current, {
                onFrame: async () => {
                    // 确保 holisticRef.current 存在且已初始化
                    if (holisticRef.current && holisticRef.current.send && videoRef.current) {
                        // 检查视频元素是否已加载完成
                        if (videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
                            await holisticRef.current.send({ image: videoRef.current });
                        }
                    }
                },
                width: CAMERA_CONFIG.width,
                height: CAMERA_CONFIG.height,
            });

            await cameraRef.current.start();
            console.log('CameraWidget: 摄像头启动完成');

            // 等待视频元素完全加载
            console.log('CameraWidget: 等待视频元素加载完成...');
            await new Promise<void>((resolve) => {
                const checkVideoReady = () => {
                    if (videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
                        console.log('CameraWidget: 视频元素已加载完成', {
                            videoWidth: videoRef.current.videoWidth,
                            videoHeight: videoRef.current.videoHeight,
                            readyState: videoRef.current.readyState
                        });
                        resolve();
                    } else {
                        setTimeout(checkVideoReady, 100);
                    }
                };
                checkVideoReady();
            });

            // 关键修复：在所有初始化完成后再设置 videoElement
            console.log('CameraWidget: 设置 videoElement 和状态', {
                videoRef: !!videoRef.current,
                videoRefCurrent: videoRef.current,
                holisticReady: !!holisticRef.current,
                cameraReady: !!cameraRef.current
            });
            
            setVideoElement(videoRef.current);
            setIsCameraActive(true);
            
            console.log('CameraWidget: 所有初始化完成，状态已更新');

            // 添加延迟，确保 MediaPipe 完全就绪
            console.log('CameraWidget: 等待 MediaPipe 完全就绪...');
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('CameraWidget: MediaPipe 就绪，开始处理数据');

        } catch (error) {
            console.error('Camera start error:', error);
            let msg = '摄像头启动失败';
            
            // 提供更具体的错误信息
            if (error instanceof Error) {
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    msg = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
                } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                    msg = '未找到摄像头设备，请检查摄像头连接';
                } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                    msg = '摄像头被其他应用占用，请关闭其他使用摄像头的应用';
                } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                    msg = '摄像头不支持所需的配置，请尝试刷新页面';
                } else if (error.name === 'AbortError') {
                    msg = '摄像头启动被中止，请重试';
                } else if (error.name === 'NotSupportedError') {
                    msg = '浏览器不支持摄像头功能，请使用 Chrome、Edge 或 Firefox';
                } else {
                    msg += ': ' + error.message;
                }
            } else if (typeof error === 'object' && error && 'message' in error) {
                const errorMsg = (error as any).message;
                // 检查 MediaPipe Camera 的错误信息
                if (errorMsg.includes('Permission denied') || errorMsg.includes('权限')) {
                    msg = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
                } else if (errorMsg.includes('not found') || errorMsg.includes('未找到')) {
                    msg = '未找到摄像头设备，请检查摄像头连接';
                } else if (errorMsg.includes('in use') || errorMsg.includes('占用')) {
                    msg = '摄像头被其他应用占用，请关闭其他使用摄像头的应用';
                } else {
                    msg += ': ' + errorMsg;
                }
            }
            
            setError(msg);
            
            // 调用外部错误回调
            if (onError) {
                onError(msg);
            }
            
            // 重置状态
            setVideoElement(null);
            setIsCameraActive(false);
        }
    };

    // 当灵敏度设置变化时重新初始化 Holistic
    useEffect(() => {
        if (isActive && holisticRef.current) {
            stopCamera();
            setTimeout(() => {
                startCamera();
            }, 100);
        }
    }, [settings.minDetectionConfidence, settings.minTrackingConfidence, settings.minHandDetectionConfidence, settings.minHandTrackingConfidence]);

    // 监听启动状态变化
    useEffect(() => {
        if (isActive) {
            startCamera();
        } else {
            stopCamera();
        }

        // 清理函数
        return () => {
            stopCamera();
        };
    }, [isActive, settings.minDetectionConfidence, settings.minTrackingConfidence, settings.minHandDetectionConfidence, settings.minHandTrackingConfidence]);

    return (
        <>
            {/* 错误提示 */}
            {error && (
                <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-md pointer-events-auto">
                    <div className="flex items-start space-x-3">
                        <span className="text-lg flex-shrink-0">⚠️</span>
                        <div className="flex-1">
                            <div className="font-semibold mb-2">摄像头启动失败</div>
                            <div className="text-sm opacity-90 mb-3">{error}</div>
                            <div className="text-xs opacity-75">
                                <div className="font-medium mb-1">解决方案：</div>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>检查摄像头是否被其他应用占用</li>
                                    <li>刷新页面后重试</li>
                                    <li>检查浏览器摄像头权限</li>
                                    <li>尝试使用不同的浏览器</li>
                                    <li>确保摄像头硬件正常工作</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={() => useVideoRecognition.getState().clearError()}
                        className="absolute top-2 right-2 text-white hover:text-gray-200 transition-colors"
                        title="关闭错误提示"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* 摄像头预览窗口 */}
            {isActive && (
                <div className="fixed bottom-2 right-2 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 bg-black pointer-events-auto">
                    {/* 画布层 - 显示检测结果 */}
                    <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full z-10"
                        style={{ transform: 'scaleX(-1)' }}
                    />

                    {/* 视频层 */}
                    <video
                        ref={videoRef}
                        className="absolute top-0 left-0 w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                        autoPlay
                        muted
                        playsInline
                    />

                    {/* 状态指示器 */}
                    <div className="absolute top-1 left-1 z-20">
                        <div className="flex items-center space-x-1">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-white text-xs font-medium bg-black/50 px-1 py-0.5 rounded">
                                LIVE
                            </span>
                        </div>
                    </div>
                    
                    {/* 性能监控 */}
                    <div className="absolute bottom-1 left-1 z-20">
                        <div className="text-white text-xs font-medium bg-black/50 px-1 py-0.5 rounded">
                            FPS: {Math.round(1000 / 1000 / 60)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};