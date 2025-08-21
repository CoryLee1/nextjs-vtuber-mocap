'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';

export default function SceneTestPage() {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        style={{ background: '#0036FF' }}
      >
        {/* 网格地板 */}
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#ffffff"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#ffffff"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={true}
          transparent={true}
        />
        
        {/* 光源 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* 控制器 */}
        <OrbitControls />
        
        {/* 测试立方体 */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </Canvas>
    </div>
  );
} 