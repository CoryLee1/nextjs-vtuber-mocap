export default function TestPage() {
  return (
    <div className="min-h-screen bg-vtuber-light flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-vtuber-text mb-4">
          🎉 配置测试成功！
        </h1>
        <p className="text-vtuber-text-light">
          所有配置都正常工作，包括：
        </p>
        <ul className="mt-4 space-y-2 text-sm text-vtuber-text-light">
          <li>✅ Tailwind CSS 配置</li>
          <li>✅ 路径别名 (@/)</li>
          <li>✅ 自定义颜色</li>
          <li>✅ Next.js 配置</li>
        </ul>
        <a 
          href="/" 
          className="inline-block mt-6 bg-vtuber-primary text-white px-4 py-2 rounded-lg hover:bg-vtuber-secondary transition-colors"
        >
          返回主页
        </a>
      </div>
    </div>
  );
} 