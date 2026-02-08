"use client";

import React, { memo, useMemo, useRef, useState } from 'react';
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
import { useSceneStore } from '@/hooks/use-scene-store';
import characterIcon from '@/app/v1/assets/ECHUU V1 UX_img/Gemini_Generated_Image_unppndunppndunpp (1) 1.png';
import liveSettingIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 190.png';
import soundSettingIcon from '@/app/v1/assets/ECHUU V1 UX_img/b2d19cebb7369ec09e51e8da12cd64d2 1.png';
import sceneBaseIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 183.png';
import sceneOverlayIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 179.png';
import sceneRibbonIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 180.png';
import calendarIcon from '@/app/v1/assets/ECHUU V1 UX_img/8035b537838f81a942811ef8fecd8c5b 1.png';
import accentSmall from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 262 (Stroke).svg';
import accentMedium from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 263 (Stroke).svg';
import accentLarge from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 264 (Stroke).svg';

const ECHUU_CONFIG_KEY = 'echuu_config';
const ECHUU_LIVE_SETTINGS_KEY = 'echuu_live_settings';
const ECHUU_SOUND_SETTINGS_KEY = 'echuu_sound_settings';
const ECHUU_SCENE_SETTINGS_KEY = 'echuu_scene_settings';
const ECHUU_CALENDAR_SETTINGS_KEY = 'echuu_calendar_settings';

type StreamRoomPanel = 'character' | 'live' | 'sound' | 'scene' | 'calendar';

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
    <div className="fixed bottom-8 right-8 z-50 flex flex-col space-y-4 pointer-events-auto w-72 group">
      {/* Instructions Panel */}
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-white/20 dark:border-slate-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden rounded-[24px] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.16)] translate-x-24 opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
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
      <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-white/20 dark:border-slate-800/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden rounded-[24px] transition-all duration-300 hover:shadow-[0_8px_40px_rgba(0,0,0,0.16)] translate-x-24 opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
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
    <div className="fixed bottom-8 left-8 z-50 flex flex-col items-center space-y-5 pointer-events-auto">
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

// 4.5 左侧 StreamRoom 控制 + 面板
export const StreamRoomSidebar = memo(({
  onPanelOpenChange
}: {
  onPanelOpenChange?: (isOpen: boolean) => void;
}) => {
  const { echuuConfig, setEchuuConfig } = useSceneStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<StreamRoomPanel>('character');
  const [characterDraft, setCharacterDraft] = useState({
    characterName: echuuConfig.characterName,
    persona: echuuConfig.persona,
    background: echuuConfig.background,
    topic: echuuConfig.topic,
    modelName: echuuConfig.modelName,
    voice: '',
  });
  const [livePlatform, setLivePlatform] = useState('');
  const [liveKey, setLiveKey] = useState('');
  const [bgm, setBgm] = useState('');
  const [voice, setVoice] = useState('');
  const [hdr, setHdr] = useState('');
  const [sceneName, setSceneName] = useState('');
  const [calendarMemo, setCalendarMemo] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedLive = window.localStorage.getItem(ECHUU_LIVE_SETTINGS_KEY);
    const storedSound = window.localStorage.getItem(ECHUU_SOUND_SETTINGS_KEY);
    const storedScene = window.localStorage.getItem(ECHUU_SCENE_SETTINGS_KEY);
    const storedCalendar = window.localStorage.getItem(ECHUU_CALENDAR_SETTINGS_KEY);

    if (storedLive) {
      try {
        const parsed = JSON.parse(storedLive);
        setLivePlatform(parsed.platform || '');
        setLiveKey(parsed.key || '');
      } catch {
        // ignore invalid storage
      }
    }
    if (storedSound) {
      try {
        const parsed = JSON.parse(storedSound);
        setBgm(parsed.bgm || '');
        setVoice(parsed.voice || '');
      } catch {
        // ignore invalid storage
      }
    }
    if (storedScene) {
      try {
        const parsed = JSON.parse(storedScene);
        setHdr(parsed.hdr || '');
        setSceneName(parsed.scene || '');
      } catch {
        // ignore invalid storage
      }
    }
    if (storedCalendar) {
      try {
        const parsed = JSON.parse(storedCalendar);
        setCalendarMemo(parsed.memo || '');
      } catch {
        // ignore invalid storage
      }
    }
  }, []);

  useEffect(() => {
    onPanelOpenChange?.(panelOpen);
  }, [onPanelOpenChange, panelOpen]);

  useEffect(() => {
    if (panelType === 'character' && panelOpen) {
      setCharacterDraft((prev) => ({
        ...prev,
        characterName: echuuConfig.characterName,
        persona: echuuConfig.persona,
        background: echuuConfig.background,
        topic: echuuConfig.topic,
        modelName: echuuConfig.modelName,
      }));
    }
  }, [echuuConfig, panelOpen, panelType]);

  const handleOpenPanel = (type: StreamRoomPanel) => {
    if (panelOpen && panelType === type) {
      setPanelOpen(false);
      return;
    }
    setPanelType(type);
    setPanelOpen(true);
  };

  const handlePanelSave = () => {
    if (typeof window !== 'undefined') {
      if (panelType === 'character') {
        const nextConfig = {
          ...echuuConfig,
          characterName: characterDraft.characterName,
          persona: characterDraft.persona,
          background: characterDraft.background,
          topic: characterDraft.topic,
          modelName: characterDraft.modelName,
        };
        setEchuuConfig(nextConfig);
        window.localStorage.setItem(ECHUU_CONFIG_KEY, JSON.stringify(nextConfig));
      }
      if (panelType === 'live') {
        window.localStorage.setItem(
          ECHUU_LIVE_SETTINGS_KEY,
          JSON.stringify({ platform: livePlatform, key: liveKey })
        );
      }
      if (panelType === 'sound') {
        window.localStorage.setItem(
          ECHUU_SOUND_SETTINGS_KEY,
          JSON.stringify({ bgm, voice })
        );
      }
      if (panelType === 'scene') {
        window.localStorage.setItem(
          ECHUU_SCENE_SETTINGS_KEY,
          JSON.stringify({ hdr, scene: sceneName })
        );
      }
      if (panelType === 'calendar') {
        window.localStorage.setItem(
          ECHUU_CALENDAR_SETTINGS_KEY,
          JSON.stringify({ memo: calendarMemo })
        );
      }
    }
    setPanelOpen(false);
  };

  return (
    <>
      <div 
        className={`fixed left-[93px] top-1/2 -translate-y-1/2 z-40 pointer-events-auto transition-transform duration-300 ease-in-out ${
          panelOpen ? 'translate-x-[480px]' : 'translate-x-0'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-[30px]">
          <button
            type="button"
            onClick={() => handleOpenPanel('character')}
            className={`relative w-[152px] h-[121px] transition-transform ${panelOpen && panelType === 'character' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={characterIcon.src} alt="" className="absolute" style={{ left: '22px', top: '6px', width: '106px', height: '106px' }} />
            <img src={accentSmall.src} alt="" className="absolute" style={{ left: '77px', top: '14px', width: '19px', height: '7px', transform: 'rotate(3.04deg)' }} />
            <img src={accentMedium.src} alt="" className="absolute" style={{ left: '73px', top: '8px', width: '26px', height: '8px', transform: 'rotate(3.04deg)' }} />
            <img src={accentLarge.src} alt="" className="absolute" style={{ left: '65px', top: '0px', width: '37px', height: '11px', transform: 'rotate(3.04deg)' }} />
            <div className="absolute text-[12px] leading-[13px] text-black w-full text-center" style={{ left: '0px', top: '108px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>
              Character Setting
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPanel('live')}
            className={`relative w-[153px] h-[112px] transition-transform ${panelOpen && panelType === 'live' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={liveSettingIcon.src} alt="" className="absolute" style={{ left: '27px', top: '6px', width: '98px', height: '98px' }} />
            <div className="absolute" style={{ left: '46px', top: '34px', width: '52px', height: '42px', background: '#D9D9D9', mixBlendMode: 'multiply', borderRadius: '10px' }} />
            <div className="absolute" style={{ left: '64px', top: '52px', width: '36px', height: '20px' }}>
              <div className="absolute" style={{ left: '0px', top: '5px', width: '7px', height: '7px', background: '#FF5C5C', borderRadius: '2px' }} />
              <div className="absolute text-[12px] leading-[20px] text-[#FF5C5C]" style={{ left: '11px', top: '0px', fontFamily: 'Dubai', fontWeight: 700 }}>LIVE</div>
            </div>
            <div className="absolute text-[14px] leading-[15px] text-black w-full text-center" style={{ left: '0px', top: '96px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>
              Live Setting
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPanel('sound')}
            className={`relative w-[114px] h-[92px] transition-transform ${panelOpen && panelType === 'sound' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={soundSettingIcon.src} alt="" className="absolute" style={{ left: '24px', top: '0px', width: '66px', height: '71px' }} />
            <div className="absolute text-[14px] leading-[15px] text-black w-full text-center" style={{ left: '0px', top: '79px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>
              Sound Setting
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPanel('scene')}
            className={`relative w-[156px] h-[141px] transition-transform ${panelOpen && panelType === 'scene' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={sceneBaseIcon.src} alt="" className="absolute" style={{ left: '12px', top: '54px', width: '131px', height: '81px' }} />
            <img src={sceneOverlayIcon.src} alt="" className="absolute" style={{ left: '14px', top: '8px', width: '127px', height: '127px' }} />
            <img src={sceneRibbonIcon.src} alt="" className="absolute" style={{ left: '58px', top: '42px', width: '59px', height: '59px', transform: 'matrix(0.98, -0.18, 0.18, 0.98, 0, 0)' }} />
            <div className="absolute text-[14px] leading-[15px] text-black w-full text-center" style={{ left: '0px', top: '126px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>
              Scene
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPanel('calendar')}
            className={`relative w-[152px] h-[83px] transition-transform ${panelOpen && panelType === 'calendar' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={calendarIcon.src} alt="" className="absolute" style={{ left: '42px', top: '0px', width: '68px', height: '68px' }} />
            <div className="absolute text-[14px] leading-[15px] text-black w-full text-center" style={{ left: '0px', top: '71px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>
              Calendar Memory
            </div>
          </button>
        </div>
      </div>

      <div
        className={`fixed left-0 top-0 z-30 h-screen transition-transform duration-300 ease-in-out ${panelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
      >
        <div className="w-[560px] h-full bg-[#E7ECF3] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/60 rounded-tr-[20px] rounded-br-[20px] p-10 flex flex-col gap-6 pointer-events-auto overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-slate-500 tracking-widest uppercase">
              {panelType === 'character' && 'Character Setting'}
              {panelType === 'live' && 'Live Setting'}
              {panelType === 'sound' && 'Sound Setting'}
              {panelType === 'scene' && 'Scene'}
              {panelType === 'calendar' && 'Calendar Memory'}
            </div>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-700 transition"
              onClick={() => setPanelOpen(false)}
            >
              ✕
            </button>
          </div>

          {panelType === 'character' && (
            <div className="flex flex-col gap-4">
              <label className="text-[12px] text-slate-500">名称</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.characterName}
                onChange={(event) => setCharacterDraft((prev) => ({ ...prev, characterName: event.target.value }))}
              />
              <label className="text-[12px] text-slate-500">声音</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.voice}
                onChange={(event) => setCharacterDraft((prev) => ({ ...prev, voice: event.target.value }))}
              />
              <label className="text-[12px] text-slate-500">模型</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.modelName}
                onChange={(event) => setCharacterDraft((prev) => ({ ...prev, modelName: event.target.value }))}
              />
              <label className="text-[12px] text-slate-500">背景</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.background}
                onChange={(event) => setCharacterDraft((prev) => ({ ...prev, background: event.target.value }))}
              />
              <label className="text-[12px] text-slate-500">人物设定</label>
              <textarea
                className="h-24 bg-white rounded-lg px-4 py-3 text-slate-800 resize-none"
                value={characterDraft.persona}
                onChange={(event) => setCharacterDraft((prev) => ({ ...prev, persona: event.target.value }))}
              />
              <label className="text-[12px] text-slate-500">直播主题</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.topic}
                onChange={(event) => setCharacterDraft((prev) => ({ ...prev, topic: event.target.value }))}
              />
            </div>
          )}

          {panelType === 'live' && (
            <div className="flex flex-col gap-4">
              <label className="text-[12px] text-slate-500">直播平台</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={livePlatform}
                onChange={(event) => setLivePlatform(event.target.value)}
              />
              <label className="text-[12px] text-slate-500">key</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={liveKey}
                onChange={(event) => setLiveKey(event.target.value)}
              />
            </div>
          )}

          {panelType === 'sound' && (
            <div className="flex flex-col gap-4">
              <label className="text-[12px] text-slate-500">BGM背景音</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={bgm}
                onChange={(event) => setBgm(event.target.value)}
              />
              <label className="text-[12px] text-slate-500">人声音</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={voice}
                onChange={(event) => setVoice(event.target.value)}
              />
            </div>
          )}

          {panelType === 'scene' && (
            <div className="flex flex-col gap-4">
              <label className="text-[12px] text-slate-500">HDR</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={hdr}
                onChange={(event) => setHdr(event.target.value)}
              />
              <label className="text-[12px] text-slate-500">3D Scene</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={sceneName}
                onChange={(event) => setSceneName(event.target.value)}
              />
            </div>
          )}

          {panelType === 'calendar' && (
            <div className="flex flex-col gap-4">
              <div className="h-[240px] bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-400 text-sm">
                Calendar
              </div>
              <label className="text-[12px] text-slate-500">回忆内容</label>
              <textarea
                className="h-32 bg-white rounded-lg px-4 py-3 text-slate-800 resize-none"
                value={calendarMemo}
                onChange={(event) => setCalendarMemo(event.target.value)}
              />
            </div>
          )}

          <button
            type="button"
            onClick={handlePanelSave}
            className="mt-auto h-12 bg-black text-white rounded-lg text-sm tracking-widest"
          >
            确认
          </button>
        </div>
      </div>
    </>
  );
});

StreamRoomSidebar.displayName = 'StreamRoomSidebar';

// 4.6 右侧弹幕 Chat 面板
export const StreamRoomChatPanel = memo(() => {
  const { chatMessages, sendDanmaku } = useEchuuWebSocket();
  const [inputValue, setInputValue] = useState('');
  const [collapsed, setCollapsed] = useState(true);
  const messageRef = useRef<HTMLDivElement | null>(null);
  const recentMessages = useMemo(() => chatMessages.slice(-20), [chatMessages]);

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
    <div className="fixed right-8 top-28 z-40 pointer-events-auto">
      <div
        className={`relative h-[520px] transition-all duration-300 ${
          collapsed ? 'w-[56px]' : 'w-[340px]'
        }`}
      >
        <div className="absolute inset-0 rounded-[28px] bg-[#EEFF00] shadow-[0_20px_60px_rgba(0,0,0,0.3)]" />

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-black/90 text-[#EEFF00] text-xs font-black"
          aria-label={collapsed ? '展开聊天' : '收起聊天'}
        >
          {collapsed ? '<<' : '>>'}
        </button>

        {collapsed ? (
          <div className="absolute inset-0 flex items-center justify-center text-black font-black text-[14px] tracking-tight rotate-90">
            CHAT
          </div>
        ) : (
          <>
            <div className="absolute left-5 top-5 text-black font-black text-[18px] tracking-tight">
              CHAT PANEL
            </div>
            <div className="absolute left-5 top-14 right-5 bottom-20 rounded-[22px] border-[3px] border-[#EEFF00] bg-white/40 p-3">
              <div ref={messageRef} className="h-full overflow-y-auto pr-2 text-[12px] text-black">
                {recentMessages.map((msg, index) => (
                  <div key={`${msg.user}-${msg.timestamp}-${index}`} className="mb-2">
                    <span className={msg.isAI ? 'text-black font-bold' : 'text-slate-800 font-semibold'}>
                      {msg.user}：
                    </span>
                    <span className="ml-1">{msg.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute left-5 right-5 bottom-5 h-11 rounded-full bg-black/90 border-[3px] border-[#EEFF00] flex items-center px-3">
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
                className="ml-2 h-7 w-10 rounded-full bg-[#DBDBDB] border-2 border-[#EEFF00]"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
});

StreamRoomChatPanel.displayName = 'StreamRoomChatPanel';

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
