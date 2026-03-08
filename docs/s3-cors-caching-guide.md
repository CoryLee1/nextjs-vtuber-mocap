# S3 资源加载：CORS、COEP 与缓存安全指南

## 问题现象

Chrome 无法渲染主场景（黑屏 + `THREE.WebGLRenderer: Context Lost`），但 Cursor 内置浏览器（Electron）正常。

## 根因链

1. **S3 URL 转换失败** — `.env.local` 的 `NEXT_PUBLIC_S3_BASE_URL` 是占位符 `your-bucket`，`toS3ReadUrl()` 无法识别真实 S3 URL，不转换。
2. **302 redirect 被 COEP 拦截** — API route 对大文件（VRM/FBX）返回 302 redirect 到 S3 presigned URL。Chrome 在 `Cross-Origin-Embedder-Policy` 下拦截跨域 redirect。
3. **浏览器缓存了旧的 302 响应** — `preload-critical-assets.ts` 使用 `cache: 'force-cache'`，浏览器缓存了旧的 302 redirect 响应，后续请求复用已过期的 presigned URL → 403。
4. **错误级联** — 模型加载失败 → Three.js 资源异常 → WebGL Context Lost → 黑屏。

## Cursor vs Chrome 行为差异

| 行为 | Chrome | Cursor (Electron) |
|------|--------|--------------------|
| COEP 执行 | 严格执行 `require-corp` / `credentialless` | 不严格执行 |
| 跨域 redirect | 被 COEP 拦截 | 放行 |
| 缓存策略 | 严格遵循 `force-cache` 语义 | 可能较宽松 |

## S3 资源加载架构

### 当前方案：API 代理

```
Browser → /api/s3/read-object?key=xxx → S3 GetObject → 流式转发 body
```

- **大文件**（`.vrm`, `.fbx`, `.glb`, `.gltf`, `.hdr`）：`GetObject` + `transformToWebStream()` 流式返回，不 302 redirect。
- **小文件/图片**：直接代理 body（`transformToByteArray()`），避免 `<img>` 跟随 302 跨域裂图。
- **其他**（非大文件、非图片）：presigned URL redirect（`302`）。

### 为什么不直接 302 redirect？

1. Chrome COEP 会拦截跨域 redirect。
2. Presigned URL 有时效性，`force-cache` 会缓存过期 URL。
3. 同源代理天然满足 CORS/COEP 要求。

## 缓存策略规范

| 场景 | `Cache-Control` | `fetch` option | 说明 |
|------|-----------------|----------------|------|
| 大文件流式代理 | `public, max-age=3600` | — | 1 小时，允许 S3 文件更新后浏览器及时获取新版本 |
| 小文件图片代理 | `public, max-age=86400, immutable` | — | 24 小时，图片基本不变 |
| 缩略图 | `no-store` | — | 可能频繁更新 |
| Presigned URL redirect | `no-store` | — | URL 有时效，不可缓存 |
| 前端 preload | — | `cache: 'default'` | 遵循标准 HTTP 缓存语义 |

### 不要使用 `force-cache`

`force-cache` 会无视服务器的 `Cache-Control` 头，可能缓存 302 redirect 或已过期的 presigned URL。使用 `cache: 'default'` 让浏览器根据响应头自行判断。

## 新增 S3 资源 URL 的检查清单

- [ ] URL 经过 `toS3ReadUrl()` 转换为 `/api/s3/read-object?key=...` 代理路径
- [ ] 大文件（VRM/FBX/GLB/HDR）走流式代理，不走 302 redirect
- [ ] `preload` 使用 `cache: 'default'`，不使用 `force-cache`
- [ ] `route.ts` 的 `isAllowedKey()` 和 `DEFAULT_READ_ALLOWED_KEYS` 包含新 key
- [ ] 在 Chrome（非 Electron/Cursor）中实测加载无 403/CORS 错误

## 常见坑与排查步骤

### 1. 403 Forbidden

- 检查 presigned URL 是否过期（被浏览器缓存了旧的 302 响应）
- 清除浏览器缓存后重试
- 检查 S3 bucket policy 和 CORS 配置

### 2. CORS / COEP 拦截

- 检查 `next.config.js` 的 `Cross-Origin-Embedder-Policy` 是否为 `credentialless`（不要用 `require-corp`）
- 确认大文件走流式代理而非 302 redirect
- Chrome DevTools → Network → 查看 redirect 链

### 3. WebGL Context Lost

- 通常是资源加载失败的级联效应，先解决 403/CORS 问题
- 检查 Console 中是否有 `preload failed` 或 `fetch` 错误

### 4. 开发调试技巧

- 使用 Chrome 无痕模式验证无缓存依赖
- Network 面板过滤 `read-object` 查看 API 代理请求
- 对比 Cursor（Electron）和 Chrome 行为差异定位 COEP 问题
