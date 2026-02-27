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

/** 预设资源 key：无需查库即可读 S3，避免 DB 未配置/未入库时 500 */
const DEFAULT_READ_ALLOWED_KEYS = new Set<string>([
  // VRM 样本模型及缩略图（resource-manager 内置）
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
        const encodedPath = key.split('/').map(encodeURIComponent).join('/');
        const fallbackUrl = `${publicBase.replace(/\/+$/, '')}/${encodedPath}`;
        const fallbackResponse = NextResponse.redirect(fallbackUrl, { status: 302 });
        fallbackResponse.headers.set('Cache-Control', 'no-store');
        fallbackResponse.headers.set('x-s3-read-fallback', 'public-url');
        return fallbackResponse;
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
