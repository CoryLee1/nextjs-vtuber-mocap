# Prompt：让 Claude 生成 Blender 导出重定向数据的 Python 脚本

把下面整段复制给 Claude（claude.ai 或 Cursor），即可生成在 Blender 里可运行的脚本。

---

## 复制内容开始

请写一个在 **Blender 4.x / 3.x** 里可运行的 **Python 脚本**，用于导出「动画重定向对比」所需数据，以便和另一个应用（Web 端 Three.js 加载同一 FBX 后的诊断 JSON）做对比。

### 功能要求

1. **输入**  
   - 当前打开并选中的 **Armature** 对象（或场景中唯一的 Armature）。  
   - 当前 **Action** 或 NLA 中正在使用的动画（即当前播放的动画）。

2. **导出数据（每根有动画的骨骼一条）**  
   - **boneName**：骨骼在 Blender 里的名字（字符串）。  
   - **restLocal**：该骨骼在 **rest pose（T-pose）** 下的**局部旋转四元数**，格式为 **`[x, y, z, w]`**（注意：Blender 内部常用 WXYZ，导出时必须转为 **xyzw**）。  
   - **firstFrame**：在当前动画的**第 0 帧**（或该骨骼有 key 的第一帧），该骨骼的**局部旋转四元数**，格式同样为 **`[x, y, z, w]`**。

3. **Rest 与 First 帧的取数方式**  
   - **restLocal**：在**没有应用当前 Action 的状态**下读取该骨的 rest 局部旋转（即 Edit/Pose 的 rest pose），转为四元数 xyzw。  
   - **firstFrame**：在**当前 Action 生效、时间在第 0 帧**时，对该骨做 **pose 局部旋转** 的采样，转为四元数 xyzw。  
   - 若某骨没有动画通道，可跳过或 restLocal 仍导出，firstFrame 填 null 或同 restLocal。

4. **输出**  
   - 一个 **JSON 文件**，结构示例：  
     ```json  
     {  
       "meta": {  
         "source": "Blender",  
         "armatureName": "Armature",  
         "actionName": "Idle",  
         "exportedAt": "2026-02-19T12:00:00.000Z"  
       },  
       "bones": [  
         {  
           "boneName": "Hips",  
           "restLocal": [0.0, 0.0, 0.0, 1.0],  
           "firstFrame": [0.0, 0.0, 0.0, 1.0]  
         }  
       ]  
     }  
     ```  
   - 脚本应**弹窗让用户选择保存路径**，或保存到桌面/固定路径（在脚本里注明）。

5. **技术要求**  
   - 使用 `bpy`，可在 Blender 的 **Scripting** 工作区 **Run Script** 运行。  
   - 四元数从 Blender 的 WXYZ 转为 xyzw：若 `q = bone.rotation_quaternion`，则 `[q.x, q.y, q.z, q.w]` 即为 xyzw（Blender 4.x 的 Quaternion 是 (w,x,y,z) 还是 (x,y,z,w) 请按当前版本确认并注释说明）。  
   - 若需在「第 0 帧」采样动画，先 `bpy.context.scene.frame_set(0)` 再读取 pose。

6. **可选**  
   - 在 JSON 的 `meta` 里增加当前 Blender 的 **up_axis**（如 "Z_UP" / "Y_UP"），便于和 Web 端 isZUp 对比。  
   - 脚本开头用注释写明：用途、如何选择 Armature、如何确保正确 Action 已启用。

请直接输出完整可运行的脚本，并简要说明在 Blender 中的使用步骤（例如：打开 FBX → 选 Armature → 切到 Scripting → 粘贴运行）。

---

## 复制内容结束

上面这段可以直接整段复制给 Claude，生成脚本后：  
1. 在 Blender 打开**同一 FBX**；  
2. 确保要对比的 **Action** 已启用并停在**第 0 帧**；  
3. 选中 Armature，在 Scripting 里运行生成的脚本；  
4. 把导出的 JSON 与项目里下载的 **kawaii-retarget-diagnostic-*.json** 对比（boneName 需对应到诊断里的 vrmBoneName，若命名不同需先做一次名称映射）。
