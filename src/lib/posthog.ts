import posthog from 'posthog-js'

// 客户端 PostHog 配置
export const POSTHOG_CONFIG = {
  international: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_kLObnPt4Xrt7MQfYJnCpQkV6ZqScmSzsNETtDck1iWp',
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  },
  china: {
    key: process.env.NEXT_PUBLIC_POSTHOG_KEY_CN || '',
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST_CN || 'https://cn.posthog.com',
  }
}

// 检测用户地区
export const detectRegion = (): 'international' | 'china' => {
  if (typeof window === 'undefined') return 'international'
  
  // 检查本地存储中的用户设置
  const userRegion = localStorage.getItem('user_region')
  if (userRegion === 'china' || userRegion === 'international') {
    return userRegion
  }
  
  // 基于时区和语言检测
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const language = navigator.language.toLowerCase()
  
  // 中国时区检测
  if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Chongqing') || 
      timezone.includes('Asia/Harbin') || timezone.includes('Asia/Urumqi')) {
    return 'china'
  }
  
  // 中文语言检测
  if (language.includes('zh') || language.includes('cn')) {
    return 'china'
  }
  
  return 'international'
}

// 获取当前配置
export const getCurrentConfig = () => {
  const region = detectRegion()
  return POSTHOG_CONFIG[region]
}

// 初始化 PostHog
export const initPostHog = () => {
  if (typeof window === 'undefined') return
  
  const config = getCurrentConfig()
  
  if (!config.key) {
    console.warn('PostHog key not configured')
    return
  }
  
  try {
    posthog.init(config.key, {
      api_host: config.host,
      autocapture: true, // 启用自动捕获
      disable_session_recording: false, // 启用会话录制以支持热力图
      loaded: (posthog) => {
        posthog.people.set({
          app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          region: detectRegion()
        })
      }
    })
    console.log('PostHog initialized successfully')
  } catch (error) {
    console.error('Failed to initialize PostHog:', error)
  }
}

// 检查 PostHog 是否已初始化
export const isPostHogInitialized = (): boolean => {
  if (typeof window === 'undefined') return false
  return posthog.isFeatureEnabled !== undefined
}

// 安全的事件捕获
export const safeCapture = (event: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return
  if (!isPostHogInitialized()) {
    console.warn('PostHog not initialized')
    return
  }
  
  try {
    posthog.capture(event, properties)
  } catch (error) {
    console.error('Failed to capture event:', error)
  }
}

// 检查功能标志
export const isFeatureEnabled = (flag: string): boolean => {
  if (typeof window === 'undefined') return false
  if (!isPostHogInitialized()) return false
  
  try {
    return posthog.isFeatureEnabled(flag)
  } catch (error) {
    console.error('Failed to check feature flag:', error)
    return false
  }
}

// 设置用户属性
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === 'undefined') return
  if (!isPostHogInitialized()) return
  
  try {
    posthog.people.set(properties)
  } catch (error) {
    console.error('Failed to set user properties:', error)
  }
}

// 识别用户
export const identify = (distinctId: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return
  if (!isPostHogInitialized()) return
  
  try {
    posthog.identify(distinctId, properties)
  } catch (error) {
    console.error('Failed to identify user:', error)
  }
}

// 重置用户
export const reset = () => {
  if (typeof window === 'undefined') return
  if (!isPostHogInitialized()) return
  
  try {
    posthog.reset()
  } catch (error) {
    console.error('Failed to reset user:', error)
  }
}

export default posthog
