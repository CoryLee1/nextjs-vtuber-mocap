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
import { useTracking } from '@/hooks/use-tracking';

export default function VTuberApp() {
  const { t } = useI18n();
  const { trackPageView, trackFeatureUsed, trackError } = useTracking();
  const { state, uiState, handlers } = useVTuberControls();
  
  // 设置面板状态
  const [showSettings, setShowSettings] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 设置引用
  const [vrmRef, setVrmRef] = useState(null);
  const [animationManagerRef, setAnimationManagerRef] = useState(null);
  const [handDetectionStateRef, setHandDetectionStateRef] = useState(null);

  // 页面访问跟踪
  useEffect(() => {
    trackPageView('VTuber App', window.location.href);
  }, [trackPageView]);

  // 处理设置面板
  const handleOpenSettings = () => {
    setShowSettings(true);
    trackFeatureUsed('settings_opened', 'settings_panel');
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  // 处理调试面板
  const handleOpenDebugPanel = () => {
    setShowDebugPanel(true);
    trackFeatureUsed('debug_panel_opened', 'debug_tools');
  };

  const handleCloseDebugPanel = () => {
    setShowDebugPanel(false);
  };

  // 处理动作捕捉状态更新
  const handleMocapStatusUpdate = (newStatus: any) => {
    // 可以在这里处理状态更新
    console.log('Mocap status updated:', newStatus);
    
    // 跟踪关键状态变化
    if (newStatus?.isActive && !state.isCameraActive) {
      trackFeatureUsed('mocap_started', 'motion_capture');
    }
    
    if (newStatus?.error) {
      trackError('mocap_error', newStatus.error, 'motion_capture');
    }
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
    onClearError: () => {
      handlers.clearError();
      if (state.error) {
        trackError('error_cleared', state.error, 'main_interface');
      }
    },
  };

  // 控制面板属性
  const controlProps = {
    isCameraActive: state.isCameraActive,
    showBones: state.showBones,
    showDebug: state.showDebug,
    onCameraToggle: () => {
      handlers.handleCameraToggle();
      trackFeatureUsed('camera_toggled', 'camera_control');
    },
    onToggleBones: () => {
      handlers.handleToggleBones();
      trackFeatureUsed('bones_toggled', 'visualization');
    },
    onToggleDebug: () => {
      handlers.handleToggleDebug();
      trackFeatureUsed('debug_toggled', 'debug_tools');
    },
    onOpenModelManager: () => {
      handlers.handleOpenModelManager();
      trackFeatureUsed('model_manager_opened', 'model_management');
    },
    onOpenAnimationLibrary: () => {
      handlers.handleOpenAnimationLibrary();
      trackFeatureUsed('animation_library_opened', 'animation_management');
    },
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

  // 错误跟踪
  useEffect(() => {
    if (state.error) {
      trackError('vtuber_app_error', state.error, 'main_interface');
    }
  }, [state.error, trackError]);

  return (
    <VTuberLayout statusProps={statusProps} controlProps={controlProps}>
      {/* 3D 场景 */}
      <VTuberSceneContainer sceneProps={sceneProps} />

      {/* 摄像头组件 */}
      <CameraWidget
        isActive={state.isCameraActive}
        onToggle={handlers.handleCameraToggle}
        onError={(error: any) => {
          handlers.handleError(error);
          trackError('camera_error', error, 'camera_widget');
        }}
      />

      {/* 模型管理器 */}
      {uiState.showModelManager && (
        <ModelManager
          onClose={handlers.handleCloseModelManager}
          onSelect={(model: any) => {
            handlers.handleModelSelect(model);
            trackFeatureUsed('model_selected', 'model_management');
          }}
        />
      )}

      {/* 动画库 */}
      {uiState.showAnimationLibrary && (
        <AnimationLibrary
          onClose={handlers.handleCloseAnimationLibrary}
          onSelect={(animation: any) => {
            handlers.handleAnimationSelect(animation);
            trackFeatureUsed('animation_selected', 'animation_management');
          }}
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