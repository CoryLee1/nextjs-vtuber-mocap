import posthog from 'posthog-js'

// KPI 事件类型定义
export interface KPIEvents {
  // 用户增长指标
  user_registration: {
    user_id: string
    registration_method: 'email' | 'google' | 'github'
    user_region: string
    user_language: string
  }
  
  user_login: {
    user_id: string
    login_method: 'email' | 'google' | 'github'
    session_duration?: number
  }
  
  user_retention: {
    user_id: string
    days_since_registration: number
    login_count: number
  }
  
  // 功能使用指标
  feature_adoption: {
    feature_name: string
    feature_category: string
    user_id: string
    usage_count: number
    first_use_date: string
  }
  
  // VTuber 相关指标
  character_creation: {
    character_id: string
    character_name: string
    character_type: string
    creation_time: number
    user_id: string
  }
  
  character_usage: {
    character_id: string
    character_name: string
    usage_duration: number
    session_count: number
    user_id: string
  }
  
  // 内容创作指标
  model_upload: {
    model_id: string
    model_name: string
    model_size: number
    model_type: string
    user_id: string
    upload_success: boolean
  }
  
  animation_upload: {
    animation_id: string
    animation_name: string
    animation_duration: number
    animation_size: number
    user_id: string
    upload_success: boolean
  }
  
  // 直播相关指标
  live_stream_start: {
    stream_id: string
    stream_title: string
    platform: string
    user_id: string
    viewer_count: number
  }
  
  live_stream_end: {
    stream_id: string
    duration: number
    peak_viewers: number
    total_viewers: number
    engagement_rate: number
    user_id: string
  }
  
  // 性能指标
  performance_metric: {
    metric_name: string
    metric_value: number
    metric_unit: string
    page_name: string
    user_id?: string
  }
  
  // 错误监控
  error_occurred: {
    error_type: string
    error_message: string
    error_location: string
    user_id?: string
    browser_info: string
  }
  
  // 用户行为指标
  page_view: {
    page_name: string
    page_url: string
    time_spent: number
    user_id?: string
    referrer?: string
  }
  
  button_click: {
    button_name: string
    button_location: string
    button_category: string
    user_id?: string
  }
  
  // 国际化指标
  language_switch: {
    from_language: string
    to_language: string
    user_id?: string
    switch_reason?: string
  }
  
  // 技术指标
  api_call: {
    endpoint: string
    method: string
    response_time: number
    status_code: number
    success: boolean
  }
  
  // 业务转化指标
  conversion: {
    conversion_type: string
    conversion_value: number
    user_id?: string
    funnel_stage: string
  }
}

// KPI 事件名称类型
export type KPIEventName = keyof KPIEvents

// KPI 事件属性类型
export type KPIEventProperties<T extends KPIEventName> = KPIEvents[T]

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined'

// 检查 PostHog 是否可用
const isPostHogAvailable = (): boolean => {
  if (!isBrowser) return false
  try {
    return typeof posthog !== 'undefined' && posthog.isFeatureEnabled !== undefined
  } catch {
    return false
  }
}

// 用户属性设置
export const setUserKPIProperties = (properties: Record<string, any>) => {
  if (!isBrowser || !isPostHogAvailable()) {
    console.warn('PostHog not available for setting user properties')
    return
  }
  
  try {
    posthog.people.set({
      ...properties,
      last_updated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to set user KPI properties:', error)
  }
}

// 安全的事件捕获
export const captureKPIEvent = <T extends KPIEventName>(
  eventName: T,
  properties: KPIEventProperties<T>
) => {
  if (!isBrowser || !isPostHogAvailable()) {
    console.warn(`PostHog not available for capturing event: ${eventName}`)
    return
  }
  
  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.error(`Failed to capture KPI event ${eventName}:`, error)
  }
}

// 用户识别
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isBrowser || !isPostHogAvailable()) {
    console.warn('PostHog not available for user identification')
    return
  }
  
  try {
    posthog.identify(userId, {
      ...properties,
      identified_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to identify user:', error)
  }
}

// 检查 PostHog 是否已初始化
export const isPostHogReady = (): boolean => {
  return isBrowser && isPostHogAvailable()
}

// 获取用户 ID
export const getUserId = (): string | null => {
  if (!isBrowser || !isPostHogAvailable()) return null
  
  try {
    return posthog.get_distinct_id()
  } catch (error) {
    console.error('Failed to get user ID:', error)
    return null
  }
}

// 获取会话 ID
export const getSessionId = (): string | null => {
  if (!isBrowser || !isPostHogAvailable()) return null
  
  try {
    return posthog.get_session_id()
  } catch (error) {
    console.error('Failed to get session ID:', error)
    return null
  }
}

// 重置用户
export const resetUser = () => {
  if (!isBrowser || !isPostHogAvailable()) {
    console.warn('PostHog not available for user reset')
    return
  }
  
  try {
    posthog.reset()
  } catch (error) {
    console.error('Failed to reset user:', error)
  }
}

export default {
  captureKPIEvent,
  setUserKPIProperties,
  identifyUser,
  isPostHogReady,
  getUserId,
  getSessionId,
  resetUser
} 