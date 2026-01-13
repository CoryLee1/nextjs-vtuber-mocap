import React from 'react';

/**
 * 模型加载状态指示器组件
 * 
 * 从 VRMAvatar.tsx 提取的独立 UI 组件
 * 负责显示模型加载状态、错误信息
 */
export interface ModelLoadingIndicatorProps {
  isLoading?: boolean;
  error?: string | null;
  modelName?: string;
}

export const ModelLoadingIndicator: React.FC<ModelLoadingIndicatorProps> = ({ 
  isLoading, 
  error, 
  modelName 
}) => {
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-red-500 text-xl mb-4">⚠️ 模型加载失败</div>
          <div className="text-gray-700 mb-4">
            无法加载模型 &quot;{modelName}&quot;，请检查网络连接或稍后重试。
          </div>
          <div className="text-sm text-gray-500">
            错误信息: {typeof error === 'object' && error && 'message' in error 
            ? (error as any).message 
            : error}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900 mb-2">正在加载模型</div>
          <div className="text-gray-600 mb-2">{modelName}</div>
          <div className="text-sm text-gray-500">
            从 GitHub Releases 下载中，请稍候...
          </div>
          <div className="mt-4 text-xs text-gray-400">
            首次加载可能需要较长时间，请耐心等待
          </div>
          <div className="mt-2 text-xs text-gray-400">
            下载进度: <span className="animate-pulse">处理中...</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};





