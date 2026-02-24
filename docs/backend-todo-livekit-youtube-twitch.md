# Backend TODO: 资产索引与 LiveKit 推流打通

## 目标

- 不依赖 S3 `ListBucket` 也能稳定返回素材列表（长期可维护）。
- 打通 LiveKit 与 YouTube/Twitch 的开播链路（支持状态可观测与错误回传）。

## A. 素材索引（长期方案，替代 ListBucket）

### A1. 数据模型

- 新建 `assets` 表（或等价集合），建议字段：
  - `id` (uuid)
  - `type` (`vrm` | `animation` | `bgm` | `hdr` | `scene`)
  - `s3_key`
  - `display_name`
  - `mime_type`
  - `size_bytes`
  - `status` (`uploading` | `ready` | `failed` | `missing`)
  - `owner_user_id`（可空）
  - `visibility` (`public` | `private`)
  - `created_at`, `updated_at`

### A2. 上传链路改造

- `/api/s3/upload` 成功后，写入/更新 `assets`（`status=ready`）。
- 上传失败写 `failed`（含错误码），便于排障。
- 兼容幂等：同一个 `s3_key` 重试上传不应生成重复脏数据。

### A3. 读取链路改造

- `/api/s3/resources` 改为查 `assets`（按 `type`、分页、排序）。
- 前端继续通过 `/api/s3/read-object?key=...` 读取对象，不直接依赖公开桶。

### A4. 补偿与巡检

- 定时任务（例如每小时）对 `ready` 资产做 `HeadObject` 健康检查：
  - 对象不存在则标记 `missing`
  - 可选：自动触发告警

### A5. 验收标准

- 即使 IAM 禁止 `ListBucket`，素材列表接口仍可稳定返回。
- 用户上传成功后，刷新页面仍能看到素材记录。
- 日志不再刷 S3 `ListBucket AccessDenied` 堆栈。

## B. LiveKit 联通 YouTube / Twitch

### B1. 配置与密钥管理

- 后端环境变量中新增并管理：
  - LiveKit API Key/Secret
  - RTMP Ingress/egress（按 LiveKit 方案）
  - YouTube RTMP URL + stream key（由用户侧或平台配置）
  - Twitch RTMP URL + stream key
- 所有密钥仅服务端持有；前端永不下发原始 key。

### B2. 开播控制 API

- 设计统一控制接口（示例）：
  - `POST /api/live/start`（支持平台参数：youtube/twitch/both）
  - `POST /api/live/stop`
  - `GET /api/live/status`
- `start` 返回：
  - `session_id`
  - 各平台状态（starting/live/error）
  - 失败原因（可读错误码）

### B3. 状态与回调

- 监听 LiveKit 事件并落库：
  - room 状态
  - egress/inbound/outbound 状态
  - 平台推流状态（连接中、已上线、中断）
- 建议增加 webhook 回调落库，前端轮询或 ws 展示状态。

### B4. 容错与重试

- 平台单点失败不影响另一平台（YouTube 失败不拖垮 Twitch）。
- 短暂网络抖动时可重试（指数退避，上限次数可配置）。
- `stop` 必须具备幂等性（重复调用不会报致命错误）。

### B5. 权限与审计

- 仅房主 token 可调用开播/停播。
- 每次开播记录审计字段：
  - who / when / where / platforms / result / error_code

### B6. 验收标准

- 在 staging 可完成 YouTube 与 Twitch 各 1 次完整开播-停播。
- `status` 可在 3-5 秒内反映平台真实状态变化。
- 单平台失败时，另一平台可保持推流并有清晰错误提示。

## C. 风险与建议

- 风险 1：先上 LiveKit 但无状态落库，排障会很痛苦。
  - 建议：至少实现最小状态表 + 关键事件日志。
- 风险 2：直接依赖平台 RTMP key 存前端。
  - 建议：严格服务端托管，前端仅拿会话 ID。
- 风险 3：素材列表继续依赖实时扫桶。
  - 建议：优先完成 `assets` 索引迁移，再逐步下线 ListBucket 逻辑。

## D. 建议排期（可拆分）

- P1（1-2 天）：`assets` 表 + 上传落库 + `/api/s3/resources` 查库
- P2（1-2 天）：LiveKit 开播/停播/status API（单平台）
- P3（1-2 天）：双平台并发 + 重试 + webhook 状态回流
- P4（0.5-1 天）：巡检任务 + 告警 + 文档收尾
