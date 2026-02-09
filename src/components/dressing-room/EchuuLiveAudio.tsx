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

  useEffect(() => {
    if (currentStep?.cue != null) {
      setEchuuCue(currentStep.cue);
    }
  }, [currentStep?.cue, setEchuuCue]);

  useEffect(() => {
    if (currentStep?.audio_b64) {
      audioQueueRef.current.enqueue(currentStep.audio_b64);
    }
  }, [currentStep?.audio_b64]);

  useEffect(() => {
    return () => {
      audioQueueRef.current.stop();
      setEchuuAudioPlaying(false);
    };
  }, [setEchuuAudioPlaying]);

  return null;
}
