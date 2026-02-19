# Mixamo → VRM 动画重定向（Retargeting）

本文档记录项目内 **FBX/Mixamo 动画重定向到 VRM** 的参考依据、实现要点与经验总结。当前实现已与社区参考逻辑对齐，**动画表现正确**，修改重定向相关代码时请勿破坏以下约定。

---

## 1. 参考实现

重定向逻辑以以下两个参考为准（与 three-vrm / Mixamo 导出生态一致）：

- **骨骼映射表**：`mixamoVRMRigMap` — Mixamo 骨骼名 → VRM Humanoid 骨骼名（含身体 + 手指）。
- **重定向函数**：`remapMixamoAnimationToVrm(vrm, asset)` — 从 FBX 取出 clip、按映射表重写 track、应用 rest-pose 旋转补偿、臀部高度缩放、VRM 0.x 轴翻转。

项目内对应位置：

- 骨骼表：`src/lib/constants.ts` → `MIXAMO_VRM_RIG_MAP`（已合并参考中的手指映射）。
- 重定向：`src/lib/animation-manager.ts` → `remapAnimationToVrm(vrm, fbxScene)`。

---

## 2. 实现要点（必须保持一致）

### 2.1 Clip 选择

- 优先使用 **clip 名 `"mixamo.com"`**（Mixamo 导出 FBX 的默认动画名）。
- 若无则使用 **第一个 clip**，以兼容非 Mixamo 或重命名过的 FBX。

```ts
const srcClip = THREE.AnimationClip.findByName(fbxScene.animations, 'mixamo.com')
    ?? fbxScene.animations[0];
```

### 2.2 骨骼映射表

- 使用 **`MIXAMO_VRM_RIG_MAP`** 作为权威映射（key = Mixamo 名如 `mixamorigHips`，value = VRM humanoid 名如 `hips`）。
- 须包含 **身体 + 四肢 + 手指**（如 `mixamorigLeftHandThumb1` → `leftThumbMetacarpal` 等），与参考 `mixamoVRMRigMap` 一致。
- 部分 FBX 导出为 **`mixamorig1*`**（如 `mixamorig1Hips`）：查表前先将 `mixamorig1` 归一化为 `mixamorig` 再查表；FBX 场景内取节点时需同时尝试 `mixamorig` / `mixamorig1` 两种命名。

### 2.3 旋转（Quaternion）重定向

- **Rest-pose 补偿必须用世界四元数**（与参考一致）：
  - `restRotationInverse` = 当前骨骼 **世界** rest 四元数的逆：`srcNode.getWorldQuaternion(restRotationInverse).invert()`。
  - `parentRestWorldRotation` = 父骨骼的 **世界** rest 四元数：`srcNode.parent.getWorldQuaternion(parentRestWorldRotation)`。
- 公式：**result = parentRestWorldRotation × trackQuat × restRotationInverse**（`premultiply(parent).multiply(restInv)`）。
- **VRM 0.x**：对 QuaternionKeyframeTrack 的数值，将 **x、z 分量取反**（即索引 `i % 2 === 0` 时 `-v`），与参考一致。
- **不要**对左臂单独再做一次四元数翻转；参考实现中没有这一步，依赖上述 rest-pose + VRM 0.x 处理即可。

### 2.4 臀部位移（Position）重定向

- **高度比**：
  - 分子：VRM 的 hips 相对 root 的世界高度差：`vrmHipsHeight = Math.abs(vrmHipsY - vrmRootY)`。
  - 分母：Mixamo 的 hips **local `position.y`**（优先 `mixamorigHips` / `mixamorig1Hips`）：`motionHipsHeight = srcHipsNode.position.y`。
  - `hipsPositionScale = vrmHipsHeight / motionHipsHeight`。
- **只对 hips 的 position track** 做重定向；其他骨骼的 position 不写（避免破坏比例）。
- 对每个 position 分量：先按 **VRM 0.x** 对 x、z 取反（`i % 3 !== 1 ? -v : v`），再乘 `hipsPositionScale`。与参考一致，不做额外的 Y-up/Z-up 轴转换。

### 2.5 其他约定

- **不重定向 `.scale`**：scale 存的是源骨骼比例，直接套到 VRM 会破坏体型。
- **additive 动画**：与基础动画走同一套 `remapAnimationToVrm`，再在 mixer 里做 additive 叠加；骨骼映射与上述规则一致。

---

## 3. 项目内相关文件

| 用途           | 文件 |
|----------------|------|
| 骨骼映射表     | `src/lib/constants.ts` → `MIXAMO_VRM_RIG_MAP` |
| 重定向实现     | `src/lib/animation-manager.ts` → `remapAnimationToVrm` |
| additive 加载与混合 | `src/lib/animation-manager.ts`（additive clip 加载、makeClipAdditive、mixer 权重） |
| 动捕 pose→VRM | `src/lib/mocap/vrm-adapter.ts`（与 FBX 重定向无关，是另一条管线） |

---

## 4. 经验总结

1. **以参考实现为准**：社区常用的 `remapMixamoAnimationToVrm` + `mixamoVRMRigMap` 已经过大量验证，动画“正常”的状态就是与它们对齐后的状态；不要随意改成“本地 rest 四元数”或自定义轴翻转。
2. **世界四元数 vs 本地四元数**：Rest-pose 补偿必须用 **世界** 四元数（当前骨骼与父骨骼的 getWorldQuaternion），用本地会导致旋转错乱。
3. **VRM 0.x 与 1.0 坐标系不同**：0.x 需要在四元数上对 x/z 取反、在 position 上对 x/z 取反，否则会出现镜像或扭臂等问题。
4. **臀部高度用 local position.y**：参考里用 Mixamo hips 的 **local** `position.y` 作为 motion 高度参与缩放，与“世界高度差”配合后，根节点位移比例才正确。
5. **骨骼表要完整**：手指等小关节若缺失映射，会出现手指不动或错位；与参考的 `mixamoVRMRigMap` 对齐（含手指）后重定向才完整。
6. **mixamorig1 兼容**：部分 FBX 导出为 `mixamorig1*`，需要在查表与 getObjectByName 两处都做前缀归一化/多名称查找，否则会得到 0 条 track。

---

## 5. 修改时的自检清单

- [ ] 若改 `remapAnimationToVrm`：是否仍使用世界四元数 rest-pose、VRM 0.x 四元数/position 取反、臀部缩放公式？
- [ ] 若改 `MIXAMO_VRM_RIG_MAP`：是否保留身体+手指完整映射、且 key 为 mixamorig*（或查表前做 mixamorig1→mixamorig）？
- [ ] 若改 clip 选择逻辑：是否仍优先 `"mixamo.com"` 再 fallback 第一个？
- [ ] additive 是否仍使用同一套 remap，未单独改旋转/位移公式？

以上都满足时，重定向行为与当前“正常”状态一致。

---

## 6. 多源 Rig 与 KAWAII

- **经验可复用**：旋转/位移公式、rest-pose、VRM 0.x 处理对**所有 rig 共用**；只有「骨骼映射表」和「hips 节点名」按 rig 不同。
- **Mixamo 与 UE4/KAWAII 骨骼不一致**：不需要彼此对齐，各做「源骨骼名 → VRM」映射即可。
- **新增 rig（含 KAWAII）的标准流程**、**KAWAII 的 Z-up 与 hips 处理**，见 **`docs/animation-retargeting-multi-rig.md`**。以后每种新动画来源只需按该文档做一次映射与配置，不必重复研究整套方案。
