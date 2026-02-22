/**
 * Loading 期间预加载首屏/场景相关资源，进入主界面时已进缓存。
 * 与 MainScene 默认环境、引导页预览、状态机动画保持一致。
 */
import { DEFAULT_PREVIEW_MODEL_URL, DEFAULT_IDLE_URL } from '@/config/vtuber-animations';

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

  // 默认 VRM + 默认 Idle：完整下载，降低首进场黑屏等待
  const modelPreload = fetchAndCache(DEFAULT_PREVIEW_MODEL_URL)
    .catch(() => {})
    .finally(() => emitProgress(70));
  const idleAnimPreload = fetchAndCache(DEFAULT_IDLE_URL)
    .catch(() => {})
    .finally(() => emitProgress(95));

  await Promise.allSettled([imagePreload, modelPreload, idleAnimPreload]);
  emitProgress(100);
}
