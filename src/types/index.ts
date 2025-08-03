// 统一导出所有类型定义
export * from './config';
export * from './vtuber';
export * from './api';

// 全局类型定义
export interface Window {
  MediaPipe?: any;
  Holistic?: any;
  Camera?: any;
}

// 扩展全局类型
declare global {
  interface Window {
    MediaPipe?: any;
    Holistic?: any;
    Camera?: any;
  }
} 