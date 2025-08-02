import { useRef, useState } from 'react';
import { s3Uploader } from '@/utils/s3Uploader';

export const FileUploader = ({ onUpload, isUploading = false, accept = ".vrm,.fbx", fileType = "model" }) => {
  const fileInputRef = useRef();
  const [dragOver, setDragOver] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 处理文件选择
  const handleFileSelect = (file) => {
    if (!file) return;
    
    // 清除之前的错误
    setValidationError(null);
    
    // 文件验证
    const errors = s3Uploader.validateFile(file);
    if (errors.length > 0) {
      setValidationError(errors.join('\n'));
      return;
    }
    
    onUpload(file);
  };

  // 拖拽处理
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // 获取文件类型显示名称
  const getFileTypeName = () => {
    if (fileType === 'animation') return '动画文件';
    if (fileType === 'model') return '模型文件';
    return '文件';
  };

  // 获取支持格式
  const getSupportedFormats = () => {
    if (fileType === 'animation') return '.fbx';
    if (fileType === 'model') return '.vrm';
    return '.vrm, .fbx';
  };

  return (
    <div className="w-full">
      {/* 拖拽上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragOver 
            ? 'border-vtuber-primary bg-vtuber-blue-50' 
            : 'border-vtuber-blue-300 hover:border-vtuber-primary hover:bg-vtuber-blue-50'
        }`}
      >
        {/* 上传图标 */}
        <div className="mb-4">
          <div className="w-16 h-16 bg-vtuber-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">
              {isUploading ? '⏳' : dragOver ? '📥' : '📤'}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-vtuber-text mb-2">
            {isUploading ? '上传中...' : `上传你的 ${getFileTypeName()}`}
          </h3>
          
          <p className="text-vtuber-text-light text-sm">
            {dragOver 
              ? '松开鼠标即可上传' 
              : '拖拽文件到这里，或点击选择文件'
            }
          </p>
        </div>
        
        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
        />
        
        {/* 上传按钮 */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-vtuber-primary text-white px-6 py-3 rounded-lg hover:bg-vtuber-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              处理中...
            </div>
          ) : (
            '选择文件'
          )}
        </button>
        
        {/* 上传要求 */}
        <div className="mt-6 text-xs text-vtuber-text-light">
          <div className="bg-vtuber-blue-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">📋 上传要求:</h4>
            <ul className="text-left space-y-1">
              <li>• 支持格式: {getSupportedFormats()}</li>
              <li>• 最大大小: 100MB</li>
              <li>• 文件将上传到 AWS S3</li>
              <li>• 支持进度显示</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* 验证错误提示 */}
      {validationError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm whitespace-pre-line">{validationError}</p>
        </div>
      )}
      
      {/* 上传进度 */}
      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-vtuber-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-vtuber-text-light mt-2 text-center">
            正在上传到 S3... {uploadProgress.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
};