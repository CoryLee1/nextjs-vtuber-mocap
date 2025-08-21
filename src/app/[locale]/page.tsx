'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import LoadingPage from '@/components/ui/LoadingPage';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/dressing-room/VTuberApp'), {
  ssr: false,
  loading: () => <LoadingPage message="Loading VTuber App..." duration={2000} />,
})

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} message="Initializing..." duration={3000} />;
  }

  return <VTuberApp />;
}