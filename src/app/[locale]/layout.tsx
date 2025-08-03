import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'
import { Toaster } from '@/components/ui/toaster'
import { locales } from '@/i18n/config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VTuber Motion Capture | 虚拟形象动捕系统',
  description: '基于 Next.js 和 Three.js 的实时虚拟形象动作捕捉应用',
  keywords: 'VTuber, Motion Capture, 虚拟形象, 动作捕捉, Three.js, MediaPipe',
  authors: [{ name: 'VTuber Mocap Team' }],
  openGraph: {
    title: 'VTuber Motion Capture',
    description: '实时虚拟形象动作捕捉应用',
    type: 'website',
    url: 'https://nextjs-vtuber-mocap.vercel.app/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VTuber Motion Capture',
    description: '实时虚拟形象动作捕捉应用',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function RootLayout({
  children,
  params: { locale }
}: RootLayoutProps) {
  // 验证语言是否支持
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // 获取消息
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
} 