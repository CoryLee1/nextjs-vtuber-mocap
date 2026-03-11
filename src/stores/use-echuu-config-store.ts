import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import type { EchuuCue } from '@/lib/echuu-vrm-bridge';
import { DEFAULT_PREVIEW_MODEL_URL } from '@/config/vtuber-animations';

/**
 * Echuu Live 配置状态接口
 *
 * 从 useSceneStore 拆分出来的独立 store，管理角色配置、音频同步、BGM 等直播相关字段。
 */
interface EchuuConfigState {
  echuuConfig: {
    characterName: string;
    voice: string;
    persona: string;
    background: string;
    topic: string;
    modelUrl: string;
    modelName: string;
  };
  setEchuuConfig: (config: Partial<EchuuConfigState['echuuConfig']>) => void;
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
}

export const useEchuuConfigStore = create<EchuuConfigState>()(
  persist(
    subscribeWithSelector((set) => ({
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
    })),
    {
      name: 'vtuber-echuu-config-storage',
      partialize: (state) => ({
        echuuConfig: state.echuuConfig,
        bgmUrl: state.bgmUrl,
        bgmVolume: state.bgmVolume,
      }),
    }
  )
);
