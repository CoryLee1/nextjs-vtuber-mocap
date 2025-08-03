import { useState, useCallback } from 'react';
import { VTuberState, VRMModel, Animation } from '@/types';
import { dataFlowMonitor, dataFlowSequencer, DataFlowEvent, DataFlowValidator } from '@/lib/data-flow-monitor';

// 控制逻辑 Hook
export const useVTuberControls = () => {
  const [state, setState] = useState<VTuberState>({
    selectedModel: null,
    selectedAnimation: null,
    isCameraActive: false,
    isProcessing: false,
    mocapData: null,
    error: null,
    showBones: false,
    showDebug: false,
  });

  const [uiState, setUiState] = useState({
    showModelManager: false,
    showAnimationLibrary: false,
    showConfigManager: false,
    showDebugPanel: false,
  });

  // 安全的状态更新函数
  const safeSetState = useCallback((updater: (prev: VTuberState) => VTuberState) => {
    setState(prevState => {
      const newState = updater(prevState);
      
      // 验证状态更新
      const validation = DataFlowValidator.validateStateUpdate(prevState, newState);
      if (!validation.isValid) {
        console.error('State update validation failed:', validation.errors);
        dataFlowMonitor.logEvent(DataFlowEvent.ERROR_OCCURRED, null, validation.errors.join(', '));
        return prevState; // 保持原状态
      }
      
      return newState;
    });
  }, []);

  // 模型选择处理
  const handleModelSelect = useCallback((model: VRMModel) => {
    dataFlowSequencer.recordOperation('model_select');
    dataFlowMonitor.logEvent(DataFlowEvent.MODEL_LOADED, { modelId: model.id, modelName: model.name });
    
    safeSetState(prev => ({
      ...prev,
      selectedModel: model,
    }));
  }, [safeSetState]);

  // 动画选择处理
  const handleAnimationSelect = useCallback((animation: Animation) => {
    dataFlowSequencer.recordOperation('animation_select');
    dataFlowMonitor.logEvent(DataFlowEvent.ANIMATION_LOADED, { animationId: animation.id, animationName: animation.name });
    
    safeSetState(prev => ({
      ...prev,
      selectedAnimation: animation,
    }));
  }, [safeSetState]);

  // UI 面板控制
  const handleOpenModelManager = useCallback(() => {
    dataFlowSequencer.recordOperation('ui_model_manager_open');
    setUiState(prev => ({ ...prev, showModelManager: true }));
  }, []);

  const handleCloseModelManager = useCallback(() => {
    dataFlowSequencer.recordOperation('ui_model_manager_close');
    setUiState(prev => ({ ...prev, showModelManager: false }));
  }, []);

  const handleOpenAnimationLibrary = useCallback(() => {
    dataFlowSequencer.recordOperation('ui_animation_library_open');
    setUiState(prev => ({ ...prev, showAnimationLibrary: true }));
  }, []);

  const handleCloseAnimationLibrary = useCallback(() => {
    dataFlowSequencer.recordOperation('ui_animation_library_close');
    setUiState(prev => ({ ...prev, showAnimationLibrary: false }));
  }, []);

  const handleOpenConfigManager = useCallback(() => {
    dataFlowSequencer.recordOperation('ui_config_manager_open');
    setUiState(prev => ({ ...prev, showConfigManager: true }));
  }, []);

  const handleCloseConfigManager = useCallback(() => {
    dataFlowSequencer.recordOperation('ui_config_manager_close');
    setUiState(prev => ({ ...prev, showConfigManager: false }));
  }, []);

  // 调试功能控制
  const handleToggleBones = useCallback(() => {
    dataFlowSequencer.recordOperation('toggle_bones');
    safeSetState(prev => ({
      ...prev,
      showBones: !prev.showBones,
    }));
  }, [safeSetState]);

  const handleToggleDebug = useCallback(() => {
    dataFlowSequencer.recordOperation('toggle_debug');
    safeSetState(prev => ({
      ...prev,
      showDebug: !prev.showDebug,
    }));
  }, [safeSetState]);

  // 摄像头控制
  const handleCameraToggle = useCallback(() => {
    const isCurrentlyActive = state.isCameraActive;
    const operation = isCurrentlyActive ? 'camera_stop' : 'camera_start';
    const event = isCurrentlyActive ? DataFlowEvent.CAMERA_STOP : DataFlowEvent.CAMERA_START;
    
    dataFlowSequencer.recordOperation(operation);
    dataFlowMonitor.logEvent(event);
    
    safeSetState(prev => ({
      ...prev,
      isCameraActive: !prev.isCameraActive,
      // 关闭摄像头时清除处理状态
      isProcessing: !prev.isCameraActive ? false : prev.isProcessing,
    }));
  }, [state.isCameraActive, safeSetState]);

  // 错误处理
  const handleError = useCallback((error: string) => {
    dataFlowSequencer.recordOperation('error_occurred');
    dataFlowMonitor.logEvent(DataFlowEvent.ERROR_OCCURRED, null, error);
    
    safeSetState(prev => ({
      ...prev,
      error,
      // 发生错误时停止处理
      isProcessing: false,
    }));
  }, [safeSetState]);

  const clearError = useCallback(() => {
    dataFlowSequencer.recordOperation('error_cleared');
    safeSetState(prev => ({
      ...prev,
      error: null,
    }));
  }, [safeSetState]);

  // 动作捕捉数据更新
  const handleMocapDataUpdate = useCallback((mocapData: any) => {
    // 验证动作捕捉数据
    const validation = DataFlowValidator.validateMocapData(mocapData);
    if (!validation.isValid) {
      console.error('Mocap data validation failed:', validation.errors);
      handleError(`Invalid mocap data: ${validation.errors.join(', ')}`);
      return;
    }

    dataFlowSequencer.recordOperation('mocap_data_received');
    dataFlowMonitor.logEvent(DataFlowEvent.MOCAP_DATA_RECEIVED, { timestamp: mocapData.timestamp });
    
    safeSetState(prev => ({
      ...prev,
      mocapData,
      isProcessing: false,
    }));
  }, [safeSetState, handleError]);

  // 处理状态更新
  const handleProcessingStateChange = useCallback((isProcessing: boolean) => {
    const operation = isProcessing ? 'processing_start' : 'processing_end';
    const event = isProcessing ? DataFlowEvent.PROCESSING_START : DataFlowEvent.PROCESSING_END;
    
    dataFlowSequencer.recordOperation(operation);
    dataFlowMonitor.logEvent(event);
    
    safeSetState(prev => ({
      ...prev,
      isProcessing,
    }));
  }, [safeSetState]);

  // 获取数据流统计
  const getDataFlowStats = useCallback(() => {
    return {
      monitor: dataFlowMonitor.getPerformanceStats(),
      sequence: dataFlowSequencer.validateSequence(),
      recentErrors: dataFlowMonitor.getRecentErrors(),
    };
  }, []);

  return {
    state,
    uiState,
    handlers: {
      handleModelSelect,
      handleAnimationSelect,
      handleOpenModelManager,
      handleCloseModelManager,
      handleOpenAnimationLibrary,
      handleCloseAnimationLibrary,
      handleOpenConfigManager,
      handleCloseConfigManager,
      handleToggleBones,
      handleToggleDebug,
      handleCameraToggle,
      handleError,
      clearError,
      handleMocapDataUpdate,
      handleProcessingStateChange,
      getDataFlowStats,
    },
  };
};

// 控制面板组件
interface VTuberControlsProps {
  state: VTuberState;
  uiState: any;
  handlers: any;
}

export const VTuberControls: React.FC<VTuberControlsProps> = ({
  state,
  uiState,
  handlers,
}) => {
  return (
    <div className="vtuber-controls">
      {/* 这里可以添加控制按钮等 UI 元素 */}
      <div className="control-buttons">
        <button
          onClick={handlers.handleCameraToggle}
          className={`vtuber-button ${state.isCameraActive ? 'active' : ''}`}
        >
          {state.isCameraActive ? '关闭摄像头' : '开启摄像头'}
        </button>
        
        <button
          onClick={handlers.handleToggleBones}
          className={`vtuber-button ${state.showBones ? 'active' : ''}`}
        >
          显示骨骼
        </button>
        
        <button
          onClick={handlers.handleToggleDebug}
          className={`vtuber-button ${state.showDebug ? 'active' : ''}`}
        >
          调试模式
        </button>
      </div>

      {/* 错误显示 */}
      {state.error && (
        <div className="error-message">
          {state.error}
          <button onClick={handlers.clearError}>关闭</button>
        </div>
      )}

      {/* 处理状态指示 */}
      {state.isProcessing && (
        <div className="processing-indicator">
          正在处理...
        </div>
      )}
    </div>
  );
}; 