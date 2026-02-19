# Blender vs 场景诊断对比分析（Unreal Take）

基于你提供的两份 JSON：
- **Blender**：`retarget_diagnostic.json`（Z_UP，第 0 帧 evaluated pose）
- **场景**：`kawaii-retarget-diagnostic-Unreal_Take-1771477862439.json`（isZUp: false，FBX 原始 track + 管线输出）

前提：**Blender 坐标系与 React Three Fiber / Three.js 不同**（Blender Z-up，Three 可能把该 FBX 当 Y-up 加载），所以 rest 与 track 的约定会差符号或轴。

---

## 1. 结论摘要

| 项目 | 说明 |
|------|------|
| **场景 isZUp** | false → 当前走 Y-up 管线，未做 Z-up 转换，也未应用 Z-up 那套符号表 |
| **Rest** | 多数骨 Scene rest = -Blender rest（四元数整体取反，同一旋转，仅约定不同） |
| **问题** | 部分骨的 **firstFrameOut**（管线输出）与 **Blender firstFrame**（期望 T-pose）差一两个分量符号，导致姿态扭曲 |
| **处理** | 为 Y-up 路径单独加一套 per-bone 符号修正表，仅对「Blender vs 场景」对比后需要翻的骨应用 |

---

## 2. 逐骨对比（firstFrameOut 与 Blender firstFrame）

目标：让场景的 **firstFrameOut** 在符号上与 **Blender firstFrame** 一致（Blender 为「正确」参考）。

| VRM 骨 | 场景 firstFrameOut (xyzw) | Blender first (xyzw) | 采用的符号修正 [sx,sy,sz,sw] |
|--------|---------------------------|----------------------|-----------------------------|
| leftUpperLeg | (0.29, **0.04**, 0.12, **-0.95**) | (0.29, **-0.04**, 0.13, **0.95**) | y,w 反 → [1, -1, 1, -1] |
| rightUpperLeg | (**0.28**, 0.06, -0.05, 0.96) | (**-0.28**, 0.05, 0.06, 0.96) | x 反 → [-1, 1, 1, 1] |
| leftUpperArm | (0.10, 0.24, **-0.04**, 0.96) | (0.12, 0.23, **0.02**, 0.97) | z 反 → [1, 1, -1, 1] |
| rightUpperArm | (-0.03, -0.24, 0.04, 0.97) | (-0.02, -0.24, 0.02, 0.97) | z 反 → [1, 1, -1, 1] |
| leftHand | (-0.07, -0.03, **0.04**, 1.0) | (-0.08, -0.03, **-0.02**, 1.0) | z 反 → [1, 1, -1, 1] |
| rightHand | (-0.01, -0.03, **-0.05**, 1.0) | (-0.02, -0.06, **0.02**, 1.0) | z 反 → [1, 1, -1, 1] |
| leftShoulder / rightShoulder | ≈ (0,0,0,-1) | ≈ (0,0,0,1) | -identity = identity，无需改 |

其余骨骼（spine、chest、手指等）两边的 firstFrame / firstFrameOut 已较接近或影响较小，未列入上表。

---

## 3. 已实现的修改

1. **constants.ts**
   - 新增 **`KAWAII_YUP_QUAT_SIGN_FLIPS`**，仅包含上述需要修正的 6 根骨：
     - leftUpperLeg: [1, -1, 1, -1]
     - rightUpperLeg: [-1, 1, 1, 1]
     - leftUpperArm, rightUpperArm, leftHand, rightHand: [1, 1, -1, 1]

2. **animation-manager.ts**
   - 当 **isKawaii && !isZUp**（Y-up 路径，如 Unreal Take）时，对每根骨若存在 **`KAWAII_YUP_QUAT_SIGN_FLIPS[vrmBoneName]`**，则对管线输出的四元数 xyzw 做逐分量相乘后再写入。
   - Z-up 路径仍只使用 **`KAWAII_QUAT_SIGN_FLIPS`**，逻辑不变。

这样在「Blender Z-up / 场景 Y-up」的前提下，用 Blender 的 firstFrame 做参考，只对 Y-up 路径下易扭的 6 根骨做符号对齐，避免全身误翻。

---

## 4. 若仍有个别骨不对

可再导出一轮 Blender + 场景诊断 JSON，对仍扭曲的骨做同样对比（firstFrameOut vs Blender firstFrame），在 **`KAWAII_YUP_QUAT_SIGN_FLIPS`** 里为该骨补上 [sx, sy, sz, sw]（按需取 ±1）即可。
