import { create } from 'zustand';
import type { VRMModel, Animation } from '@/types';

export interface S3ResourcesState {
  s3Models: VRMModel[];
  s3Animations: Animation[];
  modelsLoaded: boolean;
  animationsLoaded: boolean;
  loadModels: (opts?: { checkThumbnails?: boolean }) => Promise<void>;
  loadAnimations: () => Promise<void>;
  loadAll: (opts?: { checkThumbnails?: boolean }) => Promise<void>;
  setS3Models: (models: VRMModel[]) => void;
  setS3Animations: (animations: Animation[]) => void;
}

export const useS3ResourcesStore = create<S3ResourcesState>((set, get) => ({
  s3Models: [],
  s3Animations: [],
  modelsLoaded: false,
  animationsLoaded: false,

  setS3Models: (s3Models) => set({ s3Models, modelsLoaded: true }),
  setS3Animations: (s3Animations) => set({ s3Animations, animationsLoaded: true }),

  loadModels: async (opts) => {
    try {
      const q = opts?.checkThumbnails ? '&checkThumbs=1' : '';
      const res = await fetch(`/api/s3/resources?type=models${q}`);
      const json = res.ok ? await res.json() : { data: [] };
      const data = Array.isArray(json?.data) ? json.data : [];
      set({ s3Models: data, modelsLoaded: true });
    } catch {
      set({ s3Models: [], modelsLoaded: true });
    }
  },

  loadAnimations: async () => {
    try {
      const res = await fetch('/api/s3/resources?type=animations');
      const json = res.ok ? await res.json() : { data: [] };
      const data = Array.isArray(json?.data) ? json.data : [];
      set({ s3Animations: data, animationsLoaded: true });
    } catch {
      set({ s3Animations: [], animationsLoaded: true });
    }
  },

  loadAll: async (opts) => {
    await Promise.all([
      get().loadModels(opts),
      get().loadAnimations(),
    ]);
  },
}));
