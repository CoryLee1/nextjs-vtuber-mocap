import type { VRM } from '@pixiv/three-vrm';
import { lerp } from 'three/src/math/MathUtils.js';

/**
 * Map echuu emotion key to VRM expression name (VRM1 naming).
 * Falls back to 'neutral' for unknown emotions.
 */
const EMOTION_TO_VRM: Record<string, string> = {
  happy: 'happy',
  angry: 'angry',
  sad: 'sad',
  surprised: 'surprised',
  relaxed: 'relaxed',
  neutral: 'neutral',
  fun: 'relaxed',
  sorrow: 'sad',
};

/** All emotion expression names we might set */
const ALL_EMOTIONS = ['happy', 'angry', 'sad', 'surprised', 'relaxed', 'neutral'] as const;

/** Mouth viseme names (VRM1) */
const VISEME_NAMES = ['aa', 'ih', 'ee', 'oh', 'ou'] as const;

export interface EchuuCue {
  emotion?: {
    key: string;
    intensity: number;
    attack?: number;
    release?: number;
  };
  gesture?: {
    clip: string;
    weight?: number;
    duration?: number;
  };
  look?: {
    target: string;
    strength?: number;
  };
  blink?: {
    mode: string;
    extra?: number;
  };
  lipsync?: {
    enabled: boolean;
    aa?: number;
    ih?: number;
    ou?: number;
    ee?: number;
    oh?: number;
  };
}

/**
 * Apply echuu emotion cue to VRM expression manager.
 * Uses lerp for smooth transitions.
 */
export function applyEmotionToVRM(
  vrm: VRM,
  emotionKey: string,
  intensity: number,
  lerpFactor: number
) {
  if (!vrm.expressionManager) return;

  const targetExpression = EMOTION_TO_VRM[emotionKey] || 'neutral';

  for (const name of ALL_EMOTIONS) {
    const current = vrm.expressionManager.getValue(name) || 0;
    const target = name === targetExpression ? intensity : 0;
    const newValue = lerp(current, target, lerpFactor);
    vrm.expressionManager.setValue(name, newValue);
  }
}

/**
 * Reset all emotion expressions to 0.
 */
export function resetEmotions(vrm: VRM, lerpFactor: number) {
  if (!vrm.expressionManager) return;
  for (const name of ALL_EMOTIONS) {
    const current = vrm.expressionManager.getValue(name) || 0;
    const newValue = lerp(current, 0, lerpFactor);
    vrm.expressionManager.setValue(name, newValue);
  }
}

/**
 * Simple lip sync: cycle through mouth shapes while audio plays.
 * Call this in useFrame when audio is active.
 */
export function applyLipSync(vrm: VRM, isAudioPlaying: boolean, time: number, lerpFactor: number) {
  if (!vrm.expressionManager) return;

  if (!isAudioPlaying) {
    // Close mouth
    for (const name of VISEME_NAMES) {
      const current = vrm.expressionManager.getValue(name) || 0;
      vrm.expressionManager.setValue(name, lerp(current, 0, lerpFactor));
    }
    return;
  }

  // Simple vowel cycling at ~8Hz
  const cycleIndex = Math.floor(time * 8) % VISEME_NAMES.length;
  for (let i = 0; i < VISEME_NAMES.length; i++) {
    const current = vrm.expressionManager.getValue(VISEME_NAMES[i]) || 0;
    // Active shape gets 0.6-0.9 weight based on a sine wave for natural movement
    const target = i === cycleIndex ? 0.6 + 0.3 * Math.abs(Math.sin(time * 12)) : 0;
    vrm.expressionManager.setValue(VISEME_NAMES[i], lerp(current, target, lerpFactor * 2));
  }
}

/**
 * Apply a full PerformerCue from echuu step event.
 */
export function applyEchuuCue(
  vrm: VRM,
  cue: EchuuCue | null,
  isAudioPlaying: boolean,
  time: number,
  delta: number
) {
  if (!vrm.expressionManager) return;

  const lerpFactor = Math.min(delta * 6, 1);

  if (cue?.emotion) {
    applyEmotionToVRM(vrm, cue.emotion.key, cue.emotion.intensity, lerpFactor);
  } else {
    resetEmotions(vrm, lerpFactor * 0.5);
  }

  applyLipSync(vrm, isAudioPlaying, time, lerpFactor);
}
