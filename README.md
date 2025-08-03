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