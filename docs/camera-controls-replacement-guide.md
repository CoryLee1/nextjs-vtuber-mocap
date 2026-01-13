# 使用 drei CameraControls 替换方案

## 可行性分析

### ✅ 可以替换

drei 的 `CameraControls` 基于 `camera-controls` 库，支持：
- 通过 `ref` 访问实例
- 在 `useFrame` 中调用 `setTarget()` 更新目标点
- 支持距离限制（`minDistance`, `maxDistance`）
- 支持触摸手势
- 可自定义鼠标按钮映射

### ⚠️ 需要适配的功能

1. **自动跟踪 VRM 头部骨骼** - 可以在 `useFrame` 中调用 `controlsRef.current.setTarget()`
2. **角度限制** - 可能需要通过其他方式实现（限制 polar angle）
3. **自定义阻尼** - camera-controls 有内置的平滑算法，可能需要调整参数

## 实现方案

### 方案：混合使用

保留自动跟踪逻辑，使用 `CameraControls` 处理用户交互。

```typescript
import { CameraControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { Vector3 } from 'three';
import { useSceneStore } from '@/hooks/use-scene-store';

export function VRCameraController({ vrmRef, enabled = true }) {
  const controlsRef = useRef<CameraControlsImpl>(null);
  const { camera } = useThree();
  const vrmModel = useSceneStore((state) => state.vrmModel);
  const tmpVec3 = useRef(new Vector3());

  // 自动跟踪 VRM 头部骨骼
  useFrame(() => {
    if (!enabled || !controlsRef.current) return;

    const targetVrm = vrmModel || vrmRef?.current?.userData?.vrm;
    
    if (targetVrm?.humanoid) {
      const headBone = targetVrm.humanoid.humanBones?.['head']?.node ||
                       targetVrm.humanoid.getNormalizedBoneNode?.('head');
      
      if (headBone?.getWorldPosition) {
        headBone.getWorldPosition(tmpVec3.current);
        tmpVec3.current.y -= 0.15; // 偏移到脸部
        
        // 更新 CameraControls 的目标点
        controlsRef.current.setTarget(
          tmpVec3.current.x,
          tmpVec3.current.y,
          tmpVec3.current.z,
          true // 平滑过渡
        );
      }
    }
  });

  return (
    <CameraControls
      ref={controlsRef}
      enabled={enabled}
      minDistance={0.5}
      maxDistance={10}
      mouseButtons={{
        left: 0, // ROTATE
        middle: 1, // DOLLY
        right: 2, // TRUCK
        wheel: 1, // DOLLY
      }}
      touches={{
        one: 0, // TOUCH_ROTATE
        two: 5, // TOUCH_DOLLY_TRUCK
      }}
    />
  );
}
```

## 优势对比

| 特性 | 当前实现 | drei CameraControls |
|------|---------|---------------------|
| 代码量 | ~975 行 | ~50 行（核心逻辑） |
| 自动跟踪 | ✅ 支持 | ✅ 支持（通过 useFrame） |
| 触摸支持 | ✅ 完整实现 | ✅ 内置支持 |
| 角度限制 | ✅ 支持 | ⚠️ 需要额外配置 |
| 阻尼控制 | ✅ 精细控制 | ⚠️ 内置平滑算法 |
| 维护成本 | 高 | 低（社区维护） |
| 稳定性 | 自定义实现 | 经过大量项目验证 |

## 建议

### ✅ 推荐替换

**理由**：
1. **代码量减少 90%** - 从 975 行减少到约 50-100 行
2. **更稳定** - camera-controls 是成熟库，经过大量项目验证
3. **维护成本低** - 社区维护，bug 修复及时
4. **功能完整** - 满足大部分需求

**注意事项**：
1. 需要测试角度限制功能
2. 可能需要调整阻尼参数以达到相同的手感
3. 保留自动跟踪逻辑（这是项目的核心功能）

### 实施步骤

1. **第一步**：创建新的 `VRCameraController` 组件（使用 CameraControls）
2. **第二步**：在测试环境中验证所有功能
3. **第三步**：逐步替换，保留旧实现作为备份
4. **第四步**：完全替换后删除旧代码

## 代码示例（完整实现）

参考上面的代码片段，这是完整的实现思路。实际使用时需要：
- 导入 `CameraControlsImpl` 类型
- 处理边界情况
- 添加配置选项
- 保留原有的 API 兼容性





