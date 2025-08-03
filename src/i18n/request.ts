import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ locale }) => {
  // 兜底处理：如果 locale 为 undefined，使用默认语言
  if (!locale) {
    locale = defaultLocale;
  }
  
  // 验证语言是否支持
  if (!locales.includes(locale as any)) {
    throw new Error(`Locale '${locale}' is not supported`);
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
}); 