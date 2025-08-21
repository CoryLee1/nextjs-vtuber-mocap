'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useThemeContext } from '@/providers/ThemeProvider';

export default function SimpleThemeTestPage() {
  const { themeMode, primaryColor } = useThemeContext();

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">主题系统测试</h1>
          <ThemeToggle showLabel />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 主题信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>当前主题信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">主题模式</p>
                <p className="font-medium">{themeMode}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">主色调</p>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-6 h-6 rounded border"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <span className="font-mono text-sm">{primaryColor}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 组件测试卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>组件测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button>主要按钮</Button>
                <Button variant="outline">次要按钮</Button>
                <Button variant="secondary">第三级按钮</Button>
                <Button variant="destructive">危险按钮</Button>
              </div>
            </CardContent>
          </Card>

          {/* 颜色变量测试 */}
          <Card>
            <CardHeader>
              <CardTitle>颜色变量测试</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-8 bg-primary rounded" />
                  <p className="text-xs text-center">Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-secondary rounded" />
                  <p className="text-xs text-center">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-muted rounded" />
                  <p className="text-xs text-center">Muted</p>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-accent rounded" />
                  <p className="text-xs text-center">Accent</p>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-destructive rounded" />
                  <p className="text-xs text-center">Destructive</p>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-border rounded" />
                  <p className="text-xs text-center">Border</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 文本颜色测试 */}
          <Card>
            <CardHeader>
              <CardTitle>文本颜色测试</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-foreground">前景文本颜色</p>
              <p className="text-muted-foreground">次要文本颜色</p>
              <p className="text-primary">主要文本颜色</p>
              <p className="text-secondary">次要文本颜色</p>
              <p className="text-destructive">危险文本颜色</p>
            </CardContent>
          </Card>
        </div>

        {/* 主题切换说明 */}
        <Card>
          <CardHeader>
            <CardTitle>使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">快速切换主题</h3>
                <p className="text-sm text-muted-foreground">
                  点击右上角的主题切换按钮可以在浅色、深色和自动模式之间切换。
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">详细配置</h3>
                <p className="text-sm text-muted-foreground">
                  在主应用中打开设置面板，切换到"主题"标签可以进行更详细的配置。
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">主题功能</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 支持浅色、深色和自动三种模式</li>
                  <li>• 支持自定义主色调</li>
                  <li>• 平滑的主题切换动画</li>
                  <li>• 本地存储保存用户偏好</li>
                  <li>• 响应式设计，适配所有屏幕</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 