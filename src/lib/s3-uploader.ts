// S3 上传工具
export class S3Uploader {
  constructor() {
    // S3 配置 - 这里需要替换为你的实际配置
    this.s3Config = {
      bucketName: 'nextjs-vtuber-assets',
      region: 'us-east-2',
      baseUrl: 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com'
    };
  }

  // 生成预签名 URL（需要后端支持）
  async getPresignedUrl(fileName, fileType) {
    try {
      // 这里需要调用你的后端 API 来获取预签名 URL
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
        throw new Error('获取预签名 URL 失败');
      }

      const data = await response.json();
      return data.presignedUrl;
    } catch (error) {
      console.error('S3 预签名 URL 获取失败:', error);
      throw error;
    }
  }

  // 上传文件到 S3
  async uploadFile(file, onProgress = null) {
    try {
      // 生成唯一的文件名
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${file.type}/${timestamp}-${randomId}.${fileExtension}`;

      // 获取预签名 URL
      const presignedUrl = await this.getPresignedUrl(fileName, file.type);

      // 创建 FormData 并上传
      const formData = new FormData();
      formData.append('file', file);

      // 使用 XMLHttpRequest 来支持进度回调
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const fileUrl = `${this.s3Config.baseUrl}/${fileName}`;
            resolve({
              url: fileUrl,
              fileName: fileName,
              originalName: file.name,
              size: file.size,
              type: file.type
            });
          } else {
            reject(new Error(`上传失败: ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('网络错误'));
        });

        xhr.open('PUT', presignedUrl);
        xhr.send(file);
      });

    } catch (error) {
      console.error('S3 上传失败:', error);
      throw error;
    }
  }

  // 验证文件类型
  validateFile(file) {
    const errors = [];
    
    // 检查文件类型
    const allowedTypes = [
      'model/gltf-binary', // VRM
      'application/octet-stream', // FBX
      'model/vrm'
    ];
    
    if (!allowedTypes.includes(file.type) && 
        !file.name.toLowerCase().endsWith('.vrm') && 
        !file.name.toLowerCase().endsWith('.fbx')) {
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

  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 创建全局实例
export const s3Uploader = new S3Uploader(); 