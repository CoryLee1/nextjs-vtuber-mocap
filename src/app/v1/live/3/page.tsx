'use client';

import React from 'react';
import Link from 'next/link';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';

export default function V1Live3() {
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans text-white">
      <LiveHeader />
      
      {/* Neural Link / Optics Simulation */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-5xl aspect-video bg-white/[0.02] border border-white/5 rounded-[60px] overflow-hidden group">
          {/* Scanlines effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none z-10 opacity-20" />
          
          <img 
            src="/v1-assets/fills/cab853264338b79e1586a181e77033a396460931.png" 
            alt="Optics Feed" 
            className="w-full h-full object-cover opacity-60 mix-blend-lighten group-hover:scale-105 transition-transform duration-[10s]"
          />

          {/* Tracking Markers */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#EEFF00]/20 rounded-full animate-ping pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#EEFF00]/40 rounded-full animate-pulse pointer-events-none" />
          
          <div className="absolute top-12 left-12 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EEFF00]">Neural Sync: 98.4%</span>
            <div className="w-32 h-1 bg-[#EEFF00]/20 rounded-full overflow-hidden">
              <div className="h-full bg-[#EEFF00] w-[98%] shadow-[0_0_10px_#EEFF00]" />
            </div>
          </div>
        </div>
      </div>

      <LiveToolbar activeTool="mic" />

      <Link href="/v1/live/2" className="absolute top-1/2 left-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-white/20 font-black italic tracking-tighter hover:text-white">«</span>
      </Link>
      <Link href="/v1/live/4" className="absolute top-1/2 right-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-[#EEFF00] font-black italic tracking-tighter">»</span>
      </Link>
    </div>
  );
}
