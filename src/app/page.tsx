import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function RootPage() {
  // 确保重定向到默认语言
  redirect(`/${defaultLocale}`);
} 