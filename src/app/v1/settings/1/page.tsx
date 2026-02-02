'use client';

import React from 'react';
import Link from 'next/link';
import { SettingsSidebar, SettingsCard, SettingsToggle } from '../../components/settings-ui';

export default function V1Settings1() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex font-sans">
      
      {/* Sidebar */}
      <SettingsSidebar activeId={1} />

      {/* Main Content */}
      <div className="flex-1 h-full overflow-y-auto p-12 relative">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-[60%] h-full z-0 pointer-events-none opacity-20">
          <img 
            src="/v1-assets/fills/02695af6fc04511428da61ff52e316cd3119e83e.png" 
            alt="" 
            className="w-full h-full object-contain grayscale mix-blend-lighten scale-150 rotate-[-15deg] translate-x-1/4"
          />
        </div>

        <div className="relative z-10 max-w-3xl space-y-12">
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">General<br /><span className="text-[#EEFF00]">Protocol</span></h1>
            <p className="text-white/40 font-medium uppercase tracking-widest text-xs">Primary system parameters and link initialization</p>
          </div>

          <SettingsCard title="Core Configuration">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold ml-1">Agent Identification</label>
              <input type="text" defaultValue="AGENT_CORY_VER_1.0" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-mono text-sm outline-none focus:border-[#EEFF00] transition-all" />
            </div>
            
            <SettingsToggle 
              label="Neural Auto-Sync" 
              description="Keep local Agent parameters synchronized with the ECHUU mainframe."
              enabled={true}
            />

            <SettingsToggle 
              label="Low Latency Mode" 
              description="Prioritize responsiveness over visual fidelity during high-load sessions."
              enabled={false}
            />
          </SettingsCard>

          <div className="flex justify-end">
            <Link href="/v1/settings/2" className="px-12 py-5 bg-[#EEFF00] text-black font-black rounded-2xl hover:scale-105 transition-all text-sm uppercase tracking-widest">
              Update & Continue →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
