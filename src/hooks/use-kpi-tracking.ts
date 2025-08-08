import { useCallback, useEffect, useState } from 'react'
import { 
  captureKPIEvent, 
  setUserKPIProperties, 
  identifyUser, 
  isPostHogReady,
  getUserId,
  getSessionId,
  resetUser,
  type KPIEventName,
  type KPIEventProperties
} from '@/lib/kpi-tracking'

// 用户增长 KPI
export const useUserGrowthKPI = () => {
  const trackUserRegistration = useCallback((
    userId: string,
    registrationMethod: 'email' | 'google' | 'github',
    userRegion: string,
    userLanguage: string
  ) => {
    captureKPIEvent('user_registration', {
      user_id: userId,
      registration_method: registrationMethod,
      user_region: userRegion,
      user_language: userLanguage
    })
  }, [])

  const trackUserLogin = useCallback((
    userId: string,
    loginMethod: 'email' | 'google' | 'github',
    sessionDuration?: number
  ) => {
    captureKPIEvent('user_login', {
      user_id: userId,
      login_method: loginMethod,
      session_duration: sessionDuration
    })
  }, [])

  const trackUserRetention = useCallback((
    userId: string,
    daysSinceRegistration: number,
    loginCount: number
  ) => {
    captureKPIEvent('user_retention', {
      user_id: userId,
      days_since_registration: daysSinceRegistration,
      login_count: loginCount
    })
  }, [])

  return {
    trackUserRegistration,
    trackUserLogin,
    trackUserRetention
  }
}

// 功能采用 KPI
export const useFeatureAdoptionKPI = () => {
  const trackFeatureAdoption = useCallback((
    featureName: string,
    featureCategory: string,
    userId: string,
    usageCount: number,
    firstUseDate: string
  ) => {
    captureKPIEvent('feature_adoption', {
      feature_name: featureName,
      feature_category: featureCategory,
      user_id: userId,
      usage_count: usageCount,
      first_use_date: firstUseDate
    })
  }, [])

  return { trackFeatureAdoption }
}

// VTuber 相关 KPI
export const useVTuberKPI = () => {
  const trackCharacterCreation = useCallback((
    characterId: string,
    characterName: string,
    characterType: string,
    userId: string
  ) => {
    captureKPIEvent('character_creation', {
      character_id: characterId,
      character_name: characterName,
      character_type: characterType,
      creation_time: Date.now(),
      user_id: userId
    })
  }, [])

  const trackCharacterUsage = useCallback((
    characterId: string,
    characterName: string,
    usageDuration: number,
    sessionCount: number,
    userId: string
  ) => {
    captureKPIEvent('character_usage', {
      character_id: characterId,
      character_name: characterName,
      usage_duration: usageDuration,
      session_count: sessionCount,
      user_id: userId
    })
  }, [])

  return {
    trackCharacterCreation,
    trackCharacterUsage
  }
}

// 内容创作 KPI
export const useContentCreationKPI = () => {
  const trackModelUpload = useCallback((
    modelId: string,
    modelName: string,
    modelSize: number,
    modelType: string,
    userId: string,
    uploadSuccess: boolean
  ) => {
    captureKPIEvent('model_upload', {
      model_id: modelId,
      model_name: modelName,
      model_size: modelSize,
      model_type: modelType,
      user_id: userId,
      upload_success: uploadSuccess
    })
  }, [])

  const trackAnimationUpload = useCallback((
    animationId: string,
    animationName: string,
    animationDuration: number,
    animationSize: number,
    userId: string,
    uploadSuccess: boolean
  ) => {
    captureKPIEvent('animation_upload', {
      animation_id: animationId,
      animation_name: animationName,
      animation_duration: animationDuration,
      animation_size: animationSize,
      user_id: userId,
      upload_success: uploadSuccess
    })
  }, [])

  return {
    trackModelUpload,
    trackAnimationUpload
  }
}

// 直播相关 KPI
export const useLiveStreamKPI = () => {
  const trackLiveStreamStart = useCallback((
    streamId: string,
    streamTitle: string,
    platform: string,
    userId: string,
    viewerCount: number
  ) => {
    captureKPIEvent('live_stream_start', {
      stream_id: streamId,
      stream_title: streamTitle,
      platform: platform,
      user_id: userId,
      viewer_count: viewerCount
    })
  }, [])

  const trackLiveStreamEnd = useCallback((
    streamId: string,
    duration: number,
    peakViewers: number,
    totalViewers: number,
    engagementRate: number,
    userId: string
  ) => {
    captureKPIEvent('live_stream_end', {
      stream_id: streamId,
      duration: duration,
      peak_viewers: peakViewers,
      total_viewers: totalViewers,
      engagement_rate: engagementRate,
      user_id: userId
    })
  }, [])

  return {
    trackLiveStreamStart,
    trackLiveStreamEnd
  }
}

// 性能监控 KPI
export const usePerformanceKPI = () => {
  const trackPerformanceMetric = useCallback((
    metricName: string,
    metricValue: number,
    metricUnit: string,
    pageName: string,
    userId?: string
  ) => {
    captureKPIEvent('performance_metric', {
      metric_name: metricName,
      metric_value: metricValue,
      metric_unit: metricUnit,
      page_name: pageName,
      user_id: userId
    })
  }, [])

  return { trackPerformanceMetric }
}

// 错误监控 KPI
export const useErrorKPI = () => {
  const trackError = useCallback((
    errorType: string,
    errorMessage: string,
    errorLocation: string,
    userId?: string
  ) => {
    const browserInfo = typeof window !== 'undefined' ? 
      `${navigator.userAgent} - ${navigator.language}` : 'server-side'
    
    captureKPIEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      error_location: errorLocation,
      user_id: userId,
      browser_info: browserInfo
    })
  }, [])

  return { trackError }
}

// 用户行为 KPI
export const useUserBehaviorKPI = () => {
  const trackPageView = useCallback((
    pageName: string,
    pageUrl: string,
    timeSpent: number,
    userId?: string,
    referrer?: string
  ) => {
    captureKPIEvent('page_view', {
      page_name: pageName,
      page_url: pageUrl,
      time_spent: timeSpent,
      user_id: userId,
      referrer: referrer
    })
  }, [])

  const trackButtonClick = useCallback((
    buttonName: string,
    buttonLocation: string,
    buttonCategory: string,
    userId?: string
  ) => {
    captureKPIEvent('button_click', {
      button_name: buttonName,
      button_location: buttonLocation,
      button_category: buttonCategory,
      user_id: userId
    })
  }, [])

  return {
    trackPageView,
    trackButtonClick
  }
}

// 国际化 KPI
export const useInternationalizationKPI = () => {
  const trackLanguageSwitch = useCallback((
    fromLanguage: string,
    toLanguage: string,
    userId?: string,
    switchReason?: string
  ) => {
    captureKPIEvent('language_switch', {
      from_language: fromLanguage,
      to_language: toLanguage,
      user_id: userId,
      switch_reason: switchReason
    })
  }, [])

  return { trackLanguageSwitch }
}

// API 调用 KPI
export const useAPIKPI = () => {
  const trackAPICall = useCallback((
    endpoint: string,
    method: string,
    responseTime: number,
    statusCode: number,
    success: boolean
  ) => {
    captureKPIEvent('api_call', {
      endpoint: endpoint,
      method: method,
      response_time: responseTime,
      status_code: statusCode,
      success: success
    })
  }, [])

  return { trackAPICall }
}

// 业务转化 KPI
export const useConversionKPI = () => {
  const trackConversion = useCallback((
    conversionType: string,
    conversionValue: number,
    userId?: string,
    funnelStage?: string
  ) => {
    captureKPIEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: conversionValue,
      user_id: userId,
      funnel_stage: funnelStage || 'unknown'
    })
  }, [])

  return { trackConversion }
}

// 通用 KPI Hook
export const useKPITracking = () => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkReady = () => {
      const ready = isPostHogReady()
      setIsReady(ready)
    }

    checkReady()
    const interval = setInterval(checkReady, 1000)
    return () => clearInterval(interval)
  }, [])

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    setUserKPIProperties(properties)
  }, [])

  const identify = useCallback((userId: string, properties?: Record<string, any>) => {
    identifyUser(userId, properties)
  }, [])

  const reset = useCallback(() => {
    resetUser()
  }, [])

  const getCurrentUserId = useCallback(() => {
    return getUserId()
  }, [])

  const getCurrentSessionId = useCallback(() => {
    return getSessionId()
  }, [])

  // 通用事件跟踪
  const trackEvent = useCallback(<T extends KPIEventName>(
    eventName: T,
    properties: KPIEventProperties<T>
  ) => {
    captureKPIEvent(eventName, properties)
  }, [])

  return {
    isReady,
    setUserProperties,
    identify,
    reset,
    getCurrentUserId,
    getCurrentSessionId,
    trackEvent
  }
} 