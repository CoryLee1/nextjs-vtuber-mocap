'use client';

import React, { useEffect, useRef } from 'react';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { useSceneStore } from '@/hooks/use-scene-store';
import { createEchuuAudioQueue } from '@/lib/echuu-audio';

/**
 * 主应用内实时播放 ECHUU WebSocket 返回的语音，并同步 cue/playing 到 store（驱动 VRM 嘴型）。
 *
 * 音频-字幕同步策略：
 *   1. step 到达 → 暂存 pendingCaption 文本（不立即展示）
 *   2. onSegmentDuration → 先写入 echuuSegmentDurationMs
 *   3. onStart（audio.play 成功）→ 把 pendingCaption 写入 echuuCaptionText
 *   这样 CaptionTypewriter 拿到文本时，duration 一定已经就绪。
 */
export function EchuuLiveAudio() {
  const { currentStep } = useEchuuWebSocket();
  const setEchuuCue = useSceneStore((s) => s.setEchuuCue);
  const setEchuuAudioPlaying = useSceneStore((s) => s.setEchuuAudioPlaying);
  const setEchuuSegmentDurationMs = useSceneStore((s) => s.setEchuuSegmentDurationMs);
  const setEchuuCaptionText = useSceneStore((s) => s.setEchuuCaptionText);
  const echuuConfig = useSceneStore((s) => s.echuuConfig);

  /** 等待音频开始时要展示的字幕（含角色名前缀） */
  const pendingCaptionRef = useRef('');

  const audioQueueRef = useRef(
    createEchuuAudioQueue({
      onStart: () => {
        setEchuuAudioPlaying(true);
        // 音频真正开始播放 → 此时 duration 已就绪 → 把字幕推给 typewriter
        const caption = pendingCaptionRef.current;
        if (caption) {
          setEchuuCaptionText(caption);
        }
      },
      onEnd: () => {
        setEchuuAudioPlaying(false);
      },
      onError: () => {
        setEchuuAudioPlaying(false);
        // 音频失败时，仍然展示字幕（用 fallback 速度）
        const caption = pendingCaptionRef.current;
        if (caption) {
          setEchuuSegmentDurationMs(null);
          setEchuuCaptionText(caption);
        }
      },
      onSegmentDuration: (ms) => {
        // 音频元数据加载完 → 先写入时长（此时音频还没 play）
        setEchuuSegmentDurationMs(ms);
      },
    })
  );
  const lastEnqueuedKeyRef = useRef<string | null>(null);

  // Sync cue to store
  useEffect(() => {
    if (currentStep?.cue != null) {
      setEchuuCue(currentStep.cue);
    }
  }, [currentStep?.cue, setEchuuCue]);

  // Enqueue audio and prepare pending caption
  useEffect(() => {
    const step = currentStep?.step;
    const audio = currentStep?.audio_b64;
    const speech = currentStep?.speech;
    if (step == null) return;
    const key = `${step}-${audio ? audio.slice(0, 24) : 'no-audio'}`;
    if (lastEnqueuedKeyRef.current === key) return;
    lastEnqueuedKeyRef.current = key;

    // 组装字幕文本
    const captionText = speech
      ? `${echuuConfig.characterName}：${speech}`
      : '';
    pendingCaptionRef.current = captionText;

    if (audio) {
      // 清除上一句的 duration，等新音频 onloadedmetadata 重新设置
      setEchuuSegmentDurationMs(null);
      audioQueueRef.current.enqueue(audio);
    } else {
      // 没有音频 → 直接展示字幕（用 fallback 速度）
      if (captionText) {
        setEchuuSegmentDurationMs(null);
        setEchuuCaptionText(captionText);
      }
      if (speech && process.env.NODE_ENV === 'development') {
        console.warn('[EchuuLiveAudio] Step has speech but no audio_b64 – backend TTS may have failed');
      }
    }
  }, [currentStep?.step, currentStep?.audio_b64, currentStep?.speech, echuuConfig.characterName, setEchuuSegmentDurationMs, setEchuuCaptionText]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioQueueRef.current.stop();
      setEchuuAudioPlaying(false);
      setEchuuCaptionText('');
    };
  }, [setEchuuAudioPlaying, setEchuuCaptionText]);

  return null;
}
