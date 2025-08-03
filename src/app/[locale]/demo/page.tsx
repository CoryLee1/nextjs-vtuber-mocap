"use client";

import { useI18n } from '@/hooks/use-i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export default function DemoPage() {
  const { t, getCurrentLocale } = useI18n();
  
  const currentLocale = getCurrentLocale();

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-sky-900">{t('app.title')}</h1>
            <p className="text-sky-600 mt-2">{t('app.description')}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* 当前语言信息 */}
        <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
          <CardHeader>
            <CardTitle className="text-sky-900">当前语言信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <span className="text-4xl">{currentLocale.flag}</span>
              <div>
                <div className="text-xl font-medium text-sky-900">{currentLocale.name}</div>
                <div className="text-sm text-sky-600">语言代码: {currentLocale.code}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能演示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 摄像头功能 */}
          <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-900">{t('vtuber.camera.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sky-600">状态</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {t('vtuber.camera.connected')}
                </Badge>
              </div>
              <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                {t('vtuber.camera.start')}
              </Button>
            </CardContent>
          </Card>

          {/* 模型管理 */}
          <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-900">{t('vtuber.model.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sky-600">模型数量</span>
                <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                  12 个
                </Badge>
              </div>
              <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                {t('vtuber.model.manager')}
              </Button>
            </CardContent>
          </Card>

          {/* 动画库 */}
          <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-900">{t('vtuber.animation.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sky-600">动画数量</span>
                <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                  8 个
                </Badge>
              </div>
              <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                {t('vtuber.animation.library')}
              </Button>
            </CardContent>
          </Card>

          {/* 控制面板 */}
          <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-900">{t('vtuber.controls.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="border-sky-200 text-sky-700">
                  {t('vtuber.controls.bones')}
                </Button>
                <Button variant="outline" size="sm" className="border-sky-200 text-sky-700">
                  {t('vtuber.controls.debug')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 设置 */}
          <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-900">{t('settings.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sky-600">版本</span>
                <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                  1.0.0
                </Badge>
              </div>
              <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                {t('settings.title')}
              </Button>
            </CardContent>
          </Card>

          {/* 性能 */}
          <Card className="bg-white/95 backdrop-blur-sm border-sky-200">
            <CardHeader>
              <CardTitle className="text-sky-900">{t('performance.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sky-600">FPS</span>
                <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                  60
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-sky-600">{t('performance.quality')}</span>
                <Badge variant="secondary" className="bg-sky-100 text-sky-700">
                  {t('performance.high')}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 导航按钮 */}
        <div className="flex items-center justify-center space-x-4">
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="border-sky-200 text-sky-700 hover:bg-sky-50"
          >
            返回主页
          </Button>
          <Button 
            onClick={() => window.location.href = '/demo'}
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            演示页面
          </Button>
        </div>
      </div>
    </div>
  );
} 