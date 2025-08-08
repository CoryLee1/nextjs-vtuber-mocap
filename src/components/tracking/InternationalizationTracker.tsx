"use client"

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useInternationalizationKPI, useUserBehaviorKPI } from '@/hooks/use-kpi-tracking'

interface InternationalizationTrackerProps {
  currentLocale: string
  userId?: string
}

export const InternationalizationTracker: React.FC<InternationalizationTrackerProps> = ({
  currentLocale,
  userId
}) => {
  const pathname = usePathname()
  const { trackLanguageSwitch } = useInternationalizationKPI()
  const { trackPageView } = useUserBehaviorKPI()
  const lastLocale = useRef<string>(currentLocale)
  const pageStartTime = useRef<number>(Date.now())

  // 跟踪语言切换
  useEffect(() => {
    if (lastLocale.current !== currentLocale) {
      trackLanguageSwitch(
        lastLocale.current,
        currentLocale,
        userId,
        'user_manual_switch'
      )
      lastLocale.current = currentLocale
    }
  }, [currentLocale, trackLanguageSwitch, userId])

  // 跟踪页面访问（按语言）
  useEffect(() => {
    const pageName = getPageNameFromPath(pathname, currentLocale)
    const timeSpent = Date.now() - pageStartTime.current
    
    // 只在页面加载时跟踪一次
    if (timeSpent < 1000) { // 避免重复跟踪
      trackPageView(
        pageName,
        pathname,
        0, // 初始访问时间为0
        userId,
        document.referrer
      )
    }

    // 重置页面开始时间
    pageStartTime.current = Date.now()

    // 页面离开时跟踪时间
    const handleBeforeUnload = () => {
      const finalTimeSpent = Date.now() - pageStartTime.current
      trackPageView(
        pageName,
        pathname,
        finalTimeSpent,
        userId,
        document.referrer
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pathname, currentLocale, trackPageView, userId])

  return null // 这是一个无渲染组件
}

// 从路径获取页面名称（考虑语言）
const getPageNameFromPath = (pathname: string, locale: string): string => {
  // 移除语言前缀
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
  
  // 根据路径返回页面名称
  switch (pathWithoutLocale) {
    case '/':
      return `Home Page (${locale.toUpperCase()})`
    case '/posthog-test':
      return `PostHog Test Page (${locale.toUpperCase()})`
    case '/test-language':
      return `Language Test Page (${locale.toUpperCase()})`
    default:
      return `Unknown Page (${locale.toUpperCase()})`
  }
}

export default InternationalizationTracker 