"use client"

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sendTestEvent, isPostHogReady, getPostHogStatus, setUserRegion } from '@/lib/posthog-init'
import { useTracking } from '@/hooks/use-tracking'

export default function PostHogTestPage() {
  const [postHogStatus, setPostHogStatus] = useState<'checking' | 'ready' | 'not-ready'>('checking')
  const [testEvents, setTestEvents] = useState<string[]>([])
  const [detailedStatus, setDetailedStatus] = useState<any>(null)
  const [networkStatus, setNetworkStatus] = useState<string>('checking')
  const [userRegion, setUserRegionState] = useState<string>('international')
  const [envVarsStatus, setEnvVarsStatus] = useState<any>(null)
  const { trackButtonClick, trackFeatureUsed } = useTracking()

  useEffect(() => {
    // 检查环境变量状态（客户端方式）
    const checkEnvVars = () => {
      // 在客户端，我们只能访问 NEXT_PUBLIC_ 开头的环境变量
      const envStatus = {
        POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'configured' : 'not configured',
        POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'default',
        POSTHOG_KEY_CN: process.env.NEXT_PUBLIC_POSTHOG_KEY_CN ? 'configured' : 'not configured',
        POSTHOG_HOST_CN: process.env.NEXT_PUBLIC_POSTHOG_HOST_CN || 'default',
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
      setEnvVarsStatus(envStatus)
      console.log('Client-side environment variables status:', envStatus)
    }

    // 检查 PostHog 状态
    const checkStatus = () => {
      if (isPostHogReady()) {
        setPostHogStatus('ready')
        const status = getPostHogStatus()
        setDetailedStatus(status)
        setUserRegionState(status.config.region)
      } else {
        setPostHogStatus('not-ready')
      }
    }

    // 检查网络连接（使用正确的 PostHog 端点）
    const checkNetwork = async () => {
      try {
        // 测试 PostHog 的 API 端点而不是 /health
        const internationalResponse = await fetch('https://us.i.posthog.com/capture/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: 'test',
            distinct_id: 'test',
            event: 'test_connection'
          })
        })
        
        if (internationalResponse.status === 200 || internationalResponse.status === 400) {
          // 400 是正常的，因为我们的 API key 是测试的
          setNetworkStatus('international-connected')
        } else {
          throw new Error(`HTTP ${internationalResponse.status}`)
        }
      } catch (error) {
        try {
          // 测试中国服务器
          const chinaResponse = await fetch('https://cn.posthog.com/capture/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              api_key: 'test',
              distinct_id: 'test',
              event: 'test_connection'
            })
          })
          
          if (chinaResponse.status === 200 || chinaResponse.status === 400) {
            setNetworkStatus('china-connected')
          } else {
            throw new Error(`HTTP ${chinaResponse.status}`)
          }
        } catch (chinaError) {
          setNetworkStatus('failed')
          console.error('Network check failed:', error)
        }
      }
    }

    // 延迟检查，确保 PostHog 有时间初始化
    setTimeout(() => {
      checkEnvVars()
      checkStatus()
      checkNetwork()
    }, 2000)
  }, [])

  const handleSendTestEvent = () => {
    sendTestEvent()
    setTestEvents(prev => [...prev, `Test event sent at ${new Date().toLocaleTimeString()}`])
    
    // 更新状态
    setTimeout(() => {
      const status = getPostHogStatus()
      setDetailedStatus(status)
    }, 1000)
  }

  const handleTrackButtonClick = () => {
    trackButtonClick('Test Button', 'PostHog Test Page', 'primary')
    setTestEvents(prev => [...prev, `Button click tracked at ${new Date().toLocaleTimeString()}`])
  }

  const handleTrackFeatureUsed = () => {
    trackFeatureUsed('test_feature', 'testing')
    setTestEvents(prev => [...prev, `Feature usage tracked at ${new Date().toLocaleTimeString()}`])
  }

  const handleNetworkTest = async () => {
    setNetworkStatus('testing')
    try {
      // 测试国际服务器
      const internationalResponse = await fetch('https://us.i.posthog.com/capture/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: 'test',
          distinct_id: 'test',
          event: 'test_connection'
        })
      })
      
      if (internationalResponse.status === 200 || internationalResponse.status === 400) {
        setNetworkStatus('international-connected')
        setTestEvents(prev => [...prev, `International server test successful at ${new Date().toLocaleTimeString()}`])
      } else {
        throw new Error(`HTTP ${internationalResponse.status}`)
      }
    } catch (error) {
      try {
        // 测试中国服务器
        const chinaResponse = await fetch('https://cn.posthog.com/capture/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: 'test',
            distinct_id: 'test',
            event: 'test_connection'
          })
        })
        
        if (chinaResponse.status === 200 || chinaResponse.status === 400) {
          setNetworkStatus('china-connected')
          setTestEvents(prev => [...prev, `China server test successful at ${new Date().toLocaleTimeString()}`])
        } else {
          throw new Error(`HTTP ${chinaResponse.status}`)
        }
      } catch (chinaError) {
        setNetworkStatus('failed')
        setTestEvents(prev => [...prev, `Network test failed at ${new Date().toLocaleTimeString()}`])
      }
    }
  }

  const handleSetRegion = (region: 'international' | 'china' | 'eu') => {
    setUserRegion(region)
    setUserRegionState(region)
    setTestEvents(prev => [...prev, `Region set to ${region} at ${new Date().toLocaleTimeString()}`])
    
    // 重新初始化 PostHog
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const getNetworkStatusText = () => {
    switch (networkStatus) {
      case 'international-connected':
        return '✅ 国际服务器连接'
      case 'china-connected':
        return '✅ 中国服务器连接'
      case 'failed':
        return '❌ 连接失败'
      case 'testing':
        return '⏳ 测试中...'
      default:
        return '⏳ 检查中...'
    }
  }

  const getEnvVarStatus = () => {
    if (!envVarsStatus) return 'checking'
    return envVarsStatus.POSTHOG_KEY === 'configured' ? 'configured' : 'not configured'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">PostHog 安装验证</h1>
        <Badge variant={postHogStatus === 'ready' ? 'default' : 'secondary'}>
          {postHogStatus === 'ready' ? '✅ Ready' : postHogStatus === 'not-ready' ? '❌ Not Ready' : '⏳ Checking...'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 状态卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>PostHog 状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>初始化状态:</span>
                <Badge variant={postHogStatus === 'ready' ? 'default' : 'secondary'}>
                  {postHogStatus === 'ready' ? '成功' : postHogStatus === 'not-ready' ? '失败' : '检查中...'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>环境变量:</span>
                <Badge variant={getEnvVarStatus() === 'configured' ? 'default' : 'secondary'}>
                  {getEnvVarStatus() === 'configured' ? '已配置' : getEnvVarStatus() === 'checking' ? '检查中...' : '未配置'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>网络连接:</span>
                <Badge variant={networkStatus.includes('connected') ? 'default' : networkStatus === 'failed' ? 'destructive' : 'secondary'}>
                  {getNetworkStatusText()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 详细状态卡片 */}
        {detailedStatus && (
          <Card>
            <CardHeader>
              <CardTitle>详细状态</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">地区:</span>
                <Badge variant="outline">{detailedStatus.config.region}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Session ID:</span>
                <span className="text-sm font-mono">{detailedStatus.sessionId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Distinct ID:</span>
                <span className="text-sm font-mono">{detailedStatus.distinctId || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Key:</span>
                <Badge variant="outline">
                  {detailedStatus.config.key === 'configured' ? '已配置' : '未配置'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Host:</span>
                <span className="text-sm font-mono">{detailedStatus.config.host}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 环境变量详情卡片 */}
        {envVarsStatus && (
          <Card>
            <CardHeader>
              <CardTitle>环境变量详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">POSTHOG_KEY:</span>
                <Badge variant="outline">
                  {envVarsStatus.POSTHOG_KEY === 'configured' ? '已配置' : '未配置'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">POSTHOG_HOST:</span>
                <span className="text-sm font-mono">{envVarsStatus.POSTHOG_HOST}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">POSTHOG_KEY_CN:</span>
                <Badge variant="outline">
                  {envVarsStatus.POSTHOG_KEY_CN === 'configured' ? '已配置' : '未配置'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">POSTHOG_HOST_CN:</span>
                <span className="text-sm font-mono">{envVarsStatus.POSTHOG_HOST_CN}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">NODE_ENV:</span>
                <Badge variant="outline">{envVarsStatus.NODE_ENV}</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 地区设置卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>地区设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">当前地区:</span>
                <Badge variant="outline">{userRegion}</Badge>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => handleSetRegion('international')} 
                  variant={userRegion === 'international' ? 'default' : 'outline'}
                  className="w-full"
                >
                  国际服务器 (美国/欧洲)
                </Button>
                <Button 
                  onClick={() => handleSetRegion('china')} 
                  variant={userRegion === 'china' ? 'default' : 'outline'}
                  className="w-full"
                >
                  中国服务器
                </Button>
                <Button 
                  onClick={() => handleSetRegion('eu')} 
                  variant={userRegion === 'eu' ? 'default' : 'outline'}
                  className="w-full"
                >
                  欧盟服务器
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 测试事件卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>测试事件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button onClick={handleSendTestEvent} className="w-full">
                发送测试事件
              </Button>
              <Button onClick={handleTrackButtonClick} className="w-full">
                跟踪按钮点击
              </Button>
              <Button onClick={handleTrackFeatureUsed} className="w-full">
                跟踪功能使用
              </Button>
              <Button onClick={handleNetworkTest} className="w-full" variant="outline">
                测试网络连接
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 事件日志 */}
      <Card>
        <CardHeader>
          <CardTitle>事件日志</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testEvents.length === 0 ? (
              <p className="text-gray-500">暂无事件记录</p>
            ) : (
              testEvents.map((event, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  {event}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* 验证说明 */}
      <Card>
        <CardHeader>
          <CardTitle>验证步骤</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>1. 确保 PostHog 状态显示为 "✅ Ready"</p>
            <p>2. 确保环境变量显示为 "已配置"</p>
            <p>3. 确保网络连接状态显示为 "✅ 连接"</p>
            <p>4. 点击"发送测试事件"按钮</p>
            <p>5. 检查浏览器控制台是否有 PostHog 相关日志</p>
            <p>6. 在 PostHog 仪表板中查看事件数据</p>
            <p>7. 如果仍然显示 "Waiting for events"，请检查网络连接和 API 配置</p>
            <p>8. 美国用户建议使用"国际服务器"设置</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 