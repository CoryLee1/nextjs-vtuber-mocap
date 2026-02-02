'use client';

import React from 'react';
import Link from 'next/link';
import { SettingsSidebar, SettingsCard, SettingsToggle } from '../../components/settings-ui';

export default function V1Settings2() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex font-sans">
      <SettingsSidebar activeId={2} />

      <div className="flex-1 h-full overflow-y-auto p-12 relative">
        <div className="absolute top-0 right-0 w-[60%] h-full z-0 pointer-events-none opacity-10">
          <img src="/v1-assets/fills/0fe1ad8c32b0c941dac59e7b6a441fc63cde4581.png" alt="" className="w-full h-full object-cover scale-150 rotate-12" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">Audio<br /><span className="text-[#EEFF00]">Frequency</span></h1>
            <p className="text-white/40 font-medium uppercase tracking-widest text-xs">Sonic interface and vocal modulation parameters</p>
          </div>

          <SettingsCard title="Neural Audio Input">
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Input Source</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white appearance-none outline-none focus:border-[#EEFF00]">
                <option className="bg-black">MASTER_LINK_MIC (EXTERNAL)</option>
                <option className="bg-black">SYSTEM_DEFAULT_VIRTUAL</option>
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Sensitivity Calibration</label>
                <span className="text-[#EEFF00] font-mono text-[10px]">85.2 dB</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
                <div className="absolute inset-0 bg-[#EEFF00] w-[85%] shadow-[0_0_10px_#EEFF00]" />
              </div>
            </div>

            <SettingsToggle 
              label="Noise Suppression" 
              description="Filter out ambient sonic interference from the neural link."
              enabled={true}
            />
          </SettingsCard>

          <div className="flex justify-between items-center">
            <Link href="/v1/settings/1" className="text-white/20 hover:text-white font-bold uppercase tracking-widest text-[10px] transition-colors">← Back to General</Link>
            <Link href="/v1/settings/3" className="px-12 py-5 bg-[#EEFF00] text-black font-black rounded-2xl hover:scale-105 transition-all text-sm uppercase tracking-widest">
              Save Audio Link →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
