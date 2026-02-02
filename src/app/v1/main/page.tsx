import React from 'react';
import Link from 'next/link';

export default function V1MainPage() {
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <img 
        src="/v1-assets/632-738.png" 
        alt="Main Page" 
        className="absolute inset-0 w-full h-full object-contain opacity-80"
      />
      
      {/* Interactive Overlay for Navigation Testing */}
      <div className="absolute top-6 left-6 flex space-x-4 z-50">
        <Link href="/v1" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-all">
          BACK TO INDEX
        </Link>
        <Link href="/v1/auth/signup" className="px-4 py-2 bg-[#EEFF00]/20 hover:bg-[#EEFF00]/40 text-[#EEFF00] rounded-lg text-xs font-bold transition-all">
          GO TO AUTH
        </Link>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/20 text-[10px] tracking-[1em] uppercase font-black">
        ECHUU SYSTEM V1.0.0
      </div>
    </div>
  );
}
