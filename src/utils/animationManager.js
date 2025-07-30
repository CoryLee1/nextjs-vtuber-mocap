import { useFBX } from '@react-three/drei';
import { useMemo, useRef, useEffect, useState } from 'react';
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
  console.log('AnimationManager: 开始重新映射动画', { 
    hasVrm: !!vrm, 
    hasFbxScene: !!fbxScene,
    fbxAnimations: fbxScene?.animations?.length,
    vrmHumanoid: !!vrm?.humanoid
  });

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
        console.log('AnimationManager: 找到动画剪辑', name);
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

  console.log('AnimationManager: 使用动画剪辑', {
    name: mixamoClip.name,
    duration: mixamoClip.duration,
    tracks: mixamoClip.tracks.length
  });

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

  console.log('AnimationManager: 动画映射参数', {
    motionHipsHeight,
    vrmHipsHeight,
    hipsPositionScale,
    clipName: clip.name
  });

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
  console.log('AnimationManager: 动画重新映射完成', {
    originalTracks: clip.tracks.length,
    remappedTracks: tracks.length,
    mappedTracks,
    duration: remappedClip.duration
  });

  return remappedClip;
}

// 改进的动画管理器
export const useAnimationManager = (vrm, animationUrl = '/models/animations/Idle.fbx') => {
    console.log('AnimationManager: 初始化', { hasVrm: !!vrm, animationUrl });

    const mixerRef = useRef();
    const currentActionRef = useRef();
    const idleActionRef = useRef();
    const isTransitioningRef = useRef(false);
    const transitionTimeRef = useRef(0);
    const hasMixerRef = useRef(false);
    const animationModeRef = useRef('idle'); // 'idle' | 'mocap'
    
    // 状态管理
    const [animationState, setAnimationState] = useState({
        isPlayingIdle: false,
        isTransitioning: false,
        hasMixer: false,
        currentMode: 'idle'
    });

    // 加载FBX动画文件
    const fbxScene = useFBX(animationUrl);
    
    // 调试FBX加载
    useEffect(() => {
        console.log('AnimationManager: FBX加载状态', {
            animationUrl,
            hasFbxScene: !!fbxScene,
            fbxAnimations: fbxScene?.animations?.length,
            fbxChildren: fbxScene?.children?.length,
            fbxAnimationNames: fbxScene?.animations?.map(anim => anim.name)
        });
    }, [animationUrl, fbxScene]);

    // 创建动画剪辑
    const idleClip = useMemo(() => {
        console.log('AnimationManager: 创建idle剪辑', { 
            hasVrm: !!vrm, 
            hasFbxScene: !!fbxScene,
            fbxAnimations: fbxScene?.animations?.length,
            animationUrl
        });
        
        if (!vrm || !fbxScene) {
            console.warn('AnimationManager: 缺少必要参数');
            return null;
        }
        
        try {
            const remappedClip = remapMixamoAnimationToVrm(vrm, fbxScene);
            
            if (remappedClip) {
                console.log('AnimationManager: 重新映射的idle剪辑创建成功', { 
                    clipName: remappedClip.name,
                    duration: remappedClip.duration,
                    tracksCount: remappedClip.tracks.length
                });
                return remappedClip;
            }
        } catch (error) {
            console.warn('AnimationManager: 重新映射失败', error);
        }
        
        // 备用方案：使用原始动画
        if (fbxScene.animations && fbxScene.animations.length > 0) {
            const clip = fbxScene.animations[0].clone();
            clip.name = 'Idle';
            console.log('AnimationManager: 使用原始idle剪辑', { 
                clipName: clip.name,
                duration: clip.duration,
                tracksCount: clip.tracks.length
            });
            return clip;
        }
        
        console.warn('AnimationManager: 无法创建idle剪辑');
        return null;
    }, [vrm, fbxScene, animationUrl]);

    // 初始化动画混合器
    useEffect(() => {
        console.log('AnimationManager: 初始化动画混合器', { 
            hasVrm: !!vrm, 
            hasIdleClip: !!idleClip,
            vrmScene: !!vrm?.scene,
            vrmHumanoid: !!vrm?.humanoid
        });
        
        if (!vrm || !idleClip) {
            // 清理之前的混合器
            if (mixerRef.current) {
                console.log('AnimationManager: 清理之前的混合器');
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
                hasMixerRef.current = false;
            }
            
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false
            }));
            return;
        }

        // 确保VRM完全加载
        if (!vrm.scene || !vrm.humanoid) {
            console.log('AnimationManager: VRM未完全加载，等待...');
            return;
        }

        try {
            // 创建动画混合器
            const mixer = new AnimationMixer(vrm.scene);
            mixerRef.current = mixer;
            hasMixerRef.current = true;
            
            console.log('AnimationManager: 创建动画混合器成功');

            // 创建idle动作
            const idleAction = mixer.clipAction(idleClip);
            idleActionRef.current = idleAction;
            currentActionRef.current = idleAction;

            // 设置动画参数
            idleAction.setEffectiveWeight(1.0);
            idleAction.timeScale = 1.0;
            idleAction.setLoop(LoopRepeat);
            idleAction.clampWhenFinished = false;
            idleAction.enabled = true;

            // 开始播放idle动画
            idleAction.reset();
            idleAction.play();
            
            animationModeRef.current = 'idle';
            
            setAnimationState({
                isPlayingIdle: true,
                isTransitioning: false,
                hasMixer: true,
                currentMode: 'idle'
            });
            
            console.log('AnimationManager: 开始播放idle动画', {
                actionName: idleAction.getClip().name,
                duration: idleAction.getClip().duration,
                isRunning: idleAction.isRunning(),
                timeScale: idleAction.timeScale,
                weight: idleAction.weight,
                enabled: idleAction.enabled
            });

        } catch (error) {
            console.error('AnimationManager: 初始化动画混合器失败', error);
            setAnimationState(prev => ({
                ...prev,
                hasMixer: false,
                isPlayingIdle: false
            }));
        }

        return () => {
            if (mixerRef.current) {
                console.log('AnimationManager: 清理动画混合器');
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
                hasMixerRef.current = false;
            }
        }
    }, [vrm, idleClip]);

    // 切换到动捕模式
    const switchToMocapMode = () => {
        if (!mixerRef.current || !idleActionRef.current) return;
        
        if (animationModeRef.current === 'mocap') return;
        
        console.log('AnimationManager: 切换到动捕模式');
        
        // 开始淡出idle动画
        isTransitioningRef.current = true;
        transitionTimeRef.current = 0;
        animationModeRef.current = 'mocap';
        
        setAnimationState(prev => ({
            ...prev,
            isTransitioning: true,
            currentMode: 'mocap'
        }));
    };

    // 切换到idle模式
    const switchToIdleMode = () => {
        if (!mixerRef.current || !idleActionRef.current) return;
        
        if (animationModeRef.current === 'idle') return;
        
        console.log('AnimationManager: 切换到idle模式');
        
        // 重新启动idle动画
        idleActionRef.current.reset();
        idleActionRef.current.setEffectiveWeight(0);
        idleActionRef.current.play();
        
        // 开始淡入idle动画
        isTransitioningRef.current = true;
        transitionTimeRef.current = 0;
        animationModeRef.current = 'idle';
        
        setAnimationState(prev => ({
            ...prev,
            isTransitioning: true,
            currentMode: 'idle'
        }));
    };

    // 更新动画混合器
    const updateAnimation = (delta) => {
        if (!mixerRef.current) {
            return;
        }

        // 处理过渡逻辑
        if (isTransitioningRef.current) {
            transitionTimeRef.current += delta;
            const transitionDuration = 0.5; // 0.5秒过渡时间
            const progress = Math.min(transitionTimeRef.current / transitionDuration, 1);
            
            if (animationModeRef.current === 'idle') {
                // 淡入idle动画
                idleActionRef.current.setEffectiveWeight(progress);
            } else if (animationModeRef.current === 'mocap') {
                // 淡出idle动画
                idleActionRef.current.setEffectiveWeight(1 - progress);
            }
            
            if (progress >= 1) {
                isTransitioningRef.current = false;
                transitionTimeRef.current = 0;
                
                if (animationModeRef.current === 'mocap') {
                    // 完全停止idle动画
                    idleActionRef.current.setEffectiveWeight(0);
                    idleActionRef.current.enabled = false;
                } else {
                    // 确保idle动画完全启用
                    idleActionRef.current.setEffectiveWeight(1);
                    idleActionRef.current.enabled = true;
                }
                
                setAnimationState(prev => ({
                    ...prev,
                    isTransitioning: false,
                    isPlayingIdle: animationModeRef.current === 'idle'
                }));
                
                console.log('AnimationManager: 过渡完成', {
                    mode: animationModeRef.current,
                    idleWeight: idleActionRef.current.weight,
                    idleEnabled: idleActionRef.current.enabled
                });
            }
        }

        // 更新混合器
        mixerRef.current.update(delta);

        // 检查idle动画状态
        if (animationModeRef.current === 'idle' && !isTransitioningRef.current) {
            if (idleActionRef.current && !idleActionRef.current.isRunning()) {
                console.log('AnimationManager: 重启idle动画');
                idleActionRef.current.reset();
                idleActionRef.current.play();
            }
        }
    };

    // 检查是否应该播放idle动画
    const shouldPlayIdle = (hasHandDetection) => {
        return !hasHandDetection;
    };

    // 处理模式切换
    const handleModeSwitch = (shouldUseMocap) => {
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