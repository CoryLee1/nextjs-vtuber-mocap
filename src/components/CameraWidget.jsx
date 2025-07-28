import { useEffect, useRef, useState } from 'react';
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

export const CameraWidget = () => {
    const [isStarted, setIsStarted] = useState(false);
    const videoRef = useRef();
    const canvasRef = useRef();
    const holisticRef = useRef();
    const cameraRef = useRef();
    const { settings } = useSensitivitySettings();

    const {
        setVideoElement,
        setIsCameraActive,
        setError,
        clearError
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

    // 启动摄像头和 MediaPipe
    const startCamera = async () => {
        try {
            clearError();

            if (!videoRef.current) return;

            // 初始化 Holistic - 使用动态灵敏度设置
            holisticRef.current = new Holistic({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.4.1633559476/${file}`;
                },
                // 启用手部检测
                refineFaceLandmarks: true,
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: true,
                // 使用动态灵敏度设置
                minDetectionConfidence: settings.minDetectionConfidence,
                minTrackingConfidence: settings.minTrackingConfidence,
                // 确保启用手部检测
                staticImageMode: false,
                maxNumHands: 2,
                // 启用 3D 姿态数据
                enable3d: true,
                // 手部检测配置 - 使用动态设置
                minHandDetectionConfidence: settings.minHandDetectionConfidence,
                minHandTrackingConfidence: settings.minHandTrackingConfidence,
            });

            // 设置结果回调
            holisticRef.current.onResults((results) => {
                drawResults(results);
                console.log('CameraWidget: MediaPipe 结果', {
                    hasFaceLandmarks: !!results.faceLandmarks,
                    hasPoseLandmarks: !!results.poseLandmarks,
                    hasLeftHand: !!results.leftHandLandmarks,
                    hasRightHand: !!results.rightHandLandmarks,
                    poseLandmarksLength: results.poseLandmarks?.length,
                    leftHandLength: results.leftHandLandmarks?.length,
                    rightHandLength: results.rightHandLandmarks?.length,
                    // 检查是否有 3D 数据
                    hasPose3D: !!results.pose3d,
                    pose3dLength: results.pose3d?.length,
                    // 详细的数据结构
                    resultsKeys: Object.keys(results),
                    faceLandmarksLength: results.faceLandmarks?.length,
                    // 检查其他可能的字段
                    hasEa: !!results.ea,
                    hasZa: !!results.za,
                    eaLength: results.ea?.length,
                    zaLength: results.za?.length,
                });
                
                // 检查手部数据的具体内容
                if (results.leftHandLandmarks) {
                    console.log('CameraWidget: 左手数据样本', results.leftHandLandmarks.slice(0, 3));
                }
                if (results.rightHandLandmarks) {
                    console.log('CameraWidget: 右手数据样本', results.rightHandLandmarks.slice(0, 3));
                }
                
                // 将结果传递给 useVideoRecognition
                const { resultsCallback } = useVideoRecognition.getState();
                if (resultsCallback) {
                    console.log('CameraWidget: 调用 resultsCallback');
                    resultsCallback(results);
                } else {
                    console.warn('CameraWidget: resultsCallback 未设置');
                }
            });

            // 等待 Holistic 初始化完成
            await holisticRef.current.initialize();

            // 初始化摄像头
            cameraRef.current = new Camera(videoRef.current, {
                onFrame: async () => {
                    // 确保 holisticRef.current 存在且已初始化
                    if (holisticRef.current && holisticRef.current.send) {
                        await holisticRef.current.send({ image: videoRef.current });
                    }
                },
                width: CAMERA_CONFIG.width,
                height: CAMERA_CONFIG.height,
            });

            await cameraRef.current.start();

            console.log('CameraWidget: 摄像头启动完成，设置 videoElement');
            setVideoElement(videoRef.current);
            setIsCameraActive(true);
            console.log('CameraWidget: videoElement 已设置', !!videoRef.current);

        } catch (error) {
            console.error('Camera start error:', error);
            setError('摄像头启动失败: ' + error.message);
        }
    };

    // 当灵敏度设置变化时重新初始化 Holistic
    useEffect(() => {
        if (isStarted && holisticRef.current) {
            console.log('CameraWidget: 灵敏度设置变化，重新初始化 Holistic');
            stopCamera();
            setTimeout(() => {
                startCamera();
            }, 100);
        }
    }, [settings.minDetectionConfidence, settings.minTrackingConfidence, settings.minHandDetectionConfidence, settings.minHandTrackingConfidence]);

    // 停止摄像头
    const stopCamera = () => {
        try {
            if (cameraRef.current) {
                cameraRef.current.stop();
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
    };

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
    }, [isStarted]);

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
                </div>
            )}
        </>
    );
};