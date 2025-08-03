import { useEffect, useRef, useCallback, useState, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { Face, Hand, Pose } from 'kalidokit';
import { Euler, Object3D, Quaternion, Vector3, Mesh, CylinderGeometry, MeshBasicMaterial, Group } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { useVideoRecognition } from '@/hooks/use-video-recognition';
import { useSensitivitySettings } from '@/hooks/use-sensitivity-settings';
import { calculateArms, calculateHandIK, smoothArmRotation, isArmVisible, validateHumanRotation } from '@/lib/arm-calculator';
import { useAnimationManager } from '@/lib/animation-manager';
import { ANIMATION_CONFIG } from '@/lib/constants';
import { CoordinateAxes, ArmDirectionDebugger, DataDisplayPanel, SimpleArmAxes } from './DebugHelpers';
import { HandDebugPanel } from './HandDebugPanel';
import { ArmDebugPanel } from './ArmDebugPanel';

const tmpVec3 = new Vector3();
const tmpQuat = new Quaternion();
const tmpEuler = new Euler();

interface ModelLoadingIndicatorProps {
  isLoading?: boolean;
  error?: string | null;
  modelName?: string;
}

// 模型加载状态组件
const ModelLoadingIndicator: React.FC<ModelLoadingIndicatorProps> = ({ isLoading, error, modelName }) => {
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-red-500 text-xl mb-4">⚠️ 模型加载失败</div>
          <div className="text-gray-700 mb-4">
            无法加载模型 &quot;{modelName}&quot;，请检查网络连接或稍后重试。
          </div>
          <div className="text-sm text-gray-500">
            错误信息: {typeof error === 'object' && error && 'message' in error 
            ? (error as any).message 
            : error}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900 mb-2">正在加载模型</div>
          <div className="text-gray-600 mb-2">{modelName}</div>
          <div className="text-sm text-gray-500">
            从 GitHub Releases 下载中，请稍候...
          </div>
          <div className="mt-4 text-xs text-gray-400">
            首次加载可能需要较长时间，请耐心等待
          </div>
          <div className="mt-2 text-xs text-gray-400">
            下载进度: <span className="animate-pulse">处理中...</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// 性能监控辅助函数
const createPerformanceMonitor = (name: string) => {
    const startTime = performance.now();
    return {
        checkpoint: (checkpointName: string) => {
            const currentTime = performance.now();
            const duration = currentTime - startTime;
            if (duration > 5) { // 只记录超过5ms的检查点
                // console.warn(`性能监控 [${name}]: ${checkpointName} 耗时 ${duration.toFixed(2)}ms`);
            }
            return duration;
        },
        end: () => {
            const totalTime = performance.now() - startTime;
            if (totalTime > 12) { // 只记录超过12ms的总时间
                // console.warn(`性能监控 [${name}]: 总耗时 ${totalTime.toFixed(2)}ms`);
            }
            return totalTime;
        }
    };
};

// 性能优化的批量更新函数
const batchUpdateDebugInfo = (debugInfo: any, updates: any) => {
    Object.assign(debugInfo, updates);
};

// 优化的错误处理函数
const handleProcessingError = (error: any, processName: string, debugInfo: any) => {
    console.error(`VRMAvatar: ${processName} 错误`, error.message);
    debugInfo.errorCount++;
};

interface BoneVisualizerProps {
  vrm: any;
}

// 骨骼可视化组件 - 使用圆柱体
const BoneVisualizer: React.FC<BoneVisualizerProps> = ({ vrm }) => {
    const [boneMeshes, setBoneMeshes] = useState<any[]>([]);

    useEffect(() => {
        if (!vrm?.humanoid) {
            return;
        }

        // 使用正确的 VRM API 访问骨骼
        const humanBones = vrm.humanoid.humanBones;
        const boneNames = Object.keys(humanBones);

        const meshes: any[] = [];

        // 创建骨骼可视化 - 使用圆柱体
        boneNames.forEach((boneName) => {
            const bone = humanBones[boneName];
            if (bone.node && bone.node.parent) {
                const parent = bone.node.parent;
                const child = bone.node;

                // 获取父子节点的世界坐标
                const parentWorldPos = parent.getWorldPosition(new Vector3());
                const childWorldPos = child.getWorldPosition(new Vector3());

                // 计算骨骼长度和方向
                const direction = new Vector3().subVectors(childWorldPos, parentWorldPos);
                const length = direction.length();

                if (length > 0.01) { // 只显示有意义的骨骼
                    // 创建细长圆柱体
                    const geometry = new CylinderGeometry(0.02, 0.02, length, 8);
                    const material = new MeshBasicMaterial({
                        color: 0x00ff00, // 改为绿色，更容易看到
                        transparent: true,
                        opacity: 0.9 // 增加透明度
                    });
                    const mesh = new Mesh(geometry, material);

                    // 设置圆柱体位置和旋转
                    const center = new Vector3().addVectors(parentWorldPos, childWorldPos).multiplyScalar(0.5);
                    mesh.position.copy(center);

                    // 计算旋转以对齐骨骼方向
                    const up = new Vector3(0, 1, 0);
                    const axis = new Vector3().crossVectors(up, direction.normalize());
                    const angle = Math.acos(up.dot(direction.normalize()));

                    if (axis.length() > 0.001) {
                        mesh.quaternion.setFromAxisAngle(axis, angle);
                    }

                    mesh.userData = { boneName: boneName };
                    meshes.push(mesh);
                }
            }
        });

        setBoneMeshes(meshes);
    }, [vrm]);

    // 更新骨骼位置
    useFrame(() => {
        if (!vrm?.humanoid) return;

        // 使用正确的 VRM API 访问骨骼
        const humanBones = vrm.humanoid.humanBones;
        const boneNames = Object.keys(humanBones);

        (boneMeshes as any[]).forEach((mesh: any, index: number) => {
            const boneName = boneNames[index];
            if (!boneName) return;

            const bone = humanBones[boneName];
            if (bone?.node?.parent) {
                const parent = bone.node.parent;
                const child = bone.node;

                // 获取当前世界坐标
                const parentWorldPos = parent.getWorldPosition(new Vector3());
                const childWorldPos = child.getWorldPosition(new Vector3());

                // 更新圆柱体位置和旋转
                const direction = new Vector3().subVectors(childWorldPos, parentWorldPos);
                const length = direction.length();

                if (length > 0.01) {
                    const center = new Vector3().addVectors(parentWorldPos, childWorldPos).multiplyScalar(0.5);
                    mesh.position.copy(center);

                    // 更新旋转
                    const up = new Vector3(0, 1, 0);
                    const axis = new Vector3().crossVectors(up, direction.normalize());
                    const angle = Math.acos(up.dot(direction.normalize()));

                    if (axis.length() > 0.001) {
                        mesh.quaternion.setFromAxisAngle(axis, angle);
                    }
                }
            }
        });
    });

    return (
        <group>
            {boneMeshes.map((mesh, index) => (
                <primitive key={`bone-${index}`} object={mesh} />
            ))}
        </group>
    );
};

// VRMAvatar props interface for forwardRef
interface VRMAvatarProps {
    modelUrl?: string;
    animationUrl?: string;
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
    [key: string]: any;
}
export const VRMAvatar = forwardRef<Group, VRMAvatarProps>(({
    modelUrl = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm',
    animationUrl = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Idle.fbx',
    scale = 1,
    position = [0, 0, 0],
    showBones = false,
    showDebug = false,
    testSettings = null,
    showArmAxes = false,
    axisSettings = {
        leftArm: { x: 1, y: 1, z: 1 },
        rightArm: { x: -1, y: 1, z: 1 },
        leftHand: { x: 1, y: 1, z: -1 },
        rightHand: { x: -1, y: 1, z: -1 },
        neck: { x: -1, y: 1, z: -1 }
    },
    onAnimationManagerRef = null,
    onHandDetectionStateRef = null,
    onMocapStatusUpdate = null,
    debugAxisConfig = null,
    onAxisChange = null,
    onRiggedPoseUpdate = null,
    handDebugAxisConfig = null,
    onHandAxisChange = null,
    onRiggedHandUpdate = null,
    ...props
}, ref) => {
    // 获取灵敏度设置
    const { settings } = useSensitivitySettings();

    // 加载 VRM 模型 - 参考提供的文件
    const gltfResult: any = useGLTF(
        modelUrl,
        undefined,
        undefined,
        (loader) => {
            loader.register((parser) => {
                return new VRMLoaderPlugin(parser);
            });
        }
    );
    const { scene, userData, errors, isLoading } = gltfResult;

    // 检查加载错误
    if (errors) {
        console.error('VRMAvatar: 模型加载错误', errors);
    }

    // 使用 userData.vrm 而不是 userData?.vrm，参考提供的文件
    const vrm = userData?.vrm; // 改回使用可选链操作符

    // 动画管理器 - 移到vrm加载之后
    const {
        updateAnimation,
        playAnimation,
        stopAnimation,
        switchAnimation,
        shouldPlayIdle,
        getAnimationState,
        animationClip,
        currentAnimation,
        handleModeSwitch, // 新增：模式切换方法
        switchToMocapMode, // 新增：切换到动捕模式
        switchToIdleMode, // 新增：切换到idle模式
        forceIdleRestart // 新增：强制重启idle
    } = useAnimationManager(vrm, animationUrl);

    // 传递动画管理器引用给父组件
    useEffect(() => {
        if (onAnimationManagerRef) {
            const animationManager = {
                getAnimationState,
                getCurrentMode: () => {
                    const state = getAnimationState();
                    return state.currentMode;
                },
                switchToIdleMode,
                switchToMocapMode,
                forceIdleRestart
            };
            onAnimationManagerRef(animationManager);
        }
    }, [onAnimationManagerRef, getAnimationState, switchToIdleMode, switchToMocapMode, forceIdleRestart]);

    // 传递手部检测状态引用给父组件
    useEffect(() => {
        if (onHandDetectionStateRef) {
            onHandDetectionStateRef(handDetectionState);
        }
    }, [onHandDetectionStateRef]);

    // 添加VRM加载调试信息
    useEffect(() => {
        if (userData && !vrm) {
            console.warn('VRMAvatar: userData存在但vrm为null', userData);
        }

        if (errors) {
            console.error('VRMAvatar: 加载错误详情', errors);
        }
    }, [modelUrl, userData, vrm, errors, scene]);

    const { setResultsCallback } = useVideoRecognition();
    const videoElement = useVideoRecognition((state) => state.videoElement);
    const isCameraActive = useVideoRecognition((state) => state.isCameraActive);
    const setHandDebugInfo = useVideoRecognition((state) => state.setHandDebugInfo);

    // 添加调试信息 - 跟踪 videoElement 状态变化
    useEffect(() => {
        console.log('VRMAvatar: videoElement 状态变化', {
            videoElement: !!videoElement,
            isCameraActive,
            hasVrm: !!vrm
        });
    }, [videoElement, isCameraActive, vrm]);

    // 监听模型URL变化，强制重新加载
    useEffect(() => {
        // 清除之前的VRM实例
        if (vrm) {
            // VRM实例会在新模型加载时自动更新
        }
    }, [modelUrl, vrm]);

    // 新增：监听动画URL变化
    useEffect(() => {
        // 动画管理器会自动重新加载新的动画
    }, [animationUrl]);

    // 动捕数据引用
    const riggedFace = useRef(null);
    const riggedPose = useRef(null);
    const riggedLeftHand = useRef(null);
    const riggedRightHand = useRef(null);
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

    // 视线追踪
    const lookAtTarget = useRef();
    const lookAtDestination = useRef(new Vector3(0, 0, 0));

    const { camera } = useThree();

    // 初始化 VRM 模型
    useEffect(() => {
        if (!vrm) return;

        // VRM 优化
        VRMUtils.removeUnnecessaryVertices(scene);
        VRMUtils.combineSkeletons(scene);
        VRMUtils.combineMorphs(vrm);

        // 禁用视锥剔除以提高性能
        scene.traverse((obj: any) => {
            obj.frustumCulled = false;
        });

        // 打印 VRM 模型骨骼结构
        console.log('=== VRM 模型骨骼结构 ===');
        if (vrm.humanoid && vrm.humanoid.humanBones) {
            const humanBones = vrm.humanoid.humanBones;
            const boneNames = Object.keys(humanBones);
            console.log('VRM 可用骨骼列表:', boneNames);
            
            // 打印详细的骨骼信息
            boneNames.forEach(boneName => {
                const bone = humanBones[boneName];
                if (bone && bone.node) {
                    console.log(`骨骼: ${boneName}`, {
                        hasNode: !!bone.node,
                        nodeName: bone.node.name,
                        parentName: bone.node.parent?.name || '无父节点'
                    });
                }
            });
        }

        // 设置视线追踪目标
        lookAtTarget.current = new Object3D();
        camera.add(lookAtTarget.current);

        return () => {
            if (lookAtTarget.current) {
                camera.remove(lookAtTarget.current);
            }
        };
    }, [vrm, scene, camera]);

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
                riggedFace.current = Face.solve(results.faceLandmarks, {
                    runtime: "mediapipe",
                    video: directVideoElement,
                    imageSize: { width: 640, height: 480 },
                    smoothBlink: false,
                    blinkSettings: [0.25, 0.75],
                });
                
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
            console.warn('VRMAvatar: 缺少姿态数据', {
                hasPoseLandmarks: !!results.poseLandmarks
            });
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
        
        // 严重性能警告：超过16ms帧时间
        if (finalDuration > 16) {
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

    // 骨骼名称映射函数
    const mapBoneName = useCallback((kalidokitBoneName: string) => {
        const boneNameMap = {
            // 躯干
            'Spine': 'spine',
            'Chest': 'chest',
            'Neck': 'neck',
            'Head': 'head',
            
            // 左臂 - 使用参考文件中的小写格式
            'LeftShoulder': 'leftShoulder',
            'LeftUpperArm': 'leftUpperArm',
            'LeftLowerArm': 'leftLowerArm',
            'LeftHand': 'leftHand',
            
            // 右臂 - 使用参考文件中的小写格式
            'RightShoulder': 'rightShoulder',
            'RightUpperArm': 'rightUpperArm',
            'RightLowerArm': 'rightLowerArm',
            'RightHand': 'rightHand',
            
            // 左腿
            'LeftUpperLeg': 'leftUpperLeg',
            'LeftLowerLeg': 'leftLowerLeg',
            'LeftFoot': 'leftFoot',
            
            // 右腿
            'RightUpperLeg': 'rightUpperLeg',
            'RightLowerLeg': 'rightLowerLeg',
            'RightFoot': 'rightFoot',
            
            // 左手手指
            'leftRingProximal': 'leftRingProximal',
            'leftRingIntermediate': 'leftRingIntermediate',
            'leftRingDistal': 'leftRingDistal',
            'leftIndexProximal': 'leftIndexProximal',
            'leftIndexIntermediate': 'leftIndexIntermediate',
            'leftIndexDistal': 'leftIndexDistal',
            'leftMiddleProximal': 'leftMiddleProximal',
            'leftMiddleIntermediate': 'leftMiddleIntermediate',
            'leftMiddleDistal': 'leftMiddleDistal',
            'leftThumbProximal': 'leftThumbProximal',
            'leftThumbMetacarpal': 'leftThumbMetacarpal',
            'leftThumbDistal': 'leftThumbDistal',
            'leftLittleProximal': 'leftLittleProximal',
            'leftLittleIntermediate': 'leftLittleIntermediate',
            'leftLittleDistal': 'leftLittleDistal',
            
            // 右手手指
            'rightRingProximal': 'rightRingProximal',
            'rightRingIntermediate': 'rightRingIntermediate',
            'rightRingDistal': 'rightRingDistal',
            'rightIndexProximal': 'rightIndexProximal',
            'rightIndexIntermediate': 'rightIndexIntermediate',
            'rightIndexDistal': 'rightIndexDistal',
            'rightMiddleProximal': 'rightMiddleProximal',
            'rightMiddleIntermediate': 'rightMiddleIntermediate',
            'rightMiddleDistal': 'rightMiddleDistal',
            'rightThumbProximal': 'rightThumbProximal',
            'rightThumbMetacarpal': 'rightThumbMetacarpal',
            'rightThumbDistal': 'rightThumbDistal',
            'rightLittleProximal': 'rightLittleProximal',
            'rightLittleIntermediate': 'rightLittleIntermediate',
            'rightLittleDistal': 'rightLittleDistal',
        };
        
        const mappedName = boneNameMap[kalidokitBoneName] || kalidokitBoneName;
        
        return mappedName;
    }, []);

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
    }, [vrm, mapBoneName]);

    // 动画循环 - 简化模式切换逻辑
    useFrame((_, delta) => {
        if (!vrm) return;

        // **简化的模式切换逻辑：基于camera button状态**
        // 摄像头开启 = 动捕模式，摄像头关闭 = 预制动画模式
        const shouldUseMocap = isCameraActive;
        
        handleModeSwitch(shouldUseMocap);
        
        // 获取当前模式
        const animationState = getAnimationState();
        const currentMode = animationState.currentMode;
        


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
                    // 口型同步
                    const mouthShapes = [
                        { name: 'aa', value: riggedFace.current.mouth?.shape?.A || 0 },
                        { name: 'ih', value: riggedFace.current.mouth?.shape?.I || 0 },
                        { name: 'ee', value: riggedFace.current.mouth?.shape?.E || 0 },
                        { name: 'oh', value: riggedFace.current.mouth?.shape?.O || 0 },
                        { name: 'ou', value: riggedFace.current.mouth?.shape?.U || 0 },
                    ];

                    mouthShapes.forEach(({ name, value }) => {
                        lerpExpression(name, value, lerpFactor);
                    });

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
                    console.error('VRMAvatar: 面部表情处理错误', error);
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
                    console.warn('VRMAvatar: 身体姿态处理错误', error);
                }
            } else {
                // 添加调试信息 - 确认没有姿态数据（每5秒输出一次）
                if (Math.floor(Date.now() / 1000) % 5 === 0) {
                    console.log('VRMAvatar: 没有姿态数据可处理');
                }
            }

            // **手指控制**
            if (riggedLeftHand.current) {
                try {
                    // 左手手指控制 - 镜像映射
                    const leftFingerBones = [
                        { bone: 'leftRingProximal', data: riggedLeftHand.current.LeftRingProximal },
                        { bone: 'leftRingIntermediate', data: riggedLeftHand.current.LeftRingIntermediate },
                        { bone: 'leftRingDistal', data: riggedLeftHand.current.LeftRingDistal },
                        { bone: 'leftIndexProximal', data: riggedLeftHand.current.LeftIndexProximal },
                        { bone: 'leftIndexIntermediate', data: riggedLeftHand.current.LeftIndexIntermediate },
                        { bone: 'leftIndexDistal', data: riggedLeftHand.current.LeftIndexDistal },
                        { bone: 'leftMiddleProximal', data: riggedLeftHand.current.LeftMiddleProximal },
                        { bone: 'leftMiddleIntermediate', data: riggedLeftHand.current.LeftMiddleIntermediate },
                        { bone: 'leftMiddleDistal', data: riggedLeftHand.current.LeftMiddleDistal },
                        { bone: 'leftThumbProximal', data: riggedLeftHand.current.LeftThumbProximal },
                        { bone: 'leftThumbMetacarpal', data: riggedLeftHand.current.LeftThumbIntermediate },
                        { bone: 'leftThumbDistal', data: riggedLeftHand.current.LeftThumbDistal },
                        { bone: 'leftLittleProximal', data: riggedLeftHand.current.LeftLittleProximal },
                        { bone: 'leftLittleIntermediate', data: riggedLeftHand.current.LeftLittleIntermediate },
                        { bone: 'leftLittleDistal', data: riggedLeftHand.current.LeftLittleDistal }
                    ];

                    leftFingerBones.forEach(({ bone, data }) => {
                        if (data) {
                            const fingerConfig = handDebugAxisConfig?.[bone] || { x: -1, y: -1, z: 1 };
                            const rawFingerData = {
                                x: -data.x * fingerConfig.x,
                                y: -data.z * fingerConfig.y,
                                z: data.y * fingerConfig.z,
                            };
                            rotateBone(bone, rawFingerData, boneLerpFactor * settings.fingerSpeed);
                        }
                    });
                } catch (error) {
                    // console.warn('VRMAvatar: 左手处理错误', error);
                }
            }

            if (riggedRightHand.current) {
                try {
                    // 右手手指控制 - 镜像映射
                    const rightFingerBones = [
                        { bone: 'rightRingProximal', data: riggedRightHand.current.RightRingProximal },
                        { bone: 'rightRingIntermediate', data: riggedRightHand.current.RightRingIntermediate },
                        { bone: 'rightRingDistal', data: riggedRightHand.current.RightRingDistal },
                        { bone: 'rightIndexProximal', data: riggedRightHand.current.RightIndexProximal },
                        { bone: 'rightIndexIntermediate', data: riggedRightHand.current.RightIndexIntermediate },
                        { bone: 'rightIndexDistal', data: riggedRightHand.current.RightIndexDistal },
                        { bone: 'rightMiddleProximal', data: riggedRightHand.current.RightMiddleProximal },
                        { bone: 'rightMiddleIntermediate', data: riggedRightHand.current.RightMiddleIntermediate },
                        { bone: 'rightMiddleDistal', data: riggedRightHand.current.RightMiddleDistal },
                        { bone: 'rightThumbProximal', data: riggedRightHand.current.RightThumbProximal },
                        { bone: 'rightThumbMetacarpal', data: riggedRightHand.current.RightThumbIntermediate },
                        { bone: 'rightThumbDistal', data: riggedRightHand.current.RightThumbDistal },
                        { bone: 'rightLittleProximal', data: riggedRightHand.current.RightLittleProximal },
                        { bone: 'rightLittleIntermediate', data: riggedRightHand.current.RightLittleIntermediate },
                        { bone: 'rightLittleDistal', data: riggedRightHand.current.RightLittleDistal }
                    ];

                    rightFingerBones.forEach(({ bone, data }) => {
                        if (data) {
                            const fingerConfig = handDebugAxisConfig?.[bone] || { x: -1, y: -1, z: 1 };
                            const rawFingerData = {
                                x: -data.x * fingerConfig.x,
                                y: -data.z * fingerConfig.y,
                                z: data.y * fingerConfig.z,
                            };
                            rotateBone(bone, rawFingerData, boneLerpFactor * settings.fingerSpeed);
                        }
                    });
                } catch (error) {
                    // console.warn('VRMAvatar: 右手处理错误', error);
                }
            }
        }

        // **最后统一更新VRM**
        vrm.update(delta);
        
        // 更新调试面板数据
        if (onRiggedPoseUpdate && riggedPose.current) {
            onRiggedPoseUpdate(riggedPose.current);
        }
        
        // 更新手部调试面板数据
        if (onRiggedHandUpdate && (riggedLeftHand.current || riggedRightHand.current)) {
            onRiggedHandUpdate(riggedLeftHand.current, riggedRightHand.current);
        }
    });

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
                        {testSettings?.showRawData && (
                            <DataDisplayPanel riggedPose={riggedPose} />
                        )}
                        {/* 手臂坐标轴可视化 */}
                        <SimpleArmAxes vrm={vrm} showDebug={showArmAxes} />
                    </>
                )}
                
                {/* 重要：确保ref指向scene对象 */}
                {useEffect(() => {
                    if (ref && scene) {
                        // 如果ref是函数，调用它
                        if (typeof ref === 'function') {
                            ref(scene);
                        } else if (ref.current !== undefined) {
                            ref.current = scene;
                        }
                    }
                }, [ref, scene])}
            </group>
        </>
    );
});

// 添加 displayName
VRMAvatar.displayName = 'VRMAvatar';