'use client';

import React from 'react';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';
import { LiveMonitor, CharacterSettingItem } from '../../components/live-monitor';

export default function V1LiveCharacter() {
  const settings = [
    { label: 'Active Agent', value: 'AGENT_CORY_V1', active: true },
    { label: 'Neural Blend', value: 'EXPRESSION_PACK_01', active: false },
    { label: 'Physics Link', value: 'DYNAMICS_STABLE', active: false },
    { label: 'Bone Mapping', value: 'VRM_1.0_STANDARD', active: true },
    { label: 'Optic Filter', value: 'CYBER_NEON_02', active: false },
    { label: 'Motion Buffer', value: 'LOW_LATENCY_MAX', active: false },
  ];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      {/* Background (Blurred Stream) */}
      <div className="absolute inset-0 z-0 opacity-20 blur-2xl grayscale scale-110">
        <img 
          src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" 
          alt="" 
          className="w-full h-full object-cover"
        />
      </div>

      <LiveHeader />
      
      <LiveMonitor 
        title="Agent Config" 
        subtitle="Neural Character Calibration"
      >
        <div className="grid grid-cols-2 gap-6">
          {settings.map((s, i) => (
            <CharacterSettingItem key={i} {...s} />
          ))}
        </div>

        {/* Character Preview Overlay */}
        <div className="mt-12 p-8 bg-white/[0.02] border border-white/5 rounded-[40px] flex items-center space-x-12">
          <div className="w-48 h-48 bg-gradient-to-br from-[#EEFF00]/20 to-transparent rounded-full border border-[#EEFF00]/20 flex items-center justify-center overflow-hidden">
            <img src="/v1-assets/fills/293b789fe4d86a4ee1809d71d5e07312760df7ba.png" alt="" className="w-32 h-auto" />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-black text-white italic uppercase tracking-widest">Real-time Neural Sync</h3>
            <p className="text-white/40 text-xs leading-relaxed uppercase font-bold tracking-widest">
              Uplink status: Optimized. High-fidelity motion tracking engaged. 
              Currently syncing 52 neural morph targets at 60Hz.
            </p>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#EEFF00] w-[92%] shadow-[0_0_10px_#EEFF00] animate-pulse" />
            </div>
          </div>
        </div>
      </LiveMonitor>

      <LiveToolbar />
    </div>
  );
}
