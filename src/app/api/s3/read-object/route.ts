import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const dynamic = 'force-dynamic';

const FALLBACK_BUCKET = 'nextjs-vtuber-assets';
const FALLBACK_REGION = 'us-east-2';
const FALLBACK_PUBLIC_BASE = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com';

function normalizeKey(raw: string): string {
  try {
    return decodeURIComponent(raw).replace(/^\/+/, '');
  } catch {
    return raw.replace(/^\/+/, '');
  }
}

function isAllowedKey(key: string): boolean {
  if (!key || key.includes('..')) return false;
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

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucket = process.env.NEXT_PUBLIC_S3_BUCKET || FALLBACK_BUCKET;
    const region = process.env.NEXT_PUBLIC_S3_REGION || FALLBACK_REGION;
    const envPublicBase = process.env.NEXT_PUBLIC_S3_BASE_URL;
    const publicBase = envPublicBase && !envPublicBase.includes('your-bucket')
      ? envPublicBase
      : FALLBACK_PUBLIC_BASE;

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

    try {
      // 先探测服务端凭证是否具备对象读取权限，避免返回“必然 403”的签名 URL。
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    } catch {
      const fallbackUrl = `${publicBase.replace(/\/+$/, '')}/${key}`;
      const fallbackResponse = NextResponse.redirect(fallbackUrl, { status: 302 });
      fallbackResponse.headers.set('Cache-Control', 'no-store');
      fallbackResponse.headers.set('x-s3-read-fallback', 'public-url');
      return fallbackResponse;
    }

    const signedUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
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
