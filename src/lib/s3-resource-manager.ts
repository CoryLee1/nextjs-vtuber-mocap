import { S3Client, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { VRMModel, Animation } from '@/types';
import { ENV_CONFIG } from '../../env.config';
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';

export interface GetModelsFromS3Options {
  /** 是否检查缩略图是否真实存在（HeadObject），不存在则 thumbnail 不填且 hasThumbnail=false */
  checkThumbnails?: boolean;
}

/** 返回的模型项可带 s3Key、hasThumbnail（供客户端补证件照用） */
export type VRMModelFromS3 = VRMModel & { s3Key?: string; hasThumbnail?: boolean };

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

  // 从S3获取模型列表；checkThumbnails 为 true 时用 HeadObject 检查 _thumb.png 是否存在
  async getModelsFromS3(options?: GetModelsFromS3Options): Promise<VRMModelFromS3[]> {
    try {
      const s3Client = this.getS3Client();
      const checkThumbnails = options?.checkThumbnails ?? false;

      const vrmCommand = new ListObjectsV2Command({
        Bucket: this.s3Config.bucketName,
        Prefix: 'vrm/',
      });

      const vrmResponse = await s3Client.send(vrmCommand);
      const vrmModels: VRMModelFromS3[] = [];

      if (vrmResponse.Contents) {
        const vrmObjects = vrmResponse.Contents.filter(
          (o) => o.Key && o.Key.endsWith('.vrm')
        ) as { Key: string; Size?: number; LastModified?: Date }[];

        let hasThumbnailMap: Record<string, boolean> = {};
        if (checkThumbnails && vrmObjects.length > 0) {
          const headResults = await Promise.all(
            vrmObjects.map(async (object) => {
              const key = object.Key;
              const modelName = key.split('/').pop()?.replace(/\.vrm$/i, '') ?? '';
              const thumbnailKey = `vrm/${modelName}_thumb.png`;
              try {
                await s3Client.send(new HeadObjectCommand({
                  Bucket: this.s3Config.bucketName,
                  Key: thumbnailKey,
                }));
                return { key, hasThumbnail: true };
              } catch {
                return { key, hasThumbnail: false };
              }
            })
          );
          headResults.forEach((r) => {
            hasThumbnailMap[r.key] = r.hasThumbnail;
          });
        }

        for (const object of vrmObjects) {
          const key = object.Key;
          const fileName = key.split('/').pop() || '';
          const modelName = fileName.replace(/\.vrm$/i, '');
          const thumbnailKey = `vrm/${modelName}_thumb.png`;
          const thumbnailUrl = getS3ObjectReadUrlByKey(thumbnailKey);
          const hasThumbnail = checkThumbnails ? (hasThumbnailMap[key] ?? true) : true;

          vrmModels.push({
            id: `s3-${key}`,
            name: modelName,
            url: getS3ObjectReadUrlByKey(key),
            category: 'vrm',
            thumbnail: hasThumbnail ? thumbnailUrl : undefined,
            tags: ['VRM', 'S3'],
            description: `S3中的VRM模型文件`,
            size: object.Size,
            type: 'model/vrm',
            createdAt: object.LastModified?.toISOString(),
            s3Key: key,
            hasThumbnail,
          });
        }

        // 合并 vrm/xxx_meta.json（gender、attributes、suggestedVoice）
        await Promise.all(
          vrmModels.map(async (m) => {
            const modelName = m.name;
            const metaKey = `vrm/${modelName}_meta.json`;
            try {
              const getCmd = new GetObjectCommand({
                Bucket: this.s3Config.bucketName,
                Key: metaKey,
              });
              const obj = await s3Client.send(getCmd);
              if (!obj.Body) return;
              const body = await obj.Body.transformToByteArray();
              const json = JSON.parse(new TextDecoder().decode(body)) as {
                gender?: string;
                attributes?: string[];
                suggestedVoice?: string;
              };
              if (json.gender) m.gender = json.gender as 'male' | 'female' | 'neutral';
              if (Array.isArray(json.attributes)) m.attributes = json.attributes;
              if (json.suggestedVoice) m.suggestedVoice = json.suggestedVoice;
              // 将 AI 打标结果并入 tags，便于模型卡片直观看到标签并支持现有搜索逻辑
              const tagSet = new Set<string>(Array.isArray(m.tags) ? m.tags : []);
              if (json.gender) tagSet.add(`gender:${json.gender}`);
              if (Array.isArray(json.attributes)) {
                json.attributes.map((a) => String(a).trim()).filter(Boolean).forEach((a) => tagSet.add(a));
              }
              if (json.suggestedVoice) tagSet.add(`voice:${json.suggestedVoice}`);
              m.tags = Array.from(tagSet);
            } catch {
              // _meta.json 不存在或解析失败，忽略
            }
          })
        );
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
              url: getS3ObjectReadUrlByKey(object.Key),
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