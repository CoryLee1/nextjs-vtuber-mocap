# 代码规范和开发指南

本文档是项目的代码规范和开发指南，详细说明了项目的架构原则、代码组织规则、命名约定和最佳实践。

> **注意**: 这是 `.cursorrules` 文件的可读版本。Cursor 编辑器会自动读取 `.cursorrules` 文件作为 AI 助手的上下文。

## 📋 目录

- [项目核心原则](#项目核心原则)
- [目录结构规范](#目录结构规范)
- [代码组织规则](#代码组织规则)
- [VRM 坐标系处理策略](#vrm-坐标系处理策略)
- [禁止事项](#禁止事项)
- [命名约定](#命名约定)
- [注释要求](#注释要求)
- [状态管理策略](#状态管理策略)
- [国际化规则](#国际化规则)
- [性能检查清单](#性能检查清单)
- [代码审查标准](#代码审查标准)

## 🎯 项目核心原则

### 数据流架构
```
Camera → MediaPipe → Kalidokit → VRM Model
                                    ↓
                            Coordinate Normalization
```

**核心原则**：
- **单向数据流**：状态只能向下传递，避免循环依赖
- **性能优先**：动捕需要 60fps，所有代码必须考虑性能影响
- **关注点分离**：UI、3D 渲染、数据处理严格分离

## 📁 目录结构规范

详细的项目目录结构请参考 [项目架构文档](./project-architecture.md)。

关键目录说明：
- `src/components/dressing-room/` - 主功能组件（UI 层）
- `src/components/three/` - Three.js 专用组件（3D 层）
- `src/lib/mocap/` - 动捕核心逻辑
- `src/lib/vrm/` - VRM 处理逻辑
- `src/hooks/` - 自定义 Hooks

## 🎨 代码组织规则

### 1. 性能关键代码（动捕循环）

**位置**：`lib/mocap/processors/`  
**命名**：`*Processor.ts`

**要求**：
- 使用对象池模式避免 GC 压力
- 添加性能注释 `// PERF: ...`
- 避免在循环中创建对象
- 最小化条件分支

### 2. VRM 坐标归一化逻辑

**位置**：`lib/vrm/normalizer.ts`

处理不同来源 VRM 模型的坐标系差异，包括：
- 自动坐标系检测
- 多种坐标系支持（VRoid、Blender、Unity）
- 用户手动覆盖选项
- 调试可视化工具

### 3. Three.js 组件规范

**位置**：`components/three/`  
**命名**：`*3D.tsx`

**要求**：
- 使用 `React.memo` 包裹
- 使用 `useMemo` 缓存计算
- 使用 `useRef` 存储 Three.js 对象
- 添加性能优化注释

### 4. UI 组件规范

**要求**：
- 与 3D 逻辑完全分离
- 通过 Context 或 props 接收状态
- 不直接操作 Three.js 对象
- 不包含动捕处理逻辑

### 5. Hooks 规范

**命名规则**：`use + 功能领域 + 具体功能`

**结构要求**：
- 明确的返回类型定义
- 错误处理
- 清理逻辑（cleanup）
- JSDoc 注释

## 🎮 VRM 坐标系处理策略

### 问题分析

不同 3D 软件的坐标系不一致：
- **VRoid Studio**: Y-up, 右手系, 面朝 -Z
- **Blender**: Z-up, 右手系, 面朝 +Y（或 -Y）
- **Unity**: Y-up, 左手系, 面朝 +Z

### 解决方案

推荐使用**混合策略**：
1. 自动检测坐标系
2. 归一化到标准坐标系
3. 提供用户手动调整选项

详细实现请参考 `.cursorrules` 文件中的相关章节。

## 🚫 禁止事项

### 绝对禁止
- ❌ 在 React 组件中直接调用 MediaPipe
- ❌ 在 `useFrame` 回调中使用 `setState`
- ❌ 硬编码坐标映射数值
- ❌ 在动捕循环中使用 `console.log`
- ❌ 混合 UI 逻辑和 3D 逻辑在同一文件
- ❌ 不处理 VRM 坐标系差异直接应用动捕数据

### 应当避免
- ⚠️ 过度依赖固定的坐标轴映射配置
- ⚠️ 假设所有 VRM 模型使用相同坐标系
- ⚠️ 没有错误处理的异步操作
- ⚠️ 超过 300 行的组件文件

## 📝 命名约定

### 组件
- 3D 相关组件：`*3D.tsx` (VRMAvatar3D.tsx)
- 调试面板：`*DebugPanel.tsx`
- 检查器：`*Inspector.tsx`

### 文件
- 处理器：`*Processor.ts`
- 归一化器：`*Normalizer.ts`
- 配置文件：`*.config.ts`

### 函数
- 工具函数：动词开头
- 检测函数：`detect*`
- 转换函数：`normalize*` 或 `transform*`

### 类型
- 枚举：PascalCase
- 接口：PascalCase
- 类型别名：PascalCase

## 💬 注释要求

必须添加注释的场景：
1. 坐标转换代码
2. 性能敏感代码（使用 `// PERF: ...`）
3. MediaPipe 数据处理
4. 复杂的 Three.js 操作
5. 坐标系检测逻辑

## 🎯 状态管理策略

### 状态分类

1. **全局应用状态** - 使用 Context
2. **3D 场景状态** - 使用 Zustand 或 useRef
3. **UI 状态** - 使用 useState
4. **动捕数据** - 使用 useRef（避免重渲染）

### 使用原则

- 动捕数据使用 `useRef`，避免每帧触发组件更新
- 不要在 `useFrame` 中使用 `setState`

## 🔧 国际化规则

### 翻译 key 结构
```
功能.组件.文本

示例:
mocap.camera.enable
vrm.inspector.coordinateSystem
```

### 禁止硬编码
- ❌ `<Button>Enable Camera</Button>`
- ✅ `<Button>{t('mocap.camera.enable')}</Button>`

## 📊 性能检查清单

### 每次 Commit 前检查

```bash
# 1. 类型检查
pnpm typecheck

# 2. 检查是否有硬编码坐标值
grep -r "{ x: -1, y: 1" src/components/ || echo "✅ 无硬编码"

# 3. 检查性能注释
grep -r "// PERF:" src/lib/mocap/ || echo "⚠️ 缺少性能注释"

# 4. 格式化
pnpm format
```

### 性能要求

- [ ] 动捕运行在 60fps
- [ ] 模型加载时间 < 3 秒
- [ ] 内存使用稳定（无泄漏）
- [ ] 帧率波动 < 10%

## ✅ 代码审查标准

### Pull Request 必须满足

- [ ] 通过 TypeScript 类型检查
- [ ] 通过代码格式检查
- [ ] 性能敏感代码有 PERF 注释
- [ ] VRM 处理包含坐标系检测
- [ ] 国际化文本使用翻译 key
- [ ] 没有 console.log（除了错误日志）
- [ ] Three.js 组件使用 React.memo
- [ ] 动捕循环不触发状态更新

## 🔗 相关文档

- [项目架构文档](./project-architecture.md) - 完整的项目架构说明
- [数据流架构文档](./data-flow-architecture.md) - 数据流和时序控制
- [.cursorrules](../.cursorrules) - Cursor AI 规则文件（详细版本）

---

**最后更新**: 2024年





