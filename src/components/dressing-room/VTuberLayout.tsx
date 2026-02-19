"use client";

import React, { ReactNode, useState, useCallback } from 'react';
import { 
  BrandOverlay, 
  PowerToggle, 
  InfoPanels, 
  GoLiveButton,
  StreamRoomSidebar,
  StreamRoomChatPanel
} from './UILayoutRedesign';
import { BGMPlayer } from './BGMPlayer';
import { StreamEndMVP } from './StreamEndMVP';
import { RoomCursors } from './RoomCursors';
import { useSceneStore } from '@/hooks/use-scene-store';
import { useEchuuWebSocket } from '@/hooks/use-echuu-websocket';

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
  const [isStreamPanelOpen, setIsStreamPanelOpen] = useState(false);
  const roomId = useEchuuWebSocket((s) => s.roomId);
  const handlePanelOpenChange = useCallback((open: boolean) => {
    setIsStreamPanelOpen(open);
    useSceneStore.getState().setStreamPanelOpen(open);
  }, []);

  return (
    <div className="fixed inset-0 z-[2] overflow-hidden theme-transition pointer-events-none">
      {/* 3D 场景容器 (由 layout 层级管理) */}
      <div 
        className={`absolute inset-0 w-full h-full pointer-events-none transition-all duration-300 ease-in-out ${
          isStreamPanelOpen ? 'pl-[560px]' : 'pl-0'
        }`}
      >
        {children}
      </div>

      {/* 1. 左上角品牌信息 */}
      <BrandOverlay />

      {/* 2. 右上角电源开关 */}
      <PowerToggle 
        isActive={statusProps.isActive} 
        onToggle={controlProps.onCameraToggle} 
      />

      {/* 2.5 左侧 StreamRoom 控制 + 右侧 Chat */}
      <StreamRoomSidebar onPanelOpenChange={handlePanelOpenChange} onCameraToggle={controlProps.onCameraToggle} onOpenAnimationLibrary={controlProps.onOpenAnimationLibrary} />
      <StreamRoomChatPanel />

      {/* 3. 左下角信息面板 */}
      <InfoPanels 
        modelName={controlProps.modelName || 'Default Avatar'} 
        animationName={controlProps.animationName || 'Idle'} 
        showBones={controlProps.showBones} 
      />

      {/* 5. 底部中间主操作按钮 (Go Live) */}
      <GoLiveButton />

      {/* 5.5 直播结束 MVP 结算页 */}
      <StreamEndMVP />

      {/* 5.6 直播间内：其他观众光标（包子）+ 本机包子光标 + 发送本机光标 */}
      <RoomCursors />

    </div>
  );
};
