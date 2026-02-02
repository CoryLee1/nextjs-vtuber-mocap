'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar, HaloRing, YearText } from '../../components/loading-ui';

export default function LoadingPage3() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => router.push('/v1/main'), 800);
          return 100;
        }
        return prev + 4;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-sans">
      <YearText className="mb-12 relative z-20" />

      <div className="relative w-[435px] h-[350px] flex flex-col items-center">
        <div className="absolute top-[24px] w-[127px] h-[127px] bg-[#3F92FF] overflow-hidden rounded-none z-0 border border-white/10 shadow-[0_0_80px_rgba(238,255,0,0.15)]">
          <img 
            src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" 
            alt="Sky" 
            className="absolute max-w-none w-[2000px] h-auto animate-[spin_60s_linear_infinite] opacity-100"
            style={{ top: '-250px', left: '-700px' }}
          />
          <HaloRing className="scale-[0.8] top-[-2px] left-[-2px] opacity-80 animate-pulse" />
        </div>

        <div className="relative z-10 mt-[60px] animate-[bounce_4s_ease-in-out_infinite]">
          <img 
            src="/v1-assets/fills/293b789fe4d86a4ee1809d71d5e07312760df7ba.png" 
            alt="Avatar" 
            className="w-[162px] h-auto contrast-150 saturate-125 drop-shadow-[0_0_50px_#EEFF00]"
          />
          <img 
            src="/v1-assets/fills/293b789fe4d86a4ee1809d71d5e07312760df7ba.png" 
            alt="Reflection" 
            className="w-[162px] h-auto opacity-50 blur-[4px] transform scale-y-[-1] mt-[-5px]"
          />
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center space-y-4">
        <ProgressBar progress={progress} />
        <div className="flex items-center space-x-4 opacity-100 uppercase tracking-[0.5em] text-[7px] font-black">
          <span className="text-white">FINALIZING AVATAR RENDER</span>
          <span className="text-[#EEFF00] font-mono animate-pulse">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(238,255,0,0.05),transparent_70%)] z-0" />
    </div>
  );
}
