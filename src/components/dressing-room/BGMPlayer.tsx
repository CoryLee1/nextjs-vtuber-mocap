'use client';

import { useEffect, useRef } from 'react';
import { useSceneStore } from '@/hooks/use-scene-store';

/**
 * 根据 store 的 bgmUrl / bgmVolume 播放 BGM，循环播放。
 * 需在直播页等需要 BGM 的页面挂载。
 */
export function BGMPlayer() {
  const bgmUrl = useSceneStore((s) => s.bgmUrl);
  const bgmVolume = useSceneStore((s) => s.bgmVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    if (!bgmUrl || bgmUrl.trim() === '') {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    const volume = Math.max(0, Math.min(100, bgmVolume)) / 100;
    audio.volume = volume;
    audio.loop = true;
    audio.src = bgmUrl;
    const p = audio.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // 自动播放可能被策略拦截（如无用户手势），忽略
      });
    }
  }, [bgmUrl, bgmVolume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !bgmUrl) return;
    const volume = Math.max(0, Math.min(100, bgmVolume)) / 100;
    audio.volume = volume;
  }, [bgmVolume, bgmUrl]);

  return null;
}
