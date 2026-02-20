/**
 * 客户端：拉取 S3 中缺少缩略图的 VRM 列表，逐个生成证件照并上传。
 * 依赖 generateVrmThumbnailBlob（浏览器 Three.js）和 s3Uploader.uploadThumbnail。
 */

import { generateVrmThumbnailBlob } from '@/lib/vrm-thumbnail-render';
import { s3Uploader } from '@/lib/s3-uploader';

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

/**
 * 拉取缺失缩略图的模型列表，逐个生成并上传证件照。
 * @param onProgress 每个模型处理完回调（current, total, modelName, success, error）
 * @returns 成功数、失败数
 */
export async function backfillVrmThumbnails(
  onProgress?: (p: BackfillProgress) => void
): Promise<{ ok: number; fail: number }> {
  const res = await fetch('/api/s3/resources?type=models&checkThumbs=1');
  const json = res.ok ? await res.json() : { data: [] };
  const list: ModelWithMeta[] = Array.isArray(json?.data) ? json.data : [];
  const needThumb = list.filter((m) => m.s3Key && m.hasThumbnail === false);
  let ok = 0;
  let fail = 0;
  const total = needThumb.length;

  for (let i = 0; i < needThumb.length; i++) {
    const model = needThumb[i];
    const modelName = model.name || model.s3Key || '';

    try {
      const blobRes = await fetch(model.url);
      if (!blobRes.ok) throw new Error(`HTTP ${blobRes.status}`);
      const blob = await blobRes.blob();
      const file = new File([blob], (model.name || 'model') + '.vrm', { type: 'model/vrm' });
      const result = await generateVrmThumbnailBlob(file);
      if (!result?.blob) {
        fail++;
        onProgress?.({ current: i + 1, total, modelName, success: false, error: '生成缩略图失败' });
        continue;
      }
      await s3Uploader.uploadThumbnail(result.blob, model.s3Key!);
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
