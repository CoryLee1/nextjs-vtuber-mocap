import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { PresignedUrlRequest, PresignedUrlResponse, ApiResponse } from '@/types'

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PresignedUrlResponse>>> {
  try {
    const body: PresignedUrlRequest = await request.json()
    const { fileName, fileType, contentType } = body

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

    const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET
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

    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: contentType || fileType,
    })

    // 生成预签名 URL（15分钟有效期）
    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 900, // 15 minutes
    })

    const response: PresignedUrlResponse = {
      url,
      expiresIn: 900,
    }

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