import { create } from 'zustand';

export const useVideoRecognition = create((set) => ({
  // 视频元素
  videoElement: null,
  setVideoElement: (videoElement) => set({ videoElement }),
  
  // MediaPipe 结果回调
  resultsCallback: null,
  setResultsCallback: (resultsCallback) => set({ resultsCallback }),
  
  // 摄像头状态
  isCameraActive: false,
  setIsCameraActive: (isCameraActive) => set({ isCameraActive }),
  
  // 处理状态
  isProcessing: false,
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  
  // 错误状态
  error: null,
  setError: (error) => set({ error }),
  
  // 清理错误
  clearError: () => set({ error: null }),
  
  // 手部调试状态
  handDebugInfo: {
    leftHandDetected: false,
    rightHandDetected: false,
    leftHandData: null,
    rightHandData: null,
    mappingInfo: ''
  },
  setHandDebugInfo: (handDebugInfo) => set({ handDebugInfo }),
  
  // 重置所有状态
  reset: () => set({
    videoElement: null,
    resultsCallback: null,
    isCameraActive: false,
    isProcessing: false,
    error: null,
    handDebugInfo: {
      leftHandDetected: false,
      rightHandDetected: false,
      leftHandData: null,
      rightHandData: null,
      mappingInfo: ''
    }
  }),
}));