import dynamic from 'next/dynamic';
import Head from 'next/head';

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/VTuberApp.jsx'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-vtuber-light to-vtuber-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-vtuber-primary mx-auto mb-4"></div>
        <p className="text-vtuber-text text-xl font-medium">Loading Debug Test...</p>
        <p className="text-vtuber-text-light text-sm mt-2">正在加载调试测试页面...</p>
      </div>
    </div>
  ),
});

export default function DebugTestPage() {
  return (
    <>
      <Head>
        <title>Debug Test | 调试测试页面</title>
        <meta name="description" content="VTuber 动画调试面板测试页面" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      {/* 调试信息显示 */}
      <div className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-vtuber-blue-200 max-w-md">
        <h3 className="text-lg font-semibold text-vtuber-text mb-2">🐛 调试测试页面</h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-vtuber-text">功能说明:</span>
            <div className="text-vtuber-text-light mt-1 space-y-1">
              <div>• 动画调试面板已集成到主应用</div>
              <div>• 点击右下角黄色按钮切换调试面板</div>
              <div>• 调试面板显示动画状态、VRM状态、手部检测</div>
              <div>• 支持手动控制动画模式切换</div>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-vtuber-text">测试步骤:</span>
            <div className="text-vtuber-text-light mt-1 space-y-1">
              <div>1. 开启摄像头（右下角红色按钮）</div>
              <div>2. 显示动画调试面板（右下角黄色按钮）</div>
              <div>3. 举起手测试动捕模式切换</div>
              <div>4. 使用调试面板的手动控制按钮</div>
            </div>
          </div>
          
          <div>
            <span className="font-medium text-vtuber-text">调试面板位置:</span>
            <div className="text-vtuber-text-light mt-1">
              左上角（可展开/收起）
            </div>
          </div>
        </div>
      </div>
      
      <VTuberApp />
    </>
  );
} 