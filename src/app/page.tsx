import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n/config';

export default function RootPage() {
  // 在服务器端重定向到默认语言
  redirect(`/${defaultLocale}`);
  
  // 这个 return 永远不会执行，但为了满足 React 组件的要求
  return null;
} 