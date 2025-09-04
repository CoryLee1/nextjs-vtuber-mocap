# VTuber Motion Capture Application

[English](#english) | [中文](#中文) | [日本語](#日本語)

---

## English

A Next.js-based VTuber motion capture application supporting real-time facial expressions, body poses, and hand movements.

### 🚀 Features

- **Real-time Motion Capture**: Using MediaPipe for face, body, and hand tracking
- **VRM Model Support**: Load and display VRM format 3D models
- **Multilingual Support**: Chinese, English, Japanese
- **Debug Tools**: Built-in coordinate axis debug panel for real-time mocap data mapping adjustment
- **Onboarding Guide**: Interactive 3-step tutorial for new users (appears on every page refresh)

### 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **3D Rendering**: Three.js + @react-three/fiber
- **VRM Support**: @pixiv/three-vrm
- **Motion Capture**: MediaPipe + Kalidokit
- **UI Components**: Tailwind CSS + shadcn/ui
- **Internationalization**: next-intl

### 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # i18n routes
│   └── globals.css        # Global styles
├── components/             # React components
│   ├── dressing-room/     # Main feature components
│   ├── ui/               # UI component library
│   └── layout/           # Layout components
├── hooks/                # Custom Hooks
├── lib/                  # Utility libraries
├── types/                # TypeScript type definitions
└── i18n/                # i18n configuration
```

### 🏗️ Application Architecture & Component Integration

#### Core Integration Scripts

The application's component integration and execution order is managed by several key scripts:

##### 1. **Main Entry Points**
- **`src/app/layout.tsx`** - Root layout defining global HTML structure and metadata
- **`src/app/[locale]/layout.tsx`** - Internationalized layout integrating all Providers and global components
- **`src/app/[locale]/page.tsx`** - Main page controlling initial application loading flow

##### 2. **Application Integration Core**
**`src/components/dressing-room/VTuberApp.tsx`** is the central script that integrates all components:

```typescript
// Integrated components and their order:
1. VTuberLayout - Overall layout container
2. VTuberSceneContainer - 3D scene container  
3. CameraWidget - Camera component
4. ModelManager - Model manager
5. AnimationLibrary - Animation library
6. SettingsPanel - Settings panel
7. DataFlowDebugPanel - Debug panel
```

##### 2.1. **Onboarding Guide Integration**
**`src/components/ui/OnboardingGuide.tsx`** provides a 3-step interactive tutorial:

```typescript
// Onboarding flow:
1. Upload Avatar - VRM file upload and model selection
2. Setup Character - Configuration and settings
3. Go Live - Start motion capture session
```

**Key Features:**
- **Always Shows**: Appears on every page refresh/visit
- **Skipable**: Users can skip the tutorial
- **Responsive Design**: Adapts to different screen sizes
- **Modern UI**: Dark blue theme with yellow highlights

##### 3. **State and Flow Control**
**`src/components/dressing-room/VTuberControls.tsx`** manages application state and operation sequence:

```typescript
// Controlled operation sequence:
- Model Selection → Animation Selection → Camera Start → Motion Capture Begin
- Error Handling → State Validation → Data Flow Monitoring
```

##### 4. **Data Flow and Sequence Management**
**`src/lib/data-flow-monitor.ts`** handles:
- Recording execution order of all operations
- Validating correctness of state transitions
- Monitoring performance and data flow

##### 5. **Layout and UI Order**
**`src/components/dressing-room/VTuberLayout.tsx`** defines UI component display order:

```typescript
// UI hierarchy (from bottom to top):
1. 3D Scene Container (occupies entire screen)
2. Status Indicator (top-right corner)
3. Control Panel (bottom-left corner)
4. Modal Windows (Model Manager, Animation Library, etc.)
```

##### 6. **Routing and Middleware Control**
- **`middleware.ts`** - Handles internationalized routing and redirects
- **`next.config.js`** - Configures build process and resource loading order

#### Application Startup and Component Loading Sequence

1. **Initialization Phase**:
   - Root Layout Load → Internationalization Provider → Theme Provider → PostHog Tracking

2. **Loading Phase**:
   - LoadingPage Display (3 seconds) → Client-side hydration check

3. **Onboarding Phase**:
   - OnboardingGuide Display (3-step tutorial) → User completion/skip

4. **Main Application Phase**:
   - VTuberApp Dynamic Load → 3D Scene Initialization

5. **Feature Module Phase**:
   - Camera Component → Model Manager → Animation Library → Settings Panel

6. **User Interaction Phase**:
   - Control Panel → Status Indicator → Debug Tools

**Onboarding Behavior:**
- **Every Visit**: Onboarding guide appears on every page refresh/visit
- **No Persistence**: No localStorage storage, ensuring fresh experience each time
- **User Choice**: Users can complete the tutorial or skip directly to main app

This architecture ensures all components load and initialize in the correct order while providing complete state management and error handling mechanisms.

### 🎯 Motion Capture Logic

#### Data Flow
1. **Camera Input** → MediaPipe Processing → Kalidokit Conversion → VRM Model Application

#### Coordinate Axis Mapping
Motion capture data needs coordinate axis transformation to correctly map to VRM models:

##### Arm Mapping
- **Left Arm**: `X: -1, Y: 1, Z: -1`
- **Right Arm**: `X: -1, Y: 1, Z: -1`

##### Hand Mapping
- **Left Hand**: `X: -1, Y: 1, Z: -1`
- **Right Hand**: `X: -1, Y: 1, Z: -1`

##### Finger Mapping (Under Debug)
Current finger mapping has issues requiring further debugging:
- Each finger joint has independent X/Y/Z axis configuration
- Need to debug each finger's bending direction individually

### 🐛 Known Issues

#### Finger Mapping Issues
- **Problem**: Incorrect finger bending direction, difficult to see changes
- **Cause**: Finger joint coordinate axis mapping needs fine-tuning
- **Solution**: Use detailed finger debug panel for individual debugging

#### Model Loading Issues
- **Problem**: Missing progress indication during model loading
- **Solution**: Loading state indicator has been added

#### Language Switching Issues
- **Problem**: Language switching functionality not working
- **Status**: Need to check next-intl configuration

### 🚀 Quick Start

#### Requirements
- Node.js 18+
- npm or yarn

#### Installation
```bash
npm install
```

#### Development
```bash
npm run dev
```

#### Production Build
```bash
npm run build
```

### 📖 Usage Guide

#### Basic Operations
1. **Enable Camera**: Click camera button in control panel
2. **Select Model**: Use model manager to select VRM model
3. **Adjust Settings**: Modify various parameters in control panel
4. **Debug Motion Capture**: Use debug panel to adjust coordinate axis mapping

#### Debugging Tips
1. **Arm Debugging**: Raise arms to observe model response
2. **Hand Debugging**: Rotate hands to observe direction
3. **Finger Debugging**: Bend fingers individually to observe effects
4. **Save Configuration**: Save when correct configuration is found

### 🔧 Development Guide

#### Adding New Motion Capture Features
1. Add new processing logic in `VRMAvatar.tsx`
2. Add corresponding control options in debug panel
3. Update type definitions and documentation

#### Customizing Coordinate Axis Mapping
1. Modify default configuration in `ArmDebugPanel.jsx`
2. Update state management in `VTuberScene.tsx`
3. Apply new mapping logic in `VRMAvatar.tsx`

### 📝 Changelog

#### v1.0.0
- ✅ Basic motion capture functionality
- ✅ VRM model support
- ✅ Debug panel
- ✅ Multilingual support
- 🔄 Finger mapping debugging in progress
- 🔄 Language switching fix in progress

### 🤝 Contributing

Welcome to submit Issues and Pull Requests!

### 📄 License

MIT License

---

## 中文

基于 Next.js 的 VTuber 动捕应用，支持实时面部表情、身体姿态和手部动作捕捉。

### 🚀 功能特性

- **实时动捕**: 使用 MediaPipe 进行面部、身体和手部动作捕捉
- **VRM 模型支持**: 支持加载和显示 VRM 格式的 3D 模型
- **多语言支持**: 支持中文、英文、日文
- **调试工具**: 内置坐标轴调试面板，可实时调整动捕数据映射
- **新手引导**: 交互式3步教程，每次刷新页面都会显示

### 🛠️ 技术栈

- **前端框架**: Next.js 14 (App Router)
- **3D 渲染**: Three.js + @react-three/fiber
- **VRM 支持**: @pixiv/three-vrm
- **动捕库**: MediaPipe + Kalidokit
- **UI 组件**: Tailwind CSS + shadcn/ui
- **国际化**: next-intl

### 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # 国际化路由
│   └── globals.css        # 全局样式
├── components/             # React 组件
│   ├── dressing-room/     # 主要功能组件
│   ├── ui/               # UI 组件库
│   └── layout/           # 布局组件
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具库
├── types/                # TypeScript 类型定义
└── i18n/                # 国际化配置
```

### 🏗️ 应用架构与组件集成

#### 核心集成脚本

应用的组件集成和执行顺序由以下几个关键脚本管理：

##### 1. **主要入口点**
- **`src/app/layout.tsx`** - 根布局文件，定义全局HTML结构和元数据
- **`src/app/[locale]/layout.tsx`** - 国际化布局，集成所有Provider和全局组件
- **`src/app/[locale]/page.tsx`** - 主页面，决定应用的初始加载流程

##### 2. **应用集成核心**
**`src/components/dressing-room/VTuberApp.tsx`** 是集成所有部分的核心脚本：

```typescript
// 集成的主要组件和顺序：
1. VTuberLayout - 整体布局容器
2. VTuberSceneContainer - 3D场景容器  
3. CameraWidget - 摄像头组件
4. ModelManager - 模型管理器
5. AnimationLibrary - 动画库
6. SettingsPanel - 设置面板
7. DataFlowDebugPanel - 调试面板
```

##### 2.1. **新手引导集成**
**`src/components/ui/OnboardingGuide.tsx`** 提供3步交互式教程：

```typescript
// 引导流程：
1. 上传头像 - VRM文件上传和模型选择
2. 设置角色 - 配置和设置
3. 开始直播 - 启动动作捕捉会话
```

**主要特性：**
- **总是显示**: 每次刷新页面/访问都会出现
- **可跳过**: 用户可以跳过教程
- **响应式设计**: 适配不同屏幕尺寸
- **现代UI**: 深蓝色主题配黄色高亮

##### 3. **状态和流程控制**
**`src/components/dressing-room/VTuberControls.tsx`** 管理应用状态和操作顺序：

```typescript
// 控制的操作序列：
- 模型选择 → 动画选择 → 摄像头启动 → 动作捕捉开始
- 错误处理 → 状态验证 → 数据流监控
```

##### 4. **数据流和时序管理**
**`src/lib/data-flow-monitor.ts`** 负责：
- 记录所有操作的执行顺序
- 验证状态转换的正确性
- 监控性能和数据流

##### 5. **布局和UI顺序**
**`src/components/dressing-room/VTuberLayout.tsx`** 定义UI组件的显示顺序：

```typescript
// UI层次结构（从底层到顶层）：
1. 3D场景容器（占据整个屏幕）
2. 状态指示器（右上角）
3. 控制面板（左下角）
4. 模态窗口（模型管理器、动画库等）
```

##### 6. **路由和中间件控制**
- **`middleware.ts`** - 处理国际化路由和重定向
- **`next.config.js`** - 配置构建流程和资源加载顺序

#### 应用启动和组件加载顺序

1. **初始化阶段**：
   - 根布局加载 → 国际化Provider → 主题Provider → PostHog跟踪

2. **加载阶段**：
   - LoadingPage显示（3秒）→ 客户端水合检查

3. **新手引导阶段**：
   - OnboardingGuide显示（3步教程）→ 用户完成/跳过

4. **主应用阶段**：
   - VTuberApp动态加载 → 3D场景初始化

5. **功能模块阶段**：
   - 摄像头组件 → 模型管理器 → 动画库 → 设置面板

6. **用户交互阶段**：
   - 控制面板 → 状态指示器 → 调试工具

**新手引导行为：**
- **每次访问**: 每次刷新页面/访问都会显示新手引导
- **无持久化**: 不使用localStorage存储，确保每次都是全新体验
- **用户选择**: 用户可以完成教程或直接跳过进入主应用

这个架构确保了所有组件按正确的顺序加载和初始化，同时提供了完整的状态管理和错误处理机制。

### 🎯 动捕逻辑说明

#### 数据流程
1. **摄像头输入** → MediaPipe 处理 → Kalidokit 转换 → VRM 模型应用

#### 坐标轴映射
动捕数据需要经过坐标轴转换才能正确映射到 VRM 模型：

##### 手臂映射
- **左臂**: `X: -1, Y: 1, Z: -1`
- **右臂**: `X: -1, Y: 1, Z: -1`

##### 手掌映射
- **左手**: `X: -1, Y: 1, Z: -1`
- **右手**: `X: -1, Y: 1, Z: -1`

##### 手指映射 (待调试)
当前手指映射存在问题，需要进一步调试：
- 每个手指关节都有独立的 X/Y/Z 轴向配置
- 需要逐个调试每个手指的弯曲方向

### 🐛 已知问题

#### 手指映射问题
- **问题**: 手指弯曲方向不正确，难以看出变化
- **原因**: 手指关节的坐标轴映射需要精细调整
- **解决方案**: 使用详细手指调试面板逐个调试

#### 模型加载问题
- **问题**: 模型加载时缺少进度提示
- **解决方案**: 已添加加载状态指示器

#### 语言切换问题
- **问题**: 语言切换功能不工作
- **状态**: 需要检查 next-intl 配置

### 🚀 快速开始

#### 环境要求
- Node.js 18+
- npm 或 yarn

#### 安装依赖
```bash
npm install
```

#### 开发模式
```bash
npm run dev
```

#### 构建生产版本
```bash
npm run build
```

### 📖 使用指南

#### 基本操作
1. **开启摄像头**: 点击控制面板中的摄像头按钮
2. **选择模型**: 使用模型管理器选择 VRM 模型
3. **调整设置**: 在控制面板中调整各种参数
4. **调试动捕**: 使用调试面板调整坐标轴映射

#### 调试技巧
1. **手臂调试**: 举起手臂观察模型响应
2. **手掌调试**: 旋转手掌观察方向
3. **手指调试**: 逐个弯曲手指观察效果
4. **保存配置**: 找到正确配置后及时保存

### 🔧 开发说明

#### 添加新的动捕功能
1. 在 `VRMAvatar.tsx` 中添加新的处理逻辑
2. 在调试面板中添加对应的控制选项
3. 更新类型定义和文档

#### 自定义坐标轴映射
1. 修改 `ArmDebugPanel.jsx` 中的默认配置
2. 在 `VTuberScene.tsx` 中更新状态管理
3. 在 `VRMAvatar.tsx` 中应用新的映射逻辑

### 📝 更新日志

#### v1.0.0
- ✅ 基础动捕功能
- ✅ VRM 模型支持
- ✅ 调试面板
- ✅ 多语言支持
- 🔄 手指映射调试中
- 🔄 语言切换修复中

### 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 📄 许可证

MIT License

---

## 日本語

Next.jsベースのVTuber動作キャプチャアプリケーション。リアルタイムで顔の表情、体のポーズ、手の動きをキャプチャ。

### 🚀 主な機能

- **リアルタイム動作キャプチャ**: MediaPipeを使用した顔、体、手の動きのトラッキング
- **VRMモデル対応**: VRM形式の3Dモデルの読み込みと表示
- **多言語対応**: 中国語、英語、日本語
- **デバッグツール**: 座標軸デバッグパネルでリアルタイム調整
- **オンボーディングガイド**: インタラクティブな3ステップチュートリアル（ページリフレッシュ時に表示）

### 🛠️ 技術スタック

- **フロントエンド**: Next.js 14 (App Router)
- **3Dレンダリング**: Three.js + @react-three/fiber
- **VRM対応**: @pixiv/three-vrm
- **動作キャプチャ**: MediaPipe + Kalidokit
- **UIコンポーネント**: Tailwind CSS + shadcn/ui
- **国際化**: next-intl

### 📁 プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # 国際化ルート
│   └── globals.css        # グローバルスタイル
├── components/             # Reactコンポーネント
│   ├── dressing-room/     # メイン機能コンポーネント
│   ├── ui/               # UIコンポーネントライブラリ
│   └── layout/           # レイアウトコンポーネント
├── hooks/                # カスタムフック
├── lib/                  # ユーティリティライブラリ
├── types/                # TypeScript型定義
└── i18n/                # 国際化設定
```

### 🏗️ アプリケーションアーキテクチャとコンポーネント統合

#### コア統合スクリプト

アプリケーションのコンポーネント統合と実行順序は、以下の主要スクリプトによって管理されています：

##### 1. **メインエントリーポイント**
- **`src/app/layout.tsx`** - グローバルHTML構造とメタデータを定義するルートレイアウト
- **`src/app/[locale]/layout.tsx`** - すべてのProviderとグローバルコンポーネントを統合する国際化レイアウト
- **`src/app/[locale]/page.tsx`** - アプリケーションの初期読み込みフローを制御するメインページ

##### 2. **アプリケーション統合コア**
**`src/components/dressing-room/VTuberApp.tsx`** は、すべてのコンポーネントを統合する中心的なスクリプトです：

```typescript
// 統合される主要コンポーネントとその順序：
1. VTuberLayout - 全体レイアウトコンテナ
2. VTuberSceneContainer - 3Dシーンコンテナ  
3. CameraWidget - カメラコンポーネント
4. ModelManager - モデルマネージャー
5. AnimationLibrary - アニメーションライブラリ
6. SettingsPanel - 設定パネル
7. DataFlowDebugPanel - デバッグパネル
```

##### 2.1. **オンボーディングガイド統合**
**`src/components/ui/OnboardingGuide.tsx`** は3ステップのインタラクティブチュートリアルを提供します：

```typescript
// オンボーディングフロー：
1. アバターアップロード - VRMファイルアップロードとモデル選択
2. キャラクター設定 - 設定とコンフィギュレーション
3. ライブ開始 - モーションキャプチャセッション開始
```

**主要機能：**
- **常に表示**: ページリフレッシュ/訪問時に毎回表示
- **スキップ可能**: ユーザーはチュートリアルをスキップ可能
- **レスポンシブデザイン**: 異なる画面サイズに対応
- **モダンUI**: ダークブルーテーマとイエローハイライト

##### 3. **状態とフロー制御**
**`src/components/dressing-room/VTuberControls.tsx`** は、アプリケーション状態と操作シーケンスを管理します：

```typescript
// 制御される操作シーケンス：
- モデル選択 → アニメーション選択 → カメラ開始 → モーションキャプチャ開始
- エラーハンドリング → 状態検証 → データフロー監視
```

##### 4. **データフローとシーケンス管理**
**`src/lib/data-flow-monitor.ts`** は以下を処理します：
- すべての操作の実行順序の記録
- 状態遷移の正確性の検証
- パフォーマンスとデータフローの監視

##### 5. **レイアウトとUI順序**
**`src/components/dressing-room/VTuberLayout.tsx`** は、UIコンポーネントの表示順序を定義します：

```typescript
// UI階層（下から上へ）：
1. 3Dシーンコンテナ（画面全体を占有）
2. ステータスインジケーター（右上角）
3. コントロールパネル（左下角）
4. モーダルウィンドウ（モデルマネージャー、アニメーションライブラリなど）
```

##### 6. **ルーティングとミドルウェア制御**
- **`middleware.ts`** - 国際化ルーティングとリダイレクトを処理
- **`next.config.js`** - ビルドプロセスとリソース読み込み順序を設定

#### アプリケーション起動とコンポーネント読み込み順序

1. **初期化フェーズ**：
   - ルートレイアウト読み込み → 国際化Provider → テーマProvider → PostHogトラッキング

2. **読み込みフェーズ**：
   - LoadingPage表示（3秒）→ クライアントサイドハイドレーション確認

3. **オンボーディングフェーズ**：
   - OnboardingGuide表示（3ステップチュートリアル）→ ユーザー完了/スキップ

4. **メインアプリケーションフェーズ**：
   - VTuberApp動的読み込み → 3Dシーン初期化

5. **機能モジュールフェーズ**：
   - カメラコンポーネント → モデルマネージャー → アニメーションライブラリ → 設定パネル

6. **ユーザーインタラクションフェーズ**：
   - コントロールパネル → ステータスインジケーター → デバッグツール

**オンボーディング動作：**
- **毎回表示**: ページリフレッシュ/訪問時に毎回オンボーディングガイドが表示
- **永続化なし**: localStorageを使用せず、毎回新しい体験を提供
- **ユーザー選択**: ユーザーはチュートリアルを完了するか、直接メインアプリにスキップ可能

このアーキテクチャにより、すべてのコンポーネントが正しい順序で読み込み・初期化され、完全な状態管理とエラーハンドリングメカニズムが提供されます。

### 🎯 モーションキャプチャのロジック

#### データフロー
1. **カメラ入力** → MediaPipe処理 → Kalidokit変換 → VRMモデル適用

#### 座標軸マッピング
モーションキャプチャデータはVRMモデルに正しくマッピングするために座標軸変換が必要：

##### 腕のマッピング
- **左腕**: `X: -1, Y: 1, Z: -1`
- **右腕**: `X: -1, Y: 1, Z: -1`

##### 手のマッピング
- **左手**: `X: -1, Y: 1, Z: -1`
- **右手**: `X: -1, Y: 1, Z: -1`

##### 指のマッピング (デバッグ中)
現在の指のマッピングに問題があり、さらなるデバッグが必要：
- 各指関節に独立したX/Y/Z軸設定
- 各指の曲げ方向を個別にデバッグする必要

### 🐛 既知の問題

#### 指のマッピング問題
- **問題**: 指の曲げ方向が正しくない、変化が見えにくい
- **原因**: 指関節の座標軸マッピングの微調整が必要
- **解決策**: 詳細な指デバッグパネルで個別デバッグ

#### モデル読み込み問題
- **問題**: モデル読み込み時の進捗表示がない
- **解決策**: 読み込み状態インジケーターを追加済み

#### 言語切替問題
- **問題**: 言語切替機能が動作しない
- **状況**: next-intl設定の確認が必要

### 🚀 クイックスタート

#### 要件
- Node.js 18+
- npmまたはyarn

#### インストール
```bash
npm install
```

#### 開発モード
```bash
npm run dev
```

#### 本番ビルド
```bash
npm run build
```

### 📖 使用ガイド

#### 基本操作
1. **カメラを有効化**: コントロールパネルのカメラボタンをクリック
2. **モデルを選択**: モデルマネージャーでVRMモデルを選択
3. **設定を調整**: コントロールパネルで各種パラメータを調整
4. **動作キャプチャをデバッグ**: デバッグパネルで座標軸マッピングを調整

#### デバッグのコツ
1. **腕のデバッグ**: 腕を上げてモデルの反応を観察
2. **手のデバッグ**: 手を回転させて方向を観察
3. **指のデバッグ**: 指を個別に曲げて効果を観察
4. **設定を保存**: 正しい設定を見つけたら保存

### 🔧 開発ガイド

#### 新しい動作キャプチャ機能の追加
1. `VRMAvatar.tsx`に新しい処理ロジックを追加
2. デバッグパネルに対応する制御オプションを追加
3. 型定義とドキュメントを更新

#### 座標軸マッピングのカスタマイズ
1. `ArmDebugPanel.jsx`のデフォルト設定を修正
2. `VTuberScene.tsx`で状態管理を更新
3. `VRMAvatar.tsx`で新しいマッピングロジックを適用

### 📝 更新履歴

#### v1.0.0
- ✅ 基本的な動作キャプチャ機能
- ✅ VRMモデル対応
- ✅ デバッグパネル
- ✅ 多言語対応
- 🔄 指のマッピングデバッグ中
- 🔄 言語切替修正中

### 🤝 貢献ガイド

IssueやPull Requestの投稿を歓迎します！

### 📄 ライセンス

MIT License