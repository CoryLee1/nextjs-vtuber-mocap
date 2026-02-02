'use client';

import React from 'react';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';
import { LiveMonitor } from '../../components/live-monitor';

export default function V1LiveSound() {
  const audioNodes = [
    { name: 'Neural Vocal Mic', value: 85, peak: 92 },
    { name: 'Background Protocol', value: 45, peak: 50 },
    { name: 'Neural Feedback', value: 20, peak: 25 },
    { name: 'System Alerts', value: 60, peak: 65 },
  ];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-20 blur-2xl grayscale scale-110">
        <img src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" alt="" className="w-full h-full object-cover" />
      </div>

      <LiveHeader />
      
      <LiveMonitor title="Sonic Link" subtitle="Audio Modulation Controls">
        <div className="space-y-12">
          {audioNodes.map((node, i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">{node.name}</span>
                <span className="text-[#EEFF00] font-mono text-xs">{node.value} dB</span>
              </div>
              <div className="h-12 w-full bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden relative p-1">
                <div 
                  className="h-full bg-gradient-to-r from-transparent via-[#EEFF00]/40 to-[#EEFF00] transition-all duration-1000 shadow-[0_0_20px_rgba(238,255,0,0.2)] rounded-xl"
                  style={{ width: `${node.value}%` }}
                />
                {/* Peak marker */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-600 opacity-40 shadow-[0_0_10px_red]" style={{ left: `${node.peak}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6">
          {['Noise Gate', 'Compressor', 'Neural Filter'].map((tool, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col items-center space-y-4 group hover:border-[#EEFF00] transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:bg-[#EEFF00] group-hover:border-[#EEFF00] transition-all">
                <span className="group-hover:invert transition-all">⚙️</span>
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-all">{tool}</span>
            </div>
          ))}
        </div>
      </LiveMonitor>

      <LiveToolbar />
    </div>
  );
}
