/**
 * Loading 期间预加载首屏/场景相关资源，进入主界面时已进缓存。
 * 与 MainScene 默认环境、引导页预览、状态机动画保持一致。
 * 引导页模型会转为 Object URL 写入 store，引导页直接使用、无需二次请求。
 * S3 模型/动画列表在 loading 内请求并写入 s3-resources-store，避免进入引导页后再发请求。
 */
import {
  DEFAULT_PREVIEW_MODEL_URL,
  ONBOARDING_PREVIEW_ANIMATION_URLS,
  PRELOAD_ANIMATION_URLS,
  ALL_ANIMATION_URLS,
} from '@/config/vtuber-animations';
import { useSceneStore } from '@/hooks/use-scene-store';
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';
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
    const res = await fetch(url, { signal: controller.signal, cache: 'default' });
    if (!res.ok) {
      throw new Error(`preload failed: ${res.status}`);
    }
    // 读取完整响应体，确保关键资源真实下载进浏览器缓存。
    await res.arrayBuffer();
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * 触发 R3F 的 FBXLoader 预解析：下载 + parse 并缓存到 useLoader 内部缓存。
 * 后续 animation-manager 调用 useFBX(url) 时命中缓存，跳过 200-300ms 的 parse 延迟。
 * 失败时静默吞掉错误 — 不影响其他资源和场景渲染。
 */
function triggerFbxPreparse(urls: string[]): void {
  // 延迟 dynamic import，避免阻塞首屏关键路径
  import('@react-three/drei')
    .then(({ useFBX }) => {
      for (const url of urls) {
        try { useFBX.preload(url); } catch { /* non-fatal */ }
      }
    })
    .catch(() => { /* drei import failed — non-fatal */ });
}

/**
 * 空闲时后台预解析剩余 FBX 动画：在首屏关键资源加载完后调用。
 * 使用 requestIdleCallback（不支持时 setTimeout 4s）避免抢占主线程。
 */
function scheduleIdleFbxPreparse(alreadyPreloaded: string[]): void {
  const remaining = ALL_ANIMATION_URLS.filter((u) => !alreadyPreloaded.includes(u));
  if (remaining.length === 0) return;
  const run = () => triggerFbxPreparse(remaining);
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 8000 });
  } else {
    setTimeout(run, 4000);
  }
}

/** 预加载失败时依次尝试：models/ 路径 → 桶根公有 URL */
const FALLBACK_PREVIEW_MODEL_URLS = [
  getS3ObjectReadUrlByKey('models/AvatarSample_A.vrm', { proxy: true }),
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
  try {
    let lastErr: unknown = null;
    for (const url of urls) {
      try {
        const res = await fetch(url, { signal: controller.signal, cache: 'default' });
        if (!res.ok) throw new Error(`preload model: ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        useSceneStore.getState().setPreloadedPreviewModelUrl(objectUrl);
        // Populate drei's GLTF cache with the VRM plugin so useGLTF() resolves
        // instantly inside the Canvas (no re-parse delay on first render).
        try {
          const [{ useGLTF }, { VRMLoaderPlugin }] = await Promise.all([
            import('@react-three/drei'),
            import('@pixiv/three-vrm'),
          ]);
          useGLTF.preload(objectUrl, undefined, undefined, (loader: any) => {
            loader.register((parser: any) => new VRMLoaderPlugin(parser));
          });
        } catch {
          // Non-fatal — canvas will just parse on first render
        }
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

  // 默认 VRM：下载并转为 Object URL 写入 store，引导页直接用；vrm/ 失败时依次试 models/、桶根
  // 使用 proxy 模式避免 302 redirect 到 S3 导致的 CORS 问题
  const primaryProxyUrl = getS3ObjectReadUrlByKey('vrm/AvatarSample_A.vrm', { proxy: true });
  const modelPreload = preloadPreviewModelAndStore(
    primaryProxyUrl,
    FALLBACK_PREVIEW_MODEL_URLS,
    emitProgress
  );
  // 引导页 3D 预览 FBX + 状态机动画：下载到浏览器缓存 + 触发 FBXLoader 预解析
  const criticalFbxUrls = [
    ...ONBOARDING_PREVIEW_ANIMATION_URLS,
    ...PRELOAD_ANIMATION_URLS,
  ].filter((url, i, arr) => arr.indexOf(url) === i);

  const fbxPreloads = Promise.all(
    criticalFbxUrls.map((url) => fetchAndCache(url).catch(() => {}))
  ).then(() => {
    // 下载完成后立即触发 FBXLoader 预解析（fetch 命中浏览器缓存，仅 parse 开销）
    triggerFbxPreparse(criticalFbxUrls);
  }).finally(() => emitProgress(95));

  // S3 列表与首屏资源并行拉取；不阻塞 Loading 结束
  // 进入主界面后 HomePageClient 会再 loadAll(checkThumbnails: true) 做二次校准
  void useS3ResourcesStore
    .getState()
    .loadAll({ checkThumbnails: false })
    .catch(() => {});

  // 仅等待首屏核心资源：背景图 + 默认模型 + 关键 FBX
  await Promise.allSettled([imagePreload, modelPreload, fbxPreloads]);
  emitProgress(90);
  emitProgress(100);

  // 首屏加载完毕后，空闲时后台预解析剩余 FBX 动画（不阻塞 Loading 退出）
  scheduleIdleFbxPreparse(criticalFbxUrls);
}
