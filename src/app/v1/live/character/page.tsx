'use client';

import React, { useEffect, useState } from 'react';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';
import { LiveMonitor, CharacterSettingItem } from '../../components/live-monitor';
import { useSceneStore } from '@/hooks/use-scene-store';

const ECHUU_CONFIG_KEY = 'echuu_config';

export default function V1LiveCharacter() {
  const { echuuConfig, setEchuuConfig } = useSceneStore();
  const [characterName, setCharacterName] = useState(echuuConfig.characterName);
  const [persona, setPersona] = useState(echuuConfig.persona);
  const [background, setBackground] = useState(echuuConfig.background);
  const [topic, setTopic] = useState(echuuConfig.topic);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(ECHUU_CONFIG_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCharacterName(parsed.characterName || echuuConfig.characterName);
        setPersona(parsed.persona || echuuConfig.persona);
        setBackground(parsed.background || echuuConfig.background);
        setTopic(parsed.topic || echuuConfig.topic);
      } catch {
        // ignore invalid config
      }
    }
  }, [echuuConfig.background, echuuConfig.characterName, echuuConfig.persona, echuuConfig.topic]);

  useEffect(() => {
    const next = {
      characterName,
      persona,
      background,
      topic,
    };
    setEchuuConfig(next);
    if (typeof window !== 'undefined') {
      const current = useSceneStore.getState().echuuConfig;
      window.localStorage.setItem(ECHUU_CONFIG_KEY, JSON.stringify({
        ...current,
        ...next,
      }));
    }
  }, [background, characterName, persona, topic, setEchuuConfig]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="space-y-2">
            <label className="text-[10px] text-white/60 uppercase tracking-widest">Character Name</label>
            <input
              className="w-full h-12 rounded-[18px] bg-black/40 border border-white/10 px-4 text-white"
              value={characterName}
              onChange={(event) => setCharacterName(event.target.value)}
              placeholder="Character name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-white/60 uppercase tracking-widest">Topic</label>
            <input
              className="w-full h-12 rounded-[18px] bg-black/40 border border-white/10 px-4 text-white"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Streaming topic"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] text-white/60 uppercase tracking-widest">Persona</label>
            <textarea
              className="w-full h-24 rounded-[18px] bg-black/40 border border-white/10 px-4 py-3 text-white resize-none"
              value={persona}
              onChange={(event) => setPersona(event.target.value)}
              placeholder="Persona description"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-[10px] text-white/60 uppercase tracking-widest">Background</label>
            <textarea
              className="w-full h-20 rounded-[18px] bg-black/40 border border-white/10 px-4 py-3 text-white resize-none"
              value={background}
              onChange={(event) => setBackground(event.target.value)}
              placeholder="Background context"
            />
          </div>
        </div>

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
