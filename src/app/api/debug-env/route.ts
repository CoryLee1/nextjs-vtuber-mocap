import { NextRequest, NextResponse } from 'next/server'
import { getSessionUserId } from '@/lib/server-session'

// 告诉Next.js这是一个动态路由
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 检查所有环境变量
    const envVars = {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '已配置' : '未配置',
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '已配置' : '未配置',
      NEXT_PUBLIC_S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET,
      NEXT_PUBLIC_S3_REGION: process.env.NEXT_PUBLIC_S3_REGION,
      NEXT_PUBLIC_S3_BASE_URL: process.env.NEXT_PUBLIC_S3_BASE_URL,
      NODE_ENV: process.env.NODE_ENV,
      PWD: process.env.PWD,
    };

    console.log('环境变量调试:', envVars);

    return NextResponse.json({
      success: true,
      data: envVars
    });

  } catch (error) {
    console.error('环境变量调试失败:', error);
    
    return NextResponse.json({
      success: false,
      error: '环境变量调试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
} 
