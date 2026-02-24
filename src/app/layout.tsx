import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BGMPlayer } from '@/components/dressing-room/BGMPlayer'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://echuu.xyz';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Echuu: AI Vtubing', template: '%s | Echuu' },
  description: 'Echuu! 你的 AI 虚拟主播出道神器！✨ 只要一个摄像头，捏好的 VRM 崽崽就能动起来～ 0门槛一键开播，和大家贴贴互动！快来开启你的异世界直播之旅吧！(≧∇≦)/',
  keywords: 'Echuu, AI VTuber, 虚拟主播, 动捕, 动作捕捉, 直播, VRM, 3D 形象, 二次元, 虚拟出道',
  authors: [{ name: 'Echuu' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Echuu: AI Vtubing',
    title: 'Echuu: AI Vtubing',
    description: 'Echuu! 你的 AI 虚拟主播出道神器！✨ 只要一个摄像头，捏好的 VRM 崽崽就能动起来～ 0门槛一键开播，和大家贴贴互动！',
    images: [{ url: '/logo.svg', width: 512, height: 512, alt: 'Echuu' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echuu: AI Vtubing',
    description: 'Echuu! 你的 AI 虚拟主播出道神器！✨ 只要一个摄像头，捏好的 VRM 崽崽就能动起来～ 0门槛一键开播，和大家贴贴互动！',
    images: ['/logo.svg'],
  },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body className={inter.className}>
        <BGMPlayer />
        {children}
      </body>
    </html>
  )
} 