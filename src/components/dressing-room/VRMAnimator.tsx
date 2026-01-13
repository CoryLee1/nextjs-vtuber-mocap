import { useEffect, useRef, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AnimationMixer, LoopRepeat, LoopOnce } from 'three';
import { Animation } from '@/types';

// 动画管理器
export class VRMAnimationManager {
  private mixer: AnimationMixer | null = null;
  private currentAction: any = null;
  private animations: Map<string, any> = new Map();
  private isPlaying: boolean = false;
  private currentAnimation: string = '';
  private loop: boolean = true;

  constructor(vrm: any) {
    if (vrm && vrm.scene) {
      this.mixer = new AnimationMixer(vrm.scene);
    }
  }

  // 添加动画
  addAnimation(name: string, animation: any) {
    if (this.mixer && animation) {
      const action = this.mixer.clipAction(animation);
      this.animations.set(name, action);
    }
  }

  // 播放动画
  playAnimation(name: string, loop: boolean = true) {
    if (!this.mixer || !this.animations.has(name)) {
      console.warn(`动画 "${name}" 不存在`);
      return;
    }

    // 停止当前动画
    if (this.currentAction) {
      this.currentAction.stop();
    }

    // 播放新动画
    this.currentAction = this.animations.get(name);
    this.currentAction.setLoop(loop ? LoopRepeat : LoopOnce, loop ? Infinity : 1);
    this.currentAction.play();

    this.isPlaying = true;
    this.currentAnimation = name;
    this.loop = loop;
  }

  // 停止动画
  stopAnimation() {
    if (this.currentAction) {
      this.currentAction.stop();
      this.isPlaying = false;
    }
  }

  // 暂停动画
  pauseAnimation() {
    if (this.currentAction) {
      this.currentAction.paused = true;
      this.isPlaying = false;
    }
  }

  // 恢复动画
  resumeAnimation() {
    if (this.currentAction) {
      this.currentAction.paused = false;
      this.isPlaying = true;
    }
  }

  // 更新动画
  update(deltaTime: number) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
  }

  // 获取当前状态
  getState() {
    return {
      isPlaying: this.isPlaying,
      currentAnimation: this.currentAnimation,
      loop: this.loop,
    };
  }

  // 清理资源
  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.mixer.getRoot());
    }
    this.animations.clear();
  }
}

// VRM 动画器组件
interface VRMAnimatorProps {
  vrm: any;
  animationUrl?: string;
  onAnimationManagerRef?: (manager: VRMAnimationManager) => void;
}

// PERF: VRM 动画器组件（在 useFrame 中运行）
const VRMAnimatorComponent: React.FC<VRMAnimatorProps> = ({
  vrm,
  animationUrl,
  onAnimationManagerRef
}) => {
  const animationManagerRef = useRef<VRMAnimationManager | null>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);

  // 初始化动画管理器
  useEffect(() => {
    if (vrm && !animationManagerRef.current) {
      animationManagerRef.current = new VRMAnimationManager(vrm);
      onAnimationManagerRef?.(animationManagerRef.current);
    }

    return () => {
      if (animationManagerRef.current) {
        animationManagerRef.current.dispose();
      }
    };
  }, [vrm, onAnimationManagerRef]);

  // 加载动画
  useEffect(() => {
    if (animationUrl && animationManagerRef.current) {
      // 这里可以添加动画加载逻辑
      // 例如从 FBX 文件加载动画
      console.log('加载动画:', animationUrl);
    }
  }, [animationUrl]);

  // 动画更新
  useFrame((state, delta) => {
    if (animationManagerRef.current) {
      animationManagerRef.current.update(delta);
    }
  });

  return null; // 这是一个逻辑组件，不渲染任何内容
};

// 动画控制 Hook
export const useVRMAnimation = (vrm: any) => {
  const [animationState, setAnimationState] = useState({
    isPlaying: false,
    currentAnimation: '',
    loop: true,
  });

  const animationManagerRef = useRef<VRMAnimationManager | null>(null);

  // 初始化动画管理器
  useEffect(() => {
    if (vrm && !animationManagerRef.current) {
      animationManagerRef.current = new VRMAnimationManager(vrm);
    }

    return () => {
      if (animationManagerRef.current) {
        animationManagerRef.current.dispose();
      }
    };
  }, [vrm]);

  // 播放动画
  const playAnimation = useCallback((name: string, loop: boolean = true) => {
    if (animationManagerRef.current) {
      animationManagerRef.current.playAnimation(name, loop);
      setAnimationState(prev => ({
        ...prev,
        isPlaying: true,
        currentAnimation: name,
        loop,
      }));
    }
  }, []);

  // 停止动画
  const stopAnimation = useCallback(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.stopAnimation();
      setAnimationState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    }
  }, []);

  // 暂停动画
  const pauseAnimation = useCallback(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.pauseAnimation();
      setAnimationState(prev => ({
        ...prev,
        isPlaying: false,
      }));
    }
  }, []);

  // 恢复动画
  const resumeAnimation = useCallback(() => {
    if (animationManagerRef.current) {
      animationManagerRef.current.resumeAnimation();
      setAnimationState(prev => ({
        ...prev,
        isPlaying: true,
      }));
    }
  }, []);

  return {
    animationState,
    playAnimation,
    stopAnimation,
    pauseAnimation,
    resumeAnimation,
    animationManager: animationManagerRef.current,
  };
}; 