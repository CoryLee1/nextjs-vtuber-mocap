# 多源 Rig 动画重定向到 VRM：经验与通用方案

本文档在 Mixamo→VRM 重定向已正确的基础上，**总结可复用经验**，并给出**把不同骨骼结构（Mixamo、UE4 Mannequin、KAWAII 等）统一 target 到 VRM** 的通用思路，避免“每种动画都重新研究 mapping”。

**→ 对不齐/扭曲的原因、所需数据与推荐工作流见：[retargeting-why-and-workflow.md](./retargeting-why-and-workflow.md)。**

---

## 1. 从 Mixamo 重定向中总结的经验

### 1.1 重定向本质是「骨骼名 + 坐标系 + 比例」

- **骨骼名**：源 rig 的 bone 名 → VRM Humanoid 名（如 `hips`、`leftUpperArm`）。不同 rig 命名完全不同，必须有一层映射。
- **坐标系**：源可能是 Y-up（Mixamo）或 Z-up（KAWAII、UE4）；VRM 内部 Y-up。旋转用**世界四元数 rest-pose 补偿**可以吸收一部分差异，但**根节点位移**（如 hips position）若源是 Z-up，需要先转成 Y-up 再按 VRM 比例缩放。
- **比例**：根节点位移要按「VRM 的 hips 高度 / 源 rig 的 hips 高度」缩放，否则角色会飘或贴地。源的“hips 高度”要用**该 rig 的 hips 节点**（命名因 rig 而异）。

### 1.2 一套公式可复用、映射表按 rig 来

- **旋转**：`parentRestWorld × trackQuat × restWorldInverse` + VRM 0.x 时四元数 x/z 取反 —— 这套对**所有 rig** 都一样，不需要每种动画单独研究。
- **根节点位移**：`(VRM 0.x 时 x/z 取反) × (vrmHipsHeight / motionHipsHeight)` —— 公式统一；差异只在「谁算 motionHipsHeight」：要找到**当前 rig 的 hips 节点**，用它的 `position.y`（或 Z-up 时用 `position.z`）作为 motion 高度。
- **骨骼映射**：Mixamo 用 `MIXAMO_VRM_RIG_MAP`，其它 rig 要么**显式表**（如 `KAWAII_VRM_RIG_MAP`），要么靠**通用 auto-mapper**（前缀剥离 + 同义词 + 左右 + 部位）推断。显式表更稳，auto-mapper 适合命名较规范的 rig。

### 1.3 不要为每种动画单独写逻辑

- 目标始终是 **VRM Humanoid**（固定一套骨骼名）。
- 新增一种**源 rig** 时，只做两件事：**(1) 骨骼名 → VRM 的映射**（表或扩展 auto-mapper），**(2) 该 rig 的 hips 节点名**（用于高度比）。旋转/位移公式、rest-pose、VRM 0.x 全部共用。

---

## 2. 通用方案：如何正确把任意 Rig target 到 VRM

### 2.1 统一流程（与 rig 无关）

```
FBX 加载 → 选 Clip → 对每条 track：
  1. 解析骨骼名 + 属性（quaternion / position / scale）
  2. 骨骼名 → VRM 名（查该 rig 的映射表，或 autoMapBoneToVrm）
  3. 取源场景中的骨骼节点、VRM 的对应节点
  4. 旋转：世界 rest-pose 补偿 + 写入 VRM 节点名.quaternion（VRM 0.x 时 x/z 取反）
  5. 仅 hips 的 position：motionHipsHeight（当前 rig 的 hips 节点）→ 缩放 + VRM 0.x 取反 → 写入
  6. scale 不重定向
```

其中「该 rig 的映射表」和「该 rig 的 hips 节点名」是**唯二的 rig 相关输入**。

### 2.2 Rig 检测（可选）

- 若希望自动识别来源，可在一开始根据 **clip 的 track 名前缀/根节点名** 判断：
  - 例如存在 `mixamorigHips` / `mixamorig1Hips` → Mixamo；
  - 存在 `Armature|` 或特定前缀 → Unity/KAWAII；
  - 再选对应的 **boneMap** 和 **hipsNodeNames**。
- 若不做检测，可**先查 Mixamo 表，查不到再走 auto-mapper**（当前实现），这样 Mixamo 最准，其它 rig 靠 auto-mapper 或后续加表。

### 2.3 新增一种 Rig 的标准流程（避免每次重研究）

1. **拿一份该 rig 的样本 FBX**（带一条动画即可）。
2. **列出所有 track 的骨骼名**：在控制台或临时代码里 `clip.tracks.map(t => t.name.split('.')[0])`，去重得到该 rig 的骨骼列表。
3. **做映射表**：
   - 选项 A：在 `constants.ts` 里加 `RIGNAME_VRM_RIG_MAP`（与 `MIXAMO_VRM_RIG_MAP` 同结构），按解剖位置把每个源骨骼名对应到 VRM humanoid 名（可参考 `VRM_BONE_NAMES` 和现有 Mixamo 表）。
   - 选项 B：若命名较规范（如 LeftUpperArm、Hips），在 `animation-manager.ts` 里给 `STRIP_PREFIXES` / `SYNONYMS` 增加该 rig 的前缀或同义词，让 `autoMapBoneToVrm` 能推断出来。
4. **确定 hips 节点名**：在样本 FBX 里，根位移一般绑在「臀部」节点上；从步骤 2 的列表里找到对应那个（常叫 Hips、Pelvis、mixamorigHips、或 Armature|Hips 等），记下**在场景里实际存在的名字**（`getObjectByName` 用）。
5. **若该 rig 是 Z-up**（如 KAWAII、UE4）：在重定向** hips position** 时，先用 `coordinate-axes.ts` 的 `detectPositionUpAxis` / `convertPositionZUpToYUp` 转成 Y-up，再乘高度比和 VRM 0.x 取反。（当前 Mixamo 分支未做 Z-up 转换，因为 Mixamo 已是 Y-up。）

实现上可以：
- **短期**：在 `remapAnimationToVrm` 里对「非 Mixamo」分支（例如先查 Mixamo 表，没有再用 auto-mapper）用同一套 rest-pose/公式，但 **motionHipsHeight** 的取值改为：若当前 rig 有配置则用其 hips 节点名列表 `getObjectByName` 取节点，否则用已有 fallback（如 Hips、pelvis）。
- **中期**：抽成「rig 配置」结构，例如 `{ clipName?, hipsNodeNames: string[], boneMap: Record<string, string>, upAxis?: 'y'|'z' }`，按 rig 检测结果选配置，这样加新 rig 只加数据不改主流程。

---

## 3. KAWAII 动画正确 target 到 VRM 的要点

### 3.1 骨骼结构不一致是正常的

- Mixamo、UE4 Mannequin、KAWAII（以及 Unity Humanoid 等）**骨骼数量和命名都不同**，这是常态。不需要让它们彼此对齐，只需要**各自映射到同一目标：VRM Humanoid**。

### 3.2 KAWAII 需要单独做的两件事

- **原点不被带走**：项目里对 KAWAII **不输出 hips 的 position track**，角色始终在原点 (0,0,0)，切回其他动画时不会出现 origin 偏移。若以后需要 KAWAII 根位移，可改为「相对第一帧」或可选开启。
- **减少扭曲**：KAWAII 使用 **Z-up 管线**：在 Z-up 空间做局部 rest 补偿（`localRest⁻¹ × anim`，track 与 rest 均为 Z-up），再对**结果**四元数做一次 Z→Y 转换后写入 VRM，避免「Y-up track × Z-up rest」混用导致扭曲。

1. **骨骼名 → VRM 的映射**
   - 若 KAWAII 导出的 FBX 里骨骼名是 Unity 风格（如 `Armature|Hips`、`Body`、`Left Arm` 等），可以先在样本 FBX 上跑一遍 `clip.tracks` 看实际名字。
   - 若名字和 Mixamo 完全不一样，建议在 `constants.ts` 增加 **`KAWAII_VRM_RIG_MAP`**（或类似命名），格式同 `MIXAMO_VRM_RIG_MAP`；在 `remapAnimationToVrm` 里先根据 rig 检测用 KAWAII 表，再用 Mixamo 表，最后 auto-mapper。
   - 若 KAWAII 命名和已有 SYNONYMS 兼容（如 Left Upper Arm、Hips），只需在 `STRIP_PREFIXES` 里加 KAWAII 的前缀（如 `Armature|` 已有），必要时补几条 SYNONYMS，让 auto-mapper 能解析。

2. **Hips 节点名 + 坐标系**
   - 确定 KAWAII FBX 里「臀部」节点在场景中的名字（可能与 track 名一致，或带 Armature| 前缀）。
   - 项目里已注明 KAWAII 为 **Z-up**（`coordinate-axes.ts`）。因此 hips 的 **position** 需要：
     - 用该 rig 的 hips 节点的 **local position**：若 Z-up，高度在 `position.z`，可 `motionHipsHeight = Math.abs(hipsNode.position.z)` 或用 `convertPositionZUpToYUp` 后再取 Y 分量；
     - 与 VRM 的 Y-up 高度比换算后，再应用 VRM 0.x 的 x/z 取反。

### 3.3 为什么 Mixamo 没问题、KAWAII 却容易扭曲？

| 维度 | Mixamo | KAWAII（及多数 Unity/Unreal 导出） |
|------|--------|-------------------------------------|
| **坐标系** | FBX 已是 **Y-up**，和 VRM 一致；track 与场景同一套轴，无需转换。 | FBX 是 **Z-up**；Three.js FBXLoader 会对**根节点**施加 -90° 绕 X，子节点 local 仍是原始 Z-up。 |
| **Rest 与 Track 空间** | 世界 rest 四元数、track 四元数都在 Y-up，直接 `parentWorld × track × worldRestInv` 即可。 | Track 是 **Z-up 局部旋转**，rest 从场景读到的 `node.quaternion` 是 **Z-up 局部**。若先把 track 转成 Y-up 再乘 Z-up 的 restInv，会**混用两种空间**，导致扭曲。正确做法：在 Z-up 里做 rest 补偿，再对**结果**做一次 Z→Y 转换。 |
| **参考实现** | 社区 `remapMixamoAnimationToVrm` + `mixamoVRMRigMap` 就是为 Mixamo Y-up 设计的，公式和轴都对齐。 | 没有统一“KAWAII → VRM”的参考；需要自己保证「rest 与 track 同一坐标系，最后再统一转 Y-up」。 |

当前实现里，KAWAII 使用 **Z-up 管线**：用原始 Z-up track × 局部 rest 逆，在 Z-up 空间算完再对每个四元数做 `convertQuaternionZUpToYUp`，再写 VRM。若仍有个别骨骼不对，再往下看「需要哪些数据」做微调。

### 3.4 解决对齐问题需要哪些数据？

要精修某一源 rig（如 KAWAII）的扭曲，下面这些数据能直接帮助排查和改公式：

1. **每骨骼的 rest 姿态（局部四元数）**  
   - 从 FBX 场景里读：加载该 FBX 后，对每个有动画 track 的骨骼取 `node.quaternion`（local）、可选再取 `node.getWorldQuaternion()`。  
   - 用途：确认 rest 是在 Z-up 还是已被 loader 影响，和 track 是否同空间。

2. **每条 track 的第 0 帧（或第一帧）数值**  
   - 例如 `Hips.quaternion`、`Spine.quaternion`、`LeftUpperArm.quaternion` 等的第一帧 xyzw。  
   - 用途：和 rest 对比，看「第一帧 ≈ rest」是否成立、轴是否一致；若不一致，说明 track 与当前 rest 不是同一坐标系。

3. **同一骨骼在「已知正确」的 Mixamo 动画里的对应数据（可选但很有用）**  
   - 同一个 VRM 上播一段 Mixamo 动画（例如 Idle），导出或打印该 VRM 的 hips/spine/leftUpperArm 等在某一帧的**局部四元数**。  
   - 用途：和 KAWAII 重定向后的同一帧对比，看差的是整体轴转换还是某几根骨头需要单独符号/轴翻转。

4. **哪些骨骼扭曲、哪些正常**  
   - 例如「手臂张开/交叉、腿错位，但头/脊柱大致对」。  
   - 用途：优先修问题骨骼的映射或在该骨骼上做额外轴/符号修正（类似 test-kawaii 的 per-bone sign flips）。

5. **该 rig 的官方或社区文档（若有）**  
   - 例如「Unity Humanoid 导出 FBX 时，旋转是 local 且 Z-up」等说明。  
   - 用途：确认 track/rest 的约定，避免猜错坐标系。

有了 1+2（以及可选的 3、4），就可以判断是「rest 与 track 空间不一致」「缺某根骨头的映射」还是「需要 per-bone 的轴/符号修正」，并针对性改代码或映射表。

**项目内已提供的支持：**

- 播一次 KAWAII 动画时，在 **development** 下控制台会打出 `[AnimationManager] KAWAII 诊断`，内含每个骨骼的 **restLocal**（场景中该骨骼的局部四元数）和 **firstFrame**（该 track 第一帧 xyzw）。可复制该 JSON 与 Blender 导出对比。
- 诊断样本已保存为 **`docs/kawaii-retarget-diagnostic-sample.json`**（主躯干/四肢骨骼），便于与 Blender 或后续样本对比。
- `constants.ts` 中的 **`KAWAII_QUAT_SIGN_FLIPS`**：键为 VRM 骨骼名，值为 `[sx, sy, sz, sw]`，与四元数 xyzw 逐分量相乘。已根据上述诊断样本预填**手臂链**（左 [-1,1,-1,1]、右 [1,-1,1,1]）和**大腿**（[1,-1,1,1]）；若某骨仍扭曲，可单独增删或改该骨骼的符号，保存后重试。

### 3.5 用 Blender 导出参考数据并填入 KAWAII_QUAT_SIGN_FLIPS

1. 在 Blender 中打开同一 KAWAII FBX（与项目里用的是同一文件）。
2. 在 **Action Editor** 或 **NLA** 里选中该动画，确保时间在第 0 帧（或第一帧）。
3. 对需要对比的骨骼（如 Hips、Spine、LeftUpperArm…），在 **Object Properties / Bone** 或脚本里读取其 **局部旋转四元数**（Quaternion，xyzw）。Blender 默认可能是 WXYZ，需转成 **xyzw** 再与项目 log 里的 `firstFrame` / `restLocal` 对比。
4. 若某骨骼在 Blender 里与项目里「差一个符号」（例如 x、z 反号），则在 `KAWAII_QUAT_SIGN_FLIPS` 中为该 VRM 骨骼名填 `[-1, 1, -1, 1]`（仅示例，按实际需要的分量取反填）。
5. 保存 `constants.ts`，重新播 KAWAII 动画验证；可多次迭代只修仍扭曲的骨骼。

### 3.6 建议落地顺序

1. 用一份 **KAWAII 样本 FBX** 打印所有 track 骨骼名，整理成列表。
2. 在 `constants.ts` 新增 `KAWAII_VRM_RIG_MAP`（或先试 auto-mapper + 前缀/同义词，不够再加表）。
3. 在 `remapAnimationToVrm` 中增加「rig 类型」判断（例如按 track 名前缀或根节点）；若为 KAWAII：用 KAWAII 映射表、用 KAWAII 的 hips 节点名取 motionHipsHeight，并对 hips position 做 Z-up→Y-up 再缩放。
4. 身体/手指若有个别对不齐，再按解剖位置微调映射表；若仍扭曲，用 3.4 的参考数据 + 3.5 的 Blender 导出填 `KAWAII_QUAT_SIGN_FLIPS` 做 per-bone 修正。

---

## 4. 小结

| 问题 | 做法 |
|------|------|
| 每种动画都要重新研究 mapping？ | 不用。**目标固定为 VRM**；每种**源 rig** 只做一次：骨骼映射表（或扩展 auto-mapper）+ hips 节点名；旋转/位移公式全 rig 共用。 |
| Mixamo 和 UE4/KAWAII 骨骼结构不一致？ | 正常。各 rig **分别**做「源骨骼名→VRM」映射即可，不需要 Mixamo 和 UE4 之间互相对齐。 |
| 怎么加新 rig（如 KAWAII）？ | 标准 5 步：样本 FBX → 列骨骼名 → 建映射表或扩展同义词/前缀 → 定 hips 节点名 → 若 Z-up 则 hips position 做轴转换。 |
| 公式要每种动画写一遍吗？ | 不要。世界四元数 rest-pose、VRM 0.x 取反、臀部高度比，**所有 rig 共用同一套**；只有「映射表」和「hips 节点名」（及可选 Z-up 转换）按 rig 配置。 |

这样以后新增一种动画来源时，只需要**按文档做一次映射和配置**，不再为每种动画重新研究整套方案。
