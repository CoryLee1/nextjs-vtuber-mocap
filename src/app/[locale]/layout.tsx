import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import '../globals.css'
import { Toaster } from '@/components/ui/toaster'
import { PostHogProvider } from '@/components/tracking/PostHogProvider'
import { InternationalizationTracker } from '@/components/tracking/InternationalizationTracker'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { Canvas3DProvider } from '@/providers/Canvas3DProvider'
import { AuthProvider } from '@/providers/AuthProvider'
import { locales } from '@/i18n/config'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://echuu.xyz';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Echuu | AI VTuber 动捕直播',
    template: '%s | Echuu',
  },
  description: 'Echuu 是 AI 驱动的 VTuber 动捕直播平台。用摄像头驱动 3D 虚拟形象，一键开播，与观众实时互动。',
  keywords: 'Echuu, AI VTuber, 虚拟主播, 动捕, 动作捕捉, 直播, VRM, 3D 形象',
  authors: [{ name: 'Echuu' }],
  creator: 'Echuu',
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: SITE_URL,
    siteName: 'Echuu',
    title: 'Echuu | AI VTuber 动捕直播',
    description: 'AI 驱动的 VTuber 动捕直播平台，摄像头驱动 3D 形象，一键开播。',
    images: [
      {
        url: '/logo.svg',
        width: 512,
        height: 512,
        alt: 'Echuu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Echuu | AI VTuber 动捕直播',
    description: 'AI 驱动的 VTuber 动捕直播平台，摄像头驱动 3D 形象，一键开播。',
    images: ['/logo.svg'],
  },
  icons: {
    icon: '/favicon.svg',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
  params: { locale?: string }
}

export default async function RootLayout({
  children,
  params = {}
}: RootLayoutProps) {
  try {
    const locale = params?.locale ?? 'zh'
    // 验证语言是否支持
    if (!locale || !locales.includes(locale as any)) {
      notFound();
    }

    // 获取消息，传递正确的 locale 参数
    const messages = await getMessages({ locale }).catch(() => {
      console.warn(`Failed to load messages for locale: ${locale}`)
      return {}
    });

    return (
      <html lang={locale} suppressHydrationWarning>
        <body className={inter.className}>
          <NextIntlClientProvider messages={messages}>
            <PostHogProvider>
              <ThemeProvider>
                <AuthProvider>
                  <Canvas3DProvider>
                    <InternationalizationTracker currentLocale={locale} />
                    {children}
                    <Toaster />
                  </Canvas3DProvider>
                </AuthProvider>
              </ThemeProvider>
            </PostHogProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    )
  } catch (error) {
    console.error('Error in RootLayout:', error)
    // 返回一个基本的错误页面
    return (
      <html lang="zh" suppressHydrationWarning>
        <body className={inter.className}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">加载错误</h1>
              <p className="text-gray-600">页面加载时发生错误，请刷新页面重试。</p>
            </div>
          </div>
        </body>
      </html>
    )
  }
} 