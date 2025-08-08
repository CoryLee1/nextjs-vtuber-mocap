"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'
import { useI18n } from '@/hooks/use-i18n'
import { useInternationalizationKPI } from '@/hooks/use-kpi-tracking'

export const LanguageSwitcher: React.FC = () => {
  const { t, locale, changeLocale } = useI18n()
  const { trackLanguageSwitch } = useInternationalizationKPI()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLocale = useMemo(() => {
    const flags = { zh: '🇨🇳', en: '🇺🇸', ja: '🇯🇵' }
    return {
      code: locale,
      name: t(`languages.${locale}`),
      flag: flags[locale],
    }
  }, [locale, t])

  const availableLocales = useMemo(() => {
    const flags = { zh: '🇨🇳', en: '🇺🇸', ja: '🇯🇵' }
    return ['zh', 'en', 'ja'].map(loc => ({
      code: loc,
      name: t(`languages.${loc}`),
      flag: flags[loc],
      isCurrent: loc === locale,
    }))
  }, [locale, t])

  useEffect(() => {
    setIsOpen(false)
  }, [locale])

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== locale) {
      // 跟踪语言切换 KPI
      trackLanguageSwitch(
        locale,
        newLocale,
        undefined, // userId 可以从其他地方获取
        'user_manual_switch'
      )
      
      changeLocale(newLocale as any)
    }
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-2">{currentLocale.flag}</span>
        <span className="hidden sm:inline">{currentLocale.name}</span>
        <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <div className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-[120px]">
            {availableLocales.map((loc) => (
                  <button
                key={loc.code}
                onClick={() => handleLanguageChange(loc.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                  loc.isCurrent ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                  <span className="text-lg">{loc.flag}</span>
                  <span className="font-medium">{loc.name}</span>
                    </div>
                {loc.isCurrent && (
                  <span className="text-xs text-blue-600">当前</span>
                    )}
                  </button>
                ))}
              </div>
        </div>
      )}

      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 