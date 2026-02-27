import { NextRequest, NextResponse } from 'next/server'
import s3ResourceManager from '@/lib/s3-resource-manager'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'models' or 'animations'

    console.log('收到S3资源请求:', { type })

    if (type === 'models') {
      const checkThumbs = searchParams.get('checkThumbs') === '1'
      const models = await s3ResourceManager.getModelsFromS3({ checkThumbnails: checkThumbs })
      return NextResponse.json({
        success: true,
        data: models
      })
    } else if (type === 'animations') {
      const animations = await s3ResourceManager.getAnimationsFromS3()
      return NextResponse.json({
        success: true,
        data: animations
      })
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid type parameter. Use "models" or "animations"'
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('S3 资源获取失败:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get resources from S3',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 