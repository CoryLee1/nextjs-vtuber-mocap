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
};

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

  // 查找mixamo动画剪辑
  const mixamoClip = THREE.AnimationClip.findByName(asset.animations, "mixamo.com");
  if (!mixamoClip) {
    console.warn('AnimationManager: 未找到mixamo动画剪辑');
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
    hipsPositionScale
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

  const remappedClip = new THREE.AnimationClip("vrmIdleAnimation", clip.duration, tracks);
  console.log('AnimationManager: 动画重新映射完成', {
    originalTracks: clip.tracks.length,
    remappedTracks: tracks.length,
    duration: remappedClip.duration
  });

  return remappedClip;
}

// 动画混合器
export const useAnimationManager = (vrm, idleAnimationPath = '/models/animations/Idle.fbx') => {
    const idleAnimation = useFBX(idleAnimationPath);
    const animationMixer = useRef(null);
    const currentAction = useRef(null);
    const targetAction = useRef(null);
    const blendFactor = useRef(0);
    const isTransitioning = useRef(false);

    // 创建动画剪辑
    const idleClip = useMemo(() => {
        console.log('AnimationManager: 创建idle剪辑', { 
            hasVrm: !!vrm, 
            hasIdleAnimation: !!idleAnimation,
            idleAnimationAnimations: idleAnimation?.animations?.length
        });
        
        if (!vrm || !idleAnimation) return null;
        
        // 使用重新映射功能处理Mixamo动画
        const remappedClip = remapMixamoAnimationToVrm(vrm, idleAnimation);
        
        if (remappedClip) {
            console.log('AnimationManager: 重新映射的idle剪辑创建成功', { 
                clipName: remappedClip.name,
                duration: remappedClip.duration,
                tracksCount: remappedClip.tracks.length
            });
            return remappedClip;
        }
        
        // 如果重新映射失败，尝试使用原始动画
        console.warn('AnimationManager: 重新映射失败，尝试使用原始动画');
        const clip = idleAnimation.animations[0];
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
            animationsCount: idleAnimation.animations?.length 
        });
        return null;
    }, [vrm, idleAnimation]);

    // 初始化动画混合器
    useEffect(() => {
        console.log('AnimationManager: 初始化动画混合器', { 
            hasVrm: !!vrm, 
            hasIdleClip: !!idleClip,
            vrmScene: !!vrm?.scene
        });
        
        if (!vrm || !idleClip) {
            // 清理之前的混合器
            if (animationMixer.current) {
                console.log('AnimationManager: 清理之前的混合器');
                animationMixer.current.stopAllAction();
                animationMixer.current = null;
            }
            return;
        }

        // 创建动画混合器
        const mixer = new AnimationMixer(vrm.scene);
        animationMixer.current = mixer;
        console.log('AnimationManager: 创建动画混合器成功');

        // 创建idle动作
        const idleAction = mixer.clipAction(idleClip);
        currentAction.current = idleAction;
        targetAction.current = idleAction;

        // 开始播放idle动画
        idleAction.play();
        console.log('AnimationManager: 开始播放idle动画');

        return () => {
            if (mixer) {
                console.log('AnimationManager: 清理动画混合器');
                mixer.stopAllAction();
            }
        };
    }, [vrm, idleClip]);

    // 平滑过渡到目标动画
    const transitionToAnimation = (targetAnim, duration = 0.5) => {
        if (!animationMixer.current || !targetAnim) return;

        if (currentAction.current === targetAnim) return;

        // 开始过渡
        isTransitioning.current = true;
        blendFactor.current = 0;
        targetAction.current = targetAnim;

        // 设置动画权重
        if (currentAction.current) {
            currentAction.current.setEffectiveWeight(1);
        }
        targetAnim.setEffectiveWeight(0);

        // 播放目标动画
        targetAnim.play();
    };

    // 更新动画混合器
    const updateAnimation = (delta) => {
        if (!animationMixer.current) return;

        // 更新混合器
        animationMixer.current.update(delta);

        // 处理过渡
        if (isTransitioning.current && targetAction.current) {
            blendFactor.current = Math.min(blendFactor.current + delta / 0.5, 1); // 0.5秒过渡

            if (currentAction.current) {
                currentAction.current.setEffectiveWeight(1 - blendFactor.current);
            }
            targetAction.current.setEffectiveWeight(blendFactor.current);

            if (blendFactor.current >= 1) {
                // 过渡完成
                if (currentAction.current) {
                    currentAction.current.stop();
                }
                currentAction.current = targetAction.current;
                isTransitioning.current = false;
            }
        }
    };

    // 检查是否应该播放idle动画
    const shouldPlayIdle = (hasHandDetection) => {
        return !hasHandDetection;
    };

    // 获取当前动画状态
    const getAnimationState = () => {
        return {
            isPlayingIdle: currentAction.current?.getClip()?.name === 'Idle',
            isTransitioning: isTransitioning.current,
            blendFactor: blendFactor.current,
            hasMixer: !!animationMixer.current
        };
    };

    return {
        updateAnimation,
        transitionToAnimation,
        shouldPlayIdle,
        getAnimationState,
        idleClip
    };
}; 