'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar, HaloRing, YearText } from '../../components/loading-ui';

export default function LoadingPage2() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => router.push('/v1/loading/3'), 800);
          return 100;
        }
        return prev + 2;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-sans">
      <YearText className="mb-12 relative z-20" />

      <div className="relative w-[435px] h-[350px] flex flex-col items-center">
        <div className="absolute top-[24px] w-[127px] h-[127px] bg-[#3F92FF] overflow-hidden rounded-none z-0 border border-white/5 shadow-[0_0_50px_rgba(63,146,255,0.2)]">
          <img 
            src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" 
            alt="Sky" 
            className="absolute max-w-none w-[2000px] h-auto animate-[spin_180s_linear_infinite] opacity-90"
            style={{ top: '-300px', left: '-800px' }}
          />
          <HaloRing className="scale-[0.6] top-[-5px] left-[-5px] opacity-50" />
        </div>

        <div className="relative z-10 mt-[60px]">
          <img 
            src="/v1-assets/fills/293b789fe4d86a4ee1809d71d5e07312760df7ba.png" 
            alt="Avatar" 
            className="w-[162px] h-auto contrast-125 saturate-110 drop-shadow-[0_0_40px_rgba(238,255,0,0.3)]"
          />
          <img 
            src="/v1-assets/fills/293b789fe4d86a4ee1809d71d5e07312760df7ba.png" 
            alt="Reflection" 
            className="w-[162px] h-auto opacity-30 blur-[3px] transform scale-y-[-1] mt-[-5px]"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center space-y-4">
        <ProgressBar progress={progress} />
        <div className="flex items-center space-x-4 opacity-60 uppercase tracking-[0.5em] text-[7px] font-bold">
          <span className="text-white">SYNCING NEURAL INTERFACE</span>
          <span className="text-[#EEFF00] font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(63,146,255,0.08),transparent_70%)] z-0" />
    </div>
  );
}
