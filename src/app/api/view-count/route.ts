import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET: 记录一次访问并返回当前全站访问次数（Echuu 网站被访问的次数）
 * 每次打开主页面调用一次，用于主界面 VIEWS 展示
 */
export async function GET() {
  try {
    const result = await prisma.$queryRaw<[{ count: number }]>`
      INSERT INTO "SiteViewCounter" ("id", "count")
      VALUES ('default', 1)
      ON CONFLICT ("id") DO UPDATE SET "count" = "SiteViewCounter"."count" + 1
      RETURNING "count"
    `;
    const count = result[0]?.count ?? 0;
    return NextResponse.json({ count });
  } catch (e) {
    console.error('[view-count]', e);
    return NextResponse.json({ count: 0, error: 'Failed to update view count' }, { status: 500 });
  }
}
