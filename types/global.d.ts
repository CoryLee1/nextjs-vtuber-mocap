// 全局类型声明文件
declare global {
  // 声明 kalidokit 模块
  declare module 'kalidokit' {
    export interface TFace {
      [key: string]: any;
    }
    
    export interface TPose {
      [key: string]: any;
    }
    
    export interface THand {
      [key: string]: any;
    }
    
    export class Face {
      static solve(landmarks: any, imageSize: any): TFace | undefined;
    }
    
    export class Pose {
      static solve(landmarks: any, imageSize: any): TPose | undefined;
    }
    
    export class Hand {
      static solve(landmarks: any, imageSize: any): THand | undefined;
    }
  }

  // 声明 @pixiv/three-vrm 模块
  declare module '@pixiv/three-vrm' {
    import { Object3D } from 'three';
    
    export class VRMLoaderPlugin {
      constructor(parser: any);
    }
    
    export class VRM extends Object3D {
      humanoid: any;
      expressionManager: any;
      lookAt: any;
      [key: string]: any;
    }
    
    export class VRMHumanoid {
      getBoneNode(boneName: string): any;
      [key: string]: any;
    }
    
    export class VRMExpressionManager {
      getExpressionValue(expressionName: string): number;
      setExpressionValue(expressionName: string, value: number): void;
      [key: string]: any;
    }
    
    export class VRMLookAt {
      target: any;
      [key: string]: any;
    }
  }

  // 声明 VRM 文件模块
  declare module '*.vrm' {
    const content: string;
    export default content;
  }

  // 声明 FBX 文件模块
  declare module '*.fbx' {
    const content: string;
    export default content;
  }

  // 声明 GLB/GLTF 文件模块
  declare module '*.glb' {
    const content: string;
    export default content;
  }

  declare module '*.gltf' {
    const content: string;
    export default content;
  }

  // 声明 MediaPipe 模块
  declare module '@mediapipe/holistic' {
    export class Holistic {
      constructor(config?: any);
      setOptions(options: any): void;
      onResults(callback: (results: any) => void): void;
      send({ image }: { image: any }): void;
      close(): void;
    }
  }

  declare module '@mediapipe/camera_utils' {
    export class Camera {
      constructor(video: any, options: any);
      start(): Promise<void>;
      stop(): void;
    }
  }

  // 声明 react-draggable 模块
  declare module 'react-draggable' {
    import { ComponentType } from 'react';
    
    interface DraggableProps {
      children: React.ReactNode;
      defaultPosition?: { x: number; y: number };
      position?: { x: number; y: number };
      onDrag?: (e: any, data: any) => void;
      onStop?: (e: any, data: any) => void;
      handle?: string;
      disabled?: boolean;
      bounds?: string | { left?: number; top?: number; right?: number; bottom?: number };
      grid?: [number, number];
      scale?: number;
      [key: string]: any;
    }
    
    const Draggable: ComponentType<DraggableProps>;
    export default Draggable;
  }

  // 声明其他可能缺失的模块
  declare module '*.json' {
    const content: any;
    export default content;
  }

  declare module '*.png' {
    const content: string;
    export default content;
  }

  declare module '*.jpg' {
    const content: string;
    export default content;
  }

  declare module '*.jpeg' {
    const content: string;
    export default content;
  }

  declare module '*.gif' {
    const content: string;
    export default content;
  }

  declare module '*.svg' {
    const content: string;
    export default content;
  }

  // 声明全局变量
  interface Window {
    [key: string]: any;
  }

  // 声明 Node.js 全局变量
  declare namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

export {}; 