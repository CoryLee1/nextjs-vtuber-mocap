"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTracking } from '@/hooks/use-tracking'

interface PageTrackerProps {
  pageName?: string
}

export const PageTracker: React.FC<PageTrackerProps> = ({ pageName }) => {
  const pathname = usePathname()
  const { trackPageView } = useTracking()

  useEffect(() => {
    // 获取页面名称
    const currentPageName = pageName || getPageNameFromPath(pathname)
    
    // 跟踪页面浏览
    trackPageView(
      currentPageName,
      window.location.href,
      document.referrer
    )
  }, [pathname, pageName, trackPageView])

  return null
}

// 从路径获取页面名称
const getPageNameFromPath = (pathname: string): string => {
  const pathMap: Record<string, string> = {
    '/': '首页',
    '/zh': '首页 (中文)',
    '/en': '首页 (英文)',
    '/ja': '首页 (日文)',
    '/demo': '演示页面',
    '/settings': '设置页面',
    '/privacy': '隐私政策',
    '/terms': '服务条款'
  }

  // 检查精确匹配
  if (pathMap[pathname]) {
    return pathMap[pathname]
  }

  // 检查语言前缀匹配
  const languagePrefixes = ['/zh', '/en', '/ja']
  for (const prefix of languagePrefixes) {
    if (pathname.startsWith(prefix)) {
      const subPath = pathname.substring(prefix.length) || '/'
      const basePageName = pathMap[subPath] || getBasePageName(subPath)
      return `${basePageName} (${prefix.substring(1).toUpperCase()})`
    }
  }

  // 默认页面名称
  return getBasePageName(pathname)
}

// 获取基础页面名称
const getBasePageName = (pathname: string): string => {
  // 移除查询参数
  const cleanPath = pathname.split('?')[0]
  
  // 移除尾部斜杠
  const normalizedPath = cleanPath.endsWith('/') && cleanPath !== '/' 
    ? cleanPath.slice(0, -1) 
    : cleanPath

  // 转换为页面名称
  const segments = normalizedPath.split('/').filter(Boolean)
  
  if (segments.length === 0) return '首页'
  
  // 将路径段转换为可读的页面名称
  const pageNames = segments.map(segment => {
    // 将 kebab-case 或 snake_case 转换为 Title Case
    return segment
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
  })
  
  return pageNames.join(' - ')
} 