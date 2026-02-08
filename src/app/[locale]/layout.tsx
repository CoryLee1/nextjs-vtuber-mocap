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
      <html lang={locale}>
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
      <html lang="zh">
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