import { useEffect, useRef, useCallback } from 'react';
import { Holistic, Camera } from '@mediapipe/holistic';
import { MocapData, FaceData, PoseData, HandsData } from '@/types';

// MediaPipe 处理器类
export class MediaPipeProcessor {
  private holistic: Holistic | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private isProcessing: boolean = false;
  private onResults: ((results: MocapData) => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  constructor() {
    this.initializeHolistic();
  }

  // 初始化 Holistic
  private async initializeHolistic() {
    try {
      this.holistic = new Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }
      });

      this.holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
        refineFaceLandmarks: true,
        maxNumHands: 2,
      });

      this.holistic.onResults(this.handleResults.bind(this));
    } catch (error) {
      console.error('MediaPipe 初始化失败:', error);
      this.onError?.(error instanceof Error ? error.message : 'MediaPipe 初始化失败');
    }
  }

  // 处理 MediaPipe 结果
  private handleResults(results: any) {
    if (!this.isProcessing) return;

    try {
      const mocapData: MocapData = {
        face: this.processFaceData(results.faceLandmarks),
        pose: this.processPoseData(results.poseLandmarks),
        hands: this.processHandsData(results.leftHandLandmarks, results.rightHandLandmarks),
        timestamp: Date.now(),
      };

      this.onResults?.(mocapData);
    } catch (error) {
      console.error('处理 MediaPipe 结果失败:', error);
      this.onError?.(error instanceof Error ? error.message : '处理结果失败');
    }
  }

  // 处理面部数据
  private processFaceData(landmarks: any[]): FaceData {
    if (!landmarks || landmarks.length === 0) {
      return {
        landmarks: [],
        rotation: [0, 0, 0],
        translation: [0, 0, 0],
        eyeBlink: { left: 0, right: 0 },
        mouthOpen: 0,
        mouthSmile: 0,
      };
    }

    // 计算面部旋转和位置
    const faceRotation = this.calculateFaceRotation(landmarks);
    const faceTranslation = this.calculateFaceTranslation(landmarks);
    
    // 计算眨眼和嘴部表情
    const eyeBlink = this.calculateEyeBlink(landmarks);
    const mouthOpen = this.calculateMouthOpen(landmarks);
    const mouthSmile = this.calculateMouthSmile(landmarks);

    return {
      landmarks: landmarks.map(point => [point.x, point.y, point.z]),
      rotation: faceRotation,
      translation: faceTranslation,
      eyeBlink,
      mouthOpen,
      mouthSmile,
    };
  }

  // 处理姿态数据
  private processPoseData(landmarks: any[]): PoseData {
    if (!landmarks || landmarks.length === 0) {
      return {
        landmarks: [],
        rotation: [0, 0, 0],
        translation: [0, 0, 0],
        confidence: 0,
      };
    }

    const poseRotation = this.calculatePoseRotation(landmarks);
    const poseTranslation = this.calculatePoseTranslation(landmarks);
    const confidence = this.calculatePoseConfidence(landmarks);

    return {
      landmarks: landmarks.map(point => [point.x, point.y, point.z]),
      rotation: poseRotation,
      translation: poseTranslation,
      confidence,
    };
  }

  // 处理手部数据
  private processHandsData(leftHand: any[], rightHand: any[]): HandsData {
    return {
      left: leftHand ? this.processHandData(leftHand) : null,
      right: rightHand ? this.processHandData(rightHand) : null,
    };
  }

  // 处理单个手部数据
  private processHandData(landmarks: any[]) {
    if (!landmarks || landmarks.length === 0) return null;

    const handRotation = this.calculateHandRotation(landmarks);
    const handTranslation = this.calculateHandTranslation(landmarks);
    const confidence = this.calculateHandConfidence(landmarks);
    const gestures = this.recognizeHandGestures(landmarks);

    return {
      landmarks: landmarks.map(point => [point.x, point.y, point.z]),
      rotation: handRotation,
      translation: handTranslation,
      confidence,
      gestures,
    };
  }

  // 计算面部旋转
  private calculateFaceRotation(landmarks: any[]): [number, number, number] {
    // 简化的面部旋转计算
    // 实际应用中可以使用更复杂的算法
    return [0, 0, 0];
  }

  // 计算面部位置
  private calculateFaceTranslation(landmarks: any[]): [number, number, number] {
    if (landmarks.length === 0) return [0, 0, 0];
    
    const center = landmarks.reduce(
      (acc, point) => [acc[0] + point.x, acc[1] + point.y, acc[2] + point.z],
      [0, 0, 0]
    ).map(val => val / landmarks.length);

    return center as [number, number, number];
  }

  // 计算眨眼
  private calculateEyeBlink(landmarks: any[]): { left: number; right: number } {
    // 简化的眨眼检测
    return { left: 0, right: 0 };
  }

  // 计算嘴部开合
  private calculateMouthOpen(landmarks: any[]): number {
    // 简化的嘴部开合检测
    return 0;
  }

  // 计算嘴部微笑
  private calculateMouthSmile(landmarks: any[]): number {
    // 简化的微笑检测
    return 0;
  }

  // 计算姿态旋转
  private calculatePoseRotation(landmarks: any[]): [number, number, number] {
    return [0, 0, 0];
  }

  // 计算姿态位置
  private calculatePoseTranslation(landmarks: any[]): [number, number, number] {
    if (landmarks.length === 0) return [0, 0, 0];
    
    const center = landmarks.reduce(
      (acc, point) => [acc[0] + point.x, acc[1] + point.y, acc[2] + point.z],
      [0, 0, 0]
    ).map(val => val / landmarks.length);

    return center as [number, number, number];
  }

  // 计算姿态置信度
  private calculatePoseConfidence(landmarks: any[]): number {
    return 1.0;
  }

  // 计算手部旋转
  private calculateHandRotation(landmarks: any[]): [number, number, number] {
    return [0, 0, 0];
  }

  // 计算手部位置
  private calculateHandTranslation(landmarks: any[]): [number, number, number] {
    if (landmarks.length === 0) return [0, 0, 0];
    
    const center = landmarks.reduce(
      (acc, point) => [acc[0] + point.x, acc[1] + point.y, acc[2] + point.z],
      [0, 0, 0]
    ).map(val => val / landmarks.length);

    return center as [number, number, number];
  }

  // 计算手部置信度
  private calculateHandConfidence(landmarks: any[]): number {
    return 1.0;
  }

  // 识别手势
  private recognizeHandGestures(landmarks: any[]): string[] {
    // 简化的手势识别
    return [];
  }

  // 启动处理
  async start(videoElement: HTMLVideoElement, onResults: (data: MocapData) => void, onError: (error: string) => void) {
    if (!this.holistic) {
      throw new Error('MediaPipe 未初始化');
    }

    this.videoElement = videoElement;
    this.onResults = onResults;
    this.onError = onError;
    this.isProcessing = true;

    try {
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.holistic && this.isProcessing) {
            await this.holistic.send({ image: videoElement });
          }
        },
        width: 640,
        height: 480,
      });

      await this.camera.start();
    } catch (error) {
      console.error('启动摄像头失败:', error);
      this.onError?.(error instanceof Error ? error.message : '启动摄像头失败');
    }
  }

  // 停止处理
  stop() {
    this.isProcessing = false;
    if (this.camera) {
      this.camera.stop();
    }
  }

  // 清理资源
  dispose() {
    this.stop();
    this.holistic = null;
    this.camera = null;
    this.videoElement = null;
  }
}

// MediaPipe 处理器 Hook
export const useMediaPipeProcessor = () => {
  const processorRef = useRef<MediaPipeProcessor | null>(null);

  useEffect(() => {
    processorRef.current = new MediaPipeProcessor();

    return () => {
      if (processorRef.current) {
        processorRef.current.dispose();
      }
    };
  }, []);

  const startProcessing = useCallback(async (
    videoElement: HTMLVideoElement,
    onResults: (data: MocapData) => void,
    onError: (error: string) => void
  ) => {
    if (processorRef.current) {
      await processorRef.current.start(videoElement, onResults, onError);
    }
  }, []);

  const stopProcessing = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.stop();
    }
  }, []);

  return {
    startProcessing,
    stopProcessing,
    processor: processorRef.current,
  };
}; 