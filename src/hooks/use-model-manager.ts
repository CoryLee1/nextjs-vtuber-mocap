import { useState, useCallback } from 'react';
import { s3Uploader } from '@/lib/s3-uploader';
import { useSceneStore } from '@/hooks/use-scene-store';
import { generateVrmThumbnailBlob } from '@/lib/vrm-thumbnail-render';
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';

// 默认模型列表
const DEFAULT_MODELS = [
  {
    id: 'avatar-sample-a',
    name: 'Avatar Sample A',
    url: getS3ObjectReadUrlByKey('AvatarSample_A.vrm'),
    thumbnail: '/images/1111.jpg',
    isDefault: true,
    size: '15 MB',
    category: 'default',
    description: '默认女性角色模型A'
  },
  {
    id: 'avatar-sample-c',
    name: 'Avatar Sample C',
    url: getS3ObjectReadUrlByKey('AvatarSample_C.vrm'),
    thumbnail: '/images/1111.jpg',
    isDefault: true,
    size: '14 MB',
    category: 'default',
    description: '默认女性角色模型C'
  }
];

// 在线模型库
const ONLINE_MODELS = [
  {
    id: 'vroid-sample-1',
    name: 'VRoid Sample Girl',
    downloadUrl: 'https://hub.vroid.com/download/sample1.vrm',
    thumbnail: 'https://hub.vroid.com/thumb/sample1.jpg',
    size: '12.5 MB',
    author: 'VRoid Team',
    description: '可爱的动漫风格女性角色',
    category: 'online'
  },
  {
    id: 'vroid-sample-2', 
    name: 'VRoid Sample Boy',
    downloadUrl: 'https://hub.vroid.com/download/sample2.vrm',
    thumbnail: 'https://hub.vroid.com/thumb/sample2.jpg',
    size: '11.8 MB',
    author: 'VRoid Team',
    description: '帅气的动漫风格男性角色',
    category: 'online'
  },
];

export const useModelManager = () => {
  const [uploadedModels, setUploadedModels] = useState<any[]>([]);
  const [selectedModelId, setSelectedModelId] = useState('avatar-sample-a');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [error, setError] = useState<string | null>(null);
  
  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 获取所有模型
  const getAllModels = useCallback(() => {
    return [...DEFAULT_MODELS, ...uploadedModels];
  }, [uploadedModels]);

  // 获取当前选中的模型
  const getSelectedModel = useCallback(() => {
    const allModels = getAllModels();
    return allModels.find(model => model.id === selectedModelId) || DEFAULT_MODELS[0];
  }, [getAllModels, selectedModelId]);

  // 上传模型到 S3（VRM 会尝试生成证件照缩略图并上传）
  const uploadModel = useCallback(async (file: any) => {
    setIsUploading(true);
    setUploadProgress(0);
    clearError();

    try {
      // 验证文件
      const validationErrors = s3Uploader.validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // 上传到 S3
      const uploadResult = await s3Uploader.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });

      let thumbnail: string | null = null;
      const isVRM = file.name.toLowerCase().endsWith('.vrm');
      if (isVRM) {
        try {
          const result = await generateVrmThumbnailBlob(file);
          if (result?.blob) {
            const thumb = await s3Uploader.uploadThumbnail(result.blob, uploadResult.fileName);
            thumbnail = thumb.url;
          }
        } catch (e) {
          console.warn('缩略图生成/上传失败，使用占位图', e);
        }
      }
      if (!thumbnail) {
        thumbnail = '/images/1111.jpg';
      }

      const newModel = {
        id: `uploaded-${Date.now()}`,
        name: file.name.replace(/\.(vrm|fbx)$/i, ''),
        url: uploadResult.url,
        thumbnail,
        isUploaded: true,
        size: s3Uploader.formatFileSize(file.size),
        uploadDate: new Date().toLocaleDateString('zh-CN'),
        originalName: file.name,
        s3Key: uploadResult.fileName,
        category: isVRM ? 'vrm' : 'fbx'
      };

      setUploadedModels(prev => [...prev, newModel]);
      setSelectedModelId(newModel.id); // 自动选择新上传的模型
      
      // 同步到场景 store
      useSceneStore.getState().setVRMModelUrl(newModel.url);
      
      return newModel;
      
    } catch (error) {
      console.error('Upload error:', error);
      setError('模型上传失败: ' + (error instanceof Error ? error.message : String(error)));
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [clearError]);

  // 下载在线模型
  const downloadModel = useCallback(async (onlineModel) => {
    setDownloadingIds(prev => new Set([...prev, onlineModel.id]));
    clearError();

    try {
      // 模拟下载过程（实际项目中需要真实的下载逻辑）
      const response = await fetch(onlineModel.downloadUrl);
      if (!response.ok) throw new Error('下载失败');
      
      const blob = await response.blob();
      const file = new File([blob], onlineModel.name + '.vrm', { type: 'model/vrm' });
      
      // 使用 S3 上传
      const uploadResult = await s3Uploader.uploadFile(file);
      
      const downloadedModel = {
        ...onlineModel,
        id: `downloaded-${Date.now()}`,
        url: uploadResult.url,
        isDownloaded: true,
        downloadDate: new Date().toLocaleDateString('zh-CN'),
        s3Key: uploadResult.fileName,
      };
      
      setUploadedModels(prev => [...prev, downloadedModel]);
      setSelectedModelId(downloadedModel.id); // 自动选择新下载的模型
      
      // 同步到场景 store
      useSceneStore.getState().setVRMModelUrl(downloadedModel.url);
      
      return downloadedModel;
      
    } catch (error) {
      console.error('Download error:', error);
      setError('模型下载失败: ' + error.message);
      throw error;
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(onlineModel.id);
        return newSet;
      });
    }
  }, [clearError]);

  // 删除模型
  const deleteModel = useCallback((modelId) => {
    setUploadedModels(prev => {
      const updatedModels = prev.filter(model => model.id !== modelId);
      
      // 如果删除的是当前选中的模型，切换到默认模型
      if (selectedModelId === modelId) {
        setSelectedModelId('avatar-sample-a');
      }
      
      return updatedModels;
    });
  }, [selectedModelId]);

  // 选择模型
  const selectModel = useCallback((modelId) => {
    setSelectedModelId(modelId);
    
    // 同步到场景 store
    const allModels = getAllModels();
    const selectedModel = allModels.find(model => model.id === modelId);
    if (selectedModel) {
      useSceneStore.getState().setVRMModelUrl(selectedModel.url);
    }
  }, [getAllModels]);

  return {
    // 状态
    uploadedModels,
    selectedModelId,
    isUploading,
    uploadProgress,
    downloadingIds,
    error,
    
    // 数据获取
    getAllModels,
    getSelectedModel,
    defaultModels: DEFAULT_MODELS,
    onlineModels: ONLINE_MODELS,
    
    // 操作方法
    uploadModel,
    downloadModel,
    deleteModel,
    selectModel,
    
    // 工具方法
    formatFileSize: s3Uploader.formatFileSize,
    clearError,
  };
};