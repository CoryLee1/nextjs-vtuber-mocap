'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { VRMAvatar } from '@/components/dressing-room/VRMAvatar';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { createRoom, startLive } from '@/lib/echuu-client';
import { createEchuuAudioQueue } from '@/lib/echuu-audio';
import { useSceneStore } from '@/hooks/use-scene-store';
import { ChatPanel, LiveHeader } from '../../components/live-ui';
import image178 from '../../assets/ECHUU V1 UX_img/image 178.png';
import profileImage from '../../assets/ECHUU V1 UX_img/8be2a2ce948acfa51a3bbed53803b48e 2.png';
import goButton from '../../assets/ECHUU V1 UX_icon/go-btn.svg';
import ellipse457 from '../../assets/ECHUU V1 UX_icon/Ellipse 457.svg';
import ellipse459 from '../../assets/ECHUU V1 UX_icon/Ellipse 459.svg';
import screenshotIcon from '../../assets/ECHUU V1 UX_icon/Group.svg';
import decoLong1 from '../../assets/ECHUU V1 UX_img/fe424fdbe4fd640ad4ec9e5d7e26363b 1.png';
import decoLong2 from '../../assets/ECHUU V1 UX_img/fe424fdbe4fd640ad4ec9e5d7e26363b 2.png';
import gift184 from '../../assets/ECHUU V1 UX_img/image 184.png';
import gift182 from '../../assets/ECHUU V1 UX_img/image 182.png';
import gift181 from '../../assets/ECHUU V1 UX_img/image 181.png';
import gift186 from '../../assets/ECHUU V1 UX_img/image 186.png';
import characterIcon from '../../assets/ECHUU V1 UX_img/Gemini_Generated_Image_unppndunppndunpp (1) 1.png';
import liveSettingIcon from '../../assets/ECHUU V1 UX_img/image 190.png';
import soundSettingIcon from '../../assets/ECHUU V1 UX_img/b2d19cebb7369ec09e51e8da12cd64d2 1.png';
import sceneBaseIcon from '../../assets/ECHUU V1 UX_img/image 183.png';
import sceneOverlayIcon from '../../assets/ECHUU V1 UX_img/image 179.png';
import sceneRibbonIcon from '../../assets/ECHUU V1 UX_img/image 180.png';
import calendarIcon from '../../assets/ECHUU V1 UX_img/8035b537838f81a942811ef8fecd8c5b 1.png';
import accentSmall from '../../assets/ECHUU V1 UX_icon/Vector 262 (Stroke).svg';
import accentMedium from '../../assets/ECHUU V1 UX_icon/Vector 263 (Stroke).svg';
import accentLarge from '../../assets/ECHUU V1 UX_icon/Vector 264 (Stroke).svg';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ECHUU_CONFIG_KEY = 'echuu_config';
const ECHUU_MODEL_KEY = 'echuu_model';
const ECHUU_LIVE_SETTINGS_KEY = 'echuu_live_settings';

const LIVE_PLATFORMS: { id: 'twitch' | 'youtube'; labelZh: string; labelEn: string }[] = [
  { id: 'twitch', labelZh: 'Twitch', labelEn: 'Twitch' },
  { id: 'youtube', labelZh: 'YouTube', labelEn: 'YouTube' },
];
const ECHUU_SOUND_SETTINGS_KEY = 'echuu_sound_settings';
const ECHUU_SCENE_SETTINGS_KEY = 'echuu_scene_settings';
const ECHUU_CALENDAR_SETTINGS_KEY = 'echuu_calendar_settings';

type StreamRoomPanel = 'character' | 'live' | 'sound' | 'scene' | 'calendar';

const StreamRoomAvatar = () => {
  const { echuuConfig, vrmModelUrl } = useSceneStore();
  const modelUrl = echuuConfig.modelUrl || vrmModelUrl || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com/AvatarSample_A.vrm';

  return (
    <Canvas
      className="w-full h-full"
      camera={{ position: [0, 1.3, 2.6], fov: 35 }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 2]} intensity={1.2} />
      <VRMAvatar modelUrl={modelUrl} scale={1} position={[0, 0, 0]} />
    </Canvas>
  );
};

export default function V1Live1() {
  const {
    connect,
    disconnect,
    reset,
    currentStep,
    streamState,
    infoMessage,
    errorMessage,
    roomId,
    ownerToken,
    setRoom,
  } = useEchuuWebSocket();
  const {
    echuuConfig,
    setEchuuConfig,
    setVRMModelUrl,
    setScene,
    setEchuuCue,
    setEchuuAudioPlaying,
    setBgmUrl,
    setBgmVolume: setStoreBgmVolume,
    setHdrUrl,
    setSceneFbxUrl,
  } = useSceneStore();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');
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
  const [livePlatform, setLivePlatform] = useState('');
  const [liveKey, setLiveKey] = useState('');
  const [bgm, setBgm] = useState('');
  const [bgmVolume, setBgmVolume] = useState(80);
  const [voiceVolume, setVoiceVolume] = useState(100);
  const [voice, setVoice] = useState('');
  const [hdr, setHdr] = useState('');
  const [sceneName, setSceneName] = useState('');
  const [sceneFbxUrl, setSceneFbxUrlState] = useState('');
  const [calendarMemo, setCalendarMemo] = useState('');
  const audioQueueRef = useRef(createEchuuAudioQueue({
    onStart: () => setEchuuAudioPlaying(true),
    onEnd: () => setEchuuAudioPlaying(false),
  }));

  useEffect(() => {
    setScene('main');
    if (roomId) connect(roomId);
    return () => {
      disconnect();
      reset();
      setEchuuCue(null);
      setEchuuAudioPlaying(false);
      audioQueueRef.current.stop();
    };
  }, [roomId, connect, disconnect, reset, setScene, setEchuuCue, setEchuuAudioPlaying]);

  useEffect(() => {
    if (currentStep?.cue) {
      setEchuuCue(currentStep.cue);
    }
  }, [currentStep?.cue, setEchuuCue]);

  useEffect(() => {
    if (currentStep?.audio_b64) {
      audioQueueRef.current.enqueue(currentStep.audio_b64);
    }
  }, [currentStep?.audio_b64]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedConfig = window.localStorage.getItem(ECHUU_CONFIG_KEY);
    const storedModel = window.localStorage.getItem(ECHUU_MODEL_KEY);
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        setEchuuConfig(parsed);
        setCharacterDraft((prev) => ({
          ...prev,
          characterName: parsed.characterName || prev.characterName,
          voice: parsed.voice || prev.voice,
          modelUrl: parsed.modelUrl || prev.modelUrl,
          modelName: parsed.modelName || prev.modelName,
          persona: parsed.persona || prev.persona,
          background: parsed.background || prev.background,
          topic: parsed.topic || prev.topic,
        }));
      } catch {
        // ignore invalid config
      }
    }
    if (storedModel) {
      try {
        const parsed = JSON.parse(storedModel);
        if (parsed?.url) {
          setVRMModelUrl(parsed.url);
          setEchuuConfig({ modelUrl: parsed.url, modelName: parsed.name || '' });
        }
      } catch {
        // ignore invalid model
      }
    }
  }, [setEchuuConfig, setVRMModelUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedLive = window.localStorage.getItem(ECHUU_LIVE_SETTINGS_KEY);
    const storedSound = window.localStorage.getItem(ECHUU_SOUND_SETTINGS_KEY);
    const storedScene = window.localStorage.getItem(ECHUU_SCENE_SETTINGS_KEY);
    const storedCalendar = window.localStorage.getItem(ECHUU_CALENDAR_SETTINGS_KEY);

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
        setVoice(parsed.voice || '');
        if (typeof parsed.bgmVolume === 'number') setBgmVolume(parsed.bgmVolume);
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
  }, [
    echuuConfig.background,
    echuuConfig.characterName,
    echuuConfig.modelName,
    echuuConfig.modelUrl,
    echuuConfig.persona,
    echuuConfig.topic,
    echuuConfig.voice,
    panelOpen,
    panelType,
  ]);

  const subtitleText = useMemo(() => currentStep?.speech || '', [currentStep?.speech]);

  const handleStartLive = async () => {
    setIsStarting(true);
    setStartError('');
    try {
      let rid = roomId;
      let token = ownerToken;
      if (!rid || !token) {
        const room = await createRoom();
        rid = room.room_id;
        token = room.owner_token;
        setRoom(rid, token);
        connect(rid);
        await new Promise((r) => setTimeout(r, 500));
      } else {
        connect(rid);
        await new Promise((r) => setTimeout(r, 300));
      }
      await startLive(
        {
          character_name: echuuConfig.characterName,
          persona: echuuConfig.persona,
          background: echuuConfig.background,
          topic: echuuConfig.topic,
          voice: echuuConfig.voice || 'Cherry',
        },
        rid,
        token
      );
    } catch (error: any) {
      setStartError(error?.message || '启动失败');
    } finally {
      setIsStarting(false);
    }
  };

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
          JSON.stringify({ bgm, voice, bgmVolume, voiceVolume })
        );
        setBgmUrl(bgm || null);
        setStoreBgmVolume(bgmVolume);
      }
      if (panelType === 'scene') {
        window.localStorage.setItem(
          ECHUU_SCENE_SETTINGS_KEY,
          JSON.stringify({ hdr, scene: sceneName, sceneFbxUrl })
        );
        setHdrUrl(hdr || null);
        setSceneFbxUrl(sceneFbxUrl || null);
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
    <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden font-sans">
      {/* Scaled container - maintains original 1703x956 design ratio */}
      <div
        className="relative origin-center"
        style={{
          width: '1703px',
          height: '956px',
          transform: 'scale(var(--v1-scale, 1))',
        }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-[#3F92FF]" />
        <img
          src={image178.src}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 3D Character - centered */}
        <div
          className="absolute"
          style={{ left: '188px', top: '-129px', width: '1280px', height: '1086px' }}
        >
          <StreamRoomAvatar />
        </div>

        {/* Header UI */}
        <LiveHeader />

        {/* Chat Panel */}
        <ChatPanel />

        {/* ShortVideoArea-16:9 */}
        <div
          className="absolute border border-dashed border-[#EEFF00] pointer-events-none"
          style={{
            left: '613px',
            top: '57px',
            width: '477px',
            height: '848px',
          }}
        >
          <div className="absolute left-4 top-2 text-white text-[12px]" style={{ fontFamily: 'Subway Ticker' }}>
            9：16
          </div>
          <img src={decoLong1.src} alt="" className="absolute" style={{ left: '-43px', top: '500px', width: '120px', height: '251px', transform: 'rotate(6.48deg)' }} />
          <img src={decoLong2.src} alt="" className="absolute" style={{ left: '400px', top: '450px', width: '120px', height: '251px', transform: 'scaleX(-1) rotate(6.48deg)' }} />
          <img src={ellipse457.src} alt="" className="absolute" style={{ left: '43px', top: '113px', width: '138px', height: '74px', transform: 'rotate(165deg)' }} />
          <div className="absolute right-4 top-2 flex items-center gap-2">
            <img src={ellipse459.src} alt="" className="w-[17px] h-[17px]" />
            <span className="text-[#EEFF00] text-[14px]" style={{ fontFamily: 'MHTIROGLA', fontWeight: 500 }}>On Air</span>
          </div>
          <div className="absolute right-4 top-10 flex flex-col items-center">
            <img src={screenshotIcon.src} alt="" className="w-[24px] h-[18px]" />
            <span className="text-[#EEFF00] text-[8px] mt-1" style={{ fontFamily: 'MHTIROGLA', fontWeight: 500 }}>Screenshot</span>
          </div>
        </div>

        {/* Gift-buttons */}
        <div className="absolute" style={{ left: '1295px', top: '708px', width: '280px', height: '95px' }}>
          <div className="absolute" style={{ left: '0px', top: '19px', width: '268px', height: '53px', background: '#EEFF00', borderRadius: '35px' }} />
          <img src={gift184.src} alt="" className="absolute" style={{ left: '208px', top: '13px', width: '72px', height: '72px', objectFit: 'contain' }} />
          <img src={gift182.src} alt="" className="absolute" style={{ left: '10px', top: '19px', width: '57px', height: '57px', objectFit: 'contain' }} />
          <img src={gift181.src} alt="" className="absolute" style={{ left: '54px', top: '0px', width: '95px', height: '95px', objectFit: 'contain' }} />
          <img src={gift186.src} alt="" className="absolute" style={{ left: '137px', top: '11px', width: '77px', height: '77px', objectFit: 'contain' }} />
        </div>

        {/* Profile picture */}
        <div className="absolute overflow-hidden" style={{ right: '43px', top: '48px', width: '64px', height: '64px', border: '4px solid #EEFF00', borderRadius: '36px' }}>
          <img src={profileImage.src} alt="" className="w-full h-full object-cover" />
        </div>

        {/* go-btn */}
        <img
          src={goButton.src}
          alt=""
          className="absolute cursor-pointer hover:scale-110 transition-transform"
          style={{ left: '813px', top: '784px', width: '78px', height: '78px', filter: 'drop-shadow(0px 6px 34.3px #EEFF00)' }}
          onClick={handleStartLive}
        />

        {/* Stream Status */}
        <div className="absolute left-[40px] bottom-[24px] flex items-center gap-3 text-[10px] text-white/80">
          <span className="uppercase tracking-widest">Status</span>
          <span className="text-[#EEFF00] font-black">{streamState}</span>
          {infoMessage ? <span className="text-white/60">{infoMessage}</span> : null}
          {startError || errorMessage ? (
            <span className="text-red-400">{startError || errorMessage}</span>
          ) : null}
          {isStarting ? <span className="text-white/50">Starting...</span> : null}
        </div>

        {/* Subtitle */}
        {subtitleText ? (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[120px] px-6 py-3 bg-black/60 border border-white/10 rounded-full text-sm text-[#EEFF00]">
            {subtitleText}
          </div>
        ) : null}

        {/* Left UIControl */}
        <div
          className="absolute z-40 flex flex-col items-center justify-center gap-[29px]"
          style={{ left: '93px', top: 'calc(50% - 405px - 6.73px)', width: '154px', height: '811.74px' }}
        >
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

        {/* Left Slide Panel */}
        <div
          className={`absolute z-30 transition-transform duration-300 ${panelOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}`}
          style={{ left: '0px', top: '120px', width: '540px', height: '700px' }}
        >
          <div className="w-full h-full bg-[#E7ECF3] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/60 rounded-[20px] p-10 flex flex-col gap-6 pointer-events-auto">
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
                <Select
                  value={livePlatform || '__none__'}
                  onValueChange={(v) => setLivePlatform(v === '__none__' ? '' : (v as 'twitch' | 'youtube'))}
                >
                  <SelectTrigger className="h-12 bg-white rounded-lg px-4 text-slate-800">
                    <SelectValue placeholder="选择平台" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">请选择</SelectItem>
                    {LIVE_PLATFORMS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.labelZh}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <label className="text-[12px] text-slate-500">推流密钥 (Stream Key)</label>
                <input
                  type="password"
                  autoComplete="off"
                  className="h-12 bg-white rounded-lg px-4 text-slate-800 placeholder:text-slate-400"
                  placeholder={
                    livePlatform === 'twitch'
                      ? 'Twitch 主推流密钥'
                      : livePlatform === 'youtube'
                        ? 'YouTube 推流密钥'
                        : '请先选择平台'
                  }
                  value={liveKey}
                  onChange={(e) => setLiveKey(e.target.value)}
                  disabled={!livePlatform}
                />
                {livePlatform && (
                  <p className="text-[11px] text-slate-400">
                    {livePlatform === 'twitch' && '在 Twitch 创作者后台 → 设置 → 直播 中获取主推流密钥。'}
                    {livePlatform === 'youtube' && '在 YouTube 工作室 → 推流 中创建并复制推流密钥。'}
                  </p>
                )}
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

        {/* CSS Variable for scaling */}
        <style jsx global>{`
          :root {
            --v1-scale: min(calc(100vw / 1703), calc(100vh / 956));
          }
        `}</style>
      </div>
    </div>
  );
}
