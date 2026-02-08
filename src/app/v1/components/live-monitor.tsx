import React from 'react';
import { cn } from '@/lib/utils';

interface LiveMonitorProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const LiveMonitor = ({ title, subtitle, children, className }: LiveMonitorProps) => {
  return (
    <div className={cn(
      "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-[1000px] h-[85vh] max-h-[600px] z-30",
      "bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[60px] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500",
      className
    )}>
      {/* Monitor Header */}
      <div className="p-10 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-white/[0.02] to-transparent">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#EEFF00] italic uppercase tracking-tighter italic">{title}</h2>
          {subtitle && <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em]">{subtitle}</p>}
        </div>
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-[#EEFF00] rounded-full shadow-[0_0_10px_#EEFF00]" />
          <div className="w-2 h-2 bg-white/10 rounded-full" />
          <div className="w-2 h-2 bg-white/10 rounded-full" />
        </div>
      </div>

      {/* Monitor Content */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        {children}
      </div>

      {/* Monitor Footer */}
      <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/[0.01]">
        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest italic">ECHUU Neural Interface System // Secure Link</span>
        <div className="flex space-x-4">
          <div className="text-[10px] font-black text-[#EEFF00] animate-pulse">SYSTEM_ACTIVE</div>
        </div>
      </div>
    </div>
  );
};

export const CharacterSettingItem = ({ label, value, active }: { label: string, value: string, active?: boolean }) => {
  return (
    <div className={cn(
      "p-6 rounded-3xl border transition-all cursor-pointer group",
      active ? "bg-[#EEFF00] border-[#EEFF00]" : "bg-white/5 border-white/10 hover:bg-white/10"
    )}>
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "text-black/40" : "text-white/20")}>{label}</span>
          <h4 className={cn("text-lg font-black uppercase italic", active ? "text-black" : "text-white")}>{value}</h4>
        </div>
        <div className={cn(
          "w-8 h-8 rounded-full border flex items-center justify-center transition-all",
          active ? "border-black/20 bg-black/10" : "border-white/10 bg-white/5 group-hover:border-[#EEFF00]/40"
        )}>
          {active ? <span className="text-black">✓</span> : <span className="text-white/20 group-hover:text-[#EEFF00] opacity-0 group-hover:opacity-100">+</span>}
        </div>
      </div>
    </div>
  );
};
