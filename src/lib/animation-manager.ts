import { useFBX } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { AnimationMixer, LoopRepeat } from 'three';
import * as THREE from 'three';

// Mixamo到VRM的骨骼映射
const mixamoVRMRigMap = {
  mixamorigHips: "hips",
  mixamorigSpine: "spine",
  mixamorigSpine1: "chest",
  mixamorigSpine2: "upperChest",
  mixamorigNeck: "neck",
  mixamorigHead: "head",
  mixamorigLeftShoulder: "leftShoulder",
  mixamorigLeftArm: "leftUpperArm",
  mixamorigLeftForeArm: "leftLowerArm",
  mixamorigLeftHand: "leftHand",
  mixamorigLeftHandThumb1: "leftThumbMetacarpal",
  mixamorigLeftHandThumb2: "leftThumbProximal",
  mixamorigLeftHandThumb3: "leftThumbDistal",
  mixamorigLeftHandIndex1: "leftIndexProximal",
  mixamorigLeftHandIndex2: "leftIndexIntermediate",
  mixamorigLeftHandIndex3: "leftIndexDistal",
  mixamorigLeftHandMiddle1: "leftMiddleProximal",
  mixamorigLeftHandMiddle2: "leftMiddleIntermediate",
  mixamorigLeftHandMiddle3: "leftMiddleDistal",
  mixamorigLeftHandRing1: "leftRingProximal",
  mixamorigLeftHandRing2: "leftRingIntermediate",
  mixamorigLeftHandRing3: "leftRingDistal",
  mixamorigLeftHandPinky1: "leftLittleProximal",
  mixamorigLeftHandPinky2: "leftLittleIntermediate",
  mixamorigLeftHandPinky3: "leftLittleDistal",
  mixamorigRightShoulder: "rightShoulder",
  mixamorigRightArm: "rightUpperArm",
  mixamorigRightForeArm: "rightLowerArm",
  mixamorigRightHand: "rightHand",
  mixamorigRightHandPinky1: "rightLittleProximal",
  mixamorigRightHandPinky2: "rightLittleIntermediate",
  mixamorigRightHandPinky3: "rightLittleDistal",
  mixamorigRightHandRing1: "rightRingProximal",
  mixamorigRightHandRing2: "rightRingIntermediate",
  mixamorigRightHandRing3: "rightRingDistal",
  mixamorigRightHandMiddle1: "rightMiddleProximal",
  mixamorigRightHandMiddle2: "rightMiddleIntermediate",
  mixamorigRightHandMiddle3: "rightMiddleDistal",
  mixamorigRightHandIndex1: "rightIndexProximal",
  mixamorigRightHandIndex2: "rightIndexIntermediate",
  mixamorigRightHandIndex3: "rightIndexDistal",
  mixamorigRightHandThumb1: "rightThumbMetacarpal",
  mixamorigRightHandThumb2: "rightThumbProximal",
  mixamorigRightHandThumb3: "rightThumbDistal",
  mixamorigLeftUpLeg: "leftUpperLeg",
  mixamorigLeftLeg: "leftLowerLeg",
  mixamorigLeftFoot: "leftFoot",
  mixamorigLeftToeBase: "leftToes",
  mixamorigRightUpLeg: "rightUpperLeg",
  mixamorigRightLeg: "rightLowerLeg",
  mixamorigRightFoot: "rightFoot",
  mixamorigRightToeBase: "rightToes",
}

// 改进的重新映射函数
function remapMixamoAnimationToVrm(vrm, fbxScene) {
    if (!vrm || !fbxScene || !fbxScene.animations || fbxScene.animations.length === 0) {
        console.warn('AnimationManager: 无法重新映射动画 - 缺少必要数据');
        return null;
    }

    // 查找动画剪辑
    let mixamoClip = THREE.AnimationClip.findByName(fbxScene.animations, "mixamo.com");
    if (!mixamoClip) {
        // 尝试其他可能的名称
        const possibleNames = ["mixamo.com", "Idle", "idle", "Animation", "Take 001"];
        for (const name of possibleNames) {
            mixamoClip = THREE.AnimationClip.findByName(fbxScene.animations, name);
            if (mixamoClip) {
                break;
            }
        }
    }
    
    if (!mixamoClip) {
        // 使用第一个动画
        console.warn('AnimationManager: 未找到标准名称的动画剪辑，使用第一个动画');
        mixamoClip = fbxScene.animations[0];
    }

    if (!mixamoClip) {
        console.warn('AnimationManager: 没有可用的动画剪辑');
        return null;
    }

    const clip = mixamoClip.clone();
    const tracks = [];

    const restRotationInverse = new THREE.Quaternion();
    const parentRestWorldRotation = new THREE.Quaternion();
    const _quatA = new THREE.Quaternion();
    const _vec3 = new THREE.Vector3();

    // 调整臀部高度参考
    const mixamoHipsNode = fbxScene.getObjectByName("mixamorigHips");
    const motionHipsHeight = mixamoHipsNode?.position?.y || 0;
    
    let vrmHipsHeight = 1; // 默认值
    if (vrm.humanoid) {
        const vrmHipsNode = vrm.humanoid.getNormalizedBoneNode("hips");
        if (vrmHipsNode) {
            const vrmHipsY = vrmHipsNode.getWorldPosition(_vec3).y;
            const vrmRootY = vrm.scene.getWorldPosition(_vec3).y;
            vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY) || 1;
        }
    }
    
    const hipsPositionScale = motionHipsHeight > 0 ? vrmHipsHeight / motionHipsHeight : 1;

    let mappedTracks = 0;
    
    clip.tracks.forEach((track) => {
        const trackSplitted = track.name.split(".");
        const mixamoRigName = trackSplitted[0];
        const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
        
        if (!vrmBoneName) {
            return;
        }

        const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
        const mixamoRigNode = fbxScene.getObjectByName(mixamoRigName);

        if (vrmNodeName && mixamoRigNode) {
            const propertyName = trackSplitted[1];

            try {
                // 存储rest-pose的旋转
                mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
                if (mixamoRigNode.parent) {
                    mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);
                } else {
                    parentRestWorldRotation.identity();
                }

                if (track instanceof THREE.QuaternionKeyframeTrack) {
                    // 重新映射mixamoRig到NormalizedBone的旋转
                    const values = [...track.values];
                    for (let i = 0; i < values.length; i += 4) {
                        const flatQuaternion = values.slice(i, i + 4);
                        _quatA.fromArray(flatQuaternion);

                        // 父级rest世界旋转 * 轨道旋转 * rest世界旋转的逆
                        _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
                        _quatA.toArray(flatQuaternion);

                        flatQuaternion.forEach((v, index) => {
                            values[index + i] = v;
                        });
                    }

                    tracks.push(
                        new THREE.QuaternionKeyframeTrack(
                            `${vrmNodeName}.${propertyName}`,
                            track.times,
                            values.map((v, i) =>
                                vrm.meta?.metaVersion === "0" && i % 2 === 0 ? -v : v
                            )
                        )
                    );
                    mappedTracks++;
                } else if (track instanceof THREE.VectorKeyframeTrack) {
                    const value = track.values.map(
                        (v, i) =>
                            (vrm.meta?.metaVersion === "0" && i % 3 !== 1 ? -v : v) *
                            hipsPositionScale
                    );
                    tracks.push(
                        new THREE.VectorKeyframeTrack(
                            `${vrmNodeName}.${propertyName}`,
                            track.times,
                            value
                        )
                    );
                    mappedTracks++;
                }
            } catch (error) {
                console.warn('AnimationManager: 映射轨道时出错', mixamoRigName, error);
            }
        }
    });

    if (tracks.length === 0) {
        console.warn('AnimationManager: 没有成功映射任何轨道');
        return null;
    }

    const remappedClip = new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
    return remappedClip;
}

// ✅ 获取 VRM 的唯一标识符（更可靠的检测方式）
const getVrmId = (vrm: any): string => {
    if (!vrm) return '';
    // 优先使用 scene 的 uuid（最可靠）
    if (vrm.scene?.uuid) {
        return `vrm-${vrm.scene.uuid}`;
    }
    // 备用：使用 humanoid 的某些属性
    if (vrm.humanoid) {
        return `vrm-humanoid-${vrm.humanoid.humanBones ? 'has-bones' : 'no-bones'}`;
    }
    // 最后备用：使用对象引用（不太可靠，但在某些情况下有用）
    return `vrm-ref-${String(vrm).slice(0, 20)}`;
};

// 改进的动画管理器
export const useAnimationManager = (vrm, animationUrl = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Idle.fbx') => {
    // ✅ 确保 animationUrl 始终有效（如果是 null/undefined，使用默认值）
    const DEFAULT_ANIMATION_URL = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/Idle.fbx';
    const effectiveAnimationUrl = animationUrl || DEFAULT_ANIMATION_URL;
    
    // 修正 animationUrl 末尾多余的冒号
    const safeAnimationUrl = typeof effectiveAnimationUrl === 'string' 
        ? effectiveAnimationUrl.replace(/:$/, '').trim() 
        : DEFAULT_ANIMATION_URL;

    const mixerRef = useRef<AnimationMixer | null>(null);
    const currentActionRef = useRef<THREE.AnimationAction | null>(null);
    const idleActionRef = useRef<THREE.AnimationAction | null>(null);
    const isTransitioningRef = useRef(false);
    const transitionTimeRef = useRef(0);
    const hasMixerRef = useRef(false);
    const animationModeRef = useRef('idle'); // 'idle' | 'mocap'
    
    // ✅ 使用 VRM UUID 追踪模型变化（更可靠）
    const vrmIdRef = useRef<string>('');
    const previousAnimationUrlRef = useRef(safeAnimationUrl);
    
    // 状态管理
    const [animationState, setAnimationState] = useState({
        isPlayingIdle: false,
        isTransitioning: false,
        hasMixer: false,
        currentMode: 'idle',
        isLoading: false,
        error: null
    });

    // ✅ 重新初始化动画管理器（当VRM变化时调用）
    const reinitialize = useCallback((newVrm: any) => {
        console.log('🔄 AnimationManager: 重新初始化动画管理器', {
            oldVrmId: vrmIdRef.current,
            newVrmId: getVrmId(newVrm),
            hasOldMixer: !!mixerRef.current
        });
        
        // ✅ 完全清理旧的混合器
        if (mixerRef.current) {
            console.log('🧹 AnimationManager: 清理旧的动画混合器');
            try {
                // 停止所有动作
                mixerRef.current.stopAllAction();
                
                // 注意：AnimationMixer 没有 uncacheRoot 方法
                // 停止所有动作后，直接置null即可
            } catch (error) {
                console.warn('AnimationManager: 清理旧混合器时出错', error);
            }
            
            mixerRef.current = null;
        }
        
        // ✅ 清空所有动作引用
        idleActionRef.current = null;
        currentActionRef.current = null;
        hasMixerRef.current = false;
        
        // ✅ 为新 VRM 创建新的混合器
        if (newVrm && newVrm.scene) {
            const newMixer = new AnimationMixer(newVrm.scene);
            mixerRef.current = newMixer;
            hasMixerRef.current = true;
            
            console.log('✅ AnimationManager: 为新VRM创建新的混合器', {
                vrmId: getVrmId(newVrm),
                mixerRoot: newMixer.getRoot() === newVrm.scene
            });
        }
        
        // 重置状态
        setAnimationState(prev => ({
            ...prev,
            hasMixer: !!mixerRef.current,
            isPlayingIdle: false,
            isLoading: false
        }));
    }, []);
    
    // ✅ 检测 VRM UUID 变化（使用 UUID 比对象引用更可靠）
    useEffect(() => {
        const currentVrmId = getVrmId(vrm);
        
        if (currentVrmId && currentVrmId !== vrmIdRef.current) {
            console.log('🆕 AnimationManager: 检测到VRM变化', {
                oldVrmId: vrmIdRef.current || '(首次加载)',
                newVrmId: currentVrmId,
                hasOldVrm: !!vrmIdRef.current,
                hasNewVrm: !!vrm
            });
            
            // ✅ 如果是首次加载（没有旧模型），需要初始化混合器
            // ✅ 如果是切换模型，需要重新初始化
            if (!vrmIdRef.current) {
                // 首次加载：如果还没有混合器，会在后续的useEffect中创建
                console.log('🎯 AnimationManager: 首次加载VRM，等待混合器初始化');
            } else {
                // 切换模型：需要重新初始化
                console.log('🔄 AnimationManager: 切换模型，重新初始化动画管理器');
                reinitialize(vrm);
            }
            
            vrmIdRef.current = currentVrmId;
        } else if (!currentVrmId && vrmIdRef.current) {
            // VRM 被移除，清理
            console.log('🧹 AnimationManager: VRM已移除，清理资源');
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
            }
            idleActionRef.current = null;
            currentActionRef.current = null;
            hasMixerRef.current = false;
            vrmIdRef.current = '';
        }
    }, [vrm, reinitialize]);
    
    // ✅ 检测动画 URL 变化
    useEffect(() => {
        if (previousAnimationUrlRef.current !== safeAnimationUrl) {
            console.log('🔄 AnimationManager: 检测到动画URL变化', {
                old: previousAnimationUrlRef.current,
                new: safeAnimationUrl
            });
            
            previousAnimationUrlRef.current = safeAnimationUrl;
            
            // 如果已有混合器，清理并等待重新初始化
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                idleActionRef.current = null;
                currentActionRef.current = null;
            }
        }
    }, [safeAnimationUrl]);

    // 加载FBX动画文件
    // ✅ useFBX 会在 URL 变化时自动重新加载
    const fbxScene = useFBX(safeAnimationUrl);

    // ✅ 创建动画剪辑（当VRM、fbxScene或URL变化时重新创建）
    const idleClip = useMemo(() => {
        if (!vrm || !fbxScene) {
            console.warn('AnimationManager: 缺少必要参数，无法创建动画剪辑', {
                hasVRM: !!vrm,
                hasFbxScene: !!fbxScene,
                vrmScene: !!vrm?.scene,
                vrmHumanoid: !!vrm?.humanoid
            });
            return null;
        }
        
        // ✅ 确保 VRM 完全加载
        if (!vrm.scene || !vrm.humanoid) {
            console.warn('AnimationManager: VRM未完全加载', {
                hasScene: !!vrm.scene,
                hasHumanoid: !!vrm.humanoid
            });
            return null;
        }
        
        try {
            console.log('AnimationManager: 开始重新映射动画', {
                animationUrl: safeAnimationUrl,
                animationsCount: fbxScene.animations?.length || 0
            });
            
            const remappedClip = remapMixamoAnimationToVrm(vrm, fbxScene);
            
            if (remappedClip) {
                console.log('AnimationManager: 动画重新映射成功', {
                    clipName: remappedClip.name,
                    duration: remappedClip.duration,
                    tracksCount: remappedClip.tracks.length
                });
                return remappedClip;
            } else {
                console.warn('AnimationManager: 重新映射返回null');
            }
        } catch (error) {
            console.error('AnimationManager: 重新映射失败', error);
        }
        
        // 备用方案：使用原始动画
        if (fbxScene.animations && fbxScene.animations.length > 0) {
            const clip = fbxScene.animations[0].clone();
            clip.name = 'Idle';
            console.log('AnimationManager: 使用原始动画作为备用', {
                clipName: clip.name,
                duration: clip.duration
            });
            return clip;
        }
        
        console.warn('AnimationManager: 无法创建idle剪辑 - 没有可用的动画');
        return null;
    }, [vrm, fbxScene, safeAnimationUrl]);

    // 初始化动画混合器（当vrm、idleClip或animationUrl变化时重新初始化）
    useEffect(() => {
        if (!vrm || !idleClip) {
            // 清理之前的混合器
            if (mixerRef.current) {
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
                hasMixerRef.current = false;
            }
            
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false,
                isLoading: false,
                error: !vrm ? 'VRM模型未加载' : !idleClip ? '动画文件加载失败' : null
            }));
            return;
        }

        // 确保VRM完全加载
        if (!vrm.scene || !vrm.humanoid) {
            setAnimationState(prev => ({
                ...prev,
                isLoading: true,
                error: null
            }));
            return;
        }

        try {
            console.log('AnimationManager: 初始化/重新初始化动画混合器', {
                animationUrl: safeAnimationUrl,
                hasMixer: hasMixerRef.current,
                vrmScene: !!vrm.scene,
                vrmHumanoid: !!vrm.humanoid,
                idleClipName: idleClip?.name,
                idleClipDuration: idleClip?.duration
            });
            
            // ✅ 确保没有旧的混合器（应该已经在之前的useEffect中清理，这里做二次检查）
            if (mixerRef.current) {
                const oldRoot = mixerRef.current.getRoot();
                if (oldRoot !== vrm.scene) {
                    console.log('AnimationManager: 检测到VRM场景变化，清理旧混合器');
                    mixerRef.current.stopAllAction();
                    mixerRef.current = null;
                    hasMixerRef.current = false;
                }
            }
            
            // ✅ 创建新的混合器（如果没有或场景已变化）
            if (!mixerRef.current) {
                console.log('🎯 AnimationManager: 创建新的动画混合器', {
                    vrmId: getVrmId(vrm),
                    vrmScene: !!vrm.scene,
                    vrmHumanoid: !!vrm.humanoid
                });
                const mixer = new AnimationMixer(vrm.scene);
                mixerRef.current = mixer;
                hasMixerRef.current = true;
                console.log('✅ AnimationManager: 混合器创建成功', {
                    vrmId: getVrmId(vrm),
                    rootObject: mixer.getRoot() === vrm.scene,
                    mixerRootUuid: mixer.getRoot()?.uuid
                });
            } else {
                // ✅ 验证混合器绑定到正确的场景
                const mixerRoot = mixerRef.current.getRoot();
                if (mixerRoot !== vrm.scene) {
                    console.warn('⚠️ AnimationManager: 混合器绑定的场景不匹配，重新创建', {
                        expectedSceneUuid: vrm.scene?.uuid,
                        actualRootUuid: mixerRoot?.uuid
                    });
                    mixerRef.current.stopAllAction();
                    const mixer = new AnimationMixer(vrm.scene);
                    mixerRef.current = mixer;
                    hasMixerRef.current = true;
                }
            }

            // ✅ 创建idle动作（必须使用新的clip，因为VRM可能已经变化）
            const idleAction = mixerRef.current.clipAction(idleClip);
            if (!idleAction) {
                throw new Error('无法创建idle动作：clipAction返回null');
            }
            
            // 停止之前的动作（如果有）
            if (idleActionRef.current && idleActionRef.current !== idleAction) {
                idleActionRef.current.stop();
            }
            
            idleActionRef.current = idleAction;
            currentActionRef.current = idleAction;

            // 设置动画参数
            idleAction.setEffectiveWeight(1.0);
            idleAction.timeScale = 1.0;
            idleAction.setLoop(THREE.LoopRepeat, Infinity);
            idleAction.clampWhenFinished = false;
            idleAction.enabled = true;

            // ✅ 重置并播放动画
            idleAction.reset();
            idleAction.play();
            
            animationModeRef.current = 'idle';
            
            setAnimationState({
                isPlayingIdle: true,
                isTransitioning: false,
                hasMixer: true,
                currentMode: 'idle',
                isLoading: false,
                error: null
            });
            
            console.log('✅ AnimationManager: 动画混合器初始化完成，开始播放动画', {
                vrmId: getVrmId(vrm),
                actionName: idleAction.getClip().name,
                isRunning: idleAction.isRunning(),
                weight: idleAction.getEffectiveWeight(),
                duration: idleAction.getClip().duration
            });

        } catch (error) {
            console.error('AnimationManager: 初始化失败', error);
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false,
                isLoading: false,
                error: error instanceof Error ? error.message : String(error)
            }));
        }
    }, [vrm, idleClip, safeAnimationUrl]); // ✅ 添加safeAnimationUrl到依赖，确保URL变化时重新初始化

    // 切换到动捕模式
    const switchToMocapMode = () => {
        // 防止重复切换
        if (animationModeRef.current === 'mocap') {
            return;
        }
        
        animationModeRef.current = 'mocap';
        isTransitioningRef.current = true;
        
        try {
            // **完全停止动画**
            if (idleActionRef.current) {
                idleActionRef.current.stop();
                idleActionRef.current.reset();
            }
            
            // **重置动画混合器时间**
            if (mixerRef.current) {
                mixerRef.current.setTime(0);
            }
            
            // **更新React状态**
            setAnimationState(prev => ({
                ...prev,
                currentMode: 'mocap',
                isPlayingIdle: false,
                isTransitioning: false
            }));
            
            isTransitioningRef.current = false;
            
        } catch (error) {
            console.error('AnimationManager: 切换到动捕模式失败', error);
            isTransitioningRef.current = false;
        }
    };

    // 切换到idle模式
    const switchToIdleMode = () => {
        // 防止重复切换
        if (animationModeRef.current === 'idle') {
            return;
        }
        
        animationModeRef.current = 'idle';
        isTransitioningRef.current = true;
        
        try {
            // **重新启动idle动画**
            if (idleActionRef.current) {
                idleActionRef.current.reset();
                idleActionRef.current.play();
            }
            
            // **更新React状态**
            setAnimationState(prev => ({
                ...prev,
                currentMode: 'idle',
                isPlayingIdle: true,
                isTransitioning: false
            }));
            
            isTransitioningRef.current = false;
            
        } catch (error) {
            console.error('AnimationManager: 切换到idle模式失败', error);
            isTransitioningRef.current = false;
        }
    };

    // 更新动画
    const updateAnimation = (delta) => {
        // **纯粹模式切换：只在idle模式下更新动画**
        if (animationModeRef.current !== 'idle') {
            return; // 动捕模式下不更新动画
        }
        
        if (!mixerRef.current) return;
        
        try {
            // 只在idle模式下更新动画混合器
            mixerRef.current.update(delta);
            
            // 更新状态
            setAnimationState(prev => ({
                ...prev,
                currentTime: mixerRef.current.time,
                isPlayingIdle: idleActionRef.current?.isRunning() || false
            }));
            
        } catch (error) {
            console.warn('AnimationManager: 动画更新错误', error);
        }
    };

    // 检查是否应该播放idle动画
    const shouldPlayIdle = (hasHandDetection) => {
        return !hasHandDetection;
    };

    // 状态缓存，避免频繁切换
    const lastModeSwitchTime = useRef(0);
    const lastShouldUseMocap = useRef(false);
    const MODE_SWITCH_DEBOUNCE = 500; // 500ms防抖时间

    // 优化的模式切换处理
    const handleModeSwitch = (shouldUseMocap) => {
        const now = Date.now();
        
        // 防抖检查：如果距离上次切换时间太短，则跳过
        if (now - lastModeSwitchTime.current < MODE_SWITCH_DEBOUNCE) {
            return;
        }
        
        // 状态检查：如果状态没有变化，则跳过
        if (shouldUseMocap === lastShouldUseMocap.current) {
            return;
        }
        
        // 记录当前状态
        lastShouldUseMocap.current = shouldUseMocap;
        lastModeSwitchTime.current = now;
        
        // 执行模式切换
        if (shouldUseMocap && animationModeRef.current === 'idle') {
            switchToMocapMode();
        } else if (!shouldUseMocap && animationModeRef.current === 'mocap') {
            switchToIdleMode();
        }
    };

    // 获取当前动画状态
    const getAnimationState = () => {
        return {
            ...animationState,
            isPlayingIdle: animationModeRef.current === 'idle' && !isTransitioningRef.current,
            isTransitioning: isTransitioningRef.current,
            blendFactor: transitionTimeRef.current,
            hasMixer: hasMixerRef.current,
            currentMode: animationModeRef.current
        };
    };

    return {
        updateAnimation,
        switchToMocapMode,
        switchToIdleMode,
        handleModeSwitch,
        shouldPlayIdle,
        getAnimationState,
        idleClip,
        
        // 调试方法
        getCurrentMode: () => animationModeRef.current,
        forceIdleRestart: () => {
            if (idleActionRef.current) {
                idleActionRef.current.reset();
                idleActionRef.current.play();
            }
        }
    };
};