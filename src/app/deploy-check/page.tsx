'use client';

import React, { useEffect, useState } from 'react';

export default function DeployCheckPage() {
  const [envVars, setEnvVars] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查客户端环境变量
    const clientEnvVars = {
      'NEXT_PUBLIC_POSTHOG_KEY': process.env.NEXT_PUBLIC_POSTHOG_KEY,
      'NEXT_PUBLIC_POSTHOG_HOST': process.env.NEXT_PUBLIC_POSTHOG_HOST,
      'NEXT_PUBLIC_S3_BUCKET': process.env.NEXT_PUBLIC_S3_BUCKET,
      'NEXT_PUBLIC_S3_REGION': process.env.NEXT_PUBLIC_S3_REGION,
      'NEXT_PUBLIC_S3_BASE_URL': process.env.NEXT_PUBLIC_S3_BASE_URL,
      'NODE_ENV': process.env.NODE_ENV,
      'NEXT_PUBLIC_APP_VERSION': process.env.NEXT_PUBLIC_APP_VERSION,
    };

    setEnvVars(clientEnvVars);
    setIsLoading(false);
  }, []);

  const checkPostHogStatus = () => {
    if (typeof window !== 'undefined' && (window as any).posthog) {
      return {
        initialized: true,
        hasKey: !!(window as any).posthog?.__loaded,
        canTrack: !!(window as any).posthog?.capture
      };
    }
    return { initialized: false, hasKey: false, canTrack: false };
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const posthogStatus = checkPostHogStatus();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">部署环境检查</h1>
      
      {/* 环境信息 */}
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">环境信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="font-medium">环境:</span>
            <span className={`font-mono ${
              envVars.NODE_ENV === 'production' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {envVars.NODE_ENV || 'development'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">版本:</span>
            <span className="font-mono text-gray-600">
              {envVars.NEXT_PUBLIC_APP_VERSION || '1.0.0'}
            </span>
          </div>
        </div>
      </div>

      {/* PostHog 配置 */}
      <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-800">PostHog 配置</h2>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">API Key:</span>
            <span className={`font-mono ${
              envVars.NEXT_PUBLIC_POSTHOG_KEY ? 'text-green-600' : 'text-red-600'
            }`}>
              {envVars.NEXT_PUBLIC_POSTHOG_KEY ? '✅ 已配置' : '❌ 未配置'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Host:</span>
            <span className="font-mono text-gray-600">
              {envVars.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">初始化状态:</span>
            <span className={`font-mono ${
              posthogStatus.initialized ? 'text-green-600' : 'text-red-600'
            }`}>
              {posthogStatus.initialized ? '✅ 已初始化' : '❌ 未初始化'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">跟踪功能:</span>
            <span className={`font-mono ${
              posthogStatus.canTrack ? 'text-green-600' : 'text-red-600'
            }`}>
              {posthogStatus.canTrack ? '✅ 可用' : '❌ 不可用'}
            </span>
          </div>
        </div>
      </div>

      {/* S3 配置 */}
      <div className="p-6 bg-green-50 border border-green-200 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-800">AWS S3 配置</h2>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">存储桶:</span>
            <span className="font-mono text-gray-600">
              {envVars.NEXT_PUBLIC_S3_BUCKET || '未配置'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">区域:</span>
            <span className="font-mono text-gray-600">
              {envVars.NEXT_PUBLIC_S3_REGION || '未配置'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">基础URL:</span>
            <span className="font-mono text-gray-600">
              {envVars.NEXT_PUBLIC_S3_BASE_URL || '未配置'}
            </span>
          </div>
        </div>
      </div>

      {/* 部署建议 */}
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-yellow-800">部署建议</h2>
        <div className="space-y-4">
          {!envVars.NEXT_PUBLIC_POSTHOG_KEY && (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="font-medium text-red-700 mb-2">⚠️ PostHog 配置缺失</h3>
              <p className="text-sm text-red-600 mb-2">
                在生产环境中需要配置以下环境变量：
              </p>
              <pre className="text-xs bg-red-100 p-2 rounded">
{`NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com`}
              </pre>
            </div>
          )}
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="font-medium text-blue-700 mb-2">📋 部署平台配置</h3>
            <div className="text-sm text-blue-600 space-y-2">
              <p><strong>Vercel:</strong> 在项目设置 → Environment Variables 中添加</p>
              <p><strong>Netlify:</strong> 在 Site settings → Environment variables 中添加</p>
              <p><strong>Railway:</strong> 在项目设置 → Variables 中添加</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-700 mb-2">✅ 验证步骤</h3>
            <ol className="text-sm text-green-600 space-y-1 list-decimal list-inside">
              <li>在部署平台配置环境变量</li>
              <li>重新部署应用</li>
              <li>访问此页面验证配置</li>
              <li>检查浏览器控制台是否有错误</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
} 