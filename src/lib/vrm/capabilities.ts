/**
 * VRM 模型能力检测器
 * 
 * 功能：
 * - 检测 VRM 模型版本（0.x 或 1.0）
 * - 检测可用骨骼列表
 * - 检测可用 BlendShape/Expression 列表
 * - 提供兼容层统一访问接口
 * 
 * @file src/lib/vrm/capabilities.ts
 */

import type { VRM } from '@pixiv/three-vrm';

/**
 * VRM 标准骨骼列表（按优先级排序）
 */
const STANDARD_BONES = [
  // 核心骨骼
  'hips', 'spine', 'chest', 'upperChest', 'neck', 'head',
  // 左臂
  'leftShoulder', 'leftUpperArm', 'leftLowerArm', 'leftHand',
  // 右臂
  'rightShoulder', 'rightUpperArm', 'rightLowerArm', 'rightHand',
  // 左腿
  'leftUpperLeg', 'leftLowerLeg', 'leftFoot', 'leftToes',
  // 右腿
  'rightUpperLeg', 'rightLowerLeg', 'rightFoot', 'rightToes',
  // 左手指
  'leftThumbMetacarpal', 'leftThumbProximal', 'leftThumbDistal',
  'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal',
  'leftMiddleProximal', 'leftMiddleIntermediate', 'leftMiddleDistal',
  'leftRingProximal', 'leftRingIntermediate', 'leftRingDistal',
  'leftLittleProximal', 'leftLittleIntermediate', 'leftLittleDistal',
  // 右手指
  'rightThumbMetacarpal', 'rightThumbProximal', 'rightThumbDistal',
  'rightIndexProximal', 'rightIndexIntermediate', 'rightIndexDistal',
  'rightMiddleProximal', 'rightMiddleIntermediate', 'rightMiddleDistal',
  'rightRingProximal', 'rightRingIntermediate', 'rightRingDistal',
  'rightLittleProximal', 'rightLittleIntermediate', 'rightLittleDistal',
] as const;

/**
 * 眼骨骼列表
 */
const EYE_BONES = ['leftEye', 'rightEye'] as const;

/**
 * VRM 0.x 到 1.0 的表情名称映射
 */
const EXPRESSION_MAP_0X_TO_1X: Record<string, string> = {
  // 基本表情
  'joy': 'happy',
  'sorrow': 'sad',
  'fun': 'relaxed',
  'angry': 'angry',
  'surprised': 'surprised',
  
  // 眨眼
  'blink_l': 'blinkLeft',
  'blink_r': 'blinkRight',
  
  // 口型
  'aa': 'aa',
  'ih': 'ih',
  'ou': 'ou',
  'ee': 'ee',
  'oh': 'oh',
  
  // 其他
  'neutral': 'neutral',
} as const;

/**
 * VRM 1.0 标准表情列表
 */
const STANDARD_EXPRESSIONS_1X = [
  'happy', 'angry', 'sad', 'relaxed', 'surprised',
  'blinkLeft', 'blinkRight', 'blink', 'lookUp', 'lookDown', 'lookLeft', 'lookRight',
  'aa', 'ih', 'ou', 'ee', 'oh',
  'neutral',
] as const;

/**
 * VRM 0.x 标准 BlendShape 列表
 */
const STANDARD_BLENDSHAPES_0X = [
  'joy', 'sorrow', 'fun', 'angry', 'surprised',
  'blink_l', 'blink_r',
  'aa', 'ih', 'ou', 'ee', 'oh',
  'neutral',
] as const;

/**
 * VRM 能力信息接口
 */
export interface VRMCapabilities {
  version: '0.x' | '1.0';
  bones: {
    available: string[];
    missing: string[];
    hasEyeBones: boolean;
    hasFingerBones: boolean;
  };
  expressions: {
    available: string[];
    missing: string[];
    type: 'blendShape' | 'expression';
  };
}

/**
 * 检测 VRM 模型版本
 * 
 * @param vrm VRM 模型实例
 * @returns '0.x' 或 '1.0'
 */
function detectVRMVersion(vrm: VRM): '0.x' | '1.0' {
  // VRM 1.0 有 expressionManager
  if (vrm.expressionManager) {
    return '1.0';
  }
  
  // VRM 0.x 有 blendShapeProxy
  if ((vrm as any).blendShapeProxy) {
    return '0.x';
  }
  
  // 默认假设为 1.0（更常见）
  return '1.0';
}

/**
 * 检测可用骨骼列表
 * 
 * @param vrm VRM 模型实例
 * @returns 骨骼信息
 */
function detectBones(vrm: VRM): VRMCapabilities['bones'] {
  const available: string[] = [];
  const missing: string[] = [];
  
  if (!vrm.humanoid || !vrm.humanoid.humanBones) {
    return {
      available: [],
      missing: [...STANDARD_BONES],
      hasEyeBones: false,
      hasFingerBones: false,
    };
  }
  
  const humanBones = vrm.humanoid.humanBones;
  
  // 检测标准骨骼
  STANDARD_BONES.forEach(boneName => {
    const bone = humanBones[boneName];
    if (bone && bone.node) {
      available.push(boneName);
    } else {
      missing.push(boneName);
    }
  });
  
  // 检测眼骨骼
  const hasLeftEye = !!(humanBones.leftEye?.node);
  const hasRightEye = !!(humanBones.rightEye?.node);
  const hasEyeBones = hasLeftEye && hasRightEye;
  
  // 检测手指骨骼（至少需要一只手的手指骨骼）
  const fingerBones = [
    'leftThumbProximal', 'leftIndexProximal',
    'rightThumbProximal', 'rightIndexProximal',
  ];
  const hasFingerBones = fingerBones.some(boneName => {
    const bone = humanBones[boneName];
    return !!(bone && bone.node);
  });
  
  return {
    available,
    missing,
    hasEyeBones,
    hasFingerBones,
  };
}

/**
 * 检测可用表情列表
 * 
 * @param vrm VRM 模型实例
 * @param version VRM 版本
 * @returns 表情信息
 */
function detectExpressions(vrm: VRM, version: '0.x' | '1.0'): VRMCapabilities['expressions'] {
  const available: string[] = [];
  const missing: string[] = [];
  let type: 'blendShape' | 'expression' = 'expression';
  
  if (version === '1.0') {
    // VRM 1.0: 使用 expressionManager
    type = 'expression';
    
    if (vrm.expressionManager) {
      const expressions = vrm.expressionManager.expressions;
      
      // 策略：先全量提取所有表情名称（标准+自定义），全部放入 available
      // VRM 1.0: expressions 是一个数组或类数组对象，需要遍历并提取 expressionName 属性
      // 注意：不能使用 Object.keys()，否则会得到索引 ["0", "1", ...]
      const allExpressionNames: string[] = [];
      
      if (Array.isArray(expressions)) {
        // 标准数组：直接遍历
        expressions.forEach((expr: any) => {
          // 提取 expressionName 属性（VRM 1.0 标准属性）
          const name = (expr?.expressionName || expr?.name || '').trim();
          if (name && typeof name === 'string') {
            allExpressionNames.push(name);
          }
        });
      } else if (expressions && typeof expressions === 'object') {
        // 类数组对象：使用 Array.from 或 for...of 遍历
        try {
          // 尝试使用 Array.from 转换为数组（适用于类数组对象）
          const expressionsArray = Array.from(expressions as any);
          expressionsArray.forEach((expr: any) => {
            const name = (expr?.expressionName || expr?.name || '').trim();
            if (name && typeof name === 'string') {
              allExpressionNames.push(name);
            }
          });
        } catch {
          // 如果 Array.from 失败，尝试使用 for...of 遍历
          try {
            for (const expr of expressions as any) {
              const name = (expr?.expressionName || expr?.name || '').trim();
              if (name && typeof name === 'string') {
                allExpressionNames.push(name);
              }
            }
          } catch {
            // 最后的降级方案：直接访问对象的值（不推荐，但作为兜底）
            Object.values(expressions).forEach((expr: any) => {
              const name = (expr?.expressionName || expr?.name || '').trim();
              if (name && typeof name === 'string') {
                allExpressionNames.push(name);
              }
            });
          }
        }
      }
      
      // 去重：确保 available 列表中的名称是唯一的（保留原始顺序）
      const uniqueNames = Array.from(new Set(allExpressionNames));
      available.push(...uniqueNames);
      
      // 计算 missing：对比标准列表，找出哪些标准表情是模型没有定义的（不区分大小写）
      const caseInsensitiveIncludes = (arr: string[], name: string): boolean => {
        const lowerName = name.toLowerCase();
        return arr.some(item => item.toLowerCase() === lowerName);
      };
      
      STANDARD_EXPRESSIONS_1X.forEach(exprName => {
        if (!caseInsensitiveIncludes(available, exprName)) {
          missing.push(exprName);
        }
      });
    } else {
      // 如果没有 expressionManager，所有标准表情都缺失
      STANDARD_EXPRESSIONS_1X.forEach(exprName => {
        missing.push(exprName);
      });
    }
  } else {
    // VRM 0.x: 使用 blendShapeProxy
    type = 'blendShape';
    
    const blendShapeProxy = (vrm as any).blendShapeProxy;
    if (blendShapeProxy && blendShapeProxy.blendShapeGroups) {
      const blendShapeGroups = blendShapeProxy.blendShapeGroups;
      
      // 策略：先全量提取所有 BlendShape 名称（标准+自定义），全部放入 available
      // 从 blendShapeGroups 数组中提取 name 属性
      const allBlendShapeNames: string[] = blendShapeGroups
        .map((group: any) => {
          const name = group.name || '';
          return typeof name === 'string' ? name.trim() : '';
        })
        .filter((name: string): name is string => Boolean(name));
      
      // 去重：确保 available 列表中的名称是唯一的（保留原始顺序）
      const uniqueNames = Array.from(new Set(allBlendShapeNames));
      available.push(...uniqueNames);
      
      // 计算 missing：对比标准列表，找出哪些标准表情是模型没有定义的（不区分大小写）
      const caseInsensitiveIncludes = (arr: string[], name: string): boolean => {
        const lowerName = name.toLowerCase();
        return arr.some(item => item.toLowerCase() === lowerName);
      };
      
      STANDARD_BLENDSHAPES_0X.forEach(blendShapeName => {
        if (!caseInsensitiveIncludes(available, blendShapeName)) {
          missing.push(blendShapeName);
        }
      });
    } else {
      // 如果没有 blendShapeProxy，所有标准表情都缺失
      STANDARD_BLENDSHAPES_0X.forEach(blendShapeName => {
        missing.push(blendShapeName);
      });
    }
  }
  
  return {
    available,
    missing,
    type,
  };
}

/**
 * 检测 VRM 模型能力
 * 
 * @param vrm VRM 模型实例
 * @returns VRM 能力信息
 */
export function detectVRMCapabilities(vrm: VRM | null): VRMCapabilities | null {
  if (!vrm) {
    return null;
  }
  
  const version = detectVRMVersion(vrm);
  const bones = detectBones(vrm);
  const expressions = detectExpressions(vrm, version);
  
  return {
    version,
    bones,
    expressions,
  };
}

/**
 * VRM 表情适配器
 * 统一 VRM 0.x 和 1.0 的表情访问接口
 */
export class VRMExpressionAdapter {
  private vrm: VRM;
  private version: '0.x' | '1.0';
  private blendShapeProxy: any; // VRM 0.x
  
  constructor(vrm: VRM) {
    this.vrm = vrm;
    this.version = detectVRMVersion(vrm);
    
    if (this.version === '0.x') {
      this.blendShapeProxy = (vrm as any).blendShapeProxy;
    }
  }
  
  /**
   * 设置表情值
   * 
   * @param name 表情名称（支持 0.x 和 1.0 的名称）
   * @param value 值 (0-1)
   */
  setValue(name: string, value: number): void {
    // 限制值范围
    value = Math.max(0, Math.min(1, value));
    
    if (this.version === '1.0') {
      // VRM 1.0: 使用 expressionManager
      if (this.vrm.expressionManager) {
        // 如果传入的是 0.x 的名称，转换为 1.0 名称
        const mappedName = EXPRESSION_MAP_0X_TO_1X[name] || name;
        this.vrm.expressionManager.setValue(mappedName, value);
      }
    } else {
      // VRM 0.x: 使用 blendShapeProxy
      if (this.blendShapeProxy) {
        // 如果传入的是 1.0 的名称，转换为 0.x 名称
        const mappedName = this.mapExpressionNameTo0x(name);
        this.blendShapeProxy.setValue(mappedName, value);
      }
    }
  }
  
  /**
   * 获取表情值
   * 
   * @param name 表情名称
   * @returns 值 (0-1)
   */
  getValue(name: string): number {
    if (this.version === '1.0') {
      // VRM 1.0: 使用 expressionManager
      if (this.vrm.expressionManager) {
        const mappedName = EXPRESSION_MAP_0X_TO_1X[name] || name;
        return this.vrm.expressionManager.getValue(mappedName) || 0;
      }
    } else {
      // VRM 0.x: 使用 blendShapeProxy
      if (this.blendShapeProxy) {
        const mappedName = this.mapExpressionNameTo0x(name);
        return this.blendShapeProxy.getValue(mappedName) || 0;
      }
    }
    
    return 0;
  }
  
  /**
   * 将 1.0 的表情名称映射到 0.x 名称
   */
  private mapExpressionNameTo0x(name: string): string {
    // 反向查找映射表
    const reverseMap: Record<string, string> = {};
    Object.entries(EXPRESSION_MAP_0X_TO_1X).forEach(([key, value]) => {
      reverseMap[value] = key;
    });
    
    return reverseMap[name] || name;
  }
}

