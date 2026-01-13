/**
 * VRM 信息提取器
 * 
 * 功能：
 * - 提取 VRM 模型的骨骼结构
 * - 提取 BlendShape/Expression 信息
 * - 保存为 JSON 文件（用于调试和参考）
 * 
 * @file src/lib/vrm/debug/vrm-info-extractor.ts
 */

import type { VRM } from '@pixiv/three-vrm';
import { detectVRMCapabilities } from '../capabilities';

/**
 * VRM 信息接口
 */
export interface VRMInfo {
  version: '0.x' | '1.0';
  bones: {
    available: Array<{
      name: string;
      nodeName: string;
      parentName: string | null;
      position: { x: number; y: number; z: number };
    }>;
    missing: string[];
    hasEyeBones: boolean;
    hasFingerBones: boolean;
  };
  expressions: {
    available: string[];
    missing: string[];
    type: 'blendShape' | 'expression';
  };
  timestamp: string;
}

/**
 * 提取 VRM 模型信息
 * 
 * @param vrm VRM 模型实例
 * @returns VRM 信息对象
 */
export function extractVRMInfo(vrm: VRM | null): VRMInfo | null {
  if (!vrm) return null;

  const capabilities = detectVRMCapabilities(vrm);
  if (!capabilities) return null;

  const info: VRMInfo = {
    version: capabilities.version,
    bones: {
      available: [],
      missing: capabilities.bones.missing,
      hasEyeBones: capabilities.bones.hasEyeBones,
      hasFingerBones: capabilities.bones.hasFingerBones,
    },
    expressions: {
      available: capabilities.expressions.available,
      missing: capabilities.expressions.missing,
      type: capabilities.expressions.type,
    },
    timestamp: new Date().toISOString(),
  };

  // 提取骨骼详细信息
  // ✅ 修复：getBoneNode() 已被弃用，优先使用 humanBones[].node，降级使用 getNormalizedBoneNode()
  if (vrm.humanoid) {
    capabilities.bones.available.forEach(boneName => {
      // 优先使用 humanBones[boneName].node（直接访问）
      // 降级使用 getNormalizedBoneNode（如果直接访问不可用）
      let boneNode: any = null;
      if (vrm.humanoid.humanBones?.[boneName]?.node) {
        boneNode = vrm.humanoid.humanBones[boneName].node;
      } else if (typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
        boneNode = vrm.humanoid.getNormalizedBoneNode(boneName as any);
      }
      
      if (boneNode) {
        const { position } = boneNode;
        
        // 数值清理：使用 Number(val.toFixed(5)) 消除极小的科学计数法噪声
        // 例如将 1.948e-17 转为 0
        const cleanNumber = (value: number): number => {
          return Number(value.toFixed(5));
        };
        
        info.bones.available.push({
          name: boneName,
          nodeName: boneNode.name,
          parentName: boneNode.parent?.name || null,
          position: {
            x: cleanNumber(position.x),
            y: cleanNumber(position.y),
            z: cleanNumber(position.z),
          },
        });
      }
    });
  }

  return info;
}

/**
 * 将 VRM 信息保存为 JSON 文件（浏览器环境）
 * 
 * @param info VRM 信息
 * @param filename 文件名（默认：vrm-info.json）
 */
export function saveVRMInfoToJSON(info: VRMInfo, filename: string = 'vrm-info.json'): void {
  const json = JSON.stringify(info, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 将 VRM 信息转换为 JSON 字符串（用于复制或日志）
 * 
 * @param info VRM 信息
 * @returns JSON 字符串
 */
export function vrmInfoToJSON(info: VRMInfo): string {
  return JSON.stringify(info, null, 2);
}




