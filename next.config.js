const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 实验性功能配置
  experimental: {
    esmExternals: 'loose',
  },
  
  // Webpack 配置
  webpack: (config, { isServer, dev }) => {
    // 处理客户端环境的 fallback
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }
    
    // ✅ 优化 webpack 缓存以减少内存使用
    if (dev) {
      // 限制缓存大小，避免内存分配失败
      // 使用绝对路径（webpack 要求）
      const cacheDir = path.resolve(process.cwd(), '.next/cache/webpack');
      config.cache = {
        ...config.cache,
        type: 'filesystem',
        maxMemoryGenerations: 1, // 限制内存中的缓存代数
        buildDependencies: {
          config: [__filename],
        },
        // 使用绝对路径
        cacheDirectory: cacheDir,
      };
      
      // 优化内存使用
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        splitChunks: false, // 开发环境禁用代码分割以节省内存
      };
    }
    
    // 处理 3D 模型文件
    config.module.rules.push({
      test: /\.(fbx|vrm|glb|gltf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/models/',
          outputPath: 'static/models/',
        },
      },
    });

    return config;
  },
  
  // 图片配置
  images: {
    domains: [
      'cdn.jsdelivr.net',
      'unpkg.com',
      'nextjs-vtuber-assets.s3.us-east-2.amazonaws.com',
    ],
  },
  
  // 头部配置（用于 MediaPipe）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // PostHog rewrites
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
      {
        source: '/ingest/flags',
        destination: 'https://us.i.posthog.com/flags',
      },
    ];
  },

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,

  // TypeScript 配置
  typescript: {
    // 在生产构建时忽略 TypeScript 错误（开发时仍会显示）
    ignoreBuildErrors: true,
  },
  
  // ESLint 配置
  eslint: {
    // 在生产构建时忽略 ESLint 错误（开发时仍会显示）
    ignoreDuringBuilds: true,
  },
};

module.exports = withNextIntl(nextConfig);
