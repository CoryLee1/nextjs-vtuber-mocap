'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { VRMAvatar } from '@/components/dressing-room/VRMAvatar';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';
import { startLive } from '@/lib/echuu-client';
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

const ECHUU_CONFIG_KEY = 'echuu_config';
const ECHUU_MODEL_KEY = 'echuu_model';

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
  } = useEchuuWebSocket();
  const {
    echuuConfig,
    setEchuuConfig,
    setVRMModelUrl,
    setScene,
    setEchuuCue,
    setEchuuAudioPlaying,
  } = useSceneStore();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState('');
  const audioQueueRef = useRef(createEchuuAudioQueue({
    onStart: () => setEchuuAudioPlaying(true),
    onEnd: () => setEchuuAudioPlaying(false),
  }));

  useEffect(() => {
    setScene('main');
    connect();
    return () => {
      disconnect();
      reset();
      setEchuuCue(null);
      setEchuuAudioPlaying(false);
      audioQueueRef.current.stop();
    };
  }, [connect, disconnect, reset, setScene, setEchuuCue, setEchuuAudioPlaying]);

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

  const subtitleText = useMemo(() => currentStep?.speech || '', [currentStep?.speech]);

  const handleStartLive = async () => {
    setIsStarting(true);
    setStartError('');
    try {
      await startLive({
        character_name: echuuConfig.characterName,
        persona: echuuConfig.persona,
        background: echuuConfig.background,
        topic: echuuConfig.topic,
      });
    } catch (error: any) {
      setStartError(error?.message || '启动失败');
    } finally {
      setIsStarting(false);
    }
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
        <div className="absolute z-40" style={{ left: '93px', top: '66px', width: '154px', height: '808px' }}>
          {/* Character Setting-btn */}
          <a href="/v1/live/character" className="absolute block cursor-pointer hover:scale-105 transition-transform" style={{ left: '10px', top: '0px', width: '142px', height: '161px' }}>
            <img src={characterIcon.src} alt="" className="absolute" style={{ left: '0px', top: '12px', width: '142px', height: '142px' }} />
            <img src={accentSmall.src} alt="" className="absolute" style={{ left: '69px', top: '17px', width: '19px', height: '7px', transform: 'rotate(3.04deg)' }} />
            <img src={accentMedium.src} alt="" className="absolute" style={{ left: '66px', top: '9px', width: '26px', height: '8px', transform: 'rotate(3.04deg)' }} />
            <img src={accentLarge.src} alt="" className="absolute" style={{ left: '58px', top: '0px', width: '37px', height: '11px', transform: 'rotate(3.04deg)' }} />
            <div className="absolute text-[14px] leading-[15px] text-black" style={{ left: '13px', top: '146px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>
              Character Setting
            </div>
          </a>

          {/* LiveSetting-btn */}
          <a href="/v1/live/1" className="absolute block cursor-pointer hover:scale-105 transition-transform" style={{ left: '7px', top: '168px', width: '147px', height: '162px' }}>
            <img src={liveSettingIcon.src} alt="" className="absolute" style={{ left: '0px', top: '0px', width: '147px', height: '147px' }} />
            <div className="absolute" style={{ left: '25px', top: '52px', width: '78px', height: '63px', background: '#D9D9D9', mixBlendMode: 'multiply', borderRadius: '10px' }} />
            <div className="absolute" style={{ left: '46px', top: '74px', width: '36px', height: '20px' }}>
              <div className="absolute" style={{ left: '0px', top: '5px', width: '7px', height: '7px', background: '#FF5C5C', borderRadius: '2px' }} />
              <div className="absolute text-[12px] leading-[20px] text-[#FF5C5C]" style={{ left: '11px', top: '0px', fontFamily: 'Dubai', fontWeight: 700 }}>LIVE</div>
            </div>
            <div className="absolute text-[14px] leading-[15px] text-black" style={{ left: '38px', top: '147px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>Live Setting</div>
          </a>

          {/* Sound Setting-btn */}
          <a href="/v1/live/sound" className="absolute block cursor-pointer hover:scale-105 transition-transform" style={{ left: '33px', top: '373px', width: '96px', height: '108px' }}>
            <img src={soundSettingIcon.src} alt="" className="absolute" style={{ left: '9px', top: '0px', width: '78px', height: '83px' }} />
            <div className="absolute text-[14px] leading-[15px] text-black" style={{ left: '0px', top: '93px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>Sound Setting</div>
          </a>

          {/* scene-button */}
          <a href="/v1/live/scene" className="absolute block cursor-pointer hover:scale-105 transition-transform" style={{ left: '0px', top: '500px', width: '154px', height: '165px' }}>
            <img src={sceneBaseIcon.src} alt="" className="absolute" style={{ left: '0px', top: '62px', width: '154px', height: '95px' }} />
            <img src={sceneOverlayIcon.src} alt="" className="absolute" style={{ left: '2px', top: '0px', width: '150px', height: '150px' }} />
            <img src={sceneRibbonIcon.src} alt="" className="absolute" style={{ left: '43px', top: '40px', width: '69px', height: '69px', transform: 'matrix(0.98, -0.18, 0.18, 0.98, 0, 0)' }} />
            <div className="absolute text-[14px] leading-[15px] text-black" style={{ left: '56px', top: '150px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>Scene</div>
          </a>

          {/* Calendar Memory-btn */}
          <a href="/v1/live/calendar" className="absolute block cursor-pointer hover:scale-105 transition-transform" style={{ left: '15px', top: '710px', width: '120px', height: '98px' }}>
            <img src={calendarIcon.src} alt="" className="absolute" style={{ left: '20px', top: '0px', width: '80px', height: '80px' }} />
            <div className="absolute text-[14px] leading-[15px] text-black" style={{ left: '0px', top: '83px', fontFamily: 'MHTIROGLA', fontWeight: 500 }}>Calendar Memory</div>
          </a>
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
