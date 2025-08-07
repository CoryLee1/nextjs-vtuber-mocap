"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  ChevronDown, 
  Check,
  X
} from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

export const LanguageSwitcher: React.FC = () => {
  const { t, locale, getCurrentLocale, getAvailableLocales, changeLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  // 直接使用 locale 和 t 函数来确保正确的状态同步
  const currentLocale = useMemo(() => {
    const flags = {
      zh: '🇨🇳',
      en: '🇺🇸',
      ja: '🇯🇵',
    };
    
    return {
      code: locale,
      name: t(`languages.${locale}`),
      flag: flags[locale],
    };
  }, [locale, t]);
  
  const availableLocales = useMemo(() => {
    const flags = {
      zh: '🇨🇳',
      en: '🇺🇸',
      ja: '🇯🇵',
    };
    
    return ['zh', 'en', 'ja'].map(loc => ({
      code: loc,
      name: t(`languages.${loc}`),
      flag: flags[loc],
      isCurrent: loc === locale,
    }));
  }, [locale, t]);

  // 监听语言变化，关闭下拉菜单
  useEffect(() => {
    setIsOpen(false);
  }, [locale]);

  const handleLanguageChange = (localeCode: string) => {
    console.log('Language change requested:', {
      from: currentLocale.code,
      to: localeCode,
      currentPath: window.location.pathname
    });
    
    changeLocale(localeCode as any);
    setIsOpen(false);
  };

  console.log('LanguageSwitcher render:', {
    currentLocale,
    availableLocales,
    isOpen,
    locale
  });

  return (
    <div className="relative">
      {/* 语言切换按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/95 backdrop-blur-sm border-sky-200 text-sky-700 hover:bg-sky-50"
      >
        <Globe className="h-4 w-4 mr-2" />
        <span className="mr-1">{currentLocale.flag}</span>
        <span className="hidden sm:inline">{currentLocale.name}</span>
        <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* 语言选择下拉菜单 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <Card className="w-48 bg-white/95 backdrop-blur-sm border-sky-200 shadow-xl">
            <CardContent className="p-2">
              <div className="space-y-1">
                {availableLocales.map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => handleLanguageChange(locale.code)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                      locale.isCurrent
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'hover:bg-sky-50 text-sky-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{locale.flag}</span>
                      <span className="font-medium">{locale.name}</span>
                    </div>
                    {locale.isCurrent && (
                      <Check className="h-4 w-4 text-sky-600" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
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
  );
}; 