/**
 * Loading 期间预加载首屏/场景相关资源，进入主界面时已进缓存。
 * 与 MainScene 默认环境、引导页预览、状态机动画保持一致。
 */
import { DEFAULT_PREVIEW_MODEL_URL, DEFAULT_IDLE_URL } from '@/config/vtuber-animations';

/** 默认环境/背景图（与 MainScene DEFAULT_ENV_BACKGROUND_URL 一致） */
const DEFAULT_ENV_BACKGROUND_URL = '/images/sky (3).png';

export function preloadCriticalAssets(): void {
  if (typeof window === 'undefined') return;

  // 默认环境图（PNG）：主场景背景，预加载后 useTexture 命中缓存
  const img = new Image();
  img.src = DEFAULT_ENV_BACKGROUND_URL;

  // 默认 VRM：引导页预览与主场景可能用到，预取进 HTTP 缓存
  fetch(DEFAULT_PREVIEW_MODEL_URL, { mode: 'cors' }).catch(() => {});

  // 默认 Idle 动画：主场景状态机首帧即用，预取进缓存
  fetch(DEFAULT_IDLE_URL, { mode: 'cors' }).catch(() => {});
}
