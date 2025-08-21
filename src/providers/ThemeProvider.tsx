'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from '@/hooks/use-theme';

interface ThemeContextType {
  themeMode: 'light' | 'dark' | 'auto';
  primaryColor: string;
  updateThemeMode: (mode: 'light' | 'dark' | 'auto') => void;
  updatePrimaryColor: (color: string) => void;
  resetTheme: () => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const theme = useTheme();

  // 确保主题在客户端渲染时正确应用
  useEffect(() => {
    if (theme.isLoaded) {
      // 应用主题模式
      theme.applyThemeMode(theme.themeMode);
      // 应用主色调
      theme.applyPrimaryColor(theme.primaryColor);
    }
  }, [theme.isLoaded, theme.themeMode, theme.primaryColor]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}; 