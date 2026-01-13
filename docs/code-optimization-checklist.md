# 代码优化清单

本文档列出了代码库中发现的潜在问题、风险和优化建议，基于 `.cursorrules` 规范和代码扫描结果。

## 🔴 严重问题（必须修复）

### 1. 性能问题：在 `useFrame` 中创建新对象

**位置**: `src/components/dressing-room/VRMAvatar.tsx` (BoneVisualizer)

**问题**:
```typescript
// ❌ 每帧创建新对象
useFrame(() => {
  const parentWorldPos = parent.getWorldPosition(new Vector3()); // 创建新对象
  const childWorldPos = child.getWorldPosition(new Vector3()); // 创建新对象
  const direction = new Vector3().subVectors(...); // 创建新对象
  const center = new Vector3().addVectors(...); // 创建新对象
  const up = new Vector3(0, 1, 0); // 创建新对象
  const axis = new Vector3().crossVectors(...); // 创建新对象
});
```

**影响**: 每帧创建 6+ 个 Vector3 对象，导致 GC 压力，可能影响 60fps 性能

**修复方案**:
```typescript
// ✅ 使用对象池或 ref 复用对象
const tmpVec3_1 = useRef(new Vector3());
const tmpVec3_2 = useRef(new Vector3());
const tmpVec3_3 = useRef(new Vector3());

useFrame(() => {
  const parentWorldPos = parent.getWorldPosition(tmpVec3_1.current);
  const childWorldPos = child.getWorldPosition(tmpVec3_2.current);
  const direction = tmpVec3_3.current.subVectors(childWorldPos, parentWorldPos);
  // ...
});
```

**优先级**: 🔴 高

---

### 2. 性能问题：在 `useFrame` 中创建新对象（CameraController）

**位置**: `src/components/dressing-room/CameraController.tsx`

**问题**:
```typescript
// ❌ 在 useFrame 中创建新对象
useFrame((_, delta) => {
  const right = new Vector3(); // 每帧创建
  const up = new Vector3(0, 1, 0); // 每帧创建
  const panOffset = new Vector3(); // 每帧创建
  const targetPos = new Vector3(); // 每帧创建
  const position = new Vector3(); // 每帧创建
});
```

**修复方案**: 使用 ref 复用对象

**优先级**: 🔴 高

---

### 3. 性能问题：在 `useFrame` 中创建新对象（DebugHelpers）

**位置**: `src/components/dressing-room/DebugHelpers.tsx`

**问题**:
```typescript
// ❌ 在 useFrame 中创建新对象
useFrame(() => {
  const worldPos = leftUpperArm.getWorldPosition(new Vector3());
  const rawDirection = new Vector3(...);
  // ...
});
```

**修复方案**: 使用 ref 复用对象

**优先级**: 🔴 高

---

## 🟡 重要问题（建议修复）

### 4. 缺少 React.memo 优化

**位置**: 多个组件文件

**问题**: Three.js 相关组件没有使用 `React.memo` 包裹

**影响**: 父组件更新时会导致不必要的重渲染

**需要优化的组件**:
- `VRMAvatar.tsx` - 主 VRM 组件
- `BoneVisualizer` - 骨骼可视化组件
- `CameraController.tsx` - 相机控制器
- `DebugHelpers.tsx` 中的组件

**修复方案**:
```typescript
// ✅ 使用 React.memo
const VRMAvatar = React.memo(forwardRef<Group, VRMAvatarProps>(({ ... }, ref) => {
  // ...
}));
```

**优先级**: 🟡 中

---

### 5. 硬编码的坐标值

**位置**: 
- `src/components/dressing-room/VRMAvatar.tsx` (axisSettings 默认值)
- `src/components/dressing-room/ArmDebugPanel.jsx` (大量硬编码配置)

**问题**:
```typescript
// ❌ 硬编码坐标值
axisSettings = {
  leftArm: { x: 1, y: 1, z: 1 },
  rightArm: { x: -1, y: 1, z: 1 },
  // ...
}
```

**影响**: 违反 `.cursorrules` 规范，应该使用配置或自动检测

**修复方案**: 
- 将硬编码值移到配置文件
- 或使用默认配置常量

**优先级**: 🟡 中

---

### 6. 缺少性能注释

**位置**: 性能敏感代码缺少 `// PERF:` 注释

**问题**: 根据 `.cursorrules`，性能敏感代码必须添加 `// PERF:` 注释

**需要添加注释的地方**:
- `VRMAvatar.tsx` 的 `useFrame` 循环
- `CameraController.tsx` 的 `useFrame` 循环
- `resultsCallback` 函数（MediaPipe 回调）
- 所有在循环中处理动捕数据的代码

**修复方案**:
```typescript
// PERF: 使用对象池避免每帧创建 Vector3 对象
const tmpVec3 = useRef(new Vector3());
```

**优先级**: 🟡 中

---

### 7. console.log 在动捕循环中

**位置**: `src/components/dressing-room/VRMAvatar.tsx`

**问题**: 虽然大部分已注释，但仍有一些 `console.log` 在可能被频繁调用的地方

**影响**: 生产环境性能问题

**需要移除/条件化的日志**:
- 第 401 行: `console.log('VRMAvatar: 检查动画状态...')` - 可能频繁调用
- 第 483 行: `console.log('VRMAvatar: videoElement 状态变化')` - 可能频繁调用
- 第 574-584 行: 大量 `console.log` 在 VRM 初始化时

**修复方案**:
```typescript
// ✅ 使用条件日志
if (process.env.NODE_ENV === 'development') {
  console.log(...);
}
```

**优先级**: 🟡 中

---

## 🟢 优化建议（可选）

### 8. 组件文件过大

**位置**: `src/components/dressing-room/VRMAvatar.tsx` (1216 行)

**问题**: 超过 `.cursorrules` 建议的 300 行限制

**影响**: 可维护性差，难以理解

**修复方案**: 拆分为多个子组件
- `VRMAvatarCore.tsx` - 核心逻辑
- `VRMAvatarMocap.tsx` - 动捕处理
- `VRMAvatarAnimation.tsx` - 动画处理
- `BoneVisualizer.tsx` - 骨骼可视化（已分离）

**优先级**: 🟢 低

---

### 9. 缺少错误边界

**位置**: 3D 组件缺少错误边界保护

**问题**: VRM 加载失败或 Three.js 错误可能导致整个应用崩溃

**修复方案**: 添加 React Error Boundary

**优先级**: 🟢 低

---

### 10. 类型安全改进

**位置**: 多个文件使用 `any` 类型

**问题**:
- `VRMAvatar.tsx`: `gltfResult: any`
- `VRMLoader.tsx`: `vrm: any`
- `CameraController.tsx`: `followTarget: any`

**修复方案**: 定义明确的类型

**优先级**: 🟢 低

---

### 11. 内存泄漏风险

**位置**: Three.js 对象清理

**问题**: 需要确保所有 Three.js 对象在组件卸载时正确清理

**检查点**:
- ✅ `VRMAvatar.tsx` 有清理逻辑
- ⚠️ `BoneVisualizer` 创建的 mesh 需要清理
- ⚠️ `CameraController` 创建的临时对象需要清理

**优先级**: 🟢 低

---

### 12. 国际化缺失

**位置**: 多个组件有硬编码的中文文本

**问题**: 违反 `.cursorrules` 国际化规则

**需要国际化的文本**:
- `VRMAvatar.tsx`: 错误消息、日志
- `CameraWidget.tsx`: 错误消息
- `ControlPanel.tsx`: UI 文本

**修复方案**: 使用 `next-intl` 的 `useTranslations`

**优先级**: 🟢 低

---

## 📊 性能优化优先级总结

### 立即修复（本周）
1. ✅ 修复 `BoneVisualizer` 中的 Vector3 对象创建
2. ✅ 修复 `CameraController` 中的 Vector3 对象创建
3. ✅ 修复 `DebugHelpers` 中的 Vector3 对象创建

### 短期优化（本月）
4. 添加 `React.memo` 到所有 Three.js 组件
5. 移除/条件化所有 `console.log`
6. 添加 `// PERF:` 注释到性能敏感代码
7. 将硬编码坐标值移到配置文件

### 长期优化（季度）
8. 拆分大文件（VRMAvatar.tsx）
9. 添加错误边界
10. 改进类型安全
11. 完善国际化

---

## 🔍 代码规范检查清单

### 每次 Commit 前检查

- [ ] 没有在 `useFrame` 中创建新对象
- [ ] 没有在动捕循环中使用 `console.log`
- [ ] 性能敏感代码有 `// PERF:` 注释
- [ ] Three.js 组件使用 `React.memo`
- [ ] 没有硬编码坐标值（或已移到配置）
- [ ] 所有 Three.js 对象有清理逻辑
- [ ] 通过 TypeScript 类型检查
- [ ] 通过 ESLint 检查

---

## 📝 具体修复示例

### 示例 1: 修复 BoneVisualizer 性能问题

**修复前**:
```typescript
useFrame(() => {
  const parentWorldPos = parent.getWorldPosition(new Vector3());
  const childWorldPos = child.getWorldPosition(new Vector3());
  const direction = new Vector3().subVectors(childWorldPos, parentWorldPos);
  // ...
});
```

**修复后**:
```typescript
// PERF: 使用 ref 复用 Vector3 对象，避免每帧创建
const tmpVec3_1 = useRef(new Vector3());
const tmpVec3_2 = useRef(new Vector3());
const tmpVec3_3 = useRef(new Vector3());

useFrame(() => {
  const parentWorldPos = parent.getWorldPosition(tmpVec3_1.current);
  const childWorldPos = child.getWorldPosition(tmpVec3_2.current);
  const direction = tmpVec3_3.current.subVectors(childWorldPos, parentWorldPos);
  // ...
});
```

### 示例 2: 添加 React.memo

**修复前**:
```typescript
export const VRMAvatar = forwardRef<Group, VRMAvatarProps>(({ ... }, ref) => {
  // ...
});
```

**修复后**:
```typescript
export const VRMAvatar = React.memo(
  forwardRef<Group, VRMAvatarProps>(({ ... }, ref) => {
    // ...
  })
);
```

### 示例 3: 条件化 console.log

**修复前**:
```typescript
console.log('VRMAvatar: 检查动画状态', { ... });
```

**修复后**:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('VRMAvatar: 检查动画状态', { ... });
}
```

---

## 🎯 性能目标

根据 `.cursorrules` 要求：

- ✅ 动捕运行在 60fps
- ⚠️ 模型加载时间 < 3 秒（需要测试）
- ⚠️ 内存使用稳定（需要监控）
- ⚠️ 帧率波动 < 10%（需要测试）

---

**最后更新**: 2024年





