# Stripe 支付集成指南

## 概述

本项目已集成 Stripe 支付系统，支持中国和国际支付方式。

## 支持的支付方式

### 🇨🇳 中国支付方式
- **支付宝** - 中国主流移动支付
- **微信支付** - 微信生态支付
- **银联** - 传统银行卡支付

### 🌍 国际支付方式
- **信用卡** - Visa, Mastercard, American Express
- **PayPal** - 国际电子钱包
- **Apple Pay** - iOS 生态系统支付
- **Google Pay** - Android 生态系统支付

## 订阅计划

### 基础版 ($9.99/月)
- 基础 VTuber 功能
- 5 个模型
- 10 个动画
- 基础技术支持

### 专业版 ($19.99/月)
- 所有基础功能
- 无限模型
- 无限动画
- 高级技术支持
- 优先更新

### 高级版 ($39.99/月)
- 所有专业功能
- 自定义模型
- 专属动画
- 24/7 技术支持
- API 访问
- 白标解决方案

## 环境变量配置

### 开发环境

在 `.env.local` 文件中添加：

```bash
# Stripe 配置
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 生产环境

在部署平台配置以下环境变量：

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_SECRET_KEY=sk_live_your_live_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 功能特性

### 自动地区检测
- 基于用户时区和语言自动检测地区
- 中国用户显示人民币价格和本地支付方式
- 国际用户显示美元价格和国际支付方式

### 智能支付方式
- 根据用户地区自动显示相关支付方式
- 支持多种货币和汇率转换
- 实时支付状态更新

### 安全支付
- 使用 Stripe 安全支付处理
- 支持 3D Secure 验证
- PCI DSS 合规

## API 端点

### 创建支付意图
```
POST /api/stripe/create-payment-intent
```

### 创建订阅
```
POST /api/stripe/create-subscription
```

### 取消订阅
```
POST /api/stripe/cancel-subscription
```

## 测试

### 测试卡号
- **Visa**: 4242 4242 4242 4242
- **Mastercard**: 5555 5555 5555 4444
- **American Express**: 3782 822463 10005

### 测试场景
1. 成功支付
2. 支付失败
3. 需要 3D Secure 验证
4. 订阅管理
5. 退款处理

## 部署注意事项

### Vercel 部署
1. 在 Vercel 项目设置中添加环境变量
2. 配置 Stripe Webhook 端点
3. 设置生产环境 API keys

### 安全提醒
- 永远不要在客户端代码中暴露 Secret Key
- 使用环境变量管理敏感信息
- 定期轮换 API keys
- 监控支付异常

## 故障排除

### 常见问题

1. **支付失败**
   - 检查 API keys 是否正确
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

## 监控和维护

### 关键指标
- 支付成功率
- 订阅转化率
- 退款率
- 客户满意度

### 定期检查
- Stripe Dashboard 数据
- Webhook 事件日志
- 支付异常报告
- 客户反馈

## 支持

如需技术支持：
1. 查看 Stripe 官方文档
2. 检查项目日志
3. 联系开发团队 