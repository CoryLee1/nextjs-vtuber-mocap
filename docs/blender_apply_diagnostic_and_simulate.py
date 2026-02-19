# Blender 脚本：加载场景诊断 JSON，在 Blender 里复现「我们发给 VRM 的姿态」并可选模拟管线公式
#
# 用途：
# 1. 把 kawaii-retarget-diagnostic-*.json 里的 firstFrameOut 应用到当前 Armature，在视口里看到和 R3F 里一样的姿态（若仍扭曲则可确认是公式/符号问题）。
# 2. 在控制台打印「用 restLocal、firstFrame 算 track*restInv」与 firstFrameOut 的差异，便于核对公式和四元数顺序。
#
# 用法：
# - 打开同一 FBX 的 Blender 场景，选中 Armature。
# - 修改下面 JSON_PATH 为你的诊断 JSON 完整路径（例如 C:\\Users\\...\\kawaii-retarget-diagnostic-Unreal_Take-xxx.json）。
# - Blender 菜单：Scripting 工作区 → 打开此脚本 → Run Script。
#
# 骨骼名：脚本用 VRM 名（诊断里的 vrmBoneName）映射到 Blender 名（如 Hips、Upper Arm_L）；若你导出的骨骼名带空格或不同，请改 VRM_TO_BLENDER_BONE。

import bpy
import json
import mathutils

# ---------- 配置：诊断 JSON 路径 ----------
JSON_PATH = r"C:\Users\95801\Downloads\kawaii-retarget-diagnostic-Unreal_Take-1771478195167.json"
# 或用弹窗选文件（取消下面两行注释并注释掉上面一行）：
# import os
# JSON_PATH = os.path.join(os.path.expanduser("~"), "Downloads", "kawaii-retarget-diagnostic-Unreal_Take-1771478195167.json")

# VRM 骨骼名 → Blender 骨骼名（与 KAWAII_VRM_RIG_MAP 对应；Blender 导出里是 "Upper Arm_L" 等）
VRM_TO_BLENDER_BONE = {
    "hips": "Hips",
    "spine": "Spine",
    "chest": "Chest",
    "upperChest": "Upper Chest",
    "neck": "Neck",
    "head": "Head",
    "leftShoulder": "Shoulder_L",
    "leftUpperArm": "Upper Arm_L",
    "leftLowerArm": "Lower Arm_L",
    "leftHand": "Hand_L",
    "rightShoulder": "Shoulder_R",
    "rightUpperArm": "Upper Arm_R",
    "rightLowerArm": "Lower Arm_R",
    "rightHand": "Hand_R",
    "leftUpperLeg": "Upper Leg_L",
    "leftLowerLeg": "Lower Leg_L",
    "leftFoot": "Foot_L",
    "leftToes": "Toes_L",
    "rightUpperLeg": "Upper Leg_R",
    "rightLowerLeg": "Lower Leg_R",
    "rightFoot": "Foot_R",
    "rightToes": "Toes_R",
    "leftThumbMetacarpal": "Thumb Proximal_L",
    "leftThumbProximal": "Thumb Intermediate_L",
    "leftThumbDistal": "Thumb Distal_L",
    "leftIndexProximal": "Index Proximal_L",
    "leftIndexIntermediate": "Index Intermediate_L",
    "leftIndexDistal": "Index Distal_L",
    "leftMiddleProximal": "Middle Proximal_L",
    "leftMiddleIntermediate": "Middle Intermediate_L",
    "leftMiddleDistal": "Middle Distal_L",
    "leftRingProximal": "Ring Proximal_L",
    "leftRingIntermediate": "Ring Intermediate_L",
    "leftRingDistal": "Ring Distal_L",
    "leftLittleProximal": "Little Proximal_L",
    "leftLittleIntermediate": "Little Intermediate_L",
    "leftLittleDistal": "Little Distal_L",
    "rightThumbMetacarpal": "Thumb Proximal_R",
    "rightThumbProximal": "Thumb Intermediate_R",
    "rightThumbDistal": "Thumb Distal_R",
    "rightIndexProximal": "Index Proximal_R",
    "rightIndexIntermediate": "Index Intermediate_R",
    "rightIndexDistal": "Index Distal_R",
    "rightMiddleProximal": "Middle Proximal_R",
    "rightMiddleIntermediate": "Middle Intermediate_R",
    "rightMiddleDistal": "Middle Distal_R",
    "rightRingProximal": "Ring Proximal_R",
    "rightRingIntermediate": "Ring Intermediate_R",
    "rightRingDistal": "Ring Distal_R",
    "rightLittleProximal": "Little Proximal_R",
    "rightLittleIntermediate": "Little Intermediate_R",
    "rightLittleDistal": "Little Distal_R",
}


def xyzw_to_blender_quat(xyzw):
    """四元数 [x,y,z,w] → Blender Quaternion(w,x,y,z)"""
    return mathutils.Quaternion((xyzw[3], xyzw[0], xyzw[1], xyzw[2]))


def apply_first_frame_out(armature_obj, diagnostic):
    """把诊断里每根骨的 firstFrameOut 设到 Armature 的 pose，复现 R3F 里看到的姿态"""
    pose = armature_obj.pose
    applied = 0
    for entry in diagnostic:
        vrm_name = entry.get("vrmBoneName")
        out = entry.get("firstFrameOut")
        if not out or len(out) != 4:
            continue
        bl_name = VRM_TO_BLENDER_BONE.get(vrm_name)
        if not bl_name or bl_name not in pose.bones:
            continue
        q = xyzw_to_blender_quat(out)
        pose.bones[bl_name].rotation_quaternion = q
        applied += 1
    return applied


def simulate_pipeline_in_blender(diagnostic, mode="track_times_rest_inv"):
    """
    在 Blender 里用 restLocal 和 firstFrame 模拟管线公式，返回每根骨的「计算出的第一帧」。
    mode:
      - "track_times_rest_inv": 我们的公式 track * restInv (parent=identity)
      - "rest_inv_times_track": 另一种顺序 restInv * track
    """
    results = []
    for entry in diagnostic:
        rest = entry.get("restLocal")
        first = entry.get("firstFrame")
        if not rest or not first or len(rest) != 4 or len(first) != 4:
            results.append((entry.get("vrmBoneName"), None))
            continue
        q_rest = xyzw_to_blender_quat(rest)
        q_first = xyzw_to_blender_quat(first)
        q_rest_inv = q_rest.inverted()
        if mode == "track_times_rest_inv":
            q_out = q_first @ q_rest_inv
        else:
            q_out = q_rest_inv @ q_first
        # 转回 xyzw
        xyzw = [q_out.x, q_out.y, q_out.z, q_out.w]
        results.append((entry.get("vrmBoneName"), xyzw))
    return results


def main():
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print("无法加载 JSON:", JSON_PATH, e)
        return
    diagnostic = data.get("diagnostic") or data.get("bones")
    if not diagnostic:
        print("JSON 中无 diagnostic 或 bones 数组")
        return
    # 若是 Blender 导出的格式，每项是 boneName/restLocal/firstFrame，没有 firstFrameOut
    has_first_frame_out = diagnostic and "firstFrameOut" in (diagnostic[0] or {})

    obj = bpy.context.active_object
    if not obj or obj.type != "ARMATURE":
        print("请先选中 Armature 对象")
        return

    if has_first_frame_out:
        n = apply_first_frame_out(obj, diagnostic)
        print("已把 firstFrameOut 应用到 %d 根骨骼 → 视口中应看到与 R3F 相同的姿态" % n)
    else:
        print("该 JSON 无 firstFrameOut，仅可做公式模拟，不写入 pose")

    # 可选：在控制台打印「用 restLocal 和 firstFrame 算出的结果」与 firstFrameOut 的差异（若有 firstFrameOut）
    if has_first_frame_out and diagnostic:
        print("\n--- 公式模拟：track * restInv (第一帧) vs 场景 firstFrameOut ---")
        for entry in diagnostic:
            vrm = entry.get("vrmBoneName")
            out = entry.get("firstFrameOut")
            if not out:
                continue
            sim = simulate_pipeline_in_blender([entry], "track_times_rest_inv")
            if sim and sim[0][1]:
                _, xyzw = sim[0]
                diff = [abs(xyzw[i] - out[i]) for i in range(4)]
                if max(diff) > 1e-4:
                    print(vrm, " 模拟", xyzw, " 场景Out", out, " 差", diff)


if __name__ == "__main__":
    main()
