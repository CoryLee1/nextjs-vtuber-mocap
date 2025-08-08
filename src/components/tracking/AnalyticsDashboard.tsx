"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Eye, 
  Play, 
  Settings, 
  TrendingUp,
  Activity,
  Target
} from 'lucide-react'

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  pageViews: number
  eventsSent: number
  conversionRate: number
  topEvents: Array<{
    name: string
    count: number
  }>
}

export const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    pageViews: 0,
    eventsSent: 0,
    conversionRate: 0,
    topEvents: []
  })

  const [loading, setLoading] = useState(true)

  // 模拟数据加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      // 模拟 API 调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟数据
      setData({
        totalUsers: 1234,
        activeUsers: 567,
        pageViews: 8901,
        eventsSent: 23456,
        conversionRate: 23.5,
        topEvents: [
          { name: 'page_view', count: 8901 },
          { name: 'button_click', count: 3456 },
          { name: 'character_created', count: 123 },
          { name: 'live_stream_started', count: 89 },
          { name: 'onboarding_completed', count: 67 }
        ]
      })
      
      setLoading(false)
    }
    
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">分析仪表板</h2>
        <Badge variant="secondary">实时数据</Badge>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% 较上周
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">页面浏览</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.pageViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +15% 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化率</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +2.3% 较上月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 事件统计 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>事件统计</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">总事件数</span>
                <span className="text-lg font-bold">{data.eventsSent.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">今日事件</span>
                <span className="text-lg font-bold">{(data.eventsSent / 30).toFixed(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">事件成功率</span>
                <span className="text-lg font-bold text-green-600">99.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>热门事件</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topEvents.map((event, index) => (
                <div key={event.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm font-medium">{event.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {event.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 漏斗分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>用户引导漏斗</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">引导开始</span>
              <span className="text-lg font-bold">1,000</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">角色创建</span>
              <span className="text-lg font-bold">750</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">首次直播</span>
              <span className="text-lg font-bold">450</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">完成引导</span>
              <span className="text-lg font-bold">235</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 