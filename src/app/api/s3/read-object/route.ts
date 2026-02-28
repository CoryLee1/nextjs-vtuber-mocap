import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const FALLBACK_BUCKET = 'nextjs-vtuber-assets';
const FALLBACK_REGION = 'us-east-2';
const FALLBACK_PUBLIC_BASE = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com';

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
  // 仅允许读取常用资源前缀与历史根目录默认模型（models/ 为 S3 桶内模型文件夹）
  return (
    key.startsWith('vrm/') ||
    key.startsWith('models/') ||
    key.startsWith('animations/') ||
    key.startsWith('bgm/') ||
    key.startsWith('hdr/') ||
    key.startsWith('scene/') ||
    /^AvatarSample_[A-Z]\.vrm$/i.test(key)
  );
}

/** 预设资源 key：无需查库即可读 S3，避免 DB 未配置/未入库时 500 */
const DEFAULT_READ_ALLOWED_KEYS = new Set<string>([
  // 默认预览模型（S3 桶内 models/ 文件夹，与 vrm/ 二选一）
  'models/AvatarSample_A.vrm',
  'models/AvatarSample_A_thumb.png',
  // VRM 样本模型及缩略图（resource-manager 内置，vrm/ 前缀）
  'vrm/AvatarSample_A.vrm',
  'vrm/AvatarSample_A_thumb.png',
  'vrm/AvatarSample_B.vrm',
  'vrm/AvatarSample_B_thumb.png',
  'vrm/AvatarSample_C.vrm',
  'vrm/AvatarSample_C_thumb.png',
  'vrm/AvatarSample_D.vrm',
  'vrm/AvatarSample_D_thumb.png',
  'vrm/AvatarSample_E.vrm',
  'vrm/AvatarSample_E_thumb.png',
  'vrm/AvatarSample_F.vrm',
  'vrm/AvatarSample_F_thumb.png',
  'vrm/AvatarSample_G.vrm',
  'vrm/AvatarSample_G_thumb.png',
  'vrm/AvatarSample_H.vrm',
  'vrm/AvatarSample_H_thumb.png',
  'vrm/AvatarSample_I.vrm',
  'vrm/AvatarSample_I_thumb.png',
  'vrm/AvatarSample_J.vrm',
  'vrm/AvatarSample_J_thumb.png',
  'vrm/AvatarSample_K.vrm',
  'vrm/AvatarSample_K_thumb.png',
  'vrm/AvatarSample_L.vrm',
  'vrm/AvatarSample_L_thumb.png',
  'vrm/AvatarSample_M.vrm',
  'vrm/AvatarSample_M_thumb.png',
  'vrm/AvatarSample_N.vrm',
  'vrm/AvatarSample_N_thumb.png',
  'vrm/AvatarSample_R.vrm',
  'vrm/AvatarSample_R_thumb.png',
  'vrm/AvatarSample_Z.vrm',
  'vrm/AvatarSample_Z_thumb.png',
  // 全量内置动画（vtuber-animations.ts ALL_ANIMATION_FILES + 额外文件）
  'animations/Bashful.fbx',
  'animations/Breakdance 1990.fbx',
  'animations/Breakdance Uprock Var 2.fbx',
  'animations/Capoeira.fbx',
  'animations/Disappointed.fbx',
  'animations/Idle.fbx',
  'animations/Listening To Music.fbx',
  'animations/Mma Kick.fbx',
  'animations/Sad Idle.fbx',
  'animations/Sitting Laughing.fbx',
  'animations/Sitting Talking.fbx',
  'animations/Standing Greeting (1).fbx',
  'animations/Talking.fbx',
  'animations/Taunt.fbx',
  'animations/Telling A Secret.fbx',
  'animations/Thinking.fbx',
  'animations/Twist Dance.fbx',
]);

function isDefaultReadAllowedKey(key: string): boolean {
  return DEFAULT_READ_ALLOWED_KEYS.has(key);
}

/** 预设资源的 presigned URL 缓存，减少重复/并发请求时的 S3 签名延迟（TTL 50 分钟，小于 1 小时有效期） */
const PRESIGNED_CACHE_TTL_MS = 50 * 60 * 1000;
const presignedUrlCache = new Map<string, { url: string; expiresAt: number }>();
function getCachedPresignedUrl(resolvedKey: string): string | null {
  const entry = presignedUrlCache.get(resolvedKey);
  if (!entry || entry.expiresAt <= Date.now()) {
    if (entry) presignedUrlCache.delete(resolvedKey);
    return null;
  }
  return entry.url;
}
function setCachedPresignedUrl(resolvedKey: string, url: string): void {
  presignedUrlCache.set(resolvedKey, {
    url,
    expiresAt: Date.now() + PRESIGNED_CACHE_TTL_MS,
  });
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

    // 预设资源跳过 DB；其他允许前缀的 key 在 DB 不可用/未入库时回退到 S3，避免 500
    const skipDbCheck = isDefaultReadAllowedKey(key);
    let allowS3Fallback = false;
    if (!skipDbCheck) {
      let asset;
      try {
        asset = await prisma.asset.findUnique({ where: { s3Key: key } });
      } catch (dbError) {
        console.error('[s3/read-object] DB lookup failed:', dbError);
        if (isAllowedKey(key)) {
          allowS3Fallback = true;
        } else {
          return NextResponse.json(
            { success: false, message: 'Asset lookup failed' },
            { status: 500 }
          );
        }
      }
      if (!allowS3Fallback) {
        if (!asset || asset.status !== 'ACTIVE') {
          if (isAllowedKey(key)) allowS3Fallback = true;
          else return NextResponse.json({ success: false, message: 'Resource not found' }, { status: 404 });
        } else if (asset.visibility === 'PRIVATE') {
          const session = await getServerSession(authOptions);
          const userId = (session?.user as any)?.id;
          if (!session || asset.userId !== userId) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
          }
        }
      }
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
      // 凭证未配置时退回公有 URL，避免整站 500
      const encodedPath = key.split('/').map(encodeURIComponent).join('/');
      const fallbackUrl = `${publicBase.replace(/\/+$/, '')}/${encodedPath}`;
      const fallbackResponse = NextResponse.redirect(fallbackUrl, { status: 302 });
      fallbackResponse.headers.set('Cache-Control', 'no-store');
      fallbackResponse.headers.set('x-s3-read-fallback', 'no-credentials');
      return fallbackResponse;
    }

    const s3Client = new S3Client({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    // S3 key 格式回退：预设 key 只试一次；其他 key 失败再试 space↔+ 变体
    let resolvedKey = key;
    const isDefaultKey = isDefaultReadAllowedKey(key);
    try {
      await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      resolvedKey = key;
    } catch {
      if (isDefaultKey) {
        const encodedPath = key.split('/').map(encodeURIComponent).join('/');
        const fallbackUrl = `${publicBase.replace(/\/+$/, '')}/${encodedPath}`;
        const fallbackResponse = NextResponse.redirect(fallbackUrl, { status: 302 });
        fallbackResponse.headers.set('Cache-Control', 'no-store');
        fallbackResponse.headers.set('x-s3-read-fallback', 'public-url');
        return fallbackResponse;
      }
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
        const encodedPath = key.split('/').map(encodeURIComponent).join('/');
        const fallbackUrl = `${publicBase.replace(/\/+$/, '')}/${encodedPath}`;
        const fallbackResponse = NextResponse.redirect(fallbackUrl, { status: 302 });
        fallbackResponse.headers.set('Cache-Control', 'no-store');
        fallbackResponse.headers.set('x-s3-read-fallback', 'public-url');
        return fallbackResponse;
      }
    }

    const proxyMode = request.nextUrl.searchParams.get('proxy') === '1';
    const isImage = isImageKey(resolvedKey);
    const isThumbKey = THUMB_SUFFIX_RE.test(resolvedKey);

    // 大文件（VRM/FBX 等）：用长有效期 presigned URL redirect（避免 Node.js 内存 OOM）
    // 小文件（缩略图/图片）：直接代理 body（避免 <img> 302 跨域裂图）
    const isLargeAsset = /\.(vrm|fbx|glb|gltf|hdr)$/i.test(resolvedKey);

    if ((isImage || proxyMode) && !isLargeAsset) {
      // 小文件走 proxy body
      const getCmd = new GetObjectCommand({ Bucket: bucket, Key: resolvedKey });
      const obj = await s3Client.send(getCmd);
      if (!obj.Body) {
        return NextResponse.json({ success: false, message: 'Empty object' }, { status: 404 });
      }
      const body = await obj.Body.transformToByteArray();
      const contentType = obj.ContentType || contentTypeFromKey(resolvedKey);
      return new NextResponse(body, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': String(body.byteLength),
          'Cache-Control': isThumbKey ? 'no-store' : 'public, max-age=86400, immutable',
        },
      });
    }

    // 大文件或非 proxy 请求：presigned URL redirect；预设 key 走内存缓存，减少 S3 签名延迟
    let signedUrl: string;
    if (isDefaultReadAllowedKey(resolvedKey)) {
      const cached = getCachedPresignedUrl(resolvedKey);
      if (cached) {
        signedUrl = cached;
      } else {
        signedUrl = await getSignedUrl(
          s3Client,
          new GetObjectCommand({ Bucket: bucket, Key: resolvedKey }),
          { expiresIn: 3600 }
        );
        setCachedPresignedUrl(resolvedKey, signedUrl);
      }
    } else {
      signedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({ Bucket: bucket, Key: resolvedKey }),
        { expiresIn: 3600 }
      );
    }

    const response = NextResponse.redirect(signedUrl, { status: 302 });
    // 大资产 redirect 允许缓存 5 分钟（presigned URL 1 小时有效，5 分钟缓存安全）
    response.headers.set('Cache-Control', isLargeAsset ? 'public, max-age=300' : 'no-store');
    return response;
  } catch (error) {
    // S3 请求失败时，如果 key 在白名单内则回退到公有 URL，避免完全不可用
    const rawKey = request.nextUrl.searchParams.get('key') || '';
    const key = normalizeKey(rawKey);
    if (isAllowedKey(key)) {
      const encodedPath = key.split('/').map(encodeURIComponent).join('/');
      const fallbackUrl = `${FALLBACK_PUBLIC_BASE.replace(/\/+$/, '')}/${encodedPath}`;
      console.error(`[S3 read-object] Error for ${key}, falling back to public URL:`, error instanceof Error ? error.message : error);
      return NextResponse.redirect(fallbackUrl, { status: 302 });
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to read S3 object',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
