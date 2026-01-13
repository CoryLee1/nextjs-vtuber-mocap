/**
 * VRM 信息记录器 Hook
 * 
 * 在 VRM 加载后自动提取并保存模型信息（仅执行一次，避免性能问题）
 * 
 * @file src/lib/vrm/debug/use-vrm-info-logger.ts
 */

import { useEffect, useRef } from 'react';
import type { VRM } from '@pixiv/three-vrm';
import { extractVRMInfo, saveVRMInfoToJSON, vrmInfoToJSON } from './vrm-info-extractor';

interface UseVRMInfoLoggerOptions {
  vrm: VRM | null;
  autoSave?: boolean; // 是否自动保存为 JSON 文件
  filename?: string; // 保存的文件名
  logToConsole?: boolean; // 是否在控制台输出
}

/**
 * VRM 信息记录器 Hook
 * 
 * 性能优化：使用 useRef 跟踪已处理的 VRM 实例，确保每个 VRM 只处理一次
 * 
 * @param options 配置选项
 */
export function useVRMInfoLogger(options: UseVRMInfoLoggerOptions): void {
  const {
    vrm,
    autoSave = false,
    filename = 'vrm-info.json',
    logToConsole = true,
  } = options;

  // PERF: 使用 ref 跟踪已处理的 VRM 实例，避免重复执行
  const processedVRMRef = useRef<VRM | null>(null);

  useEffect(() => {
    // 如果没有 VRM 或已经处理过这个 VRM 实例，直接返回
    if (!vrm || processedVRMRef.current === vrm) {
      return;
    }

    // 标记为已处理
    processedVRMRef.current = vrm;

    const info = extractVRMInfo(vrm);
    if (!info) {
      if (logToConsole && process.env.NODE_ENV === 'development') {
        console.warn('VRMInfoLogger: 无法提取 VRM 信息');
      }
      return;
    }

    // 在控制台输出
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.log('=== VRM 模型信息 ===');
      console.log('版本:', info.version);
      console.log('可用骨骼数量:', info.bones.available.length);
      console.log('缺失骨骼数量:', info.bones.missing.length);
      console.log('有手指骨骼:', info.bones.hasFingerBones);
      console.log('可用表情数量:', info.expressions.available.length);
      console.log('缺失表情数量:', info.expressions.missing.length);
      console.log('表情类型:', info.expressions.type);
      console.log('完整信息:', info);
      
      // 输出 JSON 字符串（便于复制）
      const jsonString = vrmInfoToJSON(info);
      console.log('📋 JSON 格式（可直接复制）:');
      console.log(jsonString);
      
      // 创建一个全局变量，方便在控制台访问
      (window as any).__VRM_INFO__ = info;
      (window as any).__VRM_INFO_JSON__ = jsonString;
      console.log('💡 提示: 在控制台输入 `copy(__VRM_INFO_JSON__)` 可快速复制 JSON');
    }

    // 自动保存为文件
    if (autoSave) {
      try {
        saveVRMInfoToJSON(info, filename);
        if (logToConsole && process.env.NODE_ENV === 'development') {
          console.log(`✅ VRM 信息已保存为: ${filename}`);
        }
      } catch (error) {
        if (logToConsole && process.env.NODE_ENV === 'development') {
          console.error('❌ 保存 VRM 信息失败:', error);
        }
      }
    }
    // PERF: 只依赖 vrm，其他参数变化不会触发重新执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vrm]);
}


