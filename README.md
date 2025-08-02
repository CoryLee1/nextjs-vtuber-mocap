# 🎭 VTuber Motion Capture Demo

一个基于 Next.js + Three.js + MediaPipe 的实时 VTuber 动作捕捉演示项目，支持 VRM 模型驱动、面部表情同步、手势识别和动画切换。

## ✨ 核心功能

**一句话总结：** 这是一个完整的 VTuber 动捕系统，通过摄像头实时捕捉用户的面部表情、身体姿态和手势动作，驱动 VRM 虚拟角色进行同步表演，支持多种动画切换和云端资源管理。

## 🚀 主要特性

### 🎯 实时动作捕捉
- **面部表情同步** - 实时捕捉面部表情，同步到 VRM 模型
- **身体姿态追踪** - 捕捉上半身动作，驱动角色手臂和躯干
- **手势识别** - 识别手部动作，控制角色手指和手部
- **眨眼检测** - 自动检测眨眼动作，同步到角色眼睛

### 🎨 VRM 模型支持
- **多模型切换** - 支持多个 VRM 模型，可实时切换
- **云端资源管理** - 模型和动画文件存储在 AWS S3，快速加载
- **模型上传** - 支持上传自定义 VRM 模型到云端

### 🎬 动画系统
- **预制动画** - 内置多种动画，支持待机、舞蹈等
- **动画切换** - 实时切换不同动画，支持平滑过渡
- **动画上传** - 支持上传自定义 FBX 动画文件
- **云端存储** - 动画文件存储在 S3，支持 CDN 加速

### 🎛️ 控制面板
- **灵敏度调节** - 可调节动作捕捉的灵敏度
- **坐标轴调整** - 支持调整各部位动作的坐标轴映射
- **相机控制** - 支持自动跟踪和手动控制相机视角
- **调试工具** - 提供骨骼可视化、数据面板等调试功能

### ☁️ 云端集成
- **AWS S3 存储** - 模型和动画文件存储在 S3
- **预签名上传** - 支持安全的文件上传到 S3
- **CDN 加速** - 通过 S3 提供全球 CDN 加速
- **环境变量管理** - 安全的 AWS 凭证管理

## 🛠️ 技术栈

### 前端框架
- **Next.js 14** - React 全栈框架
- **React 18** - 用户界面库
- **TypeScript** - 类型安全

### 3D 渲染
- **Three.js** - 3D 图形库
- **@react-three/fiber** - React Three.js 集成
- **@react-three/drei** - Three.js 工具库
- **@pixiv/three-vrm** - VRM 模型支持

### 动作捕捉
- **MediaPipe** - Google 动作捕捉库
- **Kalidokit** - 动作数据解析
- **@mediapipe/holistic** - 全身动作捕捉
- **@mediapipe/camera_utils** - 相机工具

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Hooks** - 组件状态管理

### 云端服务
- **AWS S3** - 文件存储
- **AWS SDK** - AWS 服务集成
- **Vercel** - 部署平台

## 📦 安装和运行

### 环境要求
- Node.js 18+ 
- npm 或 yarn
- 摄像头设备

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env.local` 文件：
```env
# AWS S3 配置
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# S3 配置
NEXT_PUBLIC_S3_BUCKET=your-bucket-name
NEXT_PUBLIC_S3_REGION=us-east-2
```

### 开发模式
```bash
npm run dev
```
访问 http://localhost:3000

### 生产构建
```bash
npm run build
npm start
```

## 🚀 部署

### Vercel 部署（推荐）

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
vercel
```

4. **设置环境变量**
在 Vercel 控制台设置以下环境变量：
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_S3_BUCKET`
- `NEXT_PUBLIC_S3_REGION`

### 其他部署方式
- **Netlify** - 支持 Next.js 静态导出
- **AWS Amplify** - AWS 全栈部署
- **Docker** - 容器化部署

## 📁 项目结构

```
src/
├── components/          # React 组件
│   ├── CameraWidget.jsx    # 相机控制
│   ├── VRMAvatar.jsx       # VRM 模型渲染
│   ├── ModelManager.jsx    # 模型管理
│   ├── AnimationLibrary.jsx # 动画库
│   └── ...
├── hooks/              # 自定义 Hooks
│   ├── useVideoRecognition.js
│   ├── useModelManager.js
│   └── ...
├── utils/              # 工具函数
│   ├── resourceManager.js   # 资源管理
│   ├── animationManager.js  # 动画管理
│   ├── s3Uploader.js       # S3 上传
│   └── ...
├── pages/              # Next.js 页面
│   ├── api/            # API 路由
│   └── ...
└── styles/             # 样式文件
```

## 🎮 使用指南

### 1. 启动应用
- 打开浏览器访问应用
- 点击"开启摄像头"按钮
- 允许摄像头权限

### 2. 选择模型
- 点击"模型管理"按钮
- 从云端模型列表中选择
- 或上传自定义 VRM 模型

### 3. 选择动画
- 点击"动画库"按钮
- 选择预制动画或上传自定义动画
- 支持实时切换动画

### 4. 动作捕捉
- 确保摄像头正常工作
- 面对摄像头进行动作
- 角色会实时跟随你的动作

### 5. 调整设置
- 使用控制面板调整灵敏度
- 调整坐标轴映射
- 开启/关闭调试功能

## 🔧 配置说明

### AWS S3 配置
1. 创建 S3 存储桶
2. 设置公共读取权限
3. 配置 CORS 规则
4. 上传模型和动画文件

### 环境变量
```env
# AWS 凭证
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# S3 配置
NEXT_PUBLIC_S3_BUCKET=your-bucket
NEXT_PUBLIC_S3_REGION=us-east-2
```

## 🐛 故障排除

### 常见问题

1. **摄像头无法启动**
   - 检查浏览器权限设置
   - 确保摄像头未被其他应用占用
   - 尝试刷新页面

2. **模型加载失败**
   - 检查网络连接
   - 确认 S3 文件存在
   - 检查 AWS 凭证配置

3. **动作捕捉不准确**
   - 调整摄像头位置
   - 确保光线充足
   - 调整灵敏度设置

4. **性能问题**
   - 关闭不必要的浏览器标签
   - 降低摄像头分辨率
   - 关闭调试功能

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- [MediaPipe](https://mediapipe.dev/) - 动作捕捉技术
- [Three.js](https://threejs.org/) - 3D 图形库
- [VRM](https://vrm.dev/) - VRM 模型格式
- [Kalidokit](https://github.com/yeemachine/kalidokit) - 动作数据解析
- [Vercel](https://vercel.com/) - 部署平台

## 📞 联系方式

- 项目地址：https://github.com/your-username/nextjs-vtuber-mocap
- 问题反馈：https://github.com/your-username/nextjs-vtuber-mocap/issues

---

**🎯 一句话总结：** 这是一个完整的 VTuber 动捕系统，通过摄像头实时捕捉用户的面部表情、身体姿态和手势动作，驱动 VRM 虚拟角色进行同步表演，支持多种动画切换和云端资源管理。