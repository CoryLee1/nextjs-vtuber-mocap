# 场景资源加载优化分析

> 2026-03-08 分析，基于当前 main 分支

## 当前资源清单

| 类型 | 数量 | 单文件大小 | 总量 | 来源 |
|------|------|-----------|------|------|
| VRM 模型 | 25 个样本 | 14-20MB | ~400MB（按需加载） | S3 `vrm/` |
| FBX 动画 | 15 个 | 1.8-2.5MB | ~35MB | S3 `animations/` |
| 环境图 | 1 PNG | ~1.5MB | 1.5MB | 本地 `public/` |
| HDR 环境 | 1 HDR | ~5MB | 5MB | 本地 `public/` |

## 当前加载时序

```
T=0ms   preloadCriticalAssets() 启动
├── 并行 ①: 背景图 Image() 预加载 (~25ms)
├── 并行 ②: VRM fetch → blob → ObjectURL → useGLTF.preload (~1500ms)
├── 并行 ③: 4个 FBX fetchAndCache() — 只下载不解析 (~800ms)
└── 并行 ④: S3 资源列表 loadAll() — fire-and-forget

T≈1500ms  LoadingPage 退出，Canvas 挂载
T≈2000ms  MainScene 渲染 VRMAvatar（useGLTF 缓存命中）
T≈2500ms  animation-manager 加载第一个 FBX → 此时才 parse（200-300ms 卡顿）
```

## 瓶颈分析

### 1. FBX 只预下载不预解析（高优先级）

**现状**: `preload-critical-assets.ts` 的 `fetchAndCache()` 只做 `fetch() + arrayBuffer()`，把文件塞进浏览器 HTTP 缓存。当 `animation-manager` 首次使用时，仍需完整 FBXLoader parse（200-300ms/个）。

**影响**: 用户进入场景后，第一个动画播放有明显卡顿。

**注意**: 我们只需要 FBX 的动画数据（AnimationClip），不需要它的模型/网格。

### 2. 动画预加载不足（高优先级）

**现状**: 15 个动画只预加载 4 个（2 个引导页 + 2 个 idle 轮播）。用户选择其他动画时，要走完整 fetch(300ms) + parse(300ms) = 600ms。

**影响**: 切换动画时明显卡顿/等待。

### 3. VRM 双缓存不一致（中优先级）

**现状**: drei 的 `useGLTF` 有 Three.js 内部缓存，Zustand store 也存了 VRM 实例。切换模型时可能出现旧实例残留。

### 4. S3 代理冗余探测（中优先级）

**现状**: 每次请求先 `HeadObject` 探测 key 是否存在，再 `GetObject`。对白名单内的已知 key，HeadObject 是多余的。

### 5. Canvas 双 rAF 延迟（低优先级）

**现状**: `Canvas3DProvider` 用双 `requestAnimationFrame` 延迟挂载 Canvas，增加 ~32ms。

### 6. Store rehydration 同步阻塞（低优先级）

**现状**: 14 个字段从 localStorage 同步恢复，部分非首屏必需。

## 优化路线图

### Phase 1: FBX 动画预解析 + 扩大预加载范围
- 预加载阶段直接用 FBXLoader 解析，提取 AnimationClip 缓存
- 扩大预加载范围：首屏 4 个立即加载，其余空闲时后台加载
- 严格错误隔离：单个 FBX 失败不影响其他动画和场景

### Phase 2: S3 代理优化
- 白名单 key 跳过 HeadObject，直接 GetObject
- 失败时 fallback 到公有 URL

### Phase 3: VRM 缓存统一
- 统一 drei cache 和 store cache
- 模型切换时正确 dispose 旧实例

### Phase 4: 初始化优化
- Canvas 单 rAF
- Store rehydration 拆分
