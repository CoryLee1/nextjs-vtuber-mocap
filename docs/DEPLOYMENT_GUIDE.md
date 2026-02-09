# 部署指南

## 完整部署（先部署再调）

建议顺序：**先部署后端 → 再部署前端**，然后在前端环境变量里填后端地址。

---

### 一、后端（Echuu workflow，Python FastAPI）

后端需常驻进程、支持 WebSocket，可选用：

| 平台 | 说明 |
|------|------|
| **Railway** | 支持 Python、WebSocket，按量计费，适合先上线 |
| **Render** | 免费/付费 Web Service，支持 Docker 或直接跑 Python |
| **Fly.io** | 全球节点，支持 WebSocket |
| **自建 VPS** | 用 systemd + uvicorn 或 Docker |

**环境变量（后端）**：`DASHSCOPE_API_KEY`（TTS）、可选 `TTS_VOICE`、LLM 相关 key（若用 Gemini 等）。

**启动方式**：

- **方式 A：Docker（推荐）**  
  仓库已提供 `echuu-agent/workflow/backend/Dockerfile`。在**仓库根目录**执行：

  ```bash
  docker build -f echuu-agent/workflow/backend/Dockerfile -t echuu-backend .
  docker run -p 8000:8000 -e DASHSCOPE_API_KEY=xxx echuu-backend
  ```

  Railway/Render 等选「从 Dockerfile 部署」时，构建上下文选仓库根，Dockerfile 路径填 `echuu-agent/workflow/backend/Dockerfile`。

- **方式 B：直接跑 Python**  
  需设置 `PYTHONPATH` 指向 `echuu-agent/public`：

  ```bash
  export PYTHONPATH=/path/to/echuu-agent/public
  cd echuu-agent/workflow/backend
  uvicorn app:app --host 0.0.0.0 --port 8000
  ```

部署完成后记下后端地址，例如：`https://your-echuu-backend.railway.app`（**必须是 HTTPS**，否则前端无法在 HTTPS 页里连 WS）。

---

### 二、前端（Next.js，推荐 Vercel）

1. **接好 Git**  
   在 [vercel.com](https://vercel.com) 里 Import 本仓库（如 `nextjs-vtuber-mocap`），分支选 `main` 或 `ui`。

2. **环境变量**  
   在 Vercel 项目 **Settings → Environment Variables** 里添加：

   | 变量名 | 说明 | 示例 |
   |--------|------|------|
   | `NEXT_PUBLIC_ECHUU_API_URL` | 后端 API 根地址（HTTP/HTTPS） | `https://your-echuu-backend.railway.app` |
   | `NEXT_PUBLIC_ECHUU_WS_URL` | 可选；不填则用 API 地址自动换成 `wss://.../ws` | `wss://your-echuu-backend.railway.app/ws` |

   其他已有变量（PostHog、S3、Neon 的 `DATABASE_URL` 等）按原样保留。

3. **部署**  
   保存变量后 Deploy（或推代码触发）。前端会连你填的后端地址，直播/房间/弹幕都会走该后端。

---

### 三、本地/线上联调

- **只上前端、后端仍在本机**：Vercel 环境变量先不填（或填 `http://localhost:8000` 仅本地预览用），本地跑 `npm run dev` 和 workflow 后端即可。
- **前后端都上线**：先部署后端 → 拿到 HTTPS 地址 → 在前端填 `NEXT_PUBLIC_ECHUU_API_URL`（和可选 `NEXT_PUBLIC_ECHUU_WS_URL`）→ 再部署/重部署前端，然后浏览器访问 Vercel 域名即可“部署上去再调”。

---

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