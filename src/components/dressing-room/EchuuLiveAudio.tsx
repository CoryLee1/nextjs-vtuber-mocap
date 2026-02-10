'use client';

import React, { useEffect, useRef } from 'react';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { useSceneStore } from '@/hooks/use-scene-store';
import { createEchuuAudioQueue } from '@/lib/echuu-audio';

/**
 * 主应用内实时播放 ECHUU WebSocket 返回的语音，并同步 cue/playing 到 store（驱动 VRM 嘴型）。
 * 仅挂载在主流程（VTuberApp），不依赖 v1 页面。
 */
export function EchuuLiveAudio() {
  const { currentStep } = useEchuuWebSocket();
  const setEchuuCue = useSceneStore((s) => s.setEchuuCue);
  const setEchuuAudioPlaying = useSceneStore((s) => s.setEchuuAudioPlaying);
  const setEchuuSegmentDurationMs = useSceneStore((s) => s.setEchuuSegmentDurationMs);

  const audioQueueRef = useRef(
    createEchuuAudioQueue({
      onStart: () => setEchuuAudioPlaying(true),
      onEnd: () => setEchuuAudioPlaying(false),
      onError: () => setEchuuAudioPlaying(false),
      onSegmentDuration: (ms) => setEchuuSegmentDurationMs(ms),
    })
  );
  const lastEnqueuedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentStep?.cue != null) {
      setEchuuCue(currentStep.cue);
    }
  }, [currentStep?.cue, setEchuuCue]);

  useEffect(() => {
    const step = currentStep?.step;
    const audio = currentStep?.audio_b64;
    if (step == null) return;
    const key = `${step}-${audio ? audio.slice(0, 24) : "no-audio"}`;
    if (lastEnqueuedKeyRef.current === key) return;
    lastEnqueuedKeyRef.current = key;
    if (audio) {
      audioQueueRef.current.enqueue(audio);
    } else if (currentStep?.speech && process.env.NODE_ENV === 'development') {
      console.warn('[EchuuLiveAudio] Step has speech but no audio_b64 – backend TTS may have failed');
    }
  }, [currentStep?.step, currentStep?.audio_b64, currentStep?.speech]);

  useEffect(() => {
    return () => {
      audioQueueRef.current.stop();
      setEchuuAudioPlaying(false);
    };
  }, [setEchuuAudioPlaying]);

  return null;
}
