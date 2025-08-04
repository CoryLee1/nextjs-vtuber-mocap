'use client';

import React, { useState } from 'react';
import { s3Uploader } from '@/lib/s3-uploader';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // 验证文件
      const validationErrors = s3Uploader.validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      console.log('开始上传文件:', file.name);
      
      // 上传文件
      const uploadResult = await s3Uploader.uploadFile(file, (progress) => {
        setProgress(progress);
        console.log('上传进度:', progress);
      });

      console.log('上传完成:', uploadResult);
      setResult(uploadResult);
    } catch (err) {
      console.error('上传失败:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">上传功能测试</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">选择文件</label>
          <input
            type="file"
            accept=".vrm,.fbx"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {file && (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium">文件信息</h3>
            <p>名称: {file.name}</p>
            <p>大小: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>类型: {file.type}</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {uploading ? '上传中...' : '开始上传'}
        </button>

        {uploading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">进度: {progress.toFixed(1)}%</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h3 className="font-medium text-red-800">错误</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800">
              {result.isSimulated ? '模拟上传成功' : '上传成功'}
            </h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-green-700">
                <strong>文件URL:</strong> {result.url}
              </p>
              <p className="text-sm text-green-700">
                <strong>文件名:</strong> {result.fileName}
              </p>
              <p className="text-sm text-green-700">
                <strong>大小:</strong> {(result.size / 1024 / 1024).toFixed(2)} MB
              </p>
              {result.isSimulated && (
                <p className="text-sm text-yellow-600">
                  ⚠️ 这是模拟上传，文件并未真正上传到S3
                </p>
              )}
            </div>
            <pre className="text-xs text-green-700 mt-2 overflow-auto bg-green-100 p-2 rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 