import dynamic from 'next/dynamic';
import Head from 'next/head';
import { ANIMATION_CONFIG } from '@/utils/constants';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/VTuberApp.jsx'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-vtuber-light to-vtuber-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vtuber-primary mx-auto mb-4"></div>
        <p className="text-vtuber-text text-xl font-medium">Loading Animation Test...</p>
        <p className="text-vtuber-text-light text-sm mt-2">正在加载动画测试页面...</p>
      </div>
    </div>
  ),
});

export default function AnimationTestPage() {
  return (
    <>
      <Head>
        <title>Animation Test | 动画测试页面</title>
        <meta name="description" content="VTuber 动画配置测试页面" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* 动画配置信息显示 */}
      <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-vtuber-blue-200 max-w-md">
        <h3 className="text-lg font-semibold text-vtuber-text mb-2">🎬 动画配置信息</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-vtuber-text">动画类型:</span>
            <div className="text-vtuber-text-light mt-1">
              {ANIMATION_CONFIG.TYPES.map((type, index) => (
                <span key={index} className="inline-block bg-vtuber-blue-100 text-vtuber-blue-800 px-2 py-1 rounded mr-1 mb-1 text-xs">
                  {type}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-vtuber-text">动画文件:</span>
            <div className="text-vtuber-text-light mt-1">
              {Object.entries(ANIMATION_CONFIG.ANIMATION_FILES).map(([name, path]) => (
                <div key={name} className="text-xs">
                  <span className="font-medium">{name}:</span> {path}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-vtuber-text">动画分类:</span>
            <div className="text-vtuber-text-light mt-1">
              {Object.entries(ANIMATION_CONFIG.CATEGORIES).map(([category, animations]) => (
                <div key={category} className="text-xs">
                  <span className="font-medium capitalize">{category}:</span> {animations.join(', ')}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-vtuber-text">阻尼设置:</span>
            <div className="text-vtuber-text-light mt-1">
              {Object.entries(ANIMATION_CONFIG.SMOOTHING).map(([key, value]) => (
                <div key={key} className="text-xs">
                  <span className="font-medium">{key}:</span> {value}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <VTuberApp />
    </>
  );
} 