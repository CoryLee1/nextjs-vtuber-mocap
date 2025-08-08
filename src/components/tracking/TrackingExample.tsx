"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTracking } from '@/hooks/use-tracking'
import { useButtonTracking, BUTTON_LOCATIONS, BUTTON_TYPES } from '@/hooks/use-button-tracking'

export const TrackingExample: React.FC = () => {
  const { 
    trackCharacterCreated, 
    trackLiveStreamStarted, 
    trackOnboardingStarted,
    trackFeatureUsed,
    checkFeatureFlag
  } = useTracking()
  
  const { createTrackedClick } = useButtonTracking()

  // 示例：创建角色
  const handleCreateCharacter = createTrackedClick(
    {
      buttonName: '创建角色',
      buttonLocation: BUTTON_LOCATIONS.CARD,
      buttonType: BUTTON_TYPES.PRIMARY
    },
    () => {
      trackCharacterCreated('示例角色', 'anime_female')
      console.log('角色创建事件已发送')
    }
  )

  // 示例：开始直播
  const handleStartStream = createTrackedClick(
    {
      buttonName: '开始直播',
      buttonLocation: BUTTON_LOCATIONS.CARD,
      buttonType: BUTTON_TYPES.SUCCESS
    },
    () => {
      trackLiveStreamStarted('stream_123', 'VTuber 直播测试', 'youtube')
      console.log('直播开始事件已发送')
    }
  )

  // 示例：开始引导
  const handleStartOnboarding = createTrackedClick(
    {
      buttonName: '开始引导',
      buttonLocation: BUTTON_LOCATIONS.CARD,
      buttonType: BUTTON_TYPES.INFO
    },
    () => {
      trackOnboardingStarted('welcome_step')
      console.log('引导开始事件已发送')
    }
  )

  // 示例：功能使用
  const handleUseFeature = createTrackedClick(
    {
      buttonName: '使用功能',
      buttonLocation: BUTTON_LOCATIONS.CARD,
      buttonType: BUTTON_TYPES.SECONDARY
    },
    () => {
      trackFeatureUsed('model_manager', 'character_creation')
      console.log('功能使用事件已发送')
    }
  )

  // 检查功能标志
  const isTrackingEnabled = checkFeatureFlag('tracking_enabled')
  const isChinaRegion = checkFeatureFlag('china_region')

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>PostHog 跟踪示例</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleCreateCharacter} className="w-full">
            创建角色
          </Button>
          
          <Button onClick={handleStartStream} className="w-full">
            开始直播
          </Button>
          
          <Button onClick={handleStartOnboarding} className="w-full">
            开始引导
          </Button>
          
          <Button onClick={handleUseFeature} className="w-full">
            使用功能
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">功能标志状态：</h4>
          <div className="space-y-1 text-sm">
            <div>跟踪启用: {isTrackingEnabled ? '✅' : '❌'}</div>
            <div>中国地区: {isChinaRegion ? '✅' : '❌'}</div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">使用说明：</h4>
          <ul className="text-sm space-y-1">
            <li>• 点击按钮会自动发送跟踪事件</li>
            <li>• 检查浏览器控制台查看事件日志</li>
            <li>• 在 PostHog 仪表板中查看事件数据</li>
            <li>• 功能标志可以动态控制功能</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 