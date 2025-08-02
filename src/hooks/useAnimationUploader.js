import { useState, useCallback } from 'react';
import { s3Uploader } from '@/utils/s3Uploader';

export const useAnimationUploader = () => {
  const [uploadedAnimations, setUploadedAnimations] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 获取所有动画
  const getAllAnimations = useCallback(() => {
    return uploadedAnimations;
  }, [uploadedAnimations]);

  // 上传动画到 S3
  const uploadAnimation = useCallback(async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    clearError();

    try {
      // 验证文件
      const validationErrors = s3Uploader.validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // 检查文件类型
      if (!file.name.toLowerCase().endsWith('.fbx')) {
        throw new Error('❌ 动画文件必须是 .fbx 格式');
      }

      // 上传到 S3
      const uploadResult = await s3Uploader.uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      
      const newAnimation = {
        id: `uploaded-animation-${Date.now()}`,
        name: file.name.replace('.fbx', ''),
        url: uploadResult.url,
        thumbnail: '/images/thumbnails/animation.gif', // 默认缩略图
        isUploaded: true,
        size: s3Uploader.formatFileSize(file.size),
        uploadDate: new Date().toLocaleDateString('zh-CN'),
        originalName: file.name,
        s3Key: uploadResult.fileName,
        category: 'custom',
        tags: ['uploaded', 'custom'],
        type: 'fbx'
      };

      setUploadedAnimations(prev => [...prev, newAnimation]);
      
      return newAnimation;
      
    } catch (error) {
      console.error('Animation upload error:', error);
      setError('动画上传失败: ' + error.message);
      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [clearError]);

  // 删除动画
  const deleteAnimation = useCallback((animationId) => {
    setUploadedAnimations(prev => 
      prev.filter(animation => animation.id !== animationId)
    );
  }, []);

  // 获取动画分类
  const getAnimationCategories = useCallback(() => {
    const categories = new Set(uploadedAnimations.map(anim => anim.category));
    return Array.from(categories);
  }, [uploadedAnimations]);

  // 按分类过滤动画
  const getAnimationsByCategory = useCallback((category) => {
    if (category === 'all') {
      return uploadedAnimations;
    }
    return uploadedAnimations.filter(anim => anim.category === category);
  }, [uploadedAnimations]);

  // 搜索动画
  const searchAnimations = useCallback((query) => {
    if (!query.trim()) {
      return uploadedAnimations;
    }
    
    const searchTerm = query.toLowerCase();
    return uploadedAnimations.filter(anim => 
      anim.name.toLowerCase().includes(searchTerm) ||
      anim.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }, [uploadedAnimations]);

  return {
    // 状态
    uploadedAnimations,
    isUploading,
    uploadProgress,
    error,
    
    // 数据获取
    getAllAnimations,
    getAnimationCategories,
    getAnimationsByCategory,
    searchAnimations,
    
    // 操作方法
    uploadAnimation,
    deleteAnimation,
    
    // 工具方法
    clearError,
  };
}; 