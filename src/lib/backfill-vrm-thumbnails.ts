/**
 * 客户端：拉取 S3 中缺少缩略图的 VRM 列表，逐个生成证件照并上传。
 * 流程：先尝试解析 VRM metadata 内嵌缩略图（走 API），若无则拍大头照（Three.js 渲染）。
 */

import { generateVrmThumbnailBlob } from '@/lib/vrm-thumbnail-render';
import { s3Uploader } from '@/lib/s3-uploader';

const VRM_FETCH_TIMEOUT_MS = 60000; // VRM 可能较大，60s 超时

export interface BackfillProgress {
  current: number;
  total: number;
  modelName: string;
  success: boolean;
  error?: string;
}

/** 带 s3Key、hasThumbnail 的模型（与 API checkThumbs=1 返回一致） */
interface ModelWithMeta {
  id: string;
  name: string;
  url: string;
  s3Key?: string;
  hasThumbnail?: boolean;
}

export interface BackfillOptions {
  /** 为 true 时忽略 hasThumbnail，对目标模型重新拍大头照并覆盖（用于修正背面照） */
  forceRegenerate?: boolean;
  /** 指定要重拍的 s3Key 列表，仅处理这些；未指定时 forceRegenerate 处理全部 */
  s3KeysToRegenerate?: string[];
}

/**
 * 拉取缺失缩略图的模型列表，逐个生成并上传证件照。
 * 1. 先走 /api/vrm-thumbnail 解析 metadata 内嵌缩略图（服务端拉 VRM、提取）
 * 2. 若 404（无内嵌缩略图），则客户端拉 VRM + Three.js 拍大头照
 * forceRegenerate=true 时跳过 metadata，对所有模型强制拍大头照覆盖
 * @param onProgress 每个模型处理完回调（current, total, modelName, success, error）
 * @returns 成功数、失败数
 */
export async function backfillVrmThumbnails(
  onProgress?: (p: BackfillProgress) => void,
  options?: BackfillOptions
): Promise<{ ok: number; fail: number }> {
  const res = await fetch('/api/s3/resources?type=models&checkThumbs=1');
  const json = res.ok ? await res.json() : { data: [] };
  const list: ModelWithMeta[] = Array.isArray(json?.data) ? json.data : [];
  const forceRegenerate = options?.forceRegenerate ?? false;
  const s3KeysToRegenerate = options?.s3KeysToRegenerate;
  const isSelectiveRegenerate = Boolean(s3KeysToRegenerate?.length);
  let needThumb: ModelWithMeta[];
  if (isSelectiveRegenerate) {
    const keySet = new Set(s3KeysToRegenerate);
    needThumb = list.filter((m) => m.s3Key && keySet.has(m.s3Key));
  } else if (forceRegenerate) {
    needThumb = list.filter((m) => m.s3Key);
  } else {
    needThumb = list.filter((m) => m.s3Key && m.hasThumbnail === false);
  }
  const shouldForceRegenerate = forceRegenerate || isSelectiveRegenerate;
  let ok = 0;
  let fail = 0;
  const total = needThumb.length;

  for (let i = 0; i < needThumb.length; i++) {
    const model = needThumb[i];
    const modelName = model.name || model.s3Key || '';

    try {
      const fetchUrl = model.url.includes('?') ? `${model.url}&proxy=1` : `${model.url}?proxy=1`;

      // forceRegenerate 或 s3KeysToRegenerate 时跳过 metadata，直接拍大头照覆盖
      let apiRes: Response | null = null;
      if (!shouldForceRegenerate) {
        apiRes = await fetch(
          `/api/vrm-thumbnail?url=${encodeURIComponent(fetchUrl)}`,
          { signal: AbortSignal.timeout(VRM_FETCH_TIMEOUT_MS) }
        );
      }

      let thumbBlob: Blob | null = null;

      if (apiRes?.ok) {
        // API 已解析 metadata 并回写 S3，无需再上传
        ok++;
        onProgress?.({ current: i + 1, total, modelName, success: true });
        continue;
      } else if (shouldForceRegenerate || apiRes?.status === 404) {
        // 2. 无内嵌缩略图，客户端拉 VRM + 拍大头照（先 extract 再 render）
        const blobRes = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(VRM_FETCH_TIMEOUT_MS),
        });
        if (!blobRes.ok) throw new Error(`HTTP ${blobRes.status}`);
        const blob = await blobRes.blob();
        const file = new File([blob], (model.name || 'model') + '.vrm', { type: 'model/vrm' });
        const result = await generateVrmThumbnailBlob(file, {
          // 强制重拍（全量或单模型）时，忽略 VRM 内嵌缩略图，直接渲染正面头像
          skipExtraction: shouldForceRegenerate,
        });
        thumbBlob = result?.blob ?? null;
      } else {
        throw new Error(`API ${apiRes?.status ?? 'unknown'}`);
      }

      if (!thumbBlob) {
        fail++;
        onProgress?.({ current: i + 1, total, modelName, success: false, error: '拍大头照失败' });
        continue;
      }

      await s3Uploader.uploadThumbnail(thumbBlob, model.s3Key!);
      ok++;
      onProgress?.({ current: i + 1, total, modelName, success: true });
    } catch (e) {
      fail++;
      onProgress?.({
        current: i + 1,
        total,
        modelName,
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return { ok, fail };
}
