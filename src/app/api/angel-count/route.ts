import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET: 返回已加入 Echuu 的天使（已注册用户）数量，供主界面展示
 * 若数据库不可用则返回 200 + { count: 0 }，避免前端 500
 */
export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const count = await prisma.user.count();
    return NextResponse.json({ count });
  } catch (e) {
    console.error('[angel-count]', e);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
