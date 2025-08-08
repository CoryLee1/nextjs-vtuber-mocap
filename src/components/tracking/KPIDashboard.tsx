"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  TrendingUp, 
  Video, 
  Upload, 
  Globe, 
  Activity,
  AlertTriangle,
  Clock,
  BarChart3,
  Target
} from 'lucide-react'
import { useKPITracking } from '@/hooks/use-kpi-tracking'

interface KPIMetric {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  icon: React.ReactNode
  color: string
}

export const KPIDashboard: React.FC = () => {
  const { isReady, getCurrentUserId, getCurrentSessionId } = useKPITracking()
  const [metrics, setMetrics] = useState<KPIMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 模拟 KPI 数据（实际项目中这些数据来自 PostHog API）
  useEffect(() => {
    if (isReady) {
      // 模拟从 PostHog 获取的数据
      const mockMetrics: KPIMetric[] = [
        {
          name: '活跃用户',
          value: 1250,
          unit: '人',
          trend: 'up',
          change: 12.5,
          icon: <Users className="h-4 w-4" />,
          color: 'text-blue-600'
        },
        {
          name: 'VTuber 创建',
          value: 89,
          unit: '个',
          trend: 'up',
          change: 8.3,
          icon: <Video className="h-4 w-4" />,
          color: 'text-purple-600'
        },
        {
          name: '内容上传',
          value: 156,
          unit: '个',
          trend: 'up',
          change: 15.2,
          icon: <Upload className="h-4 w-4" />,
          color: 'text-green-600'
        },
        {
          name: '直播时长',
          value: 2340,
          unit: '小时',
          trend: 'up',
          change: 22.1,
          icon: <Clock className="h-4 w-4" />,
          color: 'text-orange-600'
        },
        {
          name: '多语言支持',
          value: 3,
          unit: '种',
          trend: 'stable',
          change: 0,
          icon: <Globe className="h-4 w-4" />,
          color: 'text-indigo-600'
        },
        {
          name: '系统性能',
          value: 98.5,
          unit: '%',
          trend: 'up',
          change: 2.1,
          icon: <Activity className="h-4 w-4" />,
          color: 'text-emerald-600'
        },
        {
          name: '错误率',
          value: 0.8,
          unit: '%',
          trend: 'down',
          change: -15.3,
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-red-600'
        },
        {
          name: '转化率',
          value: 23.4,
          unit: '%',
          trend: 'up',
          change: 5.7,
          icon: <Target className="h-4 w-4" />,
          color: 'text-pink-600'
        }
      ]
      
      setMetrics(mockMetrics)
      setIsLoading(false)
    }
  }, [isReady])

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  if (!isReady) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">正在加载 KPI 数据...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 标题和状态 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">KPI 仪表板</h2>
          <p className="text-gray-600">实时业务指标监控</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
            实时更新
          </Badge>
          <Badge variant="outline">
            用户ID: {getCurrentUserId() || '匿名'}
          </Badge>
        </div>
      </div>

      {/* KPI 指标网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-gray-100 ${metric.color}`}>
                  {metric.icon}
                </div>
                <Badge 
                  variant="outline" 
                  className={getTrendColor(metric.trend)}
                >
                  {getTrendIcon(metric.trend)} {metric.change}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">{metric.name}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {metric.value.toLocaleString()}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {metric.unit}
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 语言使用统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              多语言使用统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">中文用户</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm font-medium">45%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">英文用户</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                  <span className="text-sm font-medium">35%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">日文用户</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <span className="text-sm font-medium">20%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能使用统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              功能使用统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">模型上传</span>
                <span className="text-sm font-medium">156 次</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">动画上传</span>
                <span className="text-sm font-medium">89 次</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">直播开始</span>
                <span className="text-sm font-medium">67 次</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">语言切换</span>
                <span className="text-sm font-medium">234 次</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={() => window.open('https://us.i.posthog.com', '_blank')}>
          查看详细报告
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          刷新数据
        </Button>
      </div>
    </div>
  )
}

export default KPIDashboard 