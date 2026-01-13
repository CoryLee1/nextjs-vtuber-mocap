# Stripe 生产环境配置指南

## ⚠️ 重要安全提醒

**这些是生产环境的 API keys，请妥善保管！**

- 不要在公开场合分享这些密钥
- 不要在代码中硬编码
- 只在生产环境中使用
- 定期监控密钥使用情况

## 配置步骤

### 1. 本地开发环境

在项目根目录创建 `.env.local` 文件：

```bash
# Stripe 生产环境配置
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
```

### 2. 生产环境部署

#### Vercel 部署

1. 进入 Vercel 项目设置
2. 找到 "Environment Variables" 部分
3. 添加以下环境变量：

```bash
# Production 环境
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_secret_key_here
NODE_ENV=production
```

#### 其他部署平台

根据你的部署平台，在相应的环境变量设置中添加上述配置。

## 验证配置

### 1. 本地测试

启动开发服务器：

```bash
npm run dev
```

访问以下页面验证配置：

- `/subscription` - 订阅页面
- `/deploy-check` - 部署检查页面

### 2. 生产环境测试

部署后访问：

- `https://your-domain.com/subscription`
- `https://your-domain.com/deploy-check`

## 安全检查清单

- [ ] 确认 `.env.local` 文件已添加到 `.gitignore`
- [ ] 确认生产环境密钥只在生产环境中使用
- [ ] 设置 Stripe Webhook 端点
- [ ] 配置 Stripe Dashboard 通知
- [ ] 设置支付监控和告警

## 测试支付

### 测试卡号（仅用于测试）

- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005

### 测试场景

1. **成功支付测试**
   - 使用测试卡号完成支付
   - 验证订阅创建成功

2. **支付失败测试**
   - 使用 `4000 0000 0000 0002` 测试支付失败
   - 验证错误处理

3. **3D Secure 测试**
   - 使用 `4000 0025 0000 3155` 测试 3D Secure
   - 验证安全验证流程

## 监控和维护

### 关键指标监控

1. **支付成功率**
2. **订阅转化率**
3. **退款率**
4. **客户满意度**

### 定期检查

- 每周检查 Stripe Dashboard
- 监控支付异常
- 审查客户反馈
- 更新安全设置

## 故障排除

### 常见问题

1. **支付失败**
   - 检查 API keys 是否正确配置
   - 验证网络连接
   - 查看 Stripe Dashboard 错误日志

2. **Webhook 不工作**
   - 检查 Webhook 端点配置
   - 验证 Webhook Secret
   - 测试 Webhook 事件

3. **地区检测错误**
   - 检查用户时区设置
   - 验证语言检测逻辑
   - 手动设置用户地区

## 支持

如需技术支持：

1. 查看 Stripe 官方文档
2. 检查项目日志
3. 联系开发团队
4. 访问 Stripe Dashboard 获取详细错误信息

## 重要提醒

**请记住：**
- 这些是生产环境的真实密钥
- 任何支付都会产生真实的费用
- 请谨慎测试，避免意外收费
- 定期备份和监控密钥使用情况 