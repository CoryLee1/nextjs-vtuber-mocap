import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import type { VRM } from '@pixiv/three-vrm';
import type { CameraSettings } from '@/types/vtuber';
import { useRenderingConfigStore } from '@/stores/use-rendering-config-store';

/**
 * 场景类型
 */
export type SceneType = 'main' | 'settings' | 'hidden';

/**
 * 调试设置
 */
export interface DebugSettings {
  showDebug: boolean;
  showBones: boolean;
  showArmAxes: boolean;
  axisSettings?: Record<string, { x: number; y: number; z: number }>;
  debugAxisConfig?: Record<string, { x: number; y: number; z: number }>;
  handDebugAxisConfig?: Record<string, { x: number; y: number; z: number }>;
}

/**
 * 场景状态接口
 */
interface SceneState {
  // ========== Canvas 状态 ==========
  /** Canvas 是否已挂载并准备就绪 */
  canvasReady: boolean;
  setCanvasReady: (ready: boolean) => void;
  /** WebGL 上下文是否丢失 */
  webglContextLost: boolean;
  /** WebGL 上下文丢失累计次数 */
  webglLossCount: number;
  /** 自动降质：关闭 bloom/vignette/chromatic/handTrail，降 composerResolutionScale */
  triggerQualityDegradation: () => void;
  /** Stream 侧边栏是否打开（用于 Canvas 区域自适应，避免被盖住） */
  streamPanelOpen: boolean;
  setStreamPanelOpen: (open: boolean) => void;

  // ========== 场景控制 ==========
  /** 当前激活的场景 */
  activeScene: SceneType;
  setScene: (scene: SceneType) => void;
  /** 引导页是否正在显示（非持久化）：为 true 时主场景不渲染 VRMAvatar，避免两个 Canvas 争用同一 Three.js 对象 */
  isOnboardingActive: boolean;
  setIsOnboardingActive: (v: boolean) => void;

  // ========== VRM 模型缓存 ==========
  /** 缓存的 VRM 模型实例 */
  vrmModel: VRM | null;
  /** 当前模型 URL */
  vrmModelUrl: string | null;
  /** 当前动画 URL */
  animationUrl: string | null;
  /** 下一个可能切换到的动画 URL（双缓冲预加载用） */
  nextAnimationUrl: string | null;
  /** 暂停动画状态机：为 true 时不再用状态机覆盖 animationUrl，便于单独试播当前选的动画（如 KAWAII） */
  animationStateMachinePaused: boolean;
  setAnimationStateMachinePaused: (paused: boolean) => void;
  /** 设置 VRM 模型（缓存模型实例和 URL） */
  setVRMModel: (model: VRM, url: string) => void;
  /** 设置模型 URL（不改变模型实例，用于预加载） */
  setVRMModelUrl: (url: string) => void;
  /** Loading 阶段预加载的引导页模型 Object URL，引导页优先用以免二次请求 */
  preloadedPreviewModelUrl: string | null;
  setPreloadedPreviewModelUrl: (url: string | null) => void;
  /** 设置动画 URL */
  setAnimationUrl: (url: string) => void;
  /** 设置下一个预加载动画 URL */
  setNextAnimationUrl: (url: string | null) => void;
  /** 清除当前 VRM 模型（正确释放资源） */
  disposeCurrentVRM: () => void;

  // ========== MediaPipe 回调 ==========
  /**
   * MediaPipe 结果回调（使用 subscribe + ref 模式避免高频重渲染）
   * 注意：不要直接访问这个值，使用 subscribe 模式
   */
  _resultsCallback: ((results: any) => void) | null;
  /** 设置 MediaPipe 结果回调 */
  setResultsCallback: (callback: ((results: any) => void) | null) => void;

  // ========== 场景配置 ==========
  /** 相机设置 */
  cameraSettings: CameraSettings;
  /** 更新相机设置 */
  updateCameraSettings: (settings: Partial<CameraSettings>) => void;

  /** 调试设置 */
  debugSettings: DebugSettings;
  /** 更新调试设置 */
  updateDebugSettings: (settings: Partial<DebugSettings>) => void;

  // ========== 场景引用 ==========
  /** 请求截帧（时间戳，由 UI 设置；Canvas 内 useFrame 响应后清空） */
  takePhotoRequest: number | null;
  setTakePhotoRequest: (ts: number | null) => void;
  /** 截帧结果 Blob URL（Canvas 内写入；UI 消费后清空） */
  lastCaptureBlobUrl: string | null;
  setLastCaptureBlobUrl: (url: string | null) => void;
  /** VRM 模型引用（用于调试面板等） */
  vrmRef: React.RefObject<any> | null;
  /** 设置 VRM 引用 */
  setVrmRef: (ref: React.RefObject<any> | null) => void;
  /** 动画管理器引用 */
  animationManagerRef: any;
  /** 设置动画管理器引用 */
  setAnimationManagerRef: (ref: any) => void;
  /** 手部检测状态引用 */
  handDetectionStateRef: any;
  /** 设置手部检测状态引用 */
  setHandDetectionStateRef: (ref: any) => void;

}

/**
 * 默认相机设置
 */
const defaultCameraSettings: CameraSettings = {
  width: 640,
  height: 480,
  fps: 30,
  enableAutoTrack: true,
  enableUserControl: true,
  showHint: true,
  useGameStyle: false,
};

/**
 * 默认调试设置
 */
const defaultDebugSettings: DebugSettings = {
  showDebug: false,
  showBones: false,
  showArmAxes: false,
};

/**
 * 场景状态 Store
 * 
 * 管理 3D 场景的全局状态，包括：
 * - Canvas 就绪状态
 * - 场景切换
 * - VRM 模型缓存
 * - MediaPipe 回调（使用 subscribe 模式）
 * - 场景配置（相机、调试等）
 */
export const useSceneStore = create<SceneState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // ========== Canvas 状态 ==========
  canvasReady: false,
  setCanvasReady: (ready: boolean) => {
    set({ canvasReady: ready });
  },
  webglContextLost: false,
  webglLossCount: 0,
  triggerQualityDegradation: () => {
    const rs = useRenderingConfigStore.getState();
    rs.setPostProcessingEnabled(false);
    rs.setChromaticEnabled(false);
    rs.setHandTrailEnabled(false);
    rs.setComposerResolutionScale(0.5);
    console.warn('[triggerQualityDegradation] Disabled post-processing effects to reduce GPU pressure');
  },
  streamPanelOpen: false,
  setStreamPanelOpen: (open: boolean) => {
    set({ streamPanelOpen: open });
  },

  // ========== 场景控制 ==========
  activeScene: 'main',
  setScene: (scene: SceneType) => {
    set({ activeScene: scene });
  },
  isOnboardingActive: false,
  setIsOnboardingActive: (v: boolean) => set({ isOnboardingActive: v }),

  // ========== VRM 模型缓存 ==========
  vrmModel: null,
  vrmModelUrl: null,
  animationUrl: null,
  nextAnimationUrl: null,
  animationStateMachinePaused: false,
  setAnimationStateMachinePaused: (paused: boolean) => set({ animationStateMachinePaused: paused }),

  setVRMModel: (model: VRM, url: string) => {
    // 如果已有模型，先释放旧模型
    const currentModel = get().vrmModel;
    if (currentModel && currentModel !== model) {
      get().disposeCurrentVRM();
    }
    
    set({
      vrmModel: model,
      vrmModelUrl: url,
    });
  },

  setVRMModelUrl: (url: string) => {
    set({ vrmModelUrl: url });
  },

  preloadedPreviewModelUrl: null,
  setPreloadedPreviewModelUrl: (url: string | null) => {
    const prev = get().preloadedPreviewModelUrl;
    if (prev && prev !== url) try { URL.revokeObjectURL(prev); } catch (_) {}
    set({ preloadedPreviewModelUrl: url });
  },

  setAnimationUrl: (url: string) => {
    set({ animationUrl: url });
  },

  setNextAnimationUrl: (url: string | null) => {
    set({ nextAnimationUrl: url });
  },

  disposeCurrentVRM: () => {
    const { vrmModel } = get();
    
    if (vrmModel) {
      try {
        // 重要：不要在这里 remove/dispose three 对象。
        // 原因：VRM 由 useGLTF(@react-three/drei) 缓存复用；手动 dispose/remove
        // 会把缓存里的 scene/材质/贴图也一起清理掉，导致后续同 URL 的模型“永远显示不出来”。
        //
        // 这里仅做“逻辑层清理”：停止动画/断开引用，让 React Three Fiber 在卸载时处理资源生命周期。
        console.groupCollapsed('[disposeCurrentVRM] clearing VRM instance (no three dispose)');
        console.trace();
        console.groupEnd();

        // 停止动画（如果有 mixer）
        const { animationManagerRef } = get();
        if (animationManagerRef) {
          // 尝试切换到mocap模式来停止动画（如果方法存在）
          if (typeof animationManagerRef.switchToMocapMode === 'function') {
            animationManagerRef.switchToMocapMode();
          }
          // 或者直接停止mixer（如果mixer存在）
          if (animationManagerRef.mixer && typeof animationManagerRef.mixer.stopAllAction === 'function') {
            animationManagerRef.mixer.stopAllAction();
          }
        }
      } catch (error) {
        console.error('释放 VRM 模型资源时出错:', error);
      }
    }

    set({
      vrmModel: null,
    });
  },

  // ========== MediaPipe 回调 ==========
  _resultsCallback: null,
  setResultsCallback: (callback: ((results: any) => void) | null) => {
    set({ _resultsCallback: callback });
  },

  // ========== 场景配置 ==========
  cameraSettings: defaultCameraSettings,
  updateCameraSettings: (settings: Partial<CameraSettings>) => {
    set((state) => ({
      cameraSettings: { ...state.cameraSettings, ...settings },
    }));
  },

  debugSettings: defaultDebugSettings,
  updateDebugSettings: (settings: Partial<DebugSettings>) => {
    set((state) => ({
      debugSettings: { ...state.debugSettings, ...settings },
    }));
  },

  // ========== 场景引用 ==========
  takePhotoRequest: null,
  setTakePhotoRequest: (ts: number | null) => set({ takePhotoRequest: ts }),
  lastCaptureBlobUrl: null,
  setLastCaptureBlobUrl: (url: string | null) => {
    const prev = get().lastCaptureBlobUrl;
    // Auto-revoke previous blob URL when *replacing* with a new capture (not when clearing to null,
    // because the consumer may have grabbed the reference and needs it alive for processing).
    if (prev && url !== null && prev !== url && prev.startsWith('blob:')) {
      try { URL.revokeObjectURL(prev); } catch (_) { /* ignore */ }
    }
    set({ lastCaptureBlobUrl: url });
  },
  vrmRef: null,
  setVrmRef: (ref: React.RefObject<any> | null) => {
    set({ vrmRef: ref });
  },

  animationManagerRef: null,
  setAnimationManagerRef: (ref: any) => {
    set({ animationManagerRef: ref });
  },

  handDetectionStateRef: null,
  setHandDetectionStateRef: (ref: any) => {
    set({ handDetectionStateRef: ref });
  },

    })),
    {
      name: 'vtuber-scene-storage',
      partialize: (state) => ({
        // 仅持久化需要保存的配置，排除复杂对象和临时状态
        // Blob URLs are session-scoped; they become invalid after page reload.
        // Persist null so the app falls back to the default model on next load.
        vrmModelUrl: state.vrmModelUrl?.startsWith('blob:') ? null : state.vrmModelUrl,
        cameraSettings: state.cameraSettings,
        debugSettings: state.debugSettings,
      }),
    }
  )
);

/**
 * 便捷 Hook：订阅 MediaPipe 回调（避免高频重渲染）
 * 
 * 使用方式：
 * ```tsx
 * const callbackRef = useRef<Function>()
 * useMediaPipeCallback((cb) => { callbackRef.current = cb })
 * 
 * // 在 useFrame 中使用
 * useFrame(() => {
 *   if (callbackRef.current) {
 *     callbackRef.current(results)
 *   }
 * })
 * ```
 */
export function useMediaPipeCallback(
  onCallbackChange: (callback: ((results: any) => void) | null) => void
) {
  // 使用 subscribeWithSelector 中间件后，可以使用 selector subscribe
  return useSceneStore.subscribe(
    (state) => state._resultsCallback,
    (callback) => {
      onCallbackChange(callback);
    }
  );
}


