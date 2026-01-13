# LookAt 相关脚本说明

本文档列出所有与 LookAt（视线追踪）功能相关的脚本文件。

## 核心文件

### 1. `src/hooks/use-vrm-lookat.ts`

**作用**：LookAt Hook 主实现

**功能**：
- 让 VRM 头部骨骼平滑地看向目标（通常是相机）
- 应用旋转限制（Yaw ±90°, Pitch ±30°, Roll 0°）
- 使用 quaternion slerp 平滑插值
- 支持叠加模式（additive），可与动画叠加

**关键代码位置**：
- 第 34-46 行：Hook 定义和参数
- 第 68-170 行：`useFrame` 循环，计算和应用头部旋转
- 第 160-185 行：**叠加模式实现**（关键部分）

**叠加模式逻辑**：
```typescript
if (additive) {
  // 叠加模式：将 LookAt 旋转叠加到当前旋转（动画）上
  const additiveRotation = currentRotation.clone().multiply(targetQuaternionRef.current);
  currentRotation.slerp(additiveRotation, smoothness * 0.5);
  headBone.quaternion.copy(currentRotation);
}
```

### 2. `src/components/dressing-room/VRMAvatar.tsx`

**作用**：VRM 组件主文件

**相关代码位置**：
- 第 11 行：导入 `useVRMLookAt`
- 第 788-797 行：**调用 LookAt Hook**
  ```typescript
  useVRMLookAt(vrm, camera, {
    enabled: true,
    smoothness: 0.1,
    maxYaw: Math.PI / 2,
    maxPitch: Math.PI / 6,
    maxRoll: 0,
    updateInterval: 1,
    additive: true, // ✅ 叠加模式
  });
  ```
- 第 1029 行：`vrm.update(delta)` - VRM 更新（在动画之后）

**动画相关代码**：
- 第 815-823 行：idle 动画模式
- 第 819 行：`updateAnimation(delta)` - 更新动画
- 第 1029 行：`vrm.update(delta)` - VRM 更新

### 3. `src/components/dressing-room/CameraController.tsx`

**作用**：相机控制器（可选，用于自动跟踪头部）

**相关代码位置**：
- 第 73-144 行：自动跟踪 VRM 头部骨骼（水平方向）
- 相机跟随头部位置，但不影响 LookAt 功能

## 动画叠加问题

### 当前实现

当前使用 **四元数乘法** 进行叠加：
```typescript
const additiveRotation = currentRotation.clone().multiply(targetQuaternionRef.current);
currentRotation.slerp(additiveRotation, smoothness * 0.5);
```

### 问题分析

1. **执行顺序**：
   - `useVRMLookAt` Hook 在独立的 `useFrame` 中运行
   - 动画更新也在 `useFrame` 中运行
   - 执行顺序可能不确定

2. **叠加方式**：
   - 当前使用四元数乘法（`current * target`）
   - 可能需要根据动画系统的实现方式调整

3. **权重控制**：
   - 当前使用 `smoothness * 0.5`（约 5% 权重）
   - 可能需要调整权重或叠加方式

### 建议的询问方向

当询问动画叠加问题时，可以提到：

1. **当前实现**：
   - 使用四元数乘法进行叠加
   - 在 `useFrame` 中应用（执行顺序不确定）
   - 使用较小权重（5%）避免覆盖动画

2. **具体问题**：
   - LookAt 应该在动画更新之后应用吗？
   - 四元数乘法是正确的叠加方式吗？
   - 是否需要保存动画的基础旋转，然后在此基础上叠加？

3. **参考信息**：
   - VRM 使用 `AnimationMixer` 更新动画
   - 动画通过 `vrm.update(delta)` 应用
   - 头部骨骼旋转在动画和 LookAt 之间共享

## 调试工具

### VRM 信息提取器

位置：`src/lib/vrm/debug/`

- `vrm-info-extractor.ts` - 提取 VRM 骨骼和表情信息
- `use-vrm-info-logger.ts` - 自动保存 VRM 信息为 JSON

在开发环境中，VRM 信息会自动保存到下载文件夹。

## 相关资源

- Three.js AnimationMixer: https://threejs.org/docs/#api/en/animation/AnimationMixer
- Quaternion 叠加: https://threejs.org/docs/#api/en/math/Quaternion
- VRM 规范: https://vrm.dev/





