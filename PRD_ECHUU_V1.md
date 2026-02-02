# Echuu V1 产品需求文档 (PRD)

> **版本**: V1.0 MVP
> **日期**: 2026-02-02
> **状态**: Draft

---

## 1. 产品概述

### 1.1 一句话描述
Echuu 是一个 AI 驱动的虚拟主播生成平台，用户只需输入角色设定和直播主题，AI Agent 即可自动生成剧本、语音、动作和表情，实现全自动 VTuber 直播。

### 1.2 核心价值
- **零门槛直播**：无需专业设备、无需真人出镜、无需动捕设备
- **AI 驱动内容**：自动生成剧本+语音+动作+表情
- **一键开播**：完成设定后即可推流到各大平台

### 1.3 目标用户
- 想尝试 VTuber 但没有设备/技术的创作者
- 需要 24/7 直播的内容运营者
- 虚拟偶像/虚拟 IP 运营方

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Echuu V1 架构                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐    ┌──────────────────────┐    ┌───────────────┐  │
│  │   INPUT      │    │     PROCESSOR        │    │    OUTPUT     │  │
│  │   (前端)      │───▶│  (AI Streaming Agent)│───▶│   (渲染+推流)  │  │
│  └──────────────┘    └──────────────────────┘    └───────────────┘  │
│         │                      │                        │           │
│         ▼                      ▼                        ▼           │
│  • 选择角色模型         • 生成直播剧本            • 渲染 VRM 动画    │
│  • 设置角色信息         • 文字转语音(TTS)         • BlendShape 表情  │
│  • 输入直播主题         • 语音转动作映射           • 推流到直播平台   │
│  • 选择直播平台         • 情感分析→表情           • 弹幕互动响应     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 核心功能流程

### 3.1 用户流程 (Happy Path)

```
Step 1: 选择角色
    └─▶ 从预设 VRM 模型库选择 / 上传自定义 VRM

Step 2: 设置角色信息
    ├─▶ 角色名字 (显示在直播间)
    ├─▶ 角色声音 (选择 TTS 音色 / 上传声音样本)
    ├─▶ 角色人设 (性格、说话风格、背景故事)
    └─▶ 直播背景 (选择预设场景 / 上传背景)

Step 3: 设置直播主题
    ├─▶ 直播类型 (闲聊/游戏/唱歌/知识分享)
    ├─▶ 直播主题 (今日话题/剧本大纲)
    └─▶ 互动设置 (是否响应弹幕/礼物)

Step 4: 开始直播
    └─▶ AI Agent 自动生成内容并推流
```

### 3.2 数据流

```
用户输入 ──▶ Echuu AI Agent ──▶ 多模态输出
   │              │                  │
   │              ▼                  ▼
   │     ┌────────────────┐   ┌─────────────┐
   │     │  LLM 剧本生成   │   │  语音 (TTS)  │
   │     │  情感标注       │   │  动作映射    │
   │     │  动作指令       │   │  表情映射    │
   │     └────────────────┘   └─────────────┘
   │              │                  │
   └──────────────┴──────────────────┘
                  │
                  ▼
          ┌─────────────────┐
          │  VRM 渲染引擎   │
          │  (nextjs-vtuber │
          │   -mocap)       │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  LiveKit 推流   │
          │  ──▶ 抖音/B站   │
          └─────────────────┘
```

---

## 4. 功能需求

### 4.1 INPUT 模块 (前端)

| 功能 | 描述 | 优先级 | 负责人 |
|------|------|--------|--------|
| 角色选择器 | 预设 VRM 模型库 + 上传自定义 | P0 | Cory |
| 角色信息表单 | 名字/声音/人设/背景设置 | P0 | Cory |
| 声音选择 | TTS 预设音色列表 + 试听 | P0 | Cory |
| 直播主题输入 | 文本输入 + 预设模板 | P0 | Cory |
| 直播平台选择 | 选择推流目标平台 | P1 | 扣扣 |

### 4.2 PROCESSOR 模块 (AI Agent)

| 功能 | 描述 | 优先级 | 状态 |
|------|------|--------|------|
| 剧本生成 | 根据人设+主题生成直播剧本 | P0 | ✅ 已完成 |
| TTS 语音 | 文本转语音输出 | P0 | ✅ 已完成 |
| 情感分析 | 分析文本情感→表情标签 | P0 | ⚠️ 需补充映射 |
| 动作生成 | 语音/文本→动作指令 | P1 | ⚠️ 需补充映射 |
| 弹幕响应 | 实时读取弹幕并回复 | P1 | 待开发 |

### 4.3 OUTPUT 模块 (渲染+推流)

| 功能 | 描述 | 优先级 | 状态 |
|------|------|--------|------|
| VRM 渲染 | 加载并渲染 VRM 模型 | P0 | ✅ 已完成 |
| BlendShape 表情 | 接收情感标签→驱动表情 | P0 | ⚠️ 需开发映射 |
| 骨骼动作 | 接收动作指令→播放动画 | P0 | ⚠️ 需开发映射 |
| 口型同步 | 语音→嘴型 BlendShape | P0 | ⚠️ 需开发 |
| LiveKit 推流 | 画面+音频推流到直播平台 | P0 | 扣扣 |

---

## 5. 技术规格

### 5.1 AI Agent → VRM 映射接口

需要在 echuu-agent 和 nextjs-vtuber-mocap 之间建立的数据接口：

```typescript
// AI Agent 输出的动作/表情指令
interface AgentOutput {
  timestamp: number;

  // 语音数据
  audio: {
    url: string;        // 音频文件 URL
    duration: number;   // 时长(秒)
  };

  // 口型数据 (由 TTS 或 Whisper 生成)
  lipSync: {
    visemes: Array<{
      time: number;     // 时间点
      viseme: string;   // 音素 (A, I, U, E, O, NN, etc.)
      weight: number;   // 权重 0-1
    }>;
  };

  // 表情数据
  expression: {
    emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'relaxed';
    intensity: number;  // 强度 0-1
  };

  // 动作数据
  action: {
    type: 'idle' | 'wave' | 'nod' | 'shake_head' | 'dance' | 'custom';
    animationId?: string;  // 自定义动画 ID
    blend: number;         // 混合权重
  };
}
```

### 5.2 VRM BlendShape 映射表

```typescript
// 表情情感 → VRM BlendShape 映射
const emotionToBlendShape: Record<string, Record<string, number>> = {
  happy: {
    'Fcl_ALL_Joy': 1.0,
    'Fcl_MTH_A': 0.3,
  },
  sad: {
    'Fcl_ALL_Sorrow': 1.0,
    'Fcl_BRW_Sad': 0.8,
  },
  angry: {
    'Fcl_ALL_Angry': 1.0,
    'Fcl_BRW_Angry': 0.9,
  },
  surprised: {
    'Fcl_ALL_Surprised': 1.0,
    'Fcl_EYE_Wide': 0.8,
  },
  // ... 更多映射
};

// 口型音素 → VRM BlendShape 映射
const visemeToBlendShape: Record<string, Record<string, number>> = {
  'A': { 'Fcl_MTH_A': 1.0 },
  'I': { 'Fcl_MTH_I': 1.0 },
  'U': { 'Fcl_MTH_U': 1.0 },
  'E': { 'Fcl_MTH_E': 1.0 },
  'O': { 'Fcl_MTH_O': 1.0 },
  'NN': { 'Fcl_MTH_Close': 0.8 },
};
```

### 5.3 动作动画库

需要准备的基础动画集：

| 动作 ID | 描述 | 触发场景 |
|---------|------|----------|
| idle_01 | 待机呼吸 | 默认状态 |
| idle_02 | 待机看周围 | 随机切换 |
| wave_01 | 打招呼挥手 | 开场/新观众 |
| nod_01 | 点头同意 | 认可语句 |
| shake_head_01 | 摇头 | 否定语句 |
| think_01 | 思考姿态 | 停顿时 |
| laugh_01 | 开心大笑 | 笑话/有趣内容 |
| dance_01 | 简单舞蹈 | 收到礼物 |

---

## 6. 任务分工

### 6.1 扣扣负责 (后端+基础设施)

| 任务 | 描述 | 依赖 |
|------|------|------|
| **数据库设计** | 用户表/角色表/直播记录表 | - |
| **后端 API** | 用户管理/角色 CRUD/直播管理 | 数据库 |
| **服务器部署** | 部署 echuu-agent + 前端 | - |
| **登录系统** | OAuth (微信/Google) + JWT | 数据库 |
| **LiveKit 集成** | 音视频推流到直播平台 | 服务器 |
| **推流管理** | RTMP 推流到抖音/B站 | LiveKit |

### 6.2 Cory 负责 (前端+VRM)

| 任务 | 描述 | 依赖 |
|------|------|------|
| **前端还原** | 完成 UI 设计稿还原 | - |
| **在线人数** | 实时显示在线观众数 | WebSocket |
| **角色选择 UI** | VRM 模型选择器组件 | - |
| **角色设置表单** | 名字/声音/人设输入 | - |
| **VRM 表情映射** | 接收情感→驱动 BlendShape | Agent 接口 |
| **VRM 动作映射** | 接收指令→播放动画 | 动画库 |
| **口型同步** | 音素→嘴型 BlendShape | Agent 接口 |

### 6.3 共同完成

| 任务 | 描述 |
|------|------|
| **Agent 输出接口** | 定义 Agent→前端的数据格式 |
| **WebSocket 通信** | 实时传输动作/表情指令 |
| **端到端测试** | 完整流程测试 |

---

## 7. MVP 里程碑

### Phase 1: 基础设施 (Week 1-2)
- [ ] 扣扣: 数据库设计 + 后端 API 骨架
- [ ] 扣扣: 服务器部署 + CI/CD
- [ ] Cory: 前端 UI 还原

### Phase 2: 核心功能 (Week 3-4)
- [ ] 扣扣: 登录系统
- [ ] Cory: 角色选择 + 设置表单
- [ ] Cory: VRM 表情/动作映射

### Phase 3: 推流集成 (Week 5-6)
- [ ] 扣扣: LiveKit 集成
- [ ] 扣扣: RTMP 推流
- [ ] Cory: 口型同步
- [ ] 共同: 端到端测试

### Phase 4: 上线 (Week 7)
- [ ] 内测
- [ ] Bug 修复
- [ ] 正式发布

---

## 8. 技术栈汇总

| 层级 | 技术 | 备注 |
|------|------|------|
| **前端** | Next.js 14 + React 18 + TypeScript | 已有 |
| **3D 渲染** | React Three Fiber + Three.js + @pixiv/three-vrm | 已有 |
| **状态管理** | Zustand | 已有 |
| **后端** | Node.js / Python | 待定 |
| **数据库** | PostgreSQL / MongoDB | 待定 |
| **AI Agent** | Echuu AI Agent SDK | 已有 |
| **TTS** | OpenAI TTS / 阿里云 TTS | 已集成 |
| **推流** | LiveKit | 扣扣负责 |
| **部署** | Vercel (前端) + AWS/阿里云 (后端) | 待定 |

---

## 9. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| VRM 表情映射复杂度 | 表情不自然 | 先支持基础表情，迭代优化 |
| 口型同步延迟 | 音画不同步 | 预加载音频+提前计算 |
| 推流稳定性 | 直播中断 | LiveKit 断线重连 + 监控告警 |
| AI 生成内容质量 | 内容不当 | 内容审核 + 敏感词过滤 |

---

## 10. 成功指标

| 指标 | 目标 | 衡量方式 |
|------|------|----------|
| 首次开播时间 | < 5 分钟 | 从注册到开播 |
| 表情自然度 | 用户满意度 > 80% | 用户调研 |
| 推流稳定性 | 99% uptime | 监控系统 |
| 月活用户 | 1000+ | 数据分析 |

---

## 附录 A: 现有代码资源

### 已有仓库

| 仓库 | 描述 | 路径 |
|------|------|------|
| echuu-agent | AI Agent SDK (Python) | D:\vtuberclip\echuu-agent |
| echuu-web | 后端 Dashboard | echuu-agent/echuu-web |
| nextjs-vtuber-mocap | 前端 VRM 渲染 | E:\nextjs-vtuber-mocap |

### 前端关键文件

```
src/components/dressing-room/VRMAvatar.tsx  - VRM 加载与渲染核心
src/lib/vrm/                                - VRM 工具函数
src/hooks/use-scene-store.ts                - 全局状态管理
src/lib/animation-manager.ts                - 动画管理
```

### 需新增的文件

```
src/lib/agent-bridge.ts          - AI Agent WebSocket 连接
src/lib/expression-mapper.ts     - 情感→BlendShape 映射
src/lib/lip-sync.ts              - 口型同步处理
src/lib/action-player.ts         - 动作指令播放器
```

---

## 附录 B: API 设计草案

### 用户相关
```
POST /api/auth/login          - 登录
POST /api/auth/register       - 注册
GET  /api/auth/me             - 获取当前用户
```

### 角色相关
```
GET  /api/characters          - 获取角色列表
POST /api/characters          - 创建角色
PUT  /api/characters/:id      - 更新角色
DELETE /api/characters/:id    - 删除角色
```

### 直播相关
```
POST /api/streams             - 创建直播
GET  /api/streams/:id         - 获取直播信息
POST /api/streams/:id/start   - 开始直播
POST /api/streams/:id/stop    - 停止直播
```

### WebSocket (实时通信)
```
ws://server/agent             - AI Agent 输出流
ws://server/chat              - 弹幕/聊天
```

---

*文档持续更新中...*
