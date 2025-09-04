'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LoadingPage from '@/components/ui/LoadingPage';
import OnboardingGuide from '@/components/ui/OnboardingGuide';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/dressing-room/VTuberApp'), {
  ssr: false,
  loading: () => <LoadingPage message="Loading VTuber App..." duration={2000} />,
})

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 确保在客户端渲染
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  // 在客户端渲染后直接显示新手引导（每次刷新都显示）
  useEffect(() => {
    if (isClient && !isLoading) {
      setShowOnboarding(true);
    }
  }, [isClient, isLoading]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
    // 不保存到localStorage，这样刷新后会重新显示
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setHasCompletedOnboarding(true);
    // 不保存到localStorage，这样刷新后会重新显示
  };

  // 在服务器端渲染时显示loading
  if (!isClient || isLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} message="Initializing..." duration={3000} />;
  }

  if (showOnboarding) {
    return (
      <OnboardingGuide 
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  return <VTuberApp />;
}