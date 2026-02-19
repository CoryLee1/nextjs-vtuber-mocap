"use client";

import React, { useState, useEffect } from 'react';
import { VTuberLayout } from './VTuberLayout';
import { EchuuLiveAudio } from './EchuuLiveAudio';
import { CameraWidget } from './CameraWidget';
import { ModelManager } from '../vtuber/ModelManager';
import { AnimationLibrary } from '../vtuber/AnimationLibrary';
import { SettingsPanel } from '../settings/SettingsPanel';
import { DataFlowDebugPanel } from '../debug/DataFlowDebugPanel';
import { useVTuberControls } from './VTuberControls';
import { useI18n } from '@/hooks/use-i18n';
import { useTracking } from '@/hooks/use-tracking';
import { useSceneStore } from '@/hooks/use-scene-store';
import { useVTuberAnimationState } from '@/hooks/use-vtuber-animation-state';
import { DEFAULT_IDLE_URL } from '@/config/vtuber-animations';

export default function VTuberApp() {
  const { t } = useI18n();
  const { trackPageView, trackFeatureUsed, trackError } = useTracking();
  const { state, uiState, handlers } = useVTuberControls();
  
  // 场景状态管理
  const {
    setScene,
    setVRMModelUrl,
    setAnimationUrl,
    setNextAnimationUrl,
    updateCameraSettings,
    updateDebugSettings,
    setAnimationManagerRef,
    setHandDetectionStateRef,
  } = useSceneStore();
  
  // 设置面板状态
  const [showSettings, setShowSettings] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // 页面访问跟踪
  useEffect(() => {
    trackPageView('VTuber App', window.location.href);
  }, [trackPageView]);

  // 初始化场景状态：设置为 main 场景
  useEffect(() => {
    setScene('main');
  }, [setScene]);

  // 状态机驱动：idle 随机轮播 / speaking 时用 talking 动画；双缓冲预加载 next（可暂停以便单独试播 KAWAII 等）
  const animationStateMachinePaused = useSceneStore((s) => s.animationStateMachinePaused);
  const { animationUrl: stateMachineUrl, nextAnimationUrl: stateMachineNextUrl } = useVTuberAnimationState();
  useEffect(() => {
    if (animationStateMachinePaused) return;
    setAnimationUrl(stateMachineUrl);
    setNextAnimationUrl(stateMachineNextUrl);
  }, [animationStateMachinePaused, stateMachineUrl, stateMachineNextUrl, setAnimationUrl, setNextAnimationUrl]);

  // 初始化：若 store 尚无动画 URL，用配置默认
  useEffect(() => {
    const currentAnimationUrl = useSceneStore.getState().animationUrl;
    if (!currentAnimationUrl) {
      setAnimationUrl(DEFAULT_IDLE_URL);
    }
  }, [setAnimationUrl]);

  // 同步模型到场景 store
  useEffect(() => {
    if (state.selectedModel?.url) {
      setVRMModelUrl(state.selectedModel.url);
    }
  }, [state.selectedModel?.url, setVRMModelUrl]);

  // 动画库选择可覆盖（之后状态机更新会再切回 idle/speaking）
  useEffect(() => {
    if (state.selectedAnimation?.url) {
      setAnimationUrl(state.selectedAnimation.url);
    }
  }, [state.selectedAnimation?.url, setAnimationUrl]);

  // 同步调试设置到场景 store
  useEffect(() => {
    updateDebugSettings({
      showDebug: state.showDebug,
      showBones: state.showBones,
      showArmAxes: false,
    });
  }, [state.showDebug, state.showBones, updateDebugSettings]);

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

  // 初始化相机设置
  useEffect(() => {
    updateCameraSettings({
      width: 640,
      height: 480,
      fps: 30,
      enableAutoTrack: true,
      enableUserControl: true,
      showHint: true,
      useGameStyle: false,
    });
  }, [updateCameraSettings]);

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
    modelName: state.selectedModel?.name,
    animationName: state.selectedAnimation?.name,
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
      {/* 实时播放 WebSocket 返回的语音并同步嘴型 */}
      <EchuuLiveAudio />
      {/* 注意：3D 场景现在由 Canvas3DProvider 在 layout 层级管理 */}
      {/* 不再需要在这里渲染 VTuberSceneContainer */}

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
    </VTuberLayout>
  );
}