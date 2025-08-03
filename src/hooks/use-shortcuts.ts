import { useEffect, useCallback } from 'react';

// 快捷键类型
export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
}

// 默认快捷键配置
export const defaultShortcuts: Shortcut[] = [
  {
    key: 'c',
    ctrl: true,
    action: () => {},
    description: 'Toggle Camera',
  },
  {
    key: 'b',
    ctrl: true,
    action: () => {},
    description: 'Toggle Bones',
  },
  {
    key: 'd',
    ctrl: true,
    action: () => {},
    description: 'Toggle Debug',
  },
  {
    key: 'm',
    ctrl: true,
    action: () => {},
    description: 'Open Model Manager',
  },
  {
    key: 'a',
    ctrl: true,
    action: () => {},
    description: 'Open Animation Library',
  },
  {
    key: 's',
    ctrl: true,
    action: () => {},
    description: 'Open Settings',
  },
  {
    key: 'F11',
    action: () => {},
    description: 'Toggle Fullscreen',
  },
  {
    key: 'F12',
    action: () => {},
    description: 'Take Screenshot',
  },
  {
    key: 'r',
    ctrl: true,
    action: () => {},
    description: 'Start Recording',
  },
  {
    key: 'p',
    ctrl: true,
    action: () => {},
    description: 'Pause/Play',
  },
  {
    key: 'Escape',
    action: () => {},
    description: 'Close/Exit',
  },
];

export const useShortcuts = (shortcuts: Shortcut[] = defaultShortcuts) => {
  // 检查快捷键是否匹配
  const isShortcutMatch = useCallback((event: KeyboardEvent, shortcut: Shortcut) => {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                    event.code === shortcut.key ||
                    event.key === shortcut.key;

    const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;
    const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

    return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch;
  }, []);

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 忽略在输入框中的快捷键
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    for (const shortcut of shortcuts) {
      if (isShortcutMatch(event, shortcut)) {
        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, isShortcutMatch]);

  // 注册快捷键
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 获取快捷键描述
  const getShortcutDescription = useCallback((shortcut: Shortcut) => {
    const parts = [];
    
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.meta) parts.push('Cmd');
    
    parts.push(shortcut.key);
    
    return parts.join(' + ');
  }, []);

  // 检查快捷键冲突
  const checkConflicts = useCallback(() => {
    const conflicts: Array<{ shortcut1: Shortcut; shortcut2: Shortcut }> = [];
    
    for (let i = 0; i < shortcuts.length; i++) {
      for (let j = i + 1; j < shortcuts.length; j++) {
        const shortcut1 = shortcuts[i];
        const shortcut2 = shortcuts[j];
        
        if (shortcut1.key === shortcut2.key &&
            shortcut1.ctrl === shortcut2.ctrl &&
            shortcut1.shift === shortcut2.shift &&
            shortcut1.alt === shortcut2.alt &&
            shortcut1.meta === shortcut2.meta) {
          conflicts.push({ shortcut1, shortcut2 });
        }
      }
    }
    
    return conflicts;
  }, [shortcuts]);

  return {
    shortcuts,
    getShortcutDescription,
    checkConflicts,
  };
}; 