import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BGMPlayer } from '@/components/dressing-room/BGMPlayer'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://echuu.xyz';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Echuu | AI VTuber 动捕直播', template: '%s | Echuu' },
  description: 'Echuu 是 AI 驱动的 VTuber 动捕直播平台。用摄像头驱动 3D 虚拟形象，一键开播，与观众实时互动。',
  keywords: 'Echuu, AI VTuber, 虚拟主播, 动捕, 动作捕捉, 直播, VRM, 3D 形象',
  authors: [{ name: 'Echuu' }],
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Echuu',
    title: 'Echuu | AI VTuber 动捕直播',
    description: 'AI 驱动的 VTuber 动捕直播平台，摄像头驱动 3D 形象，一键开播。',
    images: [{ url: '/logo.svg', width: 512, height: 512, alt: 'Echuu' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echuu | AI VTuber 动捕直播',
    description: 'AI 驱动的 VTuber 动捕直播平台，摄像头驱动 3D 形象，一键开播。',
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