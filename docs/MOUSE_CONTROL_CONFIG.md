# 鼠标控制配置文件说明

## 关键文件

### 1. CameraController.tsx - 主要的鼠标控制配置
**位置**: `src/components/dressing-room/CameraController.tsx`

这是控制鼠标交互的核心文件，使用 OrbitControls 实现旋转、缩放和平移。

#### 关键参数说明：

**流畅度相关：**
- `enableDamping`: 启用阻尼效果，让控制更平滑（当前: `true`）
- `dampingFactor`: 阻尼系数，越小越平滑但响应越慢（当前: `0.1`，可调范围: 0.01-0.5）
  - 推荐值：0.05-0.15（更丝滑）
  - 注意：值太小会导致拖拽后继续滑动很久才停下

**速度相关：**
- `rotateSpeed`: 旋转速度（当前: `0.3`，可调范围: 0.1-2.0）
  - 推荐值：0.2-0.5（更丝滑）
- `zoomSpeed`: 缩放速度（当前: `0.5`，可调范围: 0.1-2.0）
  - 推荐值：0.3-0.8（更丝滑）
- `panSpeed`: 平移速度（当前: `0.5`，可调范围: 0.1-2.0）
  - 推荐值：0.3-0.8（更丝滑）

**限制相关：**
- `minDistance`: 最小缩放距离（当前: `1.5`）
- `maxDistance`: 最大缩放距离（当前: `15`）
- `minPolarAngle`: 最小垂直角度（当前: `0`，即头顶）
- `maxPolarAngle`: 最大垂直角度（当前: `Math.PI / 2`，即水平）

**其他：**
- `target`: 旋转中心点（当前: `[0, 0.5, 0]`）
- `enablePan`: 是否允许平移（当前: `true`）
- `enableZoom`: 是否允许缩放（当前: `true`）
- `enableRotate`: 是否允许旋转（当前: `true`）

### 2. Canvas3DProvider.tsx - Canvas 性能配置
**位置**: `src/providers/Canvas3DProvider.tsx`

影响整体渲染性能，间接影响鼠标控制的流畅度。

#### 关键参数：

**DPR（设备像素比）:**
- `calculateDPR()` 函数控制渲染分辨率
- `maxDPR`: 最大 DPR（当前: `1.5`）
  - 降低此值可以提升性能（更流畅）
  - 推荐值：1.0-2.0

**WebGL 配置：**
- `antialias`: 抗锯齿（当前: `true`）
  - 关闭可以提升性能但会有锯齿
- `powerPreference`: 性能偏好（当前: `'high-performance'`）

### 3. MainScene.tsx - 场景配置
**位置**: `src/components/canvas/scenes/MainScene.tsx`

场景中传递给 CameraController 的配置。

---

## 优化建议

### 提升流畅度的调整方向：

1. **降低阻尼系数**（更平滑的惯性效果）
   ```tsx
   dampingFactor={0.05}  // 从 0.1 降低到 0.05
   ```

2. **调整旋转速度**（找到适合的手感）
   ```tsx
   rotateSpeed={0.25}  // 从 0.3 降低到 0.25
   ```

3. **降低 DPR**（提升性能）
   ```tsx
   const maxDPR = 1.0;  // 从 1.5 降低到 1.0
   ```

4. **关闭抗锯齿**（如果性能仍然不足）
   ```tsx
   antialias: false
   ```

### 提升响应速度的调整方向：

1. **增加阻尼系数**（更快的停止）
   ```tsx
   dampingFactor={0.15}  // 从 0.1 增加到 0.15
   ```

2. **增加速度参数**（更快的移动）
   ```tsx
   rotateSpeed={0.5}  // 从 0.3 增加到 0.5
   ```

---

## 快速调整指南

**如果感觉拖拽后有延迟：**
- 增加 `rotateSpeed` (0.4-0.6)
- 增加 `dampingFactor` (0.12-0.18)

**如果感觉不够平滑：**
- 降低 `dampingFactor` (0.05-0.08)
- 降低 `rotateSpeed` (0.2-0.25)

**如果感觉卡顿：**
- 降低 `maxDPR` (1.0)
- 关闭 `antialias`
- 检查是否有其他性能问题



