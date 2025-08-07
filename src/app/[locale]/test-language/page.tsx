"use client";

import { useI18n } from '@/hooks/use-i18n';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useEffect } from 'react';

export default function TestLanguagePage() {
  const { t, locale } = useI18n();

  useEffect(() => {
    console.log('TestLanguagePage mounted:', {
      locale,
      pathname: window.location.pathname,
      href: window.location.href
    });
  }, [locale]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-8 border border-sky-200">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-sky-900">
              {t('app.title')}
            </h1>
            <LanguageSwitcher />
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-sky-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-sky-900 mb-4">
                  {t('vtuber.title')}
                </h2>
                <p className="text-sky-700">{t('vtuber.subtitle')}</p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">
                  {t('settings.title')}
                </h2>
                <p className="text-blue-700">{t('settings.description')}</p>
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-4">
                {t('performance.title')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{t('performance.high')}</div>
                  <div className="text-sm text-green-700">{t('performance.quality')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{t('performance.medium')}</div>
                  <div className="text-sm text-green-700">{t('performance.quality')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{t('performance.low')}</div>
                  <div className="text-sm text-green-700">{t('performance.quality')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">60</div>
                  <div className="text-sm text-green-700">{t('performance.fps')}</div>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sky-600">
              <p>当前语言: <strong>{locale}</strong></p>
              <p>路径: <code>{typeof window !== 'undefined' ? window.location.pathname : ''}</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 