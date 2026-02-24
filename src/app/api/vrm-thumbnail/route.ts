/**
 * GET /api/vrm-thumbnail?url=...
 * 从指定 VRM 的 URL 拉取文件，解析 meta.thumbnailImage，返回缩略图图片。
 * 仅允许项目配置的 S3 或同源 URL，防止滥用。
 * 若 URL 指向我方 S3（或 read-object），提取成功后自动将缩略图回写 S3（vrm/xxx_thumb.png），后续请求直接走 read-object。
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { extractVrmThumbnail } from '@/lib/vrm-thumbnail';

const S3_BASE = process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com';
const BUCKET = process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets';
const REGION = process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2';

/** 判断 URL 是否指向 VRM 资源：path 或 key 参数以 .vrm 结尾 */
function urlPointsToVrm(u: URL): boolean {
  if (u.pathname.toLowerCase().endsWith('.vrm')) return true;
  const key = u.searchParams.get('key') || '';
  return key.toLowerCase().endsWith('.vrm');
}

/** 解析为绝对 URL（同源相对路径时用 request 的 origin） */
function resolveVrmUrl(url: string, request: NextRequest): string {
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const origin = request.nextUrl.origin;
  return origin + (trimmed.startsWith('/') ? trimmed : '/' + trimmed);
}

function isAllowedVrmUrl(url: string, request: NextRequest): { allowed: boolean; absoluteUrl: string } {
  try {
    const absoluteUrl = resolveVrmUrl(url, request);
    const u = new URL(absoluteUrl);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { allowed: false, absoluteUrl };
    if (!urlPointsToVrm(u)) return { allowed: false, absoluteUrl };
    if (S3_BASE) {
      const s3Origin = new URL(S3_BASE).origin;
      if (u.origin === s3Origin) return { allowed: true, absoluteUrl };
    }
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return { allowed: true, absoluteUrl };
    // 同源（本机 /api/s3/read-object?key=vrm/xxx.vrm）
    if (u.pathname.startsWith('/api/') && urlPointsToVrm(u)) return { allowed: true, absoluteUrl };
    return { allowed: false, absoluteUrl };
  } catch {
    return { allowed: false, absoluteUrl: url };
  }
}

/** 从 VRM 的请求 URL 推导 S3 对象 key（vrm/xxx.vrm），用于回写缩略图 */
function getVrmS3KeyFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.searchParams.has('key')) {
      const key = decodeURIComponent(u.searchParams.get('key') || '');
      if (key.startsWith('vrm/') && key.toLowerCase().endsWith('.vrm')) return key;
    }
    const path = u.pathname.replace(/^\/+/, '');
    if (path.startsWith('vrm/') && path.toLowerCase().endsWith('.vrm')) return path;
    return null;
  } catch {
    return null;
  }
}

function isOurS3OrReadObject(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.searchParams.has('key')) return true; // /api/s3/read-object?key=...
    if (S3_BASE && u.origin === new URL(S3_BASE).origin) return true;
    return false;
  } catch {
    return false;
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Invalid or disallowed url' }, { status: 400 });
  }
  const { allowed, absoluteUrl } = isAllowedVrmUrl(url, request);
  if (!allowed) {
    return NextResponse.json({ error: 'Invalid or disallowed url' }, { status: 400 });
  }

  try {
    const res = await fetch(absoluteUrl, {
      headers: { 'User-Agent': 'Echuu-VRM-Thumbnail/1' },
      signal: AbortSignal.timeout(60000), // VRM 可能较大，60s 超时
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'VRM fetch failed' }, { status: 502 });
    }
    const vrmBuffer = await res.arrayBuffer();
    const thumb = extractVrmThumbnail(vrmBuffer);
    if (!thumb) {
      return NextResponse.json({ error: 'No thumbnail in VRM' }, { status: 404 });
    }

    // 若 URL 指向我方 S3，将缩略图回写 S3，下次列表可直接用 vrm/xxx_thumb.png
    if (isOurS3OrReadObject(absoluteUrl)) {
      const vrmKey = getVrmS3KeyFromUrl(absoluteUrl);
      if (vrmKey && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        try {
          const thumbKey = vrmKey.replace(/\.vrm$/i, '_thumb.png');
          const s3 = new S3Client({
            region: REGION,
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: thumbKey,
            Body: Buffer.from(thumb.data),
            ContentType: thumb.mimeType || 'image/png',
          }));
          console.log('[vrm-thumbnail] 已回写 S3:', thumbKey);
        } catch (saveErr) {
          console.warn('[vrm-thumbnail] 回写 S3 失败:', saveErr);
        }
      }
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
