# R3F Canvas 持久化架构重构计划

## 📋 当前架构分析

### 现有文件结构

```
[locale]/page.tsx
  └─> VTuberApp.tsx (动态加载，ssr: false)
        ├─> VTuberLayout (UI布局)
        └─> VTuberSceneContainer
              └─> <Canvas> (WebGL上下文)
                    └─> VTuberScene
                          ├─> CameraController
                          ├─> Lighting
                          ├─> GridFloor
                          └─> VRMAvatar (每次重新加载)
```

### 关键问题识别

1. **Canvas 生命周期问题**
   - Canvas 在 `VTuberSceneContainer` 中创建
   - 生命周期绑定在页面路由上
   - 路由切换时 Canvas 被销毁，WebGL 上下文丢失
   - 位置：`src/components/dressing-room/VTuberScene.tsx:285-314`

2. **VRM 模型重复加载**
   - `VRMAvatar` 组件在每次挂载时重新加载模型
   - 没有模型缓存机制
   - 位置：`src/components/dressing-room/VRMAvatar.tsx:166-190`

3. **状态管理分散**
   - 场景状态在 `VTuberApp` 中管理
   - 模型选择在 `use-model-manager.ts` 中
   - 没有统一的场景状态管理
   - 位置：`src/components/dressing-room/VTuberApp.tsx:69-90`

4. **性能配置重复**
   - DPR 计算在 `VTuberSceneContainer` 中
   - 性能设置来自 `use-performance.ts`
   - 位置：`src/components/dressing-room/VTuberScene.tsx:218-235`

### 当前依赖关系

```
VTuberApp
  ├─> useVTuberControls (状态管理)
  ├─> useModelManager (模型管理)
  ├─> usePerformance (性能设置)
  └─> VTuberSceneContainer
        ├─> usePerformance (重复依赖)
        └─> Canvas (WebGL上下文)
```

---

## 🎯 目标架构设计

### 新架构结构

```
[locale]/layout.tsx
  ├─> Canvas3DProvider (始终挂载，固定定位)
  │     └─> <Canvas> (持久化 WebGL 上下文)
  │           └─> SceneManager
  │                 ├─> MainScene (visible={activeScene === 'main'})
  │                 │     ├─> CameraController
  │                 │     ├─> Lighting
  │                 │     ├─> GridFloor
  │                 │     └─> VRMAvatar (使用缓存的模型)
  │                 └─> OtherScenes (可扩展)
  │
  └─> {children} (页面内容，z-index 覆盖在 Canvas 上)
        └─> VTuberApp (只管理 UI，不包含 Canvas)
```

### 状态管理架构

```
use-scene-store.ts (Zustand)
  ├─> activeScene: 'main' | 'settings' | 'hidden'
  ├─> vrmModel: VRM | null (缓存的模型实例)
  ├─> vrmModelUrl: string | null (当前模型URL)
  ├─> animationUrl: string | null
  ├─> cameraSettings: CameraSettings
  ├─> debugSettings: DebugSettings
  └─> Actions:
        ├─> setScene(scene)
        ├─> setVRMModel(model, url)
        ├─> clearVRMModel()
        └─> updateSettings(settings)
```

---

## 📝 详细重构步骤

### 阶段 1：创建核心基础设施

#### 1.1 创建场景状态 Store

**文件**: `src/hooks/use-scene-store.ts`

**职责**:
- 管理场景状态（activeScene）
- 缓存 VRM 模型实例
- 管理场景配置（相机、调试等）

**关键实现**:
```typescript
interface SceneState {
  // 场景控制
  activeScene: 'main' | 'settings' | 'hidden'
  setScene: (scene: SceneState['activeScene']) => void
  
  // VRM 模型缓存
  vrmModel: VRM | null
  vrmModelUrl: string | null
  animationUrl: string | null
  setVRMModel: (model: VRM, url: string) => void
  clearVRMModel: () => void
  
  // 场景配置
  cameraSettings: CameraSettings
  debugSettings: DebugSettings
  updateCameraSettings: (settings: Partial<CameraSettings>) => void
  updateDebugSettings: (settings: Partial<DebugSettings>) => void
}
```

**注意事项**:
- 使用 `zustand` 的 `persist` 中间件缓存模型URL（不缓存模型实例）
- 模型实例只在内存中缓存
- 切换模型时，先 dispose 旧模型再加载新模型

#### 1.2 创建 Canvas Provider

**文件**: `src/providers/Canvas3DProvider.tsx`

**职责**:
- 创建持久化的 Canvas
- 管理 Canvas 配置（DPR、性能设置等）
- 提供调试工具（开发环境）

**关键实现**:
```typescript
export const Canvas3DProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = usePerformance()
  
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        shadows={settings.shadows}
        gl={{ 
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        dpr={calculateDPR(settings)}
      >
        <Suspense fallback={null}>
          <SceneManager />
          {process.env.NODE_ENV === 'development' && (
            <Perf position="top-left" />
          )}
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  )
}
```

**样式说明**:
- `fixed inset-0` - 固定定位，覆盖整个视口
- `-z-10` - 确保在页面内容下方
- `pointer-events-none` - 不拦截鼠标事件，让页面内容可交互

#### 1.3 创建 SceneManager

**文件**: `src/components/canvas/SceneManager.tsx`

**职责**:
- 根据 `activeScene` 决定渲染内容
- 管理场景切换动画
- 协调子场景的显隐

**关键实现**:
```typescript
export const SceneManager: React.FC = () => {
  const activeScene = useSceneStore(state => state.activeScene)
  
  return (
    <>
      <color attach="background" args={['#0036FF']} />
      
      {/* 主场景 */}
      <group visible={activeScene === 'main'}>
        <MainScene />
      </group>
      
      {/* 其他场景可以在这里添加 */}
      {activeScene === 'settings' && <SettingsScene />}
    </>
  )
}
```

**注意事项**:
- 使用 `visible` 属性控制显隐，而非条件渲染
- 保持场景内容始终挂载，避免重新初始化

#### 1.4 创建 MainScene

**文件**: `src/components/canvas/scenes/MainScene.tsx`

**职责**:
- 包含原有的场景内容（灯光、地板、VRM等）
- 从 `VTuberScene.tsx` 迁移内容

**关键实现**:
```typescript
export const MainScene: React.FC = () => {
  const {
    vrmModelUrl,
    animationUrl,
    cameraSettings,
    debugSettings,
  } = useSceneStore()
  
  return (
    <>
      <CameraController {...cameraSettings} />
      <Lighting />
      <GridFloor />
      <VRMAvatar
        modelUrl={vrmModelUrl}
        animationUrl={animationUrl}
        // ... 其他 props
      />
    </>
  )
}
```

---

### 阶段 2：重构现有组件

#### 2.1 修改 Layout

**文件**: `src/app/[locale]/layout.tsx`

**修改内容**:
```typescript
<ThemeProvider>
  <Canvas3DProvider>  {/* 新增 */}
    <PostHogProvider>
      <InternationalizationTracker currentLocale={locale} />
      {children}
      <Toaster />
    </PostHogProvider>
  </Canvas3DProvider>
</ThemeProvider>
```

**注意事项**:
- Canvas3DProvider 应该在 ThemeProvider 内部（可能需要主题相关的配置）
- 确保 Provider 顺序正确

#### 2.2 重构 VTuberApp

**文件**: `src/components/dressing-room/VTuberApp.tsx`

**修改内容**:
- 移除 `VTuberSceneContainer` 的导入和使用
- 移除场景相关的 props 传递
- 保留 UI 组件和状态管理
- 通过 `useSceneStore` 更新场景状态

**关键修改**:
```typescript
// 删除
// import { VTuberSceneContainer } from './VTuberScene';

// 修改场景状态更新
const { setScene, updateCameraSettings, updateDebugSettings } = useSceneStore()

// 删除 sceneProps 和 VTuberSceneContainer 渲染
// 场景现在由 Canvas3DProvider 管理
```

#### 2.3 重构 VTuberScene

**选项 A：完全删除**（推荐）
- 将内容迁移到 `MainScene.tsx`
- 删除 `VTuberScene.tsx` 和 `VTuberSceneContainer`

**选项 B：保留为兼容层**
- 保留 `VTuberScene` 组件，但移除 Canvas
- 只保留场景内容部分
- 由 `MainScene` 调用

**推荐选项 A**，因为：
- 减少代码复杂度
- 避免重复代码
- 架构更清晰

#### 2.4 修改 VRMAvatar

**文件**: `src/components/dressing-room/VRMAvatar.tsx`

**关键修改**:
1. 添加模型缓存逻辑
2. 从 store 读取缓存的模型
3. 如果模型已缓存，直接使用，否则加载

**实现思路**:
```typescript
const VRMAvatar = forwardRef(({ modelUrl, ...props }, ref) => {
  const { vrmModel, vrmModelUrl, setVRMModel, clearVRMModel } = useSceneStore()
  
  // 如果 URL 改变，需要加载新模型
  useEffect(() => {
    if (modelUrl && modelUrl !== vrmModelUrl) {
      // 清除旧模型
      if (vrmModel) {
        clearVRMModel()
      }
      // 加载新模型（在 VRMLoader 中处理）
    }
  }, [modelUrl, vrmModelUrl])
  
  // 使用缓存的模型或加载新模型
  // ...
})
```

#### 2.5 修改 use-model-manager

**文件**: `src/hooks/use-model-manager.ts`

**关键修改**:
- 选择模型时，更新 `useSceneStore` 的 `vrmModelUrl`
- 不直接管理模型实例，由 store 管理

**实现思路**:
```typescript
const selectModel = useCallback((modelId) => {
  setSelectedModelId(modelId)
  const model = getSelectedModel()
  // 更新场景 store 的模型 URL
  useSceneStore.getState().setVRMModelUrl(model.url)
}, [getSelectedModel])
```

---

### 阶段 3：优化和调试工具

#### 3.1 添加 drei 调试工具

**文件**: `src/providers/Canvas3DProvider.tsx`

**添加内容**:
```typescript
import { Perf } from 'r3f-perf'
import { Preload, useProgress } from '@react-three/drei'

// 在 Canvas 内添加
{process.env.NODE_ENV === 'development' && (
  <Perf position="top-left" />
)}
<Preload all />
```

**依赖安装**:
```bash
npm install r3f-perf
```

#### 3.2 添加场景切换动画

**文件**: `src/components/canvas/SceneManager.tsx`

**实现思路**:
- 使用 `useTransition` 或 `gsap` 实现场景切换动画
- 相机位置平滑过渡
- 场景内容淡入淡出

---

## 🔄 数据流变化

### 当前数据流

```
用户操作
  └─> VTuberApp (状态更新)
        └─> VTuberSceneContainer (重新渲染)
              └─> Canvas (重建)
                    └─> VRMAvatar (重新加载模型)
```

### 新数据流

```
用户操作
  └─> VTuberApp (更新 store)
        └─> useSceneStore (状态更新)
              └─> SceneManager (响应状态)
                    └─> MainScene (visible 切换)
                          └─> VRMAvatar (使用缓存模型)
```

---

## 📦 文件创建/修改清单

### 新建文件

1. ✅ `src/hooks/use-scene-store.ts` - 场景状态管理
2. ✅ `src/providers/Canvas3DProvider.tsx` - Canvas Provider
3. ✅ `src/components/canvas/SceneManager.tsx` - 场景管理器
4. ✅ `src/components/canvas/scenes/MainScene.tsx` - 主场景内容

### 修改文件

1. ✅ `src/app/[locale]/layout.tsx` - 添加 Canvas3DProvider
2. ✅ `src/app/[locale]/page.tsx` - 无需修改（VTuberApp 已动态加载）
3. ✅ `src/components/dressing-room/VTuberApp.tsx` - 移除 Canvas，使用 store
4. ✅ `src/components/dressing-room/VTuberScene.tsx` - 删除或重构
5. ✅ `src/components/dressing-room/VRMAvatar.tsx` - 添加模型缓存逻辑
6. ✅ `src/hooks/use-model-manager.ts` - 集成场景 store

### 可选优化文件

1. ⚠️ `src/components/canvas/scenes/SettingsScene.tsx` - 设置场景（未来扩展）
2. ⚠️ `src/components/canvas/utils/scene-transitions.ts` - 场景切换动画工具

---

## ⚠️ 注意事项和风险

### 1. MediaPipe 动捕流程

**风险**: 动捕数据流可能中断

**现状**:
- `CameraWidget` → `useVideoRecognition` → `VRMAvatar.resultsCallback`
- 数据流通过 props 传递

**解决方案**:
- `resultsCallback` 通过 `useSceneStore` 管理
- `VRMAvatar` 从 store 读取 callback
- 确保数据流不中断

### 2. UI 组件交互

**风险**: ControlPanel、CameraWidget 等 UI 组件需要访问场景状态

**解决方案**:
- UI 组件通过 `useSceneStore` 访问状态
- 保持现有的 props 接口（向后兼容）
- 内部实现改为使用 store

### 3. 调试面板

**风险**: ArmDebugPanel 等调试组件依赖场景引用

**解决方案**:
- 调试面板通过 store 访问场景引用
- 或通过 Context 传递引用
- 保持现有调试功能

### 4. 性能影响

**风险**: 持久化 Canvas 可能影响性能

**解决方案**:
- 使用 `visible` 控制场景显隐
- 不活跃的场景暂停渲染（`useFrame` 条件渲染）
- 监控性能指标

### 5. 路由切换

**风险**: 路由切换时 Canvas 可能闪烁

**解决方案**:
- Canvas 在 layout 层级，不受路由影响
- 使用 `Suspense` 处理加载状态
- 预加载关键资源

---

## 🧪 测试计划

### 功能测试

1. ✅ **模型加载**
   - 首次加载模型正常
   - 切换模型时旧模型正确 dispose
   - 模型缓存正常工作

2. ✅ **动捕功能**
   - MediaPipe 数据流正常
   - 面部、身体、手部动捕正常
   - 实时更新无延迟

3. ✅ **场景切换**
   - 场景切换流畅
   - 相机位置正确
   - 无闪烁或卡顿

4. ✅ **路由切换**
   - 切换路由时 Canvas 不重建
   - WebGL 上下文保持
   - 模型状态保持

5. ✅ **UI 交互**
   - ControlPanel 功能正常
   - CameraWidget 功能正常
   - 调试面板功能正常

### 性能测试

1. ✅ **FPS 监控**
   - 使用 `r3f-perf` 监控 FPS
   - 确保不低于 30 FPS
   - 场景切换时 FPS 稳定

2. ✅ **内存监控**
   - 模型切换时内存正确释放
   - 无内存泄漏
   - 长时间运行稳定

3. ✅ **加载时间**
   - 首次加载时间合理
   - 模型缓存后切换快速
   - 无明显的加载延迟

---

## 📅 实施时间表

### 阶段 1：基础设施（2-3小时）
- [ ] 创建 `use-scene-store.ts`
- [ ] 创建 `Canvas3DProvider.tsx`
- [ ] 创建 `SceneManager.tsx`
- [ ] 创建 `MainScene.tsx`

### 阶段 2：重构组件（3-4小时）
- [ ] 修改 `layout.tsx`
- [ ] 重构 `VTuberApp.tsx`
- [ ] 重构 `VRMAvatar.tsx`
- [ ] 修改 `use-model-manager.ts`
- [ ] 删除/重构 `VTuberScene.tsx`

### 阶段 3：测试和优化（2-3小时）
- [ ] 功能测试
- [ ] 性能测试
- [ ] 添加调试工具
- [ ] 修复问题

**总计**: 约 7-10 小时

---

## ✅ 验收标准

1. ✅ Canvas 在 layout 层级，路由切换时不重建
2. ✅ VRM 模型缓存正常工作，切换模型时旧模型正确释放
3. ✅ MediaPipe 动捕功能完全正常
4. ✅ 所有 UI 组件功能正常
5. ✅ 性能无明显下降（FPS ≥ 30）
6. ✅ 无内存泄漏
7. ✅ 代码结构清晰，易于维护

---

## 🚀 开始重构

确认以上计划后，按阶段执行重构。每个阶段完成后进行测试，确保功能正常后再继续下一阶段。



