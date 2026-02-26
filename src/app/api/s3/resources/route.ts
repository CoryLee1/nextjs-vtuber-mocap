import { NextRequest, NextResponse } from 'next/server';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AssetStatus, AssetType, AssetVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/server-session';
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';
import { getModelThumbnailKey, mapResourceTypeToAssetType } from '@/lib/s3-asset-policy';

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic';

function parsePositiveInt(input: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(input || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

async function buildS3ClientForHead(): Promise<S3Client | null> {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2';
  if (!accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const assetType = mapResourceTypeToAssetType(type);
    if (!assetType) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid type parameter. Use "models", "animations", "bgm", "hdr", or "scene"',
        },
        { status: 400 }
      );
    }

    const page = parsePositiveInt(searchParams.get('page'), 1, 1, 1000000);
    const pageSize = parsePositiveInt(searchParams.get('pageSize'), 50, 1, 100);
    const skip = (page - 1) * pageSize;
    const sort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc';

    const where = {
      type: assetType,
      status: AssetStatus.READY,
      OR: [
        { ownerUserId: userId },
        { visibility: AssetVisibility.PUBLIC },
      ],
    };

    const [total, assets] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: sort },
        skip,
        take: pageSize,
      }),
    ]);

    if (assetType === AssetType.VRM) {
      const checkThumbs = searchParams.get('checkThumbs') === '1';
      const bucket = process.env.NEXT_PUBLIC_S3_BUCKET;
      const s3Client = checkThumbs && bucket ? await buildS3ClientForHead() : null;

      const models = await Promise.all(
        assets.map(async (asset) => {
          const thumbKey = getModelThumbnailKey(asset.s3Key);
          let hasThumbnail = false;
          if (thumbKey) {
            if (checkThumbs && s3Client && bucket) {
              try {
                await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: thumbKey }));
                hasThumbnail = true;
              } catch {
                hasThumbnail = false;
              }
            } else {
              hasThumbnail = true;
            }
          }

          return {
            id: `asset-${asset.id}`,
            name: asset.displayName,
            url: getS3ObjectReadUrlByKey(asset.s3Key),
            category: 'vrm',
            thumbnail: thumbKey && hasThumbnail ? getS3ObjectReadUrlByKey(thumbKey) : undefined,
            tags: ['VRM', 'S3'],
            description: 'Indexed VRM asset',
            size: asset.sizeBytes ?? undefined,
            type: asset.mimeType || 'model/vrm',
            createdAt: asset.createdAt.toISOString(),
            s3Key: asset.s3Key,
            hasThumbnail,
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: models,
        pagination: {
          page,
          pageSize,
          total,
          hasMore: skip + models.length < total,
        },
      });
    }

    if (assetType === AssetType.ANIMATION) {
      const animations = assets.map((asset) => ({
        id: `asset-${asset.id}`,
        name: asset.displayName,
        url: getS3ObjectReadUrlByKey(asset.s3Key),
        type: 'custom',
        thumbnail: null,
        tags: ['FBX', 'S3'],
        description: 'Indexed animation asset',
        duration: 0,
        size: asset.sizeBytes ?? undefined,
        mimeType: asset.mimeType || 'application/octet-stream',
        category: 'animation',
        createdAt: asset.createdAt.toISOString(),
        s3Key: asset.s3Key,
      }));
      return NextResponse.json({
        success: true,
        data: animations,
        pagination: {
          page,
          pageSize,
          total,
          hasMore: skip + animations.length < total,
        },
      });
    }

    // 其他类型先按统一资源结构返回（前端后续再接）
    const data = assets.map((asset) => ({
      id: `asset-${asset.id}`,
      name: asset.displayName,
      url: getS3ObjectReadUrlByKey(asset.s3Key),
      type: asset.mimeType || 'application/octet-stream',
      size: asset.sizeBytes ?? undefined,
      category: assetType.toLowerCase(),
      createdAt: asset.createdAt.toISOString(),
      s3Key: asset.s3Key,
    }));
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: skip + data.length < total,
      },
    });
  } catch (error) {
    console.error('S3 资源获取失败:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get resources from S3',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
