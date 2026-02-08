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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/hooks/use-i18n';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { ProfileButton } from '@/components/auth/ProfileButton';
import { useSceneStore } from '@/hooks/use-scene-store';
import { toast } from '@/hooks/use-toast';
import characterIcon from '@/app/v1/assets/ECHUU V1 UX_img/Gemini_Generated_Image_unppndunppndunpp (1) 1.png';
import liveSettingIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 190.png';
import soundSettingIcon from '@/app/v1/assets/ECHUU V1 UX_img/b2d19cebb7369ec09e51e8da12cd64d2 1.png';
import sceneBaseIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 183.png';
import sceneOverlayIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 179.png';
import sceneRibbonIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 180.png';
import calendarIcon from '@/app/v1/assets/ECHUU V1 UX_img/8035b537838f81a942811ef8fecd8c5b 1.png';
import accentSmall from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 262 (Stroke).svg';
import type { VRMModel } from '@/types';
import { getModels } from '@/lib/resource-manager';
import { s3Uploader } from '@/lib/s3-uploader';

// 通义千问 TTS 系统音色：value 与后端 voice 参数一致；补充支持语言、性别、特色便于选择
const TTS_VOICES: {
  value: string;
  labelZh: string;
  labelEn: string;
  gender: 'male' | 'female';
  languages: string;   // 支持语种简述，如 "中/英/日"
  traitZh: string;
  traitEn: string;
}[] = [
  { value: 'Cherry', labelZh: '芊悦', labelEn: 'Cherry', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '阳光积极、亲切自然', traitEn: 'Warm, natural, upbeat' },
  { value: 'Serena', labelZh: '苏瑶', labelEn: 'Serena', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '温柔小姐姐', traitEn: 'Gentle, soft' },
  { value: 'Ethan', labelZh: '晨煦', labelEn: 'Ethan', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '阳光温暖、活力朝气', traitEn: 'Warm, energetic' },
  { value: 'Chelsie', labelZh: '千雪', labelEn: 'Chelsie', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '二次元虚拟女友', traitEn: 'Anime-style, sweet' },
  { value: 'Momo', labelZh: '茉兔', labelEn: 'Momo', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '撒娇搞怪、逗你开心', traitEn: 'Playful, cute' },
  { value: 'Vivian', labelZh: '十三', labelEn: 'Vivian', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '拽拽的、可爱小暴躁', traitEn: 'Sassy, cute' },
  { value: 'Moon', labelZh: '月白', labelEn: 'Moon', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '率性帅气', traitEn: 'Cool, casual' },
  { value: 'Maia', labelZh: '四月', labelEn: 'Maia', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '知性与温柔', traitEn: 'Refined, gentle' },
  { value: 'Kai', labelZh: '凯', labelEn: 'Kai', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '耳朵的一场 SPA', traitEn: 'Relaxing, smooth' },
  { value: 'Jennifer', labelZh: '詹妮弗', labelEn: 'Jennifer', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '品牌级、电影质感美语女声', traitEn: 'Premium US English, cinematic' },
  { value: 'Ryan', labelZh: '甜茶', labelEn: 'Ryan', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '节奏拉满、戏感炸裂', traitEn: 'Dynamic, expressive' },
  { value: 'Bella', labelZh: '萌宝', labelEn: 'Bella', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '小萝莉', traitEn: 'Young, cute' },
  { value: 'Neil', labelZh: '阿闻', labelEn: 'Neil', gender: 'male', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '专业新闻主持人', traitEn: 'Professional news anchor' },
  { value: 'Nini', labelZh: '邻家妹妹', labelEn: 'Nini', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '又软又黏、甜', traitEn: 'Sweet, soft' },
  { value: 'Sohee', labelZh: '素熙', labelEn: 'Sohee', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '温柔开朗韩国欧尼', traitEn: 'Warm Korean style' },
  { value: 'Ono Anna', labelZh: '小野杏', labelEn: 'Ono Anna', gender: 'female', languages: '中/英/日/韩/法/德/俄/西/意/葡', traitZh: '鬼灵精怪青梅竹马', traitEn: 'Playful, anime style' },
];
import accentMedium from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 263 (Stroke).svg';
import accentLarge from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 264 (Stroke).svg';

const ECHUU_CONFIG_KEY = 'echuu_config';
const ECHUU_LIVE_SETTINGS_KEY = 'echuu_live_settings';
const ECHUU_SOUND_SETTINGS_KEY = 'echuu_sound_settings';
const ECHUU_SCENE_SETTINGS_KEY = 'echuu_scene_settings';
const ECHUU_CALENDAR_SETTINGS_KEY = 'echuu_calendar_settings';

// BGM 预设：4 首转为 MP3 后命名为 xxx-Cynthia-xmyri.mp3，放在 public/sounds/bgm/
const BGM_PRESETS: { id: string; url: string; nameZh: string; nameEn: string }[] = [
  { id: 'cold-background', url: '/sounds/bgm/cold-background-Cynthia-xmyri.mp3', nameZh: 'Cold Background', nameEn: 'Cold Background' },
  { id: 'deep-sleep-wip', url: '/sounds/bgm/deep-sleep-wip-Cynthia-xmyri.mp3', nameZh: 'Deep Sleep WIP', nameEn: 'Deep Sleep WIP' },
  { id: 'reboot-background-wip', url: '/sounds/bgm/reboot-background-wip-Cynthia-xmyri.mp3', nameZh: 'Reboot Background WIP', nameEn: 'Reboot Background WIP' },
  { id: 'absent-wip', url: '/sounds/bgm/absent-wip-Cynthia-xmyri.mp3', nameZh: 'Absent WIP', nameEn: 'Absent WIP' },
];

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
  const { echuuConfig, setEchuuConfig, setVRMModelUrl, setBgmUrl, setBgmVolume: setStoreBgmVolume } = useSceneStore();
  const { t, locale } = useI18n();
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<StreamRoomPanel>('character');
  const [characterDraft, setCharacterDraft] = useState({
    characterName: echuuConfig.characterName,
    voice: echuuConfig.voice || 'Cherry',
    modelUrl: echuuConfig.modelUrl || '',
    modelName: echuuConfig.modelName || '',
    persona: echuuConfig.persona,
    background: echuuConfig.background,
    topic: echuuConfig.topic,
  });
  const [vrmModels, setVrmModels] = useState<VRMModel[]>([]);
  const [uploadingVrm, setUploadingVrm] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [livePlatform, setLivePlatform] = useState('');
  const [liveKey, setLiveKey] = useState('');
  const [bgm, setBgm] = useState('');
  const [bgmVolume, setBgmVolume] = useState(80);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [soundVoice, setSoundVoice] = useState('');
  const [uploadingBgm, setUploadingBgm] = useState(false);
  const bgmInputRef = useRef<HTMLInputElement>(null);
  const [hdr, setHdr] = useState('');
  const [sceneName, setSceneName] = useState('');
  const [calendarMemo, setCalendarMemo] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedConfig = window.localStorage.getItem(ECHUU_CONFIG_KEY);
    const storedLive = window.localStorage.getItem(ECHUU_LIVE_SETTINGS_KEY);
    const storedSound = window.localStorage.getItem(ECHUU_SOUND_SETTINGS_KEY);
    const storedScene = window.localStorage.getItem(ECHUU_SCENE_SETTINGS_KEY);
    const storedCalendar = window.localStorage.getItem(ECHUU_CALENDAR_SETTINGS_KEY);

    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        setEchuuConfig(parsed);
        if (parsed.modelUrl) setVRMModelUrl(parsed.modelUrl);
      } catch {
        // ignore invalid storage
      }
    }
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
        setSoundVoice(parsed.voice || '');
        if (typeof parsed.bgmVolume === 'number') {
          setBgmVolume(parsed.bgmVolume);
          setStoreBgmVolume(parsed.bgmVolume);
        }
        if (typeof parsed.voiceVolume === 'number') setVoiceVolume(parsed.voiceVolume);
        if (parsed.bgm) setBgmUrl(parsed.bgm);
        else setBgmUrl(null);
        if (typeof parsed.bgmVolume === 'number') setStoreBgmVolume(parsed.bgmVolume);
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
  }, [setEchuuConfig, setVRMModelUrl]);

  useEffect(() => {
    onPanelOpenChange?.(panelOpen);
  }, [onPanelOpenChange, panelOpen]);

  useEffect(() => {
    if (panelType === 'character' && panelOpen) {
      setCharacterDraft((prev) => ({
        ...prev,
        characterName: echuuConfig.characterName,
        voice: echuuConfig.voice || 'Cherry',
        modelUrl: echuuConfig.modelUrl || '',
        modelName: echuuConfig.modelName || '',
        persona: echuuConfig.persona,
        background: echuuConfig.background,
        topic: echuuConfig.topic,
      }));
    }
  }, [echuuConfig, panelOpen, panelType]);

  // 与 ModelManager 一致：合并本地预设（resource-manager）+ S3 列表
  useEffect(() => {
    if (panelType !== 'character' || !panelOpen) return;
    const load = async () => {
      try {
        const local = await getModels(undefined);
        const localModels: VRMModel[] = Array.isArray(local) ? local.map((m: any) => ({
          id: m.id || m.name,
          name: m.name,
          url: m.url,
          category: m.category || 'vrm',
          thumbnail: m.thumbnail,
          tags: m.tags,
          description: m.description,
        })) : [];
        const res = await fetch('/api/s3/resources?type=models');
        const body = await res.json().catch(() => ({}));
        const s3List: VRMModel[] = body.success && body.data ? body.data : [];
        const seen = new Set(localModels.map((m) => m.url));
        s3List.forEach((m) => {
          if (!seen.has(m.url)) {
            localModels.push(m);
            seen.add(m.url);
          }
        });
        setVrmModels(localModels);
      } catch {
        setVrmModels([]);
      }
    };
    load();
  }, [panelType, panelOpen]);

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
          voice: characterDraft.voice || 'Cherry',
          modelUrl: characterDraft.modelUrl || echuuConfig.modelUrl,
          modelName: characterDraft.modelName || echuuConfig.modelName,
          persona: characterDraft.persona,
          background: characterDraft.background,
          topic: characterDraft.topic,
        };
        setEchuuConfig(nextConfig);
        window.localStorage.setItem(ECHUU_CONFIG_KEY, JSON.stringify(nextConfig));
        if (nextConfig.modelUrl) setVRMModelUrl(nextConfig.modelUrl);
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
          JSON.stringify({ bgm, voice: soundVoice, bgmVolume, voiceVolume })
        );
        setBgmUrl(bgm || null);
        setStoreBgmVolume(bgmVolume);
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

  const handleBgmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const errors = s3Uploader.validateBGMFile(file);
    if (errors.length > 0) {
      toast({ title: locale === 'zh' ? '上传失败' : 'Upload failed', description: errors.join(' '), variant: 'destructive' });
      return;
    }
    setUploadingBgm(true);
    try {
      const result = await s3Uploader.uploadFile(file);
      setBgm(result.url);
      setBgmUrl(result.url);
      toast({ title: locale === 'zh' ? 'BGM 已上传并应用' : 'BGM uploaded and applied' });
    } catch (err) {
      toast({ title: locale === 'zh' ? '上传失败' : 'Upload failed', description: String(err), variant: 'destructive' });
    } finally {
      setUploadingBgm(false);
    }
  };

  const handleVrmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const errors = s3Uploader.validateVRMFile(file);
    if (errors.length > 0) {
      toast({ title: locale === 'zh' ? '上传失败' : 'Upload failed', description: errors.join(' '), variant: 'destructive' });
      return;
    }
    setUploadingVrm(true);
    try {
      const result = await s3Uploader.uploadFile(file);
      const name = file.name.replace(/\.vrm$/i, '');
      const newModel: VRMModel = { id: `upload-${Date.now()}`, name, url: result.url };
      setVrmModels((prev) => [newModel, ...prev]);
      setCharacterDraft((prev) => ({ ...prev, modelUrl: result.url, modelName: name }));
      const nextConfig = { ...echuuConfig, modelUrl: result.url, modelName: name };
      setEchuuConfig(nextConfig);
      setVRMModelUrl(result.url);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ECHUU_CONFIG_KEY, JSON.stringify(nextConfig));
      }
      toast({ title: locale === 'zh' ? '模型已上传并应用' : 'Model uploaded and applied' });
    } catch (err) {
      toast({ title: locale === 'zh' ? '上传失败' : 'Upload failed', description: String(err), variant: 'destructive' });
    } finally {
      setUploadingVrm(false);
    }
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
        <div className="w-[560px] h-full bg-[#E7ECF3] border border-white/60 p-10 flex flex-col gap-6 pointer-events-auto overflow-y-auto">
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
              <label className="text-[12px] text-slate-500">{t('vtuber.character.name')}</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.characterName}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, characterName: e.target.value }))}
              />
              <label className="text-[12px] text-slate-500">{t('vtuber.character.voice')}</label>
              <Select
                value={characterDraft.voice || 'Cherry'}
                onValueChange={(v) => setCharacterDraft((prev) => ({ ...prev, voice: v }))}
              >
                <SelectTrigger className="h-12 bg-white rounded-lg px-4 text-slate-800">
                  <SelectValue placeholder={t('vtuber.character.voicePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {TTS_VOICES.map((v) => {
                    const genderTag = v.gender === 'female' ? (locale === 'zh' ? '女' : 'F') : (locale === 'zh' ? '男' : 'M');
                    const name = locale === 'zh' ? v.labelZh : v.labelEn;
                    const trait = locale === 'zh' ? v.traitZh : v.traitEn;
                    const langShort = locale === 'zh' ? '中/英/日等' : 'EN/ZH/JP etc.';
                    return (
                      <SelectItem key={v.value} value={v.value}>
                        <span className="block truncate" title={`${locale === 'zh' ? '支持语种' : 'Languages'}: ${v.languages} · ${trait}`}>
                          {name} ({genderTag}) {langShort} · {trait}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <label className="text-[12px] text-slate-500">{t('vtuber.character.model')}</label>
              <Select
                value={characterDraft.modelUrl || ''}
                onValueChange={(url) => {
                  const m = vrmModels.find((x) => x.url === url);
                  setCharacterDraft((prev) => ({
                    ...prev,
                    modelUrl: url,
                    modelName: m ? m.name : prev.modelName,
                  }));
                }}
              >
                <SelectTrigger className="h-12 bg-white rounded-lg px-4 text-slate-800">
                  <SelectValue placeholder={t('vtuber.character.modelPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {[
                    ...(characterDraft.modelUrl && !vrmModels.some((m) => m.url === characterDraft.modelUrl)
                      ? [{ id: 'current', name: characterDraft.modelName || 'Current', url: characterDraft.modelUrl }]
                      : []),
                    ...vrmModels,
                  ].map((m) => (
                    <SelectItem key={m.id} value={m.url}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                ref={uploadInputRef}
                type="file"
                accept=".vrm"
                className="hidden"
                onChange={handleVrmUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={uploadingVrm}
                onClick={() => uploadInputRef.current?.click()}
              >
                {uploadingVrm ? (locale === 'zh' ? '上传中…' : 'Uploading…') : (locale === 'zh' ? '上传 .vrm 模型' : 'Upload .vrm model')}
              </Button>
              <label className="text-[12px] text-slate-500">{t('vtuber.character.background')}</label>
              <p className="text-[11px] text-slate-400 -mt-1">{t('vtuber.character.backgroundHint')}</p>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.background}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, background: e.target.value }))}
              />
              <label className="text-[12px] text-slate-500">{t('vtuber.character.persona')}</label>
              <textarea
                className="h-24 bg-white rounded-lg px-4 py-3 text-slate-800 resize-none"
                value={characterDraft.persona}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, persona: e.target.value }))}
              />
              <label className="text-[12px] text-slate-500">{t('vtuber.character.topic')}</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.topic}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, topic: e.target.value }))}
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
              <label className="text-[12px] text-slate-500">{t('vtuber.sound.bgm')}</label>
              <Select value={bgm || '__none__'} onValueChange={(v) => setBgm(v === '__none__' ? '' : v)}>
                <SelectTrigger className="h-12 bg-white rounded-lg px-4 text-slate-800">
                  <SelectValue placeholder={t('vtuber.sound.bgmPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('vtuber.sound.none')}</SelectItem>
                  {BGM_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.url}>
                      {locale === 'zh' ? p.nameZh : p.nameEn}
                    </SelectItem>
                  ))}
                  {bgm && !BGM_PRESETS.some((p) => p.url === bgm) && (
                    <SelectItem value={bgm}>{locale === 'zh' ? '已上传的 BGM' : 'Uploaded BGM'}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <input ref={bgmInputRef} type="file" accept=".mp3" className="hidden" onChange={handleBgmUpload} />
              <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploadingBgm} onClick={() => bgmInputRef.current?.click()}>
                {uploadingBgm ? t('vtuber.sound.uploading') : t('vtuber.sound.uploadBgm')}
              </Button>
              <div className="space-y-1">
                <label className="text-[12px] text-slate-500">{t('vtuber.sound.bgmVolume')}</label>
                <div className="flex items-center gap-2">
                  <Slider min={0} max={100} step={1} value={bgmVolume} onValueChange={setBgmVolume} showValue={false} className="flex-1" />
                  <span className="text-[12px] text-slate-600 w-8">{bgmVolume}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[12px] text-slate-500">{t('vtuber.sound.voiceVolume')}</label>
                <div className="flex items-center gap-2">
                  <Slider min={0} max={100} step={1} value={voiceVolume} onValueChange={setVoiceVolume} showValue={false} className="flex-1" />
                  <span className="text-[12px] text-slate-600 w-8">{voiceVolume}%</span>
                </div>
              </div>
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
            {panelType === 'character' ? t('vtuber.character.confirm') : t('app.confirm')}
          </button>
        </div>
      </div>
    </>
  );
});

StreamRoomSidebar.displayName = 'StreamRoomSidebar';

// 聊天面板底部按钮：语言切换 + 直播拍照（仅截 3D 画布，不含 UI，可编辑）
const ChatPanelFooterButtons = memo(() => {
  const { locale, changeLocale } = useI18n();
  const canvasReady = useSceneStore((s) => s.canvasReady);
  const lastCaptureBlobUrl = useSceneStore((s) => s.lastCaptureBlobUrl);
  const setLastCaptureBlobUrl = useSceneStore((s) => s.setLastCaptureBlobUrl);
  const [langOpen, setLangOpen] = useState(false);

  // 发请求：由 Canvas 内 TakePhotoCapture 在 useFrame 中截帧并写回 lastCaptureBlobUrl
  const handleTakePhoto = () => {
    if (!canvasReady) {
      toast({ title: '无法截图', description: '3D 场景未就绪，请稍后再试', variant: 'destructive' });
      return;
    }
    useSceneStore.getState().setTakePhotoRequest(Date.now());
  };

  // 消费截帧结果：下载 + 新标签页 + toast，然后清空；blob URL 延迟 revoke 以便新标签页加载
  useEffect(() => {
    if (!lastCaptureBlobUrl) return;
    const url = lastCaptureBlobUrl;
    const name = `stream-photo-${Date.now()}.png`;
    setLastCaptureBlobUrl(null);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    const w = window.open(url, '_blank', 'noopener');
    if (w) w.document.title = name;
    toast({ title: '已保存', description: `已下载并在新标签页打开：${name}` });
    if (url.startsWith('blob:')) setTimeout(() => URL.revokeObjectURL(url), 2000);
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
          className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-black/90 border-2 border-[#EEFF00] text-[#EEFF00] text-[11px] font-bold w-full"
          aria-label="语言 / Language"
        >
          <Languages className="h-4 w-4" />
          <span>{locales.find((l) => l.code === locale)?.label ?? locale}</span>
        </button>
        {langOpen && (
          <>
            <div className="absolute bottom-full left-0 mb-1 py-1 rounded-lg bg-black/95 border border-[#EEFF00]/50 min-w-[120px] z-20 shadow-lg">
              {locales.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    changeLocale(l.code);
                    setLangOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${l.code === locale ? 'text-[#EEFF00] font-bold' : 'text-white/90'}`}
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
      <button
        type="button"
        onClick={handleTakePhoto}
        disabled={!canvasReady}
        className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-full bg-black/90 border-2 border-[#EEFF00] text-[#EEFF00] text-[11px] font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Take photo (3D view only)"
        title={canvasReady ? '截取 3D 画面（可编辑）' : '3D 场景就绪后可用'}
      >
        <Camera className="h-4 w-4" />
        <span>Take Photo</span>
      </button>
    </div>
  );
});
ChatPanelFooterButtons.displayName = 'ChatPanelFooterButtons';

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
    <div className="fixed right-8 top-28 z-40 pointer-events-auto flex flex-col gap-3">
      <div
        className={`relative h-[520px] transition-all duration-300 ${
          collapsed ? 'w-[56px]' : 'w-[340px]'
        }`}
      >
        <div className="absolute inset-0 rounded-[28px] bg-[#EEFF00] shadow-[0_20px_60px_rgba(0,0,0,0.3)]" />

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute left-[13px] right-2 top-2 z-10 h-8 w-8 rounded-full bg-black/90 text-[#EEFF00] text-xs font-black"
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
      {/* 语言切换 + 直播拍照：放在 chat 面板下方一竖列 */}
      <div className={`flex flex-col gap-2 transition-all duration-300 ${collapsed ? 'w-[56px]' : 'w-[340px]'}`}>
        <ChatPanelFooterButtons />
      </div>
    </div>
  );
});

StreamRoomChatPanel.displayName = 'StreamRoomChatPanel';

// 5. Go Live bar (Figma: Frame 1261157366) — centered in 3D canvas area
export const GoLiveButton = memo(() => {
  const streamPanelOpen = useSceneStore((state) => state.streamPanelOpen);
  const topic = useSceneStore((state) => state.echuuConfig.topic);

  return (
    <div
      className={cn(
        'fixed bottom-[74px] -translate-x-1/2 z-50 pointer-events-auto transition-[left] duration-300 ease-in-out',
        streamPanelOpen ? 'left-[calc(560px+(100vw-560px)/2)]' : 'left-1/2'
      )}
    >
      {/* Bar: 最小 214×53，随文案宽度自适应 */}
      <div className="relative min-w-[214px] w-max h-[53px] px-4 bg-[#E9E9E9] rounded-[26.5px] flex items-center gap-0">
        {/* go-btn: 40×40 circle, left 5px top 7px — glass + shadow */}
        <Link
          href="/v1/live/1"
          className="absolute left-[5px] top-[7px] w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shrink-0"
          style={{
            background: 'rgba(255, 255, 255, 0.068)',
            boxShadow:
              '-11.15px -10.39px 48px -12px rgba(0, 0, 0, 0.15), inset 2.15px 2px 9.24px rgba(255, 255, 255, 0.126), inset 1.22px 1.13px 4.62px rgba(255, 255, 255, 0.126)',
            backdropFilter: 'blur(7.58px)',
          }}
          aria-label="Go Live"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-sm border border-[#EEFF00] text-[#E9E9E9]">
            <Play className="h-3 w-3" strokeWidth={2} />
          </span>
        </Link>
        {/* Stream Topic — 与侧边栏「直播主题」一致，来自 echuuConfig.topic；左侧留出 59px 与 play 对齐 */}
        <span
          className="pl-[46px] pr-2 text-[15px] leading-[15px] text-black flex items-center max-w-[280px] truncate"
          style={{ fontFamily: "'Subway Ticker', system-ui, sans-serif" }}
          title={topic?.trim() || undefined}
        >
          {topic?.trim() || 'Stream Topic'}
        </span>
      </div>
    </div>
  );
});

GoLiveButton.displayName = 'GoLiveButton';
