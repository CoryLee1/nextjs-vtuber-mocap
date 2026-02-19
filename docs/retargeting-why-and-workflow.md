# 动画对不齐和扭曲：原因、所需数据与推荐工作流

本文说明**为什么**重定向会对不齐/扭曲、**需要哪些数据**才能修好、以及**推荐工作流**。

---

## 1. 对不齐和扭曲的根本原因

### 1.1 三类原因（按优先级）

| 原因 | 表现 | 说明 |
|------|------|------|
| **① 坐标系不一致** | 全身或整条骨骼链方向错、扭成奇怪角度 | 源动画的 **track 四元数** 和场景里读到的 **rest 四元数** 不在同一套轴（一个 Y-up 一个 Z-up，或 loader 只转了根节点没转 track），做 `restInv × track` 时混用两套空间，结果就错。 |
| **② 骨骼名/映射错误** | 某几根骨头错位、或整段动画完全错 | 源 rig 骨骼名没正确映射到 VRM Humanoid 名，或映射到了错误的 VRM 骨（如左右搞反、手指对错）。 |
| **③ 同一坐标系下的轴/符号差异** | 单根或少数骨头方向反了（如手臂张开方向反、腿弯反） | 即使 rest 与 track 同空间，不同 DCC/引擎的**四元数约定**（手性、轴方向）可能差一个符号或轴翻转，需要 per-bone 的符号修正。 |

当前项目里：

- **Mixamo**：FBX 和 track 都是 Y-up，和 VRM 一致，用世界 rest 补偿即可，所以**不容易扭曲**。
- **KAWAII / Unreal 等**：
  - 若 FBX 被 Three.js 识别为 **Z-up**（根节点有 -90° X）：我们只在「Z-up 管线」下用 **Z-up 的 rest 和 原始 track** 做补偿，再整体转 Y-up，这样 rest 和 track 同空间，**不会因坐标系混用而全身扭**。
  - 若 FBX 被识别为 **Y-up**（如部分 Unreal 导出）：我们按 Y-up 做 `restInv × track`。此时若**实际 track 仍是 Z-up 约定**，就会变成「Y-up rest × Z-up track」→ **① 坐标系不一致**，全身扭曲；反之若 track 也是 Y-up，则符号修正表（当前为 Z-up 调参）**不能**套用，否则会**③ 过度修正**，也会扭曲。

所以：**对不齐/扭曲要么是「rest 和 track 不在同一坐标系」（①），要么是「映射或 per-bone 符号用错」（②③）。**

---

## 2. 要修好对齐，需要哪些数据

要**确定**是上面哪一种原因并修对，需要这些数据（按必要性排序）：

### 2.1 必要：源 rig 的 rest 与 track 第一帧（同空间性）

- **每根有动画的骨骼**：
  - **rest 局部四元数**：FBX 加载后 `node.quaternion`（xyzw）。
  - **该骨骼 track 的第一帧四元数**：`track.values` 的前 4 个分量（xyzw）。
- **用途**：看 `firstFrame ≈ rest` 是否成立。
  - 若**成立**：rest 和 track 在同一坐标系，问题多半是 ② 或 ③。
  - 若**不成立**（例如 rest.y 与 firstFrame.y 反号、或整体差一个旋转）：说明 rest 与 track 空间不一致 → ①，需要统一坐标系（例如统一在 Z-up 做补偿再转 Y-up，或对 rest/track 做轴转换）。

**项目内**：development 下播一次该动画会打 `[AnimationManager] KAWAII 诊断`，并自动下载 JSON，内含 `restLocal`、`firstFrame`、`firstFrameOut`。用这份 JSON 即可做上述对比。

### 2.2 必要：场景是 Y-up 还是 Z-up

- **来源**：Three.js 加载 FBX 后，根节点四元数若为 -90° 绕 X（x≈-√2/2, w≈√2/2）则视为 **Z-up**，否则 **Y-up**（见 `detectFbxSceneZUp`）。
- **用途**：决定是否走「Z-up 管线」、是否对 rest 做轴转换、以及**是否应用** `KAWAII_QUAT_SIGN_FLIPS`（当前仅 Z-up 管线下应用）。

诊断 JSON 里的 **`meta.isZUp`** 就是当前判断结果。

### 2.3 推荐：Blender 里同一 FBX 的 rest / 第一帧

- 在 Blender 打开**同一 FBX**，同一帧（第 0 帧或第一帧）下，导出需要对比的骨骼的**局部四元数**（注意 Blender 常为 WXYZ，需转成 xyzw）。
- **用途**：和项目导出的诊断 JSON 对比，确认我们读到的 rest / firstFrame 是否和 DCC 一致；若不一致，能判断是 loader 差异还是轴/符号约定差异。

### 2.4 可选：已知正确的参考（如 Mixamo 同帧）

- 同一 VRM 上播一段**已对齐**的 Mixamo 动画，导出某一帧的 hips / spine / leftUpperArm 等的**局部四元数**。
- **用途**：和问题源（如 KAWAII/Unreal）重定向后的同帧对比，看差的是整体轴转换还是某几根骨头的符号/轴。

### 2.5 可选：问题描述（哪几根骨错、怎么错）

- 例如：「手臂张开方向反」「腿弯反」「只有左臂扭」。
- **用途**：缩小范围到 ② 或 ③，优先改映射或只对问题骨做 per-bone 符号修正。

---

## 3. 推荐工作流（如何用这些数据对齐）

### 步骤 1：确认骨骼映射

- 用该源 rig 的**一份样本 FBX**，列出所有 track 的骨骼名，和 VRM Humanoid 名做映射（`KAWAII_VRM_RIG_MAP` 或 auto-mapper）。
- 确保没有左右反、没有指骨对错。

### 步骤 2：拿到诊断数据并判断坐标系

1. 在项目里播一次该动画（development），拿到自动下载的 **诊断 JSON**。
2. 看 **`meta.isZUp`**：
   - **true**：当前走 Z-up 管线；rest 与 track 应在 Z-up 空间一致；可应用 `KAWAII_QUAT_SIGN_FLIPS` 做 per-bone 微调。
   - **false**：当前按 Y-up 处理；**不要**对这段动画应用为 Z-up 调的符号表，否则容易全身扭曲。

### 步骤 3：检查 rest 与 firstFrame 是否同空间

- 在诊断 JSON 里对**关键骨**（如 hips、leftUpperArm、leftUpperLeg）看：
  - `restLocal` 与 `firstFrame` 是否接近（至少同一「象限」，不要 y 一正一负这种明显反号）。
- 若**明显不同**（例如 firstFrame.y 与 restLocal.y 反号）：
  - 说明 track 和当前读到的 rest **不是同一坐标系** → 需要改管线（例如对该类 FBX 强制用 Z-up 管线并统一把 rest 转成 Z-up 再算），或确认该 FBX 的 track 在 DCC 里到底是 Y-up 还是 Z-up。
- 若**大致同空间**：
  - 扭曲多半是 ② 或 ③，进入步骤 4。

### 步骤 4：按「问题骨」做微调（仅 Z-up 管线）

- 仅当 **isZUp === true** 时，才在 `constants.ts` 的 **`KAWAII_QUAT_SIGN_FLIPS`** 里为**具体某几根骨**填符号 `[sx, sy, sz, sw]`（与 xyzw 逐分量乘）。
- 若 isZUp 为 false（如 Unreal Take），**不要**给该动画源加全局的 sign flips；若将来要支持，应为「Y-up 源」单独维护一套表或按 clip/rig 分支。

### 步骤 5：用 Blender 交叉验证（推荐）

- 在 Blender 打开同一 FBX，导出 rest 与第一帧四元数，和诊断 JSON 对比。
- 一致 → 管线与 loader 理解正确，只需在 ②③ 上微调。
- 不一致 → 针对差异判断是轴转换问题还是符号约定问题，再决定改管线还是改 per-bone 符号。

---

## 4. 当前实现对应的行为小结

| 场景 | isZUp | 管线 | 符号修正 |
|------|-------|------|----------|
| Mixamo | 通常 false | 世界 rest 补偿，无轴转换 | 无 |
| KAWAII（如 kawaii-test FBX） | 若为 true | Z-up 空间 rest 补偿，结果转 Y-up | 应用 `KAWAII_QUAT_SIGN_FLIPS` |
| Unreal Take 等（Y-up 导出） | false | Y-up 空间 rest 补偿，无 Z-up 转换 | **不应用**，避免全身扭曲 |

要修「对不齐/扭曲」：先看诊断里的 **isZUp** 和 **restLocal vs firstFrame**，再按上面工作流决定是改坐标系管线，还是只改映射/per-bone 符号。
