/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 实验性功能配置
  experimental: {
    esmExternals: 'loose',
  },
  
  // Webpack 配置
  webpack: (config, { isServer }) => {
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
};

module.exports = nextConfig;