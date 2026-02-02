import React from 'react';
import { cn } from '@/lib/utils';

export const SettingsSidebar = ({ activeId }: { activeId: number }) => {
  const items = [
    { id: 1, label: 'General Protocol', icon: '⚡' },
    { id: 2, label: 'Audio Frequency', icon: '🔊' },
    { id: 3, label: 'Visual Interface', icon: '👁️' },
    { id: 4, label: 'Neural Export', icon: '💾' },
  ];

  return (
    <div className="w-80 h-full bg-black/40 backdrop-blur-3xl border-r border-white/5 p-8 flex flex-col space-y-4">
      <div className="mb-12">
        <h2 className="text-[#EEFF00] font-black text-2xl tracking-tighter italic uppercase">System Config</h2>
        <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Version 1.0.0_rev2</p>
      </div>
      {items.map(item => (
        <a 
          key={item.id} 
          href={`/v1/settings/${item.id}`}
          className={cn(
            "flex items-center space-x-4 p-4 rounded-2xl transition-all group",
            activeId === item.id ? "bg-[#EEFF00] text-black" : "hover:bg-white/5 text-white/40"
          )}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="font-black text-xs uppercase tracking-widest">{item.label}</span>
        </a>
      ))}
    </div>
  );
};

export const SettingsCard = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => {
  return (
    <div className={cn("bg-white/[0.03] border border-white/5 rounded-[32px] p-8 space-y-8", className)}>
      <h3 className="text-[10px] font-black text-[#EEFF00] uppercase tracking-[0.4em] mb-4 opacity-80">{title}</h3>
      {children}
    </div>
  );
};

export const SettingsToggle = ({ label, description, enabled }: { label: string, description: string, enabled: boolean }) => {
  return (
    <div className="flex items-center justify-between group cursor-pointer">
      <div className="space-y-1">
        <h4 className="font-bold text-white uppercase tracking-wider">{label}</h4>
        <p className="text-xs text-white/30">{description}</p>
      </div>
      <div className={cn(
        "w-14 h-8 rounded-full relative transition-all duration-500 border",
        enabled ? "bg-[#EEFF00] border-[#EEFF00]" : "bg-white/5 border-white/10"
      )}>
        <div className={cn(
          "absolute top-1 w-5 h-5 rounded-full transition-all duration-500 shadow-xl",
          enabled ? "right-1 bg-black" : "left-1 bg-white/20"
        )} />
      </div>
    </div>
  );
};
