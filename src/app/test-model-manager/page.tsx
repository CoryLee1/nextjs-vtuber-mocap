'use client';

import React, { useState } from 'react';
import { ModelManager } from '@/components/vtuber/ModelManager';
import { VRMModel } from '@/types';

export default function TestModelManagerPage() {
  const [showModelManager, setShowModelManager] = useState(false);
  const [selectedModel, setSelectedModel] = useState<VRMModel | null>(null);

  const handleModelSelect = (model: VRMModel) => {
    setSelectedModel(model);
    console.log('选择的模型:', model);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">模型管理器测试</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-medium mb-2">测试说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 点击"打开模型管理器"按钮</li>
            <li>• 在模型管理器中点击"上传"按钮</li>
            <li>• 选择一个VRM文件进行上传测试</li>
            <li>• 观察上传进度和结果</li>
          </ul>
        </div>

        <button
          onClick={() => setShowModelManager(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          打开模型管理器
        </button>

        {selectedModel && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-medium text-green-800">已选择的模型</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-green-700">
                <strong>名称:</strong> {selectedModel.name}
              </p>
              <p className="text-sm text-green-700">
                <strong>URL:</strong> {selectedModel.url}
              </p>
              <p className="text-sm text-green-700">
                <strong>分类:</strong> {selectedModel.category}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">调试信息</h3>
          <p className="text-sm text-gray-700">
            打开浏览器控制台查看详细的上传日志和错误信息。
          </p>
        </div>
      </div>

      {showModelManager && (
        <ModelManager
          onClose={() => setShowModelManager(false)}
          onSelect={handleModelSelect}
        />
      )}
    </div>
  );
} 