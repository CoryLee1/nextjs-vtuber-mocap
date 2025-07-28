import { useState, useCallback } from 'react';

// 默认模型列表
const DEFAULT_MODELS = [
  {
    id: 'avatar-sample-a',
    name: 'Avatar Sample A',
    url: '/models/AvatarSample_A.vrm',
    thumbnail: '/images/1111.jpg',
    isDefault: true,
    size: '15 MB',
  },
  {
    id: 'avatar-sample-c',
    name: 'Avatar Sample C',
    url: '/models/AvatarSample_C.vrm',
    thumbnail: '/images/1111.jpg',
    isDefault: true,
    size: '14 MB',
  },
  {
    id: 'avatar-sample-h',
    name: 'Avatar Sample H',
    url: '/models/AvatarSample_H.vrm',
    thumbnail: '/images/1111.jpg',
    isDefault: true,
    size: '19 MB',
  },
  {
    id: 'avatar-sample-m',
    name: 'Avatar Sample M',
    url: '/models/AvatarSample_M.vrm',
    thumbnail: '/images/1111.jpg',
    isDefault: true,
    size: '20 MB',
  },
  {
    id: 'avatar-sample-z',
    name: 'Avatar Sample Z',
    url: '/models/AvatarSample_Z.vrm',
    thumbnail: '/images/1111.jpg',
    isDefault: true,
    size: '17 MB',
  },
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
  },
  {
    id: 'vroid-sample-2', 
    name: 'VRoid Sample Boy',
    downloadUrl: 'https://hub.vroid.com/download/sample2.vrm',
    thumbnail: 'https://hub.vroid.com/thumb/sample2.jpg',
    size: '11.8 MB',
    author: 'VRoid Team',
    description: '帅气的动漫风格男性角色',
  },
];

export const useModelManager = () => {
  const [uploadedModels, setUploadedModels] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState('avatar-sample-a');
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [error, setError] = useState(null);
  
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

  // 格式化文件大小
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 生成缩略图（占位符实现）
  const generateThumbnail = useCallback(async (file) => {
    // TODO: 实现真实的 VRM 缩略图生成
    // 现在返回 1111.jpg
    return '/images/1111.jpg';
  }, []);

  // 上传模型
  const uploadModel = useCallback(async (file) => {
    setIsUploading(true);
    clearError();

    try {
      // 创建文件 URL
      const fileUrl = URL.createObjectURL(file);
      
      // 生成缩略图
      const thumbnail = await generateThumbnail(file);
      
      const newModel = {
        id: `uploaded-${Date.now()}`,
        name: file.name.replace('.vrm', ''),
        url: fileUrl,
        thumbnail: thumbnail,
        isUploaded: true,
        size: formatFileSize(file.size),
        uploadDate: new Date().toLocaleDateString('zh-CN'),
        file: file, // 保存原始文件引用
      };

      setUploadedModels(prev => [...prev, newModel]);
      setSelectedModelId(newModel.id); // 自动选择新上传的模型
      
      return newModel;
      
    } catch (error) {
      console.error('Upload error:', error);
      setError('模型上传失败: ' + error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [generateThumbnail, formatFileSize, clearError]);

  // 下载在线模型
  const downloadModel = useCallback(async (onlineModel) => {
    setDownloadingIds(prev => new Set([...prev, onlineModel.id]));
    clearError();

    try {
      // 模拟下载过程（实际项目中需要真实的下载逻辑）
      const response = await fetch(onlineModel.downloadUrl);
      if (!response.ok) throw new Error('下载失败');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const downloadedModel = {
        ...onlineModel,
        id: `downloaded-${Date.now()}`,
        url: url,
        isDownloaded: true,
        downloadDate: new Date().toLocaleDateString('zh-CN'),
      };
      
      setUploadedModels(prev => [...prev, downloadedModel]);
      setSelectedModelId(downloadedModel.id); // 自动选择新下载的模型
      
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
      const modelToDelete = prev.find(model => model.id === modelId);
      
      // 清理 URL 对象
      if (modelToDelete?.url.startsWith('blob:')) {
        URL.revokeObjectURL(modelToDelete.url);
      }
      
      const updatedModels = prev.filter(model => model.id !== modelId);
      
      // 如果删除的是当前选中的模型，切换到默认模型
      if (selectedModelId === modelId) {
        setSelectedModelId('default');
      }
      
      return updatedModels;
    });
  }, [selectedModelId]);

  // 选择模型
  const selectModel = useCallback((modelId) => {
    setSelectedModelId(modelId);
  }, []);

  return {
    // 状态
    uploadedModels,
    selectedModelId,
    isUploading,
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
    formatFileSize,
    clearError,
  };
};