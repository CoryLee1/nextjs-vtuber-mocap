import React, { useState } from 'react';
import { DraggablePanel } from './DraggablePanel';

export const ArmTestPanel = ({ 
    isOpen, 
    onClose, 
    showArmAxes, 
    onToggleArmAxes, 
    axisSettings, 
    onAxisAdjustment 
}) => {
    const [activeSection, setActiveSection] = useState('leftArm');

    const sections = [
        { id: 'leftArm', label: '左手臂', icon: '🤚' },
        { id: 'rightArm', label: '右手臂', icon: '🤚' },
        { id: 'leftHand', label: '左手', icon: '✋' },
        { id: 'rightHand', label: '右手', icon: '✋' },
        { id: 'neck', label: '脖子', icon: '👤' }
    ];

    const handleAxisChange = (section, axis, value) => {
        onAxisAdjustment(section, axis, value);
    };

    const resetSection = (section) => {
        const defaultValues = { x: 1, y: 1, z: 1 };
        Object.keys(defaultValues).forEach(axis => {
            handleAxisChange(section, axis, defaultValues[axis]);
        });
    };

    const currentSettings = axisSettings[activeSection] || { x: 1, y: 1, z: 1 };

    return (
        <DraggablePanel
            title="🦾 手臂测试面板"
            defaultPosition={{ x: 250, y: 250 }}
            minWidth={400}
            minHeight={500}
            maxWidth={600}
            maxHeight={700}
            isVisible={isOpen}
            onClose={onClose}
            showToggle={false}
            showClose={true}
            zIndex={85}
        >
            <div className="p-4 h-full flex flex-col">
                {/* 标签页导航 */}
                <div className="flex border-b border-gray-200 mb-4">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                                activeSection === section.id
                                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            <span className="mr-1">{section.icon}</span>
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* 内容区域 */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        {/* 当前设置显示 */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">当前设置</h4>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="text-center">
                                    <div className="text-red-600 font-medium">X轴</div>
                                    <div className="text-gray-600">{currentSettings.x}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-green-600 font-medium">Y轴</div>
                                    <div className="text-gray-600">{currentSettings.y}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-blue-600 font-medium">Z轴</div>
                                    <div className="text-gray-600">{currentSettings.z}</div>
                                </div>
                            </div>
                        </div>

                        {/* 坐标轴调整 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">坐标轴调整</h4>
                            <div className="space-y-3">
                                {/* X轴调整 */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-red-600">X轴 (左右)</label>
                                        <span className="text-xs text-gray-500">{currentSettings.x}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleAxisChange(activeSection, 'x', -1)}
                                            className="px-3 py-2 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                        >
                                            反向 (-1)
                                        </button>
                                        <button
                                            onClick={() => handleAxisChange(activeSection, 'x', 1)}
                                            className="px-3 py-2 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        >
                                            正向 (+1)
                                        </button>
                                    </div>
                                </div>

                                {/* Y轴调整 */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-green-600">Y轴 (上下)</label>
                                        <span className="text-xs text-gray-500">{currentSettings.y}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleAxisChange(activeSection, 'y', -1)}
                                            className="px-3 py-2 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                        >
                                            反向 (-1)
                                        </button>
                                        <button
                                            onClick={() => handleAxisChange(activeSection, 'y', 1)}
                                            className="px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                        >
                                            正向 (+1)
                                        </button>
                                    </div>
                                </div>

                                {/* Z轴调整 */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-sm font-medium text-blue-600">Z轴 (前后)</label>
                                        <span className="text-xs text-gray-500">{currentSettings.z}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleAxisChange(activeSection, 'z', -1)}
                                            className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                        >
                                            反向 (-1)
                                        </button>
                                        <button
                                            onClick={() => handleAxisChange(activeSection, 'z', 1)}
                                            className="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                        >
                                            正向 (+1)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 快速操作 */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">快速操作</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => resetSection(activeSection)}
                                    className="px-3 py-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                >
                                    重置当前
                                </button>
                                <button
                                    onClick={onToggleArmAxes}
                                    className={`px-3 py-2 text-xs rounded transition-colors ${
                                        showArmAxes 
                                            ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                            : 'bg-gray-500 text-white hover:bg-gray-600'
                                    }`}
                                >
                                    {showArmAxes ? '隐藏' : '显示'}坐标轴
                                </button>
                            </div>
                        </div>

                        {/* 说明 */}
                        <div className="bg-yellow-50 p-3 rounded-lg">
                            <h5 className="text-xs font-semibold text-yellow-800 mb-1">💡 使用说明</h5>
                            <div className="text-xs text-yellow-700 space-y-1">
                                <div>• 红色=X轴(左右方向)</div>
                                <div>• 绿色=Y轴(上下方向)</div>
                                <div>• 蓝色=Z轴(前后方向)</div>
                                <div>• 如果动作方向相反，点击对应的&quot;反向&quot;按钮</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
};