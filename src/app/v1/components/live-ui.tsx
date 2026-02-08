'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import unionIcon from '../assets/ECHUU V1 UX_icon/Union.svg';
import chatVector1 from '../assets/ECHUU V1 UX_icon/Vector-1.svg';
import chatVector2 from '../assets/ECHUU V1 UX_icon/Vector-2.svg';
import chatVector3 from '../assets/ECHUU V1 UX_icon/Vector-3.svg';
import chatVector4 from '../assets/ECHUU V1 UX_icon/Vector-4.svg';
import chatVector5 from '../assets/ECHUU V1 UX_icon/Vector.svg';
import ellipse458 from '../assets/ECHUU V1 UX_icon/Ellipse 458.svg';
import voiceIcon from '../assets/ECHUU V1 UX_img/4d7820fc426bfc79e3eca47f3742b91d 1.png';
import decoTop from '../assets/ECHUU V1 UX_img/fe424fdbe4fd640ad4ec9e5d7e26363b 1.png';
import decoLeft from '../assets/ECHUU V1 UX_img/db13c5aa82b66b348df53b3b1ab7faa2 1.png';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';

export const LiveHeader = () => {
  const onlineCount = useEchuuWebSocket((state) => state.onlineCount);
  return (
    <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-50 pointer-events-none">
      <div className="flex items-center space-x-6 pointer-events-auto">
        <div className="w-12 h-12 bg-[#EEFF00] rounded-lg rotate-45 flex items-center justify-center shadow-[0_0_20px_#EEFF00]">
          <span className="rotate-[-45deg] font-black text-black italic text-xl">E</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-white italic tracking-tighter leading-none">ECHUU_V1</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-1.5 h-1.5 bg-[#EEFF00] rounded-full animate-pulse" />
            <span className="text-[8px] font-black text-[#EEFF00] uppercase tracking-widest">Uplink Stable</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-4 pointer-events-auto">
        <div className="bg-[#EEFF00]/20 border border-[#EEFF00] px-4 py-2 rounded-xl flex items-center space-x-2">
          <span className="text-[10px] font-black text-[#EEFF00] uppercase tracking-widest">Online</span>
          <span className="text-[10px] font-black text-[#EEFF00] font-mono">{onlineCount}</span>
        </div>
        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl flex items-center space-x-3">
          <span className="text-[10px] font-bold text-white/40 uppercase">Bitrate</span>
          <span className="text-[10px] font-black text-white font-mono">12.4 Mbps</span>
        </div>
        <div className="bg-red-600/20 backdrop-blur-md border border-red-600/40 px-4 py-2 rounded-xl flex items-center space-x-3">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">Live Protocol</span>
        </div>
      </div>
    </div>
  );
};

export const ChatPanel = () => {
  const { chatMessages, sendDanmaku } = useEchuuWebSocket();
  const [inputValue, setInputValue] = useState('');
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* ChatPanel-container */}
      <div className="absolute" style={{ left: '1195.14px', top: '152px', width: '441.49px', height: '678px' }} />

      {/* background */}
      <div className="absolute" style={{ left: '1195.14px', top: '300px', width: '430.62px', height: '405.42px' }} />

      {/* Vector 258 */}
      <div
        className="absolute"
        style={{
          left: '1294px',
          top: '299.5px',
          width: '269.52px',
          height: '405.42px',
          border: '151px solid #EEFF00',
        }}
      />
      {/* Vector 259 */}
      <div
        className="absolute"
        style={{
          left: '1195.14px',
          top: '392.31px',
          width: '65.32px',
          height: '110.07px',
          border: '50px solid #EEFF00',
        }}
      />
      {/* Vector 260 */}
      <div
        className="absolute"
        style={{
          left: '1197.56px',
          top: '531.42px',
          width: '26.61px',
          height: '19.35px',
          border: '50px solid #EEFF00',
        }}
      />
      {/* Vector 261 */}
      <div
        className="absolute"
        style={{
          left: '1592.89px',
          top: '366.2px',
          width: '32.87px',
          height: '108.87px',
          border: '50px solid #EEFF00',
          borderRadius: '25px',
        }}
      />

      {/* DanMuContent */}
      <div
        className="absolute text-black"
        style={{
          left: '1258px',
          top: '398.5px',
          width: '313px',
          height: '320px',
          border: '3px solid #EEFF00',
          fontFamily: 'Madou Futo Maru Gothic',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '14px',
          padding: '8px',
          overflow: 'hidden',
        }}
      >
        <div ref={messageRef} className="h-full overflow-y-auto pr-2 pointer-events-auto">
          {recentMessages.map((msg, index) => (
            <div key={`${msg.user}-${msg.timestamp}-${index}`} className="mb-1">
              <span className={msg.isAI ? 'text-[#EEFF00]' : 'text-white'}>
                {msg.user}：
              </span>
              <span className="ml-1">{msg.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Union */}
      <img src={unionIcon.src} alt="" className="absolute" style={{ left: '1246.06px', top: '227.49px', width: '163.8px', height: '90.51px' }} />

      {/* CHAT PANEL */}
      <div className="absolute" style={{ left: '1386px', top: '152px', width: '250.63px', height: '198.78px' }}>
        <img src={decoLeft.src} alt="" className="absolute" style={{ left: '0px', top: '0px', width: '125px', height: '158px' }} />
        <div className="absolute" style={{ left: '96px', top: '82px', width: '154.63px', height: '115.78px' }}>
          <img
            src={decoTop.src}
            alt=""
            className="absolute"
            style={{ left: '0px', top: '0px', width: '138.4px', height: '70.97px', transform: 'rotate(20.96deg)' }}
          />
          <img
            src={ellipse458.src}
            alt=""
            className="absolute"
            style={{ left: '58.62px', top: '18.88px', width: '49.3px', height: '27.18px', transform: 'rotate(17.44deg)' }}
          />
        </div>
        <img src={chatVector1.src} alt="" className="absolute" style={{ left: '158.37px', top: '164.58px', width: '18.38px', height: '33.6px' }} />
        <img src={chatVector2.src} alt="" className="absolute" style={{ left: '130.22px', top: '164.58px', width: '23.09px', height: '33.6px' }} />
        <img src={chatVector3.src} alt="" className="absolute" style={{ left: '92.51px', top: '164px', width: '32.5px', height: '34.75px' }} />
        <img src={chatVector4.src} alt="" className="absolute" style={{ left: '55.88px', top: '164px', width: '34.18px', height: '34.18px' }} />
        <img src={chatVector5.src} alt="" className="absolute" style={{ left: '30px', top: '165.18px', width: '25.82px', height: '33.6px' }} />
      </div>

      {/* StreamingTopic */}
      <div className="absolute" style={{ left: '1224px', top: '334px', width: '179px', height: '47px' }}>
        <div
          className="absolute text-[#EEFF00]"
          style={{
            left: '0px',
            top: '0px',
            width: '142px',
            height: '25px',
            fontFamily: 'MuseoModerno',
            fontStyle: 'italic',
            fontWeight: 800,
            fontSize: '16px',
            lineHeight: '25px',
            WebkitTextStroke: '5px #9E9E9E',
          }}
        >
          Streaming Topic：
        </div>
        <div
          className="absolute text-[#4A4A4A]"
          style={{
            left: '32px',
            top: '25px',
            width: '147px',
            height: '22px',
            fontFamily: 'MuseoModerno',
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: '14px',
            lineHeight: '22px',
            WebkitTextStroke: '5px #D9D9D9',
          }}
        >
          virtual cat-parenting
        </div>
      </div>

      {/* testchat-container */}
      <div className="absolute" style={{ left: '1256px', top: '794px', width: '341px', height: '36px' }}>
        <div
          className="absolute"
          style={{
            left: '0px',
            top: '0px',
            width: '341px',
            height: '36px',
            background: '#000000',
            border: '3px solid #EEFF00',
            borderRadius: '73px',
          }}
        />
        <input
          className="absolute bg-transparent text-white outline-none pointer-events-auto"
          style={{
            left: '16px',
            top: '0px',
            width: '231px',
            height: '35px',
            color: '#8D8D8D',
            fontFamily: 'FZLanTingHeiS-L-GB',
            fontWeight: 400,
            fontSize: '10px',
            lineHeight: '12px',
          }}
          placeholder="Chat with your streamer..."
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        {/* Voice-btn */}
        <div className="absolute" style={{ left: '252.15px', top: '4px', width: '82.92px', height: '31px' }}>
          <div
            className="absolute"
            style={{
              left: '0px',
              top: '0.34px',
              width: '82.92px',
              height: '27.31px',
              background: '#B1B1B1',
              border: '2px solid #EEFF00',
              borderRadius: '73px',
            }}
          />
          <img
            src={voiceIcon.src}
            alt=""
            className="absolute"
            style={{ left: '46.85px', top: '0px', width: '25px', height: '31px' }}
          />
        </div>
        {/* Send-btn */}
        <button
          type="button"
          className="absolute pointer-events-auto"
          style={{ left: '252.15px', top: '4px', width: '37.23px', height: '27.31px' }}
          onClick={handleSend}
        >
          <div
            className="absolute"
            style={{
              left: '0px',
              top: '0px',
              width: '37.23px',
              height: '27.31px',
              background: '#DBDBDB',
              border: '2px solid #EEFF00',
              borderRadius: '73px',
            }}
          />
        </button>
        <div
          className="absolute"
          style={{
            left: '323.85px',
            top: '18px',
            width: '15px',
            height: '0px',
            border: '2px solid #EEFF00',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
};

export const LiveToolbar = () => {
  const items = [
    { id: 'character', icon: '👤', path: '/v1/live/character' },
    { id: 'live', icon: '🎙️', path: '/v1/live/1' },
    { id: 'sound', icon: '🔊', path: '/v1/live/sound' },
    { id: 'scene', icon: '🖼️', path: '/v1/live/scene' },
    { id: 'calendar', icon: '📅', path: '/v1/live/calendar' },
  ];

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-2xl border border-white/10 p-2 rounded-[32px] flex space-x-2 shadow-2xl">
      {items.map(item => (
        <a 
          key={item.id} 
          href={item.path}
          className="w-14 h-14 rounded-[24px] flex items-center justify-center text-xl hover:bg-[#EEFF00] hover:text-black transition-all group"
        >
          <span className="group-hover:scale-125 transition-transform">{item.icon}</span>
        </a>
      ))}
      <div className="w-px h-8 bg-white/10 self-center mx-2" />
      <button className="w-14 h-14 bg-red-600/20 hover:bg-red-600 rounded-[24px] flex items-center justify-center transition-all group">
        <span className="text-red-600 group-hover:text-white text-xs font-black italic uppercase tracking-tighter">Exit</span>
      </button>
    </div>
  );
};
