"use client";

import React, { useState, useEffect } from 'react';
import { VTuberLayout } from './VTuberLayout';
import { VTuberSceneContainer } from './VTuberScene';
import { CameraWidget } from './CameraWidget';
import { ModelManager } from '../vtuber/ModelManager';
import { AnimationLibrary } from '../vtuber/AnimationLibrary';
import { SettingsPanel } from '../settings/SettingsPanel';
import { DataFlowDebugPanel } from '../debug/DataFlowDebugPanel';
import { useVTuberControls } from './VTuberControls';
import { useI18n } from '@/hooks/use-i18n';

export default function VTuberApp() {
  const { t } = useI18n();
  const { state, uiState, handlers } = useVTuberControls();
  
  // 设置面板状态
  const [showSettings, setShowSettings] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 设置引用
  const [vrmRef, setVrmRef] = useState(null);
  const [animationManagerRef, setAnimationManagerRef] = useState(null);
  const [handDetectionStateRef, setHandDetectionStateRef] = useState(null);

  // 处理设置面板
  const handleOpenSettings = () => {
    setShowSettings(true);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // 处理调试面板
  const handleOpenDebugPanel = () => {
    setShowDebugPanel(true);
  };

  const handleCloseDebugPanel = () => {
    setShowDebugPanel(false);
  };

  // 处理动作捕捉状态更新
  const handleMocapStatusUpdate = (newStatus: any) => {
    // 可以在这里处理状态更新
    console.log('Mocap status updated:', newStatus);
  };

  // 场景属性
  const sceneProps = {
    selectedModel: state.selectedModel,
    selectedAnimation: state.selectedAnimation,
    showBones: state.showBones,
    debugSettings: { showDebug: state.showDebug },
    showArmAxes: false,
    axisSettings: {},
    cameraSettings: {
      width: 640,
      height: 480,
      fps: 30,
      enableAutoTrack: true,
      enableUserControl: true,
      showHint: true,
      useGameStyle: false,
    },
    onVrmRef: setVrmRef,
    onAnimationManagerRef: setAnimationManagerRef,
    onHandDetectionStateRef: setHandDetectionStateRef,
    onMocapStatusUpdate: handleMocapStatusUpdate,
  };

  // 状态指示器属性
  const statusProps = {
    isActive: state.isCameraActive,
    isProcessing: state.isProcessing,
    error: state.error,
    onClearError: handlers.clearError,
  };

  // 控制面板属性
  const controlProps = {
    isCameraActive: state.isCameraActive,
    showBones: state.showBones,
    showDebug: state.showDebug,
    onCameraToggle: handlers.handleCameraToggle,
    onToggleBones: handlers.handleToggleBones,
    onToggleDebug: handlers.handleToggleDebug,
    onOpenModelManager: handlers.handleOpenModelManager,
    onOpenAnimationLibrary: handlers.handleOpenAnimationLibrary,
    onOpenConfigManager: handleOpenSettings,
  };

  // 开发环境下添加快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl + Shift + D 打开调试面板
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        handleOpenDebugPanel();
      }
    };

    if (process.env.NODE_ENV === 'development') {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  return (
    <VTuberLayout statusProps={statusProps} controlProps={controlProps}>
      {/* 3D 场景 */}
      <VTuberSceneContainer sceneProps={sceneProps} />

      {/* 摄像头组件 */}
      <CameraWidget
        isActive={state.isCameraActive}
        onToggle={handlers.handleCameraToggle}
        onError={handlers.handleError}
      />

      {/* 模型管理器 */}
      {uiState.showModelManager && (
        <ModelManager
          onClose={handlers.handleCloseModelManager}
          onSelect={handlers.handleModelSelect}
        />
      )}

      {/* 动画库 */}
      {uiState.showAnimationLibrary && (
        <AnimationLibrary
          onClose={handlers.handleCloseAnimationLibrary}
          onSelect={handlers.handleAnimationSelect}
        />
      )}

      {/* 设置面板 */}
      {showSettings && (
        <SettingsPanel
          isOpen={showSettings}
          onClose={handleCloseSettings}
        />
      )}

      {/* 数据流调试面板 */}
      {showDebugPanel && (
        <DataFlowDebugPanel
          isOpen={showDebugPanel}
          onClose={handleCloseDebugPanel}
        />
      )}

      {/* 开发环境下的调试按钮 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 left-4 z-40">
          <button
            onClick={handleOpenDebugPanel}
            className="px-3 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 transition-colors"
            title={`${t('vtuber.controls.debugTools')} (Ctrl+Shift+D)`}
          >
            {t('vtuber.controls.debug')}
          </button>
        </div>
      )}
    </VTuberLayout>
  );
}