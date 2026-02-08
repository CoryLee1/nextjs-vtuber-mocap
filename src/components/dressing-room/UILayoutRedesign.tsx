"use client";

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Settings, 
  Users, 
  Play, 
  CheckCircle,
  HelpCircle,
  Info,
  ChevronRight,
  Monitor,
  Layout,
  Camera,
  Languages
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { ProfileButton } from '@/components/auth/ProfileButton';

// 1. Top Left Branding
export const BrandOverlay = memo(() => {
  return (
    <div className="fixed top-8 left-8 z-50 flex items-center space-x-3 pointer-events-auto group">
      <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-blue-500/20 transform group-hover:rotate-6 transition-transform duration-300">
        EC
      </div>
      <div className="flex flex-col">
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
          Echuu AI Vtubing
        </h1>
      </div>
    </div>
  );
});

BrandOverlay.displayName = 'BrandOverlay';

// 2. Top Right Power Toggle
export const PowerToggle = memo(({ 
  isActive, 
  onToggle: _onToggle
}: { 
  isActive: boolean, 
  onToggle: () => void 
}) => {
  const { onlineCount, connectionState, connect } = useEchuuWebSocket();

  useEffect(() => {
    connect();
  }, [connect]);

  return (
    <div className="fixed top-8 right-8 z-50 pointer-events-auto">
      <div className="flex items-center gap-4">
        {/* Online count bar (replaces old ON/OFF) */}
        <div
          className="flex items-center space-x-3 px-6 py-2.5 rounded-full border-2 transition-all duration-500 shadow-xl bg-white dark:bg-slate-900 border-blue-500 text-blue-500 scale-105"
          title="当前在线人数（来自 Echuu WebSocket）"
        >
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              connectionState === 'connected' ? "bg-blue-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
            )}
          />
          <span className="text-xs font-black uppercase tracking-widest">ONLINE</span>
          <span className="text-xs font-black tabular-nums">{onlineCount}</span>
        </div>

        {/* Profile button (only shows when logged-in) */}
        <ProfileButton />
      </div>
    </div>
  );
});

PowerToggle.displayName = 'PowerToggle';

// 3. Bottom Left Info Panels
export const InfoPanels = memo(({ 
  modelName, 
  animationName, 
  showBones 
}: { 
  modelName: string, 
  animationName: string, 
  showBones: boolean 
}) => {
  const { t } = useI18n();

  return (
    <div className="fixed bottom-8 left-8 z-50 flex flex-col space-y-4 pointer-events-auto w-72">
      {/* Instructions Panel */}
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-white/20 dark:border-slate-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden rounded-[24px] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.16)]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center space-x-2 text-blue-500">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">{t('vtuber.instructions.title')}</h3>
          </div>
          <ul className="space-y-2.5">
            {[
              t('vtuber.instructions.step1'),
              t('vtuber.instructions.step2'),
              t('vtuber.instructions.step3'),
              t('vtuber.instructions.step4')
            ].map((step, i) => (
              <li key={i} className="flex items-start space-x-3 text-[12px] font-medium text-slate-600 dark:text-slate-400 leading-snug">
                <span className="text-blue-500/50 font-black mt-[-1px]">•</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Status Panel */}
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-white/20 dark:border-slate-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden rounded-[24px] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.16)]">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center space-x-2 text-blue-500">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">{t('vtuber.status.title')}</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t('vtuber.status.model')}</span>
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{modelName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t('vtuber.status.animation')}</span>
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{animationName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t('vtuber.status.bones')}</span>
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{showBones ? t('vtuber.status.show') : t('vtuber.status.hide')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

InfoPanels.displayName = 'InfoPanels';

// 4. Bottom Right Action Stack
export const ActionButtonStack = memo(({
  onOpenModelManager,
  onOpenAnimationLibrary,
  onToggleBones,
  onOpenSettings,
  onCameraToggle,
  isBonesVisible,
  isCameraActive
}: {
  onOpenModelManager: () => void,
  onOpenAnimationLibrary: () => void,
  onToggleBones: () => void,
  onOpenSettings: () => void,
  onCameraToggle: () => void,
  isBonesVisible: boolean,
  isCameraActive: boolean
}) => {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const isZh = pathname.startsWith('/zh');
  const isEn = pathname.startsWith('/en');
  const nextLocalePath = isZh
    ? `/en${pathname.slice(3) || ''}`
    : isEn
      ? `/zh${pathname.slice(3) || ''}`
      : `/zh${pathname}`;

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center space-y-5 pointer-events-auto">
      {/* Model Manager */}
      <button 
        onClick={onOpenModelManager}
        title="模型管理"
        className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_24px_rgba(59,130,246,0.3)] hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Users className="h-6 w-6" />
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onCameraToggle}
        title={isCameraActive ? '停止摄像头' : '开启摄像头'}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95",
          isCameraActive
            ? "bg-rose-500 text-white shadow-rose-500/30"
            : "bg-blue-600 text-white shadow-blue-600/30"
        )}
      >
        <Camera className={cn("h-6 w-6", isCameraActive && "animate-pulse")} />
      </button>

      {/* Bones Toggle */}
      <button 
        onClick={onToggleBones}
        title={isBonesVisible ? '隐藏骨骼' : '显示骨骼'}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 hover:scale-110 active:scale-95",
          isBonesVisible 
            ? "bg-slate-800 text-white shadow-slate-800/20" 
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-400"
        )}
      >
        <CheckCircle className="h-6 w-6" />
      </button>

      {/* Settings Toggle */}
      <button 
        onClick={onOpenSettings}
        title="设置"
        className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-[0_8px_24px_rgba(251,191,36,0.3)] hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Layout className="h-6 w-6" />
      </button>

      {/* Language Toggle */}
      <button
        onClick={() => router.push(nextLocalePath)}
        title={isZh ? '切换到 English' : '切换到中文'}
        className="w-14 h-14 bg-slate-900/80 text-white rounded-2xl flex items-center justify-center shadow-xl border border-white/10 hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Languages className="h-6 w-6" />
      </button>
    </div>
  );
});

ActionButtonStack.displayName = 'ActionButtonStack';

// 5. Bottom Center Camera Button
export const GoLiveButton = memo(() => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <Link
        href="/v1/live/1"
        className="w-16 h-16 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-500 transform hover:scale-110 active:scale-90 bg-blue-600 text-white shadow-blue-600/30"
      >
        <Play className="h-7 w-7" />
      </Link>
    </div>
  );
});

GoLiveButton.displayName = 'GoLiveButton';
