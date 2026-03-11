"use client";

import React, { memo, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Camera, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { useSceneStore } from '@/hooks/use-scene-store';
import { toast } from '@/hooks/use-toast';
import { SOCIAL_CAPTURE_PRESETS } from '@/config/social-capture-presets';
import type { SocialCapturePreset } from '@/config/social-capture-presets';

// 聊天面板底部按钮：语言切换 + 直播拍照（仅截 3D 画布，可选社交尺寸+控制文件大小）
const ChatPanelFooterButtons = memo(() => {
  const { t, locale, changeLocale } = useI18n();
  const canvasReady = useSceneStore((s) => s.canvasReady);
  const lastCaptureBlobUrl = useSceneStore((s) => s.lastCaptureBlobUrl);
  const setLastCaptureBlobUrl = useSceneStore((s) => s.setLastCaptureBlobUrl);
  const [langOpen, setLangOpen] = useState(false);
  const [captureMenuOpen, setCaptureMenuOpen] = useState(false);
  const pendingPresetRef = useRef<SocialCapturePreset | null>(null);

  // 发请求：由 Canvas 内 TakePhotoCapture 在 useFrame 中截帧并写回 lastCaptureBlobUrl；preset 存到 ref 供消费时使用
  const handleTakePhoto = (preset: SocialCapturePreset | null) => {
    if (!canvasReady) {
      toast({ title: t('layout.cannotCapture'), description: t('layout.sceneNotReady'), variant: 'destructive' });
      return;
    }
    pendingPresetRef.current = preset;
    setCaptureMenuOpen(false);
    useSceneStore.getState().setTakePhotoRequest(Date.now());
  };

  // 消费截帧结果：若选了预设则裁剪为平台尺寸+JPEG 控制体积，否则原图 PNG；下载并清空
  useEffect(() => {
    if (!lastCaptureBlobUrl) return;
    const url = lastCaptureBlobUrl;
    const preset = pendingPresetRef.current;
    pendingPresetRef.current = null;
    setLastCaptureBlobUrl(null);

    // Unified revoke: finish() is the single revoke point — schedules revoke after
    // the browser has had time to consume the blob for download/preview.
    const finish = (finalUrl: string, fileName: string, _mime: string, extraRevokeUrl?: string) => {
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = fileName;
      a.click();
      const w = window.open(finalUrl, '_blank', 'noopener');
      if (w) w.document.title = fileName;
      toast({ title: t('common.saved'), description: t('common.downloaded', { fileName }) });
      // Revoke after a short delay so browser finishes consuming the blob
      setTimeout(() => {
        if (finalUrl.startsWith('blob:')) try { URL.revokeObjectURL(finalUrl); } catch (_) {}
        if (extraRevokeUrl && extraRevokeUrl !== finalUrl && extraRevokeUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(extraRevokeUrl); } catch (_) {}
        }
      }, 3000);
    };

    if (preset) {
      import('@/lib/capture-utils').then(({ processCaptureToPreset }) => {
        processCaptureToPreset(url, preset)
          .then(({ blobUrl }) => {
            const ext = 'jpg';
            const name = `stream-${preset.id.replace(':', 'x')}-${Date.now()}.${ext}`;
            // Revoke both the processed blobUrl and the original capture url
            finish(blobUrl, name, 'image/jpeg', url);
          })
          .catch(() => {
            toast({ title: t('common.processFailed'), description: t('common.originalDownloaded'), variant: 'destructive' });
            const name = `stream-photo-${Date.now()}.png`;
            finish(url, name, 'image/png');
          });
      });
      // Do NOT revoke url here — the async processCaptureToPreset still needs it
    } else {
      const name = `stream-photo-${Date.now()}.png`;
      finish(url, name, 'image/png');
    }
  }, [lastCaptureBlobUrl, setLastCaptureBlobUrl]);

  const locales = [
    { code: 'zh' as const, label: '中文', flag: '🇨🇳' },
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'ja' as const, label: '日本語', flag: '🇯🇵' },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => setLangOpen((o) => !o)}
          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-black/90 border-2 border-[#B7FF7A] text-[#B7FF7A] text-[11px] font-bold w-full"
          aria-label={t('layout.langLabel')}
        >
          <Languages className="h-4 w-4" />
        </button>
        {langOpen && (
          <>
            <div className="absolute bottom-full left-0 mb-1 py-1 rounded-lg bg-black/95 border border-[#B7FF7A]/50 min-w-[120px] z-20">
              {locales.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    changeLocale(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${l.code === locale ? 'text-[#B7FF7A] font-bold' : 'text-white/90'}`}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setLangOpen(false)} />
          </>
        )}
      </div>
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => canvasReady && setCaptureMenuOpen((o) => !o)}
          disabled={!canvasReady}
          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-black/90 border-2 border-[#B7FF7A] text-[#B7FF7A] text-[11px] font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Take photo (3D view only)"
          title={canvasReady ? t('layout.captureReady') : t('layout.captureNotReady')}
        >
          <Camera className="h-4 w-4" />
        </button>
        {captureMenuOpen && (
          <>
            <div className="absolute bottom-[calc(100%+4px)] left-[-165px] mb-[-4px] py-[3px] rounded-lg bg-black/95 border border-[#B7FF7A]/50 min-w-[180px] z-[16] max-h-[240px] overflow-y-auto">
              <button
                type="button"
                onClick={() => handleTakePhoto(null)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
              >
                {t('layout.originalPng')}
              </button>
              {SOCIAL_CAPTURE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleTakePhoto(p)}
                  className="w-full flex flex-col items-start gap-0.5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                >
                  <span>{locale === 'zh' ? p.label : p.labelEn}</span>
                  <span className="text-[10px] text-white/50">{p.width}×{p.height}</span>
                </button>
              ))}
            </div>
            <div className="fixed inset-0 z-10" aria-hidden onClick={() => setCaptureMenuOpen(false)} />
          </>
        )}
      </div>
    </div>
  );
});
ChatPanelFooterButtons.displayName = 'ChatPanelFooterButtons';

// 右上 Profile 右边缘与 right-8 对齐（32px），Chat 最右边与 Profile 最右边对齐
const CHAT_RIGHT_EDGE = 32; // right-8 = 32px
const CHAT_HIDE_IDLE_MS = 5000;
/** 视口右边缘热区宽度（px），鼠标进入此区域时弹出 */
const CHAT_HOT_ZONE_PX = 40;

// 4.6 右侧弹幕 Chat 面板：靠近视口右边缘弹出，长时间无操作隐藏，未展开时左边缘与 Profile 左边缘竖直对齐
export const StreamRoomChatPanel = memo(() => {
  const { chatMessages, sendDanmaku } = useEchuuWebSocket();
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState('');
  const [collapsed, setCollapsed] = useState(true);
  const [visible, setVisible] = useState(false);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recentMessages = useMemo(() => chatMessages.slice(-20), [chatMessages]);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const startHideTimer = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => setVisible(false), CHAT_HIDE_IDLE_MS);
  }, [clearHideTimer]);

  // 基于视口坐标：鼠标靠近视口最右边时弹出
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return;
      const nearRight = e.clientX >= window.innerWidth - CHAT_HOT_ZONE_PX;
      if (nearRight) {
        setVisible(true);
        clearHideTimer();
      }
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [clearHideTimer]);

  useEffect(() => {
    return () => clearHideTimer();
  }, [clearHideTimer]);

  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [recentMessages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    sendDanmaku(text);
    setInputValue('');
  };

  return (
    <div
      className={cn(
        'fixed top-28 z-40 flex flex-col gap-3 transition-all duration-300 ease-out',
        visible ? 'opacity-100 pointer-events-auto translate-x-0' : 'opacity-0 pointer-events-none translate-x-2'
      )}
      style={{ right: `${CHAT_RIGHT_EDGE}px` }}
      onMouseEnter={clearHideTimer}
      onMouseLeave={startHideTimer}
      onClick={clearHideTimer}
    >
      <div
        className={cn(
          'relative h-[520px] transition-all duration-300 ease-out',
          collapsed ? 'w-[50px]' : 'w-[340px]'
        )}
      >
      <div className="absolute inset-0 rounded-[28px] bg-theme-gradient" />
      <button
        type="button"
        onClick={() => setCollapsed((prev) => !prev)}
        className="absolute right-2 top-2 left-[9px] z-10 h-8 w-8 rounded-full bg-black/90 text-[#B7FF7A] text-xs font-black"
        aria-label={collapsed ? t('layout.expandChat') : t('layout.collapseChat')}
      >
        {collapsed ? '<<' : '>>'}
      </button>

        {collapsed ? (
          <div className="absolute inset-0 flex items-center justify-center text-[#636363] font-black text-[14px] tracking-tight rotate-90">
            CHAT
          </div>
        ) : (
          <>
            <div className="absolute left-5 top-5 text-[#636363] font-black text-[18px] tracking-tight">
              CHAT PANEL
            </div>
            <div className="absolute left-5 top-14 right-5 bottom-20 rounded-[22px] border-[3px] border-[#B7FF7A] bg-white/40 p-3">
              <div ref={messageRef} className="h-full overflow-y-auto pr-2 text-[12px] text-[#636363]">
                {recentMessages.map((msg, index) => (
                  <div key={`${msg.user}-${msg.timestamp}-${index}`} className="mb-2">
                    <span className={msg.isAI ? 'text-[#636363] font-bold' : 'text-[#636363] font-semibold'}>
                      {msg.user}：
                    </span>
                    <span className="ml-1">{msg.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-5 right-5 bottom-5 h-11 rounded-full bg-black/90 border-[3px] border-[#B7FF7A] flex items-center px-3">
              <input
                className="flex-1 bg-transparent text-white text-[11px] outline-none"
                placeholder="Chat with your streamer..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSend}
                className="ml-2 h-7 w-10 rounded-full bg-[#DBDBDB] border-2 border-[#B7FF7A]"
              />
            </div>
          </>
        )}
      </div>
      {/* 语言切换 + 直播拍照：放在 chat 面板下方一竖列 */}
      <div className={cn('flex flex-col gap-2 transition-all duration-300 ease-out', collapsed ? 'w-[50px]' : 'w-[340px]')}>
        <ChatPanelFooterButtons />
      </div>
    </div>
  );
});

StreamRoomChatPanel.displayName = 'StreamRoomChatPanel';
