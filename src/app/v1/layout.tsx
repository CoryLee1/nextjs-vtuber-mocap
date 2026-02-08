import React from 'react';

export default function V1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-hidden bg-black text-white font-sans">
      {children}
    </div>
  );
}
