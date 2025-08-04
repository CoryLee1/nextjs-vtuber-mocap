'use client';

import React from 'react';

export default function TestEnvVarsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">环境变量检查</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">服务器端环境变量</h3>
          <p className="text-sm text-blue-700">
            这些变量只在服务器端可用，客户端无法直接访问。
          </p>
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-medium mb-2">客户端环境变量</h3>
          <div className="text-sm space-y-1">
            <p><strong>NEXT_PUBLIC_S3_BUCKET:</strong> {process.env.NEXT_PUBLIC_S3_BUCKET || '未配置'}</p>
            <p><strong>NEXT_PUBLIC_S3_REGION:</strong> {process.env.NEXT_PUBLIC_S3_REGION || '未配置'}</p>
            <p><strong>NEXT_PUBLIC_S3_BASE_URL:</strong> {process.env.NEXT_PUBLIC_S3_BASE_URL || '未配置'}</p>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-medium mb-2">说明</h3>
          <div className="text-sm space-y-1">
            <p>• AWS_ACCESS_KEY_ID 和 AWS_SECRET_ACCESS_KEY 只在服务器端可用</p>
            <p>• NEXT_PUBLIC_ 前缀的变量在客户端可用</p>
            <p>• 如果显示"未配置"，说明 .env.local 文件没有正确加载</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">测试链接</h3>
          <div className="space-y-2">
            <a 
              href="/test-aws-creds" 
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              测试AWS凭证
            </a>
            <a 
              href="/test-upload" 
              className="block text-blue-600 hover:text-blue-800 underline"
            >
              测试上传功能
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 