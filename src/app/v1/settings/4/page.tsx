'use client';

import React from 'react';
import Link from 'next/link';
import { SettingsSidebar, SettingsCard } from '../../components/settings-ui';

export default function V1Settings4() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex font-sans">
      <SettingsSidebar activeId={4} />

      <div className="flex-1 h-full overflow-y-auto p-12 relative">
        <div className="relative z-10 max-w-3xl space-y-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Neural<br /><span className="text-[#EEFF00]">Export</span></h1>
            <p className="text-white/40 font-medium uppercase tracking-widest text-xs">Data extraction protocol and uplink finalization</p>
          </div>

          <SettingsCard title="Protocol Output Format">
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'MP4 Link', meta: 'H.264 / HIGH BITRATE', icon: '🎞️' },
                { label: 'MOV Alpha', meta: 'PRORES 4444 / NEURAL', icon: '🎭' },
                { label: 'SRT Script', meta: 'NEURAL SUBTITLES', icon: '📝' },
                { label: 'VRM Raw', meta: '3D MESH DATA', icon: '📦' },
              ].map((format, i) => (
                <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-[#EEFF00] group cursor-pointer transition-all">
                  <div className="text-3xl mb-4 grayscale group-hover:grayscale-0 transition-all">{format.icon}</div>
                  <h4 className="text-lg font-black text-white uppercase italic">{format.label}</h4>
                  <p className="text-[9px] text-white/20 tracking-widest font-bold mt-1 uppercase">{format.meta}</p>
                </div>
              ))}
            </div>
          </SettingsCard>

          <div className="flex justify-between items-center pt-8">
            <Link href="/v1/settings/3" className="text-white/20 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-colors">← Back to Visuals</Link>
            <Link href="/v1/live/1" className="px-16 py-6 bg-[#EEFF00] text-black font-black rounded-3xl hover:scale-105 transition-all text-lg uppercase tracking-tighter italic shadow-[0_0_50px_rgba(238,255,0,0.3)]">
              Initialize Live Protocol →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
