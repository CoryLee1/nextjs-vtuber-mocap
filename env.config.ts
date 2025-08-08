// 环境变量配置
// 这个文件用于 Cursor 编辑器访问环境变量配置
// 实际的 .env.local 文件包含敏感信息，不应该直接暴露

import { configManager } from '@/lib/config-manager';

// 导出配置管理器实例
export { configManager };

// 兼容性导出（保持向后兼容）
export const ENV_CONFIG = {
  // PostHog 配置
  POSTHOG: {
    KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || 'phc_kLObnPt4Xrt7MQfYJnCpQkV6ZqScmSzsNETtDck1iWp',
    HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    KEY_CN: process.env.NEXT_PUBLIC_POSTHOG_KEY_CN,
    HOST_CN: process.env.NEXT_PUBLIC_POSTHOG_HOST_CN,
  },
  
  // AWS S3 配置
  S3: {
    BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets',
    REGION: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2',
    BASE_URL: process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com',
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  },
  
  // 应用配置
  APP: {
    VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    ENVIRONMENT: process.env.NODE_ENV || 'development',
  }
}

// 调试：打印环境变量状态
if (typeof window !== 'undefined') {
  console.log('Environment variables status:', {
    POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ? 'configured' : 'not configured',
    POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'default',
    S3_BUCKET: process.env.NEXT_PUBLIC_S3_BUCKET ? 'configured' : 'not configured',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'not configured',
    NODE_ENV: process.env.NODE_ENV
  })
}

// 检查环境变量是否已加载
export const checkEnvVars = () => {
  const validation = configManager.validateConfig();
  return validation.isValid;
}

// 获取当前环境配置
export const getCurrentConfig = () => {
  return {
    posthog: configManager.getPostHogConfig(),
    s3: configManager.getS3Config(),
    app: configManager.getAppConfig()
  }
} 