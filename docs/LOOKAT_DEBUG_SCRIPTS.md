# LookAt 跟随问题调试 - 相关脚本

## 问题描述
头部朝向跟随相机功能没有工作，怀疑被 idle 动画覆盖。已尝试在动画更新之后调用 LookAt，但仍不工作。

## 相关脚本文件位置

### 1. LookAt Hook (`src/hooks/use-vrm-lookat.ts`)
包含 `createVRMLookAtUpdater` 函数和 `useVRMLookAt` hook。

### 2. VRM Avatar 组件 (`src/components/dressing-room/VRMAvatar.tsx`)
主组件，包含动画更新和 LookAt 调用逻辑。

### 3. 动画管理器 (`src/lib/animation-manager.ts`)
处理 idle 动画的播放和更新。

---

## 完整代码文件

### 1. LookAt Hook (`src/hooks/use-vrm-lookat.ts`)

**关键函数：`createVRMLookAtUpdater`**

```typescript
export function createVRMLookAtUpdater(
  vrm: VRM | null,
  target: Vector3 | Object3D | null,
  camera: Object3D,
  options: UseVRMLookAtOptions = {}
): VRMLookAtUpdater {
  const {
    enabled = true,
    smoothness = 0.1,
    maxYaw = Math.PI / 2,
    maxPitch = Math.PI / 6,
    maxRoll = 0,
    additive = false,
  } = options;

  // PERF: 对象池，避免每帧创建新对象（使用闭包变量）
  const targetPosition = new Vector3();
  const headWorldPos = new Vector3();
  const direction = new Vector3();
  const currentQuaternion = new Quaternion();
  const targetQuaternion = new Quaternion();
  const euler = new Euler();
  const parentQuaternion = new Quaternion();
  const worldTargetQuaternion = new Quaternion();
  const defaultForward = new Vector3(0, 0, 1);

  return {
    update: () => {
      if (!enabled || !vrm) return;

      try {
        // 获取头部骨骼
        let headBone: Object3D | null = null;
        if (vrm.humanoid?.humanBones?.['head']?.node) {
          headBone = vrm.humanoid.humanBones['head'].node;
        } else if (vrm.humanoid && typeof vrm.humanoid.getNormalizedBoneNode === 'function') {
          headBone = vrm.humanoid.getNormalizedBoneNode('head');
        }

        if (!headBone) return;

        // 获取目标位置（相机位置）
        if (target instanceof Vector3) {
          targetPosition.copy(target);
        } else if (target instanceof Object3D) {
          target.getWorldPosition(targetPosition);
        } else {
          camera.getWorldPosition(targetPosition);
        }

        // 获取头部骨骼的世界位置
        headBone.getWorldPosition(headWorldPos);

        // 计算方向向量（从头部指向目标）
        direction
          .subVectors(targetPosition, headWorldPos)
          .normalize();

        if (direction.lengthSq() < 0.001) return;

        // 计算目标四元数（让头部朝向目标方向）
        const parentBone = headBone.parent;
        
        if (parentBone) {
          // 获取父节点的世界旋转
          parentBone.getWorldQuaternion(parentQuaternion);
          
          // 计算目标四元数（世界空间）
          worldTargetQuaternion.setFromUnitVectors(
            defaultForward, 
            direction
          );
          
          // 转换为局部空间：localQuaternion = parentQuaternion^-1 * worldQuaternion
          parentQuaternion.invert();
          targetQuaternion.multiplyQuaternions(
            parentQuaternion, 
            worldTargetQuaternion
          );
        } else {
          targetQuaternion.setFromUnitVectors(
            defaultForward, 
            direction
          );
        }

        // 转换为欧拉角以便应用限制
        euler.setFromQuaternion(targetQuaternion, 'YXZ');

        // 应用旋转限制
        euler.y = Math.max(-maxYaw, Math.min(maxYaw, euler.y));
        euler.x = Math.max(-maxPitch, Math.min(maxPitch, euler.x));
        euler.z = maxRoll;

        // 将限制后的欧拉角转换回四元数
        targetQuaternion.setFromEuler(euler);

        // 获取当前头部骨骼的局部旋转（动画更新后的旋转）
        const currentRotation = headBone.quaternion.clone();

        if (additive) {
          // 叠加模式
          const additiveRotation = currentRotation.clone().multiply(targetQuaternion);
          currentRotation.slerp(additiveRotation, smoothness * 0.5);
          headBone.quaternion.copy(currentRotation);
        } else {
          // 非叠加模式：直接替换旋转（覆盖动画）
          currentQuaternion.copy(currentRotation);
          currentQuaternion.slerp(targetQuaternion, smoothness);
          headBone.quaternion.copy(currentQuaternion);
        }

      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('VRMLookAtUpdater: Failed to update head rotation', error);
        }
      }
    },
  };
}
```

---

### 2. VRM Avatar 组件 (`src/components/dressing-room/VRMAvatar.tsx`)

**关键部分：LookAt 初始化和调用**

```typescript
// 创建 LookAt 更新器
const lookAtUpdaterRef = useRef<ReturnType<typeof createVRMLookAtUpdater> | null>(null);

useEffect(() => {
    if (vrm && camera) {
        // 创建 LookAt 更新器
        lookAtUpdaterRef.current = createVRMLookAtUpdater(vrm, camera, camera, {
            enabled: true,
            smoothness: 0.15,
            maxYaw: Math.PI / 2, // ±90度
            maxPitch: Math.PI / 6, // ±30度
            maxRoll: 0,
            additive: false, // 不使用叠加模式，直接覆盖
        });
    } else {
        lookAtUpdaterRef.current = null;
    }
}, [vrm, camera]);

// useFrame 循环
useFrame((_, delta) => {
    if (!vrm) return;

    // 模式切换
    handleModeSwitch(shouldUseMocap);
    
    const animationState = getAnimationState();
    const currentMode = animationState.currentMode;

    // 模式1：预制动画模式（摄像头关闭）
    if (currentMode === 'idle') {
        try {
            // 1. 更新动画（会覆盖头部旋转）
            updateAnimation(delta);
            
            // 2. ✅ 在动画更新之后立即应用 LookAt
            // 这样可以确保 LookAt 的头部旋转覆盖动画的头部旋转
            if (lookAtUpdaterRef.current) {
                lookAtUpdaterRef.current.update();
            }
        } catch (error) {
            // ...
        }
    }
    
    // 模式2：动捕模式
    else if (currentMode === 'mocap') {
        // ... 动捕数据处理
    }

    // 最后统一更新VRM
    vrm.update(delta);
});
```

---

### 3. 动画管理器 (`src/lib/animation-manager.ts`)

**关键函数：`updateAnimation`**

```typescript
const updateAnimation = (delta) => {
    // 只在idle模式下更新动画
    if (animationModeRef.current !== 'idle') {
        return;
    }
    
    if (!mixerRef.current) return;
    
    try {
        // 更新动画混合器（这里会覆盖所有骨骼旋转，包括头部）
        mixerRef.current.update(delta);
        
        // 更新状态
        setAnimationState(prev => ({
            ...prev,
            currentTime: mixerRef.current.time,
            isPlayingIdle: idleActionRef.current?.isRunning() || false
        }));
        
    } catch (error) {
        console.warn('AnimationManager: 动画更新错误', error);
    }
};
```

---

## 问题分析

### 当前实现逻辑

1. **动画更新**：`mixerRef.current.update(delta)` 会覆盖所有骨骼的旋转，包括头部
2. **LookAt 应用**：在动画更新之后立即调用 `lookAtUpdaterRef.current.update()`
3. **VRM 更新**：最后调用 `vrm.update(delta)`

### 可能的问题

1. **`vrm.update(delta)` 是否重新应用了动画？**
   - 需要确认 `vrm.update()` 是否会重新应用动画的旋转

2. **头部骨骼获取是否正确？**
   - 使用了 `vrm.humanoid.getNormalizedBoneNode('head')`
   - 可能应该使用 `vrm.humanoid.getBoneNode('head')`？

3. **局部空间计算是否正确？**
   - LookAt 计算使用的是局部空间旋转
   - 但动画可能使用的是不同的空间

4. **执行时机问题？**
   - 即使 LookAt 在动画之后执行，`vrm.update()` 可能在最后又重置了？

---

## 需要帮助的问题

1. **如何在 Three.js + VRM 中让头部 LookAt 与 AnimationMixer 动画同时工作？**
2. **`vrm.update(delta)` 是否会影响骨骼的旋转？**
3. **应该使用 `getNormalizedBoneNode` 还是 `getBoneNode`？**
4. **是否有其他方法可以排除头部骨骼不受动画影响？**


