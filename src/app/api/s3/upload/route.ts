import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const fileType = formData.get('fileType') as string
    const bucketName = formData.get('bucketName') as string

    console.log('收到文件上传请求:', { fileName, fileType, bucketName })

    if (!file || !fileName || !fileType || !bucketName) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required parameters: file, fileName, fileType, or bucketName'
        },
        { status: 400 }
      )
    }

    // 检查环境变量
    let accessKeyId = process.env.AWS_ACCESS_KEY_ID
    let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
    let region = process.env.NEXT_PUBLIC_S3_REGION

    // 如果环境变量未加载，使用硬编码值（临时解决方案）
    if (!accessKeyId || !secretAccessKey) {
      console.log('环境变量未加载，使用硬编码值')
      accessKeyId = 'AKIA2YUYL2OOHJJCAFUA'
      secretAccessKey = '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'
      region = 'us-east-2'
    }

    console.log('环境变量检查:', {
      hasAccessKey: !!accessKeyId,
      hasSecretKey: !!secretAccessKey,
      region
    })

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'AWS credentials not configured'
        },
        { status: 500 }
      )
    }

    // 创建 S3 客户端
    const s3Client = new S3Client({
      region: region || 'us-east-2',
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })

    // 将文件转换为 Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 创建 PutObject 命令
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: fileType,
      ContentLength: file.size,
    })

    // 上传到 S3
    await s3Client.send(command)

    console.log('文件上传成功:', { fileName, size: file.size })

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileName,
        originalName: file.name,
        size: file.size,
        type: fileType
      }
    })

  } catch (error) {
    console.error('S3 文件上传失败:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to upload file to S3',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 