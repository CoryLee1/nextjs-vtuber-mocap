import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListBucketsCommand, GetBucketLocationCommand } from '@aws-sdk/client-s3'

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic'

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 检查环境变量
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET;
    const region = process.env.NEXT_PUBLIC_S3_REGION;

    console.log('环境变量检查:', {
      hasAccessKey: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
      accessKeyLength: accessKeyId?.length,
      secretKeyLength: secretAccessKey?.length,
      accessKeyPrefix: accessKeyId?.substring(0, 5) + '...',
      secretKeyPrefix: secretAccessKey?.substring(0, 5) + '...',
      bucketName,
      region
    });

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({
        success: false,
        error: 'AWS凭证未配置',
        details: {
          hasAccessKey: !!accessKeyId,
          hasSecretKey: !!secretAccessKey
        }
      }, { status: 500 });
    }

    // 验证AWS凭证格式
    if (!accessKeyId.startsWith('AKIA') || accessKeyId.length !== 20) {
      return NextResponse.json({
        success: false,
        error: 'AWS Access Key格式不正确',
        details: {
          expectedFormat: 'AKIA... (20 characters)',
          actualLength: accessKeyId.length,
          actualPrefix: accessKeyId.substring(0, 4),
          actualValue: accessKeyId
        }
      }, { status: 500 });
    }

    if (secretAccessKey.length !== 40) {
      return NextResponse.json({
        success: false,
        error: 'AWS Secret Key格式不正确',
        details: {
          expectedLength: 40,
          actualLength: secretAccessKey.length,
          actualValue: secretAccessKey
        }
      }, { status: 500 });
    }

    // 检查凭证是否包含特殊字符
    const hasSpecialChars = /[^A-Za-z0-9]/.test(accessKeyId) || /[^A-Za-z0-9+/=]/.test(secretAccessKey);
    if (hasSpecialChars) {
      return NextResponse.json({
        success: false,
        error: 'AWS凭证包含无效字符',
        details: {
          accessKeyHasSpecialChars: /[^A-Za-z0-9]/.test(accessKeyId),
          secretKeyHasSpecialChars: /[^A-Za-z0-9+/=]/.test(secretAccessKey)
        }
      }, { status: 500 });
    }

    // 1. 测试AWS凭证是否有效
    console.log('测试AWS凭证...')
    const listBucketsCommand = new ListBucketsCommand({})
    const bucketsResult = await s3Client.send(listBucketsCommand)
    
    console.log('可访问的S3 Buckets:', bucketsResult.Buckets?.map(b => b.Name))

    // 2. 检查目标bucket是否存在
    if (!bucketName) {
      return NextResponse.json({
        success: false,
        error: 'NEXT_PUBLIC_S3_BUCKET 环境变量未配置'
      }, { status: 500 })
    }

    console.log('检查目标bucket:', bucketName)
    
    // 检查bucket是否存在
    const bucketExists = bucketsResult.Buckets?.some(bucket => bucket.Name === bucketName)
    
    if (!bucketExists) {
      return NextResponse.json({
        success: false,
        error: `Bucket '${bucketName}' 不存在或无法访问`,
        availableBuckets: bucketsResult.Buckets?.map(b => b.Name)
      }, { status: 404 })
    }

    // 3. 测试bucket权限
    try {
      const getBucketLocationCommand = new GetBucketLocationCommand({
        Bucket: bucketName
      })
      await s3Client.send(getBucketLocationCommand)
      
      return NextResponse.json({
        success: true,
        message: `Bucket '${bucketName}' 访问正常`,
        bucketName,
        region,
        availableBuckets: bucketsResult.Buckets?.map(b => b.Name)
      })
    } catch (bucketError) {
      return NextResponse.json({
        success: false,
        error: `无法访问Bucket '${bucketName}': ${bucketError instanceof Error ? bucketError.message : '未知错误'}`,
        availableBuckets: bucketsResult.Buckets?.map(b => b.Name)
      }, { status: 403 })
    }

  } catch (error) {
    console.error('AWS权限测试失败:', error)
    
    return NextResponse.json({
      success: false,
      error: 'AWS凭证无效或权限不足',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 