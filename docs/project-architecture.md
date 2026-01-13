# 项目架构文档

## 概述

本项目是一个基于 Next.js 14 的 VTuber 实时动作捕捉应用，支持 VRM 模型加载、MediaPipe 动作捕捉、动画管理和相机控制等功能。

## 技术栈

### 核心框架
- **Next.js 14** (App Router) - React 框架，支持 SSR/SSG
- **React 18** - UI 框架
- **TypeScript** - 类型安全

### 3D 渲染
- **Three.js** - 3D 图形库
- **@react-three/fiber** - React 的 Three.js 渲染器
- **@react-three/drei** - Three.js 工具库
- **@pixiv/three-vrm** - VRM 模型支持

### 动作捕捉
- **MediaPipe** - 实时姿态检测
- **Kalidokit** - 动作数据转换

### 状态管理
- **Zustand** - 轻量级状态管理
- **React Context** - 组件间状态共享

### UI 框架
- **Tailwind CSS** - 样式框架
- **shadcn/ui** - UI 组件库
- **Radix UI** - 无障碍组件基础

### 国际化
- **next-intl** - 多语言支持

### 分析追踪
- **PostHog** - 产品分析

### 支付
- **Stripe** - 支付处理

### 存储
- **AWS S3** - 资源存储

## 项目结构

```
nextjs-vtuber-mocap/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── [locale]/             # 国际化路由
│   │   │   ├── layout.tsx        # 国际化布局（集成所有 Providers）
│   │   │   ├── page.tsx          # 主页面
│   │   │   └── api/              # API 路由
│   │   │       └── s3/           # S3 相关 API
│   │   ├── api/                  # 服务端 API
│   │   │   ├── s3/               # S3 上传/下载
│   │   │   ├── stripe/           # Stripe 支付
│   │   │   └── debug-env/        # 环境调试
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 根页面
│   │   └── globals.css            # 全局样式
│   │
│   ├── components/                # React 组件
│   │   ├── canvas/               # 3D 画布相关
│   │   │   ├── SceneManager.tsx  # 场景管理器
│   │   │   └── scenes/           # 场景定义
│   │   │       └── MainScene.tsx # 主场景
│   │   │
│   │   ├── dressing-room/        # 核心功能组件
│   │   │   ├── VTuberApp.tsx     # 主应用组件（集成所有功能）
│   │   │   ├── VTuberLayout.tsx  # 布局组件
│   │   │   ├── VTuberControls.tsx # 控制逻辑
│   │   │   ├── VRMAvatar.tsx     # VRM 模型组件
│   │   │   ├── VRMAnimator.tsx  # VRM 动画器
│   │   │   ├── VRMLoader.tsx     # VRM 加载器
│   │   │   ├── CameraController.tsx # 相机控制器
│   │   │   ├── CameraWidget.tsx  # 相机组件
│   │   │   ├── MediaPipeProcessor.tsx # MediaPipe 处理器
│   │   │   ├── ControlPanel.tsx  # 控制面板
│   │   │   ├── DraggablePanel.tsx # 可拖拽面板
│   │   │   └── DebugHelpers.tsx  # 调试工具
│   │   │
│   │   ├── vtuber/               # VTuber 相关组件
│   │   │   ├── ModelManager.tsx  # 模型管理器
│   │   │   ├── AnimationLibrary.tsx # 动画库
│   │   │   └── ResourceSelector.tsx # 资源选择器
│   │   │
│   │   ├── ui/                   # UI 组件库
│   │   │   ├── button.tsx        # 按钮
│   │   │   ├── dialog.tsx         # 对话框
│   │   │   ├── card.tsx          # 卡片
│   │   │   ├── LoadingPage.tsx   # 加载页面
│   │   │   ├── OnboardingGuide.tsx # 新手引导
│   │   │   └── ...               # 其他 UI 组件
│   │   │
│   │   ├── tracking/             # 追踪相关
│   │   │   ├── PostHogProvider.tsx # PostHog 提供者
│   │   │   ├── PageTracker.tsx   # 页面追踪
│   │   │   └── ...               # 其他追踪组件
│   │   │
│   │   ├── settings/             # 设置相关
│   │   │   └── SettingsPanel.tsx # 设置面板
│   │   │
│   │   ├── payment/              # 支付相关
│   │   │   └── SubscriptionButton.tsx # 订阅按钮
│   │   │
│   │   └── debug/                # 调试工具
│   │       └── DataFlowDebugPanel.tsx # 数据流调试面板
│   │
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── use-scene-store.ts    # 场景状态管理（Zustand）
│   │   ├── use-animation-library.ts # 动画库 Hook
│   │   ├── use-model-manager.ts   # 模型管理 Hook
│   │   ├── use-video-recognition.ts # 视频识别 Hook
│   │   ├── use-i18n.ts           # 国际化 Hook
│   │   ├── use-tracking.ts       # 追踪 Hook
│   │   ├── use-kpi-tracking.ts   # KPI 追踪 Hook
│   │   ├── use-performance.ts   # 性能监控 Hook
│   │   ├── use-sensitivity-settings.ts # 灵敏度设置 Hook
│   │   ├── use-shortcuts.ts      # 快捷键 Hook
│   │   ├── use-theme.ts          # 主题 Hook
│   │   └── use-toast.ts          # 提示 Hook
│   │
│   ├── lib/                       # 工具库
│   │   ├── animation-manager.ts  # 动画管理器（核心）
│   │   ├── animation-storage.ts  # 动画存储
│   │   ├── resource-manager.ts   # 资源管理器
│   │   ├── s3-resource-manager.ts # S3 资源管理
│   │   ├── s3-uploader.ts        # S3 上传器
│   │   ├── arm-calculator.ts     # 手臂计算器
│   │   ├── config-manager.ts     # 配置管理器
│   │   ├── constants.ts          # 常量定义
│   │   ├── data-flow-monitor.ts  # 数据流监控
│   │   ├── kpi-tracking.ts       # KPI 追踪
│   │   ├── posthog-init.ts       # PostHog 初始化
│   │   ├── posthog.ts            # PostHog 配置
│   │   ├── stripe-client.ts      # Stripe 客户端
│   │   ├── stripe-config.ts      # Stripe 配置
│   │   └── utils.ts               # 通用工具函数
│   │
│   ├── providers/                 # Context Providers
│   │   ├── Canvas3DProvider.tsx  # 3D 画布提供者
│   │   └── ThemeProvider.tsx     # 主题提供者
│   │
│   ├── types/                     # TypeScript 类型定义
│   │   ├── index.ts              # 通用类型
│   │   ├── vtuber.ts             # VTuber 相关类型
│   │   ├── api.ts                # API 类型
│   │   └── config.ts             # 配置类型
│   │
│   ├── i18n/                      # 国际化配置
│   │   ├── config.ts             # i18n 配置
│   │   └── request.ts            # 请求处理
│   │
│   └── messages/                  # 多语言消息
│       ├── en.json               # 英文
│       ├── zh.json               # 中文
│       ├── ja.json               # 日文
│       └── template.json         # 模板
│
├── public/                        # 静态资源
│   ├── models/                    # 3D 模型
│   │   └── animations/            # 动画文件
│   └── images/                    # 图片资源
│
├── docs/                          # 文档目录
│   ├── project-architecture.md   # 项目架构（本文档）
│   ├── data-flow-architecture.md # 数据流架构
│   └── ...                       # 其他文档
│
├── scripts/                       # 脚本文件
│   ├── align-i18n.js            # i18n 对齐脚本
│   └── check-i18n.js            # i18n 检查脚本
│
├── middleware.ts                  # Next.js 中间件（路由处理）
├── next.config.js                 # Next.js 配置
├── tailwind.config.js             # Tailwind 配置
├── tsconfig.json                  # TypeScript 配置
└── package.json                   # 项目依赖

```

## 核心架构

### 1. 应用启动流程

```
1. 用户访问页面
   ↓
2. middleware.ts 处理路由和国际化
   ↓
3. app/layout.tsx 根布局加载
   ↓
4. app/[locale]/layout.tsx 国际化布局
   ├── NextIntlClientProvider (国际化)
   ├── PostHogProvider (分析追踪)
   ├── ThemeProvider (主题)
   └── Canvas3DProvider (3D 画布)
   ↓
5. app/[locale]/page.tsx 主页面
   ├── LoadingPage (加载页面，3秒)
   └── OnboardingGuide (新手引导)
   ↓
6. VTuberApp 动态加载
   ├── VTuberLayout (布局)
   ├── SceneManager (场景管理)
   ├── CameraWidget (相机)
   ├── ModelManager (模型管理)
   ├── AnimationLibrary (动画库)
   └── SettingsPanel (设置面板)
```

### 2. 状态管理架构

#### Zustand Store (`use-scene-store.ts`)
- **vrmModel**: 当前 VRM 模型实例
- **vrmModelUrl**: 当前模型 URL
- **animationUrl**: 当前动画 URL
- **scene**: 当前场景类型
- **cameraSettings**: 相机设置
- **debugSettings**: 调试设置
- **animationManagerRef**: 动画管理器引用
- **handDetectionStateRef**: 手部检测状态引用

#### React Context
- **Canvas3DProvider**: 3D 画布上下文
- **ThemeProvider**: 主题上下文

### 3. 3D 渲染架构

```
Canvas3DProvider
  └── Canvas (react-three/fiber)
      └── SceneManager
          └── MainScene
              ├── VRMAvatar (VRM 模型)
              ├── CameraController (相机控制)
              ├── Lighting (光照)
              └── Environment (环境)
```

### 4. 动作捕捉数据流

```
摄像头输入
  ↓
CameraWidget (获取视频流)
  ↓
MediaPipeProcessor (MediaPipe 处理)
  ├── 面部检测
  ├── 身体姿态检测
  └── 手部检测
  ↓
Kalidokit (数据转换)
  ├── 面部表情数据
  ├── 身体姿态数据
  └── 手部姿态数据
  ↓
VRMAvatar (应用到 VRM 模型)
  ├── 更新面部表情
  ├── 更新身体姿态
  └── 更新手部姿态
```

### 5. 动画管理架构

```
AnimationLibrary (UI 组件)
  ↓
use-animation-library (Hook)
  ↓
animation-manager.ts (核心管理器)
  ├── AnimationMixer (Three.js 动画混合器)
  ├── AnimationClip (动画片段)
  ├── 动画加载 (FBX)
  ├── 动画重映射 (Mixamo → VRM)
  └── 动画播放控制
  ↓
VRMAvatar (应用到模型)
```

### 6. 相机控制架构

```
CameraController.tsx
  ├── 球坐标系统 (spherical coordinates)
  ├── 鼠标控制 (旋转、平移)
  ├── 滚轮控制 (缩放)
  ├── 触摸控制 (移动设备)
  ├── 阻尼和惯性
  └── 自动跟随 (VRM 头部骨骼)
```

### 7. 资源管理架构

```
ResourceSelector (UI)
  ↓
use-model-manager (Hook)
  ↓
resource-manager.ts
  ├── 本地资源管理
  └── S3 资源管理
      ├── s3-resource-manager.ts
      └── s3-uploader.ts
```

## 关键组件说明

### VTuberApp.tsx
**职责**: 集成所有功能组件的主应用组件
- 管理整体布局
- 协调各功能模块
- 处理全局状态

### VRMAvatar.tsx
**职责**: VRM 模型的渲染和动作应用
- 加载 VRM 模型
- 应用 MediaPipe 动作数据
- 管理模型生命周期
- 处理动画切换

### CameraController.tsx
**职责**: 3D 场景的相机控制
- 球坐标相机系统
- 用户交互处理
- 自动跟随 VRM 头部
- 平滑的相机移动

### animation-manager.ts
**职责**: 动画的加载、管理和播放
- FBX 动画加载
- Mixamo 到 VRM 的重映射
- AnimationMixer 管理
- 动画切换和混合

### MediaPipeProcessor.tsx
**职责**: MediaPipe 动作捕捉处理
- 摄像头视频流处理
- MediaPipe 姿态检测
- 数据格式转换
- 性能优化

## 数据流

### 状态更新流程

```
用户操作
  ↓
VTuberControls (验证和状态管理)
  ↓
use-scene-store (Zustand Store)
  ↓
相关组件自动更新
  ↓
数据流监控 (data-flow-monitor.ts)
```

### 动作捕捉数据流

```
摄像头 → MediaPipe → Kalidokit → VRMAvatar → Three.js 渲染
```

### 动画切换流程

```
用户选择动画
  ↓
AnimationLibrary → use-animation-library
  ↓
animation-manager.ts
  ├── 加载 FBX
  ├── 重映射骨骼
  └── 创建 AnimationClip
  ↓
AnimationMixer 播放
  ↓
VRMAvatar 应用动画
```

## 性能优化

### 1. 代码分割
- 使用 Next.js 动态导入 (`dynamic`)
- 按需加载 3D 组件

### 2. 资源优化
- VRM 模型缓存
- 动画文件缓存
- 图片懒加载

### 3. 渲染优化
- React Three Fiber 的自动批处理
- 使用 `useFrame` 优化动画循环
- 相机控制使用阻尼和节流

### 4. 内存管理
- 正确释放 Three.js 资源
- 清理 AnimationMixer
- 模型切换时释放旧资源

## 错误处理

### 1. 资源加载错误
- 模型加载失败处理
- 动画加载失败处理
- 网络错误重试

### 2. 动作捕捉错误
- 摄像头权限被拒绝
- MediaPipe 初始化失败
- 数据格式错误

### 3. 3D 渲染错误
- WebGL 不支持
- 内存不足
- 渲染错误恢复

## 开发规范

### 1. 文件命名
- 组件文件: PascalCase (如 `VTuberApp.tsx`)
- Hook 文件: camelCase with `use-` prefix (如 `use-scene-store.ts`)
- 工具文件: kebab-case (如 `animation-manager.ts`)

### 2. 代码组织
- 组件按功能分组到不同文件夹
- 共享逻辑提取到 `lib/` 或 `hooks/`
- 类型定义统一放在 `types/`

### 3. 状态管理
- 全局状态使用 Zustand (`use-scene-store.ts`)
- 组件状态使用 React `useState`
- 共享状态使用 Context

### 4. 3D 开发
- 使用 React Three Fiber 的声明式 API
- 资源清理在 `useEffect` 的清理函数中
- 使用 `useFrame` 处理动画循环

## 扩展指南

### 添加新功能
1. 在 `components/` 创建新组件
2. 如需状态管理，更新 `use-scene-store.ts`
3. 如需工具函数，在 `lib/` 创建
4. 更新类型定义在 `types/`

### 添加新动画
1. 将 FBX 文件上传到 S3
2. 在 `AnimationLibrary` 中添加选项
3. 动画会自动加载和重映射

### 添加新模型
1. 将 VRM 文件上传到 S3 或放在 `public/models/`
2. 在 `ModelManager` 中添加选项
3. 模型会自动加载和缓存

## 部署架构

### 构建流程
```
npm run build
  ↓
Next.js 构建
  ├── 静态页面生成
  ├── API 路由编译
  └── 资源优化
  ↓
.next/ 输出目录
```

### 环境变量
- `NEXT_PUBLIC_*`: 客户端环境变量
- `AWS_*`: AWS S3 配置
- `STRIPE_*`: Stripe 配置
- `POSTHOG_*`: PostHog 配置

## 总结

本项目采用模块化架构，核心功能清晰分离：
- **3D 渲染**: React Three Fiber + Three.js
- **动作捕捉**: MediaPipe + Kalidokit
- **状态管理**: Zustand + React Context
- **资源管理**: S3 + 本地缓存
- **UI 框架**: Tailwind CSS + shadcn/ui

各模块通过清晰的接口和状态管理进行通信，确保代码的可维护性和可扩展性。





