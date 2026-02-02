'use client';

import React from 'react';
import Link from 'next/link';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';

export default function V1Live2() {
  const expressions = [
    { label: 'Joy_01', icon: '😄' },
    { label: 'Sorrow_02', icon: '😢' },
    { label: 'Fun_03', icon: '🥳' },
    { label: 'Angry_04', icon: '💢' },
    { label: 'Surprise_05', icon: '😲' },
    { label: 'Neutral_XX', icon: '😐' },
  ];

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      <LiveHeader />
      
      <div className="absolute inset-0 z-0 opacity-20">
        <img 
          src="/v1-assets/fills/cab853264338b79e1586a181e77033a396460931.png" 
          alt="" 
          className="h-full w-auto object-contain absolute left-1/2 -translate-x-1/2"
        />
      </div>

      {/* Right Side Expression Panel */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 w-80 z-40 space-y-6 animate-in slide-in-from-right-8 duration-700">
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] space-y-8">
          <div>
            <h3 className="text-[#EEFF00] font-black text-xs uppercase tracking-[0.4em] italic mb-2">Morph Targets</h3>
            <p className="text-white/20 text-[9px] font-bold uppercase">Manual Override Active</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {expressions.map((expr, i) => (
              <button 
                key={i}
                className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#EEFF00] transition-all flex flex-col items-center space-y-3"
              >
                <span className="text-2xl group-hover:scale-125 transition-transform">{expr.icon}</span>
                <span className="text-[8px] font-black text-white group-hover:text-black uppercase tracking-widest">{expr.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <LiveToolbar activeTool="3d" />

      <div className="absolute top-1/2 left-10 -translate-y-1/2 z-50">
        <Link href="/v1/live/1" className="group flex flex-col items-center space-y-2 opacity-20 hover:opacity-100 transition-all">
          <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center group-hover:border-[#EEFF00] group-hover:scale-110 transition-all">
            <span className="text-[#EEFF00] font-black tracking-tighter uppercase text-[10px]">←</span>
          </div>
          <span className="text-[8px] font-black text-white uppercase tracking-widest">Prev View</span>
        </Link>
      </div>
      <div className="absolute top-1/2 right-10 -translate-y-1/2 z-50">
        {/* Navigation to next view */}
        <Link href="/v1/live/3" className="group flex flex-col items-center space-y-2 opacity-20 hover:opacity-100 transition-all">
          <div className="absolute top-[120%]">
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Next View</span>
          </div>
        </Link>
      </div>
      <Link href="/v1/live/3" className="absolute top-1/2 right-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-[#EEFF00] font-black italic tracking-tighter">»</span>
      </Link>
    </div>
  );
}
