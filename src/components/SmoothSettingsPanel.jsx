import React, { useState, useEffect } from 'react';
import { DraggablePanel } from './DraggablePanel';

export const SmoothSettingsPanel = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState({
        neckDamping: 0.3,
        armDamping: 0.2,
        handDamping: 0.1,
        fingerDamping: 0.05
    });

    // 从localStorage加载设置
    useEffect(() => {
        const savedSettings = localStorage.getItem('smoothSettings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (error) {
                console.warn('Failed to parse smooth settings:', error);
            }
        }
    }, []);

    // 保存设置到localStorage
    const saveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('smoothSettings', JSON.stringify(newSettings));
    };

    const handleSettingChange = (key, value) => {
        const newSettings = { ...settings, [key]: value };
        saveSettings(newSettings);
    };

    const resetToDefaults = () => {
        const defaults = {
            neckDamping: 0.3,
            armDamping: 0.2,
            handDamping: 0.1,
            fingerDamping: 0.05
        };
        saveSettings(defaults);
    };

    return (
        <DraggablePanel
            title="⚙️ 平滑设置"
            defaultPosition={{ x: 200, y: 200 }}
            minWidth={350}
            minHeight={400}
            maxWidth={500}
            maxHeight={600}
            isVisible={isOpen}
            onClose={onClose}
            showToggle={false}
            showClose={true}
            zIndex={90}
        >
            <div className="p-4 h-full flex flex-col">
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">阻尼设置</h4>
                    <p className="text-xs text-gray-500 mb-4">
                        调整不同部位的平滑程度，数值越小响应越快但可能更抖动
                    </p>
                </div>

                <div className="flex-1 space-y-4">
                    {/* 脖子阻尼 */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">脖子阻尼</label>
                            <span className="text-xs text-gray-500">{settings.neckDamping.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.01"
                            max="1"
                            step="0.01"
                            value={settings.neckDamping}
                            onChange={(e) => handleSettingChange('neckDamping', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>快速</span>
                            <span>平滑</span>
                        </div>
                    </div>

                    {/* 手臂阻尼 */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">手臂阻尼</label>
                            <span className="text-xs text-gray-500">{settings.armDamping.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.01"
                            max="1"
                            step="0.01"
                            value={settings.armDamping}
                            onChange={(e) => handleSettingChange('armDamping', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>快速</span>
                            <span>平滑</span>
                        </div>
                    </div>

                    {/* 手部阻尼 */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">手部阻尼</label>
                            <span className="text-xs text-gray-500">{settings.handDamping.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.01"
                            max="1"
                            step="0.01"
                            value={settings.handDamping}
                            onChange={(e) => handleSettingChange('handDamping', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>快速</span>
                            <span>平滑</span>
                        </div>
                    </div>

                    {/* 手指阻尼 */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700">手指阻尼</label>
                            <span className="text-xs text-gray-500">{settings.fingerDamping.toFixed(2)}</span>
                        </div>
                        <input
                            type="range"
                            min="0.01"
                            max="1"
                            step="0.01"
                            value={settings.fingerDamping}
                            onChange={(e) => handleSettingChange('fingerDamping', parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>快速</span>
                            <span>平滑</span>
                        </div>
                    </div>
                </div>

                {/* 底部操作 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between">
                        <button
                            onClick={resetToDefaults}
                            className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                            重置默认
                        </button>
                        <div className="text-xs text-gray-500">
                            设置已自动保存
                        </div>
                    </div>
                </div>

                {/* 说明 */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-xs font-semibold text-blue-800 mb-1">💡 使用说明</h5>
                    <div className="text-xs text-blue-700 space-y-1">
                        <div>• 阻尼值越小，响应越快但可能更抖动</div>
                        <div>• 阻尼值越大，动作越平滑但响应较慢</div>
                        <div>• 建议根据摄像头质量和网络延迟调整</div>
                    </div>
                </div>
            </div>
        </DraggablePanel>
    );
}; 