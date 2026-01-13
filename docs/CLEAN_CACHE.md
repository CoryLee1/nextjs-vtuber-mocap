# 清理 Next.js 缓存指南

## 问题
遇到 `RangeError: Array buffer allocation failed` 错误时，通常是 webpack 缓存过大导致内存不足。

## 解决方案

### 方法 1: 使用清理脚本（推荐）

**Windows:**
```bash
npm run clean:win
```

**Mac/Linux:**
```bash
npm run clean
```

### 方法 2: 手动清理

删除以下目录：
- `.next/` - Next.js 构建缓存
- `node_modules/.cache/` - Node.js 模块缓存

### 方法 3: 使用低内存模式

如果系统内存较小，使用低内存模式启动：
```bash
npm run dev:low-memory
```

### 方法 4: 增加 Node.js 内存限制

默认的 `dev` 脚本现在使用 4GB 内存限制。如果需要更多，可以修改 `package.json` 中的 `--max-old-space-size=4096`。

## 预防措施

1. **定期清理缓存** - 在遇到内存问题时清理
2. **关闭不必要的应用程序** - 释放系统内存
3. **使用低内存模式** - 如果系统内存 < 8GB


