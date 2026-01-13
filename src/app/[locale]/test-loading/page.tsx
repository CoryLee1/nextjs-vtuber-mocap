'use client';

import React, { useState } from 'react';
import LoadingPage from '@/components/ui/LoadingPage';
import { RefreshCcw } from 'lucide-react';

export default function TestLoadingPage() {
  const [key, setKey] = useState(0);
  const [isDone, setIsDone] = useState(false);

  const handleRestart = () => {
    setKey(prev => prev + 1);
    setIsDone(false);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* 
        This is the Loading Page component.
        Isolated from the 3D scene.
      */}
      <LoadingPage 
        key={key}
        onComplete={() => setIsDone(true)} 
        duration={5000}
        message="LOADING"
        exitOnComplete={false}
      />

      {/* Debug Controls Overlay */}
      <div className="fixed bottom-8 right-8 z-[110] flex flex-col items-end space-y-4">
        {isDone && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#ef0]/10 text-[#ef0] text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-2xl border border-[#ef0]/20 backdrop-blur-xl shadow-2xl font-['MHTIROGLA',sans-serif]">
              Load Sequence Complete
            </div>
          </div>
        )}
        
        <button 
          onClick={handleRestart}
          className="group relative flex items-center justify-center w-14 h-14 bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-xl rounded-2xl transition-all duration-300 hover:scale-110 active:scale-95"
          title="Restart Animation"
        >
          <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* Grid Overlay for alignment check */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[105]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>
    </div>
  );
}
