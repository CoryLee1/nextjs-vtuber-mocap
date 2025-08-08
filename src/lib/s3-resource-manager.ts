import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { VRMModel, Animation } from '@/types';
import { ENV_CONFIG } from '../../env.config';

export class S3ResourceManager {
  private s3Config: {
    bucketName: string;
    region: string;
    baseUrl: string;
  };

  constructor() {
    this.s3Config = {
      bucketName: ENV_CONFIG.S3.BUCKET,
      region: ENV_CONFIG.S3.REGION,
      baseUrl: ENV_CONFIG.S3.BASE_URL
    };
  }

  // 获取S3客户端
  private getS3Client() {
    // 检查环境变量
    let accessKeyId = ENV_CONFIG.S3.ACCESS_KEY_ID
    let secretAccessKey = ENV_CONFIG.S3.SECRET_ACCESS_KEY
    let bucketName = ENV_CONFIG.S3.BUCKET
    let region = ENV_CONFIG.S3.REGION

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
              type: 'fbx',
              thumbnail: null,
              tags: ['FBX', 'S3'],
              description: `S3中的动画文件`,
              duration: 0,
              size: object.Size,
              mimeType: 'application/octet-stream',
              category: 'animation',
              createdAt: object.LastModified?.toISOString()
            });
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

export default new S3ResourceManager(); 