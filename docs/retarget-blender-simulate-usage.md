# 在 Blender 里模拟重定向结果

用项目里的诊断 JSON，可以在 Blender 里**直接看到我们发给 VRM 的姿态**，方便核对「扭曲」是否和 R3F 一致，并验证公式。

---

## 1. 脚本位置与用法

- **脚本**：`docs/blender_apply_diagnostic_and_simulate.py`
- **步骤**：
  1. 在 Blender 打开**同一 FBX**（Unreal Take 或 KAWAII 那个）。
  2. 选中 **Armature**。
  3. 用记事本或 Blender 内置编辑器打开 `blender_apply_diagnostic_and_simulate.py`，把 **`JSON_PATH`** 改成你下载的 **场景诊断 JSON** 的完整路径（例如 `C:\Users\...\kawaii-retarget-diagnostic-Unreal_Take-xxx.json`）。
  4. 在 Blender 的 **Scripting** 工作区里运行该脚本（Run Script）。

- **效果**：
  - 脚本会把诊断里每根骨的 **firstFrameOut**（我们管线算出的第一帧四元数）设到当前 Armature 的 **Pose**。
  - 视口里看到的姿态就是 **R3F 里 VRM 收到的第一帧姿态**。若这里已经扭了，说明公式或符号表有问题；若这里正常而 R3F 里扭，则可能是 VRM 绑定或播放端问题。
  - 控制台会打印「用 restLocal、firstFrame 按 track*restInv 算出来的结果」与 **firstFrameOut** 的差异，便于核对公式和四元数顺序（Blender 用 wxyz，我们用 xyzw，脚本里已做转换）。

---

## 2. 若骨骼名对不上

脚本里的 **VRM_TO_BLENDER_BONE** 是按项目里的 KAWAII 映射写的（如 `leftUpperArm` → `Upper Arm_L`）。若你的 Blender 里骨骼名不一样（例如带下划线、或来自别的 rig），改脚本里的 **VRM_TO_BLENDER_BONE** 字典，让 VRM 名对应到你当前 Armature 里的 Pose Bone 名即可。

---

## 3. 为何之前还是错：hips 的 track 约定

诊断里 **hips** 的 **firstFrame** 和 **restLocal** 呈共轭关系（firstFrame ≈ 把 rest 的 x,y,z 取反）：FBX 里存的是「rest 的共轭」而不是 rest。这时我们的公式 `track * restInv` 会得到 `conjugate(rest)*restInv`，不等于 identity，所以根骨会带一个多余旋转。

**已做修改**：当 **isKawaii && !isZUp**（Y-up 的 Unreal Take）且骨骼为 **hips** 时，对 **track 先取共轭**（xyzw 的 x,y,z 取反），再做 `track * restInv`，这样第一帧会得到 identity，根骨不再错位。若 Blender 模拟里 hips 仍不对，可以再查是否还有其他骨需要共轭或不同公式。
