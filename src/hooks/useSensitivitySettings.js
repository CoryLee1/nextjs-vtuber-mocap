import { useState, useEffect } from 'react';
import { getConfig, setConfig, CONFIG_CATEGORIES } from '@/utils/configManager';

// 兼容性：保持原有的默认设置结构
const DEFAULT_SENSITIVITY_SETTINGS = {
    // MediaPipe 检测设置
    minDetectionConfidence: 0.3,
    minTrackingConfidence: 0.3,
    minHandDetectionConfidence: 0.3,
    minHandTrackingConfidence: 0.3,
    // 手臂响应设置
    armAmplitude: 1.0,
    armSpeed: 0.6,
    // 手部响应设置
    handAmplitude: 1.0,
    handSpeed: 0.8,
    // 手指响应设置
    fingerAmplitude: 1.0,
    fingerSpeed: 0.8,
    // 颈部响应设置
    neckAmplitude: 1.0,
    neckSpeed: 0.7,
};

export const useSensitivitySettings = () => {
    const [settings, setSettings] = useState(DEFAULT_SENSITIVITY_SETTINGS);

    // 从配置管理器加载设置
    useEffect(() => {
        const loadSettings = () => {
            const newSettings = {
                // MediaPipe 设置
                minDetectionConfidence: getConfig(CONFIG_CATEGORIES.MEDIAPIPE, 'minDetectionConfidence'),
                minTrackingConfidence: getConfig(CONFIG_CATEGORIES.MEDIAPIPE, 'minTrackingConfidence'),
                minHandDetectionConfidence: getConfig(CONFIG_CATEGORIES.MEDIAPIPE, 'minHandDetectionConfidence'),
                minHandTrackingConfidence: getConfig(CONFIG_CATEGORIES.MEDIAPIPE, 'minHandTrackingConfidence'),
                // 灵敏度设置
                armAmplitude: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'armAmplitude'),
                armSpeed: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'armSpeed'),
                handAmplitude: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'handAmplitude'),
                handSpeed: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'handSpeed'),
                fingerAmplitude: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'fingerAmplitude'),
                fingerSpeed: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'fingerSpeed'),
                neckAmplitude: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'neckAmplitude'),
                neckSpeed: getConfig(CONFIG_CATEGORIES.SENSITIVITY, 'neckSpeed'),
            };
            setSettings(newSettings);
        };

        loadSettings();

        // 监听配置变化
        const handleConfigChange = () => {
            loadSettings();
        };

        // 添加配置变化监听器
        window.addEventListener('configChanged', handleConfigChange);

        return () => {
            window.removeEventListener('configChanged', handleConfigChange);
        };
    }, []);

    // 更新设置并保存到配置管理器
    const updateSettings = (newSettings) => {
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        // 更新配置管理器
        Object.entries(newSettings).forEach(([key, value]) => {
            if (key.includes('Confidence')) {
                // MediaPipe 设置
                setConfig(CONFIG_CATEGORIES.MEDIAPIPE, key, value);
            } else if (key.includes('Amplitude') || key.includes('Speed')) {
                // 灵敏度设置
                setConfig(CONFIG_CATEGORIES.SENSITIVITY, key, value);
            }
        });

        // 触发配置变化事件
        window.dispatchEvent(new CustomEvent('configChanged'));
    };

    // 重置到默认设置
    const resetSettings = () => {
        setSettings(DEFAULT_SENSITIVITY_SETTINGS);
        
        // 重置配置管理器中的相关设置
        Object.entries(DEFAULT_SENSITIVITY_SETTINGS).forEach(([key, value]) => {
            if (key.includes('Confidence')) {
                setConfig(CONFIG_CATEGORIES.MEDIAPIPE, key, value);
            } else if (key.includes('Amplitude') || key.includes('Speed')) {
                setConfig(CONFIG_CATEGORIES.SENSITIVITY, key, value);
            }
        });

        // 触发配置变化事件
        window.dispatchEvent(new CustomEvent('configChanged'));
    };

    return {
        settings,
        updateSettings,
        resetSettings,
        DEFAULT_SENSITIVITY_SETTINGS
    };
}; 