# 动画叠加问题分析与解决方案

## 🔍 问题分析

### 当前问题
头部朝向跟随相机（LookAt）被 idle 动画覆盖，无法同时运行。

### 根本原因
1. **执行顺序问题**：`AnimationMixer.update(delta)` 在每帧会覆盖所有骨骼的旋转，包括头部
2. **LookAt 被覆盖**：即使 `useVRMLookAt` 使用了 `additive: true`，但动画更新可能在 LookAt 之后执行，导致旋转被重置

### 当前执行流程（VRMAvatar.tsx）
```typescript
useFrame((_, delta) => {
  // 1. 模式切换
  handleModeSwitch(shouldUseMocap);
  
  // 2. 动画更新（会覆盖头部旋转！）
  if (currentMode === 'idle') {
    updateAnimation(delta); // ← AnimationMixer.update() 在这里覆盖头部旋转
  }
  
  // 3. 动捕数据处理...
  
  // 4. vrm.update(delta)
  vrm.update(delta);
});

// useVRMLookAt 的 useFrame 也在运行（执行顺序不确定）
```

---

## 💡 解决方案（三种方案）

### 方案 1：调整执行顺序（推荐）⭐

**原理**：确保 LookAt 在动画更新之后执行，这样 LookAt 的旋转会覆盖动画的头部旋转。

**实现步骤**：

1. **修改 `useVRMLookAt` 的执行时机**：
   - 不在 hook 内部使用 `useFrame`
   - 改为在 `VRMAvatar` 的 `useFrame` 中**最后**调用

2. **修改文件**：
   - `src/hooks/use-vrm-lookat.ts` - 移除内部的 `useFrame`，改为返回更新函数
   - `src/components/dressing-room/VRMAvatar.tsx` - 在 `useFrame` 的最后调用 LookAt 更新

**优点**：
- ✅ 实现简单
- ✅ 不改变动画系统
- ✅ 性能好

**缺点**：
- ⚠️ 需要修改 hook 的结构

---

### 方案 2：使用动画层（Avatar Mask）概念

**原理**：创建一个只影响身体（不包括头部）的动画层，让头部动画由 LookAt 单独控制。

**实现步骤**：

1. **修改动画剪辑**：在 `animation-manager.ts` 中，创建动画时排除头部骨骼的轨道
2. **或者在播放时设置权重**：使用 `AnimationAction.setEffectiveWeight()` 控制影响范围（Three.js 可能不支持骨骼级别的权重）

**优点**：
- ✅ 理论上最优雅

**缺点**：
- ❌ Three.js 的 `AnimationMixer` 不支持骨骼级别的权重控制
- ❌ 需要修改动画剪辑本身（复杂）

---

### 方案 3：在动画更新后立即应用 LookAt（最简单）

**原理**：在 `updateAnimation` 之后立即应用 LookAt 旋转，确保它在动画更新的同一帧内覆盖。

**实现步骤**：

1. **修改 `VRMAvatar.tsx` 的 `useFrame`**：
   ```typescript
   useFrame((_, delta) => {
     if (currentMode === 'idle') {
       updateAnimation(delta); // 动画更新
       
       // 立即应用 LookAt（在同一帧内覆盖动画）
       applyLookAtRotation(); // ← 需要从 useVRMLookAt 提取这个函数
     }
     
     vrm.update(delta);
   });
   ```

2. **重构 `useVRMLookAt`**：
   - 返回一个 `update` 函数而不是在内部使用 `useFrame`
   - 或者创建一个 `useVRMLookAtManual` hook

**优点**：
- ✅ 执行顺序可控
- ✅ 实现相对简单

**缺点**：
- ⚠️ 需要重构 hook

---

## 🎯 推荐实施方案

**推荐使用方案 1 或方案 3**，因为它们都确保 LookAt 在动画更新之后执行。

---

## 📝 相关脚本位置

### 核心文件
1. **`src/components/dressing-room/VRMAvatar.tsx`** (第 822-1052 行)
   - `useFrame` 循环
   - 包含 `updateAnimation(delta)` 调用
   - 包含 `vrm.update(delta)` 调用

2. **`src/lib/animation-manager.ts`** (第 624-647 行)
   - `updateAnimation` 函数
   - `mixerRef.current.update(delta)` - 这里会覆盖所有骨骼旋转

3. **`src/hooks/use-vrm-lookat.ts`** (第 60-193 行)
   - `useVRMLookAt` hook
   - 内部的 `useFrame` 循环（第 63 行）
   - `additive` 模式逻辑（第 160-176 行）

### 关键代码位置

#### 1. 动画更新（会覆盖头部旋转）
```typescript:624:647:src/lib/animation-manager.ts
const updateAnimation = (delta) => {
  if (animationModeRef.current !== 'idle') {
    return;
  }
  
  if (!mixerRef.current) return;
  
  try {
    mixerRef.current.update(delta); // ← 这里会覆盖所有骨骼，包括头部
    // ...
  } catch (error) {
    console.warn('AnimationManager: 动画更新错误', error);
  }
};
```

#### 2. LookAt Hook（当前实现）
```typescript:60:193:src/hooks/use-vrm-lookat.ts
export function useVRMLookAt(vrm, target, options) {
  // ...
  
  useFrame(() => {
    // 计算并应用 LookAt 旋转
    // additive 模式尝试叠加，但可能被动画覆盖
  });
}
```

#### 3. VRMAvatar 主循环
```typescript:822:1052:src/components/dressing-room/VRMAvatar.tsx
useFrame((_, delta) => {
  // 模式切换
  handleModeSwitch(shouldUseMocap);
  
  // 动画更新（覆盖头部旋转）
  if (currentMode === 'idle') {
    updateAnimation(delta); // ← 执行顺序问题在这里
  }
  
  // ... 动捕数据处理
  
  vrm.update(delta); // 最后更新 VRM
});
```

---

## 🔧 具体实现建议

### 方案 1 实现：重构 useVRMLookAt 为手动调用

**步骤 1：修改 `use-vrm-lookat.ts`**

创建一个返回更新函数的版本：

```typescript
// 新增：手动更新版本
export function useVRMLookAtManual(vrm, target, options) {
  // ... 初始化逻辑 ...
  
  // 返回更新函数，而不是在内部使用 useFrame
  return useCallback(() => {
    // 原来的 useFrame 中的逻辑
    if (!enabled || !vrm) return;
    
    // ... LookAt 计算和应用逻辑 ...
  }, [enabled, vrm, /* ... 其他依赖 ... */]);
}
```

**步骤 2：在 VRMAvatar 中调用**

```typescript
// 在组件顶部
const updateLookAt = useVRMLookAtManual(vrm, camera, {
  enabled: true,
  additive: false, // 改为 false，因为我们确保在动画之后执行
  // ...
});

// 在 useFrame 中
useFrame((_, delta) => {
  if (currentMode === 'idle') {
    updateAnimation(delta);
    updateLookAt(); // ← 在动画更新之后立即调用
  }
  
  vrm.update(delta);
});
```

---

## 📚 参考资源

### Three.js 文档
- [AnimationMixer](https://threejs.org/docs/#api/en/animation/AnimationMixer)
- [AnimationAction](https://threejs.org/docs/#api/en/animation/AnimationAction)
- [AnimationClip](https://threejs.org/docs/#api/en/animation/AnimationClip)

### 相关概念
- **动画叠加（Animation Blending）**：多个动画同时影响同一对象
- **动画层（Animation Layers）**：不同动画影响不同部位
- **执行顺序（Execution Order）**：确保手动旋转在动画更新之后应用

---

## ✅ 检查清单

实施后需要验证：

- [ ] LookAt 在 idle 动画播放时正常工作
- [ ] 头部旋转平滑，没有抖动
- [ ] 动画的其他部分（身体、手臂）不受影响
- [ ] 性能没有明显下降
- [ ] 切换到动捕模式时 LookAt 仍然工作（如果需要）

---

## 🚀 快速修复（临时方案）

如果急需修复，可以临时在 `updateAnimation` 之后保存头部旋转，然后在 `vrm.update` 之前恢复：

```typescript
useFrame((_, delta) => {
  if (currentMode === 'idle') {
    // 保存头部旋转
    const headBone = vrm.humanoid?.getNormalizedBoneNode('head');
    const savedHeadRotation = headBone?.quaternion.clone();
    
    // 更新动画
    updateAnimation(delta);
    
    // 如果 LookAt 已应用，恢复它（需要从 useVRMLookAt 获取）
    // 这个方案不够优雅，但可以作为临时修复
  }
  
  vrm.update(delta);
});
```

---

**下一步**：根据你选择的方案，我可以帮你实现具体的代码修改。


