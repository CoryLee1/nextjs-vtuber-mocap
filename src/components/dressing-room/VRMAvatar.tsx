import { useEffect, useRef, useCallback, forwardRef, useMemo, memo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { Face, Hand, Pose } from 'kalidokit';
import { Group } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { useVideoRecognition } from '@/hooks/use-video-recognition';
import { useSensitivitySettings } from '@/hooks/use-sensitivity-settings';
import { useSceneStore, useMediaPipeCallback } from '@/hooks/use-scene-store';
// createVRMLookAtUpdater removed — VRMController handles head+eye tracking
import { useAnimationManager } from '@/lib/animation-manager';
import { ANIMATION_CONFIG } from '@/lib/constants';
import { CoordinateAxes, ArmDirectionDebugger, SimpleArmAxes } from './DebugHelpers';
import { ArmDebugPanel } from './ArmDebugPanel';
import { DEFAULT_AXIS_SETTINGS, DEFAULT_FINGER_AXIS_SETTINGS } from '@/config/vrm-defaults';
import { ModelLoadingIndicator } from '@/components/ui/ModelLoadingIndicator';
import { createPerformanceMonitor } from '@/lib/utils/performance-monitor';
import { mapBoneName } from '@/lib/vrm/bone-mapping';
import { useVRMInfoLogger } from '@/lib/vrm/debug/use-vrm-info-logger';
import { VRMController } from './VRMController';
import type { EchuuCue } from '@/lib/echuu-vrm-bridge';
import { applyEchuuCue } from '@/lib/echuu-vrm-bridge';
import { DEFAULT_IDLE_URL, DEFAULT_PREVIEW_MODEL_URL } from '@/config/vtuber-animations';

// PERF: 导入拆分的常量和组件
import {
  tmpVec3,
  tmpQuat,
  tmpEuler,
  MOUTH_SHAPE_KEYS,
  MOUTH_EXPRESSION_NAMES,
  LEFT_FINGER_BONE_NAMES,
  LEFT_FINGER_DATA_KEYS,
  RIGHT_FINGER_BONE_NAMES,
  RIGHT_FINGER_DATA_KEYS,
  handleProcessingError,
} from '@/components/vrm/constants';
import { BoneVisualizer } from '@/components/vrm/BoneVisualizer';

// VRMAvatar props interface for forwardRef
interface VRMAvatarProps {
    modelUrl?: string;
    animationUrl?: string;
    /** 下一个可能切换到的动画 URL，用于双缓冲预加载 */
    nextAnimationUrl?: string | null;
    /** 叠加层动画 URL（makeClipAdditive 后与 base 混合，如表情/姿态） */
    additiveAnimationUrl?: string | null;
    /** 叠加层权重 0–1，默认 0 */
    additiveWeight?: number;
    scale?: number;
    position?: [number, number, number];
    showBones?: boolean;
    showDebug?: boolean;
    testSettings?: any;
    showArmAxes?: boolean;
    axisSettings?: any;
    onAnimationManagerRef?: any;
    onHandDetectionStateRef?: any;
    onMocapStatusUpdate?: any;
    debugAxisConfig?: any;
    onAxisChange?: any;
    onRiggedPoseUpdate?: any;
    handDebugAxisConfig?: any;
    onHandAxisChange?: any;
    onRiggedHandUpdate?: any;
    echuuCue?: EchuuCue | null;
    echuuAudioPlaying?: boolean;
    [key: string]: any;
}
export const VRMAvatar = forwardRef<Group, VRMAvatarProps>(({
    modelUrl = DEFAULT_PREVIEW_MODEL_URL,
    animationUrl = DEFAULT_IDLE_URL,
    nextAnimationUrl = null,
    additiveAnimationUrl = null,
    additiveWeight = 0,
    scale = 1,
    position = [0, 0, 0],
    showBones = false,
    showDebug = false,
    testSettings = null,
    showArmAxes = false,
    axisSettings = DEFAULT_AXIS_SETTINGS,
    onAnimationManagerRef = null,
    onHandDetectionStateRef = null,
    onMocapStatusUpdate = null,
    debugAxisConfig = null,
    onAxisChange = null,
    onRiggedPoseUpdate = null,
    handDebugAxisConfig = null,
    onHandAxisChange = null,
    onRiggedHandUpdate = null,
    echuuCue = null,
    echuuAudioPlaying = false,
    ...props
}, ref) => {
    const { camera } = useThree();
    // lookAtUpdaterRef removed — VRMController handles head+eye tracking
    // 获取灵敏度设置
    const { settings } = useSensitivitySettings();

    // 从 store 读取缓存的模型
    const {
        vrmModel: cachedVRMModel,
        vrmModelUrl: cachedVRMModelUrl,
        setVRMModel,
        disposeCurrentVRM,
    } = useSceneStore();

    // 加载 VRM 模型 - useGLTF 会自动处理 URL 级别的缓存
    // 但我们还需要在 store 中缓存模型实例，以便在组件卸载/重新挂载时复用
    const gltfResult: any = useGLTF(
        modelUrl,
        undefined,
        undefined,
        (loader) => {
            loader.register((parser: any) => new VRMLoaderPlugin(parser) as any);
        }
    );
    const { scene, userData, errors, isLoading } = gltfResult;

    // 检查加载错误
    if (errors && process.env.NODE_ENV === 'development') {
        console.error('VRMAvatar: 模型加载错误', errors);
    }

    // 优先使用缓存的模型（如果 URL 匹配），否则使用新加载的模型
    // 注意：cachedVRMModel 是模型实例，userData?.vrm 是当前加载的模型
    const vrm = (cachedVRMModel && cachedVRMModelUrl === modelUrl)
        ? cachedVRMModel
        : userData?.vrm;

    // 当新模型加载完成时，缓存到 store（try/catch 隔离：单次失败不冒泡、不留下半更新状态）
    useEffect(() => {
        if (!userData?.vrm || !modelUrl) return;
        try {
            const vrmUuid = userData.vrm.scene?.uuid || 'unknown';
            const isLocalModel = !modelUrl.startsWith('http');

            if (cachedVRMModel && cachedVRMModelUrl && cachedVRMModelUrl !== modelUrl) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔄 VRMAvatar: 检测到模型 URL 变化，释放旧模型', {
                        oldUrl: cachedVRMModelUrl,
                        newUrl: modelUrl,
                        oldVrmUuid: cachedVRMModel.scene?.uuid,
                        newVrmUuid: vrmUuid
                    });
                }
                disposeCurrentVRM();
            }

            if (!cachedVRMModel || cachedVRMModelUrl !== modelUrl) {
                if (process.env.NODE_ENV === 'development') {
                    console.log('💾 VRMAvatar: 缓存新模型到 store', {
                        modelUrl,
                        vrmUuid,
                        isLocalModel,
                        hasScene: !!userData.vrm.scene,
                        hasHumanoid: !!userData.vrm.humanoid
                    });
                }
                setVRMModel(userData.vrm, modelUrl);
            } else {
                const cachedUuid = cachedVRMModel.scene?.uuid;
                if (cachedUuid !== vrmUuid) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('⚠️ VRMAvatar: URL相同但VRM实例不同，更新缓存', {
                            modelUrl,
                            cachedUuid,
                            newUuid: vrmUuid
                        });
                    }
                    disposeCurrentVRM();
                    setVRMModel(userData.vrm, modelUrl);
                }
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('[VRMAvatar] 缓存到 store 失败，保持状态一致', { modelUrl, error });
            }
            disposeCurrentVRM();
        }
    }, [userData?.vrm, modelUrl, cachedVRMModel, cachedVRMModelUrl, setVRMModel, disposeCurrentVRM]);

    // 当前 URL 加载报错时，清空该 URL 在 store 的缓存，避免继续使用旧的成功实例造成错觉
    useEffect(() => {
        if (errors && modelUrl && cachedVRMModelUrl === modelUrl) {
            disposeCurrentVRM();
        }
    }, [errors, modelUrl, cachedVRMModelUrl, disposeCurrentVRM]);

    // 动画管理器 - 移到vrm加载之后
    const {
        updateAnimation,
        shouldPlayIdle,
        getAnimationState,
        handleModeSwitch, // 新增：模式切换方法
        switchToMocapMode, // 新增：切换到动捕模式
        switchToIdleMode, // 新增：切换到idle模式
        forceIdleRestart // 新增：强制重启idle
    } = useAnimationManager(vrm, animationUrl, nextAnimationUrl ?? undefined, additiveAnimationUrl ?? undefined, additiveWeight);

    // 用 useRef 存储 animationManager，避免无限循环
    const animationManagerObjRef = useRef<any>(null);
    const hasRegisteredAnimationManager = useRef(false);

    // 更新 animationManager 对象的内容（不触发注册）
    useEffect(() => {
        animationManagerObjRef.current = {
            getAnimationState,
            getCurrentMode: () => {
                const state = getAnimationState();
                return state.currentMode;
            },
            switchToIdleMode,
            switchToMocapMode,
            forceIdleRestart
        };
    }, [getAnimationState, switchToIdleMode, switchToMocapMode, forceIdleRestart]);

    // 只在首次挂载时注册一次（使用 flag 防止重复注册）
    useEffect(() => {
        // 延迟执行确保 animationManagerObjRef 已赋值
        const timer = setTimeout(() => {
            if (onAnimationManagerRef && animationManagerObjRef.current && !hasRegisteredAnimationManager.current) {
                onAnimationManagerRef(animationManagerObjRef.current);
                hasRegisteredAnimationManager.current = true;
            }
        }, 0);
        
        return () => clearTimeout(timer);
    }, []); // ← 空依赖数组，只在挂载时执行一次

    // ✅ 获取摄像头状态（需要在使用前定义）
    const isCameraActive = useVideoRecognition((state) => state.isCameraActive);

    // 避免同一错误重复刷屏：只对新的 (vrmId, error) 打印一次
    const lastLoggedAnimationErrorRef = useRef<{ vrmId: string; error: string | null }>({ vrmId: '', error: null });

    // ✅ 新模型加载完成后，自动切换到idle模式并应用动画
    useEffect(() => {
        if (vrm && vrm.scene && vrm.humanoid && !isCameraActive) {
            const checkAndPlayAnimation = (attempt = 1, maxAttempts = 5) => {
                const animationState = getAnimationState();
                const vrmId = vrm.scene?.uuid || 'unknown';

                if (process.env.NODE_ENV === 'development') {
                    console.log(`VRMAvatar: 检查动画状态 (尝试 ${attempt}/${maxAttempts})`, {
                        vrmId,
                        currentMode: animationState.currentMode,
                        isPlayingIdle: animationState.isPlayingIdle,
                        hasMixer: animationState.hasMixer,
                        error: animationState.error,
                        animationUrl
                    });
                }

                if (animationState.hasMixer) {
                    if (animationState.currentMode !== 'idle' || !animationState.isPlayingIdle) {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('🎬 VRMAvatar: 模型加载完成，切换到idle模式', {
                                vrmId,
                                animationUrl,
                                hasMixer: animationState.hasMixer
                            });
                        }
                        switchToIdleMode();
                    } else {
                        if (process.env.NODE_ENV === 'development') {
                            console.log('✅ VRMAvatar: 动画已在播放', {
                                vrmId,
                                isPlayingIdle: animationState.isPlayingIdle
                            });
                        }
                    }
                } else if (animationState.error) {
                    const last = lastLoggedAnimationErrorRef.current;
                    if (last.vrmId !== vrmId || last.error !== animationState.error) {
                        lastLoggedAnimationErrorRef.current = { vrmId, error: animationState.error };
                        console.error('❌ VRMAvatar: 动画管理器初始化失败', {
                            vrmId,
                            error: animationState.error,
                            animationUrl
                        });
                    }
                } else if (attempt < maxAttempts) {
                    if (process.env.NODE_ENV === 'development') {
                        console.log(`⏳ VRMAvatar: 等待动画混合器初始化... (${attempt}/${maxAttempts})`);
                    }
                    setTimeout(() => checkAndPlayAnimation(attempt + 1, maxAttempts), 300);
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('⚠️ VRMAvatar: 超时，动画混合器仍未初始化', {
                            vrmId,
                            animationUrl
                        });
                    }
                }
            };

            const timer = setTimeout(() => checkAndPlayAnimation(), 300);
            return () => clearTimeout(timer);
        }
    }, [vrm, isCameraActive, getAnimationState, switchToIdleMode, animationUrl]);

    // 传递手部检测状态引用给父组件
    // 使用 ref 存储回调，避免无限循环
    const onHandDetectionStateRefRef = useRef(onHandDetectionStateRef);
    useEffect(() => {
        onHandDetectionStateRefRef.current = onHandDetectionStateRef;
    }, [onHandDetectionStateRef]);
    
    // 只在组件挂载时传递 ref，父组件可以直接访问这个 ref
    useEffect(() => {
        if (onHandDetectionStateRefRef.current) {
            onHandDetectionStateRefRef.current(handDetectionState);
        }
    }, []); // 空依赖数组，只在挂载时执行一次

    // 添加VRM加载调试信息
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            if (userData && !vrm) {
                console.warn('VRMAvatar: userData存在但vrm为null', userData);
            }

            if (errors) {
                console.error('VRMAvatar: 加载错误详情', errors);
            }
        }
    }, [modelUrl, userData, vrm, errors, scene]);

    const { setResultsCallback } = useVideoRecognition();
    const videoElement = useVideoRecognition((state) => state.videoElement);
    // isCameraActive 已在上面定义
    const setHandDebugInfo = useVideoRecognition((state) => state.setHandDebugInfo);

    // 添加调试信息 - 跟踪 videoElement 状态变化
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('VRMAvatar: videoElement 状态变化', {
                videoElement: !!videoElement,
                isCameraActive,
                hasVrm: !!vrm
            });
        }
    }, [videoElement, isCameraActive, vrm]);

    // 监听模型URL变化，强制重新加载
    useEffect(() => {
        // 清除之前的VRM实例
        if (vrm) {
            // VRM实例会在新模型加载时自动更新
        }
    }, [modelUrl, vrm]);

    // 设置VRM模型的影子
    useEffect(() => {
        if (scene) {
            // 遍历所有网格，设置影子
            scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }
    }, [scene]);

    // 新增：监听动画URL变化
    useEffect(() => {
        // 动画管理器会自动重新加载新的动画
    }, [animationUrl]);

    // 动捕数据引用
    const riggedFace = useRef<any>(null);
    const riggedPose = useRef<any>(null);
    const riggedLeftHand = useRef<any>(null);
    const riggedRightHand = useRef<any>(null);
    const blinkData = useRef({ leftEye: 1, rightEye: 1 }); // 添加眨眼数据引用

    // 动捕调试信息
    const mocapDebugInfo = useRef({
        mediapipeStatus: '未启动',
        kalidokitStatus: '未处理',
        faceDetection: false,
        poseDetection: false,
        leftHandDetection: false,
        rightHandDetection: false,
        lastResultsTime: null,
        processingTime: 0,
        errorCount: 0,
        successCount: 0,
        lastFaceProcessTime: 0,
        lastPoseProcessTime: 0,
        lastHandProcessTime: 0
    });

    // 手部检测状态
    const handDetectionState = useRef({
        hasLeftHand: false,
        hasRightHand: false,
        hasHandDetection: false
    });

    // 初始化 VRM 模型
    useEffect(() => {
        if (!vrm) return;

        // ✅ 修复 VRM 0.x 和 VRM 1.0 的朝向差异
        // VRM 0.x 规范要求面朝 -Z（向屏幕外），VRM 1.0 规范改为面朝 +Z（向屏幕内）
        // 如果代码假设是 VRM 1.0，加载 VRM 0.x 就会看到后背
        // VRMUtils.rotateVRM0() 会自动检测并修复这个差异
        VRMUtils.rotateVRM0(vrm);

        // VRM 优化
        VRMUtils.removeUnnecessaryVertices(scene);
        VRMUtils.combineSkeletons(scene);
        VRMUtils.combineMorphs(vrm);

        // 禁用视锥剔除以提高性能
        scene.traverse((obj: any) => {
            obj.frustumCulled = false;
        });

        // 打印 VRM 模型骨骼结构（仅开发环境），便于与动画 track 名对照
        if (process.env.NODE_ENV === 'development' && vrm.humanoid?.humanBones) {
            const humanBones = vrm.humanoid.humanBones;
            const boneNames = Object.keys(humanBones);
            const skeletonDebug: Record<string, { nodeName: string; parentName: string }> = {};
            boneNames.forEach(boneName => {
                const bone = humanBones[boneName];
                if (bone?.node) {
                    skeletonDebug[boneName] = {
                        nodeName: bone.node.name,
                        parentName: bone.node.parent?.name ?? '无',
                    };
                }
            });
            console.groupCollapsed('[VRMAvatar] VRM 骨骼结构（动画 track 需使用 nodeName）');
            console.log('骨骼数量:', boneNames.length);
            console.log('humanoid 骨骼 → 节点名（.quaternion / .position 的 track 前缀）:', skeletonDebug);
            console.log('骨骼列表:', boneNames);
            console.groupEnd();
        }

        // 注意：视线追踪现在由 useVRMLookAt hook 处理（见下方 804 行）
    }, [vrm, scene]);
    
    // VRM 信息记录器：仅挂载 hook 避免 ReferenceError，已关闭自动保存与日志
    useVRMInfoLogger({
      vrm,
      autoSave: false,
      logToConsole: false,
    });

    // MediaPipe 结果处理回调 - 性能优化版本
    const resultsCallback = useCallback((results: any) => {
        // 创建性能监控器
        const monitor = createPerformanceMonitor('MediaPipe回调');
        const startTime = performance.now();
        
        // 关键修复：使用直接传递的 videoElement，而不是从 store 获取
        const directVideoElement = results.videoElement || videoElement;
        
        // 快速验证必要组件
        if (!directVideoElement || !vrm) {
            return;
        }

        // 添加额外的时序检查
        if (!directVideoElement.readyState || directVideoElement.readyState < 2) {
            return;
        }

        monitor.checkpoint('组件验证');

        // 面部处理
        if (results.faceLandmarks) {
            const faceStartTime = performance.now();
            try {
                const faceResult = Face.solve(results.faceLandmarks, {
                    runtime: "mediapipe",
                    video: directVideoElement,
                    imageSize: { width: 640, height: 480 },
                    smoothBlink: false,
                    blinkSettings: [0.25, 0.75],
                });
                riggedFace.current = faceResult || null;
                
                const faceProcessTime = performance.now() - faceStartTime;
                mocapDebugInfo.current.lastFaceProcessTime = faceProcessTime;
                mocapDebugInfo.current.successCount++;
                
            } catch (error) {
                const faceProcessTime = performance.now() - faceStartTime;
                mocapDebugInfo.current.lastFaceProcessTime = faceProcessTime;
                handleProcessingError(error, 'Face.solve', mocapDebugInfo.current);
            }
        }

        // 姿态处理 - 检查 3D 数据是否存在
        if (results.poseLandmarks) {
            const poseStartTime = performance.now();
            try {
                // 尝试不同的 3D 数据字段名
                const pose3D = results.za || results.ea || results.poseWorldLandmarks;
                
                if (pose3D) {
                    // 修复：使用参考文件中的正确参数结构
                    riggedPose.current = Pose.solve(pose3D, results.poseLandmarks, {
                        runtime: "mediapipe",
                        video: directVideoElement,
                    });
                    
                    const poseProcessTime = performance.now() - poseStartTime;
                    mocapDebugInfo.current.lastPoseProcessTime = poseProcessTime;
                    mocapDebugInfo.current.successCount++;
                }
                
            } catch (error) {
                const poseProcessTime = performance.now() - poseStartTime;
                mocapDebugInfo.current.lastPoseProcessTime = poseProcessTime;
                handleProcessingError(error, 'Pose.solve', mocapDebugInfo.current);
            }
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.warn('VRMAvatar: 缺少姿态数据', {
                    hasPoseLandmarks: !!results.poseLandmarks
                });
            }
        }

        monitor.checkpoint('面部和姿态处理');

        // 手部处理 - 优化镜像映射
        let handProcessTime = 0;
        
        // 左手处理（镜像到右手）
        if (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) {
            const leftHandStartTime = performance.now();
            try {
                riggedRightHand.current = Hand.solve(results.leftHandLandmarks, "Right");
                handDetectionState.current.hasRightHand = true;
                
                const leftHandProcessTime = performance.now() - leftHandStartTime;
                handProcessTime = Math.max(handProcessTime, leftHandProcessTime);
                mocapDebugInfo.current.lastHandProcessTime = leftHandProcessTime;
                mocapDebugInfo.current.successCount++;
                
            } catch (error) {
                const leftHandProcessTime = performance.now() - leftHandStartTime;
                handProcessTime = Math.max(handProcessTime, leftHandProcessTime);
                mocapDebugInfo.current.lastHandProcessTime = leftHandProcessTime;
                handleProcessingError(error, 'Hand.solve (left->right)', mocapDebugInfo.current);
                handDetectionState.current.hasRightHand = false;
            }
        } else {
            handDetectionState.current.hasRightHand = false;
        }
        
        // 右手处理（镜像到左手）
        if (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) {
            const rightHandStartTime = performance.now();
            try {
                riggedLeftHand.current = Hand.solve(results.rightHandLandmarks, "Left");
                handDetectionState.current.hasLeftHand = true;
                
                const rightHandProcessTime = performance.now() - rightHandStartTime;
                handProcessTime = Math.max(handProcessTime, rightHandProcessTime);
                mocapDebugInfo.current.lastHandProcessTime = rightHandProcessTime;
                mocapDebugInfo.current.successCount++;
                
            } catch (error) {
                const rightHandProcessTime = performance.now() - rightHandStartTime;
                handProcessTime = Math.max(handProcessTime, rightHandProcessTime);
                mocapDebugInfo.current.lastHandProcessTime = rightHandProcessTime;
                handleProcessingError(error, 'Hand.solve (right->left)', mocapDebugInfo.current);
                handDetectionState.current.hasLeftHand = false;
            }
        } else {
            handDetectionState.current.hasLeftHand = false;
        }

        if (handProcessTime > 8) {
            // console.warn('VRMAvatar: 手部处理耗时过长', handProcessTime.toFixed(2) + 'ms');
        }

        monitor.checkpoint('手部处理');

        // 更新手部检测状态
        handDetectionState.current.hasHandDetection =
            handDetectionState.current.hasLeftHand || handDetectionState.current.hasRightHand;

        // 更新眨眼数据
        if (results.blinkData) {
            blinkData.current = results.blinkData;
        }

        // 计算总处理时间
        const totalProcessTime = performance.now() - startTime;
        mocapDebugInfo.current.processingTime = totalProcessTime;

        if (totalProcessTime > 12) {
            // console.warn('VRMAvatar: 总处理时间过长', totalProcessTime.toFixed(2) + 'ms');
        }

        // 优化手部调试信息 - 减少对象创建
        const handDebugInfo = {
            leftHandDetected: handDetectionState.current.hasLeftHand,
            rightHandDetected: handDetectionState.current.hasRightHand,
            leftHandData: riggedLeftHand.current ? {
                wrist: riggedLeftHand.current.LeftWrist,
                hasData: true
            } : null,
            rightHandData: riggedRightHand.current ? {
                wrist: riggedRightHand.current.RightWrist,
                hasData: true
            } : null,
            mappingInfo: handDetectionState.current.hasHandDetection ? 
                (handDetectionState.current.hasLeftHand && handDetectionState.current.hasRightHand ? 
                    '双手检测中' : 
                    (handDetectionState.current.hasLeftHand ? '仅左手检测中' : '仅右手检测中')
                ) : '无手部检测',
            mocapDebugInfo: mocapDebugInfo.current
        };
        
        setHandDebugInfo(handDebugInfo);

        // 最终性能检查
        const finalDuration = monitor.end();
        
        // 严重性能警告：超过16ms帧时间（仅开发环境）
        if (process.env.NODE_ENV === 'development' && finalDuration > 16) {
            console.error('VRMAvatar: 回调执行时间超过16ms', finalDuration.toFixed(2) + 'ms');
        }
        
    }, [videoElement, vrm, setHandDebugInfo, onMocapStatusUpdate]);

    // 注册结果回调
    useEffect(() => {
        setResultsCallback(resultsCallback);
    }, [resultsCallback, setResultsCallback]);

    // 表情插值函数
    const lerpExpression = useCallback((name: string, value: number, lerpFactor: number) => {
        if (!vrm?.expressionManager) return;

        const currentValue = vrm.expressionManager.getValue(name) || 0;
        const newValue = lerp(currentValue, value, lerpFactor);
        vrm.expressionManager.setValue(name, newValue);
    }, [vrm]);

    // PERF: 骨骼名称映射函数 - 使用提取的工具函数
    // 注意：mapBoneName 已从 @/lib/vrm/bone-mapping 导入

    // 骨骼旋转函数
    const rotateBone = useCallback((boneName: string, value: any, slerpFactor: number, flip = { x: 1, y: 1, z: 1 }) => {
        if (!vrm?.humanoid || !value) {
            return;
        }

        // 保护根骨骼，不允许移动
        const protectedBones = ['hips'];
        if (protectedBones.includes(boneName)) {
            return;
        }

        // 映射骨骼名称
        const mappedBoneName = mapBoneName(boneName);
        const bone = vrm.humanoid.getNormalizedBoneNode(mappedBoneName);
        if (!bone) {
            return;
        }

        // 应用旋转
        tmpEuler.set(value.x * flip.x, value.y * flip.y, value.z * flip.z);
        tmpQuat.setFromEuler(tmpEuler);
        bone.quaternion.slerp(tmpQuat, slerpFactor);
    }, [vrm]);

    // Disable VRM's built-in autoUpdate LookAt — VRMController handles it
    useEffect(() => {
        if (!vrm) return;
        if (vrm.lookAt && typeof (vrm.lookAt as any).autoUpdate !== 'undefined') {
            (vrm.lookAt as any).autoUpdate = false;
        }
    }, [vrm]);

    // 动画循环 - 简化模式切换逻辑
    useFrame((state, delta) => {
        if (!vrm) return;

        // **简化的模式切换逻辑：基于camera button状态**
        // 摄像头开启 = 动捕模式，摄像头关闭 = 预制动画模式
        const shouldUseMocap = isCameraActive;
        
        handleModeSwitch(shouldUseMocap);
        
        // 获取当前模式
        const animationState = getAnimationState();
        const currentMode = animationState.currentMode;

        const shouldApplyEchuu = (echuuCue || echuuAudioPlaying) && currentMode === 'idle';
        if (shouldApplyEchuu) {
            applyEchuuCue(vrm, echuuCue, echuuAudioPlaying, state.clock.getElapsedTime(), delta);
        }
        


        // **模式1：预制动画模式（摄像头关闭）**
        if (currentMode === 'idle') {
            // 只更新动画，完全忽略动捕数据
            try {
                updateAnimation(delta);
            } catch (error) {
                // console.warn('VRMAvatar: 动画更新错误', error);
            }
        }
        
        // **模式2：动捕模式（摄像头开启）**
        else if (currentMode === 'mocap') {
            const lerpFactor = delta * ANIMATION_CONFIG.LERP_FACTOR.expression;
            const boneLerpFactor = delta * ANIMATION_CONFIG.LERP_FACTOR.bone;

            // **面部表情处理**
            if (riggedFace.current) {
                try {
                    // PERF: 口型同步 - 使用预定义常量避免每帧创建数组
                    const mouthShape = riggedFace.current.mouth?.shape;
                    for (let i = 0; i < MOUTH_EXPRESSION_NAMES.length; i++) {
                        const value = mouthShape?.[MOUTH_SHAPE_KEYS[i]] || 0;
                        lerpExpression(MOUTH_EXPRESSION_NAMES[i], value, lerpFactor);
                    }

                    // 眨眼同步
                    if (blinkData.current) {
                        lerpExpression('blinkLeft', 1 - blinkData.current.leftEye, lerpFactor);
                        lerpExpression('blinkRight', 1 - blinkData.current.rightEye, lerpFactor);
                    } else if (riggedFace.current && riggedFace.current.eye) {
                        lerpExpression('blinkLeft', 1 - (riggedFace.current.eye.l || 1), lerpFactor);
                        lerpExpression('blinkRight', 1 - (riggedFace.current.eye.r || 1), lerpFactor);
                    }

                    // 头部旋转 - 参考提供的文件，使用正确的骨骼名称
                    if (riggedFace.current && riggedFace.current.head) {
                        const rawNeckData = {
                            x: riggedFace.current.head.x * axisSettings.neck.x,
                            y: riggedFace.current.head.y * axisSettings.neck.y,
                            z: riggedFace.current.head.z * axisSettings.neck.z,
                        };
                        
                        // 使用 'neck' 而不是 'Neck'，参考提供的文件
                        rotateBone('neck', rawNeckData, boneLerpFactor, { x: 0.7, y: 0.7, z: 0.7 });
                    }

                } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error('VRMAvatar: 面部表情处理错误', error);
                    }
                }
            }

            // **身体姿态处理**
            if (riggedPose.current) {
                try {
                    // 躯干控制
                    if (riggedPose.current.Spine) {
                        rotateBone('Spine', riggedPose.current.Spine, boneLerpFactor, { x: 0.3, y: 0.3, z: 0.3 });
                    }

                    // 手臂控制 - 使用调试面板的动态配置
                    if (riggedPose.current.LeftUpperArm) {
                        const leftArmData = {
                            x: riggedPose.current.LeftUpperArm.x * (debugAxisConfig?.leftArm?.x || 1),
                            y: riggedPose.current.LeftUpperArm.y * (debugAxisConfig?.leftArm?.y || 1),
                            z: riggedPose.current.LeftUpperArm.z * (debugAxisConfig?.leftArm?.z || 1),
                        };
                        rotateBone('leftUpperArm', leftArmData, boneLerpFactor * settings.armSpeed);
                    }
                    
                    if (riggedPose.current.LeftLowerArm) {
                        const leftLowerArmData = {
                            x: riggedPose.current.LeftLowerArm.x * (debugAxisConfig?.leftLowerArm?.x || 1),
                            y: riggedPose.current.LeftLowerArm.y * (debugAxisConfig?.leftLowerArm?.y || 1),
                            z: riggedPose.current.LeftLowerArm.z * (debugAxisConfig?.leftLowerArm?.z || 1),
                        };
                        rotateBone('leftLowerArm', leftLowerArmData, boneLerpFactor * settings.armSpeed);
                    }

                    if (riggedPose.current.RightUpperArm) {
                        const rightArmData = {
                            x: riggedPose.current.RightUpperArm.x * (debugAxisConfig?.rightArm?.x || 1),
                            y: riggedPose.current.RightUpperArm.y * (debugAxisConfig?.rightArm?.y || 1),
                            z: riggedPose.current.RightUpperArm.z * (debugAxisConfig?.rightArm?.z || 1),
                        };
                        rotateBone('rightUpperArm', rightArmData, boneLerpFactor * settings.armSpeed);
                    }
                    
                    if (riggedPose.current.RightLowerArm) {
                        const rightLowerArmData = {
                            x: riggedPose.current.RightLowerArm.x * (debugAxisConfig?.rightLowerArm?.x || 1),
                            y: riggedPose.current.RightLowerArm.y * (debugAxisConfig?.rightLowerArm?.y || 1),
                            z: riggedPose.current.RightLowerArm.z * (debugAxisConfig?.rightLowerArm?.z || 1),
                        };
                        rotateBone('rightLowerArm', rightLowerArmData, boneLerpFactor * settings.armSpeed);
                    }

                    // 手部控制 - 使用调试面板的动态配置
                    if (riggedLeftHand.current && riggedPose.current.LeftHand) {
                        const leftHandData = {
                            z: riggedPose.current.LeftHand.z * (handDebugAxisConfig?.leftHand?.z || 1),
                            y: riggedLeftHand.current.LeftWrist.y * (handDebugAxisConfig?.leftHand?.y || 1),
                            x: riggedLeftHand.current.LeftWrist.x * (handDebugAxisConfig?.leftHand?.x || 1),
                        };
                        rotateBone('leftHand', leftHandData, boneLerpFactor * settings.handSpeed);
                    }

                    if (riggedRightHand.current && riggedPose.current.RightHand) {
                        const rightHandData = {
                            z: riggedPose.current.RightHand.z * (handDebugAxisConfig?.rightHand?.z || 1),
                            y: riggedRightHand.current.RightWrist.y * (handDebugAxisConfig?.rightHand?.y || 1),
                            x: riggedRightHand.current.RightWrist.x * (handDebugAxisConfig?.rightHand?.x || 1),
                        };
                        rotateBone('rightHand', rightHandData, boneLerpFactor * settings.handSpeed);
                    }

                } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.warn('VRMAvatar: 身体姿态处理错误', error);
                    }
                }
            } else {
                // 添加调试信息 - 确认没有姿态数据（每5秒输出一次，仅开发环境）
                if (process.env.NODE_ENV === 'development' && Math.floor(Date.now() / 1000) % 5 === 0) {
                    console.log('VRMAvatar: 没有姿态数据可处理');
                }
            }

            // PERF: **手指控制** - 使用预定义常量避免每帧创建数组
            if (riggedLeftHand.current) {
                try {
                    // 左手手指控制 - 使用预定义数组
                    const leftHand = riggedLeftHand.current;
                    for (let i = 0; i < LEFT_FINGER_BONE_NAMES.length; i++) {
                        const bone = LEFT_FINGER_BONE_NAMES[i];
                        const data = leftHand[LEFT_FINGER_DATA_KEYS[i]];
                        if (data) {
                            const fingerConfig = handDebugAxisConfig?.[bone] || DEFAULT_FINGER_AXIS_SETTINGS;
                            rotateBone(bone, {
                                x: -data.x * fingerConfig.x,
                                y: -data.z * fingerConfig.y,
                                z: data.y * fingerConfig.z,
                            }, boneLerpFactor * settings.fingerSpeed);
                        }
                    }
                } catch (error) {
                    // console.warn('VRMAvatar: 左手处理错误', error);
                }
            }

            if (riggedRightHand.current) {
                try {
                    // 右手手指控制 - 使用预定义数组
                    const rightHand = riggedRightHand.current;
                    for (let i = 0; i < RIGHT_FINGER_BONE_NAMES.length; i++) {
                        const bone = RIGHT_FINGER_BONE_NAMES[i];
                        const data = rightHand[RIGHT_FINGER_DATA_KEYS[i]];
                        if (data) {
                            const fingerConfig = handDebugAxisConfig?.[bone] || DEFAULT_FINGER_AXIS_SETTINGS;
                            rotateBone(bone, {
                                x: -data.x * fingerConfig.x,
                                y: -data.z * fingerConfig.y,
                                z: data.y * fingerConfig.z,
                            }, boneLerpFactor * settings.fingerSpeed);
                        }
                    }
                } catch (error) {
                    // console.warn('VRMAvatar: 右手处理错误', error);
                }
            }
        }

        // **最后统一更新VRM（必须在 LookAt 之前更新）**
        vrm.update(delta);

        // Head + eye tracking handled by VRMController (runs after this useFrame)
        
        // 更新调试面板数据
        if (onRiggedPoseUpdate && riggedPose.current) {
            onRiggedPoseUpdate(riggedPose.current);
        }
        
        // 更新手部调试面板数据
        if (onRiggedHandUpdate && (riggedLeftHand.current || riggedRightHand.current)) {
            onRiggedHandUpdate(riggedLeftHand.current, riggedRightHand.current);
        }
    });

    // 使用 ref 存储最新的 callback，避免频繁更新 store
    const resultsCallbackRef = useRef(resultsCallback);
    
    // 保持 ref 同步
    useEffect(() => {
        resultsCallbackRef.current = resultsCallback;
    }, [resultsCallback]);

    // 注册结果回调到 useVideoRecognition
    useEffect(() => {
        setResultsCallback(resultsCallback);
    }, [resultsCallback, setResultsCallback]);

    // 将 resultsCallback 注册到场景 store（用于其他组件访问）
    // 使用 ref 包装，避免 callback 变化时频繁更新 store
    useEffect(() => {
        const { setResultsCallback: setStoreCallback } = useSceneStore.getState();
        // 创建一个稳定的包装函数，内部调用最新的 callback
        const wrappedCallback = (results: any) => {
            resultsCallbackRef.current?.(results);
        };
        setStoreCallback(wrappedCallback);
        
        return () => {
            setStoreCallback(null);
        };
    }, []); // 空依赖数组，只在挂载/卸载时执行

    // 同步 ref 到 scene（从 JSX 中移出，符合 Hooks 规则）
    useEffect(() => {
        if (ref && scene) {
            // 如果ref是函数，调用它
            if (typeof ref === 'function') {
                ref(scene);
            } else if (ref.current !== undefined) {
                ref.current = scene;
            }
        }
    }, [ref, scene]);

    return (
        <>
            {/* 模型加载状态指示器 */}
            <ModelLoadingIndicator 
                isLoading={isLoading} 
                error={errors} 
                modelName={modelUrl.split('/').pop() || '未知模型'}
            />
            
            <group {...props} ref={ref}>
                <primitive
                    object={scene}
                    scale={scale}
                    position={position}
                    castShadow
                />
                
                {/* 原有的骨骼可视化 */}
                {(() => {
                    const shouldRender = vrm && showBones;
                    return shouldRender ? (
                        <>
                            <BoneVisualizer vrm={vrm} />
                        </>
                    ) : null;
                })()}
                
                {/* 新增：调试工具 */}
                {showDebug && (
                    <>
                        <CoordinateAxes position={[2, 0, 0]} size={0.8} />
                        <ArmDirectionDebugger
                            vrm={vrm}
                            riggedPose={riggedPose}
                            showDebug={showDebug}
                        />
                        {/* DataDisplayPanel removed - component not implemented */}
                        {/* 手臂坐标轴可视化 */}
                        <SimpleArmAxes vrm={vrm} showDebug={showArmAxes} />
                    </>
                )}
                
                {/* VRM Controller: auto-blink, head faces camera, eyes follow mouse */}
                {vrm && (
                    <VRMController
                        vrm={vrm}
                        enabled={true}
                        autoBlink={true}
                        headTracking={true}
                        eyeTracking={true}
                        cameraFollow={false}
                    />
                )}
                
            </group>
        </>
    );
});

// 添加 displayName
VRMAvatar.displayName = 'VRMAvatar';

// PERF: 注意：VRMAvatar 已经使用了 forwardRef，React.memo 不能直接包装 forwardRef
// 如果需要 memo 优化，需要在组件内部使用 useMemo 优化渲染逻辑
// 由于 VRMAvatar 的 props 比较复杂（包含很多 callback），memo 可能不会带来太大收益
// 这里保持原样，避免破坏 forwardRef 的使用

// PERF: 使用 memo 包装 forwardRef 组件以优化性能
export const VRMAvatarMemo = memo(VRMAvatar);

// 保持向后兼容，同时导出优化版本
// 注意：由于 forwardRef 的特殊性，memo 需要特殊处理
// 这里我们保持原导出，memo 会在内部优化