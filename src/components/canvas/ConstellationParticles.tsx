'use client';

import React, { useMemo, useRef, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/** 可定义的一种粒子“元素”：颜色、大小、数量 */
export interface ParticleElement {
  /** 颜色（hex 或 css） */
  color: string;
  /** 粒子大小（世界单位） */
  size: number;
  /** 该元素粒子数量 */
  count: number;
}

export interface ConstellationParticlesProps {
  /** 粒子元素列表，可定义多种（如亮星、暗星、彩色） */
  elements?: ParticleElement[];
  /** 若未传 elements，则用单一颜色与总数 */
  count?: number;
  color?: string;
  size?: number;
  /** 连线：距离小于此值的粒子对会画线（星座效果） */
  lineMaxDistance?: number;
  /** 每个粒子最多连几条线（避免过密） */
  lineMaxNeighbors?: number;
  /** 连线不透明度（发光感） */
  lineOpacity?: number;
  /** 连线颜色，默认与主色一致 */
  lineColor?: string;
  /** 粒子分布范围 [x,y,z] 半径 */
  scale?: number | [number, number, number];
  position?: [number, number, number];
  /** 是否启用缓慢漂移动画 */
  drift?: boolean;
}

const DEFAULT_ELEMENTS: ParticleElement[] = [
  { color: '#ffffff', size: 0.08, count: 30 },
  { color: '#9dfeed', size: 0.05, count: 40 },
  { color: '#cfff21', size: 0.04, count: 50 },
];

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  const n = parseInt(c, 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

/** 星座粒子：可定义多种元素 + 近距离粒子间拖尾连线发光 */
export const ConstellationParticles = memo(function ConstellationParticles({
  elements = DEFAULT_ELEMENTS,
  count: singleCount,
  color: singleColor = '#ffffff',
  size: singleSize = 0.06,
  lineMaxDistance = 1.8,
  lineMaxNeighbors = 4,
  lineOpacity = 0.35,
  lineColor,
  scale = 2,
  position = [0, 1.2, 0],
  drift = true,
}: ConstellationParticlesProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const scaleVec = Array.isArray(scale)
    ? (scale as [number, number, number])
    : [scale, scale, scale];

  const { positions, colors, lineSegments } = useMemo(() => {
    const posList: number[] = [];
    const colorList: number[] = [];

    const elList =
      elements?.length > 0
        ? elements
        : [{ color: singleColor, size: singleSize, count: singleCount ?? 50 }];

    elList.forEach((el) => {
      for (let i = 0; i < el.count; i++) {
        const x = (Math.random() - 0.5) * 2 * scaleVec[0];
        const y = (Math.random() - 0.5) * 2 * scaleVec[1];
        const z = (Math.random() - 0.5) * 2 * scaleVec[2];
        posList.push(x, y, z);
        const [r, g, b] = hexToRgb(el.color);
        colorList.push(r, g, b);
      }
    });

    const N = posList.length / 3;
    const positions = new Float32Array(posList);
    const colors = new Float32Array(colorList);

    const points: THREE.Vector3[] = [];
    for (let i = 0; i < N; i++) {
      points.push(
        new THREE.Vector3(posList[i * 3], posList[i * 3 + 1], posList[i * 3 + 2])
      );
    }

    const lineVertices: number[] = [];
    const maxDistSq = lineMaxDistance * lineMaxDistance;

    for (let i = 0; i < N; i++) {
      const pi = points[i];
      const distances: { j: number; dSq: number }[] = [];
      for (let j = i + 1; j < N; j++) {
        const dSq = pi.distanceToSquared(points[j]);
        if (dSq < maxDistSq) distances.push({ j, dSq });
      }
      distances.sort((a, b) => a.dSq - b.dSq);
      const toConnect = distances.slice(0, lineMaxNeighbors);
      toConnect.forEach(({ j }) => {
        const pj = points[j];
        lineVertices.push(pi.x, pi.y, pi.z, pj.x, pj.y, pj.z);
      });
    }

    const lineSegments = new Float32Array(lineVertices);

    return { positions, colors, lineSegments };
  }, [
    elements,
    singleCount,
    singleColor,
    singleSize,
    scaleVec.join(','),
    lineMaxDistance,
    lineMaxNeighbors,
  ]);

  const pointsGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const lineGeoRef = useRef<THREE.BufferGeometry | null>(null);

  if (typeof window === 'undefined') return null;

  const pointsGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pointsGeoRef.current = g;
    return g;
  }, [positions, colors]);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(lineSegments, 3));
    g.attributes.position.needsUpdate = true;
    lineGeoRef.current = g;
    return g;
  }, [lineSegments]);

  const lineColorRgb = lineColor ? hexToRgb(lineColor) : [0.6, 0.9, 1];

  useFrame((_, delta) => {
    if (!drift || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.08;
  });

  return (
    <group ref={groupRef} position={position}>
      <points ref={pointsRef} geometry={pointsGeo}>
        <pointsMaterial
          size={0.85}
          vertexColors
          sizeAttenuation
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <lineSegments ref={linesRef} geometry={lineGeo}>
        <lineBasicMaterial
          color={new THREE.Color(lineColorRgb[0], lineColorRgb[1], lineColorRgb[2])}
          transparent
          opacity={lineOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
});
