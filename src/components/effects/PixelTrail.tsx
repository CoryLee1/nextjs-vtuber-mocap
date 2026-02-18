/* eslint-disable react/no-unknown-property */
"use client";

import React, { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { shaderMaterial, useTrailTexture } from '@react-three/drei';
import * as THREE from 'three';

import cursorStar from '@/app/v1/assets/ECHUU V1 UX_img/db13c5aa82b66b348df53b3b1ab7faa2 1.png';

/**
 * Pixel dot shader — renders a grid of square pixels whose alpha follows a mouse trail texture.
 * Based on ReactBits PixelTrail (https://reactbits.dev/animations/pixel-trail)
 */
const DotMaterial = shaderMaterial(
  {
    resolution: new THREE.Vector2(),
    mouseTrail: null,
    gridSize: 100,
    pixelColor: new THREE.Color('#ffffff'),
  },
  /* vertex */
  `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  /* fragment */
  `
    uniform vec2 resolution;
    uniform sampler2D mouseTrail;
    uniform float gridSize;
    uniform vec3 pixelColor;

    vec2 coverUv(vec2 uv) {
      vec2 s = resolution.xy / max(resolution.x, resolution.y);
      vec2 newUv = (uv - 0.5) * s + 0.5;
      return clamp(newUv, 0.0, 1.0);
    }

    void main() {
      vec2 screenUv = gl_FragCoord.xy / resolution;
      vec2 uv = coverUv(screenUv);
      vec2 gridUvCenter = (floor(uv * gridSize) + 0.5) / gridSize;
      float trail = texture2D(mouseTrail, gridUvCenter).r;
      gl_FragColor = vec4(pixelColor, trail);
    }
  `
);

function Scene({
  gridSize,
  trailSize,
  maxAge,
  interpolate,
  color,
}: {
  gridSize: number;
  trailSize: number;
  maxAge: number;
  interpolate: number;
  color: string;
}) {
  const size = useThree((s) => s.size);
  const viewport = useThree((s) => s.viewport);

  const dotMaterial = useMemo(() => {
    const mat = new DotMaterial();
    mat.transparent = true;
    mat.depthWrite = false;
    return mat;
  }, []);

  useEffect(() => {
    dotMaterial.uniforms.pixelColor.value.set(color);
  }, [color, dotMaterial]);

  const [trail, onMove] = useTrailTexture({
    size: 512,
    radius: trailSize,
    maxAge,
    interpolate,
    ease: (x: number) => x,
  });

  // Canvas is pointer-events:none, so we capture mouse from document
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = 1 - e.clientY / window.innerHeight;
      (onMove as any)({ uv: new THREE.Vector2(x, y) });
    };
    document.addEventListener('pointermove', handler);
    return () => document.removeEventListener('pointermove', handler);
  }, [onMove]);

  if (trail) {
    trail.minFilter = THREE.NearestFilter;
    trail.magFilter = THREE.NearestFilter;
    trail.wrapS = THREE.ClampToEdgeWrapping;
    trail.wrapT = THREE.ClampToEdgeWrapping;
  }

  const scale = Math.max(viewport.width, viewport.height) / 2;

  return (
    <mesh scale={[scale, scale, 1]}>
      <planeGeometry args={[2, 2]} />
      <primitive
        object={dotMaterial}
        gridSize={gridSize}
        resolution={[size.width * viewport.dpr, size.height * viewport.dpr]}
        mouseTrail={trail}
      />
    </mesh>
  );
}

/**
 * PixelTrail — fullscreen overlay with pixelated cursor trail + star cursor icon.
 * Uses a lightweight second Canvas (alpha, no AA, no depth) layered above everything.
 */
export function PixelTrail() {
  const cursorUrl = typeof cursorStar === 'string' ? cursorStar : (cursorStar as { src: string }).src;

  useEffect(() => {
    const prev = document.body.style.cursor;
    document.body.style.cursor = `url(${cursorUrl}) 12 12, auto`;
    return () => {
      document.body.style.cursor = prev;
    };
  }, [cursorUrl]);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      <Canvas
        gl={{
          antialias: false,
          powerPreference: 'high-performance',
          alpha: true,
          stencil: false,
          depth: false,
        }}
        style={{ pointerEvents: 'none', width: '100%', height: '100%' }}
      >
        <Scene
          gridSize={73}
          trailSize={0.06}
          maxAge={450}
          interpolate={2.5}
          color="#d4ff00"
        />
      </Canvas>
    </div>
  );
}
