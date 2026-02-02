'use client';

import React from 'react';
import Link from 'next/link';
import { SettingsSidebar, SettingsCard, SettingsToggle } from '../../components/settings-ui';

export default function V1Settings3() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex font-sans">
      <SettingsSidebar activeId={3} />

      <div className="flex-1 h-full overflow-y-auto p-12 relative">
        <div className="relative z-10 max-w-3xl space-y-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Visual<br /><span className="text-[#EEFF00]">Interface</span></h1>
            <p className="text-white/40 font-medium uppercase tracking-widest text-xs">Optic sensor calibration and avatar rendering quality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SettingsCard title="Neural Tracking" className="h-full">
              <div className="aspect-square bg-white/5 border border-white/10 rounded-3xl border-dashed flex flex-col items-center justify-center space-y-4 group cursor-pointer hover:bg-white/[0.08] transition-all">
                <div className="w-16 h-16 border-2 border-white/10 rounded-full flex items-center justify-center group-hover:border-[#EEFF00] transition-colors">
                  <span className="text-2xl">📸</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white transition-colors">Initialize Camera Preview</span>
              </div>
              <SettingsToggle label="Face Capture" description="Enable 52-point neural facial tracking." enabled={true} />
            </SettingsCard>

            <SettingsCard title="Rendering Quality">
              <div className="space-y-6">
                {['Ultra Fidelity', 'Balanced Link', 'Fast Stream'].map((mode, i) => (
                  <div key={mode} className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all",
                    i === 0 ? "border-[#EEFF00] bg-[#EEFF00]/5" : "border-white/5 hover:border-white/20"
                  )}>
                    <h4 className={cn("font-bold text-xs uppercase tracking-widest", i === 0 ? "text-[#EEFF00]" : "text-white/40")}>{mode}</h4>
                    <p className="text-[9px] text-white/20 mt-1 uppercase">1080p @ 60 FPS / RTX Enabled</p>
                  </div>
                ))}
              </div>
            </SettingsCard>
          </div>

          <div className="flex justify-between items-center pt-8">
            <Link href="/v1/settings/2" className="text-white/20 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-colors">← Back to Audio</Link>
            <Link href="/v1/settings/4" className="px-12 py-5 bg-[#EEFF00] text-black font-black rounded-2xl hover:scale-105 transition-all text-sm uppercase tracking-widest">
              Lock Visuals →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
