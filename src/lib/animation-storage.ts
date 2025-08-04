import { Animation } from '@/types';

export class AnimationStorage {
  private readonly STORAGE_KEY = 'vtuber-user-animations';

  // 获取用户上传的动画
  getUserAnimations(): Animation[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user animations from localStorage:', error);
    }
    return [];
  }

  // 保存用户上传的动画
  saveUserAnimation(animation: Animation): void {
    try {
      const existingAnimations = this.getUserAnimations();
      
      // 检查是否已存在相同ID的动画
      const existingIndex = existingAnimations.findIndex(a => a.id === animation.id);
      
      if (existingIndex >= 0) {
        // 更新现有动画
        existingAnimations[existingIndex] = animation;
      } else {
        // 添加新动画
        existingAnimations.push(animation);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingAnimations));
      console.log('User animation saved:', animation.name);
    } catch (error) {
      console.error('Failed to save user animation:', error);
    }
  }

  // 批量保存用户动画
  saveUserAnimations(animations: Animation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(animations));
      console.log('User animations saved:', animations.length);
    } catch (error) {
      console.error('Failed to save user animations:', error);
    }
  }

  // 删除用户动画
  removeUserAnimation(animationId: string): void {
    try {
      const existingAnimations = this.getUserAnimations();
      const filteredAnimations = existingAnimations.filter(a => a.id !== animationId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredAnimations));
      console.log('User animation removed:', animationId);
    } catch (error) {
      console.error('Failed to remove user animation:', error);
    }
  }

  // 清除所有用户动画
  clearUserAnimations(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('All user animations cleared');
    } catch (error) {
      console.error('Failed to clear user animations:', error);
    }
  }

  // 检查动画是否为用户上传的
  isUserAnimation(animationId: string): boolean {
    const userAnimations = this.getUserAnimations();
    return userAnimations.some(a => a.id === animationId);
  }

  // 获取动画统计信息
  getAnimationStats() {
    const userAnimations = this.getUserAnimations();
    return {
      totalUserAnimations: userAnimations.length,
      totalSize: userAnimations.reduce((sum, anim) => sum + (anim.size || 0), 0),
      categories: [...new Set(userAnimations.map(a => a.category || 'custom'))]
    };
  }
}

// 创建全局实例
export const animationStorage = new AnimationStorage(); 