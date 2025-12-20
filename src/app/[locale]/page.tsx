'use client';

import dynamic from 'next/dynamic';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/dressing-room/VTuberApp'), {
  ssr: false,
})

export default function HomePage() {
  return <VTuberApp />;
}