'use client';

import React from 'react';
import Link from 'next/link';
import { AuthButton, AuthInput, SocialButton } from '../../components/auth-ui';

export default function V1SignUp() {
  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex items-center justify-center p-6">
      
      {/* Background Hero Layer */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/v1-assets/fills/d87592b80b239a86f246a1402cbf6bd7068d1e47.png" 
          alt="" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Decorative VRM Model (Left side in Figma) */}
      <div className="absolute left-[-10%] bottom-[-5%] w-[80%] max-w-4xl z-10 pointer-events-none select-none opacity-60">
        <img 
          src="/v1-assets/fills/02695af6fc04511428da61ff52e316cd3119e83e.png" 
          alt="" 
          className="w-full h-auto contrast-125 saturate-0 mix-blend-screen rotate-[10deg]"
        />
      </div>

      {/* Main Auth Card */}
      <div className="relative z-20 w-full max-w-lg bg-black/40 backdrop-blur-3xl border border-white/10 p-12 rounded-[40px] shadow-2xl">
        <div className="space-y-10">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-black text-[#EEFF00] tracking-tighter uppercase italic">Create Account</h1>
            <p className="text-white/40 text-sm font-medium uppercase tracking-widest">Join the ECHUU neural network</p>
          </div>

          <div className="space-y-6">
            <AuthInput label="Email Address" type="email" placeholder="NEURAL_LINK@ECHUU.AI" />
            <AuthInput label="Secret Key" type="password" placeholder="••••••••••••" />
            <AuthButton>Initialize Account</AuthButton>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-black text-white/20"><span className="bg-transparent px-4">OR PROTOCOL</span></div>
          </div>

          <SocialButton 
            icon="/v1-assets/fills/774627be89a12b5733ec566d9e28cb7cbdead78d.png" 
            label="Connect with Google" 
          />

          <p className="text-center text-xs font-bold uppercase tracking-widest text-white/30">
            Already registered? <Link href="/v1/auth/login" className="text-[#EEFF00] hover:underline underline-offset-4">Sign In Protocol</Link>
          </p>
        </div>
      </div>

      {/* Foreground decorative glow */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#EEFF00]/5 blur-[120px] rounded-full z-0" />
    </div>
  );
}
