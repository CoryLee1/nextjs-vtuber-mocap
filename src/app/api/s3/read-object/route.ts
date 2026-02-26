import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { prisma } from '@/lib/prisma';
import { getSessionUserId } from '@/lib/server-session';
import { isAssetReadableByUser } from '@/lib/s3-asset-policy';

export const dynamic = 'force-dynamic';

const FALLBACK_BUCKET = 'nextjs-vtuber-assets';
const FALLBACK_REGION = 'us-east-2';

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif)$/i;
const THUMB_SUFFIX_RE = /_thumb\.(png|jpe?g|webp)$/i;

function normalizeKey(raw: string): string {
  try {
    return decodeURIComponent(raw).replace(/^\/+/, '');
  } catch {
    return raw.replace(/^\/+/, '');
  }
}

function isAllowedKey(key: string): boolean {
  if (!key || key.includes('..')) return false;
  const userScoped = /^user\/[^/]+\/(vrm|animations|bgm|hdr|scene)\/.+$/i.test(key);
  if (userScoped) return true;
  // 仅允许读取常用资源前缀与历史根目录默认模型
  return (
    key.startsWith('vrm/') ||
    key.startsWith('animations/') ||
    key.startsWith('bgm/') ||
    key.startsWith('hdr/') ||
    key.startsWith('scene/') ||
    /^AvatarSample_[A-Z]\.vrm$/i.test(key)
  );
}

/** 是否为图片 key：用于直接代理返回 body，避免 <img> 跟随 302 导致裂图 */
function isImageKey(key: string): boolean {
  return THUMB_SUFFIX_RE.test(key) || IMAGE_EXT_RE.test(key);
}

function contentTypeFromKey(key: string): string {
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  if (key.endsWith('.webp')) return 'image/webp';
  if (key.endsWith('.gif')) return 'image/gif';
  return 'application/octet-stream';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const keyParam = request.nextUrl.searchParams.get('key');
    if (!keyParam) {
      return NextResponse.json({ success: false, message: 'Missing key' }, { status: 400 });
    }

    const key = normalizeKey(keyParam);
    if (!isAllowedKey(key)) {
      return NextResponse.json({ success: false, message: 'Invalid key' }, { status: 400 });
    }

    const userId = await getSessionUserId();

    // 先查 assets 索引再授权；不存在即拒绝。
    let asset = await prisma.asset.findUnique({ where: { s3Key: key } });
    if (!asset && THUMB_SUFFIX_RE.test(key)) {
      const vrmKey = key.replace(/_thumb\.(png|jpe?g|webp)$/i, '.vrm');
      asset = await prisma.asset.findUnique({ where: { s3Key: vrmKey } });
    }

    if (asset) {
      if (!isAssetReadableByUser(asset, userId)) {
        if (!userId) {
          return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ success: false, message: 'Asset not found' }, { status: 404 });
    }

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || FALLBACK_BUCKET;
    const region = process.env.NEXT_PUBLIC_S3_REGION || FALLBACK_REGION;

    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        { success: false, message: 'AWS credentials not configured' },
        { status: 500 }
      );
    }

    const s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // S3 key 格式回退：部分上传/存储用 + 表示空格，先试原始 key，失败再试 space↔+ 变体
    let resolvedKey = key;
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      resolvedKey = key;
    } catch {
      const keyWithPlus = key.replace(/ /g, '+');
      const keyWithSpaces = key.replace(/\+/g, ' ');
      const alternates = keyWithPlus !== key ? [keyWithPlus] : keyWithSpaces !== key ? [keyWithSpaces] : [];
      let found = false;
      for (const alt of alternates) {
        try {
          await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: alt }));
          resolvedKey = alt;
          found = true;
          break;
        } catch {
          /* try next */
        }
      }
      if (!found) {
        return NextResponse.json({ success: false, message: 'Object not found' }, { status: 404 });
      }
    }

    // 图片类 key 或 ?proxy=1 时直接代理返回 body（补全缩略图等需同源拉取 VRM，避免 302 跨域）
    const proxyMode = request.nextUrl.searchParams.get('proxy') === '1';
    if (isImageKey(resolvedKey) || proxyMode) {
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: resolvedKey });
      const obj = await s3Client.send(getCmd);
      if (!obj.Body) {
        return NextResponse.json({ success: false, message: 'Empty object' }, { status: 404 });
      }
      const body = await obj.Body.transformToByteArray();
      const contentType = obj.ContentType || (resolvedKey.endsWith('.vrm') ? 'model/vrm' : contentTypeFromKey(resolvedKey));
      const isThumbKey = THUMB_SUFFIX_RE.test(resolvedKey);
      return new NextResponse(body, {
        headers: {
          'Content-Type': contentType,
          // _thumb 图片会被同名覆盖上传，需禁用缓存避免看到旧图
          'Cache-Control': proxyMode || isThumbKey ? 'no-store' : 'public, max-age=86400',
        },
      });
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: resolvedKey }),
      { expiresIn: 300 }
    );

    const response = NextResponse.redirect(signedUrl, { status: 302 });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sign read URL',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
