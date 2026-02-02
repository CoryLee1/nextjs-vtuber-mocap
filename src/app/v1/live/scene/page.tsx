'use client';

import React from 'react';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';
import { LiveMonitor } from '../../components/live-monitor';

export default function V1LiveScene() {
  const scenes = [
    { name: 'Neural Void', ref: 'e8959a7f36ded52b294d44ee475fbcdc8df3f1a3', active: true },
    { name: 'Sky High', ref: 'd87592b80b239a86f246a1402cbf6bd7068d1e47', active: false },
    { name: 'Cyber Pulse', ref: '0fe1ad8c32b0c941dac59e7b6a441fc63cde4581', active: false },
    { name: 'Dark Flow', ref: '05ec3f3c942b2d3110f63964d8f034cfeb96f4dc', active: false },
  ];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-20 blur-2xl grayscale scale-110">
        <img src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" alt="" className="w-full h-full object-cover" />
      </div>

      <LiveHeader />
      
      <LiveMonitor title="Environment" subtitle="Neural Scene Selection">
        <div className="grid grid-cols-2 gap-8">
          {scenes.map((scene, i) => (
            <div key={i} className={cn(
              "group relative aspect-video rounded-[40px] overflow-hidden border-2 transition-all duration-500 cursor-pointer",
              scene.active ? "border-[#EEFF00] shadow-[0_0_40px_rgba(238,255,0,0.2)] scale-[1.02]" : "border-white/5 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:border-white/20"
            )}>
              <img src={`/v1-assets/fills/${scene.ref}.png`} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-8 flex items-center space-x-4">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  scene.active ? "bg-[#EEFF00] animate-pulse shadow-[0_0_10px_#EEFF00]" : "bg-white/20"
                )} />
                <span className={cn(
                  "text-xs font-black uppercase tracking-widest",
                  scene.active ? "text-[#EEFF00]" : "text-white/40"
                )}>{scene.name}</span>
              </div>
              {scene.active && (
                <div className="absolute top-6 right-8 bg-[#EEFF00] text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                  Active
                </div>
              )}
            </div>
          ))}
        </div>
      </LiveMonitor>

      <LiveToolbar />
    </div>
  );
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
