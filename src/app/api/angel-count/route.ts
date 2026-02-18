import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET: 返回已加入 Echuu 的天使（已注册用户）数量，供主界面展示
 */
export async function GET() {
  try {
    const count = await prisma.user.count();
    return NextResponse.json({ count });
  } catch (e) {
    console.error('[angel-count]', e);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
