import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { VRMModel, Animation } from '@/types';

export class S3ResourceManager {
  private s3Config: {
    bucketName: string;
    region: string;
    baseUrl: string;
  };

  constructor() {
    this.s3Config = {
      bucketName: process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets',
      region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2',
      baseUrl: process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com'
    };
  }

  // 获取S3客户端
  private getS3Client() {
    // 检查环境变量
    let accessKeyId = process.env.AWS_ACCESS_KEY_ID
    let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    let bucketName = process.env.NEXT_PUBLIC_S3_BUCKET
    let region = process.env.NEXT_PUBLIC_S3_REGION

    // 如果环境变量未加载，返回错误
    if (!accessKeyId || !secretAccessKey) {
      console.log('环境变量未加载，AWS密钥未配置')
      throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.')
    }

    return new S3Client({
      region: region || 'us-east-2',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // 从S3获取模型列表
  async getModelsFromS3(): Promise<VRMModel[]> {
    try {
      const s3Client = this.getS3Client();
      
      // 只获取VRM文件夹中的文件
      const vrmCommand = new ListObjectsV2Command({
        Bucket: this.s3Config.bucketName,
        Prefix: 'vrm/',
      });

      const vrmResponse = await s3Client.send(vrmCommand);
      const vrmModels: VRMModel[] = [];

      if (vrmResponse.Contents) {
        for (const object of vrmResponse.Contents) {
          if (object.Key && object.Key.endsWith('.vrm')) {
            const fileName = object.Key.split('/').pop() || '';
            const modelName = fileName.replace('.vrm', '');
            
            vrmModels.push({
              id: `s3-${object.Key}`,
              name: modelName,
              url: `${this.s3Config.baseUrl}/${object.Key}`,
              category: 'vrm',
              thumbnail: null,
              tags: ['VRM', 'S3'],
              description: `S3中的VRM模型文件`,
              size: object.Size,
              type: 'model/vrm',
              createdAt: object.LastModified?.toISOString()
            });
          }
        }
      }

      return vrmModels;
    } catch (error) {
      console.error('从S3获取VRM模型失败:', error);
      return [];
    }
  }

  // 从S3获取动画列表
  async getAnimationsFromS3(): Promise<Animation[]> {
    try {
      const s3Client = this.getS3Client();
      const animations: Animation[] = [];
      
      // 获取animations文件夹中的文件
      const animationsCommand = new ListObjectsV2Command({
        Bucket: this.s3Config.bucketName,
        Prefix: 'animations/',
      });

      const animationsResponse = await s3Client.send(animationsCommand);

      if (animationsResponse.Contents) {
        for (const object of animationsResponse.Contents) {
          if (object.Key && object.Key.endsWith('.fbx')) {
            const fileName = object.Key.split('/').pop() || '';
            const animationName = fileName.replace('.fbx', '');
            
            animations.push({
              id: `s3-${object.Key}`,
              name: animationName,
              url: `${this.s3Config.baseUrl}/${object.Key}`,
              type: 'custom',
              thumbnail: null,
              tags: ['FBX', 'S3', 'Animation'],
              description: `S3中的动画文件`,
              duration: 0, // 可以后续添加动画时长检测
              size: object.Size,
              mimeType: 'application/octet-stream',
              createdAt: object.LastModified?.toISOString()
            });
          }
        }
      }

      // 获取fbx文件夹中的动画文件
      const fbxCommand = new ListObjectsV2Command({
        Bucket: this.s3Config.bucketName,
        Prefix: 'fbx/',
      });

      const fbxResponse = await s3Client.send(fbxCommand);

      if (fbxResponse.Contents) {
        for (const object of fbxResponse.Contents) {
          if (object.Key && object.Key.endsWith('.fbx')) {
            const fileName = object.Key.split('/').pop() || '';
            const animationName = fileName.replace('.fbx', '');
            
            // 检查是否已经添加过（避免重复）
            const existingAnimation = animations.find(a => a.name === animationName);
            if (!existingAnimation) {
              animations.push({
                id: `s3-${object.Key}`,
                name: animationName,
                url: `${this.s3Config.baseUrl}/${object.Key}`,
                type: 'custom',
                thumbnail: null,
                tags: ['FBX', 'S3', 'Animation'],
                description: `S3中的动画文件`,
                duration: 0, // 可以后续添加动画时长检测
                size: object.Size,
                mimeType: 'application/octet-stream',
                createdAt: object.LastModified?.toISOString()
              });
            }
          }
        }
      }

      return animations;
    } catch (error) {
      console.error('从S3获取动画失败:', error);
      return [];
    }
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
export const s3ResourceManager = new S3ResourceManager(); 