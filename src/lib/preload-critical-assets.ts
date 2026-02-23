/**
 * Loading 期间预加载首屏/场景相关资源，进入主界面时已进缓存。
 * 与 MainScene 默认环境、引导页预览、状态机动画保持一致。
 * 引导页模型会转为 Object URL 写入 store，引导页直接使用、无需二次请求。
 * S3 模型/动画列表在 loading 内请求并写入 s3-resources-store，避免进入引导页后再发请求。
 */
import { DEFAULT_PREVIEW_MODEL_URL, DEFAULT_IDLE_URL } from '@/config/vtuber-animations';
import { useSceneStore } from '@/hooks/use-scene-store';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';

/** 默认环境/背景图（与 MainScene DEFAULT_ENV_BACKGROUND_URL 一致） */
const DEFAULT_ENV_BACKGROUND_URL = '/images/sky (3).png';

const PRELOAD_TIMEOUT_MS = 25000;

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

/** 预加载模型并写入 store 为 Object URL，引导页直接使用 */
async function preloadPreviewModelAndStore(url: string, emitProgress: (p: number) => void): Promise<void> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PRELOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, { mode: 'cors', signal: controller.signal, cache: 'force-cache' });
    if (!res.ok) throw new Error(`preload model: ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    useSceneStore.getState().setPreloadedPreviewModelUrl(objectUrl);
    emitProgress(70);
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

  // 默认 VRM：下载并转为 Object URL 写入 store，引导页直接用、不二次请求
  const modelPreload = preloadPreviewModelAndStore(DEFAULT_PREVIEW_MODEL_URL, emitProgress);
  // 默认 Idle：完整下载进缓存
  const idleAnimPreload = fetchAndCache(DEFAULT_IDLE_URL)
    .catch(() => {})
    .finally(() => emitProgress(95));

  // S3 列表与首屏资源并行拉取；不 checkThumbnails 以加快速度，进入主界面后 HomePageClient 会再 loadAll(checkThumbnails: true)
  const s3Preload = useS3ResourcesStore
    .getState()
    .loadAll({ checkThumbnails: false })
    .catch(() => {});

  await Promise.allSettled([imagePreload, modelPreload, idleAnimPreload, s3Preload]);
  emitProgress(90);
  emitProgress(100);
}
