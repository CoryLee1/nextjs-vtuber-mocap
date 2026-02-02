'use client';

import React from 'react';
import Link from 'next/link';

export default function V1MVP() {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex flex-col font-sans text-white">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/v1-assets/fills/fb7cd6eb174815aff205ed309583de5af65546aa.png" 
          alt="" 
          className="w-full h-full object-cover opacity-40 mix-blend-soft-light"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/20 to-transparent" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-12 text-center space-y-16">
        
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="relative inline-block">
            <div className="w-32 h-32 bg-[#EEFF00] rounded-[40px] rotate-12 absolute inset-0 blur-[40px] opacity-20 animate-pulse" />
            <img 
              src="/v1-assets/fills/a1c14e3ba38a18f38099ba693d66bd1191949ad6.png" 
              alt="ECHUU Logo" 
              className="w-32 h-32 object-contain relative z-10"
            />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-[12rem] font-black tracking-tighter uppercase italic leading-[0.8] mix-blend-difference">
              MVP_01
            </h1>
            <p className="text-[#EEFF00] text-xl font-black uppercase tracking-[1em] italic ml-4">Neural Interface Ready</p>
          </div>
        </div>

        <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <p className="text-white/40 text-lg font-medium leading-relaxed uppercase tracking-widest">
            The ECHUU Version 1.0 architecture is now fully operational. 
            All neural protocols, optic link systems, and data extraction 
            pipelines have been successfully validated.
          </p>
          
          <div className="flex flex-col items-center space-y-6 pt-12">
            <Link href="/v1" className="group flex items-center space-x-8 px-16 py-8 bg-white text-black rounded-full hover:bg-[#EEFF00] transition-all duration-500 hover:scale-105">
              <span className="text-2xl font-black uppercase italic tracking-tighter">Enter Mainframe</span>
              <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center group-hover:scale-110 transition-all">
                <span className="text-[#EEFF00] font-black text-xl">→</span>
              </div>
            </Link>
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Project Sync ID: 2026_ECHUU_CORE</span>
          </div>
        </div>
      </div>

      {/* Decorative Overlays */}
      <div className="absolute top-10 left-10 text-[10px] font-black text-white/10 uppercase tracking-[1em] vertical-text h-64 border-l border-white/5 pl-4 flex items-center">
        Neural System V1.0
      </div>
      
      <div className="absolute bottom-10 right-10 flex space-x-12 opacity-20">
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest">Latency</div>
          <div className="text-xl font-mono">0.0014s</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest">Uplink</div>
          <div className="text-xl font-mono">STABLE</div>
        </div>
      </div>
    </div>
  );
}
