import { useState, useEffect } from 'react';

export const ArmTestPanel = ({ onSettingsChange, initialSettings = null }) => {
    const [settings, setSettings] = useState({
        leftArmMultiplier: { x: -1, y: 1, z: -1 },
        rightArmMultiplier: { x: 1, y: 1, z: -1 },
        amplitude: 1,
        showDebug: true,
        showBones: false,
        showRawData: true,
        ...initialSettings
    });

    const [isExpanded, setIsExpanded] = useState(true);

    // 当设置改变时通知父组件
    useEffect(() => {
        onSettingsChange?.(settings);
    }, [settings, onSettingsChange]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const updateMultiplier = (arm, axis, value) => {
        setSettings(prev => ({
            ...prev,
            [`${arm}ArmMultiplier`]: {
                ...prev[`${arm}ArmMultiplier`],
                [axis]: value
            }
        }));
    };

    // 预设配置
    const presets = {
        default: {
            leftArmMultiplier: { x: -1, y: 1, z: -1 },
            rightArmMultiplier: { x: 1, y: 1, z: -1 },
            amplitude: 1
        },
        mirror: {
            leftArmMultiplier: { x: 1, y: 1, z: 1 },
            rightArmMultiplier: { x: -1, y: 1, z: 1 },
            amplitude: 1
        },
        noFlip: {
            leftArmMultiplier: { x: 1, y: 1, z: 1 },
            rightArmMultiplier: { x: 1, y: 1, z: 1 },
            amplitude: 1
        }
    };

    const applyPreset = (presetName) => {
        setSettings(prev => ({ ...prev, ...presets[presetName] }));
    };

    return (
        <div className="fixed top-4 left-4 bg-white/95 backdrop-blur-md rounded-lg shadow-lg text-sm z-40 border border-gray-200">
            {/* 标题栏 */}
            <div 
                className="flex items-center justify-between p-3 bg-vtuber-primary text-white rounded-t-lg cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="font-bold">🔧 手臂调试面板</h3>
                <span className="text-xs">{isExpanded ? '🔽' : '▶️'}</span>
            </div>
            
            {isExpanded && (
                <div className="p-4 space-y-4 max-w-xs">
                    {/* 显示控制 */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">显示选项</h4>
                        <div className="space-y-1">
                            <label className="flex items-center text-xs">
                                <input
                                    type="checkbox"
                                    checked={settings.showDebug}
                                    onChange={(e) => updateSetting('showDebug', e.target.checked)}
                                    className="mr-2"
                                />
                                显示调试箭头
                            </label>
                            <label className="flex items-center text-xs">
                                <input
                                    type="checkbox"
                                    checked={settings.showBones}
                                    onChange={(e) => updateSetting('showBones', e.target.checked)}
                                    className="mr-2"
                                />
                                显示骨骼
                            </label>
                            <label className="flex items-center text-xs">
                                <input
                                    type="checkbox"
                                    checked={settings.showRawData}
                                    onChange={(e) => updateSetting('showRawData', e.target.checked)}
                                    className="mr-2"
                                />
                                显示原始数据
                            </label>
                        </div>
                    </div>

                    {/* 快速预设 */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">快速预设</h4>
                        <div className="grid grid-cols-3 gap-1">
                            {Object.keys(presets).map(presetName => (
                                <button
                                    key={presetName}
                                    onClick={() => applyPreset(presetName)}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                                >
                                    {presetName}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 左臂倍数 */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">左臂倍数</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map(axis => (
                                <div key={axis} className="text-center">
                                    <label className="block text-xs font-medium mb-1">
                                        {axis.toUpperCase()}
                                    </label>
                                    <select
                                        value={settings.leftArmMultiplier[axis]}
                                        onChange={(e) => updateMultiplier('left', axis, parseFloat(e.target.value))}
                                        className="w-full text-xs border rounded px-1 py-1"
                                    >
                                        <option value={-2}>-2</option>
                                        <option value={-1}>-1</option>
                                        <option value={0}>0</option>
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 右臂倍数 */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">右臂倍数</h4>
                        <div className="grid grid-cols-3 gap-2">
                            {['x', 'y', 'z'].map(axis => (
                                <div key={axis} className="text-center">
                                    <label className="block text-xs font-medium mb-1">
                                        {axis.toUpperCase()}
                                    </label>
                                    <select
                                        value={settings.rightArmMultiplier[axis]}
                                        onChange={(e) => updateMultiplier('right', axis, parseFloat(e.target.value))}
                                        className="w-full text-xs border rounded px-1 py-1"
                                    >
                                        <option value={-2}>-2</option>
                                        <option value={-1}>-1</option>
                                        <option value={0}>0</option>
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 幅度控制 */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700">
                            动作幅度: {settings.amplitude.toFixed(1)}
                        </h4>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={settings.amplitude}
                            onChange={(e) => updateSetting('amplitude', parseFloat(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* 当前设置显示 */}
                    <div className="text-xs bg-gray-50 p-2 rounded">
                        <div className="font-medium mb-1">当前设置:</div>
                        <div>左臂: {JSON.stringify(settings.leftArmMultiplier)}</div>
                        <div>右臂: {JSON.stringify(settings.rightArmMultiplier)}</div>
                    </div>

                    {/* 说明 */}
                    <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
                        <div className="font-medium mb-1">💡 使用说明:</div>
                        <div>1. 打开摄像头</div>
                        <div>2. 伸手测试方向</div>
                        <div>3. 调整倍数修正</div>
                        <div>4. X=左右, Y=上下, Z=前后</div>
                    </div>
                </div>
            )}
        </div>
    );
};