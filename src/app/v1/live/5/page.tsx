'use client';

import React from 'react';
import Link from 'next/link';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';

export default function V1Live5() {
  const stats = [
    { label: 'Neural Latency', value: '14ms', progress: 15 },
    { label: 'Buffer Usage', value: '2.4GB', progress: 45 },
    { label: 'Optic Resolution', value: '1080p', progress: 100 },
    { label: 'Core Temp', value: '42°C', progress: 30 },
  ];

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden font-sans">
      <LiveHeader />
      
      <div className="absolute inset-0 z-0 opacity-10 blur-sm">
        <img src="/v1-assets/fills/cab853264338b79e1586a181e77033a396460931.png" alt="" className="h-full w-auto object-contain absolute left-1/2 -translate-x-1/2" />
      </div>

      {/* Analytics Overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-20 z-40">
        <div className="w-full max-w-4xl grid grid-cols-2 gap-8 animate-in zoom-in-95 duration-700">
          {stats.map((stat, i) => (
            <div key={i} className="bg-black/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[48px] space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">{stat.label}</span>
                <span className="text-2xl font-black text-[#EEFF00] italic leading-none">{stat.value}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
                <div className={cn(
                  "absolute inset-0 shadow-[0_0_15px_rgba(238,255,0,0.5)] transition-all duration-1000",
                  stat.progress === 100 ? "bg-[#EEFF00] w-full" : "bg-white/20"
                )} style={{ width: `${stat.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <LiveToolbar activeTool="stop" />

      <Link href="/v1/live/4" className="absolute top-1/2 left-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-white/20 font-black italic tracking-tighter hover:text-white">«</span>
      </Link>
      <Link href="/v1/live/6" className="absolute top-1/2 right-4 -translate-y-1/2 z-50 w-8 h-20 flex items-center justify-center hover:bg-white/5 rounded-full transition-all">
        <span className="text-[#EEFF00] font-black italic tracking-tighter">»</span>
      </Link>
    </div>
  );
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
