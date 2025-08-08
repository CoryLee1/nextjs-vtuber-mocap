import { useCallback } from 'react'
import { safeCapture, setUserProperties, identify, isFeatureEnabled } from '@/lib/posthog'

// 事件类型定义
export interface TrackingEvents {
  // 页面浏览
  page_view: {
    page_name: string
    page_url: string
    referrer?: string
  }
  
  // 按钮点击
  button_click: {
    button_name: string
    button_location: string
    button_type?: string
  }
  
  // 用户注册/登录
  user_signup: {
    signup_method: 'email' | 'google' | 'github'
    user_id: string
  }
  
  user_login: {
    login_method: 'email' | 'google' | 'github'
    user_id: string
  }
  
  // VTuber 相关事件
  character_created: {
    character_name: string
    character_type: string
    creation_time: number
  }
  
  character_updated: {
    character_name: string
    update_type: 'appearance' | 'animation' | 'settings'
  }
  
  live_stream_started: {
    stream_id: string
    stream_title: string
    platform: string
  }
  
  live_stream_ended: {
    stream_id: string
    duration: number
    viewer_count: number
  }
  
  // 引导流程
  onboarding_started: {
    step: string
  }
  
  onboarding_completed: {
    total_steps: number
    completion_time: number
  }
  
  onboarding_step_completed: {
    step: string
    step_number: number
    time_spent: number
  }
  
  // 功能使用
  feature_used: {
    feature_name: string
    feature_category: string
    usage_count?: number
  }
  
  // 错误事件
  error_occurred: {
    error_type: string
    error_message: string
    error_location: string
  }
  
  // 性能事件
  performance_metric: {
    metric_name: string
    metric_value: number
    metric_unit: string
  }
}

// 事件名称类型
export type TrackingEventName = keyof TrackingEvents

// 事件属性类型
export type TrackingEventProperties<T extends TrackingEventName> = TrackingEvents[T]

// 跟踪 Hook
export const useTracking = () => {
  // 页面浏览跟踪
  const trackPageView = useCallback((pageName: string, pageUrl: string, referrer?: string) => {
    safeCapture('page_view', {
      page_name: pageName,
      page_url: pageUrl,
      referrer: referrer || document.referrer
    })
  }, [])

  // 按钮点击跟踪
  const trackButtonClick = useCallback((buttonName: string, buttonLocation: string, buttonType?: string) => {
    safeCapture('button_click', {
      button_name: buttonName,
      button_location: buttonLocation,
      button_type: buttonType
    })
  }, [])

  // 用户注册跟踪
  const trackUserSignup = useCallback((signupMethod: 'email' | 'google' | 'github', userId: string) => {
    safeCapture('user_signup', {
      signup_method: signupMethod,
      user_id: userId
    })
    
    // 设置用户属性
    setUserProperties({
      user_id: userId,
      signup_method: signupMethod,
      signup_date: new Date().toISOString()
    })
  }, [])

  // 用户登录跟踪
  const trackUserLogin = useCallback((loginMethod: 'email' | 'google' | 'github', userId: string) => {
    safeCapture('user_login', {
      login_method: loginMethod,
      user_id: userId
    })
    
    // 识别用户
    identify(userId, {
      login_method: loginMethod,
      last_login: new Date().toISOString()
    })
  }, [])

  // 角色创建跟踪
  const trackCharacterCreated = useCallback((characterName: string, characterType: string) => {
    safeCapture('character_created', {
      character_name: characterName,
      character_type: characterType,
      creation_time: Date.now()
    })
  }, [])

  // 角色更新跟踪
  const trackCharacterUpdated = useCallback((characterName: string, updateType: 'appearance' | 'animation' | 'settings') => {
    safeCapture('character_updated', {
      character_name: characterName,
      update_type: updateType
    })
  }, [])

  // 直播开始跟踪
  const trackLiveStreamStarted = useCallback((streamId: string, streamTitle: string, platform: string) => {
    safeCapture('live_stream_started', {
      stream_id: streamId,
      stream_title: streamTitle,
      platform: platform
    })
  }, [])

  // 直播结束跟踪
  const trackLiveStreamEnded = useCallback((streamId: string, duration: number, viewerCount: number) => {
    safeCapture('live_stream_ended', {
      stream_id: streamId,
      duration: duration,
      viewer_count: viewerCount
    })
  }, [])

  // 引导开始跟踪
  const trackOnboardingStarted = useCallback((step: string) => {
    safeCapture('onboarding_started', {
      step: step
    })
  }, [])

  // 引导完成跟踪
  const trackOnboardingCompleted = useCallback((totalSteps: number, completionTime: number) => {
    safeCapture('onboarding_completed', {
      total_steps: totalSteps,
      completion_time: completionTime
    })
  }, [])

  // 引导步骤完成跟踪
  const trackOnboardingStepCompleted = useCallback((step: string, stepNumber: number, timeSpent: number) => {
    safeCapture('onboarding_step_completed', {
      step: step,
      step_number: stepNumber,
      time_spent: timeSpent
    })
  }, [])

  // 功能使用跟踪
  const trackFeatureUsed = useCallback((featureName: string, featureCategory: string, usageCount?: number) => {
    safeCapture('feature_used', {
      feature_name: featureName,
      feature_category: featureCategory,
      usage_count: usageCount
    })
  }, [])

  // 错误跟踪
  const trackError = useCallback((errorType: string, errorMessage: string, errorLocation: string) => {
    safeCapture('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation
    })
  }, [])

  // 性能指标跟踪
  const trackPerformance = useCallback((metricName: string, metricValue: number, metricUnit: string) => {
    safeCapture('performance_metric', {
      metric_name: metricName,
      metric_value: metricValue,
      metric_unit: metricUnit
    })
  }, [])

  // 通用事件跟踪
  const trackEvent = useCallback(<T extends TrackingEventName>(
    eventName: T,
    properties: TrackingEventProperties<T>
  ) => {
    safeCapture(eventName, properties)
  }, [])

  // 功能标志检查
  const checkFeatureFlag = useCallback((flagName: string): boolean => {
    return isFeatureEnabled(flagName)
  }, [])

  return {
    // 基础跟踪
    trackPageView,
    trackButtonClick,
    trackEvent,
    
    // 用户相关
    trackUserSignup,
    trackUserLogin,
    
    // VTuber 相关
    trackCharacterCreated,
    trackCharacterUpdated,
    trackLiveStreamStarted,
    trackLiveStreamEnded,
    
    // 引导相关
    trackOnboardingStarted,
    trackOnboardingCompleted,
    trackOnboardingStepCompleted,
    
    // 其他
    trackFeatureUsed,
    trackError,
    trackPerformance,
    
    // 功能标志
    checkFeatureFlag
  }
} 