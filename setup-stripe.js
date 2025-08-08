#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Stripe 生产环境配置工具');
console.log('================================');

// 检查 .env.local 文件是否存在
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('⚠️  发现现有的 .env.local 文件');
  console.log('建议备份现有配置后再继续');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('是否继续？(y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      setupStripe();
    } else {
      console.log('配置已取消');
      rl.close();
    }
  });
} else {
  setupStripe();
}

function setupStripe() {
  const stripeConfig = `# Stripe 生产环境配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here

# PostHog 配置
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# AWS S3 配置
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
NEXT_PUBLIC_S3_BUCKET=your_bucket_name_here
NEXT_PUBLIC_S3_REGION=us-east-2
NEXT_PUBLIC_S3_BASE_URL=https://your-bucket.s3.us-east-2.amazonaws.com

# 应用配置
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=development
`;

  try {
    fs.writeFileSync(envPath, stripeConfig);
    console.log('✅ Stripe 配置模板已成功创建！');
    console.log('');
    console.log('📋 下一步操作：');
    console.log('1. 编辑 .env.local 文件，填入真实的 API keys');
    console.log('2. 根据需要修改其他配置项');
    console.log('3. 运行 npm run dev 启动开发服务器');
    console.log('4. 访问 /subscription 测试支付功能');
    console.log('');
    console.log('⚠️  重要提醒：');
    console.log('- 请将真实的 API keys 填入 .env.local 文件');
    console.log('- 这些是生产环境的真实密钥，请谨慎使用');
    console.log('- 确保 .env.local 已添加到 .gitignore');
  } catch (error) {
    console.error('❌ 配置创建失败:', error.message);
  }
} 