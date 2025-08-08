"use client"

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentConfig, checkEnvVars } from '../../../../env.config'

export default function EnvStatusPage() {
  const [config, setConfig] = useState<any>(null)
  const [envVarsLoaded, setEnvVarsLoaded] = useState(false)

  useEffect(() => {
    // 检查环境变量
    const envCheck = checkEnvVars()
    setEnvVarsLoaded(envCheck)
    
    // 获取当前配置
    const currentConfig = getCurrentConfig()
    setConfig(currentConfig)
  }, [])

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">环境变量状态</h1>
        <Badge variant={envVarsLoaded ? 'default' : 'destructive'}>
          {envVarsLoaded ? '✅ 已加载' : '❌ 未完全加载'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PostHog 配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>PostHog 配置</span>
              <Badge variant={config.posthog.isConfigured ? 'default' : 'secondary'}>
                {config.posthog.isConfigured ? '已配置' : '未配置'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Key:</span>
              <Badge variant="outline">
                {config.posthog.key ? '***configured***' : 'not configured'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Host:</span>
              <span className="text-sm font-mono">{config.posthog.host}</span>
            </div>
          </CardContent>
        </Card>

        {/* S3 配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>S3 配置</span>
              <Badge variant={config.s3.isConfigured ? 'default' : 'secondary'}>
                {config.s3.isConfigured ? '已配置' : '未配置'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Bucket:</span>
              <span className="text-sm font-mono">{config.s3.bucket}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Region:</span>
              <span className="text-sm font-mono">{config.s3.region}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Base URL:</span>
              <span className="text-sm font-mono truncate max-w-32">{config.s3.baseUrl}</span>
            </div>
          </CardContent>
        </Card>

        {/* 应用配置 */}
        <Card>
          <CardHeader>
            <CardTitle>应用配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">版本:</span>
              <span className="text-sm font-mono">{config.app.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">环境:</span>
              <Badge variant="outline">{config.app.environment}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 环境变量状态 */}
        <Card>
          <CardHeader>
            <CardTitle>环境变量状态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">.env.local:</span>
              <Badge variant="outline">已加载</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cursor 访问:</span>
              <Badge variant="outline">通过 env.config.ts</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">PostHog 状态:</span>
              <Badge variant={config.posthog.isConfigured ? 'default' : 'secondary'}>
                {config.posthog.isConfigured ? '可用' : '不可用'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>• <code>.env.local</code> 文件包含敏感信息，Cursor 无法直接访问</p>
            <p>• <code>env.config.ts</code> 文件提供了环境变量的安全访问方式</p>
            <p>• 所有环境变量都通过 <code>env.config.ts</code> 进行配置</p>
            <p>• PostHog 和 S3 配置状态实时显示</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 