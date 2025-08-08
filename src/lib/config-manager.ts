// 统一配置管理器
// 提供安全的 API key 管理和环境检测

export interface ConfigValidation {
  isValid: boolean;
  missingKeys: string[];
  warnings: string[];
}

export class ConfigManager {
  private static instance: ConfigManager;
  
  private constructor() {}
  
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // PostHog 配置
  getPostHogConfig() {
    return {
      international: {
        key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        isConfigured: !!process.env.NEXT_PUBLIC_POSTHOG_KEY
      },
      china: {
        key: process.env.NEXT_PUBLIC_POSTHOG_KEY_CN,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST_CN || 'https://cn.posthog.com',
        isConfigured: !!process.env.NEXT_PUBLIC_POSTHOG_KEY_CN
      }
    };
  }

  // AWS S3 配置
  getS3Config() {
    return {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET || 'nextjs-vtuber-assets',
      region: process.env.NEXT_PUBLIC_S3_REGION || 'us-east-2',
      baseUrl: process.env.NEXT_PUBLIC_S3_BASE_URL || 'https://nextjs-vtuber-assets.s3.us-east-2.amazonaws.com',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      isConfigured: !!process.env.AWS_ACCESS_KEY_ID && !!process.env.AWS_SECRET_ACCESS_KEY
    };
  }

  // 应用配置
  getAppConfig() {
    return {
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }

  // 验证配置完整性
  validateConfig(): ConfigValidation {
    const missingKeys: string[] = [];
    const warnings: string[] = [];

    // 检查必需的配置
    const requiredKeys = [
      'NEXT_PUBLIC_POSTHOG_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY'
    ];

    requiredKeys.forEach(key => {
      if (!process.env[key]) {
        missingKeys.push(key);
      }
    });

    // 检查可选但推荐的配置
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY_CN) {
      warnings.push('NEXT_PUBLIC_POSTHOG_KEY_CN not configured (optional for China region)');
    }

    if (!process.env.NEXT_PUBLIC_S3_BUCKET) {
      warnings.push('NEXT_PUBLIC_S3_BUCKET not configured, using default');
    }

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
      warnings
    };
  }

  // 获取配置摘要（用于调试）
  getConfigSummary() {
    const validation = this.validateConfig();
    const posthog = this.getPostHogConfig();
    const s3 = this.getS3Config();
    const app = this.getAppConfig();

    return {
      validation,
      posthog: {
        international: posthog.international.isConfigured ? 'configured' : 'not configured',
        china: posthog.china.isConfigured ? 'configured' : 'not configured'
      },
      s3: {
        bucket: s3.bucket,
        region: s3.region,
        credentials: s3.isConfigured ? 'configured' : 'not configured'
      },
      app: {
        version: app.version,
        environment: app.environment
      }
    };
  }

  // 安全地获取敏感配置（仅服务器端）
  getSecureConfig() {
    if (typeof window !== 'undefined') {
      throw new Error('Secure config should only be accessed on server side');
    }

    return {
      aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    };
  }

  // 检查是否为开发环境
  isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  // 检查是否为生产环境
  isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}

// 导出单例实例
export const configManager = ConfigManager.getInstance(); 