import Link from 'next/link';

export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          🎉 简单测试成功！
        </h1>
        <p className="text-gray-600">
          基本配置正常工作
        </p>
        <div className="mt-4 space-y-2">
          <div className="bg-blue-100 p-2 rounded">✅ Tailwind CSS</div>
          <div className="bg-green-100 p-2 rounded">✅ Next.js</div>
          <div className="bg-yellow-100 p-2 rounded">✅ 基本样式</div>
        </div>
        <Link 
          href="/" 
          className="inline-block mt-6 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          返回主页
        </Link>
      </div>
    </div>
  );
} 