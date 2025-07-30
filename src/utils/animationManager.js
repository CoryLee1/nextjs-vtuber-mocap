import { useFBX } from '@react-three/drei';
import { useMemo, useRef, useEffect } from 'react';
import { AnimationMixer } from 'three';
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

// 重新映射Mixamo动画到VRM
function remapMixamoAnimationToVrm(vrm, asset) {
  console.log('AnimationManager: 开始重新映射动画', { 
    hasVrm: !!vrm, 
    hasAsset: !!asset,
    animationsCount: asset?.animations?.length 
  });

  if (!vrm || !asset || !asset.animations || asset.animations.length === 0) {
    console.warn('AnimationManager: 无法重新映射动画 - 缺少必要数据');
    return null;
  }

  // 查找mixamo动画剪辑 - 尝试多个可能的名称
  let mixamoClip = THREE.AnimationClip.findByName(asset.animations, "mixamo.com");
  if (!mixamoClip) {
    // 尝试其他可能的名称
    const possibleNames = ["mixamo.com", "Idle", "idle", "Animation"];
    for (const name of possibleNames) {
      mixamoClip = THREE.AnimationClip.findByName(asset.animations, name);
      if (mixamoClip) {
        console.log('AnimationManager: 找到动画剪辑', name);
        break;
      }
    }
  }
  
  if (!mixamoClip) {
    // 如果还是找不到，使用第一个动画
    console.warn('AnimationManager: 未找到标准名称的动画剪辑，使用第一个动画');
    mixamoClip = asset.animations[0];
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
  const motionHipsHeight = asset.getObjectByName("mixamorigHips")?.position?.y || 0;
  const vrmHipsY = vrm.humanoid?.getNormalizedBoneNode("hips")?.getWorldPosition(_vec3)?.y || 0;
  const vrmRootY = vrm.scene.getWorldPosition(_vec3)?.y || 0;
  const vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY);
  const hipsPositionScale = vrmHipsHeight / motionHipsHeight || 1;

  console.log('AnimationManager: 动画映射参数', {
    motionHipsHeight,
    vrmHipsY,
    vrmRootY,
    vrmHipsHeight,
    hipsPositionScale,
    clipName: clip.name
  });

  clip.tracks.forEach((track) => {
    const trackSplitted = track.name.split(".");
    const mixamoRigName = trackSplitted[0];
    const vrmBoneName = mixamoVRMRigMap[mixamoRigName];
    
    if (!vrmBoneName) {
      console.log('AnimationManager: 跳过未映射的骨骼', mixamoRigName);
      return;
    }

    const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
    const mixamoRigNode = asset.getObjectByName(mixamoRigName);

    if (vrmNodeName && mixamoRigNode) {
      const propertyName = trackSplitted[1];

      // 存储rest-pose的旋转
      mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
      if (mixamoRigNode.parent) {
        mixamoRigNode.parent.getWorldQuaternion(parentRestWorldRotation);
      }

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        // 重新映射mixamoRig到NormalizedBone的旋转
        for (let i = 0; i < track.values.length; i += 4) {
          const flatQuaternion = track.values.slice(i, i + 4);
          _quatA.fromArray(flatQuaternion);

          // 父级rest世界旋转 * 轨道旋转 * rest世界旋转的逆
          _quatA.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
          _quatA.toArray(flatQuaternion);

          flatQuaternion.forEach((v, index) => {
            track.values[index + i] = v;
          });
        }

        tracks.push(
          new THREE.QuaternionKeyframeTrack(
            `${vrmNodeName}.${propertyName}`,
            track.times,
            track.values.map((v, i) =>
              vrm.meta?.metaVersion === "0" && i % 2 === 0 ? -v : v
            )
          )
        );
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
      }
    }
  });

  const remappedClip = new THREE.AnimationClip("vrmAnimation", clip.duration, tracks);
  console.log('AnimationManager: 动画重新映射完成', {
    originalTracks: clip.tracks.length,
    remappedTracks: tracks.length,
    duration: remappedClip.duration
  });

  return remappedClip;
}

// 动画混合器
export const useAnimationManager = (vrm, animationUrl = '/models/animations/Idle.fbx') => {
    console.log('AnimationManager: 初始化', { hasVrm: !!vrm, animationUrl });

    const mixerRef = useRef();
    const currentActionRef = useRef();
    const idleActionRef = useRef();
    const transitionRef = useRef();
    const isTransitioningRef = useRef(false);
    const hasMixerRef = useRef(false);

    // 加载动画文件
    const { animations: idleAnimations } = useFBX(animationUrl);
    
    // 添加调试信息
    useEffect(() => {
        console.log('AnimationManager: 动画文件加载状态', {
            animationUrl,
            hasAnimations: !!idleAnimations,
            animationsCount: idleAnimations?.length,
            animations: idleAnimations?.map(anim => ({
                name: anim.name,
                duration: anim.duration,
                tracksCount: anim.tracks.length,
                tracks: anim.tracks.map(track => ({
                    name: track.name,
                    type: track.constructor.name,
                    times: track.times.length
                }))
            }))
        });

        // 检查是否有名为"mixamo.com"的动画
        if (idleAnimations && idleAnimations.length > 0) {
            const mixamoClip = THREE.AnimationClip.findByName(idleAnimations, "mixamo.com");
            console.log('AnimationManager: 查找mixamo.com动画', {
                found: !!mixamoClip,
                availableNames: idleAnimations.map(anim => anim.name),
                firstAnimationName: idleAnimations[0]?.name
            });
            
            // 检查第一个动画的详细信息
            if (idleAnimations[0]) {
                const firstAnim = idleAnimations[0];
                console.log('AnimationManager: 第一个动画详情', {
                    name: firstAnim.name,
                    duration: firstAnim.duration,
                    tracksCount: firstAnim.tracks.length,
                    trackNames: firstAnim.tracks.map(track => track.name).slice(0, 5) // 只显示前5个
                });
            }
        }
    }, [animationUrl, idleAnimations]);

    // 创建动画剪辑
    const idleClip = useMemo(() => {
        console.log('AnimationManager: 创建idle剪辑', { 
            hasVrm: !!vrm, 
            hasIdleAnimation: !!idleAnimations,
            idleAnimationAnimations: idleAnimations?.length,
            animationUrl // 添加URL信息
        });
        
        if (!vrm || !idleAnimations) {
            console.warn('AnimationManager: 缺少必要参数', { hasVrm: !!vrm, hasIdleAnimations: !!idleAnimations });
            return null;
        }
        
        // 首先尝试使用重新映射功能处理Mixamo动画
        try {
            const remappedClip = remapMixamoAnimationToVrm(vrm, idleAnimations);
            
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
        
        // 如果重新映射失败，尝试使用原始动画
        console.warn('AnimationManager: 重新映射失败，尝试使用原始动画');
        const clip = idleAnimations[0];
        if (clip) {
            clip.name = 'Idle';
            console.log('AnimationManager: 使用原始idle剪辑', { 
                clipName: clip.name,
                duration: clip.duration,
                tracksCount: clip.tracks.length
            });
            return clip;
        }
        
        console.warn('AnimationManager: 无法创建idle剪辑', { 
            animationsCount: idleAnimations?.length 
        });
        return null;
    }, [vrm, idleAnimations, animationUrl]); // 添加animationUrl依赖

    // 初始化动画混合器
    useEffect(() => {
        console.log('AnimationManager: 初始化动画混合器', { 
            hasVrm: !!vrm, 
            hasIdleClip: !!idleClip,
            vrmScene: !!vrm?.scene,
            vrmHumanoid: !!vrm?.humanoid,
            idleClipName: idleClip?.name,
            idleClipDuration: idleClip?.duration,
            idleClipTracks: idleClip?.tracks?.length
        });
        
        if (!vrm || !idleClip) {
            // 清理之前的混合器
            if (mixerRef.current) {
                console.log('AnimationManager: 清理之前的混合器');
                mixerRef.current.stopAllAction();
                mixerRef.current = null;
            }
            return;
        }

        // 确保VRM完全加载
        if (!vrm.scene || !vrm.humanoid) {
            console.log('AnimationManager: VRM未完全加载，等待...');
            return;
        }

        // 验证VRM骨骼
        console.log('AnimationManager: 验证VRM骨骼', {
            sceneChildren: vrm.scene.children.length,
            humanoidBones: Object.keys(vrm.humanoid.humanBones),
            availableBones: Object.keys(vrm.humanoid.humanBones).filter(name => 
                vrm.humanoid.getNormalizedBoneNode(name)
            )
        });

        // 创建动画混合器
        const mixer = new AnimationMixer(vrm.scene);
        mixerRef.current = mixer;
        console.log('AnimationManager: 创建动画混合器成功');

        // 创建idle动作
        const idleAction = mixer.clipAction(idleClip);
        currentActionRef.current = idleAction;
        idleActionRef.current = idleAction; // 初始化idleActionRef

        // 设置动画参数
        idleAction.setEffectiveWeight(1.0);
        idleAction.timeScale = 1.0;
        idleAction.setLoop(THREE.LoopRepeat);

        // 开始播放idle动画
        idleAction.play();
        hasMixerRef.current = true;
        console.log('AnimationManager: 开始播放idle动画', {
            actionName: idleAction.getClip().name,
            duration: idleAction.getClip().duration,
            isRunning: idleAction.isRunning(),
            timeScale: idleAction.timeScale,
            weight: idleAction.weight,
            loop: idleAction.loop
        });

        // 添加一个简单的测试：5秒后检查动画状态
        setTimeout(() => {
            console.log('AnimationManager: 5秒后动画状态检查', {
                hasMixer: !!mixerRef.current,
                hasIdleAction: !!idleActionRef.current,
                idleActionRunning: idleActionRef.current?.isRunning(),
                idleActionTime: idleActionRef.current?.time,
                idleActionWeight: idleActionRef.current?.weight
            });
        }, 5000);

        return () => {
            if (mixer) {
                console.log('AnimationManager: 清理动画混合器');
                mixer.stopAllAction();
            }
        }
    }, [vrm, idleClip]);

    // 平滑过渡到目标动画
    const transitionToAnimation = (targetAnim, duration = 0.5) => {
        if (!mixerRef.current || !targetAnim) return;

        if (currentActionRef.current === targetAnim) return;

        // 开始过渡
        isTransitioningRef.current = true;
        transitionRef.current = 0;
        currentActionRef.current = targetAnim;

        // 设置动画权重
        if (currentActionRef.current) {
            currentActionRef.current.setEffectiveWeight(1);
        }
        targetAnim.setEffectiveWeight(0);

        // 播放目标动画
        targetAnim.play();
    }

    // 更新动画混合器
    const updateAnimation = (delta) => {
        if (!mixerRef.current) {
            console.log('AnimationManager: 没有动画混合器，跳过更新');
            return;
        }

        // 更新混合器
        mixerRef.current.update(delta);

        // 强制更新idle动画
        if (idleActionRef.current && !idleActionRef.current.isRunning()) {
            console.log('AnimationManager: 强制重启idle动画');
            idleActionRef.current.reset();
            idleActionRef.current.play();
        }

        // 处理过渡
        if (isTransitioningRef.current && currentActionRef.current) {
            transitionRef.current = Math.min(transitionRef.current + delta / 0.5, 1); // 0.5秒过渡

            if (currentActionRef.current) {
                currentActionRef.current.setEffectiveWeight(1 - transitionRef.current);
            }
            currentActionRef.current.setEffectiveWeight(transitionRef.current);

            if (transitionRef.current >= 1) {
                // 过渡完成
                if (currentActionRef.current) {
                    currentActionRef.current.stop();
                }
                currentActionRef.current = idleActionRef.current; // 恢复到idle动作
                isTransitioningRef.current = false;
            }
        }

        // 确保idle动画始终在播放（如果没有其他动画在播放）
        if (!isTransitioningRef.current && idleActionRef.current && !idleActionRef.current.isRunning()) {
            console.log('AnimationManager: 重新启动idle动画');
            idleActionRef.current.play();
        }

        // 调试信息：每60帧输出一次状态
        if (Math.floor(Date.now() / 1000) % 5 === 0) {
            console.log('AnimationManager: 动画状态', {
                hasMixer: !!mixerRef.current,
                hasIdleAction: !!idleActionRef.current,
                idleActionRunning: idleActionRef.current?.isRunning(),
                idleActionTime: idleActionRef.current?.time,
                idleActionWeight: idleActionRef.current?.weight,
                isTransitioning: isTransitioningRef.current
            });
        }
    }

    // 检查是否应该播放idle动画
    const shouldPlayIdle = (hasHandDetection) => {
        return !hasHandDetection;
    }

    // 获取当前动画状态
    const getAnimationState = () => {
        const isPlayingIdle = idleActionRef.current?.isRunning() || 
                             (currentActionRef.current === idleActionRef.current && currentActionRef.current?.isRunning());
        
        return {
            isPlayingIdle,
            isTransitioning: isTransitioningRef.current,
            blendFactor: transitionRef.current || 0, // 使用transitionRef作为blendFactor
            hasMixer: !!mixerRef.current
        }
    }

    return {
        updateAnimation,
        transitionToAnimation,
        shouldPlayIdle,
        getAnimationState,
        idleClip
    }
}; 
