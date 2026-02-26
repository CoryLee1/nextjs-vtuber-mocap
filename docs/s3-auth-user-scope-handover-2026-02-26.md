# S3 与用户体系改造交接文档（2026-02-26）

## 1. 这次改了什么（现状）

目标：把 S3 访问从“按桶/路径”改为“按用户 + 资源索引（assets）授权”。

已完成的核心改造：

1. 新增 `assets` 表与枚举（`AssetType/AssetStatus/AssetVisibility`）
2. 上传链路写入 `assets`，新上传默认 `PRIVATE`
3. 读取链路 `/api/s3/read-object` 改为先查 `assets` 再授权
4. `/api/s3/resources`、`/api/s3/upload`、`/api/s3/presigned-url` 改为必须登录
5. `/api/debug-env` 改为仅登录可用
6. 提供历史数据回填脚本：`npm run backfill:s3-assets`

关键代码位置：

- `prisma/schema.prisma`
- `prisma/migrations/20260226150000_add_assets_table/migration.sql`
- `src/app/api/s3/read-object/route.ts`
- `src/app/api/s3/resources/route.ts`
- `src/app/api/s3/upload/route.ts`
- `src/app/api/s3/presigned-url/route.ts`
- `scripts/backfill-s3-assets.mjs`

## 2. 当前权限语义（务必统一口径）

不是“所有 S3 接口都必须登录”，而是：

| 接口 | 是否必须登录 | 当前规则 |
|---|---|---|
| `/api/s3/resources` | 是 | 未登录 401 |
| `/api/s3/upload` | 是 | 未登录 401 |
| `/api/s3/presigned-url` | 是 | 未登录 401 |
| `/api/s3/read-object` | 条件 | `PUBLIC` 可匿名；`PRIVATE` 仅 owner；`assets` 无记录返回 404 |
| `/api/vrm-thumbnail` | 是 | 同时校验资源可读性 |
| `/api/vrm/tag-model` | 是 | 仅 owner 可写标签 |

## 3. 对前端已有加载链路的影响（重点）

### 3.1 会受影响的时机

1. 未登录进入首页 `Loading` 阶段，仍会预加载默认模型/动画（走 `/api/s3/read-object`）
2. 主场景渲染时，默认动画仍有一轮 `useFBX` 预加载
3. 登录后首次进入引导页/场景时，会继续使用默认资源作为兜底

### 3.2 可能出现的问题

| 场景 | 触发条件 | 用户表现 |
|---|---|---|
| 未登录加载默认模型失败 | 默认 VRM 在 `assets` 中不存在，或被标记为 `PRIVATE` | 角色不显示，可能只看到加载态/占位 |
| 未登录加载默认动画失败 | 默认动画在 `assets` 中不存在，或被标记为 `PRIVATE` | 动画不播放、首屏卡在异常状态 |
| 严格模式下历史资源未回填 | 未执行 backfill | `/api/s3/read-object` 大量 404 |

默认资源 key（至少要确保存在于 `assets` 且可读）：

- `vrm/AvatarSample_A.vrm`
- `animations/Standing Greeting (1).fbx`
- `animations/Thinking.fbx`
- `src/config/vtuber-animations.ts` 中配置的默认/预加载动画 key

## 4. 执行清单（按顺序）

### 4.1 数据库迁移

```bash
npx prisma migrate deploy
```

如果是开发环境，也可：

```bash
npx prisma migrate dev
```

### 4.2 回填历史 S3 到 `assets`

```bash
npm run backfill:s3-assets
```

要求环境变量可用：

- `NEXT_PUBLIC_S3_BUCKET`
- `NEXT_PUBLIC_S3_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

预期输出含：`scanned/upserted/skipped`。

### 4.3 把默认首屏资源标为 `PUBLIC`（建议）

原因：当前产品体验是未登录也会进入首页 3D 首屏；若默认资源不公开，会影响未登录首屏可用性。

PostgreSQL 示例（按需补充 key）：

```sql
UPDATE assets
SET visibility = 'PUBLIC'
WHERE s3_key IN (
  'vrm/AvatarSample_A.vrm',
  'animations/Standing Greeting (1).fbx',
  'animations/Thinking.fbx',
  'animations/Idle.fbx',
  'animations/Talking.fbx'
);
```

### 4.4 联调验证（最小验收）

1. 未登录访问首页：页面可进入，默认模型与默认动画可见
2. 未登录请求资源列表：`GET /api/s3/resources?type=models` 返回 401（符合预期）
3. 登录后访问资源列表：可返回本人资源 + 公共资源
4. A 用户上传 `PRIVATE` 资源后，B 用户直接读该 key：应 403/401
5. `GET /api/debug-env` 未登录应拒绝，登录可访问（且敏感字段脱敏）

## 5. 推荐的两种上线策略

### 策略 A（推荐，风险低）

- 保持现有“严格后端授权”
- 先确保默认首屏资源是 `PUBLIC`
- 再逐步把前端改为“未登录不预加载 S3 3D 资源”

适合：希望先稳住业务可用性，减少白屏/加载失败投诉。

### 策略 B（最严格）

- 默认资源也不开放匿名读
- 前端必须在未登录态完全不触发任何 S3 3D 读取

适合：安全优先、允许未登录首屏降级展示（静态图/空场景）。

## 6. 已知未完成项（需要后续排期）

1. 前端未登录态仍有默认 S3 资源预加载路径
2. 部分 3D 资源预加载链路缺少明确错误边界（失败时可能影响渲染树稳定性）
3. 目前无“资源可见性切换”业务接口（发布/取消发布），只能脚本/SQL 改 `assets.visibility`

## 7. 紧急回滚建议（若线上首屏受影响）

优先级从快到慢：

1. 先把默认首屏资源批量改 `PUBLIC`（最快恢复首屏）
2. 检查并补跑 `npm run backfill:s3-assets`
3. 若仍异常，临时在前端关闭未登录态 3D 预加载（代码层热修）

## 8. 给 Cursor 的可执行说明（可直接复制）

适用场景：在 Cursor 中直接执行，不需要先理解全部背景。

### 8.1 让 Cursor 先做什么（粘贴到 Cursor Chat）

```text
你在项目根目录执行以下任务，并在每一步输出结果摘要：
1) 检查当前分支和未提交变更，先只读不改代码
2) 执行 Prisma 迁移
3) 执行 S3 assets 回填脚本
4) 检查默认首屏资源是否存在于 assets 表
5) 若存在但 visibility 不是 PUBLIC，输出 SQL 修复语句（不要直接执行 SQL，先等我确认）
6) 完成后给出“未登录首页验证 + 登录后验证”的测试结论
要求：命令失败要停止并给出错误原因与下一步建议
```

### 8.2 Cursor 可执行命令序列（可逐条执行）

```bash
pwd
git status --short
npx prisma migrate deploy
npm run backfill:s3-assets
```

如果需要校验默认 key 是否已回填（PostgreSQL）：

```sql
SELECT s3_key, visibility, status
FROM assets
WHERE s3_key IN (
  'vrm/AvatarSample_A.vrm',
  'animations/Standing Greeting (1).fbx',
  'animations/Thinking.fbx',
  'animations/Idle.fbx',
  'animations/Talking.fbx'
)
ORDER BY s3_key;
```

### 8.3 Cursor 生成修复 SQL 的目标格式

```sql
UPDATE assets
SET visibility = 'PUBLIC'
WHERE s3_key IN (
  'vrm/AvatarSample_A.vrm',
  'animations/Standing Greeting (1).fbx',
  'animations/Thinking.fbx',
  'animations/Idle.fbx',
  'animations/Talking.fbx'
);
```

### 8.4 让 Cursor 做验收（粘贴到 Cursor Chat）

```text
请按以下清单验证并汇报结果（通过/失败 + 证据）：
1) 未登录访问首页：页面可进入，默认模型与默认动画可见
2) 未登录访问 /api/s3/resources?type=models：应返回 401
3) 登录后访问 /api/s3/resources?type=models：应返回 200 且有 data
4) 登录用户 A 上传 PRIVATE 资源后，用户 B 访问该 key：应 401/403
5) 未登录访问 /api/debug-env：应拒绝；登录访问：应成功且敏感字段已脱敏
```

### 8.5 Cursor 执行失败时的分支处理

1. `npx prisma migrate deploy` 失败：先检查 `DATABASE_URL`，再重试。
2. `npm run backfill:s3-assets` 失败：检查 `NEXT_PUBLIC_S3_BUCKET`、`NEXT_PUBLIC_S3_REGION`、`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`。
3. 首页仍无默认模型：优先检查默认 key 在 `assets` 中是否存在且 `visibility=PUBLIC`。
4. 接口状态码不符合预期：优先检查是否登录态、以及 `assets` 记录是否存在（严格模式下无记录=404）。

---

如果只做一件事：先完成“迁移 + backfill + 默认资源设为 PUBLIC + 未登录首屏回归测试”。
