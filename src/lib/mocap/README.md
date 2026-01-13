# VRM 动捕数据适配器

## 概述

`vrm-adapter.ts` 提供了将 Kalidokit 动捕数据映射到 VRM 模型的适配器类。

## 主要功能

1. **姿势数据映射** - 将 Kalidokit 姿势数据映射到 VRM 骨骼
2. **手部数据映射** - 处理手指骨骼动画
3. **表情数据映射** - 将面部表情映射到 VRM Expressions
4. **降级策略** - 当模型缺少某些骨骼时，自动使用替代骨骼
5. **性能优化** - 骨骼引用缓存、对象池

## 使用示例

```typescript
import { VRMMocapAdapter } from '@/lib/mocap/vrm-adapter';
import type { KalidokitPose, KalidokitHand, KalidokitFace } from '@/lib/mocap/vrm-adapter';

// 创建适配器
const adapter = new VRMMocapAdapter(vrm);

// 获取能力信息
const capabilities = adapter.getCapabilities();
console.log('模型能力:', capabilities);

// 应用姿势数据
const poseData: KalidokitPose = {
  Spine: { x: 0.1, y: 0.2, z: 0.05 },
  LeftUpperArm: { x: 0.5, y: 0.3, z: 0.1 },
  RightUpperArm: { x: 0.5, y: 0.3, z: 0.1 },
  // ... 其他骨骼数据
};

adapter.applyPose(poseData, 0.1); // slerpFactor = 0.1

// 应用手部数据
const handData: KalidokitHand = {
  LeftThumbProximal: { x: 0.2, y: 0.1, z: 0.05 },
  LeftIndexProximal: { x: 0.3, y: 0.2, z: 0.1 },
  // ... 其他手指数据
};

if (capabilities.bones.hasFingerBones) {
  adapter.applyHands(handData, 0.1);
}

// 应用表情数据
const faceData: KalidokitFace = {
  head: { x: 0.1, y: 0.05, z: 0.02 },
  eye: { l: 0.9, r: 0.9 }, // 眨眼值 (1 = 完全睁开)
  mouth: {
    shape: {
      A: 0.5,
      I: 0.3,
      E: 0.2,
      O: 0.4,
      U: 0.1,
    },
  },
};

adapter.applyExpressions(faceData, 0.1); // lerpFactor = 0.1

// 应用头部旋转
adapter.applyHeadRotation(faceData.head, 0.1);

// 清理资源（组件卸载时）
adapter.dispose();
```

## 降级策略

当模型缺少某些骨骼时，适配器会自动使用替代骨骼：

- `chest` 缺失 → 使用 `spine`
- `upperChest` 缺失 → 使用 `chest` → `spine`
- `leftShoulder` 缺失 → 使用 `leftUpperArm`

## 性能优化

- **骨骼缓存** - 骨骼引用在初始化时缓存，避免每帧查找
- **对象池** - 使用对象池复用 `Euler` 和 `Quaternion` 对象
- **快速查找** - 使用 `Set` 快速检查骨骼是否存在

## 相关文件

- `src/lib/vrm/capabilities.ts` - VRM 能力检测器





