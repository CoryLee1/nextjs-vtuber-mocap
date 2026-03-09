"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Eye, 
  Settings, 
  CheckCircle, 
  XCircle,
  Info
} from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'

interface ConsentSettings {
  analytics: boolean
  marketing: boolean
  necessary: boolean
  region: 'china' | 'eu' | 'international'
}

interface ConsentManagerProps {
  isOpen: boolean
  onClose: () => void
  onConsentChange: (settings: ConsentSettings) => void
}

export const ConsentManager: React.FC<ConsentManagerProps> = ({
  isOpen,
  onClose,
  onConsentChange
}) => {
  const { t } = useI18n()
  const [settings, setSettings] = useState<ConsentSettings>({
    analytics: false,
    marketing: false,
    necessary: true, // 必要的 cookies 总是启用
    region: 'international'
  })

  // 检测用户地区
  useEffect(() => {
    const detectRegion = (): 'china' | 'eu' | 'international' => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const language = navigator.language
      
      if (timezone.includes('Asia/Shanghai') || 
          timezone.includes('Asia/Beijing') || 
          language.includes('zh')) {
        return 'china'
      }
      
      if (timezone.includes('Europe/') || language.includes('eu')) {
        return 'eu'
      }
      
      return 'international'
    }
    
    setSettings(prev => ({ ...prev, region: detectRegion() }))
  }, [])

  // 加载已保存的设置
  useEffect(() => {
    const savedSettings = localStorage.getItem('consent_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (error) {
        console.error('Failed to parse saved consent settings:', error)
      }
    }
  }, [])

  const handleSettingChange = (key: keyof ConsentSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // 保存到本地存储
    localStorage.setItem('consent_settings', JSON.stringify(newSettings))
    
    // 通知父组件
    onConsentChange(newSettings)
  }

  const handleAcceptAll = () => {
    const newSettings = {
      ...settings,
      analytics: true,
      marketing: true,
      necessary: true
    }
    setSettings(newSettings)
    localStorage.setItem('consent_settings', JSON.stringify(newSettings))
    onConsentChange(newSettings)
    onClose()
  }

  const handleRejectAll = () => {
    const newSettings = {
      ...settings,
      analytics: false,
      marketing: false,
      necessary: true // 必要的 cookies 总是启用
    }
    setSettings(newSettings)
    localStorage.setItem('consent_settings', JSON.stringify(newSettings))
    onConsentChange(newSettings)
    onClose()
  }

  const handleSave = () => {
    localStorage.setItem('consent_settings', JSON.stringify(settings))
    onConsentChange(settings)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-xl">
              {settings.region === 'china' ? t('consent.titlePrivacy') : t('consent.titleCookie')}
            </CardTitle>
            <Badge variant={settings.region === 'china' ? 'destructive' : 'secondary'}>
              {settings.region === 'china' ? 'PIPL' : settings.region === 'eu' ? 'GDPR' : t('consent.badgeInternational')}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 说明文本 */}
          <div className="text-sm text-gray-600 space-y-2">
            {settings.region === 'china' ? (
              <>
                <p>{t('consent.piplDescription1')}</p>
                <p>{t('consent.piplDescription2')}</p>
              </>
            ) : settings.region === 'eu' ? (
              <>
                <p>{t('consent.gdprDescription1')}</p>
                <p>{t('consent.gdprDescription2')}</p>
              </>
            ) : (
              <>
                <p>{t('consent.internationalDescription1')}</p>
                <p>{t('consent.internationalDescription2')}</p>
              </>
            )}
          </div>

          {/* 必要的 Cookies */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <Label className="font-medium">{t('consent.necessaryCookies')}</Label>
                  <p className="text-sm text-gray-600">
                    {t('consent.necessaryDescription')}
                  </p>
                </div>
              </div>
              <Switch checked={settings.necessary} disabled />
            </div>

            {/* 分析 Cookies */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="font-medium">{t('consent.analyticsCookies')}</Label>
                  <p className="text-sm text-gray-600">
                    {t('consent.analyticsDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.analytics}
                onCheckedChange={(checked) => handleSettingChange('analytics', checked)}
              />
            </div>

            {/* 营销 Cookies */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-purple-600" />
                <div>
                  <Label className="font-medium">{t('consent.marketingCookies')}</Label>
                  <p className="text-sm text-gray-600">
                    {t('consent.marketingDescription')}
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.marketing}
                onCheckedChange={(checked) => handleSettingChange('marketing', checked)}
              />
            </div>
          </div>

          {/* 详细信息链接 */}
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <Info className="h-4 w-4" />
            <a href="/privacy" className="hover:underline">
              {t('consent.privacyLink')}
            </a>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleRejectAll}
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {t('consent.rejectAll')}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSave}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-2" />
              {t('consent.saveSettings')}
            </Button>
            
            <Button
              onClick={handleAcceptAll}
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('consent.acceptAll')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 