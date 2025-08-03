import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';

export const useI18n = () => {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  // 切换语言
  const changeLocale = (newLocale: Locale) => {
    const currentPathname = pathname;
    const newPathname = currentPathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
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