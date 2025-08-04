'use client';

import React from 'react';

export default function TestEnvPage() {
  const envVars = {
    'NEXT_PUBLIC_S3_BUCKET': process.env.NEXT_PUBLIC_S3_BUCKET,
    'NEXT_PUBLIC_S3_REGION': process.env.NEXT_PUBLIC_S3_REGION,
    'NEXT_PUBLIC_S3_BASE_URL': process.env.NEXT_PUBLIC_S3_BASE_URL,
    'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID ? '已配置' : '未配置',
    'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY ? '已配置' : '未配置',
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">环境变量检查</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">环境变量状态</h3>
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between py-1">
              <span className="font-mono text-sm">{key}:</span>
              <span className={`text-sm ${value ? 'text-green-600' : 'text-red-600'}`}>
                {value || '未配置'}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">配置建议</h3>
          <p className="text-sm text-blue-700">
            如果你的 .env.local 文件缺少 NEXT_PUBLIC_S3_BASE_URL，请添加：
          </p>
          <pre className="text-xs bg-blue-100 p-2 rounded mt-2">
            NEXT_PUBLIC_S3_BASE_URL=https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com
          </pre>
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-medium mb-2">测试链接</h3>
          <a 
            href="/test-upload" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            测试上传功能
          </a>
        </div>
      </div>
    </div>
  );
} 