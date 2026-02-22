import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://echuu.xyz';

/** 带 room_id 的链接（分享到社交/聊天）时，生成直播间专用 OG 卡片 */
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ room_id?: string }> | { room_id?: string };
}): Promise<Metadata> {
  const resolved = await Promise.resolve(searchParams).catch(() => ({}));
  const roomId = typeof resolved?.room_id === 'string' ? resolved.room_id.trim() : undefined;
  if (!roomId) return {};

  const title = 'Echuu 直播间 | AI VTuber 动捕直播';
  const description = '正在直播中，点击进入观看 AI VTuber 动捕直播。';
  const ogImage = `${SITE_URL}/logo.svg`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `${SITE_URL}?room_id=${encodeURIComponent(roomId)}`,
      siteName: 'Echuu',
      title,
      description,
      images: [{ url: ogImage, width: 512, height: 512, alt: 'Echuu' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function HomePage() {
  return <HomePageClient />;
}
