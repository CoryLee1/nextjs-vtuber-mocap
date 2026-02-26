import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AssetStatus, AssetType, AssetVisibility } from '@prisma/client';
import { extractVrmThumbnail } from '@/lib/vrm-thumbnail';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/server-session';
import { buildUserScopedS3Key } from '@/lib/s3-asset-policy';
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let scopedKey: string | null = null;
  let userId: string | null = null;
  let uploadAssetType: AssetType | null = null;
  let uploadDisplayName = '';
  let uploadFileType = '';
  let uploadFileSize = 0;

  try {
    userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileName = formData.get('fileName') as string;
    const fileType = formData.get('fileType') as string;

    if (!file || !fileName || !fileType) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required parameters: file, fileName, or fileType',
        },
        { status: 400 }
      );
    }

    // 检查环境变量
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const envBucketName = process.env.NEXT_PUBLIC_S3_BUCKET;
    const region = process.env.NEXT_PUBLIC_S3_REGION;

    if (!envBucketName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'S3 bucket not configured.',
            code: 'S3_NOT_CONFIGURED',
          },
        },
        { status: 500 }
      );
    }

    // 如果环境变量未加载，返回错误
    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
            code: 'AWS_NOT_CONFIGURED',
          },
        },
        { status: 500 }
      );
    }

    const keyInfo = buildUserScopedS3Key(userId, fileName, file.name);
    scopedKey = keyInfo.key;
    uploadAssetType = keyInfo.assetType;
    uploadDisplayName = keyInfo.displayName;
    uploadFileType = fileType;
    uploadFileSize = file.size;

    await prisma.asset.upsert({
      where: { s3Key: scopedKey },
      update: {
        type: uploadAssetType,
        displayName: uploadDisplayName,
        mimeType: uploadFileType,
        sizeBytes: uploadFileSize,
        status: AssetStatus.UPLOADING,
        ownerUserId: userId,
        visibility: AssetVisibility.PRIVATE,
        errorCode: null,
      },
      create: {
        s3Key: scopedKey,
        type: uploadAssetType,
        displayName: uploadDisplayName,
        mimeType: uploadFileType,
        sizeBytes: uploadFileSize,
        status: AssetStatus.UPLOADING,
        ownerUserId: userId,
        visibility: AssetVisibility.PRIVATE,
      },
    });

    // 创建 S3 客户端
    const s3Client = new S3Client({
      region: region || 'us-east-2',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // 将文件转换为 Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: envBucketName,
      Key: scopedKey,
      Body: buffer,
      ContentType: fileType,
      ContentLength: file.size,
    });

    // 上传到 S3
    await s3Client.send(command);

    // VRM 上传成功后自动从文件中解析缩略图并写入 S3（vrm/xxx_thumb.png）
    const isVrm = /\.vrm$/i.test(scopedKey);
    if (isVrm && bytes.byteLength > 0) {
      try {
        const thumb = extractVrmThumbnail(bytes);
        if (thumb && thumb.data.byteLength > 0) {
          const thumbKey = scopedKey.replace(/\.vrm$/i, '_thumb.png');
          await s3Client.send(new PutObjectCommand({
            Bucket: envBucketName,
            Key: thumbKey,
            Body: Buffer.from(thumb.data),
            ContentType: thumb.mimeType || 'image/png',
          }));
        }
      } catch (thumbErr) {
        console.warn('VRM 缩略图自动保存失败（不影响主文件）:', thumbErr);
      }
    }

    await prisma.asset.update({
      where: { s3Key: scopedKey },
      data: {
        status: AssetStatus.READY,
        errorCode: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName: scopedKey,
        originalName: file.name,
        size: file.size,
        type: fileType,
        url: getS3ObjectReadUrlByKey(scopedKey),
      },
    });

  } catch (error) {
    if (scopedKey) {
      try {
        await prisma.asset.upsert({
          where: { s3Key: scopedKey },
          update: {
            status: AssetStatus.FAILED,
            errorCode: error instanceof Error ? error.name || 'UPLOAD_FAILED' : 'UPLOAD_FAILED',
            ownerUserId: userId ?? undefined,
          },
          create: {
            s3Key: scopedKey,
            type: uploadAssetType || AssetType.ANIMATION,
            displayName: uploadDisplayName || scopedKey.split('/').pop() || 'unknown',
            mimeType: uploadFileType || undefined,
            sizeBytes: uploadFileSize || undefined,
            status: AssetStatus.FAILED,
            errorCode: error instanceof Error ? error.name || 'UPLOAD_FAILED' : 'UPLOAD_FAILED',
            ownerUserId: userId ?? undefined,
            visibility: AssetVisibility.PRIVATE,
          },
        });
      } catch (dbErr) {
        console.error('上传失败状态回写失败:', dbErr);
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload file to S3',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
