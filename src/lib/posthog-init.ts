import posthog from 'posthog-js'

// 获取环境变量（客户端安全的方式）
const getEnvVar = (key: string, defaultValue?: string): string => {
  if (typeof window === 'undefined') return defaultValue || ''
  
  // 从 window 对象获取环境变量（如果设置了）
  const envValue = (window as any).__NEXT_DATA__?.props?.env?.[key]
  if (envValue) return envValue
  
  // 从 process.env 获取（开发环境）
  if (process.env[key]) return process.env[key]!
  
  return defaultValue || ''
}

// 检测用户地区
const detectRegion = (): string => {
  if (typeof window === 'undefined') return 'international'
  
  // 检查用户手动设置的地区
  const userRegion = localStorage.getItem('user_region')
  if (userRegion) {
    return userRegion
  }
  
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const language = navigator.language
  
  // 更精确的地区检测
  if (timezone.includes('America/') || 
      timezone.includes('US/') || 
      timezone.includes('Canada/') ||
      language.includes('en-US') ||
      language.includes('en-CA')) {
    return 'international'
  }
  
  if (timezone.includes('Asia/Shanghai') || 
      timezone.includes('Asia/Beijing') || 
      language.includes('zh')) {
    return 'china'
  }
  
  if (timezone.includes('Europe/')) {
    return 'eu'
  }
  
  // 默认使用国际服务器
  return 'international'
}

// 获取 PostHog 配置（根据地区）
const getPostHogConfig = () => {
  const region = detectRegion()
  
  console.log('Detected region:', region, 'Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone, 'Language:', navigator.language)
  
  if (region === 'china') {
    return {
      key: getEnvVar('NEXT_PUBLIC_POSTHOG_KEY_CN', 'phc_kLObnPt4Xrt7MQfYJnCpQkV6ZqScmSzsNETtDck1iWp'),
      host: getEnvVar('NEXT_PUBLIC_POSTHOG_HOST_CN', 'https://cn.posthog.com'),
      region: 'china'
    }
  }
  
  // 默认使用国际服务器
  return {
    key: getEnvVar('NEXT_PUBLIC_POSTHOG_KEY', 'phc_kLObnPt4Xrt7MQfYJnCpQkV6ZqScmSzsNETtDck1iWp'),
    host: getEnvVar('NEXT_PUBLIC_POSTHOG_HOST', 'https://us.i.posthog.com'),
    region: 'international'
  }
}

// PostHog 初始化配置
export const initPostHogClient = () => {
  if (typeof window === 'undefined') return

  // 检查是否已经初始化
  if (posthog.isFeatureEnabled !== undefined) {
    console.log('PostHog already initialized')
    return
  }

  try {
    // 获取配置
    const config = getPostHogConfig()
    
    console.log('Initializing PostHog with config:', {
      key: config.key ? '***configured***' : 'not configured',
      host: config.host,
      region: config.region,
      envCheck: {
        processEnv: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
        windowEnv: !!(window as any).__NEXT_DATA__?.props?.env?.NEXT_PUBLIC_POSTHOG_KEY
      }
    })

    // 使用官方推荐的初始化方式
    posthog.init(config.key, {
      api_host: config.host,
      // 启用自动捕获
      autocapture: true,
      // 启用页面浏览捕获
      capture_pageview: true,
      // 开发环境调试
      debug: process.env.NODE_ENV === 'development',
      // 禁用会话记录（可选）
      disable_session_recording: true,
      // 加载回调
      loaded: (posthog) => {
        console.log('PostHog loaded successfully')
        
        // 设置用户属性
        posthog.people.set({
          app_version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
          environment: process.env.NODE_ENV || 'development',
          region: config.region
        })
      },
      // 错误处理
      capture_pageview: false, // 手动控制页面浏览
      capture_pageleave: false,
      // 网络配置
      xhr_headers: {
        'Content-Type': 'application/json'
      },
      // 重试配置
      retry_network_requests: true,
      // 调试模式
      debug: true
    })
    
    console.log('PostHog initialized successfully')
  } catch (error) {
    console.error('PostHog initialization failed:', error)
  }
}

// 发送测试事件
export const sendTestEvent = () => {
  if (typeof window === 'undefined') return
  
  try {
    // 检查 PostHog 是否已初始化
    if (!posthog.isFeatureEnabled) {
      console.error('PostHog not initialized, cannot send event')
      return
    }

    const config = getPostHogConfig()
    const eventData = {
      property: 'value',
      timestamp: new Date().toISOString(),
      region: config.region,
      config_source: 'posthog-init.ts',
      test_event: true
    }

    console.log('Sending test event with data:', eventData)
    
    posthog.capture('test_event', eventData)
    
    // 验证事件是否发送成功
    setTimeout(() => {
      console.log('PostHog event queue status:', posthog.get_session_id())
    }, 1000)
    
    console.log('Test event sent successfully')
  } catch (error) {
    console.error('Failed to send test event:', error)
  }
}

// 检查 PostHog 是否已初始化
export const isPostHogReady = (): boolean => {
  return typeof window !== 'undefined' && posthog.isFeatureEnabled !== undefined
}

// 获取 PostHog 状态
export const getPostHogStatus = () => {
  if (typeof window === 'undefined') return 'server-side'
  
  const config = getPostHogConfig()
  
  return {
    initialized: !!posthog.isFeatureEnabled,
    sessionId: posthog.get_session_id(),
    distinctId: posthog.get_distinct_id(),
    config: {
      key: config.key ? 'configured' : 'not configured',
      host: config.host,
      region: config.region
    }
  }
}

// 手动设置地区
export const setUserRegion = (region: 'international' | 'china' | 'eu') => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_region', region)
    console.log('User region set to:', region)
  }
}

export default posthog 