import { useState, useEffect } from 'react';

export const SensitivityPanel = ({ 
    isOpen, 
    onClose,
    sensitivitySettings,
    onSensitivityChange 
}) => {
    const [localSettings, setLocalSettings] = useState(sensitivitySettings);

    // 当外部设置变化时更新本地状态
    useEffect(() => {
        setLocalSettings(sensitivitySettings);
    }, [sensitivitySettings]);

    // 处理滑块变化
    const handleSliderChange = (key, value) => {
        const newSettings = { ...localSettings, [key]: value };
        setLocalSettings(newSettings);
        onSensitivityChange(newSettings);
    };

    // 重置到默认值
    const handleReset = () => {
        const defaultSettings = {
            // MediaPipe 检测设置 - 降低阈值提高灵敏度
            minDetectionConfidence: 0.3, // 从 0.4 降低到 0.3
            minTrackingConfidence: 0.3, // 从 0.4 降低到 0.3
            minHandDetectionConfidence: 0.3, // 从 0.4 降低到 0.3
            minHandTrackingConfidence: 0.3, // 从 0.4 降低到 0.3
            // 手臂响应设置 - 提高幅度和速度
            armAmplitude: 1.3, // 从 1.2 提高到 1.4
            armSpeed: 1.3, // 从 1.2 提高到 1.4
            // 手部响应设置 - 适度提高
            handAmplitude: 1.2, // 从 1.1 提高到 1.2
            handSpeed: 1.2, // 从 1.1 提高到 1.2
            // 手指响应设置 - 适度提高
            fingerAmplitude: 1.2, // 从 1.1 提高到 1.2
            fingerSpeed: 1.2, // 从 1.1 提高到 1.2
        };
        setLocalSettings(defaultSettings);
        onSensitivityChange(defaultSettings);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-[80vh] overflow-y-auto">
                {/* 标题栏 */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">灵敏度调节面板</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* MediaPipe 检测设置 */}
                <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 border-b pb-2">MediaPipe 检测设置</h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                检测置信度: {localSettings.minDetectionConfidence.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.05"
                                value={localSettings.minDetectionConfidence}
                                onChange={(e) => handleSliderChange('minDetectionConfidence', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                跟踪置信度: {localSettings.minTrackingConfidence.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.05"
                                value={localSettings.minTrackingConfidence}
                                onChange={(e) => handleSliderChange('minTrackingConfidence', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                手部检测置信度: {localSettings.minHandDetectionConfidence.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.05"
                                value={localSettings.minHandDetectionConfidence}
                                onChange={(e) => handleSliderChange('minHandDetectionConfidence', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                手部跟踪置信度: {localSettings.minHandTrackingConfidence.toFixed(2)}
                            </label>
                            <input
                                type="range"
                                min="0.1"
                                max="0.9"
                                step="0.05"
                                value={localSettings.minHandTrackingConfidence}
                                onChange={(e) => handleSliderChange('minHandTrackingConfidence', parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* 手臂响应设置 */}
                <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 border-b pb-2">手臂响应设置</h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                动作幅度: {localSettings.armAmplitude.toFixed(2)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={localSettings.armAmplitude}
                                onChange={(e) => handleSliderChange('armAmplitude', parseFloat(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                响应速度: {localSettings.armSpeed.toFixed(2)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={localSettings.armSpeed}
                                onChange={(e) => handleSliderChange('armSpeed', parseFloat(e.target.value))}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* 手部响应设置 */}
                <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 border-b pb-2">手部响应设置</h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                手部幅度: {localSettings.handAmplitude.toFixed(2)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={localSettings.handAmplitude}
                                onChange={(e) => handleSliderChange('handAmplitude', parseFloat(e.target.value))}
                                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                手部速度: {localSettings.handSpeed.toFixed(2)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={localSettings.handSpeed}
                                onChange={(e) => handleSliderChange('handSpeed', parseFloat(e.target.value))}
                                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* 手指响应设置 */}
                <div className="space-y-4 mb-6">
                    <h4 className="text-sm font-medium text-gray-700 border-b pb-2">手指响应设置</h4>
                    
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                手指幅度: {localSettings.fingerAmplitude.toFixed(2)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={localSettings.fingerAmplitude}
                                onChange={(e) => handleSliderChange('fingerAmplitude', parseFloat(e.target.value))}
                                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="text-xs text-gray-600 block mb-1">
                                手指速度: {localSettings.fingerSpeed.toFixed(2)}x
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="2.0"
                                step="0.1"
                                value={localSettings.fingerSpeed}
                                onChange={(e) => handleSliderChange('fingerSpeed', parseFloat(e.target.value))}
                                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3 pt-4 border-t">
                    <button
                        onClick={handleReset}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                        重置默认
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-vtuber-primary text-white rounded-lg hover:bg-vtuber-secondary transition-colors text-sm"
                    >
                        确定
                    </button>
                </div>

                {/* 提示信息 */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                        💡 调整后立即生效，可以实时测试效果。建议从较小的调整开始，逐步找到最适合的设置。
                    </p>
                </div>
            </div>
        </div>
    );
}; 