"use client";

import React, { memo, useMemo, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Share2, Play, Square, Copy, ExternalLink, QrCode } from 'lucide-react';
import * as DialogUI from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { useSceneStore } from '@/hooks/use-scene-store';
import { toast } from '@/hooks/use-toast';
import { TwitterShare, RedditShare } from 'react-share-lite';
import { QRCodeSVG } from 'qrcode.react';

/** 按句号、问号、感叹号等拆成句子（中英标点 + 换行） */
function splitSentences(text: string): string[] {
  if (!text?.trim()) return [];
  const parts = text.trim().split(/([。！？；.!?;\n]+)/);
  const sentences: string[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const content = (parts[i] || '').trim();
    const delim = parts[i + 1] || '';
    if (content) sentences.push(content + delim);
  }
  if (sentences.length === 0 && text.trim()) return [text.trim()];
  return sentences;
}

/** 约 4 字/秒，无音频时长时的回退 */
const CAPTION_FALLBACK_MS_PER_CHAR = 220;

/** 一句一句展示 + 打字机效果，与当前句音频时长同步 */
const CaptionTypewriter = memo(({ fullText }: { fullText: string }) => {
  const sentences = useMemo(() => splitSentences(fullText), [fullText]);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const echuuSegmentDurationMs = useSceneStore((s) => s.echuuSegmentDurationMs);

  useEffect(() => {
    if (sentences.length === 0) return;
    setSentenceIndex(0);
    setCharIndex(0);
  }, [fullText]);

  const sentence = sentences[sentenceIndex] || '';
  const totalChars = fullText.length || 1;
  const charDelayMs =
    echuuSegmentDurationMs != null && totalChars > 0
      ? Math.max(30, Math.round(echuuSegmentDurationMs / totalChars))
      : CAPTION_FALLBACK_MS_PER_CHAR;

  useEffect(() => {
    if (sentences.length === 0) return;
    if (charIndex >= sentence.length) {
      if (sentenceIndex < sentences.length - 1) {
        const t = setTimeout(() => {
          setSentenceIndex((i) => i + 1);
          setCharIndex(0);
        }, 400);
        return () => clearTimeout(t);
      }
      return;
    }
    const t = setTimeout(() => setCharIndex((c) => c + 1), charDelayMs);
    return () => clearTimeout(t);
  }, [sentences, sentenceIndex, charIndex, charDelayMs, sentence.length]);

  if (sentences.length === 0) return null;
  const visible = sentence.slice(0, charIndex);
  return <span>{visible}</span>;
});
CaptionTypewriter.displayName = 'CaptionTypewriter';

/** 分享直播间：自定义分享卡片（桌面/移动一致），支持 X/Reddit + 微信/小红书/B站二维码与复制 */
const ShareRoomButton = memo(({ roomId }: { roomId: string | null }) => {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const disabled = !roomId;

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const path = pathname || '/zh';
  const shareUrl = roomId
    ? `${base}${path}${path.includes('?') ? '&' : '?'}room_id=${encodeURIComponent(roomId)}`
    : `${base}${path}`;
  const shareTitle = t('layout.shareTitle');
  const shareText = t('layout.shareText');
  const shareCaption = t('layout.shareLiveCaption', { url: shareUrl });
  const iconBtnClass =
    'h-11 w-11 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-[#636363] flex items-center justify-center p-0 overflow-hidden';
  const iconFillClass = 'w-full h-full object-cover';

  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      toast({ title: t('common.linkCopied'), description: shareUrl });
    } catch {
      toast({ title: t('common.copyFailed'), description: shareUrl, variant: 'destructive' });
    }
  };

  const openPostPage = async (platformName: string, url: string) => {
    await copyLink();
    window.open(url, '_blank', 'noopener');
    toast({
      title: t('layout.platformOpened', { platform: platformName }),
      description: t('layout.linkCopiedPaste'),
    });
  };

  const title = disabled ? t('layout.shareNotReady') : t('layout.shareRoom');

  return (
    <>
      <button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          'absolute right-[4px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors',
          disabled ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-[#636363] hover:bg-black/10'
        )}
        title={title}
        aria-label={title}
      >
        <Share2 className="w-4 h-4" />
      </button>

      <DialogUI.Dialog open={open} onOpenChange={setOpen}>
        <DialogUI.DialogContent className="max-w-[760px]">
          <DialogUI.DialogHeader>
            <DialogUI.DialogTitle>{t('layout.shareLiveRoom')}</DialogUI.DialogTitle>
            <DialogUI.DialogDescription>
              {t('layout.shareDescription')}
            </DialogUI.DialogDescription>
          </DialogUI.DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr] gap-4">
            <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-900 space-y-3">
              <div className="text-sm font-semibold">{t('layout.quickDistribution')}</div>
              <div className="rounded-lg border bg-white p-3">
                <div className="text-xs text-slate-500 mb-2">{t('layout.recommendedCaption')}</div>
                <div className="text-xs leading-5 text-slate-700 break-all">{shareCaption}</div>
              </div>
              <div className="text-xs font-medium text-slate-500">{t('layout.globalPlatforms')}</div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col items-center gap-1">
                  <TwitterShare
                    url={shareUrl}
                    title={shareText}
                    round
                    size={44}
                    bgColor="#111827"
                    iconFillColor="#ffffff"
                  />
                  <span className="text-[11px] text-slate-600">X</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RedditShare
                    url={shareUrl}
                    title={shareTitle}
                    round
                    size={44}
                    bgColor="#ff4500"
                    iconFillColor="#ffffff"
                  />
                  <span className="text-[11px] text-slate-600">Reddit</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className={iconBtnClass}
                    onClick={() => openPostPage('Instagram', 'https://www.instagram.com/')}
                    title="Instagram"
                  >
                    <img src="/images/Instagram_logo_2022%20(1).svg" alt="Instagram" className={`${iconFillClass} scale-[1.5]`} />
                  </button>
                  <span className="text-[11px] text-slate-600">Instagram</span>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-500">{t('layout.chinesePlatforms')}</div>
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className={iconBtnClass}
                    onClick={async () => {
                      await copyLink();
                      toast({
                        title: t('layout.wechatTip'),
                        description: t('layout.wechatTipDesc'),
                      });
                    }}
                    title="WeChat"
                  >
                    <img src="/images/wechat-logo-svgrepo-com.svg" alt="WeChat" className={`${iconFillClass} scale-[1.5]`} />
                  </button>
                  <span className="text-[11px] text-slate-600">WeChat</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className={iconBtnClass}
                    onClick={() => openPostPage(t('layout.red'), 'https://www.xiaohongshu.com/')}
                    title={t('layout.red')}
                  >
                    <img src="/images/Xiaohongshu.svg" alt="Xiaohongshu" className={`${iconFillClass} scale-[1.5]`} />
                  </button>
                  <span className="text-[11px] text-slate-600">{t('layout.red')}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    type="button"
                    className={iconBtnClass}
                    onClick={() => openPostPage(t('layout.bilibili'), 'https://www.bilibili.com/')}
                    title={t('layout.bilibili')}
                  >
                    <img src="/images/bilibili.svg" alt="Bilibili" className={`${iconFillClass} scale-[1.75]`} />
                  </button>
                  <span className="text-[11px] text-slate-600">{t('layout.bilibili')}</span>
                </div>
              </div>

              <div className="rounded-lg border bg-white p-3">
                <div className="text-xs text-slate-500 mb-2">{t('layout.liveUrl')}</div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    className="flex-1 h-9 px-2 rounded border text-xs bg-slate-50 text-[#636363]"
                  />
                  <button
                    type="button"
                    className="h-9 px-2 rounded border bg-white hover:bg-slate-50 text-[#636363]"
                    onClick={copyLink}
                    title={t('common.linkCopied')}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <QrCode className="w-4 h-4" />
                {t('layout.qrShare')}
              </div>
              <div className="bg-white p-3 rounded-lg border">
                <QRCodeSVG value={shareUrl} size={180} includeMargin />
              </div>
              <button
                type="button"
                className="h-9 px-3 rounded border bg-white hover:bg-slate-100 text-sm text-[#636363]"
                onClick={copyLink}
              >
                <ExternalLink className="w-4 h-4 inline-block mr-1" />
                {t('layout.copyPost')}
              </button>
            </div>
          </div>
        </DialogUI.DialogContent>
      </DialogUI.Dialog>
    </>
  );
});
ShareRoomButton.displayName = 'ShareRoomButton';

// 5. Go Live bar (Figma: Frame 1261157366) — 仅房主可开播；观众只能看+发弹幕
export const GoLiveButton = memo(() => {
  const streamPanelOpen = useSceneStore((state) => state.streamPanelOpen);
  const echuuConfig = useSceneStore((state) => state.echuuConfig);
  const topic = echuuConfig.topic;
  const { connect, connectionState, currentStep, streamState, infoMessage, roomId, ownerToken, setRoom, lastEventType, lastEventAt } = useEchuuWebSocket();
  const { t, locale } = useI18n();
  const [isStarting, setIsStarting] = useState(false);
  const [phaseOpen, setPhaseOpen] = useState(false);
  const [startError, setStartError] = useState('');
  const [backendStatus, setBackendStatus] = useState<'idle' | 'checking' | 'ok' | 'fail'>('idle');

  const isAudience = Boolean(roomId && !ownerToken);
  const isLive = streamState === 'performing' || streamState === 'generating_script' || streamState === 'initializing';
  const [isStopping, setIsStopping] = useState(false);

  const handleStopLive = async () => {
    if (isStopping || !roomId || !ownerToken) return;
    setIsStopping(true);
    try {
      const { stopLive } = await import('@/lib/echuu-client');
      await stopLive(roomId, ownerToken);
    } catch {
      // Ignore stop errors — stream will end on its own
    } finally {
      setIsStopping(false);
    }
  };

  const handleGoLive = async () => {
    if (isStarting || isAudience) return;
    setIsStarting(true);
    setStartError('');
    try {
      const { createRoom, startLive: doStart } = await import('@/lib/echuu-client');
      let rid = roomId;
      let token = ownerToken;
      if (!rid || !token) {
        const room = await createRoom();
        rid = room.room_id;
        token = room.owner_token;
        setRoom(rid, token);
        connect(rid);
        await new Promise((r) => setTimeout(r, 500));
      } else if (connectionState !== 'connected') {
        connect(rid);
        await new Promise((r) => setTimeout(r, 300));
      }
      const topicAndPersona = (echuuConfig.topic || '') + ' ' + (echuuConfig.persona || '');
      const hasCJK = /[\u4e00-\u9fff\u3040-\u30ff]/.test(topicAndPersona);
      await doStart(
        {
          character_name: echuuConfig.characterName,
          persona: echuuConfig.persona,
          background: echuuConfig.background,
          topic: echuuConfig.topic,
          danmaku: [],
          voice: echuuConfig.voice || 'Cherry',
          language: hasCJK ? undefined : 'en',
        },
        rid!,
        token!
      );
    } catch (err: any) {
      setStartError(err?.message || t('common.startFailed'));
    } finally {
      setIsStarting(false);
    }
  };

  // 字幕由 EchuuLiveAudio 在音频真正开始播放时同步写入 echuuCaptionText
  const captionFullText = useSceneStore((s) => s.echuuCaptionText);

  useEffect(() => {
    if (!phaseOpen) {
      setBackendStatus('idle');
      return;
    }
    setBackendStatus('checking');
    import('@/lib/echuu-client').then(({ checkBackendHealth }) =>
      checkBackendHealth().then((r) => setBackendStatus(r.ok ? 'ok' : 'fail'))
    );
  }, [phaseOpen]);

  return (
    <div
      className={cn(
        'fixed bottom-[74px] -translate-x-1/2 z-50 pointer-events-auto transition-[left] duration-300 ease-in-out flex flex-col items-center',
        streamPanelOpen ? 'left-[calc(560px+(100vw-560px)/2)]' : 'left-1/2'
      )}
    >
      {/* 上方：实时 caption，一句一句播 + 打字机效果 */}
      {captionFullText ? (
        <div className="mb-1.5 px-4 py-2 max-w-[90vw] min-h-[2.5rem] bg-black/70 border border-[#B7FF7A]/40 rounded-lg text-sm text-[#B7FF7A] text-center">
          <CaptionTypewriter fullText={captionFullText} />
        </div>
      ) : null}
      <div className="flex flex-col items-center mb-1.5">
        <button
          type="button"
          onClick={() => setPhaseOpen((o) => !o)}
          className="text-[10px] uppercase tracking-wider text-white/50 hover:text-white/80 transition"
        >
          {phaseOpen ? '隐藏 Phase' : 'Phase'}
        </button>
        {phaseOpen ? (
          <div className="mt-1 px-3 py-2 bg-black/60 rounded text-[10px] text-white/80 space-y-0.5">
            <div><span className="text-white/50">后端</span> {backendStatus === 'checking' ? '检测中…' : backendStatus === 'ok' ? '正常' : backendStatus === 'fail' ? '不可达' : '—'}</div>
            <div><span className="text-white/50">状态</span> {streamState}</div>
            {infoMessage ? <div className="max-w-[200px] truncate" title={infoMessage}>{infoMessage}</div> : null}
            {lastEventType ? <div><span className="text-white/50">最后事件</span> {lastEventType}{lastEventAt ? ` @${new Date(lastEventAt).toLocaleTimeString()}` : ''}</div> : null}
          </div>
        ) : null}
      </div>

      {/* Bar: 最小 214×53，随文案宽度自适应；主题渐变色 #B7FF7A→#8BFFEA→#FFF，流光描边 */}
      <div className="relative p-[2px] rounded-[27px] min-w-[218px] w-max">
        {/* 流光描边：旋转 conic-gradient */}
        <div className="absolute inset-0 rounded-[27px] overflow-hidden pointer-events-none">
          <div
            className="absolute -left-1/2 -top-1/2 w-[200%] h-[200%] animate-border-flow"
            style={{
              background:
                'conic-gradient(from 0deg, transparent 0deg, #B7FF7A 60deg, #8BFFEA 180deg, #FFFFFF 240deg, transparent 300deg)',
            }}
          />
        </div>
        <div className="relative min-w-[214px] w-max h-[53px] px-4 bg-theme-gradient rounded-[26.5px] flex items-center gap-0 outline-none border-0 ring-0">
        <span
          aria-hidden
          className="absolute left-[3px] top-[5px] w-[44px] h-[44px] rounded-full bg-[#B7FF7A]/35 blur-[10px] animate-pulse pointer-events-none"
        />
        {isLive && !isAudience ? (
          // Stop button — shown while stream is active
          <button
            type="button"
            onClick={handleStopLive}
            disabled={isStopping}
            title={t('layout.stopStream')}
            className="absolute left-[5px] top-[7px] z-[1] w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'rgba(255,60,60,0.15)',
              boxShadow:
                '-11.15px -10.39px 48px -12px rgba(0,0,0,0.15), inset 2.15px 2px 9.24px rgba(255,255,255,0.126)',
              backdropFilter: 'blur(7.58px)',
            }}
            aria-label={t('layout.stopStream')}
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-sm border border-red-400 text-red-400">
              <Square className="h-3 w-3" fill="currentColor" strokeWidth={0} />
            </span>
          </button>
        ) : (
          // Go Live button — shown when idle
          <button
            type="button"
            onClick={handleGoLive}
            disabled={isStarting || isAudience}
            title={isAudience ? t('layout.hostOnly') : undefined}
            className="absolute left-[5px] top-[7px] z-[1] w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0 disabled:opacity-60 disabled:cursor-not-allowed border-[3px] border-[#d1d1d1]"
            style={{
              background: 'rgba(220, 246, 254, 0.7)',
              boxShadow:
                '-11.15px -10.39px 48px -12px rgba(0, 0, 0, 0.15), inset 2.15px 2px 9.24px rgba(255, 255, 255, 0.126), inset 1.22px 1.13px 4.62px rgba(255, 255, 255, 0.126)',
              backdropFilter: 'blur(7.58px)',
            }}
            aria-label={isAudience ? t('layout.hostOnly') : t('layout.goLive')}
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-sm text-[#878787]">
              <Play className="h-3 w-3" strokeWidth={2} />
            </span>
          </button>
        )}
        {/* 分享直播间：始终显示，有 roomId 可点击复制/分享链接，无则禁用并提示开播后可用 */}
        <ShareRoomButton roomId={roomId} />
        {/* Stream Topic — 与侧边栏「直播主题」一致 */}
        <span
          className="pl-[46px] pr-[48px] text-[15px] leading-[15px] text-[#636363] flex items-center max-w-[300px] truncate"
          style={{ fontFamily: "'Zen Maru Gothic', system-ui, sans-serif", fontWeight: 500 }}
          title={topic?.trim() || undefined}
        >
          {topic?.trim() || 'Stream Topic'}
        </span>
        </div>
      </div>
      {startError ? (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-[10px] text-red-400">{startError}</div>
      ) : null}
    </div>
  );
});

GoLiveButton.displayName = 'GoLiveButton';
