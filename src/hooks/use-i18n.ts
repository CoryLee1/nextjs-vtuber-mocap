import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

export const useI18n = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  
  // 直接从 URL 解析当前语言
  const getCurrentLocaleFromPath = (): Locale => {
    for (const loc of locales) {
      if (pathname.startsWith(`/${loc}`)) {
        return loc;
      }
    }
    return 'zh'; // 默认语言
  };
  
  const locale = getCurrentLocaleFromPath();

  // 修复的语言切换逻辑
  const changeLocale = (newLocale: Locale) => {
    // 获取当前路径，移除所有可能的语言前缀
    let pathWithoutLocale = pathname;
    
    // 移除所有可能的语言前缀
    for (const loc of locales) {
      const prefix = `/${loc}`;
      if (pathWithoutLocale.startsWith(prefix)) {
        pathWithoutLocale = pathWithoutLocale.substring(prefix.length) || '/';
        break; // 找到第一个匹配的前缀后立即停止
      }
    }
    
    // 构建新路径
    const newPath = `/${newLocale}${pathWithoutLocale}`;
    
    console.log('Language change:', {
      from: locale,
      to: newLocale,
      originalPath: pathname,
      pathWithoutLocale,
      newPath
    });
    
    router.push(newPath);
  };

  // 获取当前语言信息
  const getCurrentLocale = () => {
    return {
      code: locale,
      name: t(`languages.${locale}`),
      flag: getLocaleFlag(locale),
    };
  };

  // 获取语言标志
  const getLocaleFlag = (locale: Locale) => {
    const flags = {
      zh: '🇨🇳',
      en: '🇺🇸',
      ja: '🇯🇵',
    };
    return flags[locale];
  };

  // 获取所有可用语言
  const getAvailableLocales = () => {
    return locales.map(loc => ({
      code: loc,
      name: t(`languages.${loc}`),
      flag: getLocaleFlag(loc),
      isCurrent: loc === locale,
    }));
  };

  return {
    t,
    locale,
    changeLocale,
    getCurrentLocale,
    getAvailableLocales,
    locales,
  };
}; 