import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { extractVrmThumbnail } from '@/lib/vrm-thumbnail'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    const userId = (session.user as any)?.id as string | undefined

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
    let envBucketName = process.env.NEXT_PUBLIC_S3_BUCKET
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

    // 写入 assets 记录
    const assetTypeMap: Record<string, string> = {
      'vrm/': 'VRM', 'animations/': 'ANIMATION', 'bgm/': 'BGM', 'hdr/': 'HDR', 'scene/': 'SCENE',
    }
    const assetType = Object.entries(assetTypeMap).find(([p]) => fileName.startsWith(p))?.[1] ?? 'OTHER'
    await prisma.asset.upsert({
      where: { s3Key: fileName },
      update: { status: 'ACTIVE', userId: userId ?? null },
      create: { s3Key: fileName, assetType: assetType as any, status: 'ACTIVE', visibility: 'PRIVATE', userId: userId ?? null },
    })

    // VRM 上传成功后自动从文件中解析缩略图并写入 S3（vrm/xxx_thumb.png）
    const isVrm = /^vrm\/.+\\.vrm$/i.test(fileName)
    if (isVrm && bytes.byteLength > 0) {
      try {
        const thumb = extractVrmThumbnail(bytes)
        if (thumb && thumb.data.byteLength > 0) {
          const thumbKey = fileName.replace(/\.vrm$/i, '_thumb.png')
          await s3Client.send(new PutObjectCommand({
            Bucket: bucketName,
            Key: thumbKey,
            Body: Buffer.from(thumb.data),
            ContentType: thumb.mimeType || 'image/png',
          }))
          console.log('VRM 缩略图已自动保存:', thumbKey)
        }
      } catch (thumbErr) {
        console.warn('VRM 缩略图自动保存失败（不影响主文件）:', thumbErr)
      }
    }

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