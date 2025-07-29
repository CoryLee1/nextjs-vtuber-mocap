import { useState, useEffect } from 'react';

export const SmoothSettingsPanel = ({ isVisible = false, onClose }) => {
    const [settings, setSettings] = useState({
        // 平滑参数
        neckDamping: 0.9,
        neckStiffness: 0.15,
        armDamping: 0.85,
        armStiffness: 0.12,
        handDamping: 0.8,
        handStiffness: 0.15,
        fingerDamping: 0.7,
        fingerStiffness: 0.2,
        
        // 启用/禁用平滑
        enableSmoothing: false,
        enableNeckSmoothing: false,
        enableArmSmoothing: false,
        enableHandSmoothing: false,
        enableFingerSmoothing: false
    });

    // 从localStorage加载设置
    useEffect(() => {
        const savedSettings = localStorage.getItem('smoothSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    // 保存设置到localStorage
    const saveSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('smoothSettings', JSON.stringify(newSettings));
    };

    const handleSliderChange = (key, value) => {
        const newSettings = { ...settings, [key]: parseFloat(value) };
        saveSettings(newSettings);
    };

    const handleToggleChange = (key) => {
        const newSettings = { ...settings, [key]: !settings[key] };
        saveSettings(newSettings);
    };

    const resetToDefaults = () => {
        const defaultSettings = {
            neckDamping: 0.9,
            neckStiffness: 0.15,
            armDamping: 0.85,
            armStiffness: 0.12,
            handDamping: 0.8,
            handStiffness: 0.15,
            fingerDamping: 0.7,
            fingerStiffness: 0.2,
            enableSmoothing: false,
            enableNeckSmoothing: false,
            enableArmSmoothing: false,
            enableHandSmoothing: false,
            enableFingerSmoothing: false
        };
        saveSettings(defaultSettings);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 right-4 w-80 bg-black/90 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white z-50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">🎛️ 平滑参数设置</h3>
                <button
                    onClick={onClose}
                    className="text-white/70 hover:text-white transition-colors"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                {/* 全局开关 */}
                <div className="flex items-center justify-between">
                    <span className="text-sm">全局平滑</span>
                    <input
                        type="checkbox"
                        checked={settings.enableSmoothing}
                        onChange={() => handleToggleChange('enableSmoothing')}
                        className="w-4 h-4"
                    />
                </div>

                {/* 脖子平滑 */}
                <div className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">脖子平滑</span>
                        <input
                            type="checkbox"
                            checked={settings.enableNeckSmoothing}
                            onChange={() => handleToggleChange('enableNeckSmoothing')}
                            className="w-4 h-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-white/70">阻尼: {settings.neckDamping.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.99"
                                step="0.01"
                                value={settings.neckDamping}
                                onChange={(e) => handleSliderChange('neckDamping', e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/70">刚度: {settings.neckStiffness.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.01"
                                max="0.5"
                                step="0.01"
                                value={settings.neckStiffness}
                                onChange={(e) => handleSliderChange('neckStiffness', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* 手臂平滑 */}
                <div className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">手臂平滑</span>
                        <input
                            type="checkbox"
                            checked={settings.enableArmSmoothing}
                            onChange={() => handleToggleChange('enableArmSmoothing')}
                            className="w-4 h-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-white/70">阻尼: {settings.armDamping.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.99"
                                step="0.01"
                                value={settings.armDamping}
                                onChange={(e) => handleSliderChange('armDamping', e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/70">刚度: {settings.armStiffness.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.01"
                                max="0.5"
                                step="0.01"
                                value={settings.armStiffness}
                                onChange={(e) => handleSliderChange('armStiffness', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* 手部平滑 */}
                <div className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">手部平滑</span>
                        <input
                            type="checkbox"
                            checked={settings.enableHandSmoothing}
                            onChange={() => handleToggleChange('enableHandSmoothing')}
                            className="w-4 h-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-white/70">阻尼: {settings.handDamping.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.99"
                                step="0.01"
                                value={settings.handDamping}
                                onChange={(e) => handleSliderChange('handDamping', e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/70">刚度: {settings.handStiffness.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.01"
                                max="0.5"
                                step="0.01"
                                value={settings.handStiffness}
                                onChange={(e) => handleSliderChange('handStiffness', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* 手指平滑 */}
                <div className="border border-white/10 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">手指平滑</span>
                        <input
                            type="checkbox"
                            checked={settings.enableFingerSmoothing}
                            onChange={() => handleToggleChange('enableFingerSmoothing')}
                            className="w-4 h-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <div>
                            <label className="text-xs text-white/70">阻尼: {settings.fingerDamping.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.99"
                                step="0.01"
                                value={settings.fingerDamping}
                                onChange={(e) => handleSliderChange('fingerDamping', e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-white/70">刚度: {settings.fingerStiffness.toFixed(2)}</label>
                            <input
                                type="range"
                                min="0.01"
                                max="0.5"
                                step="0.01"
                                value={settings.fingerStiffness}
                                onChange={(e) => handleSliderChange('fingerStiffness', e.target.value)}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* 重置按钮 */}
                <button
                    onClick={resetToDefaults}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                >
                    重置为默认值
                </button>
            </div>
        </div>
    );
}; 