import dynamic from 'next/dynamic';
import Head from 'next/head';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/VTuberApp.jsx'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-vtuber-light to-vtuber-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vtuber-primary mx-auto mb-4"></div>
        <p className="text-vtuber-text text-xl font-medium">Loading Test Page...</p>
        <p className="text-vtuber-text-light text-sm mt-2">正在加载测试页面...</p>
      </div>
    </div>
  ),
});

export default function TestPage() {
  return (
    <>
      <Head>
        <title>VTuber Animation Test | 动画测试页面</title>
        <meta name="description" content="VTuber 动画功能测试页面" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <VTuberApp />
    </>
  );
} 