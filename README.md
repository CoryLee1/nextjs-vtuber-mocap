# 🎭 Next.js VTuber Motion Capture

基于 Next.js、Three.js 和 MediaPipe 的实时虚拟形象动作捕捉应用。

## ✨ 功能特点

- 🎭 实时面部表情捕捉
- 👋 手势识别和追踪
- 🤸 全身姿态检测
- 👁️ 眼球追踪
- 🤖 VRM 模型支持
- 📱 响应式设计
- ⚡ 高性能渲染

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 添加 VRM 模型
将你的 VRM 模型文件放入 `public/models/` 目录：
```
public/models/
├── avatar.vrm          # 默认模型
├── anime-girl.vrm      # 可选模型
└── realistic.vrm       # 可选模型
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 访问应用
打开 http://localhost:3000

## 📱 使用说明

1. 点击右下角摄像头按钮开启动捕
2. 确保光线充足，面部清晰可见
3. 保持距离摄像头 50-100cm
4. 避免快速移动和背景干扰

## 🛠️ 技术栈

- **Next.js 14** - React 框架
- **Three.js** - 3D 渲染引擎
- **MediaPipe** - 动作捕捉
- **VRM** - 虚拟形象标准
- **Tailwind CSS** - 样式框架

## 📦 部署

### Vercel 部署（推荐）
```bash
npm i -g vercel
vercel --prod
```

## ⚠️ 注意事项

- 需要 HTTPS 环境访问摄像头
- 推荐使用 Chrome/Firefox 浏览器
- 建议使用高性能设备

## 📄 许可证

MIT License