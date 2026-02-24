const DEFAULT_PUBLIC_S3_BASE = 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com';
const PUBLIC_S3_BASE = process.env.NEXT_PUBLIC_S3_BASE_URL || DEFAULT_PUBLIC_S3_BASE;

/** proxy=true 时直接返回 body，避免 302 导致缓存/跨域问题，预加载与 loader 需用同一 URL */
export function getS3ObjectReadUrlByKey(key: string, opts?: { proxy?: boolean }): string {
  const normalizedKey = key.replace(/^\/+/, '');
  const base = `/api/s3/read-object?key=${encodeURIComponent(normalizedKey)}`;
  return opts?.proxy ? `${base}&proxy=1` : base;
}

export function toS3ReadUrl(inputUrl: string): string {
  if (!inputUrl) return inputUrl;
  if (inputUrl.startsWith('/api/s3/read-object')) return inputUrl;

  if (inputUrl.startsWith('s3://')) {
    const withoutScheme = inputUrl.slice(5);
    const firstSlashIdx = withoutScheme.indexOf('/');
    if (firstSlashIdx > -1) {
      const key = withoutScheme.slice(firstSlashIdx + 1);
      return getS3ObjectReadUrlByKey(key);
    }
    return inputUrl;
  }

  if (inputUrl.startsWith('http://') || inputUrl.startsWith('https://')) {
    try {
      const url = new URL(inputUrl);
      const publicOrigin = new URL(PUBLIC_S3_BASE).origin;
      if (url.origin === publicOrigin) {
        const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
        return getS3ObjectReadUrlByKey(key);
      }
    } catch {
      return inputUrl;
    }
  }

  return inputUrl;
}
