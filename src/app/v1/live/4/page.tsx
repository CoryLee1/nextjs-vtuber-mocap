'use client';

import React from 'react';
import Link from 'next/link';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';

export default function V1Live4() {
  const scenes = [
    { name: 'Void_01', ref: 'e8959a7f36ded52b294d44ee475fbcdc8df3f1a3' },
    { name: 'Sky_02', ref: 'd87592b80b239a86f246a1402cbf6bd7068d1e47' },
    { name: 'Pulse_03', ref: '0fe1ad8c32b0c941dac59e7b6a441fc63cde4581' },
  ];

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      <LiveHeader />
      
      {/* Background showing current scene */}
      <img src="/v1-assets/fills/e8959a7f36ded52b294d44ee475fbcdc8df3f1a3.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl" />

      {/* Mini Scene Switcher */}
      <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col space-y-6 z-40 animate-in slide-in-from-left-8 duration-700">
        <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[40px] space-y-6">
          <h3 className="text-[#EEFF00] font-black text-[10px] uppercase tracking-[0.4em] italic text-center">Scene Link</h3>
          <div className="space-y-4">
            {scenes.map((scene, i) => (
              <div key={i} className="group cursor-pointer">
                <div className={cn(
                  "w-48 aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-500",
                  i === 0 ? "border-[#EEFF00] shadow-[0_0_20px_rgba(238,255,0,0.2)]" : "border-white/5 grayscale group-hover:grayscale-0 group-hover:border-white/20"
                )}>
                  <img src={`/v1-assets/fills/${scene.ref}.png`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="mt-2 flex justify-between items-center px-2">
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", i === 0 ? "text-[#EEFF00]" : "text-white/20")}>{scene.name}</span>
                  {i === 0 && <span className="w-1 h-1 bg-[#EEFF00] rounded-full animate-pulse" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LiveToolbar activeTool="chat" />

      <Link href="/v1/live/3" className="absolute top-1/2 left-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-white/20 font-black italic tracking-tighter hover:text-white">«</span>
      </Link>
      <Link href="/v1/live/5" className="absolute top-1/2 right-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-[#EEFF00] font-black italic tracking-tighter">»</span>
      </Link>
    </div>
  );
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
