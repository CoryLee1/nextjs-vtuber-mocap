import { S3UploadResult } from '@/types/api';

// S3 上传工具
export class S3Uploader {
  private s3Config: {
    bucketName: string;
    region: string;
    baseUrl: string;
  };

  constructor() {
    // S3 配置 - 从环境变量读取
    this.s3Config = {
      bucketName: process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets',
      region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2',
      baseUrl: process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com'
    };
  }

  // 生成预签名 URL（需要后端支持）
  async getPresignedUrl(fileName: string, fileType: string): Promise<string | null> {
    try {
      // 直接调用服务器端API，让服务器端检查AWS凭证
      const response = await fetch('/api/s3/presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName,
          fileType,
          bucketName: this.s3Config.bucketName
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('S3 API错误:', response.status, errorText);
        throw new Error(`获取预签名 URL 失败: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('S3 API响应:', data);
      
      // 检查API返回的数据结构
      if (data.success && data.data && data.data.url) {
        return data.data.url;
      } else if (data.presignedUrl) {
        // 兼容旧的数据结构
        return data.presignedUrl;
      } else {
        throw new Error('API返回数据格式错误');
      }
    } catch (error) {
      console.error('S3 预签名 URL 获取失败:', error);
      // 如果后端API不可用，使用模拟上传
      console.log('使用模拟上传模式');
      return null;
    }
  }

  // 上传文件到 S3；options.purpose 可选 'hdr' | 'scene' 用于 HDR 或场景模型（GLB/GLTF）
  async uploadFile(
    file: File,
    onProgress?: ((progress: number) => void) | null,
    options?: { purpose?: 'hdr' | 'scene' }
  ): Promise<S3UploadResult> {
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isVRM = fileExtension === 'vrm';
      const isAnimation = fileExtension === 'fbx' && file.name.toLowerCase().includes('animation');
      const isMP3 = fileExtension === 'mp3';
      const isHdr = fileExtension === 'hdr';
      const isFbx = fileExtension === 'fbx';
      const isGlb = fileExtension === 'glb';
      const isGltf = fileExtension === 'gltf';
      const purpose = options?.purpose;
      let folderName: string;
      if (purpose === 'hdr' && isHdr) folderName = 'hdr';
      else if (purpose === 'scene' && (isGlb || isGltf)) folderName = 'scene';
      else if (isVRM) folderName = 'vrm';
      else if (isMP3) folderName = 'bgm';
      else if (isAnimation) folderName = 'animations';
      else if (isHdr) folderName = 'hdr';
      else if (isFbx) folderName = 'fbx';
      else folderName = 'fbx';
      const fileType = isVRM ? 'model/vrm' : isMP3 ? 'audio/mpeg' : (isGlb ? 'model/gltf-binary' : isGltf ? 'model/gltf+json' : 'application/octet-stream');

      const fileName = `${folderName}/${file.name}`;

      // 使用服务器端上传避免CORS问题
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);
      formData.append('fileType', fileType);
      formData.append('bucketName', this.s3Config.bucketName);

      // 使用 XMLHttpRequest 来支持进度回调
      return new Promise<S3UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success) {
                const fileUrl = `${this.s3Config.baseUrl}/${fileName}`;
                resolve({
                  url: fileUrl,
                  fileName: fileName,
                  originalName: file.name,
                  size: file.size,
                  type: fileType
                });
              } else {
                reject(new Error(response.message || '上传失败'));
              }
            } catch (error) {
              reject(new Error('响应解析失败'));
            }
          } else {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });

        xhr.open('POST', '/api/s3/upload');
        xhr.send(formData);
      });

    } catch (error) {
      console.error('S3 上传失败:', error);
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const purpose = options?.purpose;
      const isHdr = fileExtension === 'hdr';
      const isFbx = fileExtension === 'fbx';
      const isGlb = fileExtension === 'glb';
      const isGltf = fileExtension === 'gltf';
      let folderName: string;
      if (purpose === 'hdr' && isHdr) folderName = 'hdr';
      else if (purpose === 'scene' && (isGlb || isGltf)) folderName = 'scene';
      else if (fileExtension === 'vrm') folderName = 'vrm';
      else if (fileExtension === 'mp3') folderName = 'bgm';
      else if (isFbx && file.name.toLowerCase().includes('animation')) folderName = 'animations';
      else if (isHdr) folderName = 'hdr';
      else folderName = 'fbx';
      const fileName = `${folderName}/${file.name}`;
      return this.simulateUpload(file, fileName, onProgress);
    }
  }

  // 模拟上传功能
  async simulateUpload(file: File, fileName: string, onProgress?: ((progress: number) => void) | null): Promise<S3UploadResult> {
    return new Promise<S3UploadResult>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5; // 5-20% 随机进度
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // 模拟上传完成，返回一个模拟的S3 URL
          const fileUrl = `${this.s3Config.baseUrl}/${fileName}`;
          const fileExtension = file.name.split('.').pop()?.toLowerCase();
          const isVRM = fileExtension === 'vrm';
          const isMP3 = fileExtension === 'mp3';
          const fileType = isVRM ? 'model/vrm' : isMP3 ? 'audio/mpeg' : 'application/octet-stream';
          
          resolve({
            url: fileUrl,
            fileName: fileName,
            originalName: file.name,
            size: file.size,
            type: fileType,
            isSimulated: true // 标记这是模拟上传
          });
        }
        
        if (onProgress) {
          onProgress(progress);
        }
      }, 300); // 稍微慢一点，更真实
    });
  }

  // 验证文件类型
  validateFile(file: File): string[] {
    const errors = [];
    
    // 检查文件类型
    const allowedTypes = [
      'model/gltf-binary', // VRM
      'application/octet-stream', // FBX
      'model/vrm'
    ];
    
    const fileExtension = file.name.toLowerCase();
    const isVRM = fileExtension.endsWith('.vrm');
    const isFBX = fileExtension.endsWith('.fbx');
    const isAnimation = isFBX && file.name.toLowerCase().includes('animation');
    
    if (!allowedTypes.includes(file.type) && !isVRM && !isFBX) {
      errors.push('❌ 只支持 .vrm 和 .fbx 格式的文件');
    }
    
    // 检查文件大小 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('❌ 文件大小不能超过 100MB');
    }
    
    // 检查文件是否为空
    if (file.size === 0) {
      errors.push('❌ 文件不能为空');
    }
    
    return errors;
  }

  /** BGM 上传大小上限 15MB */
  static BGM_MAX_SIZE = 15 * 1024 * 1024;
  /** HDR 上传大小上限 50MB */
  static HDR_MAX_SIZE = 50 * 1024 * 1024;
  /** 场景模型（GLB/GLTF）上传大小上限 30MB */
  static SCENE_MODEL_MAX_SIZE = 30 * 1024 * 1024;

  validateHDRFile(file: File): string[] {
    const errors: string[] = [];
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'hdr') errors.push('❌ 仅支持 .hdr 格式');
    if (file.size > S3Uploader.HDR_MAX_SIZE) errors.push(`❌ HDR 不能超过 ${S3Uploader.HDR_MAX_SIZE / 1024 / 1024}MB`);
    if (file.size === 0) errors.push('❌ 文件不能为空');
    return errors;
  }

  validateSceneModelFile(file: File): string[] {
    const errors: string[] = [];
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'glb' && ext !== 'gltf') errors.push('❌ 场景仅支持 .glb / .gltf 格式');
    if (file.size > S3Uploader.SCENE_MODEL_MAX_SIZE) errors.push(`❌ 场景模型不能超过 ${S3Uploader.SCENE_MODEL_MAX_SIZE / 1024 / 1024}MB`);
    if (file.size === 0) errors.push('❌ 文件不能为空');
    return errors;
  }

  // 验证 BGM 文件（仅 .mp3，限制大小）
  validateBGMFile(file: File): string[] {
    const errors: string[] = [];
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'mp3') {
      errors.push('❌ BGM 仅支持 .mp3 格式');
    }
    if (file.size > S3Uploader.BGM_MAX_SIZE) {
      errors.push(`❌ BGM 文件不能超过 ${S3Uploader.BGM_MAX_SIZE / 1024 / 1024}MB`);
    }
    if (file.size === 0) {
      errors.push('❌ 文件不能为空');
    }
    return errors;
  }

  // 验证VRM文件（专门用于模型管理器）
  validateVRMFile(file: File): string[] {
    const errors = [];
    
    // 检查文件类型 - 只允许VRM
    const fileExtension = file.name.toLowerCase();
    const isVRM = fileExtension.endsWith('.vrm');
    
    if (!isVRM) {
      errors.push('❌ 模型管理器只支持 .vrm 格式的文件');
    }
    
    // 检查文件大小 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('❌ 文件大小不能超过 100MB');
    }
    
    // 检查文件是否为空
    if (file.size === 0) {
      errors.push('❌ 文件不能为空');
    }
    
    return errors;
  }

  // 格式化文件大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 创建全局实例
export const s3Uploader = new S3Uploader(); 