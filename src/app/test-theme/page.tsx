'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useThemeContext } from '@/providers/ThemeProvider';

export default function ThemeTestPage() {
  const { themeMode, primaryColor } = useThemeContext();
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      setCssVariables({
        '--background': computedStyle.getPropertyValue('--background'),
        '--foreground': computedStyle.getPropertyValue('--foreground'),
        '--card': computedStyle.getPropertyValue('--card'),
        '--card-foreground': computedStyle.getPropertyValue('--card-foreground'),
        '--primary': computedStyle.getPropertyValue('--primary'),
        '--primary-foreground': computedStyle.getPropertyValue('--primary-foreground'),
        '--ring': computedStyle.getPropertyValue('--ring'),
        '--muted': computedStyle.getPropertyValue('--muted'),
        '--muted-foreground': computedStyle.getPropertyValue('--muted-foreground'),
        '--popover': computedStyle.getPropertyValue('--popover'),
        '--popover-foreground': computedStyle.getPropertyValue('--popover-foreground'),
      });
    }
  }, [themeMode, primaryColor]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">加载中...</h1>
            <p>正在初始化主题系统...</p>
          </div>
        </div>
      </div>
    );
  }

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

        {/* CSS变量显示 */}
        <Card>
          <CardHeader>
            <CardTitle>CSS变量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono">
              <div>
                <p className="text-muted-foreground mb-2">背景相关</p>
                <p>--background: {cssVariables['--background'] || 'N/A'}</p>
                <p>--card: {cssVariables['--card'] || 'N/A'}</p>
                <p>--popover: {cssVariables['--popover'] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">文本相关</p>
                <p>--foreground: {cssVariables['--foreground'] || 'N/A'}</p>
                <p>--muted-foreground: {cssVariables['--muted-foreground'] || 'N/A'}</p>
                <p>--card-foreground: {cssVariables['--card-foreground'] || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">主题相关</p>
                <p>--primary: {cssVariables['--primary'] || 'N/A'}</p>
                <p>--primary-foreground: {cssVariables['--primary-foreground'] || 'N/A'}</p>
                <p>--ring: {cssVariables['--ring'] || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 