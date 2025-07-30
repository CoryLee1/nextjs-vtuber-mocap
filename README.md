# 🎭 Next.js VTuber Motion Capture

一个基于 Next.js、Three.js 和 MediaPipe 的实时虚拟形象动作捕捉应用，支持面部表情、手势识别、全身姿态检测和眼球追踪。

![VTuber Motion Capture](https://img.shields.io/badge/Next.js-14.0.4-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![Three.js](https://img.shields.io/badge/Three.js-0.158.0-black?style=for-the-badge&logo=three.js)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Holistic-green?style=for-the-badge)

## ✨ 功能特点

### 🎭 动作捕捉
- **面部表情捕捉** - 实时追踪面部肌肉运动
- **手势识别** - 支持手部动作和手势识别
- **全身姿态检测** - 完整的身体动作捕捉
- **眼球追踪** - 精确的眼球运动追踪
- **平滑动画** - 可调节的动画平滑度设置

### 🤖 VRM 模型支持
- **多模型管理** - 支持多个 VRM 模型切换
- **模型上传** - 支持本地 VRM 文件上传
- **在线模型** - 支持从网络下载 VRM 模型
- **模型预览** - 实时模型预览和选择

### 🎮 控制面板
- **灵敏度调节** - 可调节各种动作的灵敏度
- **动画库** - 预设动画动作库
- **调试面板** - 详细的调试信息显示
- **相机控制** - 相机参数实时调节

### 📱 用户界面
- **响应式设计** - 适配各种屏幕尺寸
- **现代化 UI** - 美观的用户界面
- **实时反馈** - 实时的动作捕捉反馈
- **错误处理** - 完善的错误处理机制

## 🚀 快速开始

### 环境要求
- Node.js 18+ 
- Chrome/Firefox 浏览器（推荐）
- 摄像头设备
- HTTPS 环境或 localhost

### 1. 克隆项目
```bash
git clone https://github.com/your-username/nextjs-vtuber-mocap.git
cd nextjs-vtuber-mocap
```

### 2. 安装依赖
```bash
npm install
```

### 3. 添加 VRM 模型
将你的 VRM 模型文件放入 `public/models/` 目录：
```
public/models/
├── avatar.vrm          # 默认模型
├── anime-girl.vrm      # 可选模型
├── realistic.vrm       # 可选模型
└── custom.vrm         # 自定义模型
```

### 4. 启动开发服务器
```bash
npm run dev
```

### 5. 访问应用
打开浏览器访问 http://localhost:3000

## 📖 使用说明

### 基本操作
1. **启动动捕** - 点击右下角摄像头按钮
2. **调整位置** - 保持距离摄像头 50-100cm
3. **确保光线** - 保持充足的光线条件
4. **避免干扰** - 避免快速移动和复杂背景

### 高级功能
- **模型切换** - 在模型管理面板中切换不同 VRM 模型
- **参数调节** - 在控制面板中调节各种参数
- **动画库** - 使用预设动画动作
- **调试信息** - 查看详细的调试信息

## 🛠️ 技术栈

### 前端框架
- **Next.js 14** - React 全栈框架
- **React 18** - 用户界面库
- **Tailwind CSS** - 样式框架

### 3D 渲染
- **Three.js** - 3D 渲染引擎
- **@react-three/fiber** - React Three.js 集成
- **@react-three/drei** - Three.js 工具库
- **@react-three/postprocessing** - 后处理效果

### 动作捕捉
- **MediaPipe Holistic** - 全身动作捕捉
- **Kalidokit** - 动作数据处理
- **@mediapipe/camera_utils** - 相机工具
- **@mediapipe/drawing_utils** - 绘图工具

### 虚拟形象
- **@pixiv/three-vrm** - VRM 模型支持

### 状态管理
- **Zustand** - 轻量级状态管理
- **Leva** - 调试控制面板

## 📁 项目结构

```
nextjs-vtuber-mocap/
├── public/
│   ├── models/           # VRM 模型文件
│   └── images/          # 图片资源
├── src/
│   ├── components/      # React 组件
│   │   ├── VTuberApp.jsx          # 主应用组件
│   │   ├── VRMAvatar.jsx          # VRM 模型渲染
│   │   ├── ControlPanel.jsx       # 控制面板
│   │   ├── AnimationLibrary.jsx   # 动画库
│   │   ├── ModelManager.jsx       # 模型管理
│   │   ├── CameraWidget.jsx       # 相机组件
│   │   ├── SmoothSettingsPanel.jsx # 平滑设置
│   │   ├── SensitivityPanel.jsx   # 灵敏度设置
│   │   ├── DebugHelpers.jsx       # 调试工具
│   │   ├── HandDebugPanel.jsx     # 手部调试
│   │   ├── ArmTestPanel.jsx       # 手臂测试
│   │   ├── AnimationCard.jsx      # 动画卡片
│   │   ├── ModelCard.jsx          # 模型卡片
│   │   ├── UI.jsx                 # UI 组件
│   │   ├── CameraController.jsx   # 相机控制器
│   │   └── FileUploader.jsx       # 文件上传
│   ├── hooks/          # 自定义 Hooks
│   ├── utils/          # 工具函数
│   ├── pages/          # Next.js 页面
│   └── styles/         # 样式文件
├── jsconfig.json       # 路径别名配置
├── tailwind.config.js  # Tailwind 配置
├── next.config.js      # Next.js 配置
└── package.json        # 项目依赖
```

## 🔧 开发指南

### 添加新功能
1. 在 `src/components/` 中创建新组件
2. 在 `src/hooks/` 中添加自定义 hooks
3. 在 `src/utils/` 中添加工具函数

### 调试模式
项目包含多个调试面板：
- **HandDebugPanel** - 手部动作调试
- **ArmTestPanel** - 手臂动作测试
- **DebugHelpers** - 通用调试工具

### 性能优化
- 使用动态导入避免 SSR 问题
- 优化 Three.js 渲染性能
- 合理使用 React.memo 和 useMemo

## 📦 部署

### Vercel 部署（推荐）
```bash
npm i -g vercel
vercel --prod
```

### 其他平台
```bash
npm run build
npm run start
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [MediaPipe](https://mediapipe.dev/) - 动作捕捉技术
- [Three.js](https://threejs.org/) - 3D 渲染引擎
- [VRM](https://vrm.dev/) - 虚拟形象标准
- [Next.js](https://nextjs.org/) - React 框架

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 加入讨论群

---

⭐ 如果这个项目对你有帮助，请给它一个星标！