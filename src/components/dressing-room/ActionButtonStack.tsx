"use client";

import React, { memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Settings, Users, CheckCircle, Camera, Languages, Layout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/hooks/use-i18n';

// 1. Top Left Branding（与右侧胶囊按钮上下平齐）
export const BrandOverlay = memo(() => {
  return (
    <div className="fixed top-8 left-8 z-50 flex items-center space-x-2 pointer-events-auto group">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transform group-hover:rotate-6 transition-transform duration-300 bg-transparent">
        <img src="/favicon.svg" alt="Echuu" className="w-full h-full object-contain" />
      </div>
      <h1 className="font-pixel text-[14px] font-extrabold tracking-tight text-[#90E1FE] leading-none">
        AI Vtuber
      </h1>
    </div>
  );
});

BrandOverlay.displayName = 'BrandOverlay';

// 3. Bottom Left Info Panels（已隐藏：使用说明 + 当前状态）
export const InfoPanels = memo(({
  modelName,
  animationName,
  showBones
}: {
  modelName: string,
  animationName: string,
  showBones: boolean
}) => {
  return null;
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
  const { t } = useI18n();
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
    <div className="fixed bottom-8 left-8 z-50 flex flex-col items-center space-y-5 pointer-events-auto">
      {/* Model Manager */}
      <button
        onClick={onOpenModelManager}
        title={t('layout.modelManagement')}
        className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white  hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Users className="h-6 w-6" />
      </button>

      {/* Camera Toggle */}
      <button
        onClick={onCameraToggle}
        title={isCameraActive ? t('layout.stopCamera') : t('layout.startCamera')}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95",
          isCameraActive
            ? "bg-rose-500 text-white"
            : "bg-blue-600 text-white"
        )}
      >
        <Camera className={cn("h-6 w-6", isCameraActive && "animate-pulse")} />
      </button>

      {/* Bones Toggle */}
      <button
        onClick={onToggleBones}
        title={isBonesVisible ? t('layout.hideBones') : t('layout.showBones')}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95",
          isBonesVisible
            ? "bg-slate-800 text-white"
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-400"
        )}
      >
        <CheckCircle className="h-6 w-6" />
      </button>

      {/* Settings Toggle */}
      <button
        onClick={onOpenSettings}
        title={t('layout.settings')}
        className="w-14 h-14 bg-amber-400 rounded-2xl flex items-center justify-center text-white  hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Layout className="h-6 w-6" />
      </button>

      {/* Language Toggle */}
      <button
        onClick={() => router.push(nextLocalePath)}
        title={t('layout.switchLang')}
        className="w-14 h-14 bg-slate-900/80 text-white rounded-2xl flex items-center justify-center border border-white/10 hover:scale-110 active:scale-95 transition-all duration-200"
      >
        <Languages className="h-6 w-6" />
      </button>
    </div>
  );
});

ActionButtonStack.displayName = 'ActionButtonStack';
