import dynamic from 'next/dynamic'

// 动态导入 VTuber 组件（避免 SSR 问题）
const VTuberApp = dynamic(() => import('@/components/dressing-room/VTuberApp'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gradient-to-br from-white via-sky-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-500 mx-auto mb-4"></div>
        <p className="text-sky-900 text-xl font-medium">Loading VTuber App...</p>
        <p className="text-sky-600 text-sm mt-2">正在加载虚拟形象系统...</p>
      </div>
    </div>
  ),
})

export default function HomePage() {
  return <VTuberApp />
} 