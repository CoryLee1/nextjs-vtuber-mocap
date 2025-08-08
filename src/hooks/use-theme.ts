import { useState, useEffect } from 'react';

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  primaryColor: string;
}

export const useTheme = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'auto'>('dark');
  const [primaryColor, setPrimaryColor] = useState('#0ea5e9');
  const [isLoaded, setIsLoaded] = useState(false);

  // 加载保存的主题设置
  useEffect(() => {
    const savedTheme = localStorage.getItem('vtuber-theme');
    if (savedTheme) {
      try {
        const themeSettings: ThemeSettings = JSON.parse(savedTheme);
        setThemeMode(themeSettings.mode);
        setPrimaryColor(themeSettings.primaryColor);
      } catch (error) {
        console.error('Failed to load theme settings:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // 应用主题模式
  const applyThemeMode = (mode: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (mode === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // auto mode - 根据系统偏好
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  };

  // 应用主色调
  const applyPrimaryColor = (color: string) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', color);
    
    // 更新 CSS 变量
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary-color: ${color};
        --primary-hover: ${adjustBrightness(color, -10)};
        --primary-light: ${adjustBrightness(color, 90)};
      }
    `;
    
    // 移除旧的样式
    const oldStyle = document.getElementById('theme-color-style');
    if (oldStyle) {
      oldStyle.remove();
    }
    
    style.id = 'theme-color-style';
    document.head.appendChild(style);
  };

  // 调整颜色亮度
  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  };

  // 更新主题模式
  const updateThemeMode = (mode: 'light' | 'dark' | 'auto') => {
    setThemeMode(mode);
    applyThemeMode(mode);
    
    // 保存到本地存储
    const themeSettings: ThemeSettings = {
      mode,
      primaryColor
    };
    localStorage.setItem('vtuber-theme', JSON.stringify(themeSettings));
  };

  // 更新主色调
  const updatePrimaryColor = (color: string) => {
    setPrimaryColor(color);
    applyPrimaryColor(color);
    
    // 保存到本地存储
    const themeSettings: ThemeSettings = {
      mode: themeMode,
      primaryColor: color
    };
    localStorage.setItem('vtuber-theme', JSON.stringify(themeSettings));
  };

  // 重置主题设置
  const resetTheme = () => {
    const defaultTheme: ThemeSettings = {
      mode: 'dark',
      primaryColor: '#0ea5e9'
    };
    
    setThemeMode(defaultTheme.mode);
    setPrimaryColor(defaultTheme.primaryColor);
    applyThemeMode(defaultTheme.mode);
    applyPrimaryColor(defaultTheme.primaryColor);
    
    localStorage.setItem('vtuber-theme', JSON.stringify(defaultTheme));
  };

  // 监听系统主题变化
  useEffect(() => {
    if (themeMode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyThemeMode('auto');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // 应用当前主题设置
  useEffect(() => {
    if (isLoaded) {
      applyThemeMode(themeMode);
      applyPrimaryColor(primaryColor);
    }
  }, [isLoaded, themeMode, primaryColor]);

  return {
    themeMode,
    primaryColor,
    isLoaded,
    updateThemeMode,
    updatePrimaryColor,
    resetTheme,
    applyThemeMode,
    applyPrimaryColor
  };
}; 