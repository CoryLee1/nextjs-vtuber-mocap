# VRM 调试工具

本目录包含用于调试和分析 VRM 模型的工具。

## 文件说明

### `vrm-info-extractor.ts`

提取 VRM 模型信息：
- 骨骼结构（名称、节点名、父子关系、位置）
- BlendShape/Expression 列表
- 模型版本（0.x 或 1.0）

### `use-vrm-info-logger.ts`

React Hook，自动提取并保存 VRM 信息：
- 在 VRM 加载后自动执行
- 可选择保存为 JSON 文件
- 在控制台输出详细信息

## 使用方法

### 自动保存（已集成到 VRMAvatar）

在开发环境中，VRM 模型加载后会自动保存信息到 JSON 文件。

### 手动使用

```typescript
import { extractVRMInfo, saveVRMInfoToJSON } from '@/lib/vrm/debug/vrm-info-extractor';

// 提取信息
const info = extractVRMInfo(vrm);

// 保存为 JSON 文件
if (info) {
  saveVRMInfoToJSON(info, 'my-vrm-info.json');
}
```

## JSON 文件结构

```json
{
  "version": "1.0",
  "bones": {
    "available": [
      {
        "name": "head",
        "nodeName": "Head",
        "parentName": "Neck",
        "position": { "x": 0, "y": 1.5, "z": 0 }
      }
    ],
    "missing": ["upperChest"],
    "hasEyeBones": true,
    "hasFingerBones": true
  },
  "expressions": {
    "available": ["happy", "sad", "blinkLeft"],
    "missing": ["surprised"],
    "type": "expression"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## LookAt 相关脚本

查看以下文件了解 LookAt 实现：

1. **`src/hooks/use-vrm-lookat.ts`** - LookAt Hook 主实现
   - 控制头部骨骼旋转
   - 支持叠加模式（additive）
   - 应用旋转限制（Yaw、Pitch、Roll）

2. **`src/components/dressing-room/VRMAvatar.tsx`** (约 790 行)
   - 调用 `useVRMLookAt` hook
   - 配置 LookAt 参数

3. **`src/components/dressing-room/CameraController.tsx`**
   - 相机控制器
   - 自动跟踪 VRM 头部（可选）

## 动画叠加问题

如果遇到 LookAt 与动画叠加的问题，请查看：

- `src/hooks/use-vrm-lookat.ts` 中的 `additive` 模式实现（约 160-185 行）
- `src/components/dressing-room/VRMAvatar.tsx` 中的 LookAt 配置（约 790 行）

当前实现使用四元数乘法进行叠加，可能需要根据动画系统的实现方式调整。





