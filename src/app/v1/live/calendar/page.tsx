'use client';

import React from 'react';
import { LiveHeader, LiveToolbar } from '../../components/live-ui';
import { LiveMonitor } from '../../components/live-monitor';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';

export default function V1LiveCalendar() {
  const dates = Array.from({ length: 31 }, (_, i) => i + 1);
  const memorySnapshot = useEchuuWebSocket((s) => s.memorySnapshot);

  const progress = memorySnapshot?.script_progress;
  const currentLine = progress?.current_line ?? 0;
  const totalLines = progress?.total_lines ?? 0;
  const currentStage = progress?.current_stage ?? '—';
  const dm = memorySnapshot?.danmaku_memory;
  const respondedCount = dm?.responded?.length ?? 0;
  const pendingCount = dm?.pending_questions?.length ?? 0;
  const userProfiles = memorySnapshot?.user_profiles ?? {};
  const profileList = Object.values(userProfiles);
  const familiarCount = profileList.filter((p) => (p.bonding_level ?? 0) >= 2).length;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-20 blur-2xl grayscale scale-110">
        <img src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" alt="" className="w-full h-full object-cover" />
      </div>

      <LiveHeader />

      <LiveMonitor title="Memory Log" subtitle="Neural Session Calendar">
        <div className="flex space-x-12">
          {/* Calendar Grid */}
          <div className="flex-1">
            <div className="mb-8 flex justify-between items-center px-4">
              <span className="text-xl font-black text-white italic tracking-widest uppercase italic">February 2026</span>
              <div className="flex space-x-4 opacity-20">
                <span className="cursor-pointer hover:text-white">←</span>
                <span className="cursor-pointer hover:text-white">→</span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="h-12 flex items-center justify-center text-[10px] font-black text-white/20 uppercase">{d}</div>
              ))}
              {dates.map(d => (
                <div key={d} className={cn(
                  "aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer group",
                  d === 1 ? "bg-[#EEFF00] border-[#EEFF00] shadow-[0_0_20px_rgba(238,255,0,0.3)]" : "bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.05]"
                )}>
                  <span className={cn("text-xs font-black", d === 1 ? "text-black" : "text-white/40 group-hover:text-white")}>{d}</span>
                  {d === 1 && <div className="w-1 h-1 bg-black rounded-full mt-1" />}
                </div>
              ))}
            </div>
          </div>

          {/* Session Details（与后端 PerformerMemory 同步） */}
          <div className="w-80 space-y-8">
            <div className="p-8 bg-[#EEFF00]/10 border border-[#EEFF00]/20 rounded-[40px] space-y-6">
              <h4 className="text-[#EEFF00] text-xs font-black uppercase tracking-[0.3em] italic">Session Report</h4>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/20 uppercase">Script Progress</p>
                  <p className="text-lg font-black text-white italic">
                    {totalLines ? `${currentLine}/${totalLines}` : '—'} {currentStage && currentStage !== '—' ? `(${currentStage})` : ''}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/20 uppercase">Danmaku</p>
                  <p className="text-lg font-black text-white italic">Responded {respondedCount} · Pending {pendingCount}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-white/20 uppercase">Familiar Viewers</p>
                  <p className="text-lg font-black text-white italic">{profileList.length} total · {familiarCount} regular</p>
                </div>
              </div>
            </div>

            {profileList.length > 0 && (
              <div className="p-8 bg-white/[0.02] border border-white/10 rounded-[40px] space-y-4">
                <h4 className="text-white/60 text-xs font-black uppercase tracking-[0.2em]">Neural Memory (Viewers)</h4>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {profileList.slice(0, 12).map((u) => (
                    <li key={u.username} className="text-[10px] text-white/80 flex justify-between">
                      <span className="font-bold truncate mr-2">{u.username}</span>
                      <span className="text-white/50 shrink-0">{u.interaction_count} interactions · Lv{u.bonding_level ?? 0}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button className="w-full py-6 bg-white/[0.03] border border-white/10 rounded-3xl font-black text-[10px] uppercase tracking-[0.4em] text-white/40 hover:bg-white/10 hover:text-white transition-all">
              Export Session Raw
            </button>
          </div>
        </div>
      </LiveMonitor>

      <LiveToolbar />
    </div>
  );
}

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');
