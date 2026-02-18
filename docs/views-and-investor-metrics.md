# Views 逻辑与投资人数据展示说明

## 一、当前 Views 逻辑

### 1. 主界面右上角（PowerToggle 区域，`UILayoutRedesign.tsx`）

| 显示项 | 含义 | 数据来源 |
|--------|------|----------|
| **VIEWS（访问）** | **全站累计访问次数**（Echuu 网站被访问的次数） | `GET /api/view-count`：每次主页面加载请求一次，服务端在 DB（`SiteViewCounter` 表）中原子 +1 并返回当前总数 |
| **ONLINE（在线）** | 当前房间实时在线人数 | Echuu WebSocket `onlineCount` |

要点：

- **VIEWS** 为全站累计 PV（每次打开主页面计一次），存在 PostgreSQL（Neon）的 `SiteViewCounter` 表中，对所有用户一致。
- **ONLINE** 是真实实时人数（同一房间通过 WebSocket 统计）。

### 2. 埋点与真实数据（已接入 PostHog）

- **页面浏览**：`trackPageView(pageName, pageUrl)` → PostHog 事件 `page_view`（含 page_name、page_url、referrer）。
- **直播结束**：`trackLiveStreamEnded(streamId, duration, viewerCount)` → `live_stream_ended`（含 duration、viewer_count）。
- 其他：登录、注册、角色创建、直播开始、引导完成等也通过 `useTracking` / KPI 发到 PostHog。

真实 PV/UV、直播观看等**都在 PostHog**，当前前端没有从 PostHog 拉回展示。

### 3. 分析仪表板（`AnalyticsDashboard.tsx`）

- 展示：总用户、活跃用户、**页面浏览**、转化率、事件统计、热门事件、用户引导漏斗。
- **目前全部为前端写死的模拟数据**（如 pageViews: 8901），没有调用 PostHog API 或自有后端。

---

## 二、对投资人的问题

1. **主界面 VIEWS**：本机计数，不具备说服力，容易被质疑。
2. **仪表板**：数据是假的，一旦被发现会损害信任。
3. **真实数据**：在 PostHog 里，但没有在产品里「可见」。

---

## 三、让数据好看、可信、吸引投资人的做法

### 方案 A：接真实数据（推荐）

1. **AnalyticsDashboard 接 PostHog**
   - 使用 [PostHog API](https://posthog.com/docs/api) 或 [Embedded Dashboard](https://posthog.com/docs/product-analytics/dashboards#embedding-dashboards)：
     - 查询 `page_view` 的 PV/UV、按日趋势。
     - 查询 `live_stream_ended` 的场次、总观看、平均观看等。
   - 用真实数据替换当前模拟数据，并注明「来自 PostHog」或「实时数据」。

2. **主界面 VIEWS 二选一**
   - **选项 1**：改为「全站 PV」或「今日访问」：从后端或 PostHog API 拉一个汇总数字（需要一个小后端或 Serverless 从 PostHog 聚合后给前端）。
   - **选项 2**：主界面不再强调「VIEWS」，只突出 **ONLINE**（实时在线），并在仪表板/投资人页用真实 PV、UV、直播数据说明增长。

### 方案 B：演示/投资人模式（快速）

- 在设置或通过 URL 参数开启「演示模式」：
  - 主界面 VIEWS 显示为「演示数据」或隐藏，或替换为一个合理的示例数字并标注「Demo」。
  - AnalyticsDashboard 保持现有 UI，但顶部标注「示例数据，正式版接 PostHog」。
- 同时准备 **一页 PDF/Notion**：从 PostHog 截图真实趋势（PV、UV、直播场次、观看），作为投资人材料，与产品演示配合使用。

### 方案 C：仪表板 UI 优化（无论真假数据都可用）

- 增加**时间范围**：今日 / 近 7 天 / 近 30 天。
- 增加**简单图表**：折线图（PV/UV 趋势）、柱状图（直播场次/观看）。
- 指标定义清晰：区分 **PV**（页面浏览次数）、**UV**（独立用户）、**DAU/MAU**、**直播场次**、**总观看人数** 等，方便投资人理解。
- 使用统一数字格式（千分位、K/M）和一致配色，更专业。

---

## 四、实施优先级建议

| 优先级 | 动作 | 说明 |
|--------|------|------|
| 高 | 仪表板接 PostHog 真实数据 | 替换模拟数据，可信度质变 |
| 高 | 主界面 VIEWS 改为真实统计或弱化 | 避免「本机计数」被质疑 |
| 中 | 仪表板增加时间范围 + 趋势图 | 数据更好看、更易讲故事 |
| 中 | 准备一页 PostHog 截图作为投资人材料 | 不依赖产品内是否已接 API |
| 低 | 演示模式 + 标注 Demo | 快速区分「演示」与「真实」 |

---

## 五、相关代码位置

- 主界面 VIEWS/ONLINE：`src/components/dressing-room/UILayoutRedesign.tsx`（`ECHUU_VIEW_COUNT_KEY`、`viewCount`、`onlineCount`）。
- 分析仪表板（当前模拟数据）：`src/components/tracking/AnalyticsDashboard.tsx`。
- 埋点：`src/hooks/use-tracking.ts`（`trackPageView`、`trackLiveStreamEnded` 等）、`src/lib/kpi-tracking.ts`（KPI 事件类型）。
- PostHog 初始化：`src/lib/posthog-init.ts`。

如需，我可以按「方案 A + 仪表板 UI 优化」给出具体改法（例如 PostHog 查询示例、接口形状、以及 AnalyticsDashboard 如何接 API）。
