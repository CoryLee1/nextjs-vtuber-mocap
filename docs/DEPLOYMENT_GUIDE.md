# 部署指南

## 问题解决

### PostHog 初始化错误

如果你看到以下错误：
```
[PostHog.js] PostHog was initialized without a token. This likely indicates a misconfiguration.
```

这表示 PostHog API key 没有正确配置。

## 解决方案

### 1. 检查环境变量配置

访问 `/deploy-check` 页面查看当前配置状态。

### 2. 在部署平台配置环境变量

#### Vercel 部署

1. 进入 Vercel 项目设置
2. 找到 "Environment Variables" 部分
3. 添加以下环境变量：

```bash
# PostHog 配置
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# AWS S3 配置（可选）
NEXT_PUBLIC_S3_BUCKET=your_bucket_name_here
NEXT_PUBLIC_S3_REGION=us-east-2
NEXT_PUBLIC_S3_BASE_URL=https://your-bucket.s3.us-east-2.amazonaws.com

# 应用配置
NEXT_PUBLIC_APP_VERSION=1.0.0
```

4. 为不同环境设置不同的值：
   - **Production**: 生产环境配置
   - **Preview**: 预览环境配置
   - **Development**: 开发环境配置

#### Netlify 部署

1. 进入 Netlify 项目设置
2. 找到 "Environment variables" 部分
3. 添加相同的环境变量

#### Railway 部署

1. 进入 Railway 项目设置
2. 找到 "Variables" 部分
3. 添加相同的环境变量

### 3. 获取 PostHog API Key

1. 访问 [PostHog](https://posthog.com/)
2. 注册或登录账户
3. 创建新项目
4. 在项目设置中找到 "Project API Key"
5. 复制 API Key

### 4. 重新部署

配置环境变量后，重新部署应用：

```bash
# 如果使用 Vercel CLI
vercel --prod

# 或者通过 Git 推送触发部署
git push origin main
```

### 5. 验证配置

部署完成后：

1. 访问 `/deploy-check` 页面
2. 检查 PostHog 配置状态
3. 查看浏览器控制台是否有错误

## 常见问题

### Q: 为什么 PostHog 没有初始化？

A: 可能的原因：
- 环境变量没有正确配置
- API Key 无效
- 网络连接问题

### Q: 如何调试 PostHog 问题？

A: 
1. 访问 `/deploy-check` 页面
2. 检查浏览器控制台
3. 验证环境变量是否正确加载

### Q: 生产环境和开发环境使用不同的 PostHog 项目？

A: 可以在不同环境设置不同的 API Key：
- 开发环境：使用测试项目
- 生产环境：使用正式项目

## 安全提醒

1. **永远不要**在代码中硬编码 API Key
2. **永远不要**将 `.env.local` 文件提交到版本控制
3. 定期轮换 API Key
4. 使用最小权限原则

## 监控和维护

1. 定期检查 PostHog 数据收集情况
2. 监控 API 使用情况
3. 更新依赖包版本
4. 审查隐私政策合规性

## 支持

如果遇到问题：

1. 检查 `/deploy-check` 页面
2. 查看浏览器控制台错误
3. 验证环境变量配置
4. 确认网络连接正常 