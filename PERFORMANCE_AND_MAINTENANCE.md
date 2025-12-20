# 性能优化与维护性改进报告

## 🔍 问题诊断

### 1. 3D场景锯齿边缘和卡顿问题

#### 问题根源分析

**锯齿边缘问题：**
- `antialias` 设置依赖于 `settings.antialiasing`，但可能未正确应用
- DPR (Device Pixel Ratio) 设置可能过高，导致渲染负担
- `preserveDrawingBuffer: true` 会显著降低性能

**卡顿问题：**
- DPR 计算可能返回过高的值（如 `[0.75, 1.5]` 或 `[1, 2]`）
- 阴影渲染（`shadow-mapSize: 2048x2048`）消耗大量性能
- Bloom 后处理效果被注释掉，但可能仍有其他后处理
- 实时 MediaPipe 处理 + 3D 渲染双重负担

#### 当前配置问题

```typescript
// VTuberScene.tsx 第295-300行
gl={{ 
  antialias: settings.antialiasing,  // ✅ 正确
  alpha: false,
  preserveDrawingBuffer: true,      // ❌ 性能杀手
  powerPreference: "high-performance"
}}
dpr={getResolutionDPR()}              // ⚠️ 可能过高
```

**DPR 计算问题：**
```typescript
// 第235-242行
const getResolutionDPR = () => {
  const baseDPR = getDPR();  // low: [0.5, 1], medium: [0.75, 1.5], high: [1, 2]
  const resolutionMultiplier = settings.resolution;  // 默认 1
  return [
    Math.max(0.5, baseDPR[0] * resolutionMultiplier),
    Math.max(1, baseDPR[1] * resolutionMultiplier)  // 可能达到 2.0
  ];
};
```

---

## 🗑️ 无用脚本和文件检查

### 需要保留的脚本

✅ **scripts/check-i18n.js** - 检查国际化文件完整性（有用）
✅ **scripts/align-i18n.js** - 对齐国际化文件（有用）

### 可能无用的脚本

⚠️ **setup-stripe-env.js** - Stripe 环境初始化（一次性脚本，可归档）
⚠️ **create-stripe-products.js** - 创建 Stripe 产品（一次性脚本，可归档）
⚠️ **setup-stripe.js** - Stripe 设置（一次性脚本，可归档）

### 重复/无用文件

❌ **public/models/mixamoVRMRigMap (1).js** - 文件名带 `(1)`，可能是重复文件
❌ **public/models/remapMixamoAnimationToVrm (1).js** - 文件名带 `(1)`，可能是重复文件

**注意：** 这些文件在 `constants.ts` 中已有对应的配置，可能不再需要。

### 测试页面（生产环境可移除）

以下测试页面在生产环境可能不需要：

- `src/app/test-*` - 所有测试页面
- `src/app/test-aws`
- `src/app/test-aws-creds`
- `src/app/test-env`
- `src/app/test-env-vars`
- `src/app/test-model-manager`
- `src/app/test-theme`
- `src/app/test-upload`
- `src/app/scene-test`
- `src/app/theme-test`
- `src/app/config-check`
- `src/app/deploy-check`
- `src/app/stripe-check`
- `src/app/[locale]/test`
- `src/app/[locale]/test-language`
- `src/app/[locale]/posthog-test`
- `src/app/[locale]/demo`
- `src/app/[locale]/env-status`
- `src/app/[locale]/kpi-dashboard` (如果不需要公开访问)

**建议：** 创建 `src/app/_test/` 目录，将所有测试页面移入，或使用环境变量控制访问。

---

## 🛠️ 性能优化方案

### 1. 修复抗锯齿和性能问题

#### 方案 A：优化 Canvas 配置

```typescript
// 修改 VTuberScene.tsx
gl={{ 
  antialias: true,                    // 强制启用抗锯齿
  alpha: false,
  preserveDrawingBuffer: false,      // ❌ 改为 false（除非需要截图）
  powerPreference: "high-performance",
  stencil: false,                    // 如果不需要模板缓冲
  depth: true,
  logarithmicDepthBuffer: false       // 除非需要大场景
}}
dpr={Math.min(window.devicePixelRatio, 1.5)}  // 限制最大 DPR
```

#### 方案 B：优化 DPR 计算

```typescript
// 修改 use-performance.ts 或 VTuberScene.tsx
const getResolutionDPR = () => {
  const baseDPR = getDPR();
  const resolutionMultiplier = settings.resolution;
  const deviceDPR = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  
  // 限制最大 DPR 为 1.5，避免过高渲染负担
  const maxDPR = 1.5;
  const calculatedDPR = Math.min(
    baseDPR[1] * resolutionMultiplier * deviceDPR,
    maxDPR
  );
  
  return [Math.max(0.5, calculatedDPR * 0.75), Math.min(calculatedDPR, maxDPR)];
};
```

#### 方案 C：优化阴影设置

```typescript
// 修改 VTuberScene.tsx Lighting 组件
<directionalLight
  intensity={1.2}
  position={[5, 5, 5]}
  castShadow={settings.shadows}
  shadow-mapSize-width={settings.shadows ? 1024 : 512}  // 降低分辨率
  shadow-mapSize-height={settings.shadows ? 1024 : 512}
  shadow-camera-far={50}
  shadow-camera-left={-10}
  shadow-camera-right={10}
  shadow-camera-top={10}
  shadow-camera-bottom={-10}
/>
```

### 2. 添加性能监控和自动降级

```typescript
// 在 VRMAvatar.tsx 中添加性能监控
useEffect(() => {
  let frameCount = 0;
  let lastTime = performance.now();
  
  const checkPerformance = () => {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
      const fps = frameCount;
      frameCount = 0;
      lastTime = currentTime;
      
      // 如果 FPS 低于 30，自动降低质量
      if (fps < 30 && settings.quality !== 'low') {
        updateSettings({ quality: 'low' });
      } else if (fps > 55 && settings.quality === 'low') {
        updateSettings({ quality: 'medium' });
      }
    }
    
    requestAnimationFrame(checkPerformance);
  };
  
  checkPerformance();
}, [settings.quality, updateSettings]);
```

---

## 📋 维护性改进建议

### 1. 代码组织优化

#### A. 创建测试页面目录

```
src/app/
├── _test/              # 测试页面（使用 _ 前缀避免路由）
│   ├── test-aws/
│   ├── test-env/
│   └── ...
├── [locale]/
└── ...
```

#### B. 归档一次性脚本

```
scripts/
├── archive/            # 归档目录
│   ├── setup-stripe-env.js
│   ├── create-stripe-products.js
│   └── setup-stripe.js
├── check-i18n.js       # 保留
└── align-i18n.js       # 保留
```

#### C. 清理重复文件

- 检查 `public/models/mixamoVRMRigMap (1).js` 是否被使用
- 检查 `public/models/remapMixamoAnimationToVrm (1).js` 是否被使用
- 如果未被使用，删除或移动到 `archive/` 目录

### 2. 性能配置集中管理

创建 `src/lib/performance-config.ts`：

```typescript
export const PERFORMANCE_PRESETS = {
  low: {
    dpr: [0.5, 1],
    antialias: false,
    shadows: false,
    bloom: false,
    shadowMapSize: 512,
  },
  medium: {
    dpr: [0.75, 1.25],
    antialias: true,
    shadows: true,
    bloom: false,
    shadowMapSize: 1024,
  },
  high: {
    dpr: [1, 1.5],
    antialias: true,
    shadows: true,
    bloom: true,
    shadowMapSize: 2048,
  },
};
```

### 3. 添加性能调试工具

在开发环境添加性能面板：

```typescript
// src/components/debug/PerformancePanel.tsx
export const PerformancePanel = () => {
  const { fps, memoryUsage } = usePerformance();
  
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <div className="fixed top-4 left-4 bg-black/80 text-white p-4 rounded">
      <div>FPS: {fps}</div>
      <div>Memory: {memoryUsage}%</div>
      <div>DPR: {window.devicePixelRatio}</div>
    </div>
  );
};
```

### 4. 文档完善

#### A. 创建性能调优文档

`docs/PERFORMANCE_TUNING.md`：
- 性能设置说明
- 常见问题解决方案
- 性能优化最佳实践

#### B. 创建维护指南

`docs/MAINTENANCE.md`：
- 如何清理无用文件
- 如何运行维护脚本
- 代码组织规范

### 5. 添加环境变量控制

```typescript
// next.config.js 或环境变量
const isDevelopment = process.env.NODE_ENV === 'development';
const enableTestPages = process.env.NEXT_PUBLIC_ENABLE_TEST_PAGES === 'true';

// 在路由中控制测试页面访问
```

### 6. 代码质量改进

#### A. 统一错误处理

```typescript
// src/lib/error-handler.ts
export const handleRenderError = (error: Error, context: string) => {
  console.error(`[${context}]`, error);
  // 发送到错误追踪服务
  if (process.env.NODE_ENV === 'production') {
    // PostHog 或其他服务
  }
};
```

#### B. 添加类型检查

确保所有配置都有 TypeScript 类型定义。

#### C. 添加单元测试

为关键性能函数添加测试：
- DPR 计算
- 性能设置更新
- 自动优化逻辑

---

## 🚀 实施优先级

### 高优先级（立即实施）

1. ✅ 修复 `preserveDrawingBuffer: false`
2. ✅ 优化 DPR 计算，限制最大值
3. ✅ 降低阴影贴图分辨率
4. ✅ 强制启用抗锯齿

### 中优先级（本周内）

1. 📁 整理测试页面到 `_test/` 目录
2. 📁 归档一次性脚本
3. 📝 创建性能配置集中管理
4. 🔍 检查并删除重复文件

### 低优先级（后续优化）

1. 📚 完善文档
2. 🧪 添加性能测试
3. 🛠️ 添加性能调试面板
4. 🔧 统一错误处理

---

## 📊 预期效果

### 性能提升

- **FPS 提升：** 预计从 30-40 FPS 提升到 50-60 FPS
- **锯齿减少：** 通过强制抗锯齿和优化 DPR
- **内存使用：** 通过 `preserveDrawingBuffer: false` 减少 10-20%

### 维护性提升

- **代码组织：** 测试页面集中管理，生产代码更清晰
- **文档完善：** 新开发者更容易理解项目结构
- **性能可调：** 集中配置管理，易于调整

---

## 🔗 相关文件

- `src/components/dressing-room/VTuberScene.tsx` - 主要修改文件
- `src/hooks/use-performance.ts` - 性能设置
- `src/lib/constants.ts` - 性能配置常量
- `scripts/` - 脚本目录
- `public/models/` - 模型文件目录


