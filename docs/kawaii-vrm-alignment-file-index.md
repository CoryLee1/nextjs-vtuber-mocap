# KAWAII → VRM 动画对齐相关文件索引

用于排查「KAWAII 数据与 VTuber/VRM 动画没对齐」时，可把本索引和下列文件一起给 Claude 问：「为什么没对齐？问题可能出在哪？」

---

## 一、核心逻辑（必看）

| 文件 | 作用 |
|------|------|
| **`src/lib/animation-manager.ts`** | 重定向主流程：`remapAnimationToVrm()`。包含：rig 检测（Mixamo vs KAWAII）、Z-up vs Y-up 分支、`track * restInv` 计算、hips 共轭修正、`KAWAII_QUAT_SIGN_FLIPS` / `KAWAII_YUP_QUAT_SIGN_FLIPS` 应用、诊断用 firstFrame/restLocal/firstFrameOut 收集与 JSON 导出。 |
| **`src/lib/constants.ts`** | `KAWAII_VRM_RIG_MAP`（Blender/KAWAII 骨名 → VRM 骨名）、`KAWAII_QUAT_SIGN_FLIPS`（Z-up 时 per-bone 符号）、`KAWAII_YUP_QUAT_SIGN_FLIPS`（Y-up/Unreal Take 时 per-bone 符号）、`VRM_HUMANOID_BONE_NAMES`。 |
| **`src/lib/coordinate-axes.ts`** | Z-up 检测 `detectFbxSceneZUp()`；四元数/位移 Z-up→Y-up 转换 `convertQuaternionZUpToYUp`、`convertQuaternionTrackZUpToYUp`、`convertPositionZUpToYUp`；Y-up→Z-up `convertQuaternionYUpToZUp`。 |

---

## 二、Blender 侧（对比与模拟）

| 文件 | 作用 |
|------|------|
| **`docs/blender_apply_diagnostic_and_simulate.py`** | Blender 脚本：读取**场景诊断 JSON**，把其中的 `firstFrameOut` 应用到当前 Armature 的 Pose，在 Blender 里复现「我们发给 VRM 的姿态」；并在控制台用 `restLocal`+`firstFrame` 算 `track*restInv` 与 firstFrameOut 对比。 |
| **`docs/prompt-blender-export-retarget-data.md`** | 给 Claude 的 prompt，用于生成「从 Blender 导出 restLocal + firstFrame」的 Python 脚本，便于和场景诊断对比。 |
| **`docs/blender-vs-app-retarget-comparison.md`** | Blender 骨骼名 ↔ VRM 名对照表；Blender firstFrame（evaluated）与场景 firstFrame（FBX 原始 track）含义差异说明。 |
| **`docs/retarget-blender-simulate-usage.md`** | 上述 Blender 脚本的用法说明（改 JSON_PATH、运行、看视口/控制台）。 |

---

## 三、文档（原因与工作流）

| 文件 | 作用 |
|------|------|
| **`docs/retargeting-why-and-workflow.md`** | 对不齐/扭曲的三大原因（坐标系混用、映射错误、per-bone 符号）；所需数据；推荐排查工作流。 |
| **`docs/animation-retargeting-multi-rig.md`** | 多 rig（Mixamo、KAWAII、Unreal）通用方案；KAWAII 的 Z-up 管线、骨骼映射、`KAWAII_QUAT_SIGN_FLIPS` 填写方式。 |
| **`docs/retarget-blender-vs-scene-analysis-2026-02.md`** | 基于 Blender vs 场景诊断的逐骨对比与采用的 Y-up 符号修正表。 |
| **`docs/mixamo-vrm-retargeting.md`** | Mixamo→VRM 参考与实现要点（KAWAII 是另一套分支）。 |
| **`.cursor/rules/mixamo-vrm-retarget.mdc`** | 项目规则：改重定向时需遵守的约定。 |

---

## 四、脚本与样本数据

| 文件 | 作用 |
|------|------|
| **`scripts/inspect-kawaii-fbx.mjs`** | Node 脚本：解析 KAWAII FBX，打印骨骼名，用于制作/核对 `KAWAII_VRM_RIG_MAP`。运行：`node scripts/inspect-kawaii-fbx.mjs [FBX路径]`。 |
| **`scripts/validate-kawaii-mapping.mjs`** | 批量校验 KAWAII 骨骼映射覆盖率（依赖外部 FBX 目录，可选）。 |
| **`docs/kawaii-retarget-diagnostic-sample.json`** | 诊断样本：部分骨骼的 restLocal / firstFrame（xyzw），用于和 Blender 或新诊断对比。 |

---

## 五、入口与配置（上下文）

| 文件 | 作用 |
|------|------|
| **`src/hooks/use-animation-library.ts`** | 动画库列表，含 KAWAII 测试动画 URL（如 `kawaii-test/@KA_Idle50_StandingTalk1_1.FBX`）。 |
| **`src/app/v1/test-kawaii/page.tsx`** | 若存在：KAWAII 测试页（规则要求不改 v1，仅作定位用）。 |
| **`CLAUDE.md`** | 项目总览；重定向相关文档的引用。 |

---

## 六、给 Claude 的提问示例

把本索引和上述「一、核心逻辑」里的 3 个文件（以及你手上的 **场景诊断 JSON**、可选 **Blender 导出的 retarget_diagnostic.json**）一起发给 Claude，可以这样问：

- 「我们做的是把 KAWAII/Unreal 的 FBX 动画重定向到 VRM（VTuber）。当前人物姿态还是扭曲/没对齐。索引里列出了所有相关代码和文档。请根据 `animation-manager.ts`、`constants.ts`、`coordinate-axes.ts` 和诊断 JSON，分析：1）管线里 rest 与 track 的空间是否一致？2）第一帧 firstFrame 与 rest 的关系（是否共轭、是否同轴）？3）还有哪些骨或步骤可能导致没对齐？给出具体修改建议。」

如需 Blender 侧对比，可再加上 `docs/blender_apply_diagnostic_and_simulate.py` 和 `docs/blender-vs-app-retarget-comparison.md`。
