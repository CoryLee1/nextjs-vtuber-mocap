"use client";

import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { useSceneStore } from '@/hooks/use-scene-store';
import { useRenderingConfigStore } from '@/stores/use-rendering-config-store';
import { useEchuuConfigStore } from '@/stores/use-echuu-config-store';
import { useVideoRecognition } from '@/hooks/use-video-recognition';
import { toast } from '@/hooks/use-toast';
import characterIcon from '@/app/v1/assets/ECHUU V1 UX_img/Gemini_Generated_Image_unppndunppndunpp (1) 1.png';
import liveSettingIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 190.png';
import soundSettingIcon from '@/app/v1/assets/ECHUU V1 UX_img/b2d19cebb7369ec09e51e8da12cd64d2 1.png';
import sceneBaseIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 183.png';
import sceneOverlayIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 179.png';
import sceneRibbonIcon from '@/app/v1/assets/ECHUU V1 UX_img/image 180.png';
import calendarIcon from '@/app/v1/assets/ECHUU V1 UX_img/8035b537838f81a942811ef8fecd8c5b 1.png';
import accentSmall from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 262 (Stroke).svg';
import mocapBtnIcon from '@/app/v1/assets/ECHUU V1 UX_icon/mocap btn.svg';
import type { VRMModel } from '@/types';
import { getModels } from '@/lib/resource-manager';
import { s3Uploader } from '@/lib/s3-uploader';
import { useS3ResourcesStore } from '@/stores/s3-resources-store';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { TTS_VOICES } from '@/config/tts-voices';
import accentMedium from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 263 (Stroke).svg';
import accentLarge from '@/app/v1/assets/ECHUU V1 UX_icon/Vector 264 (Stroke).svg';
import { StreamMemory, StreamRoomPanel, ECHUU_CONFIG_KEY, ECHUU_LIVE_SETTINGS_KEY, ECHUU_SOUND_SETTINGS_KEY, ECHUU_SCENE_SETTINGS_KEY, ECHUU_CALENDAR_SETTINGS_KEY, LIVE_PLATFORMS, BGM_PRESETS } from './ui-layout-types';
import { useRoomIdFromUrl, useSyncRoomIdToUrl } from '@/hooks/use-room-id-url';
export type { StreamMemory };

export { BrandOverlay, InfoPanels, ActionButtonStack } from './ActionButtonStack';
export { PowerToggle } from './PowerToggle';

// 4.5 左侧 StreamRoom 控制 + 面板
export const StreamRoomSidebar = memo(({
  onPanelOpenChange,
  onCameraToggle,
  onOpenAnimationLibrary,
}: {
  onPanelOpenChange?: (isOpen: boolean) => void;
  /** 开启/关闭摄像头动捕（与右上角电源一致，驱动 3D 模型 puppetry） */
  onCameraToggle?: () => void;
  /** 打开动画库弹窗（选择 idle/KAWAII 等动画） */
  onOpenAnimationLibrary?: () => void;
}) => {
  useRoomIdFromUrl();
  useSyncRoomIdToUrl();
  const { roomId } = useEchuuWebSocket();
  const pathname = usePathname() || '/zh';
  // Core scene state
  const { vrmModelUrl, setVRMModelUrl, animationStateMachinePaused, setAnimationStateMachinePaused } = useSceneStore();
  // Echuu live config
  const { echuuConfig, setEchuuConfig, setBgmUrl, setBgmVolume: setStoreBgmVolume } = useEchuuConfigStore();
  // Rendering config
  const { setHdrUrl, setSceneFbxUrl, envBackgroundIntensity, setEnvBackgroundIntensity, envBackgroundRotation, setEnvBackgroundRotation, composerResolutionScale, setComposerResolutionScale, chromaticEnabled, setChromaticEnabled, chromaticOffset, setChromaticOffset, brightness, setBrightness, contrast, setContrast, saturation, setSaturation, hue, setHue, handTrailEnabled, setHandTrailEnabled, theatreCameraActive, setTheatreCameraActive, theatreSequencePlaying, setTheatreSequencePlaying, avatarPositionY, setAvatarPositionY, avatarGizmoEnabled, setAvatarGizmoEnabled, cameraFov, setCameraFov, depthOfFieldEnabled, setDepthOfFieldEnabled, depthOfFieldBokehScale, setDepthOfFieldBokehScale } = useRenderingConfigStore();
  const { t, locale } = useI18n();
  const isCameraActive = useVideoRecognition((s) => s.isCameraActive);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelType, setPanelType] = useState<StreamRoomPanel>('character');
  const [ribbonVisible, setRibbonVisible] = useState(false);
  const sidebarHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const [downloadingVrm, setDownloadingVrm] = useState(false);
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
  const [sceneFbxUrl, setSceneFbxUrlState] = useState('');
  const [uploadingHdr, setUploadingHdr] = useState(false);
  const [uploadingSceneFbx, setUploadingSceneFbx] = useState(false);
  const hdrInputRef = useRef<HTMLInputElement>(null);
  const sceneFbxInputRef = useRef<HTMLInputElement>(null);
  const [calendarMemo, setCalendarMemo] = useState('');
  const [streamMemories, setStreamMemories] = useState<StreamMemory[]>([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [memoryDraft, setMemoryDraft] = useState<{ topic: string; summary: string; participants: string }>({ topic: '', summary: '', participants: '' });

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
        const p = parsed.platform === 'twitch' || parsed.platform === 'youtube' ? parsed.platform : '';
        setLivePlatform(p);
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
        setSceneFbxUrlState(parsed.sceneFbxUrl || '');
        if (parsed.hdr) setHdrUrl(parsed.hdr);
        else setHdrUrl(null);
        if (parsed.sceneFbxUrl) setSceneFbxUrl(parsed.sceneFbxUrl);
        else setSceneFbxUrl(null);
        if (typeof parsed.envBackgroundIntensity === 'number') setEnvBackgroundIntensity(parsed.envBackgroundIntensity);
        if (typeof parsed.envBackgroundRotation === 'number') setEnvBackgroundRotation(parsed.envBackgroundRotation);
        // toneMappingExposure / toneMappingMode removed — handled by ToneMappingSync only
        // Bloom removed — GPU heavy multi-pass effect
        if (typeof parsed.composerResolutionScale === 'number') setComposerResolutionScale(parsed.composerResolutionScale);
        // Vignette removed
        if (typeof parsed.chromaticEnabled === 'boolean') setChromaticEnabled(parsed.chromaticEnabled);
        if (typeof parsed.chromaticOffset === 'number') setChromaticOffset(parsed.chromaticOffset);
        // brightness/contrast/saturation/hue 不再从 scene localStorage 恢复
        // 统一由 Zustand persist (vtuber-scene-storage) 管理，避免双重持久化冲突
        if (typeof parsed.handTrailEnabled === 'boolean') setHandTrailEnabled(parsed.handTrailEnabled);
        if (typeof parsed.avatarPositionY === 'number') setAvatarPositionY(parsed.avatarPositionY);
        if (typeof parsed.avatarGizmoEnabled === 'boolean') setAvatarGizmoEnabled(parsed.avatarGizmoEnabled);
        if (typeof parsed.cameraFov === 'number') setCameraFov(parsed.cameraFov);
        if (typeof parsed.depthOfFieldEnabled === 'boolean') setDepthOfFieldEnabled(parsed.depthOfFieldEnabled);
        if (typeof parsed.depthOfFieldBokehScale === 'number') setDepthOfFieldBokehScale(parsed.depthOfFieldBokehScale);
        // LUT removed — unstable .cube loading + GPU overhead
      } catch {
        // ignore invalid storage
      }
    }
    if (storedCalendar) {
      try {
        const parsed = JSON.parse(storedCalendar);
        setCalendarMemo(parsed.memo || '');
        if (Array.isArray(parsed.streamMemories)) {
          setStreamMemories(parsed.streamMemories);
        }
      } catch {
        // ignore invalid storage
      }
    }
  }, [setEchuuConfig, setVRMModelUrl, setEnvBackgroundIntensity, setEnvBackgroundRotation, setCameraFov, setDepthOfFieldEnabled, setDepthOfFieldBokehScale]);

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

  // 日历选中日期变化时，把该日期的回忆填入草稿
  useEffect(() => {
    if (!selectedCalendarDate) {
      setMemoryDraft({ topic: '', summary: '', participants: '' });
      return;
    }
    const dateStr = selectedCalendarDate.toISOString().slice(0, 10);
    const mem = streamMemories.find((m) => m.date === dateStr);
    setMemoryDraft({
      topic: mem?.topic ?? '',
      summary: mem?.summary ?? '',
      participants: Array.isArray(mem?.participantsRemembered) ? mem.participantsRemembered.join('、') : '',
    });
  }, [selectedCalendarDate, streamMemories]);

  // 与 ModelManager 一致：合并本地预设 + S3 列表（优先用 Loading 预拉缓存）
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
        const store = useS3ResourcesStore.getState();
        let s3List = store.modelsLoaded ? store.s3Models : [];
        if (s3List.length === 0) {
          await store.loadModels();
          s3List = useS3ResourcesStore.getState().s3Models;
        }
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

  const clearSidebarHideTimer = useCallback(() => {
    if (sidebarHideTimerRef.current) {
      clearTimeout(sidebarHideTimerRef.current);
      sidebarHideTimerRef.current = null;
    }
  }, []);

  const startSidebarHideTimer = useCallback(() => {
    clearSidebarHideTimer();
    sidebarHideTimerRef.current = setTimeout(() => setRibbonVisible(false), 5000);
  }, [clearSidebarHideTimer]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return;
      const nearLeft = e.clientX < 40;
      if (nearLeft) {
        setRibbonVisible(true);
        clearSidebarHideTimer();
      }
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, [clearSidebarHideTimer]);

  useEffect(() => {
    return () => clearSidebarHideTimer();
  }, [clearSidebarHideTimer]);

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
          JSON.stringify({ hdr, scene: sceneName, sceneFbxUrl, envBackgroundIntensity, envBackgroundRotation, composerResolutionScale, chromaticEnabled, chromaticOffset, handTrailEnabled, avatarPositionY, avatarGizmoEnabled, cameraFov, depthOfFieldEnabled, depthOfFieldBokehScale })
        );
        setHdrUrl(hdr || null);
        setSceneFbxUrl(sceneFbxUrl || null);
      }
      if (panelType === 'calendar') {
        let nextMemories = streamMemories;
        if (selectedCalendarDate) {
          const dateStr = selectedCalendarDate.toISOString().slice(0, 10);
          const next: StreamMemory = {
            date: dateStr,
            topic: memoryDraft.topic.trim(),
            summary: memoryDraft.summary.trim() || undefined,
            participantsRemembered: memoryDraft.participants
              .split(/[,，、\s]+/)
              .map((s) => s.trim())
              .filter(Boolean),
          };
          const filtered = streamMemories.filter((m) => m.date !== dateStr);
          nextMemories =
            next.topic || next.summary || (next.participantsRemembered?.length ?? 0) > 0
              ? [...filtered, next]
              : filtered;
          setStreamMemories(nextMemories);
        }
        window.localStorage.setItem(
          ECHUU_CALENDAR_SETTINGS_KEY,
          JSON.stringify({ memo: calendarMemo, streamMemories: nextMemories })
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
      toast({ title: t('common.uploadFailed'), description: errors.join(' '), variant: 'destructive' });
      return;
    }
    setUploadingBgm(true);
    try {
      const result = await s3Uploader.uploadFile(file);
      setBgm(result.url);
      setBgmUrl(result.url);
      toast({ title: t('layout.bgmUploaded') });
    } catch (err) {
      toast({ title: t('common.uploadFailed'), description: String(err), variant: 'destructive' });
    } finally {
      setUploadingBgm(false);
    }
  };

  const handleHdrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const errors = s3Uploader.validateHDRFile(file);
    if (errors.length > 0) {
      toast({ title: t('common.uploadFailed'), description: errors.join(' '), variant: 'destructive' });
      return;
    }
    setUploadingHdr(true);
    try {
      const result = await s3Uploader.uploadFile(file, null, { purpose: 'hdr' });
      setHdr(result.url);
      setHdrUrl(result.url);
      toast({ title: t('layout.hdrUploaded') });
    } catch (err) {
      toast({ title: t('common.uploadFailed'), description: String(err), variant: 'destructive' });
    } finally {
      setUploadingHdr(false);
    }
  };

  const handleSceneModelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const errors = s3Uploader.validateSceneModelFile(file);
    if (errors.length > 0) {
      toast({ title: t('common.uploadFailed'), description: errors.join(' '), variant: 'destructive' });
      return;
    }
    setUploadingSceneFbx(true);
    try {
      const result = await s3Uploader.uploadFile(file, null, { purpose: 'scene' });
      setSceneFbxUrlState(result.url);
      setSceneFbxUrl(result.url);
      setSceneName(file.name.replace(/\.(glb|gltf)$/i, ''));
      toast({ title: t('layout.sceneModelUploaded') });
    } catch (err) {
      toast({ title: t('common.uploadFailed'), description: String(err), variant: 'destructive' });
    } finally {
      setUploadingSceneFbx(false);
    }
  };

  const handleVrmUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const errors = s3Uploader.validateVRMFile(file);
    if (errors.length > 0) {
      toast({ title: t('common.uploadFailed'), description: errors.join(' '), variant: 'destructive' });
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
      toast({ title: t('layout.modelUploaded') });
    } catch (err) {
      toast({ title: t('common.uploadFailed'), description: String(err), variant: 'destructive' });
    } finally {
      setUploadingVrm(false);
    }
  };

  const handleDownloadCurrentVrm = async () => {
    const url = vrmModelUrl || characterDraft.modelUrl || '';
    if (!url) {
      toast({ title: t('common.selectOrUploadFirst'), variant: 'destructive' });
      return;
    }
    setDownloadingVrm(true);
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error(res.statusText);
      const blob = await res.blob();
      const name = (url.split('/').pop()?.split('?')[0]) || 'current-model.vrm';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name.endsWith('.vrm') ? name : `${name}.vrm`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast({ title: t('common.downloadStarted') });
    } catch (err) {
      toast({ title: t('common.downloadFailed'), description: String(err), variant: 'destructive' });
    } finally {
      setDownloadingVrm(false);
    }
  };

  const showRibbon = ribbonVisible || panelOpen;

  return (
    <>
      <div
        className={cn(
          'fixed left-[93px] top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ease-out',
          showRibbon ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none -translate-x-2',
          showRibbon && panelOpen && 'translate-x-[480px]',
          showRibbon && !panelOpen && 'translate-x-0'
        )}
        onMouseEnter={clearSidebarHideTimer}
        onMouseLeave={startSidebarHideTimer}
        onClick={clearSidebarHideTimer}
      >
        <div className="flex flex-col items-center justify-center gap-[10px]">
          <button
            type="button"
            onClick={() => handleOpenPanel('character')}
            className={`relative w-[152px] h-[121px] transition-transform ${panelOpen && panelType === 'character' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={characterIcon.src} alt="" className="absolute" style={{ left: '22px', top: '6px', width: '106px', height: '106px' }} />
            <img src={accentSmall.src} alt="" className="absolute" style={{ left: '77px', top: '14px', width: '19px', height: '7px', transform: 'rotate(3.04deg)' }} />
            <img src={accentMedium.src} alt="" className="absolute" style={{ left: '73px', top: '8px', width: '26px', height: '8px', transform: 'rotate(3.04deg)' }} />
            <img src={accentLarge.src} alt="" className="absolute" style={{ left: '65px', top: '0px', width: '37px', height: '11px', transform: 'rotate(3.04deg)' }} />
            <div className="absolute text-[14px] leading-[13px] text-[#636363] w-full text-center" style={{ left: '0px', top: '108px', fontFamily: "'Zen Maru Gothic', system-ui, sans-serif", fontWeight: 500 }}>
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
            <div className="absolute text-[14px] leading-[15px] text-[#636363] w-full text-center" style={{ left: '0px', top: '96px', fontFamily: "'Zen Maru Gothic', system-ui, sans-serif", fontWeight: 500 }}>
              Live Setting
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPanel('sound')}
            className={`relative w-[114px] h-[92px] transition-transform ${panelOpen && panelType === 'sound' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={soundSettingIcon.src} alt="" className="absolute" style={{ left: '24px', top: '0px', width: '66px', height: '71px' }} />
            <div className="absolute text-[14px] leading-[15px] text-[#636363] w-full text-center" style={{ left: '0px', top: '79px', fontFamily: "'Zen Maru Gothic', system-ui, sans-serif", fontWeight: 500 }}>
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
            <div className="absolute text-[14px] leading-[15px] text-[#636363] w-full text-center" style={{ left: '0px', top: '126px', fontFamily: "'Zen Maru Gothic', system-ui, sans-serif", fontWeight: 500 }}>
              Scene
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPanel('calendar')}
            className={`relative w-[152px] h-[83px] transition-transform ${panelOpen && panelType === 'calendar' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={calendarIcon.src} alt="" className="absolute" style={{ left: '42px', top: '0px', width: '68px', height: '68px' }} />
            <div className="absolute text-[14px] leading-[15px] text-[#636363] w-full text-center" style={{ left: '0px', top: '71px', fontFamily: "'Zen Maru Gothic', system-ui, sans-serif", fontWeight: 500 }}>
              Calendar Memory
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenPanel('mocap')}
            className={`relative w-[152px] h-[118px] transition-transform ${panelOpen && panelType === 'mocap' ? 'scale-105' : 'hover:scale-105'}`}
          >
            <img src={mocapBtnIcon.src} alt="" className="absolute left-1/2 top-0 h-[102px] w-[80px] -translate-x-1/2 object-contain" />
            <div className="absolute text-[14px] leading-[15px] text-[#636363] w-full text-center" style={{ left: '0px', top: '105px', fontFamily: "'Zen Maru Gothic', system-ui, sans-serif", fontWeight: 500 }}>
              Webcam Mocap
            </div>
          </button>
        </div>
      </div>

      <div
        className={`fixed left-0 top-0 z-30 h-screen transition-transform duration-300 ease-in-out ${panelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
      >
        <div className="w-[560px] h-full bg-[#E7ECF3] border border-white/60 p-10 flex flex-col gap-6 pointer-events-auto overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="text-[16px] text-slate-500 tracking-widest uppercase">
              {panelType === 'character' && t('layout.characterSetting')}
              {panelType === 'live' && t('layout.liveSetting')}
              {panelType === 'sound' && t('layout.soundSetting')}
              {panelType === 'scene' && t('layout.scenePanel')}
              {panelType === 'calendar' && t('layout.calendarMemory')}
              {panelType === 'mocap' && t('layout.webcamMocap')}
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
              <label className="text-[16px] text-slate-500">{t('vtuber.character.name')}</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.characterName}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, characterName: e.target.value }))}
              />
              <label className="text-[16px] text-slate-500">{t('vtuber.character.voice')}</label>
              <Select
                value={characterDraft.voice || 'Cherry'}
                onValueChange={(v) => setCharacterDraft((prev) => ({ ...prev, voice: v }))}
              >
                <SelectTrigger className="h-12 bg-white rounded-lg px-4 text-slate-800">
                  <SelectValue placeholder={t('vtuber.character.voicePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {TTS_VOICES.map((v) => {
                    const genderTag = v.gender === 'female' ? t('layout.genderFemale') : t('layout.genderMale');
                    const name = locale === 'zh' ? v.labelZh : v.labelEn;
                    const trait = locale === 'zh' ? v.traitZh : v.traitEn;
                    const langShort = t('layout.multiLang');
                    return (
                      <SelectItem key={v.value} value={v.value}>
                        <span className="block truncate" title={`${t('layout.langSupport')}: ${v.languages} · ${trait}`}>
                          {name} ({genderTag}) {langShort} · {trait}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <label className="text-[16px] text-slate-500">{t('vtuber.character.model')}</label>
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
                {uploadingVrm ? t('common.uploading') : t('layout.uploadVrm')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                disabled={downloadingVrm}
                onClick={handleDownloadCurrentVrm}
              >
                {downloadingVrm ? t('layout.downloading') : t('layout.downloadVrm')}
              </Button>
              {onOpenAnimationLibrary && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => { setPanelOpen(false); onOpenAnimationLibrary(); }}
                  >
                    <Film className="h-4 w-4" />
                    {t('layout.animationLibrary')}
                  </Button>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!animationStateMachinePaused}
                      onChange={(e) => setAnimationStateMachinePaused(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    {t('layout.pauseStateMachine')}
                  </label>
                </>
              )}
              <label className="text-[16px] text-slate-500">{t('vtuber.character.background')}</label>
              <p className="text-[11px] text-slate-400 -mt-1">{t('vtuber.character.backgroundHint')}</p>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.background}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, background: e.target.value }))}
              />
              <label className="text-[16px] text-slate-500">{t('vtuber.character.persona')}</label>
              <textarea
                className="h-24 bg-white rounded-lg px-4 py-3 text-slate-800 resize-none"
                value={characterDraft.persona}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, persona: e.target.value }))}
              />
              <label className="text-[16px] text-slate-500">{t('vtuber.character.topic')}</label>
              <input
                className="h-12 bg-white rounded-lg px-4 text-slate-800"
                value={characterDraft.topic}
                onChange={(e) => setCharacterDraft((prev) => ({ ...prev, topic: e.target.value }))}
              />
            </div>
          )}

          {panelType === 'live' && (
            <div className="flex flex-col gap-4">
              <label className="text-[16px] text-slate-500">{t('layout.roomLink')}</label>
              {roomId ? (
                <div className="flex gap-2">
                  <input
                    readOnly
                    className="flex-1 h-10 rounded-lg px-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[12px] truncate"
                    value={typeof window !== 'undefined' ? `${window.location.origin}${pathname}${pathname.includes('?') ? '&' : '?'}room_id=${roomId}` : ''}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      const url = typeof window !== 'undefined' ? `${window.location.origin}${pathname}${pathname.includes('?') ? '&' : '?'}room_id=${roomId}` : '';
                      navigator.clipboard?.writeText(url).then(() => toast({ title: t('common.copied') }));
                    }}
                  >
                    {t('common.copy')}
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">
                  {t('layout.roomLinkHint')}
                </p>
              )}
              <label className="text-[16px] text-slate-500">{t('layout.streamPlatform')}</label>
              <Select
                value={livePlatform || '__none__'}
                onValueChange={(v) => setLivePlatform(v === '__none__' ? '' : (v as 'twitch' | 'youtube'))}
              >
                <SelectTrigger className="h-12 bg-white dark:bg-slate-800 rounded-lg px-4 text-slate-800 dark:text-slate-200">
                  <SelectValue placeholder={t('layout.selectPlatform')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t('layout.selectPrompt')}</SelectItem>
                  {LIVE_PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {locale === 'zh' ? p.labelZh : p.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="text-[16px] text-slate-500">
                {t('layout.streamKey')}
              </label>
              <input
                type="password"
                autoComplete="off"
                className="h-12 bg-white dark:bg-slate-800 rounded-lg px-4 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                placeholder={
                  livePlatform === 'twitch'
                    ? t('layout.twitchKeyPlaceholder')
                    : livePlatform === 'youtube'
                      ? t('layout.youtubeKeyPlaceholder')
                      : t('layout.selectPlatformFirst')
                }
                value={liveKey}
                onChange={(e) => setLiveKey(e.target.value)}
                disabled={!livePlatform}
              />
              {livePlatform && (
                <p className="text-[11px] text-slate-400">
                  {livePlatform === 'twitch' && t('layout.twitchKeyHint')}
                  {livePlatform === 'youtube' && t('layout.youtubeKeyHint')}
                </p>
              )}
            </div>
          )}

          {panelType === 'sound' && (
            <div className="flex flex-col gap-4">
              <label className="text-[16px] text-slate-500">{t('vtuber.sound.bgm')}</label>
              <Select value={bgm || '__none__'} onValueChange={(v) => { const u = v === '__none__' ? '' : v; setBgm(u); setBgmUrl(u || null); }}>
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
                    <SelectItem value={bgm}>{t('layout.uploadedBgm')}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <input ref={bgmInputRef} type="file" accept=".mp3" className="hidden" onChange={handleBgmUpload} />
              <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploadingBgm} onClick={() => bgmInputRef.current?.click()}>
                {uploadingBgm ? t('vtuber.sound.uploading') : t('vtuber.sound.uploadBgm')}
              </Button>
              <div className="space-y-1">
                <label className="text-[16px] text-slate-500">{t('vtuber.sound.bgmVolume')}</label>
                <div className="flex items-center gap-2">
                  <Slider min={0} max={100} step={1} value={bgmVolume} onValueChange={(v) => { setBgmVolume(v); setStoreBgmVolume(v); }} showValue={false} className="flex-1" />
                  <span className="text-[12px] text-slate-600 w-8">{bgmVolume}%</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[16px] text-slate-500">{t('vtuber.sound.voiceVolume')}</label>
                <div className="flex items-center gap-2">
                  <Slider min={0} max={100} step={1} value={voiceVolume} onValueChange={setVoiceVolume} showValue={false} className="flex-1" />
                  <span className="text-[12px] text-slate-600 w-8">{voiceVolume}%</span>
                </div>
              </div>
            </div>
          )}

          {panelType === 'scene' && (
            <div className="flex flex-col gap-4">
              <label className="text-[16px] text-slate-500">{t('vtuber.scene.hdr')}</label>
              <Select value={hdr || '__default__'} onValueChange={(v) => { const u = v === '__default__' ? '' : v; setHdr(u); setHdrUrl(u || null); }}>
                <SelectTrigger className="h-12 bg-white rounded-lg px-4 text-slate-800">
                  <SelectValue placeholder={t('vtuber.scene.hdrPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default__">{t('vtuber.scene.hdrDefault')}</SelectItem>
                  <SelectItem value="/images/sky (3).png">sky (3).png</SelectItem>
                  <SelectItem value="/images/SKY.hdr">SKY.hdr</SelectItem>
                  {hdr && hdr !== '/images/SKY.hdr' && hdr !== '/images/sky (3).png' && (
                    <SelectItem value={hdr}>{t('layout.uploadedEnv')}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {/* 环境/背景预览：默认用 sky (3).png，可选 SKY.hdr，自定义显示占位 */}
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-slate-200 border border-slate-200 shrink-0">
                {(!hdr || hdr === '__default__' || hdr === '/images/sky (3).png') ? (
                  <img src="/images/sky (3).png" alt="Env preview" className="w-full h-full object-cover" />
                ) : hdr === '/images/SKY.hdr' ? (
                  <img src="/images/HDRSky.png" alt="HDR preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-slate-600 text-xs font-medium">
                    {t('layout.customEnv')}
                  </div>
                )}
              </div>
              <input ref={hdrInputRef} type="file" accept=".hdr,.png,.jpg,.jpeg" className="hidden" onChange={handleHdrUpload} />
              <Button type="button" variant="outline" size="sm" className="w-full" disabled={uploadingHdr} onClick={() => hdrInputRef.current?.click()}>
                {uploadingHdr ? t('vtuber.scene.uploading') : t('layout.uploadEnvFile')}
              </Button>
              <label className="text-[16px] text-slate-500">{t('layout.envBrightness')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={0.2}
                  max={2.5}
                  step={0.05}
                  value={envBackgroundIntensity}
                  onValueChange={setEnvBackgroundIntensity}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{envBackgroundIntensity.toFixed(1)}</span>
              </div>
              <label className="text-[16px] text-slate-500">{t('layout.envRotation')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={0}
                  max={360}
                  step={1}
                  value={envBackgroundRotation}
                  onValueChange={setEnvBackgroundRotation}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{Math.round(envBackgroundRotation)}°</span>
              </div>

              {/* 角色位置：主场景高度 + Gizmo 拖拽 */}
              <label className="text-[16px] text-slate-500">{t('layout.avatarHeight')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={-0.5}
                  max={1.5}
                  step={0.05}
                  value={avatarPositionY}
                  onValueChange={setAvatarPositionY}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{avatarPositionY.toFixed(2)}</span>
              </div>
              {/* 相机视野 FOV（度）：越小越像长焦，越大越广角 */}
              <label className="text-[16px] text-slate-500">{t('layout.cameraFov')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={15}
                  max={90}
                  step={1}
                  value={cameraFov}
                  onValueChange={setCameraFov}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{cameraFov}°</span>
              </div>
              {/* 镜头模糊（景深），对焦在角色头部 */}
              <div className="flex items-center justify-between">
                <label className="text-[16px] text-slate-500">{t('layout.depthOfField')}</label>
                <button
                  type="button"
                  onClick={() => setDepthOfFieldEnabled(!depthOfFieldEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${depthOfFieldEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${depthOfFieldEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {depthOfFieldEnabled && (
                <>
                  <label className="text-[16px] text-slate-500">{t('layout.bokehScale')}</label>
                  <div className="flex items-center gap-2">
                    <Slider
                      min={4}
                      max={24}
                      step={1}
                      value={depthOfFieldBokehScale}
                      onValueChange={setDepthOfFieldBokehScale}
                      showValue={false}
                      className="flex-1"
                    />
                    <span className="text-xs text-slate-500 w-10 tabular-nums">{depthOfFieldBokehScale}</span>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between">
                <label className="text-[16px] text-slate-500">{t('layout.gizmoMove')}</label>
                <button
                  type="button"
                  onClick={() => setAvatarGizmoEnabled(!avatarGizmoEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${avatarGizmoEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${avatarGizmoEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <label className="text-[16px] text-slate-500">{t('layout.composerRes')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={0.5}
                  max={1}
                  step={0.05}
                  value={composerResolutionScale}
                  onValueChange={setComposerResolutionScale}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{composerResolutionScale.toFixed(2)}</span>
              </div>

              {/* Chromatic Aberration */}
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('layout.chromatic')}</p>
                <div className="flex items-center justify-between">
                  <label className="text-[16px] text-slate-500">{t('layout.chromaticAberration')}</label>
                  <button
                    type="button"
                    onClick={() => setChromaticEnabled(!chromaticEnabled)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${chromaticEnabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${chromaticEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {chromaticEnabled && (
                  <>
                    <label className="text-[16px] text-slate-500">{t('layout.chromaticOffset')}</label>
                    <div className="flex items-center gap-2">
                      <Slider min={0} max={0.05} step={0.001} value={chromaticOffset} onValueChange={setChromaticOffset} showValue={false} className="flex-1" />
                      <span className="text-xs text-slate-500 w-10 tabular-nums">{chromaticOffset.toFixed(3)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Color Correction Settings */}
              <label className="text-[16px] text-slate-500">{t('layout.brightness')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={-0.5}
                  max={1.5}
                  step={0.01}
                  value={brightness}
                  onValueChange={setBrightness}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{brightness.toFixed(2)}</span>
              </div>

              <label className="text-[16px] text-slate-500">{t('layout.contrast')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  value={contrast}
                  onValueChange={setContrast}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{contrast.toFixed(2)}</span>
              </div>

              <label className="text-[16px] text-slate-500">{t('layout.saturation')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={-1}
                  max={1}
                  step={0.02}
                  value={saturation}
                  onValueChange={setSaturation}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{saturation.toFixed(2)}</span>
              </div>

              <label className="text-[16px] text-slate-500">{t('layout.hue')}</label>
              <div className="flex items-center gap-2">
                <Slider
                  min={-3.14}
                  max={3.14}
                  step={0.05}
                  value={hue}
                  onValueChange={setHue}
                  showValue={false}
                  className="flex-1"
                />
                <span className="text-xs text-slate-500 w-10 tabular-nums">{(hue * (180 / Math.PI)).toFixed(0)}°</span>
              </div>

              {/* 手部轨迹特效 */}
              <div className="flex items-center justify-between mt-1">
                <label className="text-[16px] text-slate-500">{t('layout.handTrailVfx')}</label>
                <button
                  type="button"
                  onClick={() => setHandTrailEnabled(!handTrailEnabled)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${handTrailEnabled ? 'bg-blue-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${handTrailEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              {/* Theatre.js 相机编排 */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">{t('layout.cameraChoreography')}</p>
                <div className="flex items-center justify-between">
                  <label className="text-[16px] text-slate-500">{t('layout.theatreCamera')}</label>
                  <button
                    type="button"
                    onClick={() => setTheatreCameraActive(!theatreCameraActive)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${theatreCameraActive ? 'bg-violet-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${theatreCameraActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                {theatreCameraActive && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTheatreSequencePlaying(!theatreSequencePlaying)}
                      className={`flex-1 h-8 rounded-lg text-xs font-semibold transition-colors ${theatreSequencePlaying ? 'bg-red-500 text-white' : 'bg-violet-500 text-white hover:bg-violet-600'}`}
                    >
                      {theatreSequencePlaying ? t('layout.theatreStop') : t('layout.theatrePlay')}
                    </button>
                  </div>
                )}
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-[10px] text-slate-400 mt-1">{t('layout.theatreDevHint')}</p>
                )}
              </div>

              <label className="text-[16px] text-slate-500">{t('vtuber.scene.sceneModel')}</label>
              <div className="text-[11px] text-slate-500 truncate">{sceneName || t('layout.sceneModelNone')}</div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" className="flex-1" disabled={uploadingSceneFbx} onClick={() => sceneFbxInputRef.current?.click()}>
                  {uploadingSceneFbx ? t('vtuber.scene.uploading') : t('vtuber.scene.uploadSceneModel')}
                </Button>
                {sceneFbxUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => { setSceneFbxUrlState(''); setSceneName(''); setSceneFbxUrl(null); }}>
                    {t('common.clear')}
                  </Button>
                )}
              </div>
              <input ref={sceneFbxInputRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handleSceneModelUpload} />
            </div>
          )}

          {panelType === 'calendar' && (
            <div className="flex flex-col gap-4">
              <div className="echuu-calendar-wrap flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ">
                <div className="flex-1 min-w-0 p-3">
                  <DayPicker
                    mode="single"
                    weekStartsOn={0}
                    defaultMonth={new Date()}
                    selected={selectedCalendarDate ?? new Date()}
                    onSelect={(d) => setSelectedCalendarDate(d ?? null)}
                    modifiers={{
                      hasMemory: streamMemories.map((m) => new Date(m.date + 'T12:00:00')),
                    }}
                    modifiersClassNames={{
                      hasMemory: 'echuu-day-memory',
                    }}
                  />
                </div>
                <div className="w-[100px] flex-shrink-0 rounded-r-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src="/images/calendar-sky.png"
                    alt=""
                    className="w-full h-full object-cover min-h-[200px]"
                  />
                </div>
              </div>
              <label className="text-[16px] text-slate-500">{t('layout.memoryContent')}</label>
              {selectedCalendarDate ? (
                <div className="flex flex-col gap-2">
                  <input
                    className="h-9 bg-white dark:bg-slate-800 rounded-lg px-3 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
                    placeholder={t('layout.memoryTopic')}
                    value={memoryDraft.topic}
                    onChange={(e) => setMemoryDraft((p) => ({ ...p, topic: e.target.value }))}
                  />
                  <textarea
                    className="min-h-[60px] bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 text-sm resize-none placeholder:text-slate-400"
                    placeholder={t('layout.memorySummary')}
                    value={memoryDraft.summary}
                    onChange={(e) => setMemoryDraft((p) => ({ ...p, summary: e.target.value }))}
                  />
                  <input
                    className="h-9 bg-white dark:bg-slate-800 rounded-lg px-3 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400"
                    placeholder={t('layout.memoryPeople')}
                    value={memoryDraft.participants}
                    onChange={(e) => setMemoryDraft((p) => ({ ...p, participants: e.target.value }))}
                  />
                </div>
              ) : (
                <p className="text-slate-400 text-sm py-2">{t('layout.memoryHint')}</p>
              )}
              <label className="text-[16px] text-slate-500 pt-1">{t('layout.memoryNotesLabel')}</label>
              <textarea
                className="h-20 bg-white dark:bg-slate-800 rounded-lg px-4 py-3 text-slate-800 dark:text-slate-200 resize-none text-sm"
                placeholder={t('layout.memoryNotes')}
                value={calendarMemo}
                onChange={(e) => setCalendarMemo(e.target.value)}
              />
            </div>
          )}

          {panelType === 'mocap' && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('layout.mocapDescription')}
              </p>
              {onCameraToggle && (
                <>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn('inline-block h-2 w-2 rounded-full', isCameraActive ? 'bg-green-500' : 'bg-slate-300')} />
                    <span className="text-slate-600 dark:text-slate-400">
                      {isCameraActive ? t('layout.mocapActive') : t('layout.mocapOff')}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant={isCameraActive ? 'outline' : 'default'}
                    className="w-full"
                    onClick={onCameraToggle}
                  >
                    {isCameraActive ? t('layout.stopMocap') : t('layout.startMocap')}
                  </Button>
                </>
              )}
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

export { StreamRoomChatPanel } from './StreamRoomChatPanel';
export { GoLiveButton } from './GoLiveButton';
