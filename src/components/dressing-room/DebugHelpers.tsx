import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Object3D, ArrowHelper, Color, CanvasTexture, SpriteMaterial, Sprite, Group } from 'three';
import { Text } from '@react-three/drei';

// 坐标轴显示组件
export const CoordinateAxes = ({
  position = [0, 0, 0] as [number, number, number],
  size = 1
}: {
  position?: [number, number, number];
  size?: number;
}) => {
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

interface ArmDirectionDebuggerProps {
  vrm: any;
  riggedPose?: any;
  showDebug?: boolean;
}
export const ArmDirectionDebugger: React.FC<ArmDirectionDebuggerProps> = ({ vrm, riggedPose, showDebug = true }) => {
  const leftArrowRef = useRef<Group>(null);
  const rightArrowRef = useRef<Group>(null);
  const leftTextRef = useRef<Group>(null);
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
interface DataDisplayPanelProps {
  riggedPose?: any;
  position?: [number, number, number];
}
export const DataDisplayPanel: React.FC<DataDisplayPanelProps> = ({ riggedPose, position = [-2, 2, 0] }) => {
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

interface SimpleArmAxesProps {
  vrm: any;
  showDebug?: boolean;
}
export const SimpleArmAxes: React.FC<SimpleArmAxesProps> = ({ vrm, showDebug }) => {
    const armBones = [
        'leftShoulder',    // 左肩
        'leftUpperArm',    // 左上臂
        'leftLowerArm',    // 左前臂
        'rightShoulder',   // 右肩
        'rightUpperArm',   // 右上臂
        'rightLowerArm',   // 右前臂
    ];

    if (!vrm || !showDebug) return null;

    return (
        <group>
            {armBones.map((boneName) => {
                const bone = vrm.humanoid.getNormalizedBoneNode(boneName);
                if (!bone) return null;

                const worldPosition = bone.getWorldPosition(new Vector3());

                return (
                    <group key={boneName} position={worldPosition}>
                        {/* X轴 - 红色 - 左右方向 */}
                        <mesh position={[0.06, 0, 0]}>
                            <boxGeometry args={[0.12, 0.01, 0.01]} />
                            <meshBasicMaterial color="red" />
                        </mesh>
                        <Text
                            position={[0.08, 0, 0]}
                            fontSize={0.02}
                            color="red"
                            anchorX="left"
                            anchorY="middle"
                        >
                            {boneName} X+
                        </Text>

                        {/* Y轴 - 绿色 - 上下方向 */}
                        <mesh position={[0, 0.06, 0]}>
                            <boxGeometry args={[0.01, 0.12, 0.01]} />
                            <meshBasicMaterial color="green" />
                        </mesh>
                        <Text
                            position={[0, 0.08, 0]}
                            fontSize={0.02}
                            color="green"
                            anchorX="center"
                            anchorY="bottom"
                        >
                            {boneName} Y+
                        </Text>

                        {/* Z轴 - 蓝色 - 前后方向 */}
                        <mesh position={[0, 0, 0.06]}>
                            <boxGeometry args={[0.01, 0.01, 0.12]} />
                            <meshBasicMaterial color="blue" />
                        </mesh>
                        <Text
                            position={[0, 0, 0.08]}
                            fontSize={0.02}
                            color="blue"
                            anchorX="center"
                            anchorY="middle"
                        >
                            {boneName} Z+
                        </Text>

                        {/* 中心点 */}
                        <mesh position={[0, 0, 0]}>
                            <sphereGeometry args={[0.005, 8, 8]} />
                            <meshBasicMaterial color="white" />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

// 创建文本标签的辅助函数
const createTextLabel = (text: string, position: [number, number, number], color: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    if (!context) return null;
    context.fillStyle = color;
    context.font = '24px Arial';
    context.fillText(text, 10, 40);

    const texture = new CanvasTexture(canvas);
    const material = new SpriteMaterial({ map: texture });
    const sprite = new Sprite(material);
    
    sprite.position.copy(new Vector3(...position));
    sprite.scale.set(0.1, 0.025, 1);
    
    return sprite;
};