'use client';

import React from 'react';
import Link from 'next/link';
import { AuthButton } from '../../components/auth-ui';

export default function V1OCSelection() {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex items-center justify-center p-6 font-sans">
      
      {/* Background with individual fill */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/v1-assets/fills/0fe1ad8c32b0c941dac59e7b6a441fc63cde4581.png" 
          alt="" 
          className="w-full h-full object-cover opacity-30 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Glow Effect */}
      <img 
        src="/v1-assets/fills/05ec3f3c942b2d3110f63964d8f034cfeb96f4dc.png" 
        alt="" 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-contain opacity-20 pointer-events-none"
      />

      <div className="relative z-20 w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-white/[0.02] border border-white/5 backdrop-blur-xl p-16 rounded-[60px]">
        
        {/* Left: Character Preview */}
        <div className="relative aspect-[3/4] bg-gradient-to-b from-[#EEFF00]/10 to-transparent rounded-[40px] overflow-hidden border border-[#EEFF00]/20 group">
          <img 
            src="/v1-assets/fills/5d1922244660c316f1a6c79a953d8538e0a0d1e1.png" 
            alt="OC Preview" 
            className="w-full h-full object-contain transform group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10">
            <span className="text-[10px] font-black text-[#EEFF00] tracking-widest uppercase">Last OC Sync: 2026.02.01</span>
          </div>
        </div>

        {/* Right: Choice Panel */}
        <div className="space-y-12">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-[#EEFF00] tracking-tighter uppercase italic leading-tight">Resume<br />Neural Link?</h1>
            <p className="text-white/60 text-lg">You have an active Agent configuration from your previous session. Choose your protocol.</p>
          </div>

          <div className="space-y-4">
            <Link href="/v1/settings/1" className="block">
              <AuthButton className="h-20 text-lg">Resume Current OC</AuthButton>
            </Link>
            <Link href="/v1/settings/1" className="block">
              <AuthButton variant="secondary" className="h-20 text-lg">Initialize New Agent</AuthButton>
            </Link>
          </div>

          <div className="pt-8 border-t border-white/5">
            <div className="flex items-center justify-between opacity-40">
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Slots Used</span>
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[#EEFF00] rounded-full shadow-[0_0_5px_#EEFF00]" />
                <div className="w-2 h-2 bg-white/20 rounded-full" />
                <div className="w-2 h-2 bg-white/20 rounded-full" />
              </div>
            </div>
            <p className="mt-4 text-[9px] text-white/20 uppercase tracking-widest leading-relaxed">
              * Max protocol capacity: 3 Agents per neural link. Additional slots require system upgrade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
