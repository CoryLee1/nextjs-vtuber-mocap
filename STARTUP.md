# 🚀 VTuber Motion Capture 启动指南

## 📋 项目概述

这是一个基于 Next.js + Three.js + MediaPipe 的实时虚拟形象动作捕捉应用，支持：
- 🎭 实时面部表情捕捉
- 👋 手势识别和追踪  
- 🤸 全身姿态检测
- 👁️ 眼球追踪
- 🤖 VRM 模型支持

## 🛠️ 环境要求

- Node.js 18+ 
- npm 或 yarn
- 现代浏览器（Chrome/Firefox/Safari）
- 摄像头设备
- HTTPS 环境（生产环境）

## 🚀 快速启动

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问：http://localhost:3000

## 📁 项目结构

```
nextjs-vtuber-mocap/
├── public/
│   ├── models/           # VRM 模型文件
│   │   ├── AvatarSample_A.vrm
│   │   ├── AvatarSample_C.vrm
│   │   ├── AvatarSample_H.vrm
│   │   ├── AvatarSample_M.vrm
│   │   └── AvatarSample_Z.vrm
│   └── images/          # 图片资源
├── src/
│   ├── components/      # React 组件
│   ├── hooks/          # 自定义 Hooks
│   ├── pages/          # Next.js 页面
│   └── styles/         # 样式文件
└── package.json
```

## 🎮 使用说明

### 基本操作
1. **启动应用**：运行 `npm run dev` 并访问 http://localhost:3000
2. **开启摄像头**：点击右下角的摄像头按钮
3. **选择模型**：点击右上角控制面板的"管理"按钮
4. **上传模型**：在模型管理器中可以上传自定义 VRM 文件
5. **下载模型**：可以从在线模型库下载更多模型

### 模型管理
- **默认模型**：项目包含 5 个预设的 VRM 模型
- **上传模型**：支持上传自定义 .vrm 文件（最大 50MB）
- **在线下载**：可以从在线模型库下载更多模型
- **模型切换**：在模型管理器中可以快速切换不同模型

### 性能优化
- 确保光线充足
- 保持面部清晰可见
- 避免快速移动
- 减少背景干扰
- 使用高性能设备

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint
```

## 🐛 常见问题

### 1. 摄像头无法访问
- 确保使用 HTTPS 或 localhost
- 检查浏览器权限设置
- 尝试刷新页面

### 2. 模型加载失败
- 检查 VRM 文件是否损坏
- 确保文件大小不超过 50MB
- 验证文件格式是否正确

### 3. 性能问题
- 关闭其他占用资源的应用
- 降低浏览器缩放比例
- 使用更快的网络连接

## 📦 部署

### Vercel 部署（推荐）
```bash
npm i -g vercel
vercel --prod
```

### 其他平台
项目支持部署到任何支持 Next.js 的平台：
- Netlify
- Railway
- Heroku
- 自建服务器

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [Three.js 文档](https://threejs.org/docs)
- [MediaPipe 文档](https://mediapipe.dev/)
- [VRM 标准](https://vrm.dev/)

## �� 许可证

MIT License 