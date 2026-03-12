/**
 * Loading 期间预加载首屏/场景相关资源，进入主界面时已进缓存。
 * 与 MainScene 默认环境、引导页预览、状态机动画保持一致。
 * 引导页模型会转为 Object URL 写入 store，引导页直接使用、无需二次请求。
 * S3 模型/动画列表在 loading 内请求并写入 s3-resources-store，避免进入引导页后再发请求。
 */
import {
  ONBOARDING_PREVIEW_ANIMATION_URLS,
  PRELOAD_ANIMATION_URLS,
} from '@/config/vtuber-animations';
import { useSceneStore } from '@/hooks/use-scene-store';
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';

/** 默认环境/背景图（与 MainScene DEFAULT_ENV_BACKGROUND_URL 一致） */
const DEFAULT_ENV_BACKGROUND_URL = '/images/sky (3).png';

const PRELOAD_TIMEOUT_MS = 25000;
const PRELOAD_ONBOARDING_FBX_COUNT = 2;

interface PreloadOptions {
  onProgress?: (progress: number) => void;
}

async function fetchAndCache(url: string): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PRELOAD_TIMEOUT_MS);

  try {
    const res = await fetch(url, { mode: 'cors', signal: controller.signal, cache: 'force-cache' });
    if (!res.ok) {
      throw new Error(`preload failed: ${res.status}`);
    }
    // 读取完整响应体，确保关键资源真实下载进浏览器缓存。
    await res.arrayBuffer();
  } finally {
    window.clearTimeout(timer);
  }
}

/** 预加载首选：带 proxy=1，API 直接返回 body，避免 presigned URL 的 x-amz-checksum-mode 导致 403 */
const PRELOAD_PRIMARY_MODEL_URL = getS3ObjectReadUrlByKey('vrm/AvatarSample_A.vrm', { proxy: true });

/** 预加载失败时依次尝试：无 proxy 的 API URL、models/、桶根（可能仍 403，仅作兜底） */
const FALLBACK_PREVIEW_MODEL_URLS = [
  getS3ObjectReadUrlByKey('vrm/AvatarSample_A.vrm'),
  getS3ObjectReadUrlByKey('models/AvatarSample_A.vrm'),
  'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm',
];

/** 预加载模型并写入 store 为 Object URL，引导页直接使用；主 URL 失败时依次尝试 fallback 列表 */
async function preloadPreviewModelAndStore(
  primaryUrl: string,
  fallbackUrls: string[],
  emitProgress: (p: number) => void
): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PRELOAD_TIMEOUT_MS);
  const urls = [primaryUrl, ...fallbackUrls].filter((u, i, arr) => arr.indexOf(u) === i);
  const isDev = process.env.NODE_ENV === 'development';
  try {
    let lastErr: unknown = null;
    for (let urlIndex = 0; urlIndex < urls.length; urlIndex++) {
      const url = urls[urlIndex];
      try {
        const t0 = isDev ? performance.now() : 0;
        const res = await fetch(url, { mode: 'cors', signal: controller.signal, cache: 'force-cache' });
        if (!res.ok) throw new Error(`preload model: ${res.status}`);
        const blob = await res.blob();
        const t1 = isDev ? performance.now() : 0;
        const objectUrl = URL.createObjectURL(blob);
        // 先 preload 再写 store，避免 store 更新触发 revoke 时 preload 尚未 fetch 当前 blob
        try {
          const [{ useGLTF }, { VRMLoaderPlugin }] = await Promise.all([
            import('@react-three/drei'),
            import('@pixiv/three-vrm'),
          ]);
          useGLTF.preload(objectUrl, undefined, undefined, (loader: any) => {
            loader.register((parser: any) => new VRMLoaderPlugin(parser));
          });
          const t2 = isDev ? performance.now() : 0;
          if (isDev) {
            const fetchMs = Math.round(t1 - t0);
            const parseMs = Math.round(t2 - t1);
            const urlLabel = urlIndex === 0 ? 'primary' : `fallback_${urlIndex}`;
            console.log(`[Preload VRM] fetch ${fetchMs} ms, parse(preload) ${parseMs} ms, url=${urlLabel}`);
          }
        } catch {
          if (isDev) {
            const fetchMs = Math.round(t1 - t0);
            console.log(`[Preload VRM] fetch ${fetchMs} ms, parse(preload) failed, url=${urlIndex === 0 ? 'primary' : `fallback_${urlIndex}`}`);
          }
        }
        useSceneStore.getState().setPreloadedPreviewModelUrl(objectUrl);
        emitProgress(70);
        return;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  } catch (_) {
    emitProgress(70);
  } finally {
    window.clearTimeout(timer);
  }
}

export async function preloadCriticalAssets(options?: PreloadOptions): Promise<void> {
  if (typeof window === 'undefined') return;
  const onProgress = options?.onProgress;
  let currentProgress = 0;
  const emitProgress = (next: number) => {
    currentProgress = Math.max(currentProgress, Math.min(100, next));
    onProgress?.(currentProgress);
  };
  emitProgress(2);

  // 默认环境图（PNG）：主场景背景，预加载后 useTexture 命中缓存
  const imagePreload = new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => {
      emitProgress(25);
      resolve();
    };
    img.onerror = () => {
      emitProgress(25);
      resolve();
    };
    img.src = DEFAULT_ENV_BACKGROUND_URL;
  });

  // 默认 VRM：优先用 proxy=1（API 直返 body，避免 presigned 403）；失败再试 fallback
  const modelPreload = preloadPreviewModelAndStore(
    PRELOAD_PRIMARY_MODEL_URL,
    FALLBACK_PREVIEW_MODEL_URLS,
    emitProgress
  );
  // 引导页 3D 预览 FBX：优先预拉 Standing Greeting / Thinking，再拉 idle 轮播前 2 个
  const fbxPreloads = Promise.all(
    [
      ...ONBOARDING_PREVIEW_ANIMATION_URLS,
      ...PRELOAD_ANIMATION_URLS.slice(0, PRELOAD_ONBOARDING_FBX_COUNT),
    ]
      .filter((url, i, arr) => arr.indexOf(url) === i)
      .map((url) => fetchAndCache(url).catch(() => {}))
  ).finally(() => emitProgress(95));

  // S3 列表与首屏资源并行拉取；不阻塞 Loading 结束
  // 进入主界面后 HomePageClient 会再 loadAll(checkThumbnails: true) 做二次校准
  void useS3ResourcesStore
    .getState()
    .loadAll({ checkThumbnails: false })
    .catch(() => {});

  // 仅等待首屏核心资源：背景图 + 默认模型 + 少量 FBX
  await Promise.allSettled([imagePreload, modelPreload, fbxPreloads]);
  emitProgress(90);
  emitProgress(100);
}
