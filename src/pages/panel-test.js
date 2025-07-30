import dynamic from 'next/dynamic';
import Head from 'next/head';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/VTuberApp.jsx'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-vtuber-light to-vtuber-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vtuber-primary mx-auto mb-4"></div>
        <p className="text-vtuber-text text-xl font-medium">Loading Panel Test...</p>
        <p className="text-vtuber-text-light text-sm mt-2">正在加载面板测试页面...</p>
      </div>
    </div>
  ),
});

export default function PanelTestPage() {
  return (
    <>
      <Head>
        <title>Panel Test | 面板测试页面</title>
        <meta name="description" content="VTuber 可拖拽面板测试页面" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* 测试说明 */}
      <div className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-vtuber-blue-200 max-w-md">
        <h3 className="text-lg font-semibold text-vtuber-text mb-2">🎛️ 可拖拽面板测试</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-vtuber-text">功能说明:</span>
            <div className="text-vtuber-text-light mt-1 space-y-1">
              <div>• 所有UI面板现在都是可拖拽的</div>
              <div>• 可以调整面板大小（右下角拖拽）</div>
              <div>• 面板位置会自动保存</div>
              <div>• 支持最小化/关闭功能</div>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-vtuber-text">测试步骤:</span>
            <div className="text-vtuber-text-light mt-1 space-y-1">
              <div>1. 点击右下角按钮打开各种面板</div>
              <div>2. 拖拽面板标题栏移动位置</div>
              <div>3. 拖拽右下角调整面板大小</div>
              <div>4. 测试最小化和关闭功能</div>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-vtuber-text">面板列表:</span>
            <div className="text-vtuber-text-light mt-1 space-y-1">
              <div>• 🎬 动画调试面板（黄色按钮）</div>
              <div>• 🎭 模型管理器（蓝色按钮）</div>
              <div>• 🎬 动画库（紫色按钮）</div>
              <div>• 🎛️ 控制面板（菜单按钮）</div>
              <div>• ⚙️ 平滑设置（控制面板内）</div>
              <div>• 🦾 手臂测试（控制面板内）</div>
              <div>• 🤚 手部调试（控制面板内）</div>
            </div>
          </div>
        </div>
      </div>
      
      <VTuberApp />
    </>
  );
} 