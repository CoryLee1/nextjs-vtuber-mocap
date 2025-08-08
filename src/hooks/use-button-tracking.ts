import { useCallback } from 'react'
import { useTracking } from './use-tracking'

interface ButtonTrackingOptions {
  buttonName: string
  buttonLocation: string
  buttonType?: string
  additionalProperties?: Record<string, any>
}

export const useButtonTracking = () => {
  const { trackButtonClick } = useTracking()

  // 创建跟踪函数
  const createTrackedClick = useCallback((
    options: ButtonTrackingOptions,
    onClick?: () => void
  ) => {
    return (event: React.MouseEvent) => {
      // 跟踪按钮点击
      trackButtonClick(
        options.buttonName,
        options.buttonLocation,
        options.buttonType
      )

      // 执行原始点击处理函数
      if (onClick) {
        onClick()
      }
    }
  }, [trackButtonClick])

  // 创建跟踪的 ref
  const createTrackedRef = useCallback((
    options: ButtonTrackingOptions,
    onClick?: () => void
  ) => {
    return (element: HTMLElement | null) => {
      if (element) {
        const handleClick = (event: MouseEvent) => {
          trackButtonClick(
            options.buttonName,
            options.buttonLocation,
            options.buttonType
          )

          if (onClick) {
            onClick()
          }
        }

        element.addEventListener('click', handleClick)

        // 返回清理函数
        return () => {
          element.removeEventListener('click', handleClick)
        }
      }
    }
  }, [trackButtonClick])

  return {
    createTrackedClick,
    createTrackedRef
  }
}

// 预定义的按钮位置
export const BUTTON_LOCATIONS = {
  HEADER: 'header',
  SIDEBAR: 'sidebar',
  FOOTER: 'footer',
  MODAL: 'modal',
  CARD: 'card',
  FORM: 'form',
  NAVIGATION: 'navigation',
  SETTINGS: 'settings',
  DASHBOARD: 'dashboard'
} as const

// 预定义的按钮类型
export const BUTTON_TYPES = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  DANGER: 'danger',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info',
  LINK: 'link',
  ICON: 'icon'
} as const 