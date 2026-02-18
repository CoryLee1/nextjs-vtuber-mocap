# VTuber 动画状态机规划

用状态机控制「默认/待机」与「说话」两套动作，并与后端 Echuu 的音频状态联动。

---

## 一、现状简要

| 点 | 说明 |
|----|------|
| **动画** | 当前只有一个 `animationUrl`（store），通常是一个 Idle.fbx，全局共用。 |
| **说话时** | `echuuAudioPlaying` 为 true 时，只叠加表情 + 口型（`applyEchuuCue`），**没有**切换到「说话动作」FBX。 |
| **后端** | 已通过 WebSocket 推 step 事件（含 `audio_b64`）；`EchuuLiveAudio` 播完后设置 `setEchuuAudioPlaying(true/false)`。 |
| **动画管理器** | `useAnimationManager(vrm, animationUrl)` 已支持 `animationUrl` 变化时重新加载并播放新 FBX。 |

结论：**后端不用改**，只需在前端加「状态机 + 动画配置」，根据 `echuuAudioPlaying` 切换要播的 `animationUrl` 即可。

---

## 二、状态机设计

### 2.1 状态

- **IDLE**：待机，播「待机动画」列表中的某一个（可轮换/随机）。
- **SPEAKING**：AI 正在说话，播「说话动画」列表中的某一个。

### 2.2 输入（来自现有 store）

- `echuuAudioPlaying: boolean`  
  - `true` → 当前在播 TTS，应进入/保持 **SPEAKING**。  
  - `false` → 进入/保持 **IDLE**。

可选：若以后要更细（例如「思考中」「听歌中」），可再读 `streamState`（idle / performing）或 step 的 `stage`，本阶段只做 IDLE / SPEAKING 即可。

### 2.3 转移

```
         audio 开始播放
  IDLE ──────────────────────► SPEAKING
    ▲                              │
    │     audio 播放结束            │
    └──────────────────────────────┘
```

实现：  
`currentState = echuuAudioPlaying ? 'SPEAKING' : 'IDLE'`。

---

## 三、动画配置（idle / speaking 列表）

### 3.1 配置结构建议

在**前端**维护一份「状态 → 动画列表」配置（例如 `src/config/vtuber-animations.ts` 或 JSON），不依赖后端接口：

- **idle**：多个待机 FBX（对应 `public/models/animations` 或 S3）。
- **speaking**：多个说话 FBX。

示例（与 `public/models/animations` 对应）：

```ts
// 示例：src/config/vtuber-animations.ts
const ANIM_BASE = '/models/animations'; // 或 S3 base URL

export const VTUBER_ANIMATION_CONFIG = {
  idle: [
    { id: 'idle_1', name: 'Sad Idle', url: `${ANIM_BASE}/Sad Idle.fbx` },
    { id: 'idle_2', name: 'Listening To Music', url: `${ANIM_BASE}/Listening To Music.fbx` },
    { id: 'idle_3', name: 'Bashful', url: `${ANIM_BASE}/Bashful.fbx` },
    { id: 'idle_4', name: 'Disappointed', url: `${ANIM_BASE}/Disappointed.fbx` },
  ],
  speaking: [
    { id: 'speaking_1', name: 'Talking', url: `${ANIM_BASE}/Talking.fbx` },
    { id: 'speaking_2', name: 'Sitting Talking', url: `${ANIM_BASE}/Sitting Talking.fbx` },
    { id: 'speaking_3', name: 'Telling A Secret', url: `${ANIM_BASE}/Telling A Secret.fbx` },
  ],
} as const;
```

- 用 **id** 方便以后扩展（例如后端指定「用 speaking_2」）。
- 当前阶段：前端按状态选列表，再从列表中选**一个**（见下）即可。

### 3.2 从列表中「选一个」的策略

- **IDLE**：  
  - 方案 A：固定用第一个（如 `idle_1`）。  
  - 方案 B：按时间轮换（例如每 30s 换一个）。  
  - 方案 C：随机选一个，进入 IDLE 时抽一次，直到切到 SPEAKING 再重抽。  

- **SPEAKING**：  
  - 方案 A：固定一个（如 `Talking.fbx`）。  
  - 方案 B：每句/每次进入 SPEAKING 时随机或轮换。  

建议先做「每状态固定一个」或「每状态列表里取第一个」，再迭代轮换/随机。

---

## 四、与后端 / 前端的联通方式

### 4.1 后端（Echuu）

- **不需要改接口。**
- 已有：WebSocket step 事件 → `EchuuLiveAudio` 播放 `audio_b64` → 在 `onStart`/`onEnd` 里调 `setEchuuAudioPlaying(true/false)`。
- 状态机只消费 `echuuAudioPlaying`，不依赖新字段。

### 4.2 前端需要做的

1. **配置**  
   - 新增 `VTUBER_ANIMATION_CONFIG`（或等价 JSON），列出 idle / speaking 的 `id` + `url`。

2. **状态机 + 选 URL**  
   - 写一个 hook，例如 `useVTuberAnimationState()`：  
     - 从 store 读 `echuuAudioPlaying`。  
     - `state = echuuAudioPlaying ? 'SPEAKING' : 'IDLE'`。  
     - 根据 state 从 config 里选一个动画（当前可写死「取列表第一个」或简单轮换）。  
     - 返回 `{ state, animationUrl }`。

3. **把选出的 URL 写回 store**  
   - 在已有「能访问 store 且能调 `setAnimationUrl`」的组件里（例如 `VTuberLayout` 或 `UILayoutRedesign` 里包住 MainScene 的那一层），调用上述 hook，在 `useEffect` 里：  
   - 当 `animationUrl` 变化时执行 `setAnimationUrl(animationUrl)`。  
   - 这样 `MainScene` → `VRMAvatar` → `useAnimationManager(vrm, animationUrl)` 会沿用现有逻辑，自动切到新 FBX。

4. **可选：与「手动选动画」的共存**  
   - 若侧栏/动画库有「用户手动选了一个动画」的逻辑，可以：  
     - 加一个 store：`animationMode: 'auto' | 'manual'`；  
     - `auto`：用状态机算出的 `animationUrl`；  
     - `manual`：用用户选的 `animationUrl`，状态机不覆盖。  

这样既满足「默认按状态机切 idle/说话」，又保留你现有的手动选动画能力。

---

## 五、文件/职责建议

| 内容 | 建议位置 |
|------|----------|
| idle / speaking 动画列表（id + url） | `src/config/vtuber-animations.ts` 或 `public/models/animations/config.json` |
| 状态机 + 选 URL 逻辑 | `src/hooks/use-vtuber-animation-state.ts`（读 `echuuAudioPlaying`，返回 `state` + `animationUrl`） |
| 把 `animationUrl` 写回 store | 在 `VTuberLayout` 或 `UILayoutRedesign` 中调 `useVTuberAnimationState()` 并 `setAnimationUrl` |
| 现有动画播放 | 不改 `useAnimationManager`、`VRMAvatar` 的接口，只让它们继续用 store 的 `animationUrl` |

---

## 六、实现顺序建议

1. 加 **动画配置**（idle 若干条 + speaking 若干条），对应 `public/models/animations` 的 FBX。  
2. 实现 **useVTuberAnimationState**：只做二状态 + 每状态取第一个（或固定 id）。  
3. 在布局层 **接上 store**：根据 hook 的 `animationUrl` 调用 `setAnimationUrl`。  
4. 验证：开播 → 有 TTS 时切到 speaking 动画，停播 → 切回 idle 动画。  
5. 再迭代：idle 轮换/随机、speaking 轮换、或以后从后端传「用哪个 id」（若需要）。

按这个顺序做，后端不用动，只在前端加配置 + 一个 hook + 一处接 store 即可打通「默认动作 + 说话动作」与后端的联动。
