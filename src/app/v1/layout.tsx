import React from 'react';

export default function V1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {children}
    </div>
  );
}
