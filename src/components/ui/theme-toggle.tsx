'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeContext } from '@/providers/ThemeProvider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className = '', 
  showLabel = false 
}) => {
  const { themeMode, updateThemeMode } = useThemeContext();

  const toggleTheme = () => {
    const modes: ('light' | 'dark' | 'auto')[] = ['light', 'dark', 'auto'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    updateThemeMode(modes[nextIndex]);
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'auto':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return '浅色';
      case 'dark':
        return '深色';
      case 'auto':
        return '自动';
      default:
        return '自动';
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`transition-all duration-200 hover:scale-105 ${className}`}
      title={`当前主题: ${getThemeLabel()}`}
    >
      {getThemeIcon()}
      {showLabel && (
        <span className="ml-2 text-xs">{getThemeLabel()}</span>
      )}
    </Button>
  );
}; 