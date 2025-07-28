import { useState, useEffect } from 'react';

// 默认灵敏度设置
const DEFAULT_SENSITIVITY_SETTINGS = {
    // MediaPipe 检测设置 - 降低阈值提高灵敏度
    minDetectionConfidence: 0.3, // 从 0.4 降低到 0.3
    minTrackingConfidence: 0.3, // 从 0.4 降低到 0.3
    minHandDetectionConfidence: 0.3, // 从 0.4 降低到 0.3
    minHandTrackingConfidence: 0.3, // 从 0.4 降低到 0.3
    // 手臂响应设置 - 提高幅度和速度
    armAmplitude: 1.4, // 从 1.2 提高到 1.4
    armSpeed: 1.4, // 从 1.2 提高到 1.4
    // 手部响应设置 - 适度提高
    handAmplitude: 1.2, // 从 1.1 提高到 1.2
    handSpeed: 1.2, // 从 1.1 提高到 1.2
    // 手指响应设置 - 适度提高
    fingerAmplitude: 1.2, // 从 1.1 提高到 1.2
    fingerSpeed: 1.2, // 从 1.1 提高到 1.2
};

export const useSensitivitySettings = () => {
    const [settings, setSettings] = useState(DEFAULT_SENSITIVITY_SETTINGS);

    // 从 localStorage 加载设置
    useEffect(() => {
        const savedSettings = localStorage.getItem('vtuber-sensitivity-settings');
        if (savedSettings) {
            try {
                const parsedSettings = JSON.parse(savedSettings);
                setSettings({ ...DEFAULT_SENSITIVITY_SETTINGS, ...parsedSettings });
            } catch (error) {
                console.warn('Failed to parse sensitivity settings:', error);
            }
        }
    }, []);

    // 更新设置并保存到 localStorage
    const updateSettings = (newSettings) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);
        localStorage.setItem('vtuber-sensitivity-settings', JSON.stringify(updatedSettings));
    };

    // 重置到默认设置
    const resetSettings = () => {
        setSettings(DEFAULT_SENSITIVITY_SETTINGS);
        localStorage.removeItem('vtuber-sensitivity-settings');
    };

    return {
        settings,
        updateSettings,
        resetSettings,
        DEFAULT_SENSITIVITY_SETTINGS
    };
}; 