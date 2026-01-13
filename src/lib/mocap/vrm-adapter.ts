/**
 * VRM 动捕数据适配器
 * 
 * 功能：
 * - 将 Kalidokit 输出映射到 VRM 骨骼
 * - 处理缺失骨骼的降级方案
 * - 将动捕表情映射到 VRM Expressions
 * - 处理 VRM 0.x 和 1.0 的差异
 * - 性能优化：缓存骨骼引用、对象池
 * 
 * @file src/lib/mocap/vrm-adapter.ts
 */

import type { VRM } from '@pixiv/three-vrm';
import { Euler, Quaternion, Object3D } from 'three';
import { detectVRMCapabilities, VRMExpressionAdapter, type VRMCapabilities } from '@/lib/vrm/capabilities';
import { VRM_BONE_NAME_MAP, mapBoneName } from '@/lib/vrm/bone-mapping';

/**
 * Kalidokit 姿势数据接口
 */
export interface KalidokitPose {
  Spine?: { x: number; y: number; z: number };
  Chest?: { x: number; y: number; z: number };
  LeftUpperArm?: { x: number; y: number; z: number };
  LeftLowerArm?: { x: number; y: number; z: number };
  LeftHand?: { x: number; y: number; z: number };
  RightUpperArm?: { x: number; y: number; z: number };
  RightLowerArm?: { x: number; y: number; z: number };
  RightHand?: { x: number; y: number; z: number };
  LeftUpperLeg?: { x: number; y: number; z: number };
  LeftLowerLeg?: { x: number; y: number; z: number };
  LeftFoot?: { x: number; y: number; z: number };
  RightUpperLeg?: { x: number; y: number; z: number };
  RightLowerLeg?: { x: number; y: number; z: number };
  RightFoot?: { x: number; y: number; z: number };
  [key: string]: any;
}

/**
 * Kalidokit 手部数据接口
 */
export interface KalidokitHand {
  LeftWrist?: { x: number; y: number; z: number };
  RightWrist?: { x: number; y: number; z: number };
  LeftThumbProximal?: { x: number; y: number; z: number };
  LeftThumbIntermediate?: { x: number; y: number; z: number };
  LeftThumbDistal?: { x: number; y: number; z: number };
  LeftIndexProximal?: { x: number; y: number; z: number };
  LeftIndexIntermediate?: { x: number; y: number; z: number };
  LeftIndexDistal?: { x: number; y: number; z: number };
  LeftMiddleProximal?: { x: number; y: number; z: number };
  LeftMiddleIntermediate?: { x: number; y: number; z: number };
  LeftMiddleDistal?: { x: number; y: number; z: number };
  LeftRingProximal?: { x: number; y: number; z: number };
  LeftRingIntermediate?: { x: number; y: number; z: number };
  LeftRingDistal?: { x: number; y: number; z: number };
  LeftLittleProximal?: { x: number; y: number; z: number };
  LeftLittleIntermediate?: { x: number; y: number; z: number };
  LeftLittleDistal?: { x: number; y: number; z: number };
  RightThumbProximal?: { x: number; y: number; z: number };
  RightThumbMetacarpal?: { x: number; y: number; z: number };
  RightThumbDistal?: { x: number; y: number; z: number };
  RightIndexProximal?: { x: number; y: number; z: number };
  RightIndexIntermediate?: { x: number; y: number; z: number };
  RightIndexDistal?: { x: number; y: number; z: number };
  RightMiddleProximal?: { x: number; y: number; z: number };
  RightMiddleIntermediate?: { x: number; y: number; z: number };
  RightMiddleDistal?: { x: number; y: number; z: number };
  RightRingProximal?: { x: number; y: number; z: number };
  RightRingIntermediate?: { x: number; y: number; z: number };
  RightRingDistal?: { x: number; y: number; z: number };
  RightLittleProximal?: { x: number; y: number; z: number };
  RightLittleIntermediate?: { x: number; y: number; z: number };
  RightLittleDistal?: { x: number; y: number; z: number };
  [key: string]: any;
}

/**
 * Kalidokit 面部数据接口
 */
export interface KalidokitFace {
  head?: { x: number; y: number; z: number };
  eye?: { l: number; r: number };
  mouth?: {
    shape?: {
      A?: number;
      I?: number;
      E?: number;
      O?: number;
      U?: number;
    };
  };
  [key: string]: any;
}

/**
 * 骨骼降级策略映射表
 * 如果主要骨骼不存在，使用降级骨骼
 */
const BONE_FALLBACK_MAP: Record<string, string[]> = {
  // 如果缺少 chest，使用 spine
  chest: ['spine'],
  // 如果缺少 upperChest，使用 chest，再降级到 spine
  upperChest: ['chest', 'spine'],
  // 如果缺少 leftShoulder，直接应用到 leftUpperArm
  leftShoulder: ['leftUpperArm'],
  rightShoulder: ['rightUpperArm'],
};

/**
 * 表情名称映射（Kalidokit → VRM）
 */
const EXPRESSION_MAPPING: Record<string, string> = {
  // 口型
  'aa': 'aa',
  'ih': 'ih',
  'ee': 'ee',
  'oh': 'oh',
  'ou': 'ou',
  
  // 眨眼
  'blinkLeft': 'blinkLeft',
  'blinkRight': 'blinkRight',
  'blink': 'blink',
  
  // 其他表情
  'happy': 'happy',
  'sad': 'sad',
  'angry': 'angry',
  'surprised': 'surprised',
  'relaxed': 'relaxed',
};

/**
 * VRM 动捕适配器
 */
export class VRMMocapAdapter {
  private vrm: VRM;
  private capabilities: VRMCapabilities;
  private expressionAdapter: VRMExpressionAdapter;
  
  // PERF: 缓存骨骼引用，避免每帧查找
  private boneCache: Map<string, Object3D | null> = new Map();
  
  // PERF: 对象池，避免每帧创建新对象
  private tmpEuler: Euler = new Euler();
  private tmpQuat: Quaternion = new Quaternion();
  
  // 可用的骨骼集合（快速查找）
  private availableBonesSet: Set<string> = new Set();
  
  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.capabilities = detectVRMCapabilities(vrm)!;
    
    if (!this.capabilities) {
      throw new Error('VRMMocapAdapter: Failed to detect VRM capabilities');
    }
    
    this.expressionAdapter = new VRMExpressionAdapter(vrm);
    this.initializeBoneCache();
  }
  
  /**
   * 初始化骨骼缓存
   */
  private initializeBoneCache(): void {
    const { humanoid } = this.vrm;
    if (!humanoid) return;
    
    // 构建可用骨骼集合
    this.capabilities.bones.available.forEach(boneName => {
      this.availableBonesSet.add(boneName);
    });
    
    // 预缓存所有可用骨骼的引用
    this.capabilities.bones.available.forEach(boneName => {
      try {
        const bone = humanoid.getNormalizedBoneNode(boneName);
        this.boneCache.set(boneName, bone || null);
      } catch (error) {
        this.boneCache.set(boneName, null);
        if (process.env.NODE_ENV === 'development') {
          console.warn(`VRMMocapAdapter: Failed to cache bone "${boneName}"`, error);
        }
      }
    });
  }
  
  /**
   * 获取骨骼节点（带缓存和降级策略）
   * 
   * @param boneName VRM 骨骼名称
   * @returns 骨骼节点，如果不存在则返回 null
   */
  private getBoneNode(boneName: string): Object3D | null {
    // 先从缓存查找
    if (this.boneCache.has(boneName)) {
      return this.boneCache.get(boneName) || null;
    }
    
    // ✅ 修复：getBoneNode() 已被弃用，优先使用 humanBones[].node，降级使用 getNormalizedBoneNode()
    // 如果缓存中没有，尝试直接获取
    try {
      let bone: Object3D | null = null;
      
      // 优先使用 humanBones[boneName].node（直接访问）
      if (this.vrm.humanoid?.humanBones?.[boneName]?.node) {
        bone = this.vrm.humanoid.humanBones[boneName].node;
      } 
      // 降级使用 getNormalizedBoneNode（如果直接访问不可用）
      else if (this.vrm.humanoid && typeof this.vrm.humanoid.getNormalizedBoneNode === 'function') {
        bone = this.vrm.humanoid.getNormalizedBoneNode(boneName);
      }
      
      this.boneCache.set(boneName, bone || null);
      return bone || null;
    } catch {
      this.boneCache.set(boneName, null);
      
      // 尝试降级策略
      const fallbacks = BONE_FALLBACK_MAP[boneName];
      if (fallbacks) {
        for (const fallbackBoneName of fallbacks) {
          if (this.availableBonesSet.has(fallbackBoneName)) {
            const fallbackBone = this.getBoneNode(fallbackBoneName);
            if (fallbackBone) {
              // 缓存降级映射
              this.boneCache.set(boneName, fallbackBone);
              return fallbackBone;
            }
          }
        }
      }
      
      return null;
    }
  }
  
  /**
   * 应用旋转到骨骼
   * 
   * @param boneName VRM 骨骼名称
   * @param rotation 旋转数据 {x, y, z}
   * @param slerpFactor 插值因子 (0-1)
   * @param flip 翻转系数 {x, y, z}，默认为 {x: 1, y: 1, z: 1}
   */
  private applyBoneRotation(
    boneName: string,
    rotation: { x: number; y: number; z: number },
    slerpFactor: number,
    flip: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 }
  ): void {
    const bone = this.getBoneNode(boneName);
    if (!bone) {
      // 静默失败，避免性能影响
      return;
    }
    
    // PERF: 使用对象池中的临时对象
    this.tmpEuler.set(
      rotation.x * flip.x,
      rotation.y * flip.y,
      rotation.z * flip.z
    );
    this.tmpQuat.setFromEuler(this.tmpEuler);
    
    // 使用 slerp 平滑插值
    bone.quaternion.slerp(this.tmpQuat, slerpFactor);
  }
  
  /**
   * 应用姿势数据到 VRM
   * 
   * @param poseData Kalidokit 姿势数据
   * @param slerpFactor 插值因子，默认 0.1
   * @param axisSettings 轴设置（可选，用于调整旋转）
   */
  applyPose(
    poseData: KalidokitPose,
    slerpFactor: number = 0.1,
    axisSettings?: Record<string, { x?: number; y?: number; z?: number }>
  ): void {
    if (!this.vrm || !poseData) return;
    
    // 躯干
    if (poseData.Spine) {
      const spineSettings = axisSettings?.spine || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('spine', {
        x: poseData.Spine.x * (spineSettings.x || 1),
        y: poseData.Spine.y * (spineSettings.y || 1),
        z: poseData.Spine.z * (spineSettings.z || 1),
      }, slerpFactor * 0.3); // 躯干旋转更保守
    }
    
    // 胸部（如果存在）
    if (poseData.Chest) {
      const chestSettings = axisSettings?.chest || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('chest', {
        x: poseData.Chest.x * (chestSettings.x || 1),
        y: poseData.Chest.y * (chestSettings.y || 1),
        z: poseData.Chest.z * (chestSettings.z || 1),
      }, slerpFactor * 0.3);
    }
    
    // 左臂
    if (poseData.LeftUpperArm) {
      const leftArmSettings = axisSettings?.leftUpperArm || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('leftUpperArm', {
        x: poseData.LeftUpperArm.x * (leftArmSettings.x || 1),
        y: poseData.LeftUpperArm.y * (leftArmSettings.y || 1),
        z: poseData.LeftUpperArm.z * (leftArmSettings.z || 1),
      }, slerpFactor);
    }
    
    if (poseData.LeftLowerArm) {
      const leftLowerArmSettings = axisSettings?.leftLowerArm || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('leftLowerArm', {
        x: poseData.LeftLowerArm.x * (leftLowerArmSettings.x || 1),
        y: poseData.LeftLowerArm.y * (leftLowerArmSettings.y || 1),
        z: poseData.LeftLowerArm.z * (leftLowerArmSettings.z || 1),
      }, slerpFactor);
    }
    
    if (poseData.LeftHand) {
      const leftHandSettings = axisSettings?.leftHand || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('leftHand', {
        x: poseData.LeftHand.x * (leftHandSettings.x || 1),
        y: poseData.LeftHand.y * (leftHandSettings.y || 1),
        z: poseData.LeftHand.z * (leftHandSettings.z || 1),
      }, slerpFactor);
    }
    
    // 右臂
    if (poseData.RightUpperArm) {
      const rightArmSettings = axisSettings?.rightUpperArm || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('rightUpperArm', {
        x: poseData.RightUpperArm.x * (rightArmSettings.x || 1),
        y: poseData.RightUpperArm.y * (rightArmSettings.y || 1),
        z: poseData.RightUpperArm.z * (rightArmSettings.z || 1),
      }, slerpFactor);
    }
    
    if (poseData.RightLowerArm) {
      const rightLowerArmSettings = axisSettings?.rightLowerArm || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('rightLowerArm', {
        x: poseData.RightLowerArm.x * (rightLowerArmSettings.x || 1),
        y: poseData.RightLowerArm.y * (rightLowerArmSettings.y || 1),
        z: poseData.RightLowerArm.z * (rightLowerArmSettings.z || 1),
      }, slerpFactor);
    }
    
    if (poseData.RightHand) {
      const rightHandSettings = axisSettings?.rightHand || { x: 1, y: 1, z: 1 };
      this.applyBoneRotation('rightHand', {
        x: poseData.RightHand.x * (rightHandSettings.x || 1),
        y: poseData.RightHand.y * (rightHandSettings.y || 1),
        z: poseData.RightHand.z * (rightHandSettings.z || 1),
      }, slerpFactor);
    }
  }
  
  /**
   * 应用手部数据到 VRM
   * 
   * @param handData Kalidokit 手部数据
   * @param slerpFactor 插值因子，默认 0.1
   * @param axisSettings 轴设置（可选）
   */
  applyHands(
    handData: KalidokitHand,
    slerpFactor: number = 0.1,
    axisSettings?: Record<string, { x?: number; y?: number; z?: number }>
  ): void {
    if (!this.vrm || !handData) return;
    
    // 如果模型没有手指骨骼，跳过
    if (!this.capabilities.bones.hasFingerBones) {
      return;
    }
    
    // 左手手指映射（Kalidokit → VRM）
    const leftFingerMappings: Array<{ kalidokit: string; vrm: string }> = [
      { kalidokit: 'LeftThumbProximal', vrm: 'leftThumbProximal' },
      { kalidokit: 'LeftThumbIntermediate', vrm: 'leftThumbMetacarpal' }, // 注意：Kalidokit 的 Intermediate 对应 VRM 的 Metacarpal
      { kalidokit: 'LeftThumbDistal', vrm: 'leftThumbDistal' },
      { kalidokit: 'LeftIndexProximal', vrm: 'leftIndexProximal' },
      { kalidokit: 'LeftIndexIntermediate', vrm: 'leftIndexIntermediate' },
      { kalidokit: 'LeftIndexDistal', vrm: 'leftIndexDistal' },
      { kalidokit: 'LeftMiddleProximal', vrm: 'leftMiddleProximal' },
      { kalidokit: 'LeftMiddleIntermediate', vrm: 'leftMiddleIntermediate' },
      { kalidokit: 'LeftMiddleDistal', vrm: 'leftMiddleDistal' },
      { kalidokit: 'LeftRingProximal', vrm: 'leftRingProximal' },
      { kalidokit: 'LeftRingIntermediate', vrm: 'leftRingIntermediate' },
      { kalidokit: 'LeftRingDistal', vrm: 'leftRingDistal' },
      { kalidokit: 'LeftLittleProximal', vrm: 'leftLittleProximal' },
      { kalidokit: 'LeftLittleIntermediate', vrm: 'leftLittleIntermediate' },
      { kalidokit: 'LeftLittleDistal', vrm: 'leftLittleDistal' },
    ];
    
    // 右手手指映射
    const rightFingerMappings: Array<{ kalidokit: string; vrm: string }> = [
      { kalidokit: 'RightThumbProximal', vrm: 'rightThumbProximal' },
      { kalidokit: 'RightThumbIntermediate', vrm: 'rightThumbMetacarpal' },
      { kalidokit: 'RightThumbDistal', vrm: 'rightThumbDistal' },
      { kalidokit: 'RightIndexProximal', vrm: 'rightIndexProximal' },
      { kalidokit: 'RightIndexIntermediate', vrm: 'rightIndexIntermediate' },
      { kalidokit: 'RightIndexDistal', vrm: 'rightIndexDistal' },
      { kalidokit: 'RightMiddleProximal', vrm: 'rightMiddleProximal' },
      { kalidokit: 'RightMiddleIntermediate', vrm: 'rightMiddleIntermediate' },
      { kalidokit: 'RightMiddleDistal', vrm: 'rightMiddleDistal' },
      { kalidokit: 'RightRingProximal', vrm: 'rightRingProximal' },
      { kalidokit: 'RightRingIntermediate', vrm: 'rightRingIntermediate' },
      { kalidokit: 'RightRingDistal', vrm: 'rightRingDistal' },
      { kalidokit: 'RightLittleProximal', vrm: 'rightLittleProximal' },
      { kalidokit: 'RightLittleIntermediate', vrm: 'rightLittleIntermediate' },
      { kalidokit: 'RightLittleDistal', vrm: 'rightLittleDistal' },
    ];
    
    // 应用左手手指
    leftFingerMappings.forEach(({ kalidokit, vrm }) => {
      const fingerData = handData[kalidokit as keyof KalidokitHand] as { x: number; y: number; z: number } | undefined;
      if (fingerData) {
        const fingerSettings = axisSettings?.[vrm] || { x: 1, y: 1, z: 1 };
        this.applyBoneRotation(vrm, {
          x: fingerData.x * (fingerSettings.x || 1),
          y: fingerData.y * (fingerSettings.y || 1),
          z: fingerData.z * (fingerSettings.z || 1),
        }, slerpFactor);
      }
    });
    
    // 应用右手手指
    rightFingerMappings.forEach(({ kalidokit, vrm }) => {
      const fingerData = handData[kalidokit as keyof KalidokitHand] as { x: number; y: number; z: number } | undefined;
      if (fingerData) {
        const fingerSettings = axisSettings?.[vrm] || { x: 1, y: 1, z: 1 };
        this.applyBoneRotation(vrm, {
          x: fingerData.x * (fingerSettings.x || 1),
          y: fingerData.y * (fingerSettings.y || 1),
          z: fingerData.z * (fingerSettings.z || 1),
        }, slerpFactor);
      }
    });
  }
  
  /**
   * 应用表情数据到 VRM
   * 
   * @param faceData Kalidokit 面部数据
   * @param lerpFactor 插值因子，默认 0.1
   */
  applyExpressions(faceData: KalidokitFace, lerpFactor: number = 0.1): void {
    if (!this.vrm || !faceData) return;
    
    // 口型同步
    if (faceData.mouth?.shape) {
      const mouthShapes = [
        { name: 'aa', value: faceData.mouth.shape.A || 0 },
        { name: 'ih', value: faceData.mouth.shape.I || 0 },
        { name: 'ee', value: faceData.mouth.shape.E || 0 },
        { name: 'oh', value: faceData.mouth.shape.O || 0 },
        { name: 'ou', value: faceData.mouth.shape.U || 0 },
      ];
      
      mouthShapes.forEach(({ name, value }) => {
        const mappedName = EXPRESSION_MAPPING[name] || name;
        const currentValue = this.expressionAdapter.getValue(mappedName);
        const newValue = currentValue + (value - currentValue) * lerpFactor;
        this.expressionAdapter.setValue(mappedName, newValue);
      });
    }
    
    // 眨眼同步
    if (faceData.eye) {
      const blinkLeft = 1 - (faceData.eye.l || 1);
      const blinkRight = 1 - (faceData.eye.r || 1);
      
      const currentBlinkLeft = this.expressionAdapter.getValue('blinkLeft');
      const currentBlinkRight = this.expressionAdapter.getValue('blinkRight');
      
      this.expressionAdapter.setValue('blinkLeft', currentBlinkLeft + (blinkLeft - currentBlinkLeft) * lerpFactor);
      this.expressionAdapter.setValue('blinkRight', currentBlinkRight + (blinkRight - currentBlinkRight) * lerpFactor);
    }
  }
  
  /**
   * 应用头部旋转
   * 
   * @param headRotation 头部旋转数据 {x, y, z}
   * @param slerpFactor 插值因子，默认 0.1
   * @param axisSettings 轴设置（可选）
   */
  applyHeadRotation(
    headRotation: { x: number; y: number; z: number },
    slerpFactor: number = 0.1,
    axisSettings?: { x?: number; y?: number; z?: number }
  ): void {
    if (!this.vrm || !headRotation) return;
    
    const neckSettings = axisSettings || { x: 1, y: 1, z: 1 };
    this.applyBoneRotation('neck', {
      x: headRotation.x * (neckSettings.x || 1),
      y: headRotation.y * (neckSettings.y || 1),
      z: headRotation.z * (neckSettings.z || 1),
    }, slerpFactor * 0.7); // 头部旋转更保守
  }
  
  /**
   * 获取能力信息
   */
  getCapabilities(): VRMCapabilities {
    return this.capabilities;
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.boneCache.clear();
    this.availableBonesSet.clear();
  }
}

