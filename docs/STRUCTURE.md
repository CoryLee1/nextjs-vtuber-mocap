📐 整体架构 Mental Model

## 📁 实际文件结构

```
nextjs-vtuber-mocap/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── [locale]/                 # 国际化路由
│   │   │   ├── api/
│   │   │   │   └── s3/
│   │   │   │       └── presigned-url/
│   │   │   │           └── route.ts
│   │   │   ├── kpi-dashboard/        # KPI 仪表板
│   │   │   ├── layout.tsx            # 国际化布局
│   │   │   └── page.tsx              # 主页面
│   │   ├── api/                      # API 路由
│   │   │   ├── debug-env/
│   │   │   │   └── route.ts
│   │   │   ├── s3/
│   │   │   │   ├── presigned-url/
│   │   │   │   │   └── route.ts
│   │   │   │   ├── resources/
│   │   │   │   │   └── route.ts
│   │   │   │   └── upload/
│   │   │   │       └── route.ts
│   │   │   └── stripe/
│   │   │       ├── create-payment-intent/
│   │   │       │   └── route.ts
│   │   │       └── create-subscription/
│   │   │           └── route.ts
│   │   ├── subscription/             # 订阅页面
│   │   │   └── page.tsx
│   │   ├── globals.css               # 全局样式
│   │   ├── layout.tsx                # 根布局
│   │   └── page.tsx                  # 根页面
│   │
│   ├── blocks/                       # 动画块组件
│   │   └── Animations/
│   │       └── PixelTrail/
│   │           └── PixelTrail.tsx
│   │
│   ├── components/                    # React 组件
│   │   ├── debug/                    # 调试组件
│   │   │   └── DataFlowDebugPanel.tsx
│   │   ├── dressing-room/           # 核心动捕组件
│   │   │   ├── ArmDebugPanel.jsx
│   │   │   ├── CameraController.tsx
│   │   │   ├── CameraWidget.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── DebugHelpers.tsx
│   │   │   ├── DraggablePanel.tsx
│   │   │   ├── HandDebugPanel.tsx
│   │   │   ├── MediaPipeProcessor.tsx
│   │   │   ├── VRMAnimator.tsx
│   │   │   ├── VRMAvatar.tsx
│   │   │   ├── VRMLoader.tsx
│   │   │   ├── VTuberApp.tsx
│   │   │   ├── VTuberControls.tsx
│   │   │   ├── VTuberLayout.tsx
│   │   │   └── VTuberScene.tsx
│   │   ├── payment/                  # 支付组件
│   │   │   └── SubscriptionButton.tsx
│   │   ├── settings/                 # 设置组件
│   │   │   └── SettingsPanel.tsx
│   │   ├── tracking/                 # 追踪组件
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── ConsentManager.tsx
│   │   │   ├── InternationalizationTracker.tsx
│   │   │   ├── KPIDashboard.tsx
│   │   │   ├── PageTracker.tsx
│   │   │   ├── PostHogProvider.tsx
│   │   │   └── TrackingExample.tsx
│   │   ├── ui/                       # UI 组件库
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── language-switcher.tsx
│   │   │   ├── LoadingPage.tsx
│   │   │   ├── OnboardingGuide.tsx
│   │   │   ├── select.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── toast.tsx
│   │   │   └── toaster.tsx
│   │   └── vtuber/                   # VTuber 相关组件
│   │       ├── AnimationLibrary.tsx
│   │       ├── ModelManager.tsx
│   │       └── ResourceSelector.tsx
│   │
│   ├── hooks/                        # 自定义 Hooks
│   │   ├── use-animation-library.ts
│   │   ├── use-button-tracking.ts
│   │   ├── use-i18n.ts
│   │   ├── use-kpi-tracking.ts
│   │   ├── use-model-manager.ts
│   │   ├── use-performance.ts
│   │   ├── use-sensitivity-settings.ts
│   │   ├── use-shortcuts.ts
│   │   ├── use-theme.ts
│   │   ├── use-toast.ts
│   │   ├── use-tracking.ts
│   │   └── use-video-recognition.ts
│   │
│   ├── i18n/                         # 国际化配置
│   │   ├── config.ts
│   │   └── request.ts
│   │
│   ├── lib/                          # 工具库
│   │   ├── animation-manager.ts
│   │   ├── animation-storage.ts
│   │   ├── arm-calculator.ts
│   │   ├── config-manager.ts
│   │   ├── constants.ts
│   │   ├── data-flow-monitor.ts
│   │   ├── kpi-tracking.ts
│   │   ├── posthog-init.ts
│   │   ├── posthog.ts
│   │   ├── resource-manager.ts
│   │   ├── s3-resource-manager.ts
│   │   ├── s3-uploader.ts
│   │   ├── stripe-client.ts
│   │   ├── stripe-config.ts
│   │   └── utils.ts
│   │
│   ├── messages/                     # 国际化语言包
│   │   ├── en.json                   # 英文
│   │   ├── ja.json                   # 日文
│   │   ├── template.json             # 模板
│   │   └── zh.json                   # 中文
│   │
│   ├── providers/                    # Context Providers
│   │   └── ThemeProvider.tsx
│   │
│   ├── styles/                       # 样式文件
│   │   └── globals.css
│   │
│   └── types/                        # TypeScript 类型定义
│       ├── api.ts
│       ├── config.ts
│       ├── index.ts
│       └── vtuber.ts
│
├── public/                           # 静态资源
│   ├── images/                       # 图片资源
│   ├── models/                      # 3D 模型资源
│   └── project-resources/            # 项目资源
│
├── scripts/                         # 维护脚本
│   ├── align-i18n.js                # 对齐国际化文件
│   └── check-i18n.js                # 检查国际化文件
│
├── docs/                            # 文档目录
│   ├── data-flow-architecture.md
│   ├── migration-cleanup-summary.md
│   └── phase-6-summary.md
│
├── middleware.ts                     # Next.js 中间件
├── next.config.js                   # Next.js 配置
├── package.json                     # 项目依赖
├── tailwind.config.js              # Tailwind 配置
├── tsconfig.json                    # TypeScript 配置
└── PERFORMANCE_AND_MAINTENANCE.md   # 性能与维护文档
```

---

🏗️ 第一层：核心目录与职责概览
1. 应用入口层 (src/app/)
职责：Next.js App Router 路由与页面组织
layout.tsx - 根布局（HTML 结构、元数据）
[locale]/layout.tsx - 国际化布局（Provider 集成）
[locale]/page.tsx - 主页面（加载流程控制）
api/ - API 路由（S3、Stripe、调试端点）
2. 核心功能层 (src/components/dressing-room/)
职责：动捕核心功能实现
VTuberApp.tsx - 应用集成中心
VTuberScene.tsx - 3D 场景容器
VRMAvatar.tsx - VRM 模型渲染与动捕应用
CameraWidget.tsx - 摄像头输入与 MediaPipe 处理
VTuberControls.tsx - 状态与流程控制
VTuberLayout.tsx - UI 布局管理
3. UI 组件层 (src/components/ui/)
职责：可复用 UI 组件库
基础组件（Button、Card、Dialog 等）
LoadingPage.tsx - 加载页面
OnboardingGuide.tsx - 新手引导
4. 业务功能层 (src/components/)
职责：业务功能模块
vtuber/ - 模型与动画管理
settings/ - 设置面板
tracking/ - 分析与追踪
payment/ - 支付集成
debug/ - 调试工具
5. 状态管理层 (src/hooks/)
职责：全局状态与业务逻辑封装
use-video-recognition.ts - 视频识别状态（Zustand）
use-model-manager.ts - 模型管理状态
use-animation-library.ts - 动画库状态
use-sensitivity-settings.ts - 灵敏度设置
use-theme.ts - 主题管理
use-tracking.ts - 追踪逻辑
6. 工具库层 (src/lib/)
职责：核心业务逻辑与工具函数
constants.ts - 全局配置常量
data-flow-monitor.ts - 数据流监控
animation-manager.ts - 动画管理
s3-uploader.ts / s3-resource-manager.ts - S3 资源管理
stripe-client.ts / stripe-config.ts - Stripe 集成
posthog.ts / posthog-init.ts - 分析追踪
kpi-tracking.ts - KPI 追踪
7. 类型定义层 (src/types/)
职责：TypeScript 类型系统
vtuber.ts - 动捕相关类型
api.ts - API 接口类型
config.ts - 配置类型
8. 国际化层 (src/i18n/ + src/messages/)
职责：多语言支持
config.ts - 国际化配置
request.ts - 消息请求处理
messages/*.json - 语言包
🔍 第二层：模块深入分析
📦 模块 1：应用启动与初始化流程
启动顺序：
1. Root Layout (layout.tsx)   └─> 设置 HTML 结构、字体、元数据   2. Locale Layout ([locale]/layout.tsx)   └─> 集成 Provider 链：       ├─> NextIntlClientProvider (国际化)       ├─> PostHogProvider (分析追踪)       ├─> ThemeProvider (主题管理)       └─> InternationalizationTracker (语言追踪)   3. Home Page ([locale]/page.tsx)   └─> 控制加载流程：       ├─> LoadingPage (3秒加载动画)       ├─> OnboardingGuide (新手引导，每次刷新显示)       └─> VTuberApp (主应用，动态加载)
📦 模块 2：动捕数据流管道
数据流向：
摄像头输入    ↓CameraWidget (摄像头组件)    ├─> 获取视频流    ├─> MediaPipe Holistic 初始化    └─> 实时处理视频帧        ↓MediaPipe 处理    ├─> 面部关键点检测 (468个点)    ├─> 身体姿态检测 (33个点)    └─> 手部检测 (左右手各21个点)        ↓数据转换层    ├─> Kalidokit (Face.solve, Pose.solve, Hand.solve)    ├─> 坐标轴映射转换    └─> 数据平滑处理        ↓VRM 模型应用    └─> VRMAvatar 组件        ├─> 面部表情映射 (VRM Expression)        ├─> 骨骼旋转应用 (Bone Rotation)        └─> 手部姿态映射 (Hand Pose)            ↓Three.js 渲染    └─> 实时 3D 渲染更新
状态管理链路：
useVideoRecognition (Zustand Store)    ├─> videoElement: HTMLVideoElement | null    ├─> resultsCallback: 结果回调函数    ├─> isCameraActive: 摄像头状态    ├─> isProcessing: 处理状态    └─> error: 错误信息        ↓ (数据传递)    VRMAvatar.resultsCallback    └─> 接收 MediaPipe 结果        ├─> 验证数据完整性        ├─> 应用坐标轴转换        └─> 更新 VRM 模型
📦 模块 3：3D 场景渲染架构
场景层次：
VTuberScene (场景容器)    ├─> Canvas (Three.js 渲染器)    │   ├─> Camera (相机控制)    │   ├─> Lighting (光照系统)    │   └─> Environment (环境设置)    │    └─> VRMAvatar (VRM 模型)        ├─> VRMLoader (模型加载)        ├─> VRMAnimator (动画控制)        └─> 实时动捕更新            ├─> 面部表情            ├─> 身体姿态            └─> 手部动作
资源管理：
ModelManager (模型管理器)    ├─> 本地模型选择    ├─> S3 模型加载    └─> 模型状态管理    AnimationLibrary (动画库)    ├─> FBX 动画加载    ├─> Mixamo 动画支持    └─> 动画播放控制
📦 模块 4：调试与开发工具系统
调试工具链：
DataFlowDebugPanel (数据流调试面板)    ├─> 性能监控    │   ├─> 平均处理时间    │   ├─> 事件频率    │   └─> 错误率    │    ├─> 时序验证    │   ├─> 操作序列记录    │   └─> 状态转换验证    │    └─> 事件历史        └─> 最近 1000 个事件ArmDebugPanel (手臂调试面板)    └─> 坐标轴映射调整        ├─> 左臂 X/Y/Z 轴配置        └─> 右臂 X/Y/Z 轴配置HandDebugPanel (手部调试面板)    └─> 手部姿态调试        ├─> 左手映射        └─> 右手映射
📦 模块 5：外部服务集成
S3 集成：
s3-uploader.ts    ├─> 文件上传    └─> 预签名 URL 生成    s3-resource-manager.ts    ├─> 资源列表获取    └─> 资源 URL 管理API Routes:    ├─> /api/s3/presigned-url (预签名 URL)    ├─> /api/s3/upload (文件上传)    └─> /api/s3/resources (资源列表)
Stripe 集成：
stripe-client.ts    ├─> 支付意图创建    └─> 订阅管理stripe-config.ts    └─> Stripe 配置管理API Routes:    ├─> /api/stripe/create-payment-intent    └─> /api/stripe/create-subscription
PostHog 分析：
posthog.ts / posthog-init.ts    ├─> 事件追踪    ├─> 用户行为分析    └─> KPI 指标收集Components:    ├─> PostHogProvider (Provider 包装)    ├─> PageTracker (页面追踪)    ├─> KPIDashboard (KPI 仪表板)    └─> ConsentManager (同意管理)
📦 模块 6：配置与常量系统
配置层次：
constants.ts (全局配置)    ├─> MEDIAPIPE_CONFIG (MediaPipe 配置)    ├─> CAMERA_CONFIG (摄像头配置)    ├─> VRM_EXPRESSIONS (VRM 表情映射)    ├─> BONE_MAPPING (骨骼映射)    ├─> ANIMATION_CONFIG (动画配置)    └─> UI_CONFIG (UI 配置)config-manager.ts (配置管理器)    └─> 动态配置管理
🧠 第三层：Mental Model 核心概念
概念 1：数据流单向性
用户操作 → 状态更新 → 数据验证 → 组件渲染摄像头 → MediaPipe → 数据转换 → VRM 应用 → 3D 渲染
概念 2：状态管理分层
全局状态 (Zustand)    ├─> useVideoRecognition (视频识别)    ├─> useModelManager (模型管理)    └─> useAnimationLibrary (动画库)    本地状态 (useState)    └─> 组件内部状态    派生状态 (useMemo/useCallback)    └─> 计算属性与优化
概念 3：组件职责分离
容器组件 (Container)    └─> VTuberApp, VTuberLayout        └─> 负责状态管理与组件编排        展示组件 (Presentation)    └─> UI 组件库        └─> 纯展示，无业务逻辑        业务组件 (Business)    └─> dressing-room 组件        └─> 包含业务逻辑与状态
概念 4：错误处理策略
预防性检查    ├─> 数据验证 (DataFlowValidator)    ├─> 状态验证 (safeSetState)    └─> 时序验证 (DataFlowSequencer)    错误捕获    ├─> try-catch 包装    ├─> 错误边界 (Error Boundary)    └─> 统一错误处理 (handleError)    用户反馈    ├─> 错误提示 UI    ├─> 错误日志记录    └─> 错误追踪 (PostHog)
概念 5：性能优化策略
渲染优化    ├─> React.memo (组件记忆化)    ├─> useMemo (计算记忆化)    └─> useCallback (函数记忆化)    数据优化    ├─> 事件数量限制 (1000个)    ├─> 自动清理过期数据    └─> 防抖/节流处理    3D 渲染优化    ├─> 帧率控制 (60 FPS)    ├─> LOD (细节层次)    └─> 渲染质量配置
🎯 架构设计原则
关注点分离：UI、业务逻辑、状态管理、工具函数分离
单一职责：每个模块/组件职责明确
数据流清晰：单向数据流，易于追踪与调试
可扩展性：模块化设计，便于扩展
类型安全：TypeScript 类型系统覆盖
错误处理：多层错误处理与用户反馈
性能监控：内置性能监控与调试工具
📊 模块依赖关系图
app/ (入口层)    ↓components/dressing-room/ (核心功能)    ├─> hooks/ (状态管理)    ├─> lib/ (工具库)    └─> types/ (类型定义)        ↓components/ui/ (UI 组件)    └─> 被所有业务组件使用        ↓components/tracking/ (追踪)    └─> lib/posthog.ts        ↓components/payment/ (支付)    └─> lib/stripe-client.ts        ↓i18n/ (国际化)    └─> messages/ (语言包)
该架构支持实时动捕、3D 渲染、多语言、支付与分析等功能的集成。

---

## 📊 文件统计

### 核心文件数量

- **组件文件**: 约 50+ 个 React 组件
- **Hooks**: 12 个自定义 Hooks
- **工具库**: 14 个工具函数文件
- **类型定义**: 4 个类型文件
- **API 路由**: 8 个 API 端点
- **国际化文件**: 4 个语言包（en, zh, ja, template）

### 主要目录说明

1. **src/app/** - Next.js App Router 路由系统
   - 支持国际化路由 `[locale]`
   - API 路由统一管理
   - 页面级组件组织

2. **src/components/** - React 组件库
   - `dressing-room/` - 核心动捕功能（14 个组件）
   - `ui/` - 基础 UI 组件库（17 个组件）
   - `tracking/` - 分析追踪组件（7 个组件）
   - `vtuber/` - VTuber 业务组件（3 个组件）

3. **src/hooks/** - 状态管理与业务逻辑
   - 全局状态管理（Zustand）
   - 性能监控
   - 主题管理
   - 追踪逻辑

4. **src/lib/** - 核心工具库
   - 动画管理
   - S3 资源管理
   - Stripe 支付集成
   - PostHog 分析
   - 数据流监控

### 已清理的测试文件

以下测试页面已从项目中移除（2024年清理）：
- ❌ `test-aws`, `test-aws-creds`, `test-env`, `test-env-vars`
- ❌ `test-model-manager`, `test-theme`, `test-upload`
- ❌ `scene-test`, `theme-test`
- ❌ `config-check`, `deploy-check`, `stripe-check`
- ❌ `[locale]/test`, `[locale]/test-language`, `[locale]/posthog-test`
- ❌ `[locale]/demo`, `[locale]/env-status`
- ❌ `api/s3/test-permissions`

这些测试页面已不再需要，项目结构更加清晰。