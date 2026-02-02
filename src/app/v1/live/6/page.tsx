'use client';

import React from 'react';
import Link from 'next/link';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';

export default function V1Live6() {
  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      <LiveHeader />
      
      <div className="absolute inset-0 z-0 opacity-40">
        <img src="/v1-assets/fills/cab853264338b79e1586a181e77033a396460931.png" alt="" className="h-full w-auto object-contain absolute left-1/2 -translate-x-1/2 scale-110" />
      </div>

      {/* Shutdown / Completion Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-12">
        <div className="text-center space-y-8 max-w-2xl animate-in fade-in zoom-in-95 duration-1000">
          <div className="w-24 h-24 bg-[#EEFF00] rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(238,255,0,0.4)] animate-pulse">
            <span className="text-4xl">🏁</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">Stream Completed</h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Session Data Successfully Synced to Neural Link</p>
          </div>
          <div className="pt-12">
            <Link href="/v1/mvp" className="group relative inline-flex items-center space-x-6 px-12 py-6 bg-white/[0.03] border border-white/10 rounded-[32px] hover:border-[#EEFF00] hover:bg-[#EEFF00]/5 transition-all">
              <span className="text-lg font-black text-white uppercase italic tracking-widest group-hover:text-[#EEFF00]">Launch MVP Showcase</span>
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#EEFF00]">
                <span className="text-black group-hover:block hidden">→</span>
                <span className="text-white group-hover:hidden">→</span>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <LiveToolbar />

      <Link href="/v1/live/5" className="absolute top-1/2 left-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-white/20 font-black italic tracking-tighter hover:text-white">«</span>
      </Link>
    </div>
  );
}
