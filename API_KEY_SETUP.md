# API Key 配置指南

## 概述

本项目使用了以下第三方服务，需要配置相应的 API Key：

1. **PostHog** - 用户行为分析和功能标志管理
2. **AWS S3** - 文件存储服务

## 快速开始

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# PostHog 配置
NEXT_PUBLIC_POSTHOG_KEY=phc_kLObnPt4Xrt7MQfYJnCpQkV6ZqScmSzsNETtDck1iWp
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# AWS S3 配置
AWS_ACCESS_KEY_ID=AKIA2YUYL2OOHJJCAFUA
AWS_SECRET_ACCESS_KEY=TUWD0gzQGuKebD8KdezEujo+umpKBAEnaOQwoNsl
NEXT_PUBLIC_S3_BUCKET=nextjs-vtuber-assets
NEXT_PUBLIC_S3_REGION=us-east-2
NEXT_PUBLIC_S3_BASE_URL=https://your-bucket.s3.us-east-2.amazonaws.com

# 应用配置
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=development
```

### 2. 验证配置

访问 `/config-check` 页面查看配置状态。

## 详细配置说明

### PostHog 配置

#### 获取 PostHog API Key

1. 访问 [PostHog](https://posthog.com/) 并注册账户
2. 创建新项目
3. 在项目设置中找到 "Project API Key"
4. 复制 API Key 到 `.env.local` 文件

#### 中国地区配置（可选）

如果需要支持中国用户，建议配置中国地区的 PostHog：

```bash
# 中国环境配置
NEXT_PUBLIC_POSTHOG_KEY_CN=your_china_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST_CN=https://cn.posthog.com
```

### AWS S3 配置

#### 创建 S3 存储桶

1. 登录 AWS 控制台
2. 进入 S3 服务
3. 创建新存储桶
4. 配置存储桶权限（建议使用私有访问）

#### 创建 IAM 用户

1. 进入 IAM 服务
2. 创建新用户
3. 附加以下策略：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. 生成访问密钥对
5. 将 Access Key ID 和 Secret Access Key 添加到 `.env.local`

## 安全最佳实践

### 1. 环境变量管理

- ✅ 使用 `.env.local` 文件存储敏感信息
- ✅ 将 `.env.local` 添加到 `.gitignore`
- ❌ 不要在代码中硬编码 API Key
- ❌ 不要将 API Key 提交到版本控制

### 2. AWS 安全

- 使用最小权限原则配置 IAM
- 定期轮换访问密钥
- 启用 MFA 保护
- 监控 API 使用情况

### 3. PostHog 安全

- 限制 API Key 的访问范围
- 监控事件发送情况
- 定期审查数据收集策略

## 环境特定配置

### 开发环境

```bash
NODE_ENV=development
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 生产环境

```bash
NODE_ENV=production
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### 测试环境

```bash
NODE_ENV=test
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## 故障排除

### 常见问题

1. **环境变量未加载**
   - 确保 `.env.local` 文件在项目根目录
   - 重启开发服务器

2. **AWS 凭证错误**
   - 检查 Access Key ID 和 Secret Access Key
   - 验证 IAM 用户权限
   - 确认存储桶名称和区域

3. **PostHog 连接失败**
   - 检查 API Key 是否正确
   - 验证网络连接
   - 确认项目设置

### 调试工具

访问以下页面进行调试：

- `/config-check` - 配置状态检查
- `/test-env` - 环境变量测试
- `/env-status` - 环境状态详情

## 配置验证

项目包含自动配置验证功能：

```typescript
import { configManager } from '@/lib/config-manager';

// 验证配置
const validation = configManager.validateConfig();
console.log('配置有效:', validation.isValid);
console.log('缺少的配置:', validation.missingKeys);
console.log('警告:', validation.warnings);
```

## 部署注意事项

### Vercel 部署

在 Vercel 项目设置中添加环境变量：

1. 进入项目设置
2. 找到 "Environment Variables" 部分
3. 添加所有必需的环境变量
4. 为不同环境（Production, Preview, Development）设置不同的值

### 其他平台

确保在部署平台中正确配置环境变量，特别是：

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`

## 监控和维护

### 定期检查

1. 每月检查 API Key 的有效性
2. 监控 AWS 费用和使用情况
3. 审查 PostHog 数据收集情况

### 更新和轮换

1. 定期更新 API Key
2. 轮换 AWS 访问密钥
3. 更新依赖包版本

## 支持

如果遇到配置问题，请：

1. 检查 `/config-check` 页面
2. 查看浏览器控制台错误信息
3. 验证环境变量是否正确加载
4. 确认网络连接正常 