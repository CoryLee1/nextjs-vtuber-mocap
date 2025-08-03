"use client";

import React, { useState } from 'react';
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
  const { t, getCurrentLocale, getAvailableLocales, changeLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLocale = getCurrentLocale();
  const availableLocales = getAvailableLocales();

  const handleLanguageChange = (localeCode: string) => {
    changeLocale(localeCode as any);
    setIsOpen(false);
  };

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