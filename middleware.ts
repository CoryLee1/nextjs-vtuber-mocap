import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/i18n/config';

export default createMiddleware({
  // 支持的语言列表
  locales: locales,
  
  // 默认语言
  defaultLocale: defaultLocale,
  
  // 本地化检测
  localeDetection: true,
  
  // 强制重定向到默认语言（当访问根路径时）
  alternateLinks: true,
});

export const config = {
  // 匹配所有路径，除了 API 路由、静态文件等
  matcher: [
    // 匹配所有路径，除了以下路径：
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // 确保根路径也被匹配
    '/'
  ]
}; 