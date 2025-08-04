'use client';

import React, { useState } from 'react';

export default function TestAWSCredsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testCredentials = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/s3/test-permissions');
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AWS凭证测试</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">测试说明</h3>
          <p className="text-sm text-blue-700">
            这个页面会测试你的AWS凭证是否正确配置，以及是否有S3访问权限。
          </p>
        </div>

        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-medium mb-2">重要提示</h3>
          <p className="text-sm text-yellow-700 mb-2">
            你需要的是<strong>程序化访问密钥</strong>，不是控制台登录密码！
          </p>
          <div className="text-xs text-yellow-600 space-y-1">
            <p>1. 登录AWS控制台：https://coryleeart.signin.aws.amazon.com/console</p>
            <p>2. 用户名：vtuber-s3-uploader，密码：e4+-B9^e</p>
            <p>3. 点击右上角用户名 → Security credentials</p>
            <p>4. 在Access keys部分点击"Create access key"</p>
            <p>5. 选择"Application running outside AWS"</p>
            <p>6. 复制Access Key ID和Secret Access Key</p>
          </div>
        </div>

        <button
          onClick={testCredentials}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {loading ? '测试中...' : '测试AWS凭证'}
        </button>

        {result && (
          <div className="p-4 bg-gray-50 border rounded">
            <h3 className="font-medium mb-2">测试结果</h3>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="p-4 bg-green-50 rounded">
          <h3 className="font-medium mb-2">正确的凭证格式</h3>
          <div className="text-sm space-y-1">
            <p><strong>AWS_ACCESS_KEY_ID:</strong> AKIA + 16位字符 (总共20位)</p>
            <p><strong>AWS_SECRET_ACCESS_KEY:</strong> 40位字符</p>
            <p><strong>示例:</strong> AKIA2YUYL200AETSAU6Q</p>
          </div>
        </div>
      </div>
    </div>
  );
} 