'use client';

import React, { useState } from 'react';

export default function TestAWSPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testAWSPermissions = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/s3/test-permissions');
      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || '权限检查失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AWS S3权限检查</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">检查项目</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• AWS凭证是否有效</li>
            <li>• S3 Bucket是否存在</li>
            <li>• 是否有读写权限</li>
            <li>• 可访问的Bucket列表</li>
          </ul>
        </div>

        <button
          onClick={testAWSPermissions}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? '检查中...' : '检查AWS权限'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-medium text-red-800">权限检查失败</h3>
            <p className="text-red-600">{error}</p>
            
            <div className="mt-4 p-3 bg-yellow-50 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">解决方案</h4>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. 检查AWS Access Key和Secret Key是否正确</li>
                <li>2. 确保AWS用户有S3的读写权限</li>
                <li>3. 检查Bucket是否存在</li>
                <li>4. 如果Bucket不存在，需要先创建</li>
              </ol>
            </div>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800">权限检查成功</h3>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-green-700">
                <strong>Bucket:</strong> {result.bucketName}
              </p>
              <p className="text-sm text-green-700">
                <strong>Region:</strong> {result.region}
              </p>
              <p className="text-sm text-green-700">
                <strong>状态:</strong> {result.message}
              </p>
              
              {result.availableBuckets && (
                <div>
                  <p className="text-sm font-medium text-green-700">可访问的Buckets:</p>
                  <ul className="text-xs text-green-600 mt-1 space-y-1">
                    {result.availableBuckets.map((bucket: string) => (
                      <li key={bucket}>• {bucket}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">AWS IAM权限要求</h3>
          <p className="text-sm text-gray-700 mb-2">
            你的AWS用户需要以下权限：
          </p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::nextjs-vtuber-assets",
        "arn:aws:s3:::nextjs-vtuber-assets/*"
      ]
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
} 