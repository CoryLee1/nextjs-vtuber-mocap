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

  const title = 'Echuu: AI Vtubing';
  const description = 'Echuu! 你的 AI 虚拟主播出道神器！✨ 只要一个摄像头，捏好的 VRM 崽崽就能动起来～ 0门槛一键开播，和大家贴贴互动！';
  const ogImage = `${SITE_URL}/logo.svg`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `${SITE_URL}?room_id=${encodeURIComponent(roomId)}`,
      siteName: 'Echuu: AI Vtubing',
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
