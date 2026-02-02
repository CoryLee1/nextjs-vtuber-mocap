#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Stripe 环境配置工具');
console.log('========================');

// 测试环境配置
const testConfig = `# Stripe 测试环境配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here

# 环境标识
NODE_ENV=development
STRIPE_ENV=test

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
`;

// 生产环境配置
const productionConfig = `# Stripe 生产环境配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here

# 环境标识
NODE_ENV=production
STRIPE_ENV=live

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
`;

console.log('\n📋 可用的环境配置：\n');

console.log('1. 🧪 测试环境 (推荐用于开发)');
console.log('   • 不会产生真实费用');
console.log('   • 可以使用测试卡号');
console.log('   • 适合开发和测试');
console.log('');

console.log('2. 🚀 生产环境 (用于真实业务)');
console.log('   • 会产生真实费用');
console.log('   • 需要真实信用卡');
console.log('   • 适合正式部署');
console.log('');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('请选择环境 (1=测试环境, 2=生产环境): ', (answer) => {
  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);
  
  if (envExists) {
    console.log('\n⚠️  发现现有的 .env.local 文件');
    rl.question('是否覆盖现有配置？(y/N): ', (overwrite) => {
      if (overwrite.toLowerCase() === 'y' || overwrite.toLowerCase() === 'yes') {
        createEnvFile(answer);
      } else {
        console.log('配置已取消');
        rl.close();
      }
    });
  } else {
    createEnvFile(answer);
  }
});

function createEnvFile(choice) {
  const envPath = path.join(process.cwd(), '.env.local');
  const config = choice === '2' ? productionConfig : testConfig;
  const envName = choice === '2' ? '生产环境' : '测试环境';
  
  try {
    fs.writeFileSync(envPath, config);
    console.log(`\n✅ ${envName}配置模板已成功创建！`);
    console.log('');
    console.log('📋 下一步操作：');
    console.log('1. 编辑 .env.local 文件，填入真实的 API keys');
    console.log('2. 根据需要修改其他配置项');
    console.log('3. 运行 npm run dev 启动开发服务器');
    console.log('4. 访问 /stripe-check 检查配置');
    console.log('5. 访问 /subscription 测试支付功能');
    console.log('');
    
    if (choice === '2') {
      console.log('⚠️  重要提醒：');
      console.log('- 这是生产环境配置，会产生真实费用');
      console.log('- 请谨慎测试，避免意外收费');
      console.log('- 建议先用测试环境验证功能');
    } else {
      console.log('🧪 测试环境提醒：');
      console.log('- 可以安全测试所有功能');
      console.log('- 不会产生真实费用');
      console.log('- 可以使用测试卡号');
    }
    
    console.log('');
    console.log('🔍 验证配置：');
    console.log('- 访问 http://localhost:3000/stripe-check');
    console.log('- 检查环境状态和密钥配置');
    
  } catch (error) {
    console.error('❌ 配置创建失败:', error.message);
  }
  
  rl.close();
} 