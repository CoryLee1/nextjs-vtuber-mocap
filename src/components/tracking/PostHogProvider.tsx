"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

interface PostHogProviderProps {
  children: React.ReactNode
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
    
    // 检查 PostHog key 是否存在
    if (!posthogKey) {
      console.warn('[PostHog] No API key provided. PostHog will not be initialized.')
      return
    }

    // 检查是否已经初始化
    if (posthog.isFeatureEnabled) {
      console.log('[PostHog] Already initialized')
      return
    }

    try {
      posthog.init(posthogKey, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        ui_host: "https://us.posthog.com",
        defaults: '2025-05-24',
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
        loaded: (posthog) => {
          console.log('[PostHog] Successfully initialized')
          // 设置用户属性
          posthog.people.set({
            app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
          })
        },
        bootstrap: {
          distinctID: undefined,
          isIdentifiedID: false,
        }
      })
    } catch (error) {
      console.error('[PostHog] Initialization failed:', error)
    }
  }, [])

  return (
    <PHProvider client={posthog}>
      {children}
    </PHProvider>
  )
}