'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import LoadingPage from '@/components/ui/LoadingPage';
import OnboardingGuide from '@/components/ui/OnboardingGuide';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/dressing-room/VTuberApp'), {
  ssr: false,
})

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 模拟加载完成后的逻辑
  const handleLoadingComplete = () => {
    setIsLoading(false);
    // 加载完成后显示新手引导
    setShowOnboarding(true);
  };

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      {/* 1. 开屏加载页 */}
      {isLoading && (
        <LoadingPage onComplete={handleLoadingComplete} duration={3000} />
      )}

      {/* 2. 主应用 */}
      {!isLoading && <VTuberApp />}

      {/* 3. 新手引导 */}
      {showOnboarding && !isLoading && (
        <OnboardingGuide 
          onComplete={() => setShowOnboarding(false)} 
          onSkip={() => setShowOnboarding(false)} 
        />
      )}
    </main>
  );
}
