/**
 * VTuber 动画状态机：根据 echuuAudioPlaying 在 idle / speaking 间切换，并返回对应的动画 URL。
 * - speaking：固定用配置里第一个 talking 动画。
 * - idle：从 idle 组里随机选一个播放，每隔 IDLE_ROTATE_SEC 秒再随机换下一个。
 * - 同时返回 nextAnimationUrl：下一个可能切换到的 URL，供双缓冲预加载（当前播一个、预备一个）。
 */

import { useState, useEffect, useMemo } from 'react';
import { useSceneStore } from '@/hooks/use-scene-store';
import {
  DEFAULT_IDLE_URL,
  DEFAULT_SPEAKING_URL,
  IDLE_ROTATION_ANIMATIONS,
  SPEAKING_ANIMATIONS,
  PRELOAD_ANIMATION_URLS,
  type AnimationItem,
} from '@/config/vtuber-animations';

/** idle 状态下每隔多少秒随机切换到下一个 idle 动画 */
const IDLE_ROTATE_SEC = 20;

const FALLBACK_IDLE_URL = DEFAULT_IDLE_URL;

function pickRandomIdleUrl(): string {
  if (IDLE_ROTATION_ANIMATIONS.length === 0) return FALLBACK_IDLE_URL;
  const i = Math.floor(Math.random() * IDLE_ROTATION_ANIMATIONS.length);
  return IDLE_ROTATION_ANIMATIONS[i].url;
}

function pickRandomIdleItem(): AnimationItem | null {
  if (IDLE_ROTATION_ANIMATIONS.length === 0) return null;
  const i = Math.floor(Math.random() * IDLE_ROTATION_ANIMATIONS.length);
  return IDLE_ROTATION_ANIMATIONS[i];
}

/** 从预加载池里选一个与 currentUrl 不同的 URL，作为「下一个」预加载目标（双缓冲） */
function pickNextPreloadUrl(currentUrl: string): string {
  const pool = PRELOAD_ANIMATION_URLS.length > 0 ? PRELOAD_ANIMATION_URLS : [FALLBACK_IDLE_URL, DEFAULT_SPEAKING_URL];
  const others = pool.filter((u) => u !== currentUrl);
  if (others.length === 0) return currentUrl;
  return others[Math.floor(Math.random() * others.length)];
}

export type VTuberAnimationState = 'idle' | 'speaking';

export interface VTuberAnimationStateResult {
  state: VTuberAnimationState;
  animationUrl: string;
  /** 下一个可能切换到的 URL，用于与 animationUrl 组成双缓冲预加载（一个播、一个预备） */
  nextAnimationUrl: string;
  currentItem: AnimationItem | null;
}

/**
 * 状态机：echuuAudioPlaying === true → speaking（固定一个）；否则 → idle（随机轮播）。
 * idle 时每隔 IDLE_ROTATE_SEC 秒随机选下一个 idle 动画。
 */
export function useVTuberAnimationState(): VTuberAnimationStateResult {
  const echuuAudioPlaying = useSceneStore((s) => s.echuuAudioPlaying);

  // 进入 idle 时第一个动作为 Standing Greeting，之后随机轮播
  const [currentIdleUrl, setCurrentIdleUrl] = useState(
    () => IDLE_ROTATION_ANIMATIONS[0]?.url ?? FALLBACK_IDLE_URL
  );
  const [currentIdleItem, setCurrentIdleItem] = useState<AnimationItem | null>(
    () => IDLE_ROTATION_ANIMATIONS[0] ?? null
  );

  const state: VTuberAnimationState = echuuAudioPlaying ? 'speaking' : 'idle';

  // 进入 idle 时先播第一个（Standing Greeting）；之后每隔 IDLE_ROTATE_SEC 秒随机换下一个
  useEffect(() => {
    if (echuuAudioPlaying) return;

    setCurrentIdleUrl(IDLE_ROTATION_ANIMATIONS[0]?.url ?? FALLBACK_IDLE_URL);
    setCurrentIdleItem(IDLE_ROTATION_ANIMATIONS[0] ?? null);

    const t = window.setInterval(() => {
      setCurrentIdleUrl(pickRandomIdleUrl());
      setCurrentIdleItem(pickRandomIdleItem());
    }, IDLE_ROTATE_SEC * 1000);
    return () => clearInterval(t);
  }, [echuuAudioPlaying]);

  return useMemo(() => {
    const animationUrl =
      state === 'speaking' ? DEFAULT_SPEAKING_URL : currentIdleUrl;
    const currentItem: AnimationItem | null =
      state === 'speaking'
        ? SPEAKING_ANIMATIONS[0] ?? null
        : currentIdleItem;
    const nextAnimationUrl = pickNextPreloadUrl(animationUrl);

    return { state, animationUrl, nextAnimationUrl, currentItem };
  }, [state, currentIdleUrl, currentIdleItem]);
}
