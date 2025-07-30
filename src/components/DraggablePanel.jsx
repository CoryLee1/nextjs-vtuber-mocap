import React, { useState, useRef, useEffect, useCallback } from 'react';

export const DraggablePanel = ({ 
    children, 
    title, 
    defaultPosition = { x: 20, y: 20 },
    minWidth = 300,
    minHeight = 200,
    maxWidth = 600,
    maxHeight = 800,
    className = "",
    isVisible = true,
    onClose = null,
    onToggle = null,
    showToggle = true,
    showClose = true,
    zIndex = 50
}) => {
    const [position, setPosition] = useState(defaultPosition);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: minWidth, height: minHeight });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null);
    const panelRef = useRef(null);

    // 处理拖拽开始
    const handleMouseDown = useCallback((e) => {
        if (e.target.closest('.panel-content') || e.target.closest('.panel-resize')) {
            return; // 不处理内容区域和调整大小区域的拖拽
        }
        
        setIsDragging(true);
        const rect = panelRef.current.getBoundingClientRect();
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.preventDefault();
    }, []);

    // 处理拖拽移动
    const handleMouseMove = useCallback((e) => {
        if (!isDragging && !isResizing) return;

        if (isDragging) {
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            
            // 限制在视窗内
            const maxX = window.innerWidth - size.width;
            const maxY = window.innerHeight - size.height;
            
            setPosition({
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            });
        } else if (isResizing) {
            const rect = panelRef.current.getBoundingClientRect();
            const deltaX = e.clientX - rect.left;
            const deltaY = e.clientY - rect.top;
            
            let newWidth = size.width;
            let newHeight = size.height;
            
            if (resizeDirection.includes('e')) {
                newWidth = Math.max(minWidth, Math.min(deltaX, maxWidth));
            }
            if (resizeDirection.includes('s')) {
                newHeight = Math.max(minHeight, Math.min(deltaY, maxHeight));
            }
            
            setSize({ width: newWidth, height: newHeight });
        }
    }, [isDragging, isResizing, dragOffset, size, resizeDirection, minWidth, minHeight, maxWidth, maxHeight]);

    // 处理拖拽结束
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
    }, []);

    // 处理调整大小开始
    const handleResizeStart = useCallback((e, direction) => {
        setIsResizing(true);
        setResizeDirection(direction);
        e.stopPropagation();
    }, []);

    // 添加全局鼠标事件监听
    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

    if (!isVisible) return null;

    return (
        <div
            ref={panelRef}
            className={`fixed bg-white/95 backdrop-blur-md rounded-lg shadow-xl border border-gray-200 ${className}`}
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                zIndex: zIndex,
                cursor: isDragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* 标题栏 */}
            <div 
                className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b border-gray-200 cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
                </div>
                <div className="flex items-center space-x-1">
                    {showToggle && onToggle && (
                        <button
                            onClick={onToggle}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="最小化"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    )}
                    {showClose && onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                            title="关闭"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* 内容区域 */}
            <div className="panel-content h-full overflow-auto">
                {children}
            </div>

            {/* 调整大小手柄 */}
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize panel-resize">
                <div 
                    className="w-full h-full"
                    onMouseDown={(e) => handleResizeStart(e, 'se')}
                />
            </div>
        </div>
    );
}; 