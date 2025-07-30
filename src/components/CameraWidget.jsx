import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import {
    FACEMESH_TESSELATION,
    HAND_CONNECTIONS,
    Holistic,
    POSE_CONNECTIONS,
} from '@mediapipe/holistic';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { useSensitivitySettings } from '@/hooks/useSensitivitySettings';
import { MEDIAPIPE_CONFIG, CAMERA_CONFIG } from '@/utils/constants';

// 计算眼睛纵横比 (Eye Aspect Ratio)
const calculateEyeAspectRatio = (landmarks, eyeIndices) => {
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

export const CameraWidget = () => {
    const [isStarted, setIsStarted] = useState(false);
    const videoRef = useRef();
    const canvasRef = useRef();
    const holisticRef = useRef();
    const cameraRef = useRef();
    const { settings } = useSensitivitySettings();
    
    // 性能优化：添加帧率控制
    const frameRateRef = useRef(0);
    const lastFrameTimeRef = useRef(0);
    const targetFPS = 60; // 恢复到60FPS以获得更流畅的体验
    const frameInterval = 1000 / targetFPS;

    const {
        setVideoElement,
        setIsCameraActive,
        setError,
        clearError,
        setResultsCallback // 新增：用于存储 resultsCallback
    } = useVideoRecognition();

    // 绘制 MediaPipe 结果
    const drawResults = (results) => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');

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
    const stopCamera = useCallback(() => {
        try {
            if (cameraRef.current) {
                // 正确停止MediaStream
                const tracks = cameraRef.current.getTracks();
                tracks.forEach(track => track.stop());
                cameraRef.current = null;
            }

            if (holisticRef.current) {
                holisticRef.current.close();
                holisticRef.current = null;
            }

            setVideoElement(null);
            setIsCameraActive(false);

        } catch (error) {
            console.error('Camera stop error:', error);
        }
    }, [setVideoElement, setIsCameraActive]);

    // 启动摄像头
    const startCamera = useCallback(async () => {
        try {
            if (cameraRef.current) {
                console.log('Camera already started');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            // 初始化 MediaPipe Holistic
            if (!holisticRef.current) {
                holisticRef.current = new Holistic({
                    locateFile: (file) => {
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
                    }
                });

                holisticRef.current.setOptions({
                    modelComplexity: 1, // 恢复到完整模型
                    smoothLandmarks: true,
                    enableSegmentation: false, // 保持禁用分割
                    smoothSegmentation: false, // 保持禁用分割平滑
                    refineFaceLandmarks: true, // 恢复精细面部关键点
                    minDetectionConfidence: 0.7, // 恢复到标准阈值
                    minTrackingConfidence: 0.7, // 恢复到标准阈值
                    minHandDetectionConfidence: 0.7, // 添加手部检测阈值
                    minHandTrackingConfidence: 0.7 // 添加手部跟踪阈值
                });

                holisticRef.current.onResults((results) => {
                    // 性能优化：帧率控制
                    const currentTime = performance.now();
                    if (currentTime - lastFrameTimeRef.current < frameInterval) {
                        return; // 跳过帧以控制帧率
                    }
                    lastFrameTimeRef.current = currentTime;
                    
                    if (canvasRef.current && videoRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        const video = videoRef.current;

                        canvasRef.current.width = video.videoWidth;
                        canvasRef.current.height = video.videoHeight;

                        ctx.save();
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

                        // 绘制检测结果
                        drawResults(results);

                        ctx.restore();
                    }

                    // 更新状态
                    setVideoElement(videoRef.current);
                    setIsCameraActive(true);

                    // 传递结果给父组件
                    if (setResultsCallback) {
                        setResultsCallback(results);
                    }
                });
            }

            // 开始处理视频流
            if (videoRef.current && holisticRef.current) {
                // 等待视频加载完成后再开始处理
                videoRef.current.addEventListener('loadeddata', () => {
                    if (holisticRef.current) {
                        holisticRef.current.send({ image: videoRef.current });
                    }
                }, { once: true });
                
                // 立即发送第一帧
                holisticRef.current.send({ image: videoRef.current });
            }

            cameraRef.current = stream;

        } catch (error) {
            console.error('Camera start error:', error);
            setIsCameraActive(false);
        }
    }, [settings.minDetectionConfidence, settings.minTrackingConfidence, settings.minHandDetectionConfidence, settings.minHandTrackingConfidence, setResultsCallback, setVideoElement, setIsCameraActive]);

    // 监听设置变化，重新启动摄像头 - 添加防抖
    useEffect(() => {
        if (isStarted && cameraRef.current) {
            // 防抖：延迟重启以避免频繁重启
            const timeoutId = setTimeout(() => {
                console.log('CameraWidget: 设置变化，重启摄像头');
                stopCamera();
                // 延迟启动以确保清理完成
                setTimeout(() => {
                    startCamera();
                }, 100);
            }, 500); // 增加延迟时间

            return () => clearTimeout(timeoutId);
        }
    }, [settings.minDetectionConfidence, settings.minTrackingConfidence, settings.minHandDetectionConfidence, settings.minHandTrackingConfidence, isStarted, startCamera, stopCamera]);

    // 切换摄像头状态
    const toggleCamera = () => {
        setIsStarted(!isStarted);
    };

    // 监听启动状态变化
    useEffect(() => {
        if (isStarted) {
            startCamera();
        } else {
            stopCamera();
        }

        // 清理函数
        return () => {
            stopCamera();
        };
    }, [isStarted, startCamera, stopCamera]);

    return (
        <>
            {/* 摄像头控制按钮 */}
            <button
                onClick={toggleCamera}
                className={`
          fixed bottom-2 right-52 z-20 p-3 rounded-full text-white 
          transition-all duration-300 shadow-lg hover:shadow-xl
          ${isStarted
                        ? 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                        : 'bg-vtuber-primary hover:bg-vtuber-secondary active:bg-blue-700'
                    }
        `}
                title={isStarted ? '停止摄像头' : '开启摄像头'}
            >
                <div className="w-5 h-5">
                    {isStarted ? (
                        // 停止图标
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 6h12v12H6z" />
                        </svg>
                    ) : (
                        // 摄像头图标
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                    )}
                </div>
            </button>

            {/* 摄像头预览窗口 */}
            {isStarted && (
                <div className="fixed bottom-2 right-2 w-48 h-36 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl z-10 bg-black">
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
                            FPS: {Math.round(1000 / frameInterval)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};