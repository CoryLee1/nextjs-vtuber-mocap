'use client';

import React, { useEffect, useState } from 'react';
import { configManager } from '@/lib/config-manager';

export default function ConfigCheckPage() {
  const [configSummary, setConfigSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const summary = configManager.getConfigSummary();
    setConfigSummary(summary);
    setIsLoading(false);
  }, []);

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

  if (!configSummary) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">配置检查</h1>
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">无法加载配置信息</p>
        </div>
      </div>
    );
  }

  const { validation, posthog, s3, app } = configSummary;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">API Key 配置检查</h1>
      
      {/* 总体状态 */}
      <div className={`p-6 rounded-lg mb-8 ${
        validation.isValid 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <h2 className="text-xl font-semibold mb-4">
          配置状态: {validation.isValid ? '✅ 完整' : '❌ 不完整'}
        </h2>
        
        {validation.missingKeys.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium text-red-700 mb-2">缺少的必需配置:</h3>
            <ul className="list-disc list-inside space-y-1">
              {validation.missingKeys.map(key => (
                <li key={key} className="text-red-600 font-mono text-sm">
                  {key}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {validation.warnings.length > 0 && (
          <div>
            <h3 className="font-medium text-yellow-700 mb-2">警告:</h3>
            <ul className="list-disc list-inside space-y-1">
              {validation.warnings.map(warning => (
                <li key={warning} className="text-yellow-600 text-sm">
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* PostHog 配置 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-blue-800">PostHog 配置</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">国际环境:</span>
              <span className={`text-sm font-mono ${
                posthog.international === 'configured' ? 'text-green-600' : 'text-red-600'
              }`}>
                {posthog.international === 'configured' ? '✅ 已配置' : '❌ 未配置'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">中国环境:</span>
              <span className={`text-sm font-mono ${
                posthog.china === 'configured' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {posthog.china === 'configured' ? '✅ 已配置' : '⚠️ 可选'}
              </span>
            </div>
          </div>
        </div>

        {/* AWS S3 配置 */}
        <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-purple-800">AWS S3 配置</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">凭证:</span>
              <span className={`text-sm font-mono ${
                s3.credentials === 'configured' ? 'text-green-600' : 'text-red-600'
              }`}>
                {s3.credentials === 'configured' ? '✅ 已配置' : '❌ 未配置'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">存储桶:</span>
              <span className="text-sm font-mono text-gray-600">
                {s3.bucket}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">区域:</span>
              <span className="text-sm font-mono text-gray-600">
                {s3.region}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 应用信息 */}
      <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">应用信息</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium">版本:</span>
            <span className="text-sm font-mono text-gray-600">{app.version}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">环境:</span>
            <span className={`text-sm font-mono ${
              app.environment === 'production' ? 'text-green-600' : 'text-blue-600'
            }`}>
              {app.environment}
            </span>
          </div>
        </div>
      </div>

      {/* 配置建议 */}
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-yellow-800">配置建议</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-yellow-700 mb-2">1. 创建 .env.local 文件</h4>
            <p className="text-sm text-yellow-600 mb-2">
              在项目根目录创建 `.env.local` 文件，添加以下配置：
            </p>
            <pre className="text-xs bg-yellow-100 p-3 rounded overflow-x-auto">
{`# PostHog 配置
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# AWS S3 配置
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
NEXT_PUBLIC_S3_BUCKET=your_bucket_name_here
NEXT_PUBLIC_S3_REGION=us-east-2
NEXT_PUBLIC_S3_BASE_URL=https://your-bucket.s3.us-east-2.amazonaws.com`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium text-yellow-700 mb-2">2. 安全提醒</h4>
            <ul className="text-sm text-yellow-600 space-y-1">
              <li>• 永远不要将 `.env.local` 文件提交到版本控制</li>
              <li>• 定期轮换 AWS 密钥</li>
              <li>• 使用最小权限原则配置 AWS IAM</li>
              <li>• 在生产环境中使用环境变量管理服务</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 