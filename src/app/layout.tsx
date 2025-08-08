import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
} 