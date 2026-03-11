"use client";

import React, { memo, useState, useEffect } from 'react';
import { Eye, Circle, Heart, Mail, Copy, Sparkles as SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as DialogUI from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { toast } from '@/hooks/use-toast';
import { ProfileButton } from '@/components/auth/ProfileButton';

// 2. Top Right Power Toggle
export const PowerToggle = memo(({
  isActive,
  onToggle: _onToggle
}: {
  isActive: boolean,
  onToggle: () => void
}) => {
  const { onlineCount, connectionState, connect, disconnect, roomId } = useEchuuWebSocket();
  const { t, locale } = useI18n();
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [angelCount, setAngelCount] = useState<number | null>(null);
  const [likeCount, setLikeCount] = useState(0);

  // 有 roomId 连直播间，无则连大厅 lobby，以便始终显示 ONLINE（全站在线）；切换目标时先断再连
  useEffect(() => {
    const target = roomId ?? 'lobby';
    disconnect();
    connect(target);
  }, [roomId, connect, disconnect]);

  // VIEWS / ANGELS 同步：首次加载 + 定时轮询，使各端数字一致；ONLINE 由 WebSocket user_count 实时更新
  const syncStats = React.useCallback(() => {
    fetch('/api/view-count')
      .then((res) => (!res.ok ? { count: 0 } : res.json()))
      .then((data) => {
        if (typeof data?.count === 'number') setViewCount(data.count);
        else setViewCount(0);
      })
      .catch(() => setViewCount(0));
    fetch('/api/angel-count')
      .then((res) => (!res.ok ? { count: 0 } : res.json()))
      .then((data) => {
        if (typeof data?.count === 'number') setAngelCount(data.count);
        else setAngelCount(0);
      })
      .catch(() => setAngelCount(0));
  }, []);

  useEffect(() => {
    syncStats();
    const t = setInterval(syncStats, 30_000); // 每 30 秒同步一次
    return () => clearInterval(t);
  }, [syncStats]);

  return (
    <div className="fixed top-8 right-8 z-50 pointer-events-auto">
      <div className="flex items-center gap-4">
        {/* 全站访问 + 在线人数 + 天使数 + 点赞 + 联系：合并为一个胶囊 */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-[#8BFFEA]/40 transition-all duration-500 bg-white text-slate-800 shadow-[inset_0_0_40px_rgba(148,246,255,0.35)]"
          title={t('layout.statsTooltip')}
        >
          <Eye className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden />
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            {t('layout.views')}
          </span>
          <span className="text-xs font-black tabular-nums text-slate-800">
            {viewCount === null ? '—' : viewCount.toLocaleString()}
          </span>
          <span className="w-px h-3.5 bg-slate-300" aria-hidden />
          <Circle
            className={cn(
              "w-2 h-2 shrink-0",
              connectionState === 'connected' ? "fill-[#8BFFEA] text-[#8BFFEA] animate-pulse" : "text-slate-400"
            )}
            aria-hidden
          />
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t('layout.online')}</span>
          <span className="text-xs font-black tabular-nums text-slate-800">{onlineCount}</span>
          <span className="w-px h-3.5 bg-slate-300" aria-hidden />
          <SparklesIcon className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden />
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">{t('layout.angels')}</span>
          <span className="text-xs font-black tabular-nums text-slate-800">
            {angelCount === null ? '—' : angelCount.toLocaleString()}
          </span>
          <span className="w-px h-3.5 bg-slate-300" aria-hidden />
          <button
            onClick={() => setLikeCount((c) => c + 1)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[#636363] hover:bg-[#8BFFEA]/20 hover:scale-105 active:scale-95 transition-all"
            title={t('layout.like')}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-black tabular-nums">{likeCount > 0 ? likeCount : t('layout.like')}</span>
          </button>
          <span className="w-px h-3.5 bg-slate-300" aria-hidden />
          <DialogUI.Dialog>
            <DialogUI.DialogTrigger asChild>
              <button
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[#636363] hover:bg-[#8BFFEA]/20 hover:scale-105 active:scale-95 transition-all"
                title={t('layout.contactUs')}
              >
                <Mail className="w-3.5 h-3.5" />
                <span className="text-xs font-black uppercase tracking-wide">{t('layout.contact')}</span>
              </button>
            </DialogUI.DialogTrigger>
            <DialogUI.DialogContent className="sm:max-w-md">
            <DialogUI.DialogHeader>
              <DialogUI.DialogTitle>{t('layout.contactUs')}</DialogUI.DialogTitle>
              <DialogUI.DialogDescription>
                {t('layout.contactDescription')}
              </DialogUI.DialogDescription>
            </DialogUI.DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                <span className="text-sm font-medium break-all">cory@anngel.live</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText('cory@anngel.live');
                    toast({ title: t('common.copied') });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                <span className="text-sm font-medium break-all">cory958014884@gmail.com</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText('cory958014884@gmail.com');
                    toast({ title: t('common.copied') });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogUI.DialogContent>
        </DialogUI.Dialog>
        </div>

        {/* Profile button (only shows when logged-in) */}
        <ProfileButton />
      </div>
    </div>
  );
});

PowerToggle.displayName = 'PowerToggle';
