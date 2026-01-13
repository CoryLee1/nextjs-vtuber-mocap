import React, { ReactNode, memo, useState } from 'react';
import { 
  BrandOverlay, 
  PowerToggle, 
  InfoPanels, 
  ActionButtonStack, 
  CameraActionButton 
} from './UILayoutRedesign';

// 状态指示器接口 (保留以兼容 VTuberApp.tsx)
interface StatusIndicatorProps {
  isActive: boolean;
  isProcessing: boolean;
  error: string | null;
  onClearError: () => void;
}

// 控制面板接口 (保留以兼容 VTuberApp.tsx)
interface ControlPanelProps {
  isCameraActive: boolean;
  showBones: boolean;
  showDebug: boolean;
  onCameraToggle: () => void;
  onToggleBones: () => void;
  onToggleDebug: () => void;
  onOpenModelManager: () => void;
  onOpenAnimationLibrary: () => void;
  onOpenConfigManager: () => void;
  // 新设计中可能需要的额外属性
  modelName?: string;
  animationName?: string;
}

// 主布局组件
interface VTuberLayoutProps {
  children: ReactNode;
  statusProps: StatusIndicatorProps;
  controlProps: ControlPanelProps;
}

export const VTuberLayout: React.FC<VTuberLayoutProps> = ({
  children,
  statusProps,
  controlProps
}) => {
  return (
    <div className="relative w-full h-screen overflow-hidden theme-transition pointer-events-none bg-background/20">
      {/* 3D 场景容器 (由 layout 层级管理) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {children}
      </div>

      {/* 1. 左上角品牌信息 */}
      <BrandOverlay />

      {/* 2. 右上角电源开关 */}
      <PowerToggle 
        isActive={statusProps.isActive} 
        onToggle={controlProps.onCameraToggle} 
      />

      {/* 3. 左下角信息面板 */}
      <InfoPanels 
        modelName={controlProps.modelName || 'Default Avatar'} 
        animationName={controlProps.animationName || 'Idle'} 
        showBones={controlProps.showBones} 
      />

      {/* 4. 右下角操作按钮组 */}
      <ActionButtonStack 
        onOpenModelManager={controlProps.onOpenModelManager}
        onOpenAnimationLibrary={controlProps.onOpenAnimationLibrary}
        onToggleBones={controlProps.onToggleBones}
        onOpenSettings={controlProps.onOpenConfigManager}
        isBonesVisible={controlProps.showBones}
      />

      {/* 5. 底部中间主操作按钮 (摄像头) */}
      <CameraActionButton 
        isActive={statusProps.isActive} 
        onToggle={controlProps.onCameraToggle} 
      />
    </div>
  );
};
 