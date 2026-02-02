'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LoadingPageProps {
  onComplete?: () => void;
  message?: string;
  duration?: number;
  exitOnComplete?: boolean;
}

/**
 * Figma Loading Page - Ultra Precise Implementation
 * Based on latest parameters: Content (254x323), Centered
 */
export default function LoadingPage({ 
  onComplete, 
  message = "Initializing...", 
  duration = 3000,
  exitOnComplete = true
}: LoadingPageProps) {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showContent, setShowContent] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        clearInterval(interval);
        
        // 如果不需要自动退出（如测试模式），直接调用完成回调并停止
        if (!exitOnComplete) {
          onComplete?.();
          return;
        }

        setTimeout(() => {
          setShowContent(false);
          setTimeout(() => {
            setIsFinished(true);
            onComplete?.();
          }, 800);
        }, 500);
      }
    }, 16);

    return () => clearInterval(interval);
  }, [duration, onComplete, exitOnComplete]);

  if (isFinished) return null;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] bg-black transition-opacity duration-1000 ease-in-out font-['MHTIROGLA',sans-serif]",
      showContent ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      {/* 
        Content Wrapper: 永远处于画面正中央
        Figma Dimensions: 254px x 323px
      */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[254px] h-[323px] pointer-events-auto">
          
          {/* 1. Txt/H1_Year (Top: 319px in Figma, relative to Content top: 0px) */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 text-white font-medium"
            style={{
              width: '319px',
              height: '9px',
              top: '0px',
              fontSize: '8px',
              lineHeight: '9px',
              textAlign: 'center',
              letterSpacing: '2.71em',
              zIndex: 10
            }}
          >
            2025-2026
          </div>

          {/* 2. Env/Window_HDR (Top: 343px in Figma, relative to Content top: 24px) */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 overflow-hidden bg-[#3F92FF]"
            style={{
              width: '127px',
              height: '127px',
              top: '24px',
              zIndex: 1
            }}
          >
            {/* HDR/sky-3js */}
            <img 
              src="/images/HDRSky.png" 
              alt="Sky" 
              className="absolute max-w-none animate-[spin_180s_linear_infinite]"
              style={{
                width: '2065px',
                height: '1153px',
                left: 'calc(50% - 2065px/2)',
                top: '-513px',
              }}
            />
            
            {/* Mesh/Halo_Ring (光环) */}
          <div 
            className="absolute"
            style={{
              width: '105.22px',
              height: '49.84px',
              left: '9px',
              top: '41px',
              border: '5px solid #EEFF00',
              borderRadius: '50%',
              transform: 'matrix(0.68, -0.73, 0.73, 0.68, 0, 0)',
              boxSizing: 'border-box',
              boxShadow: '0 0 20px rgba(238, 255, 0, 0.3)'
            }}
          />
        </div>

        {/* 3. Model/Avatar_VRM - Adjusted to keep feet on loading bar at 205.43px */}
        <div 
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: '435px',
            height: '234px',
            top: '-11.57px', // Calculated to align feet (at 217px) with loading bar (205.43px)
            zIndex: 5
          }}
        >
          {/* Asset/Avatar_Mesh_CoryVrm (主体) */}
          <img 
            src="/images/loading/reflection.png" 
            alt="Avatar" 
            className="absolute"
            style={{
              width: '435px',
              height: '234px',
              left: '7px',
              top: '31px',
              objectFit: 'contain'
            }}
          />
            
            {/* Asset/Avatar_Mesh_CoryVrm_reflection (倒影) */}
            <img 
              src="/images/loading/reflection.png" 
              alt="Reflection" 
              className="absolute opacity-20 blur-[1px]"
              style={{
                width: '346px',
                height: '211px',
                left: 'calc(50% - 346px/2 - 1.8px)',
                top: '217px', // Starts at the bottom of the avatar
                transform: 'matrix(1, 0, 0, -1, 0, 0)',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* 4. UI/Progress_Bar (Top: 524.43px in Figma, relative to Content top: 205.43px) */}
          <div 
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              width: '254px',
              height: '0.91px',
              top: '205.43px',
              zIndex: 10
            }}
          >
            {/* Bar/Track */}
            <div 
              className="absolute inset-0 bg-[#D9D9D9] opacity-30"
              style={{ borderRadius: '19px' }}
            />
            
            {/* Bar/Fill */}
            <div 
              className="absolute h-full bg-[#EEFF00] shadow-[0_0_10px_#EEFF00]"
              style={{ 
                width: `${(progress / 100) * 190.5}px`, // Max width 190.5px
                left: 'calc(50% - 190.5px/2 - 31.25px)', // Figma offset
                borderRadius: '19px',
                transition: 'width 0.3s ease-out'
              }}
            />
          </div>

          {/* Optional: System Message */}
          <div className="absolute top-[213px] left-1/2 -translate-x-1/2 flex items-center space-x-2 opacity-20">
            <span className="text-[7px] text-white uppercase tracking-[0.5em] font-bold">{message}</span>
            <span className="text-[7px] text-[#EEFF00] font-['MHTIROGLA']">{Math.round(progress)}%</span>
          </div>

        </div>
      </div>

      {/* Global Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(63,146,255,0.04),transparent_70%)]" />
      </div>
    </div>
  );
}
