# Blender 导出 vs 项目诊断：对比说明

你从 Blender 导出的 `retarget_diagnostic.json`（同一 FBX：`@KA_Idle50_StandingTalk1_1.FBX` 或同 rig 的 Unreal Take）与项目内「播同一动画后自动下载的诊断 JSON」可以按下面方式对照。

---

## 1. 骨骼名对应（Blender → VRM）

Blender 脚本导出的是 **Blender 内骨骼名**（如 `Shoulder_L`、`Upper Arm_L`），项目诊断里是 **VRM 骨骼名**（如 `leftShoulder`、`leftUpperArm`）。对应关系如下（与 `KAWAII_VRM_RIG_MAP` 一致；Blender 名中带空格的用空格，项目/映射表里用下划线）：

| Blender boneName | VRM (项目诊断里的 vrmBoneName) |
|------------------|--------------------------------|
| Hips | hips |
| Spine | spine |
| Chest | chest |
| Upper Chest | upperChest |
| Neck | neck |
| Head | head |
| Shoulder_L | leftShoulder |
| Upper Arm_L | leftUpperArm |
| Lower Arm_L | leftLowerArm |
| Hand_L | leftHand |
| Shoulder_R | rightShoulder |
| Upper Arm_R | rightUpperArm |
| Lower Arm_R | rightLowerArm |
| Hand_R | rightHand |
| Upper Leg_L | leftUpperLeg |
| Lower Leg_L | leftLowerLeg |
| Foot_L | leftFoot |
| Toes_L | leftToes |
| Upper Leg_R | rightUpperLeg |
| Lower Leg_R | rightLowerLeg |
| Foot_R | rightFoot |
| Toes_R | rightToes |
| Thumb Proximal_L | leftThumbMetacarpal |
| Thumb Intermediate_L | leftThumbProximal |
| Thumb Distal_L | leftThumbDistal |
| Index Proximal_L | leftIndexProximal |
| Index Intermediate_L | leftIndexIntermediate |
| Index Distal_L | leftIndexDistal |
| Middle Proximal_L | leftMiddleProximal |
| Middle Intermediate_L | leftMiddleIntermediate |
| Middle Distal_L | leftMiddleDistal |
| Ring Proximal_L | leftRingProximal |
| Ring Intermediate_L | leftRingIntermediate |
| Ring Distal_L | leftRingDistal |
| Little Proximal_L | leftLittleProximal |
| Little Intermediate_L | leftLittleIntermediate |
| Little Distal_L | leftLittleDistal |
| （右侧同理：_R → right*） | right* |

若 Blender 导出名是「Thumb Proximal_L」这种带空格，而项目/映射里是「Thumb_Proximal_L」，对比时先把空格换成下划线再查表。

---

## 2. 数据含义差异（重要）

| 来源 | restLocal | firstFrame |
|------|-----------|------------|
| **Blender 导出** | Rest 姿态下该骨的**局部旋转四元数**（Blender 场景内） | **第 0 帧当前 Action 生效后**，该骨的**实际姿态**（evaluated pose）的局部四元数；T-pose 时通常接近 identity (0,0,0,1) |
| **项目诊断** | Three.js 加载 FBX 后该骨在场景中的**局部四元数**（与 Blender rest 可能差一个坐标系或符号） | FBX 里该骨 **animation track 的原始第一帧数值**（未做 rest 补偿、未做 Z-up 转换） |

因此：

- **restLocal**：两边都是「该骨的 rest 姿态」，可直接逐分量对比；若仅差正负号，说明 loader/坐标系或四元数约定不同。
- **firstFrame**：  
  - Blender = 第 0 帧的**最终姿态**（T-pose 时≈ identity）  
  - 项目 = FBX 文件中该骨 track 的**原始第一帧**（可能是「相对某参考」或「另一坐标系」）  
  两者不必相等；重点看项目里 **firstFrame 与 restLocal 是否同空间**（例如 y 分量是否同号、是否成比例）。

---

## 3. 用你这份 Blender 数据怎么对比

1. **取同一 FBX、同一段动画**在项目里播一次，用自动下载的诊断 JSON（含 `restLocal`、`firstFrame`、`firstFrameOut`）。
2. 按上表把 Blender 的 `boneName` 换成 VRM 名，和诊断里的 `vrmBoneName` 对齐。
3. **先比 restLocal**  
   - 对同一根骨，比较 Blender 的 restLocal 与项目诊断的 restLocal。  
   - 若数值接近（或仅 x,y,z 整体反号、w 同号），说明 rest 一致或只差一个四元数约定；若整根骨差很多，可能是不同 rig 或不同 FBX。
4. **再比 firstFrame 的含义**  
   - Blender firstFrame：T-pose 时应接近 `[0,0,0,1]`（你导出的 Hips、Shoulder_L/R 等确实是接近 identity）。  
   - 项目 firstFrame：若和项目 restLocal 成「共轭」或明显反号（例如 rest 的 y 为正、firstFrame 的 y 为负），说明 **track 与 rest 不在同一坐标系**，需要走 Z-up 管线或对 track/rest 做轴转换。
5. **firstFrameOut**  
   - 项目里是「rest 补偿 + 可选 Z-up→Y-up + 可选 sign flip」之后的输出；和 Blender 的 firstFrame（期望的 T-pose）对比，可看出当前管线是否把第一帧正确变成 identity 或接近 identity。

---

## 4. 你当前 Blender 导出里的要点

- **meta.upAxis**: `"Z_UP"` → Blender 里该场景是 Z-up，和项目里 `meta.isZUp` 一致时，两边应在同一「up」约定下对比。
- **meta.actionName**: `"Unreal Take.001"` → 确认项目里播的也是同一段动画（同一 clip），再拿那次下载的诊断 JSON 做逐骨对比。
- **Hips**：Blender restLocal ≈ `[0.707, 0.022, 0.707, 0.022]`，firstFrame ≈ `[0, 0, 0.031, 0.999]`（接近 identity）。  
  若项目里同一骨的 firstFrame 是 `[-0.707, 0, -0.707, 0]` 这类，说明 FBX track 存的是「另一套约定」下的值，需要在项目里用 Z-up 管线或对 track 做转换后再和 Blender 的 firstFrame 对比。

把 Blender 的 `retarget_diagnostic.json` 和「播同一 FBX、同一动画」时项目导出的诊断 JSON 放在一起，按上面步骤和表格逐骨对比，即可判断是坐标系问题还是 per-bone 符号问题，并据此改管线或 `KAWAII_QUAT_SIGN_FLIPS`。
