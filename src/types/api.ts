// API 相关类型定义
export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  contentType?: string;
}

export interface PresignedUrlResponse {
  url: string;
  fields?: Record<string, string>;
  expiresIn?: number;
}

export interface S3UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ResourceUploadRequest {
  file: File;
  type: 'model' | 'animation' | 'image';
  category?: string;
  tags?: string[];
}

export interface ResourceUploadResponse {
  success: boolean;
  resourceId?: string;
  url?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// 通用 API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
} 