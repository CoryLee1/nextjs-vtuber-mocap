import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Text } from '@react-three/drei';

// 坐标轴显示组件
export const CoordinateAxes = ({ position = [0, 0, 0], size = 1 }) => {
  return (
    <group position={position}>
      {/* X轴 - 红色（左右） */}
      <group>
        <mesh position={[size/2, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
          <cylinderGeometry args={[0.02, 0.02, size]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <mesh position={[size, 0, 0]}>
          <coneGeometry args={[0.05, 0.1]} />
          <meshBasicMaterial color="red" />
        </mesh>
        <Text
          position={[size + 0.2, 0, 0]}
          fontSize={0.15}
          color="red"
          anchorX="left"
          anchorY="middle"
        >
          X (左右)
        </Text>
      </group>

      {/* Y轴 - 绿色（上下） */}
      <group>
        <mesh position={[0, size/2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, size]} />
          <meshBasicMaterial color="green" />
        </mesh>
        <mesh position={[0, size, 0]}>
          <coneGeometry args={[0.05, 0.1]} />
          <meshBasicMaterial color="green" />
        </mesh>
        <Text
          position={[0, size + 0.2, 0]}
          fontSize={0.15}
          color="green"
          anchorX="center"
          anchorY="bottom"
        >
          Y (上下)
        </Text>
      </group>

      {/* Z轴 - 蓝色（前后） */}
      <group>
        <mesh position={[0, 0, size/2]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, size]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        <mesh position={[0, 0, size]} rotation={[Math.PI/2, 0, 0]}>
          <coneGeometry args={[0.05, 0.1]} />
          <meshBasicMaterial color="blue" />
        </mesh>
        <Text
          position={[0, 0, size + 0.2]}
          fontSize={0.15}
          color="blue"
          anchorX="center"
          anchorY="middle"
        >
          Z (前后)
        </Text>
      </group>
    </group>
  );
};

// 手臂方向调试组件
export const ArmDirectionDebugger = ({ vrm, riggedPose, showDebug = true }) => {
  const leftArrowRef = useRef();
  const rightArrowRef = useRef();
  const leftTextRef = useRef();
  const rightTextRef = useRef();

  useFrame(() => {
    if (!vrm?.humanoid || !riggedPose?.current || !showDebug) return;

    // 获取手臂骨骼位置
    const leftUpperArm = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArm = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');

    if (leftUpperArm && leftArrowRef.current && riggedPose.current.LeftUpperArm) {
      const worldPos = leftUpperArm.getWorldPosition(new Vector3());
      leftArrowRef.current.position.copy(worldPos);
      
      // 原始方向
      const rawDirection = new Vector3(
        riggedPose.current.LeftUpperArm.x,
        riggedPose.current.LeftUpperArm.y,
        riggedPose.current.LeftUpperArm.z
      );
      
      if (rawDirection.length() > 0.1) {
        const endPos = worldPos.clone().add(rawDirection.normalize().multiplyScalar(0.5));
        leftArrowRef.current.lookAt(endPos);
      }
    }

    if (rightUpperArm && rightArrowRef.current && riggedPose.current.RightUpperArm) {
      const worldPos = rightUpperArm.getWorldPosition(new Vector3());
      rightArrowRef.current.position.copy(worldPos);
      
      // 原始方向
      const rawDirection = new Vector3(
        riggedPose.current.RightUpperArm.x,
        riggedPose.current.RightUpperArm.y,
        riggedPose.current.RightUpperArm.z
      );
      
      if (rawDirection.length() > 0.1) {
        const endPos = worldPos.clone().add(rawDirection.normalize().multiplyScalar(0.5));
        rightArrowRef.current.lookAt(endPos);
      }
    }
  });

  if (!showDebug) return null;

  return (
    <group>
      {/* 左手臂方向指示器 */}
      <group ref={leftArrowRef}>
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5]} />
          <meshBasicMaterial color="magenta" />
        </mesh>
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
          <coneGeometry args={[0.06, 0.1]} />
          <meshBasicMaterial color="magenta" />
        </mesh>
        <Text
          ref={leftTextRef}
          position={[0, 0.3, 0]}
          fontSize={0.1}
          color="magenta"
          anchorX="center"
        >
          Left Raw
        </Text>
      </group>

      {/* 右手臂方向指示器 */}
      <group ref={rightArrowRef}>
        <mesh position={[0.25, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.5]} />
          <meshBasicMaterial color="cyan" />
        </mesh>
        <mesh position={[0.5, 0, 0]} rotation={[0, 0, -Math.PI/2]}>
          <coneGeometry args={[0.06, 0.1]} />
          <meshBasicMaterial color="cyan" />
        </mesh>
        <Text
          ref={rightTextRef}
          position={[0, 0.3, 0]}
          fontSize={0.1}
          color="cyan"
          anchorX="center"
        >
          Right Raw
        </Text>
      </group>
    </group>
  );
};

// 数据显示面板
export const DataDisplayPanel = ({ riggedPose, position = [-2, 2, 0] }) => {
  if (!riggedPose?.current) return null;

  const leftArm = riggedPose.current.LeftUpperArm;
  const rightArm = riggedPose.current.RightUpperArm;

  return (
    <group position={position}>
      {/* 背景面板 */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[3, 2]} />
        <meshBasicMaterial color="black" opacity={0.7} transparent />
      </mesh>
      
      {/* 文字显示 */}
      <Text
        fontSize={0.12}
        color="white"
        anchorX="left"
        anchorY="top"
        maxWidth={2.8}
        position={[-1.4, 0.9, 0]}
      >
        {`MediaPipe 原始数据:

左手臂:
X: ${leftArm?.x?.toFixed(3) || 'N/A'} (左右)
Y: ${leftArm?.y?.toFixed(3) || 'N/A'} (上下)
Z: ${leftArm?.z?.toFixed(3) || 'N/A'} (前后)

右手臂:
X: ${rightArm?.x?.toFixed(3) || 'N/A'} (左右)
Y: ${rightArm?.y?.toFixed(3) || 'N/A'} (上下)
Z: ${rightArm?.z?.toFixed(3) || 'N/A'} (前后)

说明:
- 手往前伸：Z应该为正
- 手往上举：Y应该为正
- 左手往右：X应该为正`}
      </Text>
    </group>
  );
};