import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className }: ProgressBarProps) => {
  return (
    <div className={cn("relative w-[254px] h-[1px]", className)}>
      {/* Track */}
      <div className="absolute inset-0 bg-[#D9D9D9] opacity-30 rounded-[19px]" />
      {/* Fill */}
      <div 
        className="absolute h-full bg-[#EEFF00] shadow-[0_0_10px_#EEFF00] rounded-[19px] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const HaloRing = ({ className }: { className?: string }) => {
  return (
    <div 
      className={cn(
        "absolute w-[108px] h-[111px] border-[5px] border-[#EEFF00] rounded-full",
        className
      )}
      style={{
        transform: 'matrix(0.68, -0.73, 0.73, 0.68, 0, 0)',
        boxShadow: '0 0 20px rgba(238, 255, 0, 0.3)'
      }}
    />
  );
};

export const YearText = ({ className }: { className?: string }) => {
  return (
    <div className={cn("text-white text-[8px] font-medium tracking-[2.71em] text-center uppercase", className)}>
      2025-2026
    </div>
  );
};
