import React from 'react';
import Draggable from 'react-draggable';

interface DraggablePanelProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  isVisible?: boolean;
  onClose?: () => void;
  showClose?: boolean;
  showToggle?: boolean;
  zIndex?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  defaultPosition?: { x: number; y: number };
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  title,
  children,
  isVisible = true,
  onClose,
  showClose = true,
  zIndex = 100,
  minWidth = 320,
  minHeight = 240,
  maxWidth = 600,
  maxHeight = 700,
  defaultPosition = { x: 100, y: 100 },
}) => {
  if (!isVisible) return null;

  return (
    <Draggable defaultPosition={defaultPosition} handle=".draggable-panel-header">
      <div
        className="fixed bg-white shadow-2xl border border-gray-300 rounded-lg flex flex-col"
        style={{
          zIndex,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight,
        }}
      >
        <div className="draggable-panel-header cursor-move flex items-center justify-between px-4 py-2 border-b bg-gray-100 rounded-t-lg select-none">
          <div className="font-semibold text-gray-800 text-base">{title}</div>
          {showClose && (
            <button
              onClick={onClose}
              className="ml-2 text-gray-500 hover:text-red-500 text-lg font-bold focus:outline-none"
              title="关闭"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex-1 overflow-auto p-0">{children}</div>
      </div>
    </Draggable>
  );
}; 