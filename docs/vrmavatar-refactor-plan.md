# VRMAvatar.tsx 重构拆分计划

**目标**: 将 VRMAvatar.tsx (1161 行) 拆分为多个模块，但**绝对不改变任何功能表达**

**原则**: 
- ✅ 保持所有现有功能完全不变
- ✅ 保持所有接口和行为一致
- ✅ 只改变代码组织，不改变逻辑
- ✅ 确保可以逐步迁移，每一步都可以测试

---

## 📋 功能分析（保持所有功能）

### VRMAvatar.tsx 当前功能清单

1. **模型加载和缓存**
   - ✅ `useGLTF` 调用
   - ✅ 模型缓存到 store
   - ✅ 错误处理
   - ✅ 加载状态管理

2. **动画管理**
   - ✅ `useAnimationManager` 集成
   - ✅ 模式切换（idle/mocap）
   - ✅ 动画播放控制

3. **动捕数据处理**
   - ✅ MediaPipe 回调处理
   - ✅ `Face.solve()` 处理
   - ✅ `Pose.solve()` 处理
   - ✅ `Hand.solve()` 处理
   - ✅ 数据缓存（useRef）

4. **骨骼操作**
   - ✅ 骨骼名称映射（boneNameMap）
   - ✅ 骨骼旋转（rotateBone）
   - ✅ 坐标转换
   - ✅ 表情插值（lerpExpression）

5. **渲染逻辑**
   - ✅ 3D 场景渲染
   - ✅ 骨骼可视化（BoneVisualizer）
   - ✅ 调试工具渲染

6. **UI 组件**
   - ✅ ModelLoadingIndicator

7. **性能监控**
   - ✅ 性能检查点
   - ✅ 性能警告

8. **调试支持**
   - ✅ 调试信息收集
   - ✅ 回调注册

---

## 🔄 拆分方案（保持功能不变）

### 阶段 1: 提取独立组件（最安全）

#### 1.1 提取 ModelLoadingIndicator ✅
- **文件**: `src/components/ui/ModelLoadingIndicator.tsx`
- **功能**: 完全提取，保持接口一致
- **影响**: 无，只是移动代码
- **测试**: 验证加载状态显示正常

#### 1.2 提取 BoneVisualizer ✅
- **文件**: `src/components/dressing-room/BoneVisualizer.tsx`
- **功能**: 完全提取，保持 props 接口
- **影响**: 无，已经是独立组件
- **测试**: 验证骨骼可视化显示正常

---

### 阶段 2: 提取工具函数和常量（安全）

#### 2.1 提取骨骼名称映射表
- **文件**: `src/lib/vrm/bone-mapping.ts`
- **功能**: 导出 boneNameMap 常量
- **影响**: 无，只是提取常量
- **测试**: 验证骨骼映射仍然正确

#### 2.2 提取性能监控工具
- **文件**: `src/lib/utils/performance-monitor.ts`
- **功能**: 导出 createPerformanceMonitor
- **影响**: 无，只是提取工具函数
- **测试**: 验证性能监控仍然工作

---

### 阶段 3: 提取业务逻辑到 Hooks（需要小心）

#### 3.1 提取骨骼控制逻辑
- **文件**: `src/hooks/use-vrm-bone-control.ts`
- **功能**: 
  - `mapBoneName` 函数
  - `rotateBone` 函数
  - `lerpExpression` 函数
- **保持**: 所有函数签名和行为完全一致
- **测试**: 验证骨骼旋转和表情仍然正确

#### 3.2 提取动捕数据处理
- **文件**: `src/hooks/use-vrm-mocap-pipeline.ts`
- **功能**:
  - MediaPipe 回调处理
  - Face/Pose/Hand 数据处理
  - 数据缓存（useRef）
- **保持**: 所有数据处理逻辑完全一致
- **测试**: 验证动捕数据仍然正确应用

---

### 阶段 4: 重构组件结构（最后步骤）

#### 4.1 创建容器组件
- **文件**: `src/components/dressing-room/VRMAvatarContainer.tsx`
- **功能**: 整合所有 Hooks，管理状态
- **保持**: 所有 props 接口完全一致

#### 4.2 创建纯渲染组件
- **文件**: `src/components/dressing-room/VRMAvatar3D.tsx`
- **功能**: 只负责 3D 渲染
- **保持**: 接收处理好的数据，渲染结果一致

---

## ✅ 拆分步骤（逐步执行）

### 步骤 1: 提取 ModelLoadingIndicator（最安全）✅ **已完成**

**文件**: `src/components/ui/ModelLoadingIndicator.tsx`

**变更**: 
- 提取了独立的 UI 组件
- 在 VRMAvatar.tsx 中导入使用

**测试**: 验证加载状态显示正常

---

### 步骤 2: 提取 BoneVisualizer（安全）✅

BoneVisualizer 已经是独立组件，只需确保导出正确。

---

### 步骤 3: 提取常量（安全）✅ **已完成**

**文件**: `src/lib/vrm/bone-mapping.ts`

**变更**:
- 提取了 `VRM_BONE_NAME_MAP` 常量
- 提取了 `mapBoneName` 函数
- 在 VRMAvatar.tsx 中导入使用

**测试**: 验证骨骼映射仍然正确

---

### 步骤 4: 提取性能监控（安全）✅ **已完成**

**文件**: `src/lib/utils/performance-monitor.ts`

**变更**:
- 提取了 `createPerformanceMonitor` 函数
- 在 VRMAvatar.tsx 中导入使用

**测试**: 验证性能监控仍然工作

---

### 步骤 5: 提取骨骼控制 Hook（需要小心）

```typescript
// src/hooks/use-vrm-bone-control.ts
export function useVRMBoneControl(vrm: VRM | null) {
  // 提取 mapBoneName, rotateBone, lerpExpression
  // 保持所有逻辑完全一致
  
  return {
    mapBoneName,
    rotateBone,
    lerpExpression,
  };
}
```

**在 VRMAvatar.tsx 中**:
```typescript
import { useVRMBoneControl } from '@/hooks/use-vrm-bone-control';

const { mapBoneName, rotateBone, lerpExpression } = useVRMBoneControl(vrm);
```

**测试**: 验证骨骼旋转和表情仍然正确

---

### 步骤 6: 提取动捕管道 Hook（需要小心）

```typescript
// src/hooks/use-vrm-mocap-pipeline.ts
export function useVRMMocapPipeline(vrm: VRM | null) {
  // 提取 resultsCallback
  // 保持所有数据处理逻辑完全一致
  
  return {
    resultsCallback,
    riggedFace,
    riggedPose,
    riggedLeftHand,
    riggedRightHand,
    blinkData,
  };
}
```

**在 VRMAvatar.tsx 中**:
```typescript
import { useVRMMocapPipeline } from '@/hooks/use-vrm-mocap-pipeline';

const mocapPipeline = useVRMMocapPipeline(vrm);
const { resultsCallback, riggedFace, riggedPose, ... } = mocapPipeline;
```

**测试**: 验证动捕数据仍然正确应用

---

## 🎯 执行计划

### 阶段 1: 安全提取（不改变任何逻辑）✅ **已完成**
1. ✅ 提取 ModelLoadingIndicator → `src/components/ui/ModelLoadingIndicator.tsx`
2. ✅ 提取常量（boneNameMap） → `src/lib/vrm/bone-mapping.ts`
3. ✅ 提取性能监控工具 → `src/lib/utils/performance-monitor.ts`

**结果**: VRMAvatar.tsx 从 1161 行减少到 **1097 行**（减少 64 行）

### 阶段 2: 提取业务逻辑（保持功能一致）
4. ⚠️ 提取骨骼控制逻辑
5. ⚠️ 提取动捕数据处理

### 阶段 3: 重构组件（最后步骤）
6. ⚠️ 创建容器组件（可选）
7. ⚠️ 创建纯渲染组件（可选）

---

## ⚠️ 注意事项

1. **每一步都要测试**: 确保功能完全不变
2. **保持接口一致**: 所有函数签名和 props 都要保持一致
3. **逐步迁移**: 不要一次性改变太多
4. **保持向后兼容**: 确保现有代码仍然可以工作
5. **文档更新**: 更新相关文档和注释

---

## 📝 测试 checklist

每一步拆分后都需要验证：

- [ ] 模型加载正常
- [ ] 动画播放正常
- [ ] 动捕数据应用正常
- [ ] 骨骼旋转正确
- [ ] 表情同步正确
- [ ] 手部追踪正确
- [ ] 性能监控正常
- [ ] 调试工具正常
- [ ] UI 显示正常

---

## 🔄 回滚方案

如果任何步骤出现问题：
1. 立即回滚到上一步
2. 检查功能差异
3. 修复问题后再继续

