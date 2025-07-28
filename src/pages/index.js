import dynamic from 'next/dynamic';
import Head from 'next/head';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/VTuberApp'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-vtuber-light to-vtuber-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vtuber-primary mx-auto mb-4"></div>
        <p className="text-vtuber-text text-xl font-medium">Loading VTuber App...</p>
        <p className="text-vtuber-text-light text-sm mt-2">正在加载虚拟形象系统...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <Head>
        <title>VTuber Motion Capture | 虚拟形象动捕系统</title>
        <meta name="description" content="基于 Next.js 和 Three.js 的实时虚拟形象动作捕捉应用" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Open Graph 标签 */}
        <meta property="og:title" content="VTuber Motion Capture" />
        <meta property="og:description" content="实时虚拟形象动作捕捉应用" />
        <meta property="og:type" content="website" />
        
        {/* Twitter 标签 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="VTuber Motion Capture" />
        <meta name="twitter:description" content="实时虚拟形象动作捕捉应用" />
      </Head>
      
      <VTuberApp />
    </>
  );
}