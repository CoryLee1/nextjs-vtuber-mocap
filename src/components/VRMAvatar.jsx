import { useEffect, useRef, useCallback, useState, forwardRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { Face, Hand, Pose } from 'kalidokit';
import { Euler, Object3D, Quaternion, Vector3, Mesh, CylinderGeometry, MeshBasicMaterial, Group } from 'three';
import { lerp } from 'three/src/math/MathUtils.js';
import { useVideoRecognition } from '@/hooks/useVideoRecognition';
import { useSensitivitySettings } from '@/hooks/useSensitivitySettings';
import { calculateArms, calculateHandIK, smoothArmRotation, isArmVisible, validateHumanRotation } from '@/utils/armCalculator';
import { useAnimationManager } from '@/utils/animationManager';
import { ANIMATION_CONFIG } from '@/utils/constants';
import { CoordinateAxes, ArmDirectionDebugger, DataDisplayPanel, SimpleArmAxes } from './DebugHelpers';
import { HandDebugPanel } from './HandDebugPanel';

const tmpVec3 = new Vector3();
const tmpQuat = new Quaternion();
const tmpEuler = new Euler();

// 骨骼可视化组件 - 使用圆柱体
const BoneVisualizer = ({ vrm }) => {
    const [boneMeshes, setBoneMeshes] = useState([]);

    console.log('BoneVisualizer: 组件被调用', { vrm: !!vrm, humanoid: !!vrm?.humanoid });

    useEffect(() => {
        if (!vrm?.humanoid) {
            console.log('BoneVisualizer: 缺少VRM或humanoid');
            return;
        }

        console.log('BoneVisualizer: 开始创建骨骼可视化');
        console.log('=== 可用的骨骼节点 ===');

        // 使用正确的 VRM API 访问骨骼
        const humanBones = vrm.humanoid.humanBones;
        const boneNames = Object.keys(humanBones);
        console.log('骨骼名称列表:', boneNames);

        const meshes = [];

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
                    console.log(`BoneVisualizer: 创建骨骼 ${boneName}, 长度: ${length.toFixed(3)}`);
                    console.log(`  父节点: ${parent.name || 'unnamed'}`);
                    console.log(`  子节点: ${child.name || 'unnamed'}`);
                    console.log(`  父位置: (${parentWorldPos.x.toFixed(3)}, ${parentWorldPos.y.toFixed(3)}, ${parentWorldPos.z.toFixed(3)})`);
                    console.log(`  子位置: (${childWorldPos.x.toFixed(3)}, ${childWorldPos.y.toFixed(3)}, ${childWorldPos.z.toFixed(3)})`);

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
                } else {
                    console.log(`BoneVisualizer: 跳过骨骼 ${boneName}, 长度太短: ${length.toFixed(3)}`);
                }
            } else {
                console.log(`BoneVisualizer: 跳过骨骼 ${boneName}, 缺少节点或父节点`);
            }
        });

        console.log(`BoneVisualizer: 创建了 ${meshes.length} 个骨骼可视化`);
        console.log('=== 骨骼可视化创建完成 ===');
        setBoneMeshes(meshes);
    }, [vrm]);

    // 更新骨骼位置
    useFrame(() => {
        if (!vrm?.humanoid) return;

        // 使用正确的 VRM API 访问骨骼
        const humanBones = vrm.humanoid.humanBones;
        const boneNames = Object.keys(humanBones);

        boneMeshes.forEach((mesh, index) => {
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

export const VRMAvatar = forwardRef(({
    modelUrl = '/models/avatar.vrm',
    scale = 1,
    position = [0, 0, 0],
    showBones = false, // 添加骨骼可视化控制
    showDebug = false,  // 添加这个
    testSettings = null, // 添加这个
    showArmAxes = false, // 新增手臂坐标轴控制
    axisSettings = { 
        leftArm: { x: 1, y: 1, z: -1 }, 
        rightArm: { x: -1, y: 1, z: -1 },
        leftHand: { x: 1, y: 1, z: -1 },
        rightHand: { x: -1, y: 1, z: -1 },
        neck: { x: -1, y: 1, z: -1 } // 新增脖子设置
    }, // 新增坐标轴设置
    ...props
}, ref) => {
    console.log('=== VRMAvatar 开始渲染 ===');
    console.log('VRMAvatar: 组件初始化', { modelUrl, scale, position, showBones });

    // 获取灵敏度设置
    const { settings } = useSensitivitySettings();

    // 加载 VRM 模型 - 参考提供的文件
    const { scene, userData, errors } = useGLTF(
        modelUrl,
        undefined,
        undefined,
        (loader) => {
            console.log('VRMAvatar: 注册 VRM 加载器', modelUrl);
            loader.register((parser) => {
                console.log('VRMAvatar: 创建 VRMLoaderPlugin');
                return new VRMLoaderPlugin(parser);
            });
        }
    );

    // 检查加载错误
    if (errors) {
        console.error('VRMAvatar: 模型加载错误', errors);
    }

    // 使用 userData.vrm 而不是 userData?.vrm，参考提供的文件
    const vrm = userData?.vrm; // 改回使用可选链操作符

    // 动画管理器 - 移到vrm加载之后
    const {
        updateAnimation,
        transitionToAnimation,
        shouldPlayIdle,
        getAnimationState
    } = useAnimationManager(vrm);

    // 添加VRM加载调试信息
    useEffect(() => {
        console.log('VRMAvatar: VRM加载状态', {
            modelUrl,
            userData: !!userData,
            vrm: !!vrm,
            errors: !!errors,
            scene: !!scene,
            userDataKeys: userData ? Object.keys(userData) : [],
            userDataContent: userData
        });

        if (userData && !vrm) {
            console.warn('VRMAvatar: userData存在但vrm为null', userData);
            console.warn('VRMAvatar: 检查userData内容', JSON.stringify(userData, null, 2));
        }

        if (errors) {
            console.error('VRMAvatar: 加载错误详情', errors);
        }
    }, [modelUrl, userData, vrm, errors, scene]);

    const { setResultsCallback } = useVideoRecognition();
    const videoElement = useVideoRecognition((state) => state.videoElement);
    const isCameraActive = useVideoRecognition((state) => state.isCameraActive);
    const setHandDebugInfo = useVideoRecognition((state) => state.setHandDebugInfo);

    // 添加调试信息
    useEffect(() => {
        console.log('VRMAvatar: 状态更新', {
            videoElement: !!videoElement,
            isCameraActive,
            vrm: !!vrm,
            modelUrl,
            hasErrors: !!errors,
            userData: !!userData,
            scene: !!scene,
            userDataKeys: userData ? Object.keys(userData) : []
        });
    }, [videoElement, isCameraActive, vrm, modelUrl, errors, userData, scene]);

    // 监听模型URL变化，强制重新加载
    useEffect(() => {
        console.log('VRMAvatar: 模型URL变化', modelUrl);
        // 清除之前的VRM实例
        if (vrm) {
            console.log('VRMAvatar: 清除之前的VRM实例');
        }
    }, [modelUrl]);

    // 动捕数据引用
    const riggedFace = useRef();
    const riggedPose = useRef();
    const riggedLeftHand = useRef();
    const riggedRightHand = useRef();
    const blinkData = useRef({ leftEye: 1, rightEye: 1 }); // 添加眨眼数据引用

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

        console.log('VRM 模型加载完成:', vrm);

        // 打印骨骼列表
        if (vrm.humanoid) {
            console.log('=== VRM 骨骼列表 ===');
            console.log('VRM humanoid:', vrm.humanoid);
            console.log('humanBones 类型:', typeof vrm.humanoid.humanBones);
            console.log('humanBones:', vrm.humanoid.humanBones);

            // 使用正确的 VRM API 访问骨骼
            const humanBones = vrm.humanoid.humanBones;
            const boneNames = Object.keys(humanBones);
            console.log('总骨骼数量:', boneNames.length);
            console.log('骨骼名称列表:', boneNames);

            // 检查根骨骼
            const rootBones = ['hips', 'spine', 'chest'];
            console.log('=== 根骨骼检查 ===');
            rootBones.forEach(boneName => {
                const bone = humanBones[boneName];
                if (bone) {
                    console.log(`${boneName}:`, {
                        存在: !!bone.node,
                        父节点: bone.node?.parent?.name || '无',
                        层级: bone.node?.parent?.parent?.name || '顶级'
                    });
                }
            });

            boneNames.forEach((boneName, index) => {
                const bone = humanBones[boneName];
                console.log(`${index + 1}. ${boneName} - 节点: ${bone.node ? '存在' : '不存在'}`);
                if (bone.node) {
                    const worldPos = bone.node.getWorldPosition(new Vector3());
                    console.log(`   位置: (${worldPos.x.toFixed(3)}, ${worldPos.y.toFixed(3)}, ${worldPos.z.toFixed(3)})`);
                }
            });
            console.log('=== 骨骼列表结束 ===');
        }

        // VRM 优化
        VRMUtils.removeUnnecessaryVertices(scene);
        VRMUtils.combineSkeletons(scene);
        VRMUtils.combineMorphs(vrm);

        // 禁用视锥剔除以提高性能
        vrm.scene.traverse((obj) => {
            obj.frustumCulled = false;
        });

        // 设置视线追踪目标
        lookAtTarget.current = new Object3D();
        camera.add(lookAtTarget.current);

        return () => {
            if (lookAtTarget.current) {
                camera.remove(lookAtTarget.current);
            }
        };
    }, [vrm, scene, camera]);

    // MediaPipe 结果处理回调
    const resultsCallback = useCallback((results) => {
        if (!videoElement || !vrm) {
            console.log('VRMAvatar: 缺少必要组件', { videoElement: !!videoElement, vrm: !!vrm });
            return;
        }

        // 调试信息
        console.log('VRMAvatar: 收到 MediaPipe 结果', {
            hasFaceLandmarks: !!results.faceLandmarks,
            hasPoseLandmarks: !!results.poseLandmarks,
            hasLeftHand: !!results.leftHandLandmarks,
            hasRightHand: !!results.rightHandLandmarks,
            hasPose3D: !!results.pose3d,
            poseLandmarksLength: results.poseLandmarks?.length,
            leftHandLength: results.leftHandLandmarks?.length,
            rightHandLength: results.rightHandLandmarks?.length,
            // 检查手部数据的具体内容
            leftHandSample: results.leftHandLandmarks ? results.leftHandLandmarks.slice(0, 2) : null,
            rightHandSample: results.rightHandLandmarks ? results.rightHandLandmarks.slice(0, 2) : null,
            // 检查其他可能的字段
            hasEa: !!results.ea,
            hasZa: !!results.za,
            eaLength: results.ea?.length,
            zaLength: results.za?.length,
        });

        // 处理面部关键点
        if (results.faceLandmarks) {
            try {
            riggedFace.current = Face.solve(results.faceLandmarks, {
                runtime: 'mediapipe',
                video: videoElement,
                imageSize: { width: 640, height: 480 },
                smoothBlink: false,
                blinkSettings: [0.25, 0.75],
            });
            } catch (error) {
                console.warn('VRMAvatar: Face.solve 错误', error);
            }
        }

        // 处理姿态关键点 - 使用正确的 Kalidokit 格式
        if (results.poseLandmarks && results.poseLandmarks.length > 0) {
            try {
                // 根据参考项目，使用 za 字段作为 3D 数据
                if (results.za && results.poseLandmarks) {
            riggedPose.current = Pose.solve(results.za, results.poseLandmarks, {
                runtime: 'mediapipe',
                video: videoElement,
                    });
                    console.log('VRMAvatar: Pose.solve 成功 (使用 za)', riggedPose.current);
                } else {
                    // 备用方案：如果没有 za，尝试使用 pose3d
                    const pose3d = results.pose3d || results.poseLandmarks;
                    const pose2d = results.poseLandmarks;

                    riggedPose.current = Pose.solve(pose3d, pose2d, {
                        runtime: 'mediapipe',
                        video: videoElement,
                    });
                    console.log('VRMAvatar: Pose.solve 成功 (使用 pose3d)', riggedPose.current);
                }
            } catch (error) {
                console.warn('VRMAvatar: Pose.solve 错误', error);
                console.log('VRMAvatar: poseLandmarks 数据', results.poseLandmarks);
                // 尝试备用调用方式
                try {
                    console.log('VRMAvatar: 尝试备用调用方式');
                    riggedPose.current = Pose.solve(results.poseLandmarks, {
                        runtime: 'mediapipe',
                        video: videoElement,
                    });
                    console.log('VRMAvatar: 备用调用成功', riggedPose.current);
                } catch (error2) {
                    console.warn('VRMAvatar: 备用调用也失败', error2);
                }
            }
        } else {
            console.log('VRMAvatar: 缺少姿态数据', {
                hasPoseLandmarks: !!results.poseLandmarks,
                poseLandmarksLength: results.poseLandmarks?.length,
                hasZa: !!results.za,
                zaLength: results.za?.length
            });
        }

        // 处理手部关键点（镜像效果）
        if (results.leftHandLandmarks && results.leftHandLandmarks.length > 0) {
            try {
                // 镜像映射：左手数据控制右手
            riggedRightHand.current = Hand.solve(results.leftHandLandmarks, 'Right');
                handDetectionState.current.hasRightHand = true;
                console.log('VRMAvatar: 左手检测成功（镜像映射到右手）', riggedRightHand.current);
            } catch (error) {
                console.warn('VRMAvatar: Hand.solve (left->right) 错误', error);
                handDetectionState.current.hasRightHand = false;
            }
        } else {
            handDetectionState.current.hasRightHand = false;
            console.log('VRMAvatar: 未检测到左手（镜像映射到右手）');
        }
        if (results.rightHandLandmarks && results.rightHandLandmarks.length > 0) {
            try {
                // 镜像映射：右手数据控制左手
            riggedLeftHand.current = Hand.solve(results.rightHandLandmarks, 'Left');
                handDetectionState.current.hasLeftHand = true;
                console.log('VRMAvatar: 右手检测成功（镜像映射到左手）', riggedLeftHand.current);
            } catch (error) {
                console.warn('VRMAvatar: Hand.solve (right->left) 错误', error);
                handDetectionState.current.hasLeftHand = false;
            }
        } else {
            handDetectionState.current.hasLeftHand = false;
            console.log('VRMAvatar: 未检测到右手（镜像映射到左手）');
        }

        // 更新手部检测状态
        handDetectionState.current.hasHandDetection =
            handDetectionState.current.hasLeftHand || handDetectionState.current.hasRightHand;

        // 更新眨眼数据
        if (results.blinkData) {
            blinkData.current = results.blinkData;
            console.log('VRMAvatar: 更新眨眼数据', blinkData.current);
        }

        // 更新手部调试信息
        const debugInfo = {
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
                ) : '无手部检测'
        };
        setHandDebugInfo(debugInfo);
    }, [videoElement, vrm]);

    // 注册结果回调
    useEffect(() => {
        setResultsCallback(resultsCallback);
    }, [resultsCallback, setResultsCallback]);

    // 表情插值函数
    const lerpExpression = useCallback((name, value, lerpFactor) => {
        if (!vrm?.expressionManager) return;

        const currentValue = vrm.expressionManager.getValue(name) || 0;
        const newValue = lerp(currentValue, value, lerpFactor);
        vrm.expressionManager.setValue(name, newValue);
    }, [vrm]);

    // 骨骼旋转函数
    const rotateBone = useCallback((boneName, value, slerpFactor, flip = { x: 1, y: 1, z: 1 }) => {
        if (!vrm?.humanoid || !value) {
            console.warn(`VRMAvatar: rotateBone 缺少必要参数`, {
                hasVrm: !!vrm,
                hasHumanoid: !!vrm?.humanoid,
                boneName,
                hasValue: !!value
            });
            return;
        }

        // 保护根骨骼，不允许移动
        const protectedBones = ['hips'];
        if (protectedBones.includes(boneName)) {
            console.warn(`VRMAvatar: 尝试移动受保护的根骨骼 ${boneName}，已跳过`);
            return;
        }

        const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
        if (!bone) {
            console.warn(`VRMAvatar: 骨骼 ${boneName} 未找到`);
            // 列出可用的骨骼名称
            const availableBones = Object.keys(vrm.humanoid.humanBones);
            console.log('VRMAvatar: 可用的骨骼:', availableBones);
            return;
        }

        // 应用旋转
        tmpEuler.set(value.x * flip.x, value.y * flip.y, value.z * flip.z);
        tmpQuat.setFromEuler(tmpEuler);
        bone.quaternion.slerp(tmpQuat, slerpFactor);

        console.log(`VRMAvatar: 成功应用骨骼 ${boneName}`, {
            rotation: { x: value.x * flip.x, y: value.y * flip.y, z: value.z * flip.z },
            slerpFactor
        });
    }, [vrm]);

    // 动画循环
    useFrame((_, delta) => {
        if (!vrm) return;

        // 更新动画管理器
        try {
            updateAnimation(delta);
        } catch (error) {
            console.warn('VRMAvatar: 动画更新错误', error);
        }

        const lerpFactor = delta * ANIMATION_CONFIG.LERP_FACTOR.expression;
        const boneLerpFactor = delta * ANIMATION_CONFIG.LERP_FACTOR.bone;

        // 检查手部检测状态
        const hasHandDetection = handDetectionState.current.hasHandDetection;

        // 根据手部检测状态决定是否播放idle动画
        try {
            if (shouldPlayIdle(hasHandDetection)) {
                // 没有检测到手时，平滑过渡到idle动画
                const animationState = getAnimationState();
                
                if (!animationState.isPlayingIdle && !animationState.isTransitioning && animationState.hasMixer) {
                    // 只在状态变化时记录
                    console.log('VRMAvatar: 切换到idle动画 - 未检测到手部');
                }
            } else {
                // 检测到手时，停止idle动画，使用动捕数据
                const animationState = getAnimationState();
                if (animationState.isPlayingIdle) {
                    console.log('VRMAvatar: 切换到动捕模式 - 检测到手部');
                }
            }
        } catch (error) {
            console.warn('VRMAvatar: 动画状态检查错误', error);
        }

        // 应用面部表情
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

            // 眨眼同步 - 使用FaceMesh的眨眼检测
            if (blinkData.current) {
                // 使用FaceMesh检测的眨眼数据
                lerpExpression('blinkLeft', 1 - blinkData.current.leftEye, lerpFactor);
                lerpExpression('blinkRight', 1 - blinkData.current.rightEye, lerpFactor);
                console.log('VRMAvatar: 使用FaceMesh眨眼数据', {
                    leftEye: blinkData.current.leftEye.toFixed(3),
                    rightEye: blinkData.current.rightEye.toFixed(3)
                });
            } else if (riggedFace.current) {
                // 备用：使用Kalidokit的眨眼数据
                lerpExpression('blinkLeft', 1 - (riggedFace.current.eye?.l || 1), lerpFactor);
                lerpExpression('blinkRight', 1 - (riggedFace.current.eye?.r || 1), lerpFactor);
            }

            // 头部旋转
            if (riggedFace.current.head) {
                const rawNeckData = {
                    x: riggedFace.current.head.x * axisSettings.neck.x,
                    y: riggedFace.current.head.y * axisSettings.neck.y,
                    z: riggedFace.current.head.z * axisSettings.neck.z,
                };
                
                // 直接应用，不使用平滑
                rotateBone('neck', rawNeckData, boneLerpFactor, { x: 0.7, y: 0.7, z: 0.7 });
            }

            // 视线追踪 - 暂时禁用
            /*
            if (lookAtTarget.current && riggedFace.current.pupil) {
                vrm.lookAt.target = lookAtTarget.current;
                lookAtDestination.current.set(
                    -2 * riggedFace.current.pupil.x,
                    2 * riggedFace.current.pupil.y,
                    0
                );
                lookAtTarget.current.position.lerp(lookAtDestination.current, delta * ANIMATION_CONFIG.LERP_FACTOR.eye);
            }
            */
            } catch (error) {
                console.warn('VRMAvatar: 面部表情处理错误', error);
            }
        } else if (!videoElement || !isCameraActive) {
            // 默认眨眼动画
            const time = Date.now() * 0.001;
            const blinkFrequency = Math.sin(time * 3) > 0.8 ? 1 : 0;
            lerpExpression('blinkLeft', blinkFrequency, lerpFactor);
            lerpExpression('blinkRight', blinkFrequency, lerpFactor);
        }

        // 应用身体姿态 - 只在有手部检测时应用
        if (riggedPose.current && hasHandDetection) {
            try {
                // 躯干 - 只移动 spine 和 chest，不移动 hips（根骨骼）
                if (riggedPose.current.Spine) {
            rotateBone('chest', riggedPose.current.Spine, boneLerpFactor, { x: 0.3, y: 0.3, z: 0.3 });
            rotateBone('spine', riggedPose.current.Spine, boneLerpFactor, { x: 0.3, y: 0.3, z: 0.3 });
                }

                // 使用 Kalidokit 的手臂数据 - 只应用检测到的手
                if (riggedPose.current.LeftUpperArm && handDetectionState.current.hasLeftHand) {
                    console.log('VRMAvatar: 应用左手臂数据', riggedPose.current.LeftUpperArm);
                    const rawLeftArmData = {
                        x: riggedPose.current.LeftUpperArm.x * axisSettings.leftArm.x,
                        y: riggedPose.current.LeftUpperArm.y * axisSettings.leftArm.y,
                        z: riggedPose.current.LeftUpperArm.z * axisSettings.leftArm.z,
                    };
                    rotateBone('leftUpperArm', rawLeftArmData, boneLerpFactor * settings.armSpeed);
                }
                
                if (riggedPose.current.LeftLowerArm && handDetectionState.current.hasLeftHand) {
                    const rawLeftLowerArmData = {
                        x: riggedPose.current.LeftLowerArm.x * axisSettings.leftArm.x,
                        y: riggedPose.current.LeftLowerArm.y * axisSettings.leftArm.y,
                        z: riggedPose.current.LeftLowerArm.z * axisSettings.leftArm.z,
                    };
                    rotateBone('leftLowerArm', rawLeftLowerArmData, boneLerpFactor * settings.armSpeed);
                }

                if (riggedPose.current.RightUpperArm && handDetectionState.current.hasRightHand) {
                    console.log('VRMAvatar: 应用右手臂数据', riggedPose.current.RightUpperArm);
                    const rawRightArmData = {
                        x: riggedPose.current.RightUpperArm.x * axisSettings.rightArm.x,
                        y: riggedPose.current.RightUpperArm.y * axisSettings.rightArm.y,
                        z: riggedPose.current.RightUpperArm.z * axisSettings.rightArm.z,
                    };
                    rotateBone('rightUpperArm', rawRightArmData, boneLerpFactor * settings.armSpeed);
                }
                
                if (riggedPose.current.RightLowerArm && handDetectionState.current.hasRightHand) {
                    const rawRightLowerArmData = {
                        x: riggedPose.current.RightLowerArm.x * axisSettings.rightArm.x,
                        y: riggedPose.current.RightLowerArm.y * axisSettings.rightArm.y,
                        z: riggedPose.current.RightLowerArm.z * axisSettings.rightArm.z,
                    };
                    rotateBone('rightLowerArm', rawRightLowerArmData, boneLerpFactor * settings.armSpeed);
                }

                // 手部控制 - 只应用检测到的手
                if (riggedPose.current.LeftHand && riggedLeftHand.current && handDetectionState.current.hasLeftHand) {
                    // 镜像映射：riggedLeftHand 包含右手数据，控制左手
                    const rawLeftHandData = {
                        x: -riggedLeftHand.current.LeftWrist.x * axisSettings.leftHand.x, // 翻转X轴（镜像效果）
                        y: riggedLeftHand.current.LeftWrist.y * axisSettings.leftHand.y, // 直接使用Y轴
                        z: riggedPose.current.LeftHand.z * axisSettings.leftHand.z, // 使用pose的Z轴
                    };
                    rotateBone('leftHand', rawLeftHandData, boneLerpFactor * settings.handSpeed);
                }

                if (riggedPose.current.RightHand && riggedRightHand.current && handDetectionState.current.hasRightHand) {
                    // 镜像映射：riggedRightHand 包含左手数据，控制右手
                    const rawRightHandData = {
                        x: -riggedRightHand.current.RightWrist.x * axisSettings.rightHand.x, // 翻转X轴（镜像效果）
                        y: riggedRightHand.current.RightWrist.y * axisSettings.rightHand.y, // 直接使用Y轴
                        z: riggedPose.current.RightHand.z * axisSettings.rightHand.z, // 使用pose的Z轴
                    };
                    rotateBone('rightHand', rawRightHandData, boneLerpFactor * settings.handSpeed);
                }

            } catch (error) {
                console.warn('VRMAvatar: 身体姿态处理错误', error);
            }
        } else {
            // 没有手部检测时，不应用动捕数据，让idle动画控制
            // console.log('VRMAvatar: 未检测到手部，使用idle动画', { hasHandDetection });
        }

        // 手部详细控制 - 只在有手部检测时应用
        if (riggedLeftHand.current && handDetectionState.current.hasLeftHand) {
            try {
                // 左手手指控制 - 镜像映射：riggedLeftHand 包含右手数据，控制左手
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
                        const rawFingerData = {
                            x: -data.x, // 翻转X轴（镜像效果），去掉amplitude
                            y: -data.z, // 翻转Z轴（向前变向前），去掉amplitude
                            z: data.y, // 交换Y和Z轴，去掉amplitude
                        };
                        
                        // 应用平滑效果 - 使用较小的阻尼值让手指更敏感
                        rotateBone(bone, rawFingerData, boneLerpFactor * settings.fingerSpeed);
                    }
                });
            } catch (error) {
                console.warn('VRMAvatar: 左手处理错误', error);
            }
        }

        if (riggedRightHand.current && handDetectionState.current.hasRightHand) {
            try {
                // 右手手指控制 - 镜像映射：riggedRightHand 包含左手数据，控制右手
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
                        const rawFingerData = {
                            x: -data.x, // 翻转X轴（镜像效果），去掉amplitude
                            y: -data.z, // 翻转Z轴（向前变向前），去掉amplitude
                            z: data.y, // 交换Y和Z轴，去掉amplitude
                        };
                        
                        // 应用平滑效果 - 使用较小的阻尼值让手指更敏感
                        rotateBone(bone, rawFingerData, boneLerpFactor * settings.fingerSpeed);
                    }
                });
            } catch (error) {
                console.warn('VRMAvatar: 右手处理错误', error);
            }
        }

        // 更新 VRM
        vrm.update(delta);
    });

    return (
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
                        {/* 添加一个测试立方体来确认组件被渲染 */}
                        <mesh position={[0, 2, 0]}>
                            <boxGeometry args={[0.2, 0.2, 0.2]} />
                            <meshBasicMaterial color="red" />
                        </mesh>
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
                    console.log('VRMAvatar: 设置ref到scene对象', { ref: !!ref, scene: !!scene });
                    // 如果ref是函数，调用它
                    if (typeof ref === 'function') {
                        ref(scene);
                    } else if (ref.current !== undefined) {
                        ref.current = scene;
                    }
                }
            }, [ref, scene])}
        </group>
    );
});