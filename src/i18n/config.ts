// 支持的语言列表
export const locales = ['zh', 'en', 'ja'] as const;
export type Locale = typeof locales[number];

// 默认语言
export const defaultLocale: Locale = 'zh';

// 语言配置
export const localeConfig = {
  zh: {
    name: '中文',
    flag: '🇨🇳',
    direction: 'ltr' as const,
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
    direction: 'ltr' as const,
  },
  ja: {
    name: '日本語',
    flag: '🇯🇵',
    direction: 'ltr' as const,
  },
}; 