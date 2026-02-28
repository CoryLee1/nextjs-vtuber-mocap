# 模型与动画加载性能说明

## 为什么感觉慢

1. **请求路径**  
   所有 VRM/FBX 都走 `/api/s3/read-object?key=...`：浏览器先请求 Next 服务端，服务端做权限/HeadObject/生成 presigned URL 后 302 到 S3，浏览器再跟一次 S3 下载。等于「一次到你的服务器 + 一次到 S3」，首包和总时长都会受两段网络影响。

2. **S3 区域**  
   桶在 `us-east-2`，用户或部署离得远时，到 S3 的延迟会明显。

3. **首屏并发**  
   主场景会同时要：默认 VRM、idle 动画、预加载的若干 FBX。每个资源都是一次 API + 一次 S3，首屏会集中多请求。

4. **预加载时机**  
   Loading 阶段会跑 `preloadCriticalAssets`（默认模型 + 少量 FBX）。若这段时间内网络慢或超时，进入主场景时仍可能再发请求或等缓存。

## 已做的优化

- **预设资源 presigned 缓存**（`/api/s3/read-object`）  
  白名单内的 key（如 `vrm/AvatarSample_A.vrm`、`animations/Idle.fbx` 等）在服务端做 presigned URL 内存缓存（约 50 分钟 TTL）。同一 key 的重复或并发请求会直接 302 到缓存 URL，不再每次调 S3 签名，减少服务端延迟。

- **预设 key 只做一次 HeadObject**  
  白名单 key 不再尝试 space/`+` 等变体，只试一次 HeadObject，失败则直接回退公有 URL，减少 S3 请求次数。

- **预加载与缓存**  
  Loading 时预拉默认模型并转为 Object URL 写入 store、调用 `useGLTF.preload`，主场景优先用该 URL，避免二次网络请求。FBX 通过 `PRELOAD_ANIMATION_URLS` 预加载，进入场景后 useFBX 可命中缓存。

## 可进一步考虑

- 部署/用户离 S3 更近（同区或 CDN 加速 S3）。
- 首屏只加载必需的一个模型 + 1～2 个动画，其余按需或懒加载。
- 若桶可公开读且接受 CORS，对白名单资源可考虑直连 S3 URL（少一跳 API），需评估安全与策略。
