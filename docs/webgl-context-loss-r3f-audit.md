# WebGL Context Lost 与 R3F 审计

> 2026-03-08 基于当前 main 分支的 R3F/WebGL 风险点与防护梳理，便于排查崩溃与后续优化。

## 1. 概述

### 1.1 WebGL Context Lost 常见原因

- **GPU 资源耗尽**：显存/上下文数量超限（浏览器通常限制 8–16 个 WebGL 上下文）
- **驱动/系统回收**：长时间运行、休眠、多标签页、GPU 进程崩溃
- **单帧负载过大**：大分辨率 readPixels、复杂后处理、大量 draw call 或纹理
- **多 Canvas 同时活跃**：多个 R3F Canvas 同时渲染，增加显存与上下文压力
- **在渲染循环内分配对象**：每帧 `new Vector3()` 等导致 GC 压力，间接增加卡顿与丢失风险

### 1.2 本项目 R3F 架构要点

- **主 Canvas**：由 `Canvas3DProvider` 在 layout 层创建，单例、持久化，内部为 `SceneManager` → `MainScene`（VRMAvatar、光照、后处理、截帧等）。
- **第二/第三 Canvas**：引导页 `OnboardingModelPreview` 内嵌独立 Canvas；`PixelTrail`（以及 blocks 内 `PixelTrail`）可能再开一层 Canvas。主场景通过 `isOnboardingActive` 在引导页显示时**不渲染 VRMAvatar**，避免两个 Canvas 争用同一 VRM 实例，但**仍存在多 WebGL 上下文同时存在**的情况。

---

## 2. 现有防护

| 机制 | 位置 | 作用 |
|------|------|------|
| **useWebGLContextGuard** | `src/hooks/use-webgl-context-guard.ts` | 在 R3F 树内监听 `webglcontextlost`（preventDefault）、`webglcontextrestored`；更新 store；60 秒内 ≥3 次丢失时触发 `triggerQualityDegradation()` |
| **ContextLostOverlay** | `Canvas3DProvider.tsx` | 当 `webglContextLost === true` 时全屏显示“WebGL 上下文丢失，正在恢复…” |
| **CanvasErrorBoundary** | `Canvas3DProvider.tsx` | 捕获 WebGL 创建/运行时错误，避免白屏，提供重试 |
| **延迟挂载 Canvas** | `Canvas3DProvider.tsx` | 单 rAF 后再挂载 Canvas，降低“DOM 未就绪导致创建上下文失败”的概率 |
| **降质策略** | store + usePerformance | 多次丢失后关闭后处理、降低分辨率等，减轻 GPU 压力 |

---

## 3. 风险点与相关脚本/渲染逻辑

### 3.1 多 Canvas（易导致上下文数量与显存压力）

| 来源 | 文件 | 说明 |
|------|------|------|
| 主场景 | `Canvas3DProvider` → 单 Canvas | 主 3D 场景、VRM、后处理、截帧 |
| 引导页预览 | `OnboardingModelPreview.tsx` → `PreviewCanvasInner` | 独立 `<Canvas>`，`frameloop="always"`，加载 VRM + FBX 预览；与主场景通过 `isOnboardingActive` 互斥渲染 VRM，但**两个 WebGL 上下文可同时存在** |
| 手部轨迹特效 | `src/components/effects/PixelTrail.tsx` | 独立 `<Canvas>`，轻量（alpha、无 AA、无 depth），用于轨迹层 |
| Blocks 动画 | `src/blocks/Animations/PixelTrail/PixelTrail.tsx` | 若与主应用同屏使用，会再增加一个 Canvas |

**建议**：  
- 引导页关闭时尽快卸载 `OnboardingModelPreview` 的 Canvas，避免长时间双上下文。  
- PixelTrail 类特效若与主场景可合并为同一 Canvas 内的一层（例如主 Canvas 内叠加透明层），可减少上下文数量。

### 3.2 readPixels 与截帧（Context Lost 时必败）

| 位置 | 文件 | 行为 |
|------|------|------|
| **TakePhotoCapture** | `SceneManager.tsx` | 在 `useFrame(..., 2)` 中响应 `takePhotoRequest`：`gl.getContext()` → `readPixels` → 创建 `Uint8Array`、离屏 canvas、`createImageData`、`toBlob`。若此时 context 已丢失，`readPixels` 会抛错或行为未定义。 |

**现状**：整段逻辑已包在 `try/catch`，静默失败，UI 可通过 `lastCaptureBlobUrl` 未变化判断失败。

**建议**：在调用 `readPixels` 前增加 `isContextLost()` 检查（见下文「改进建议」），避免在已知丢失状态下调用 WebGL API。

### 3.3 useFrame 内分配与每帧逻辑

| 组件 | 文件 | 说明 |
|------|------|------|
| **VRMController** | `VRMController.tsx` | 模块级 Vector3/Quaternion/Euler 池，useFrame 内仅复用，**无每帧分配** ✅ |
| **BoneVisualizer** | `BoneVisualizer.tsx` | useFrame 内用 `tmpVec3_1`～`tmpVec3_6`（useRef）复用，**无每帧分配** ✅ |
| **DebugHelpers（手臂箭头）** | `DebugHelpers.tsx` | useFrame 内用 ref 复用 Vector3，**无每帧分配** ✅ |
| **MainScene** | `MainScene.tsx` | HandTrailEffect 使用模块级 `_tmpHandVec`；头部位置、Gizmo 同步均用 ref，**无每帧分配** ✅ |
| **ConstellationParticles** | `ConstellationParticles.tsx` | useFrame 内只写已有 geometry 的 position 数组和 material.opacity，**无新建对象** ✅ |
| **SimpleArmAxes** | `DebugHelpers.tsx` | **在 render 中**对每根骨骼 `bone.getWorldPosition(new Vector3())`，若开启“手臂坐标系”且父组件频繁重渲染，会在渲染阶段产生较多短命对象；建议改为 ref 复用或 useMemo 缓存位置再参与 JSX。 |
| **createTextLabel** | `DebugHelpers.tsx` | 内部 `document.createElement('canvas')`、`CanvasTexture`、`Sprite`；若在 render 或 map 中调用会重复创建纹理/对象。当前仅定义，若将来在列表/每帧中使用需避免在渲染路径内调用。 |

### 3.4 后处理与 Shadow（崩溃/未定义行为，非严格 context lost）

| 位置 | 说明 |
|------|------|
| **EffectComposer + postprocessing** | `MainScene.tsx` 中当 `perfSettings.postProcessing && postProcessingEnabled` 时使用 `EffectComposer`（ChromaticAberration、BrightnessContrast、HueSaturation）。若关闭阴影但某些 pass 仍访问 shadow 相关 uniform（如 shadowBias），会报错或未定义。 |
| **DirectionalLight shadow** | 已按 `perfSettings.shadows` 控制 `castShadow`，并为 directionalLight 设置 `shadow-bias` / `shadow-normalBias`，与 postprocessing 兼容。 |

保持「阴影开关」与「后处理中对 shadow 的访问」一致，可避免此类崩溃。

### 3.5 资源释放与 dispose

- **VRM 切换/卸载**：`use-scene-store` 的 `setVRMModel` 与 VRMAvatar 内对 `disposeCurrentVRM()` 已包 try/catch，避免 dispose 抛错导致状态不一致。  
- **场景卸载**：主 Canvas 不随路由卸载，因此不会因频繁创建/销毁 WebGL 上下文而触发 context lost；第二 Canvas（引导、PixelTrail）在组件卸载时会销毁对应上下文，属预期行为。

---

## 4. 改进建议（可选）

1. **TakePhotoCapture**  
   在 `readPixels` 前检查 context 是否已丢失，避免无意义调用与异常：  
   - 从 `gl.getContext()` 取得 WebGL2 上下文后，若存在 `isContextLost()` 且为 `true`，则直接 `setTakePhotoRequest(null)` 并 return，不执行 `readPixels`。

2. **SimpleArmAxes**  
   将 `bone.getWorldPosition(new Vector3())` 改为使用 ref 复用的 Vector3，或在非渲染路径（如 useFrame）中更新位置并存入 ref/state，再用于 JSX，避免在 render 中每骨每帧分配。

3. **多 Canvas 策略**  
   - 产品上确保引导页关闭后尽快卸载预览 Canvas。  
   - 若未来将 PixelTrail 等特效并入主 Canvas 的一层，可减少 WebGL 上下文数量，降低 context 数量触顶风险。

4. **文档与排查**  
   - 出现“黑屏/闪退”时，除查看 `[WebGLContextGuard] context lost` 日志外，可检查：  
     - 是否同时打开引导页 + 主场景 + 其他含 Canvas 的页面；  
     - 是否在低端设备或高 DPR 下开启后处理与阴影；  
     - 最近是否频繁切换 VRM 或加载大模型。  
   - 本审计文档与 `scene-loading-optimization.md`、`use-webgl-context-guard.ts` 一并作为排查与优化依据。

---

## 5. 相关文件索引

| 类型 | 路径 |
|------|------|
| Context 守卫 | `src/hooks/use-webgl-context-guard.ts` |
| Canvas 与错误边界 | `src/providers/Canvas3DProvider.tsx` |
| 主场景与截帧 | `src/components/canvas/SceneManager.tsx`，`src/components/canvas/scenes/MainScene.tsx` |
| 引导页预览 Canvas | `src/components/dressing-room/OnboardingModelPreview.tsx` |
| 手部轨迹 Canvas | `src/components/effects/PixelTrail.tsx`，`src/blocks/Animations/PixelTrail/PixelTrail.tsx` |
| useFrame/渲染逻辑 | `VRMController.tsx`，`VRMAvatar.tsx`，`BoneVisualizer.tsx`，`DebugHelpers.tsx`，`MainScene.tsx`，`ConstellationParticles.tsx` |
| 场景加载与优化 | `docs/scene-loading-optimization.md` |
