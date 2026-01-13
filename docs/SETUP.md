# 环境变量设置

## AWS S3 配置

为了安全起见，请创建 `.env.local` 文件并设置以下环境变量：

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
NEXT_PUBLIC_S3_BUCKET=your_bucket_name_here
NEXT_PUBLIC_S3_REGION=us-east-2
```

## 重要安全提醒

1. **永远不要**将 `.env.local` 文件提交到版本控制
2. **永远不要**在代码中硬编码AWS密钥
3. 如果密钥已泄露，请立即在AWS控制台中轮换密钥

## 设置步骤

1. 在项目根目录创建 `.env.local` 文件
2. 复制上面的环境变量模板
3. 填入你的实际AWS密钥和配置
4. 重启开发服务器

## 验证设置

运行以下命令验证环境变量是否正确加载：

```bash
npm run dev
```

如果看到 "AWS credentials not configured" 错误，请检查 `.env.local` 文件设置。 