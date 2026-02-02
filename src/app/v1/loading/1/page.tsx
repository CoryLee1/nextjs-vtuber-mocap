'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressBar, HaloRing, YearText } from '../../components/loading-ui';

export default function LoadingPage1() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => router.push('/v1/loading/2'), 800);
          return 100;
        }
        return prev + 1.5;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* 1. Header Year */}
      <YearText className="mb-12 relative z-20" />

      {/* 2. Central Window & Avatar Container */}
      <div className="relative w-[435px] h-[350px] flex flex-col items-center">
        
        {/* Sky Window (Env/Window_HDR) */}
        <div className="absolute top-[24px] w-[127px] h-[127px] bg-[#3F92FF] overflow-hidden rounded-none z-0 border border-white/5">
          <img 
            src="/v1-assets/fills/e8959a7f36ded52b294d44ee475fbcdc8df3f1a3.png" 
            alt="Sky" 
            className="absolute max-w-none w-[2000px] h-auto animate-[spin_120s_linear_infinite] opacity-80"
            style={{ top: '-400px', left: '-900px' }}
          />
          {/* Halo Ring Inside Window */}
          <HaloRing className="scale-50 top-[-10px] left-[-10px]" />
        </div>

        {/* Avatar (Asset/Avatar_Mesh_CoryVrm) */}
        <div className="relative z-10 mt-[60px]">
          <img 
            src="/v1-assets/fills/293b789fe4d86a4ee1809d71d5e07312760df7ba.png" 
            alt="Avatar" 
            className="w-[162px] h-auto drop-shadow-[0_0_30px_rgba(238,255,0,0.2)]"
          />
          {/* Reflection */}
          <img 
            src="/v1-assets/fills/293b789fe4d86a4ee1809d71d5e07312760df7ba.png" 
            alt="Reflection" 
            className="w-[162px] h-auto opacity-20 blur-[2px] transform scale-y-[-1] mt-[-5px]"
          />
        </div>
      </div>

      {/* 3. Progress Bar & Status */}
      <div className="mt-8 flex flex-col items-center space-y-4">
        <ProgressBar progress={progress} />
        <div className="flex items-center space-x-4 opacity-40 uppercase tracking-[0.5em] text-[7px] font-bold">
          <span className="text-white">INITIALIZING SYSTEM</span>
          <span className="text-[#EEFF00] font-mono">{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(63,146,255,0.05),transparent_70%)] z-0" />
    </div>
  );
}
