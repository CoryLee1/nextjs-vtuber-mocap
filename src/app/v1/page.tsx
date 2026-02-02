import Link from 'next/link';
import React from 'react';

const pages = [
  { name: 'Loading Animation 1', path: '/v1/loading/1', nodeId: '632:773' },
  { name: 'Loading Animation 2', path: '/v1/loading/2', nodeId: '632:762' },
  { name: 'Loading Animation 3', path: '/v1/loading/3', nodeId: '632:749' },
  { name: 'Main Page', path: '/v1/main', nodeId: '632:738' },
  { name: 'Sign Up', path: '/v1/auth/signup', nodeId: '632:692' },
  { name: 'Login', path: '/v1/auth/login', nodeId: '632:784' },
  { name: 'OC Selection', path: '/v1/auth/oc-selection', nodeId: '632:819' },
  { name: 'Settings 1', path: '/v1/settings/1', nodeId: '632:709' },
  { name: 'Settings 2', path: '/v1/settings/2', nodeId: '632:854' },
  { name: 'Settings 3', path: '/v1/settings/3', nodeId: '632:887' },
  { name: 'Settings 4', path: '/v1/settings/4', nodeId: '632:981' },
  { name: 'Live UI 1', path: '/v1/live/1', nodeId: '632:1018' },
  { name: 'Live UI 2', path: '/v1/live/2', nodeId: '632:1105' },
  { name: 'Live UI 3', path: '/v1/live/3', nodeId: '632:1196' },
  { name: 'Live UI 4', path: '/v1/live/4', nodeId: '632:1287' },
  { name: 'Live UI 5', path: '/v1/live/5', nodeId: '632:1378' },
  { name: 'Live UI 6', path: '/v1/live/6', nodeId: '632:1469' },
  { name: 'MVP', path: '/v1/mvp', nodeId: '632:1560' },
  { name: '📦 DOWNLOADED ASSETS', path: '/v1/assets', nodeId: 'LOCAL' },
];

export default function V1Index() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8 text-[#EEFF00]">ECHUU V1 UI Index</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {pages.map((page) => (
          <Link 
            key={page.path} 
            href={page.path}
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group relative overflow-hidden"
          >
            <h2 className="text-xl font-semibold mb-2 group-hover:text-[#EEFF00] relative z-10">{page.name}</h2>
            <p className="text-white/40 text-sm relative z-10">Node ID: {page.nodeId}</p>
            {page.nodeId !== 'LOCAL' && (
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <img src={`/v1-assets/${page.nodeId.replace(':', '-')}.png`} alt="" className="w-20 h-20 object-cover rounded-lg" />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
