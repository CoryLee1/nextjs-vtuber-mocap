/**
 * 同源代理：在服务端拉取第三方头像（如 Google），避免 COEP 下跨域图被拦截。
 * 仅允许已知的 OAuth 头像域名。
 */

import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://lh3.googleusercontent.com',
  'https://avatars.githubusercontent.com',
  'https://cdn.discordapp.com',
];

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const origin = u.origin;
    return ALLOWED_ORIGINS.some((o) => origin === o);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url || !isAllowedUrl(url)) {
    return NextResponse.json({ error: 'Invalid or disallowed url' }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VTuberMocap-AvatarProxy/1' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream fetch failed' }, { status: 502 });
    }
    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (e) {
    console.warn('Avatar proxy error:', e);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
  }
}
