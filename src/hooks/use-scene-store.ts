import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import type { VRM } from '@pixiv/three-vrm';
import type { CameraSettings } from '@/types/vtuber';
import type { EchuuCue } from '@/lib/echuu-vrm-bridge';
import { DEFAULT_PREVIEW_MODEL_URL } from '@/config/vtuber-animations';

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

  // ========== Echuu Live 状态 ==========
  echuuConfig: {
    characterName: string;
    voice: string;
    persona: string;
    background: string;
    topic: string;
    modelUrl: string;
    modelName: string;
  };
  setEchuuConfig: (config: Partial<SceneState['echuuConfig']>) => void;
  echuuCue: EchuuCue | null;
  setEchuuCue: (cue: EchuuCue | null) => void;
  echuuAudioPlaying: boolean;
  setEchuuAudioPlaying: (playing: boolean) => void;
  /** 当前句音频时长（ms），用于 caption 打字机与声音同步 */
  echuuSegmentDurationMs: number | null;
  setEchuuSegmentDurationMs: (v: number | null) => void;
  /** 与音频同步的 caption 文本 — 仅在音频开始播放时设置，确保打字机与声音对齐 */
  echuuCaptionText: string;
  setEchuuCaptionText: (v: string) => void;
  /** BGM 播放 URL（空则停止） */
  bgmUrl: string | null;
  /** BGM 音量 0–100 */
  bgmVolume: number;
  setBgmUrl: (url: string | null) => void;
  setBgmVolume: (v: number) => void;
  /** 场景 HDR 环境贴图 URL（空则用默认） */
  hdrUrl: string | null;
  /** 场景 FBX 模型 URL（3D 场景道具，可 Gizmo 控制） */
  sceneFbxUrl: string | null;
  setHdrUrl: (url: string | null) => void;
  setSceneFbxUrl: (url: string | null) => void;
  /** 环境/背景亮度乘数（1=原图，>1 更亮） */
  envBackgroundIntensity: number;
  setEnvBackgroundIntensity: (v: number) => void;
  /** 环境/背景旋转（度 0–360，绕 Y 轴） */
  envBackgroundRotation: number;
  setEnvBackgroundRotation: (v: number) => void;
  /** 整体曝光（色调映射曝光，>1 更亮、天空更通透，缓解发灰） */
  toneMappingExposure: number;
  setToneMappingExposure: (v: number) => void;
  /** 色调映射模式：aces=电影感易发灰，linear=最鲜艳，reinhard=折中 */
  toneMappingMode: 'aces' | 'linear' | 'reinhard';
  setToneMappingMode: (v: 'aces' | 'linear' | 'reinhard') => void;
  /** 泛光强度 (0-2) */
  bloomIntensity: number;
  setBloomIntensity: (v: number) => void;
  /** 泛光阈值 (0-1.5) */
  bloomThreshold: number;
  setBloomThreshold: (v: number) => void;
  /** 亮度 (-0.5 - 0.5) */
  brightness: number;
  setBrightness: (v: number) => void;
  /** 对比度 (-0.5 - 0.5) */
  contrast: number;
  setContrast: (v: number) => void;
  /** 饱和度 (-1 to 1, 0=原始) */
  saturation: number;
  setSaturation: (v: number) => void;
  /** 色相偏移 (-Math.PI to Math.PI) */
  hue: number;
  setHue: (v: number) => void;
  /** 手部轨迹特效开关 */
  handTrailEnabled: boolean;
  setHandTrailEnabled: (v: boolean) => void;
  /** Theatre.js 相机是否激活（取代 OrbitControls） */
  theatreCameraActive: boolean;
  setTheatreCameraActive: (v: boolean) => void;
  /** Theatre.js 序列播放状态 */
  theatreSequencePlaying: boolean;
  setTheatreSequencePlaying: (v: boolean) => void;
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
  setLastCaptureBlobUrl: (url: string | null) => set({ lastCaptureBlobUrl: url }),
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

  // ========== Echuu Live 状态 ==========
  echuuConfig: {
    characterName: '六螺',
    voice: 'Cherry',
    persona: '一个性格古怪、喜欢碎碎念的虚拟主播',
    background: '正在直播，和观众聊天',
    topic: '关于上司的超劲爆八卦',
    modelUrl: DEFAULT_PREVIEW_MODEL_URL,
    modelName: 'Avatar Sample A',
  },
  setEchuuConfig: (config) => {
    set((state) => ({
      echuuConfig: {
        ...state.echuuConfig,
        ...config,
      },
    }));
  },
  echuuCue: null,
  setEchuuCue: (cue) => set({ echuuCue: cue }),
  echuuAudioPlaying: false,
  setEchuuAudioPlaying: (playing) => set({ echuuAudioPlaying: playing }),
  echuuSegmentDurationMs: null,
  setEchuuSegmentDurationMs: (v) => set({ echuuSegmentDurationMs: v }),
  echuuCaptionText: '',
  setEchuuCaptionText: (v) => set({ echuuCaptionText: v }),
  bgmUrl: null,
  bgmVolume: 80,
  setBgmUrl: (url) => set({ bgmUrl: url }),
  setBgmVolume: (v) => set({ bgmVolume: Math.max(0, Math.min(100, v)) }),
  hdrUrl: null,
  sceneFbxUrl: null,
  setHdrUrl: (url) => set({ hdrUrl: url }),
  setSceneFbxUrl: (url) => set({ sceneFbxUrl: url }),
  envBackgroundIntensity: 1.25,
  setEnvBackgroundIntensity: (v) => set({ envBackgroundIntensity: Math.max(0.1, Math.min(3, v)) }),
  envBackgroundRotation: 0,
  setEnvBackgroundRotation: (v) => set({ envBackgroundRotation: ((v % 360) + 360) % 360 }),
  toneMappingExposure: 1.2,
  setToneMappingExposure: (v) => set({ toneMappingExposure: Math.max(0.3, Math.min(3, v)) }),
  toneMappingMode: 'reinhard',
  setToneMappingMode: (v) => set({ toneMappingMode: v }),
  bloomIntensity: 0.4,
  setBloomIntensity: (v) => set({ bloomIntensity: v }),
  bloomThreshold: 0.85,
  setBloomThreshold: (v) => set({ bloomThreshold: v }),
  brightness: 0,
  setBrightness: (v) => set({ brightness: v }),
  contrast: 0,
  setContrast: (v) => set({ contrast: v }),
  saturation: 0,
  setSaturation: (v) => set({ saturation: Math.max(-1, Math.min(1, v)) }),
  hue: 0,
  setHue: (v) => set({ hue: v }),
  handTrailEnabled: false,
  setHandTrailEnabled: (v) => set({ handTrailEnabled: v }),
  theatreCameraActive: false,
  setTheatreCameraActive: (v) => set({ theatreCameraActive: v }),
  theatreSequencePlaying: false,
  setTheatreSequencePlaying: (v) => set({ theatreSequencePlaying: v }),
    })),
    {
      name: 'vtuber-scene-storage',
      partialize: (state) => ({
        // 仅持久化需要保存的配置，排除复杂对象和临时状态
        vrmModelUrl: state.vrmModelUrl,
        echuuConfig: state.echuuConfig,
        cameraSettings: state.cameraSettings,
        debugSettings: state.debugSettings,
        envBackgroundIntensity: state.envBackgroundIntensity,
        envBackgroundRotation: state.envBackgroundRotation,
        toneMappingExposure: state.toneMappingExposure,
        toneMappingMode: state.toneMappingMode,
        bloomIntensity: state.bloomIntensity,
        bloomThreshold: state.bloomThreshold,
        brightness: state.brightness,
        contrast: state.contrast,
        saturation: state.saturation,
        hue: state.hue,
        handTrailEnabled: state.handTrailEnabled,
        hdrUrl: state.hdrUrl,
        sceneFbxUrl: state.sceneFbxUrl,
        bgmUrl: state.bgmUrl,
        bgmVolume: state.bgmVolume,
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

