import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { AssetStatus, AssetVisibility } from '@prisma/client'
import { PresignedUrlRequest, PresignedUrlResponse, ApiResponse } from '@/types'
import { prisma } from '@/lib/prisma'
import { getSessionUserId } from '@/lib/server-session'
import { buildUserScopedS3Key } from '@/lib/s3-asset-policy'

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PresignedUrlResponse>>> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Unauthorized',
            code: 'UNAUTHORIZED',
          },
        },
        { status: 401 }
      );
    }

    const body: PresignedUrlRequest = await request.json()
    const { fileName, fileType, contentType } = body

    console.log('收到预签名URL请求:', { fileName, fileType, contentType })

    if (!fileName || !fileType) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Missing required parameters: fileName and fileType',
            code: 'MISSING_PARAMETERS'
          }
        },
        { status: 400 }
      )
    }

    // 检查环境变量
    let accessKeyId = process.env.AWS_ACCESS_KEY_ID
    let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    let bucketName = process.env.NEXT_PUBLIC_S3_BUCKET
    let region = process.env.NEXT_PUBLIC_S3_REGION

    // 如果环境变量未加载，返回错误
    if (!accessKeyId || !secretAccessKey) {
      console.log('环境变量未加载，AWS密钥未配置')
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.',
            code: 'AWS_NOT_CONFIGURED'
          }
        },
        { status: 500 }
      )
    }

    console.log('环境变量检查:', {
      hasAccessKey: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
      bucketName,
      region
    })

    if (!bucketName) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'S3 bucket not configured',
            code: 'S3_NOT_CONFIGURED'
          }
        },
        { status: 500 }
      )
    }

    const keyInfo = buildUserScopedS3Key(userId, fileName, fileName);
    const scopedKey = keyInfo.key;

    await prisma.asset.upsert({
      where: { s3Key: scopedKey },
      update: {
        type: keyInfo.assetType,
        displayName: keyInfo.displayName,
        mimeType: contentType || fileType,
        status: AssetStatus.UPLOADING,
        ownerUserId: userId,
        visibility: AssetVisibility.PRIVATE,
        errorCode: null,
      },
      create: {
        s3Key: scopedKey,
        type: keyInfo.assetType,
        displayName: keyInfo.displayName,
        mimeType: contentType || fileType,
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
    })

    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: scopedKey,
      ContentType: contentType || fileType,
    })

    // 生成预签名 URL（15分钟有效期）
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    })

    const response: PresignedUrlResponse = {
      url,
      expiresIn: 900,
      fields: {
        key: scopedKey,
      },
    }

    console.log('预签名URL生成成功:', { fileName: scopedKey, url: url.substring(0, 50) + '...' })

    return NextResponse.json({
      success: true,
      data: response,
    })

  } catch (error) {
    console.error('S3 预签名 URL 生成失败:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to generate presigned URL',
          code: 'S3_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    )
  }
} 
