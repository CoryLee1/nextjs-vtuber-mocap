'use client';

import React from 'react';
import nodeImageMap from '../node-image-map.json';

export default function AssetsGallery() {
  const assets = Object.entries(nodeImageMap);

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-4xl font-black text-[#EEFF00] mb-8 uppercase tracking-tighter">Figma Assets Gallery</h1>
      <p className="mb-12 text-white/40">These are the individual components extracted from the Figma design.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {assets.map(([name, ref]) => (
          <div key={name} className="flex flex-col space-y-2 group">
            <div className="aspect-square bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center p-4 group-hover:border-[#EEFF00]/50 transition-all">
              <img 
                src={`/v1-assets/fills/${ref}.png`} 
                alt={name} 
                className="max-w-full max-h-full object-contain shadow-2xl"
              />
            </div>
            <div className="px-2">
              <h3 className="text-[10px] font-bold text-white/60 uppercase truncate tracking-wider" title={name}>{name}</h3>
              <p className="text-[8px] text-white/20 font-mono">{ref.substring(0, 8)}...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
