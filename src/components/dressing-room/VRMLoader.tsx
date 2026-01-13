import React, { useState, useEffect, useImperativeHandle, forwardRef, memo } from 'react';
import { useGLTF } from '@react-three/drei';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';

// 模型加载状态指示器组件
interface ModelLoadingIndicatorProps {
  isLoading: boolean;
  error: string | null;
  modelName: string;
}

// PERF: 模型加载指示器组件
const ModelLoadingIndicatorComponent: React.FC<ModelLoadingIndicatorProps> = ({ 
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
            错误信息: {error}
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
        </div>
      </div>
    );
  }

  return null;
};

// PERF: 使用 memo 优化性能
export const ModelLoadingIndicator = memo(ModelLoadingIndicatorComponent);

// VRM 加载器组件
interface VRMLoaderProps {
  modelUrl: string;
  onLoad?: (vrm: any) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface VRMLoaderRef {
  getVRM: () => any;
  reload: () => void;
}

export const VRMLoader = forwardRef<VRMLoaderRef, VRMLoaderProps>(({
  modelUrl,
  onLoad,
  onError,
  onProgress
}, ref) => {
  const [vrm, setVrm] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // 使用 useGLTF 加载模型 - 移到组件级别
  const gltfResult: any = useGLTF(modelUrl);
  const { scene, userData, errors } = gltfResult;

  // 处理 VRM 加载
  useEffect(() => {
    const processVRM = async () => {
      if (!scene || !userData) return;

      try {
        setIsLoading(true);
        setError(null);
        setProgress(50);

        // 检查是否包含 VRM 扩展
        if (!userData.vrm) {
          throw new Error('不是有效的 VRM 文件');
        }

        setVrm(userData.vrm);
        setProgress(100);
        onLoad?.(userData.vrm);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '未知错误';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (scene && userData) {
      processVRM();
    }
  }, [scene, userData, onLoad, onError]);

  // 处理加载错误
  useEffect(() => {
    if (errors) {
      const errorMessage = Array.isArray(errors) ? errors.join(', ') : '加载失败';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [errors, onError]);

  // 重新加载
  const reload = () => {
    // 重新加载逻辑
    window.location.reload();
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getVRM: () => vrm,
    reload
  }));

  // 更新进度
  useEffect(() => {
    onProgress?.(progress);
  }, [progress, onProgress]);

  return (
    <>
      <ModelLoadingIndicator
        isLoading={isLoading}
        error={error}
        modelName={modelUrl.split('/').pop() || '未知模型'}
      />
      {vrm && (
        <primitive object={vrm.scene} />
      )}
    </>
  );
});

VRMLoader.displayName = 'VRMLoader'; 