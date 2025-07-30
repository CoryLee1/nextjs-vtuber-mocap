import React, { useState } from 'react';
import { DraggablePanel } from './DraggablePanel';

export const ControlPanel = ({ 
    isOpen, 
    onClose, 
    onOpenArmTest, 
    onOpenHandDebug, 
    onOpenSmoothSettings,
    mocapStatus,
    onOpenSensitivityPanel,
    onOpenModelManager,
    onOpenAnimationLibrary,
    selectedAnimation,
    showBones,
    onToggleBones,
    showArmAxes,
    onToggleArmAxes,
    axisSettings,
    onAxisAdjustment,
    cameraSettings,
    onCameraSettingsChange,
    debugSettings,
    onDebugSettingsChange
}) => {
    const [activeTab, setActiveTab] = useState('mocap');

    return (
        <DraggablePanel
            title="🎛️ 控制面板"
            defaultPosition={{ x: 150, y: 150 }}
            minWidth={400}
            minHeight={500}
            maxWidth={600}
            maxHeight={700}
            isVisible={isOpen}
            onClose={onClose}
            showToggle={false}
            showClose={true}
            zIndex={80}
        >
            <div className="p-4 h-full flex flex-col">
                {/* 标签页导航 */}
                <div className="flex border-b border-gray-200 mb-4">
                    {[
                        { id: 'mocap', label: '动捕状态', icon: '📹' },
                        { id: 'camera', label: '相机设置', icon: '📷' },
                        { id: 'debug', label: '调试选项', icon: '🐛' },
                        { id: 'quick', label: '快速操作', icon: '⚡' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="mr-1">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto">
                    {/* 动捕状态标签页 */}
                    {activeTab === 'mocap' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">动捕状态</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.face ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.face ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>面部</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.pose ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.pose ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>姿态</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.leftHand ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.leftHand ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>左手</span>
                                    </div>
                                    <div className={`flex items-center space-x-1 ${mocapStatus?.rightHand ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${mocapStatus?.rightHand ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span>右手</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">当前动画</h4>
                                <div className="text-xs text-gray-600">
                                    {selectedAnimation ? (
                                        <div className="bg-blue-50 p-2 rounded">
                                            <div className="font-medium">{selectedAnimation.name}</div>
                                            <div className="text-gray-500">{selectedAnimation.description}</div>
                                        </div>
                                    ) : (
                                        <div className="text-gray-400">未选择动画</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">快速操作</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={onOpenModelManager}
                                        className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        管理模型
                                    </button>
                                    <button
                                        onClick={onOpenAnimationLibrary}
                                        className="px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                    >
                                        动画库
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 相机设置标签页 */}
                    {activeTab === 'camera' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">相机控制</h4>
                                <div className="space-y-2 text-xs">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.enableUserControl}
                                            onChange={(e) => onCameraSettingsChange('enableUserControl', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>启用用户控制</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.enableAutoTrack}
                                            onChange={(e) => onCameraSettingsChange('enableAutoTrack', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>自动跟踪</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.showHint}
                                            onChange={(e) => onCameraSettingsChange('showHint', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>显示提示</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">鼠标控制</h4>
                                <div className="space-y-2 text-xs">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.useLeftMouseButton}
                                            onChange={(e) => onCameraSettingsChange('useLeftMouseButton', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>左键旋转</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.useRightMouseButton}
                                            onChange={(e) => onCameraSettingsChange('useRightMouseButton', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>右键平移</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={cameraSettings?.useMiddleMouseButton}
                                            onChange={(e) => onCameraSettingsChange('useMiddleMouseButton', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>中键缩放</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 调试选项标签页 */}
                    {activeTab === 'debug' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">显示选项</h4>
                                <div className="space-y-2 text-xs">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={showBones}
                                            onChange={(e) => onToggleBones(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>显示骨骼</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={showArmAxes}
                                            onChange={(e) => onToggleArmAxes(e.target.checked)}
                                            className="rounded"
                                        />
                                        <span>显示手臂坐标轴</span>
                                    </label>
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={debugSettings?.showDebug}
                                            onChange={(e) => onDebugSettingsChange({ ...debugSettings, showDebug: e.target.checked })}
                                            className="rounded"
                                        />
                                        <span>显示调试信息</span>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">调试工具</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        onClick={onOpenArmTest}
                                        className="px-3 py-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                                    >
                                        手臂测试
                                    </button>
                                    <button
                                        onClick={onOpenHandDebug}
                                        className="px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    >
                                        手部调试
                                    </button>
                                    <button
                                        onClick={onOpenSmoothSettings}
                                        className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        平滑设置
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 快速操作标签页 */}
                    {activeTab === 'quick' && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">常用操作</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={onOpenModelManager}
                                        className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        切换模型
                                    </button>
                                    <button
                                        onClick={onOpenAnimationLibrary}
                                        className="px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                    >
                                        切换动画
                                    </button>
                                    <button
                                        onClick={() => onToggleBones(!showBones)}
                                        className="px-3 py-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                    >
                                        {showBones ? '隐藏' : '显示'}骨骼
                                    </button>
                                    <button
                                        onClick={() => onToggleArmAxes(!showArmAxes)}
                                        className="px-3 py-2 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                                    >
                                        {showArmAxes ? '隐藏' : '显示'}坐标轴
                                    </button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-gray-700">系统信息</h4>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <div>当前模型: {selectedAnimation?.name || '默认模型'}</div>
                                    <div>当前动画: {selectedAnimation?.name || '待机动画'}</div>
                                    <div>骨骼显示: {showBones ? '开启' : '关闭'}</div>
                                    <div>坐标轴: {showArmAxes ? '开启' : '关闭'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DraggablePanel>
    );
}; 