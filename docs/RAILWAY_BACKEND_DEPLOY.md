# 后端一步步部署（Railway）

按下面顺序做，大约 5 分钟能把 Echuu workflow 后端部署到 Railway。

---

## 第一步：准备 Railway 账号与项目

1. 打开 [railway.app](https://railway.app)，用 GitHub 登录。
2. 点击 **「New Project」**。
3. 选 **「Deploy from GitHub repo」**，授权 Railway 访问你的 GitHub（若未授权）。
4. 选择你这个仓库（例如 `nextjs-vtuber-mocap`），选要部署的分支（如 `main` 或 `ui`）。

---

## 第二步：用 Dockerfile 部署（不要用 Nixpacks）

创建完项目后，Railway 可能自动识别成别的运行时，需要改成用我们的 Dockerfile。

**推荐（与主仓库同步、不依赖子模块）：**

1. 在项目里点进 **你的服务**（那一个部署出来的 Service）。
2. 打开 **「Settings」** 标签。
3. 找到 **「Build」** 区域：
   - **Builder**：选 **「Dockerfile」**（不要用 Nixpacks）。
   - **Root Directory**：填 **`deploy/echuu-backend`**（用主仓库内已同步的副本，含 TTS 等修复）。
   - **Dockerfile Path**：填 **`Dockerfile`**（或留空，默认即 Root 下的 Dockerfile）。
4. 找到 **「Deploy」** 区域：
   - **Start Command**：留空即可（镜像里已写死 `uvicorn app:app ...`）。
5. 点 **「Deploy」** 或等自动重新部署。

**备选（用 echuu-agent 子模块）：**

- **Root Directory**：留空。
- **Dockerfile Path**：`echuu-agent/workflow/backend/Dockerfile`。  
  需确保克隆时带子模块（或子模块内含 `public/`），否则构建会缺文件。

---

## 第三步：配环境变量

1. 在同一个服务的 **「Variables」** 标签里添加变量（名称和值按你本地 `.env` 来）：

   | 变量名 | 说明 | 示例/备注 |
   |--------|------|-----------|
   | `DASHSCOPE_API_KEY` | 通义千问 TTS（必填） | 阿里云百炼 API Key |
   | `GEMINI_API_KEY` | Gemini 模型（若用 Gemini） | 可选 |
   | `GEMINI_MODEL` | 模型名 | 如 `gemini-3-flash-preview` |
   | `ANTHROPIC_API_KEY` | Claude（若用 Claude） | 可选 |
   | `TTS_VOICE` | 默认 TTS 音色 | 如 `Cherry`，可选 |

2. 至少填 **`DASHSCOPE_API_KEY`**，否则 TTS 会报错。LLM 用哪个就填哪个的 key。
3. 保存后 Railway 会重新部署一次。

---

## 第四步：拿到公网地址（HTTPS）

1. 在服务里打开 **「Settings」**，找到 **「Networking」** 或 **「Public Networking」**。
2. 点击 **「Generate Domain」**，会得到一个域名，例如：  
   `xxx.up.railway.app`
3. 记下完整地址：**`https://xxx.up.railway.app`**（一定要用 `https://`，前端才能在同一页面里连 WebSocket）。

---

## 第五步：验证后端是否正常

在浏览器或终端里访问：

- 健康检查（若有）：`https://你的域名/` 或 `https://你的域名/docs`
- FastAPI 文档：`https://你的域名/docs`

能打开文档页就说明后端已跑起来。接下来在前端（Vercel）里把 **环境变量** 设成这个地址即可：

- `NEXT_PUBLIC_ECHUU_API_URL` = `https://你的域名`
- （可选）`NEXT_PUBLIC_ECHUU_WS_URL` = `wss://你的域名/ws`

---

## 常见问题

**Q：构建失败，提示找不到 `echuu-agent/...` 或缺少 `public/`？**  
A：改用 **Root Directory** = `deploy/echuu-backend`、**Dockerfile Path** = `Dockerfile`，这样不依赖子模块，直接用主仓库内已同步的代码。

**Q：运行时报错 `ModuleNotFoundError: No module named 'echuu'`？**  
A：镜像里已设 `PYTHONPATH=/app/public`，若仍报错，检查 Railway 是否用了我们提供的 Dockerfile 构建（Settings → Build → Builder = Dockerfile）。

**Q：想用 Render 而不是 Railway？**  
A：在 Render 里新建 **Web Service**，连接同一 GitHub 仓库，构建命令选 **Docker**，Dockerfile 路径填 `echuu-agent/workflow/backend/Dockerfile`，构建上下文选仓库根；环境变量和「生成域名」在 Render 里同样配置即可。
