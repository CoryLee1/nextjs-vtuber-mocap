# VRM 能力检测器和适配器

## 概述

本目录包含 VRM 模型能力检测和动捕数据适配的相关工具。

## 文件说明

### `capabilities.ts`

VRM 模型能力检测器，用于检测：

- VRM 版本（0.x 或 1.0）
- 可用骨骼列表
- 可用 BlendShape/Expression 列表
- 提供统一的表情访问接口（`VRMExpressionAdapter`）

### 使用示例

```typescript
import { detectVRMCapabilities, VRMExpressionAdapter } from '@/lib/vrm/capabilities';

// 检测 VRM 模型能力
const capabilities = detectVRMCapabilities(vrm);

console.log('VRM 版本:', capabilities.version);
console.log('可用骨骼:', capabilities.bones.available);
console.log('缺失骨骼:', capabilities.bones.missing);
console.log('有手指骨骼:', capabilities.bones.hasFingerBones);
console.log('可用表情:', capabilities.expressions.available);

// 使用表情适配器（自动适配 0.x 和 1.0）
const expressionAdapter = new VRMExpressionAdapter(vrm);
expressionAdapter.setValue('happy', 1.0);
expressionAdapter.setValue('blinkLeft', 0.8);
const value = expressionAdapter.getValue('happy');
```

## 相关文件

- `src/lib/mocap/vrm-adapter.ts` - VRM 动捕数据适配器





