import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';

/**
 * 渲染配置状态接口
 *
 * 从 useSceneStore 拆分出来的独立 store，管理所有后处理/渲染相关字段。
 */
interface RenderingConfigState {
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
  /** 泛光亮度过渡平滑 [0,1]，越大边缘越柔 */
  bloomLuminanceSmoothing: number;
  setBloomLuminanceSmoothing: (v: number) => void;
  /** 后期管线分辨率缩放 (0.5-1)，降低可省性能 */
  composerResolutionScale: number;
  setComposerResolutionScale: (v: number) => void;
  /** 暗角开关 */
  vignetteEnabled: boolean;
  setVignetteEnabled: (v: boolean) => void;
  /** 暗角偏移 (0-1)，越大暗角范围越小 */
  vignetteOffset: number;
  setVignetteOffset: (v: number) => void;
  /** 暗角暗度 (0-1) */
  vignetteDarkness: number;
  setVignetteDarkness: (v: number) => void;
  /** 色散开关 */
  chromaticEnabled: boolean;
  setChromaticEnabled: (v: boolean) => void;
  /** 色散强度，约 0–0.05 */
  chromaticOffset: number;
  setChromaticOffset: (v: number) => void;
  /** 亮度 (-0.5 - 1.5)，默认 1 */
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
  /** 泛光开关 */
  bloomEnabled: boolean;
  setBloomEnabled: (v: boolean) => void;
  /** 后处理总开关（关闭后 EffectComposer 整个不渲染，节省大量 GPU） */
  postProcessingEnabled: boolean;
  setPostProcessingEnabled: (v: boolean) => void;
  /** LUT 调色开关 */
  lutEnabled: boolean;
  setLutEnabled: (v: boolean) => void;
  /** LUT 文件路径 (.cube) */
  lutUrl: string;
  setLutUrl: (v: string) => void;
  /** LUT 强度 (0-1) */
  lutIntensity: number;
  setLutIntensity: (v: number) => void;
  /** 手部轨迹特效开关 */
  handTrailEnabled: boolean;
  setHandTrailEnabled: (v: boolean) => void;
  /** Theatre.js 相机是否激活（取代 OrbitControls） */
  theatreCameraActive: boolean;
  setTheatreCameraActive: (v: boolean) => void;
  /** Theatre.js 序列播放状态 */
  theatreSequencePlaying: boolean;
  setTheatreSequencePlaying: (v: boolean) => void;
  /** 角色整体高度偏移 (Y)，主场景用，默认 0.35 避免贴地 */
  avatarPositionY: number;
  setAvatarPositionY: (v: number) => void;
  /** 是否显示 Gizmo 拖拽调整角色位置（主场景） */
  avatarGizmoEnabled: boolean;
  setAvatarGizmoEnabled: (v: boolean) => void;
  /** 相机视野 FOV（度），越小越像长焦，越大越广角。默认 50 */
  cameraFov: number;
  setCameraFov: (v: number) => void;
  /** 镜头模糊（景深/虚化），对焦在角色头部，默认关（耗 GPU） */
  depthOfFieldEnabled: boolean;
  setDepthOfFieldEnabled: (v: boolean) => void;
  /** 景深虚化强度（bokeh scale），约 4–24 */
  depthOfFieldBokehScale: number;
  setDepthOfFieldBokehScale: (v: number) => void;
}

export const useRenderingConfigStore = create<RenderingConfigState>()(
  persist(
    subscribeWithSelector((set) => ({
      hdrUrl: null,
      sceneFbxUrl: null,
      setHdrUrl: (url) => set({ hdrUrl: url }),
      setSceneFbxUrl: (url) => set({ sceneFbxUrl: url }),
      envBackgroundIntensity: 1.0,
      setEnvBackgroundIntensity: (v) => set({ envBackgroundIntensity: Math.max(0.1, Math.min(3, v)) }),
      envBackgroundRotation: 0,
      setEnvBackgroundRotation: (v) => set({ envBackgroundRotation: ((v % 360) + 360) % 360 }),
      toneMappingExposure: 1.45,
      setToneMappingExposure: (v) => set({ toneMappingExposure: Math.max(0.3, Math.min(3, v)) }),
      toneMappingMode: 'reinhard',
      setToneMappingMode: (v) => set({ toneMappingMode: v }),
      bloomIntensity: 0.25,
      setBloomIntensity: (v) => set({ bloomIntensity: v }),
      bloomThreshold: 0.6,
      setBloomThreshold: (v) => set({ bloomThreshold: v }),
      bloomLuminanceSmoothing: 0.025,
      setBloomLuminanceSmoothing: (v) => set({ bloomLuminanceSmoothing: Math.max(0, Math.min(1, v)) }),
      composerResolutionScale: 0.85,
      setComposerResolutionScale: (v) => set({ composerResolutionScale: Math.max(0.5, Math.min(1, v)) }),
      vignetteEnabled: false,
      setVignetteEnabled: (v) => set({ vignetteEnabled: v }),
      vignetteOffset: 0.5,
      setVignetteOffset: (v) => set({ vignetteOffset: Math.max(0, Math.min(1, v)) }),
      vignetteDarkness: 0.5,
      setVignetteDarkness: (v) => set({ vignetteDarkness: Math.max(0, Math.min(1, v)) }),
      chromaticEnabled: false,
      setChromaticEnabled: (v) => set({ chromaticEnabled: v }),
      chromaticOffset: 0.002,
      setChromaticOffset: (v) => set({ chromaticOffset: Math.max(0, Math.min(0.1, v)) }),
      brightness: 1,
      setBrightness: (v) => set({ brightness: v }),
      contrast: 0.20,
      setContrast: (v) => set({ contrast: v }),
      saturation: 0.16,
      setSaturation: (v) => set({ saturation: Math.max(-1, Math.min(1, v)) }),
      hue: 0.05,
      setHue: (v) => set({ hue: v }),
      bloomEnabled: true,
      setBloomEnabled: (v) => set({ bloomEnabled: v }),
      postProcessingEnabled: true,
      setPostProcessingEnabled: (v) => set({ postProcessingEnabled: v }),
      lutEnabled: false,
      setLutEnabled: (v) => set({ lutEnabled: v }),
      lutUrl: '/lut/cinematic-warm.cube',
      setLutUrl: (v) => set({ lutUrl: v }),
      lutIntensity: 0.6,
      setLutIntensity: (v) => set({ lutIntensity: Math.max(0, Math.min(1, v)) }),
      handTrailEnabled: false,
      setHandTrailEnabled: (v) => set({ handTrailEnabled: v }),
      theatreCameraActive: false,
      setTheatreCameraActive: (v) => set({ theatreCameraActive: v }),
      theatreSequencePlaying: false,
      setTheatreSequencePlaying: (v) => set({ theatreSequencePlaying: v }),
      avatarPositionY: 0.95,
      setAvatarPositionY: (v) => set({ avatarPositionY: v }),
      avatarGizmoEnabled: false,
      setAvatarGizmoEnabled: (v) => set({ avatarGizmoEnabled: v }),
      cameraFov: 50,
      setCameraFov: (v) => set({ cameraFov: Math.max(15, Math.min(90, v)) }),
      depthOfFieldEnabled: false,
      setDepthOfFieldEnabled: (v) => set({ depthOfFieldEnabled: v }),
      depthOfFieldBokehScale: 10,
      setDepthOfFieldBokehScale: (v) => set({ depthOfFieldBokehScale: Math.max(4, Math.min(24, v)) }),
    })),
    {
      name: 'vtuber-rendering-config-storage',
      partialize: (state) => ({
        envBackgroundIntensity: state.envBackgroundIntensity,
        envBackgroundRotation: state.envBackgroundRotation,
        composerResolutionScale: state.composerResolutionScale,
        chromaticEnabled: state.chromaticEnabled,
        chromaticOffset: state.chromaticOffset,
        brightness: state.brightness,
        contrast: state.contrast,
        saturation: state.saturation,
        postProcessingEnabled: state.postProcessingEnabled,
        handTrailEnabled: state.handTrailEnabled,
        hdrUrl: state.hdrUrl,
        sceneFbxUrl: state.sceneFbxUrl,
        avatarPositionY: state.avatarPositionY,
        avatarGizmoEnabled: state.avatarGizmoEnabled,
        cameraFov: state.cameraFov,
        depthOfFieldEnabled: state.depthOfFieldEnabled,
        depthOfFieldBokehScale: state.depthOfFieldBokehScale,
      }),
    }
  )
);
