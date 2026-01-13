# VRM 脸部朝向相机控制脚本清单

本文档列出所有控制 VRM 模型脸部朝向相机的相关脚本文件。

---

## 📁 核心脚本文件

### 1. **`src/hooks/use-vrm-lookat.ts`** ⭐ 主要实现

**功能**：VRM LookAt 控制器核心逻辑

**关键函数**：

#### `createVRMLookAtUpdater()` - 手动调用版本（当前使用）
- **位置**：第 40-163 行
- **作用**：创建 LookAt 更新器，返回 `{ update: () => void }` 对象
- **调用方式**：在 `useFrame` 中手动调用 `lookAtUpdater.update()`
- **关键逻辑**：
  - 获取头部骨骼节点（`head` bone）
  - 计算头部到相机的方向向量
  - 应用旋转限制（Yaw ±90°, Pitch ±30°, Roll 0°）
  - 使用 quaternion slerp 平滑插值
  - **在修改头部旋转后立即调用 `head.updateMatrix()` 和 `head.updateMatrixWorld(true)`**

#### `useVRMLookAt()` - Hook 版本（备用）
- **位置**：第 174-343 行
- **作用**：自动在 `useFrame` 中更新（当前未使用）
- **注意**：如果需要在动画之后应用，应使用 `createVRMLookAtUpdater` 手动调用

**关键代码片段**：
```typescript
// 获取头部骨骼
let headBone: Object3D | null = null;
if (vrm.humanoid?.humanBones?.['head']?.node) {
  headBone = vrm.humanoid.humanBones['head'].node;
} else if (vrm.humanoid && typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
  headBone = vrm.humanoid.getNormalizedBoneNode('head');
}

// 获取相机最新世界坐标
camera.updateMatrixWorld(true);
camera.getWorldPosition(targetPosition);

// 计算方向并应用旋转
// ... (计算逻辑)

// ✅ 关键：立即更新矩阵
headBone.updateMatrix();
headBone.updateMatrixWorld(true);
```

---

### 2. **`src/components/dressing-room/VRMAvatar.tsx`** ⭐ 主组件

**功能**：VRM 角色主组件，集成 LookAt 功能

**关键代码位置**：

#### LookAt 更新器初始化（第 810-831 行）
```typescript
const lookAtUpdaterRef = useRef<ReturnType<typeof createVRMLookAtUpdater> | null>(null);

useEffect(() => {
    if (vrm && camera) {
        // ✅ 显式禁用 VRM 的自动 LookAt 更新
        if (vrm.lookAt && typeof (vrm.lookAt as any).autoUpdate !== 'undefined') {
            (vrm.lookAt as any).autoUpdate = false;
        }
        
        // 创建 LookAt 更新器
        lookAtUpdaterRef.current = createVRMLookAtUpdater(vrm, camera, camera, {
            enabled: true,
            smoothness: 0.15,
            maxYaw: Math.PI / 2, // ±90度
            maxPitch: Math.PI / 6, // ±30度
            maxRoll: 0,
            additive: false, // 直接覆盖动画
        });
    }
}, [vrm, camera]);
```

#### LookAt 更新调用（第 1055-1062 行）✅ 关键位置
```typescript
// **最后统一更新VRM（必须在 LookAt 之前更新）**
vrm.update(delta);

// **✅ 关键：在 vrm.update() 之后应用 LookAt**
// 这样可以确保 LookAt 的头部旋转覆盖动画的头部旋转
if (lookAtUpdaterRef.current) {
    lookAtUpdaterRef.current.update();
}
```

**执行顺序**：
1. `updateAnimation(delta)` - 更新动画（idle 模式）
2. 动捕数据处理（mocap 模式）
3. `vrm.update(delta)` - VRM 统一更新
4. **`lookAtUpdaterRef.current.update()`** - LookAt 更新（最后执行，覆盖动画）

---

### 3. **`src/components/dressing-room/VRMController.tsx`** ⚠️ 备用实现

**功能**：VRM 控制器组件（包含自动眨眼、头部追踪、LookAt）

**关键代码位置**：

#### 头部追踪（第 130-195 行）
```typescript
// ========== 2. 头部追踪 (Head Tracking) ==========
if (headTracking && headBoneRef.current) {
  // 获取头部骨骼
  const headBone = headBoneRef.current;
  
  // 计算头部到相机的本地向量
  const headWorldPos = new Vector3();
  headBone.getWorldPosition(headWorldPos);
  
  const cameraWorldPos = new Vector3();
  camera.getWorldPosition(cameraWorldPos);
  
  const direction = cameraWorldPos.clone().sub(headWorldPos).normalize();
  
  // 限制旋转范围：±45度
  const maxRotation = 0.78; // 约 45 度
  
  // 计算目标旋转
  // ... (旋转计算逻辑)
  
  // 使用 lerp 平滑跟随
  headBone.quaternion.slerp(targetQuat, 0.1);
}
```

#### LookAt 实现（第 197-240 行）
```typescript
// ========== 3. 视线追踪 (LookAt) ==========
if (lookAt && vrm.lookAt) {
  const lookAtType = (vrm.lookAt as any).type || 'bone';
  
  if (lookAtType === 'bone') {
    // 调用 VRM 的 lookAt 方法（会自动处理眼球骨骼）
    camera.getWorldPosition(lookAtTargetRef.current);
    vrm.lookAt.lookAt(lookAtTargetRef.current);
  }
}
```

**注意**：在 `VRMAvatar.tsx` 中，`VRMController` 的 `headTracking` 和 `lookAt` 都被设置为 `false`，因为使用了 `createVRMLookAtUpdater` 替代。

---

### 4. **`src/components/dressing-room/CameraController.tsx`** 📷 相机控制

**功能**：相机控制器（可选，用于自动跟踪头部）

**相关代码**：
- 相机自动跟踪 VRM 头部骨骼（水平方向）
- 不影响 LookAt 功能，只是相机跟随角色

---

## 🔄 数据流

```
相机位置 (camera.position)
    ↓
createVRMLookAtUpdater.update()
    ↓
计算头部到相机的方向向量
    ↓
应用旋转限制 (Yaw ±90°, Pitch ±30°)
    ↓
使用 quaternion slerp 平滑插值
    ↓
修改 headBone.quaternion
    ↓
headBone.updateMatrix() + updateMatrixWorld(true)
    ↓
VRM 头部朝向相机 ✅
```

---

## ⚙️ 配置参数

### `createVRMLookAtUpdater` 选项：

```typescript
{
  enabled: true,              // 是否启用
  smoothness: 0.15,           // 平滑度（0-1，越高越平滑）
  maxYaw: Math.PI / 2,        // 左右旋转限制（±90度）
  maxPitch: Math.PI / 6,      // 上下旋转限制（±30度）
  maxRoll: 0,                 // 倾斜限制（0度）
  additive: false,            // 是否叠加模式（false = 覆盖动画）
}
```

---

## 🐛 已知问题和解决方案

### 问题：LookAt 被动画覆盖

**原因**：执行顺序问题，动画在 LookAt 之后更新

**解决方案**：
1. ✅ 将 `lookAtUpdater.update()` 移到 `vrm.update(delta)` **之后**
2. ✅ 设置 `vrm.lookAt.autoUpdate = false`
3. ✅ 在修改头部旋转后立即调用 `head.updateMatrix()`
4. ✅ 确保每一帧都获取相机的最新世界坐标

---

## 📝 相关文件清单

| 文件路径 | 作用 | 关键行数 |
|---------|------|--------|
| `src/hooks/use-vrm-lookat.ts` | LookAt 核心实现 | 40-163 |
| `src/components/dressing-room/VRMAvatar.tsx` | 主组件，调用 LookAt | 810-831, 1055-1062 |
| `src/components/dressing-room/VRMController.tsx` | 备用实现（当前未使用） | 130-240 |
| `src/components/dressing-room/CameraController.tsx` | 相机控制（可选） | - |

---

## 🔍 调试建议

如果 LookAt 不工作，检查：

1. **执行顺序**：确保 `lookAtUpdater.update()` 在 `vrm.update(delta)` 之后
2. **头部骨骼**：确认 `headBone` 不为 `null`
3. **相机坐标**：确认 `camera.getWorldPosition()` 返回正确值
4. **矩阵更新**：确认调用了 `head.updateMatrix()`
5. **autoUpdate**：确认 `vrm.lookAt.autoUpdate = false`

---

## 📚 参考文档

- VRM 规范：https://vrm.dev/
- Three.js Quaternion：https://threejs.org/docs/#api/en/math/Quaternion
- React Three Fiber：https://docs.pmnd.rs/react-three-fiber/


