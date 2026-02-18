'use client';

import React, { memo, useMemo } from 'react';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { useSceneStore } from '@/hooks/use-scene-store';
import { memoryToDiaryEntries, saveDiaryHistory } from '@/lib/memory-diary';

function formatTime(ts: number | null): string {
  if (!ts) return '--:--';
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function formatDuration(startMs: number | null, endMs: number | null): string {
  if (!startMs || !endMs) return '0';
  const diff = Math.max(0, endMs - startMs);
  const minutes = Math.round(diff / 60000);
  return minutes < 1 ? '<1' : String(minutes);
}

/**
 * 直播结束 MVP 结算页 — 全屏覆盖在 3D 场景之上，呈现直播摘要。
 * 仅在 streamState === 'finished' 时显示。
 */
export const StreamEndMVP = memo(() => {
  const {
    streamState,
    liveStartedAt,
    liveEndedAt,
    peakOnlineCount,
    chatMessages,
    stepHistory,
    memorySnapshot,
    reset,
  } = useEchuuWebSocket();

  const echuuConfig = useSceneStore((s) => s.echuuConfig);
  const topic = echuuConfig.topic || 'Stream';

  // 计算互动数（观众发送的弹幕 = 非 AI 消息）
  const interactionCount = useMemo(
    () => chatMessages.filter((m) => !m.isAI).length,
    [chatMessages],
  );

  const durationMinutes = formatDuration(liveStartedAt, liveEndedAt);

  // 保存日记（只在首次渲染时执行一次）
  const diaryRef = React.useRef(false);
  React.useEffect(() => {
    if (streamState !== 'finished' || diaryRef.current) return;
    diaryRef.current = true;
    const entries = memoryToDiaryEntries(memorySnapshot, 'en');
    if (entries.length > 0) {
      saveDiaryHistory(entries, topic);
    }
  }, [streamState, memorySnapshot, topic]);

  if (streamState !== 'finished') return null;

  const handleResume = () => {
    // 重置状态回到 idle，用户可以再次开播
    reset();
  };

  const handleLeave = () => {
    reset();
    // 返回首页 — 直接 location 跳转，避免 Next router 缓存问题
    window.location.href = '/';
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* 背景模糊遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* 内容区 */}
      <div className="relative z-10 flex flex-col items-end gap-3 max-w-[700px] w-full px-8">
        {/* 装饰：闪烁星星 */}
        <div className="absolute -top-8 right-[120px] flex gap-2 animate-pulse">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" fill="#EEFF00" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="mt-1">
            <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" fill="#EEFF00" opacity="0.7" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="mt-3">
            <path d="M12 2l2.09 6.26L20.18 10l-6.09 1.74L12 18l-2.09-6.26L3.82 10l6.09-1.74L12 2z" fill="white" opacity="0.5" />
          </svg>
        </div>

        {/* 光环+翅膀装饰 */}
        <div className="flex items-center gap-1 mr-[80px]">
          <span className="text-[#EEFF00] text-xl animate-bounce" style={{ animationDuration: '2s' }}>
            ○
          </span>
          <span className="text-white/50 text-sm">✦ ✧ ✦</span>
        </div>

        {/* 主标题 */}
        <h1
          className="text-[48px] leading-none font-black tracking-tight"
          style={{ fontFamily: "'MHTIROGLA', system-ui, sans-serif" }}
        >
          <span className="text-white">That </span>
          <span
            className="relative inline-block px-2 py-0.5"
            style={{ background: '#EEFF00', color: '#000' }}
          >
            Hiiiiit!
            {/* 涂鸦效果小点 */}
            <span className="absolute -top-1 -right-2 text-[#EEFF00] text-[10px]">···</span>
          </span>
        </h1>

        {/* 话题标签 */}
        <div className="flex items-center gap-2">
          <span
            className="px-3 py-1 bg-[#EEFF00] text-black text-[16px] font-bold"
            style={{ fontFamily: "'MHTIROGLA', system-ui, sans-serif" }}
          >
            {topic}
          </span>
        </div>

        {/* 统计信息卡 */}
        <div
          className="mt-2 bg-white/10 backdrop-blur-sm rounded-lg px-5 py-3 border border-white/10 min-w-[260px]"
          style={{ fontFamily: "'MHTIROGLA', monospace" }}
        >
          {/* 时间范围 */}
          <div className="text-white/70 text-[14px] tracking-wide">
            {formatTime(liveStartedAt)} – {formatTime(liveEndedAt)}
          </div>
          {/* 持续时长 & 互动数 */}
          <div className="mt-1.5 text-white/90 text-[13px] space-y-0.5">
            <div>
              You stayed · <span className="text-white font-bold">{durationMinutes} min</span>
            </div>
            <div>
              Interactions · <span className="text-white font-bold">{interactionCount}</span>
            </div>
          </div>
        </div>

        {/* 按钮区 */}
        <div className="mt-4 flex flex-col items-end gap-2 text-[13px]" style={{ fontFamily: "'MHTIROGLA', monospace" }}>
          <button
            type="button"
            onClick={handleResume}
            className="text-white/60 hover:text-white transition tracking-wider"
          >
            [ Resume later ]
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="text-white/60 hover:text-white transition tracking-wider"
          >
            [ Leave ]
          </button>
        </div>
      </div>
    </div>
  );
});

StreamEndMVP.displayName = 'StreamEndMVP';
