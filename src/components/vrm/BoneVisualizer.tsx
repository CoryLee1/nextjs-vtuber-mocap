/**
 * VRM 骨骼可视化组件
 *
 * 显示 VRM 模型的骨骼结构，用于调试
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh, CylinderGeometry, MeshBasicMaterial } from 'three';

interface BoneVisualizerProps {
  vrm: any;
}

const BoneVisualizerComponent: React.FC<BoneVisualizerProps> = ({ vrm }) => {
  const [boneMeshes, setBoneMeshes] = useState<Mesh[]>([]);

  // PERF: 使用 ref 复用 Vector3 对象，避免每帧创建新对象
  const tmpVec3_1 = useRef(new Vector3());
  const tmpVec3_2 = useRef(new Vector3());
  const tmpVec3_3 = useRef(new Vector3());
  const tmpVec3_4 = useRef(new Vector3());
  const tmpVec3_5 = useRef(new Vector3());
  const tmpVec3_6 = useRef(new Vector3());

  useEffect(() => {
    if (!vrm?.humanoid) {
      return;
    }

    const humanBones = vrm.humanoid.humanBones;
    const boneNames = Object.keys(humanBones);
    const meshes: Mesh[] = [];

    boneNames.forEach((boneName) => {
      const bone = humanBones[boneName];
      if (bone.node && bone.node.parent) {
        const parent = bone.node.parent;
        const child = bone.node;

        const parentWorldPos = parent.getWorldPosition(new Vector3());
        const childWorldPos = child.getWorldPosition(new Vector3());
        const direction = new Vector3().subVectors(childWorldPos, parentWorldPos);
        const length = direction.length();

        if (length > 0.01) {
          const geometry = new CylinderGeometry(0.02, 0.02, length, 8);
          const material = new MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
          });
          const mesh = new Mesh(geometry, material);

          const center = new Vector3().addVectors(parentWorldPos, childWorldPos).multiplyScalar(0.5);
          mesh.position.copy(center);

          const up = new Vector3(0, 1, 0);
          const axis = new Vector3().crossVectors(up, direction.normalize());
          const angle = Math.acos(up.dot(direction.normalize()));

          if (axis.length() > 0.001) {
            mesh.quaternion.setFromAxisAngle(axis, angle);
          }

          mesh.userData = { boneName };
          meshes.push(mesh);
        }
      }
    });

    setBoneMeshes(meshes);
  }, [vrm]);

  // PERF: 更新骨骼位置
  useFrame(() => {
    if (!vrm?.humanoid) return;

    const humanBones = vrm.humanoid.humanBones;
    const boneNames = Object.keys(humanBones);

    boneMeshes.forEach((mesh, index) => {
      const boneName = boneNames[index];
      if (!boneName) return;

      const bone = humanBones[boneName];
      if (bone?.node?.parent) {
        const parent = bone.node.parent;
        const child = bone.node;

        const parentWorldPos = parent.getWorldPosition(tmpVec3_1.current);
        const childWorldPos = child.getWorldPosition(tmpVec3_2.current);

        tmpVec3_3.current.subVectors(childWorldPos, parentWorldPos);
        const length = tmpVec3_3.current.length();

        if (length > 0.01) {
          tmpVec3_4.current.addVectors(parentWorldPos, childWorldPos).multiplyScalar(0.5);
          mesh.position.copy(tmpVec3_4.current);

          tmpVec3_5.current.set(0, 1, 0);
          tmpVec3_3.current.normalize();
          tmpVec3_6.current.crossVectors(tmpVec3_5.current, tmpVec3_3.current);
          const angle = Math.acos(tmpVec3_5.current.dot(tmpVec3_3.current));
          const axis = tmpVec3_6.current;

          if (axis.length() > 0.001) {
            mesh.quaternion.setFromAxisAngle(axis, angle);
          }
        }
      }
    });
  });

  return (
    <group>
      {boneMeshes.map((mesh, index) => (
        <primitive key={`bone-${index}`} object={mesh} />
      ))}
    </group>
  );
};

// PERF: 使用 memo 优化性能
export const BoneVisualizer = memo(BoneVisualizerComponent, (prevProps, nextProps) => {
  return prevProps.vrm === nextProps.vrm;
});
