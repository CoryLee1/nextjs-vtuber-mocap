/**
 * GET /api/vrm-thumbnail?url=...
 * 从指定 VRM 的 URL 拉取文件，解析 meta.thumbnailImage，返回缩略图图片。
 * 仅允许项目配置的 S3 或同源 URL，防止滥用。
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractVrmThumbnail } from '@/lib/vrm-thumbnail';

const S3_BASE = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com';

function isAllowedVrmUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (!url.toLowerCase().endsWith('.vrm')) return false;
    if (S3_BASE) {
      const s3Origin = new URL(S3_BASE).origin;
      if (u.origin === s3Origin) return true;
    }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return true;
    return false;
  } catch {
    return false;
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || !isAllowedVrmUrl(url)) {
    return NextResponse.json({ error: 'Invalid or disallowed url' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Echuu-VRM-Thumbnail/1' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'VRM fetch failed' }, { status: 502 });
    }
    const vrmBuffer = await res.arrayBuffer();
    const thumb = extractVrmThumbnail(vrmBuffer);
    if (!thumb) {
      return NextResponse.json({ error: 'No thumbnail in VRM' }, { status: 404 });
    }
    return new NextResponse(thumb.data, {
      headers: {
        'Content-Type': thumb.mimeType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    console.error('[vrm-thumbnail]', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to extract thumbnail' },
      { status: 500 }
    );
  }
}
