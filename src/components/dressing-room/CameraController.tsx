'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Spherical, MathUtils, Quaternion, Euler } from 'three';
import { useSceneStore } from '@/hooks/use-scene-store';

/**
 * 3A 游戏级相机控制器
 * 
 * 特性：
 * - 球面坐标系控制（更自然的旋转）
 * - 多层阻尼系统（位置、旋转、缩放分离）
 * - 惯性滑动（松开鼠标后继续滑动）
 * - 智能碰撞检测预留
 * - 平滑的缩放曲线
 * - 双击重置动画
 * - 触摸屏支持
 */

// ==================== 配置 ====================

interface CameraConfig {
  // 目标点
  target: Vector3;
  
  // 距离
  distance: number;
  minDistance: number;
  maxDistance: number;
  
  // 角度（弧度）
  phi: number;      // 垂直角度 (0 = 顶部, PI = 底部)
  theta: number;    // 水平角度
  minPhi: number;
  maxPhi: number;
  
  // 阻尼系数 (0-1, 越小越平滑)
  positionDamping: number;
  rotationDamping: number;
  zoomDamping: number;
  
  // 灵敏度
  rotateSensitivity: number;
  zoomSensitivity: number;
  panSensitivity: number;
  
  // 惯性
  enableInertia: boolean;
  inertiaDecay: number;  // 惯性衰减 (0-1)
  
  // 自动旋转
  enableAutoRotate: boolean;
  autoRotateSpeed: number;
  autoRotateDelay: number;  // 停止操作后多久开始自动旋转 (ms)
}

const DEFAULT_CONFIG: CameraConfig = {
  target: new Vector3(0, 0.9, 0),  // VRM 模型胸部位置
  
  distance: 2.5,
  minDistance: 0.5,  // ✅ 最近距离（从 1.0 改为 0.5，让摄像机可以更接近角色）
  maxDistance: 10,
  
  phi: Math.PI / 2.5,      // 略微俯视
  theta: 0,
  minPhi: 0.1,             // 防止看到头顶
  maxPhi: Math.PI * 0.85,  // 防止看到脚底
  
  positionDamping: 0.08,
  rotationDamping: 0.12,
  zoomDamping: 0.4,  // ✅ 增加缩放阻尼，让变化更明显（值越大，响应越快）
  
  rotateSensitivity: 0.003,
  zoomSensitivity: 0.1,  // ✅ 缩放灵敏度（乘法缩放，0.05-0.2 范围，值越大缩放越快）
  panSensitivity: 0.002,
  
  enableInertia: true,
  inertiaDecay: 0.42,
  
  enableAutoRotate: false,
  autoRotateSpeed: 0.3,
  autoRotateDelay: 3000,
};

// ==================== 工具函数 ====================

// 平滑插值（比 lerp 更平滑的缓动）
const smoothDamp = (current: number, target: number, velocity: { value: number }, smoothTime: number, deltaTime: number): number => {
  const omega = 2 / smoothTime;
  const x = omega * deltaTime;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - target;
  const temp = (velocity.value + omega * change) * deltaTime;
  velocity.value = (velocity.value - omega * temp) * exp;
  return target + (change + temp) * exp;
};

// 平滑缩放曲线（对数缩放，近处慢远处快）
const zoomCurve = (distance: number, delta: number, min: number, max: number): number => {
  // ✅ 安全检查
  if (!Number.isFinite(distance) || distance <= 0) {
    return min;
  }
  if (!Number.isFinite(delta)) {
    return distance;
  }
  
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  const logCurrent = Math.log(distance);
  const logNew = MathUtils.clamp(logCurrent + delta, logMin, logMax);
  const result = Math.exp(logNew);
  
  // ✅ 验证结果
  if (!Number.isFinite(result) || result <= 0) {
    return distance; // 如果计算失败，返回原值
  }
  
  return result;
};

// ==================== 主组件 ====================

interface GameCameraControllerProps {
  // 跟随目标（可选，用于跟随 VRM）
  followTarget?: React.RefObject<any>;
  
  // 配置覆盖
  config?: Partial<CameraConfig>;
  
  // 事件回调
  onCameraChange?: (position: Vector3, target: Vector3) => void;
  
  // 是否启用
  enabled?: boolean;
  
  // 显示控制提示
  showHint?: boolean;
}

export const GameCameraController: React.FC<GameCameraControllerProps> = ({
  followTarget,
  config: configOverride = {},
  onCameraChange,
  enabled = true,
  showHint = true,
}) => {
  const { camera, gl } = useThree();
  
  // ✅ 从 store 获取 VRM 模型（备用方式，更可靠）
  const vrmModel = useSceneStore((state) => state.vrmModel);
  
  // 保存 configOverride 的引用，用于 handleWheel
  const configOverrideRef = useRef(configOverride);
  useEffect(() => {
    configOverrideRef.current = configOverride;
  }, [configOverride]);
  
  // 合并配置
  const config = useRef<CameraConfig>({
    ...DEFAULT_CONFIG,
    ...configOverride,
    target: configOverride.target || DEFAULT_CONFIG.target.clone(),
    // ✅ 确保 zoomSensitivity 使用最新的值
    zoomSensitivity: configOverride.zoomSensitivity ?? DEFAULT_CONFIG.zoomSensitivity,
  });
  
  // 当前状态
  const state = useRef({
    // 球面坐标
    spherical: new Spherical(
      config.current.distance,
      config.current.phi,
      config.current.theta
    ),
    
    // 目标球面坐标（用于插值）
    targetSpherical: new Spherical(
      config.current.distance,
      config.current.phi,
      config.current.theta
    ),
    
    // 目标点
    target: config.current.target.clone(),
    targetTarget: config.current.target.clone(),
    
    // 惯性速度
    velocity: { phi: 0, theta: 0, distance: 0 },
    
    // 交互状态
    isDragging: false,
    isPanning: false,
    isZooming: false,
    lastInteractionTime: 0,
    
    // 鼠标位置
    lastMouseX: 0,
    lastMouseY: 0,
    
    // 触摸状态
    touchStartDistance: 0,
    touchStartCenter: { x: 0, y: 0 },
    
    // 速度追踪（用于惯性）
    velocityTracker: { x: 0, y: 0, samples: [] as { x: number; y: number; time: number }[] },
    
    // 缩放速度追踪（用于滚轮惯性）
    zoomVelocityTracker: { samples: [] as { delta: number; time: number }[] },
  });
  
  // 提示可见性
  const [hintVisible, setHintVisible] = useState(showHint);
  
  // ==================== 事件处理 ====================
  
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    
    state.current.lastMouseX = e.clientX;
    state.current.lastMouseY = e.clientY;
    state.current.lastInteractionTime = Date.now();
    state.current.velocityTracker.samples = [];
    
    if (e.button === 0) {
      // 左键：旋转
      state.current.isDragging = true;
    } else if (e.button === 2) {
      // 右键：平移
      state.current.isPanning = true;
    }
    
    // 隐藏提示
    setHintVisible(false);
  }, [enabled]);
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    if (!state.current.isDragging && !state.current.isPanning) return;
    
    const deltaX = e.clientX - state.current.lastMouseX;
    const deltaY = e.clientY - state.current.lastMouseY;
    
    // 记录速度样本（用于惯性）
    const now = Date.now();
    state.current.velocityTracker.samples.push({ x: deltaX, y: deltaY, time: now });
    // 只保留最近 5 个样本
    if (state.current.velocityTracker.samples.length > 5) {
      state.current.velocityTracker.samples.shift();
    }
    
    if (state.current.isDragging) {
      // 旋转
      const sensitivity = config.current.rotateSensitivity;
      state.current.targetSpherical.theta -= deltaX * sensitivity;
      state.current.targetSpherical.phi += deltaY * sensitivity;
      
      // 限制垂直角度
      state.current.targetSpherical.phi = MathUtils.clamp(
        state.current.targetSpherical.phi,
        config.current.minPhi,
        config.current.maxPhi
      );
    }
    
    if (state.current.isPanning) {
      // 平移（在相机平面上）
      const sensitivity = config.current.panSensitivity * state.current.spherical.radius;
      
      // 计算相机的右向量和上向量
      const right = new Vector3();
      const up = new Vector3(0, 1, 0);
      camera.getWorldDirection(right);
      right.cross(up).normalize();
      
      // 应用平移
      const panOffset = new Vector3();
      panOffset.addScaledVector(right, -deltaX * sensitivity);
      panOffset.addScaledVector(up, deltaY * sensitivity);
      
      state.current.targetTarget.add(panOffset);
    }
    
    state.current.lastMouseX = e.clientX;
    state.current.lastMouseY = e.clientY;
    state.current.lastInteractionTime = Date.now();
  }, [enabled, camera]);
  
  const handleMouseUp = useCallback((e: MouseEvent) => {
    // 计算惯性速度
    if (config.current.enableInertia && state.current.isDragging) {
      const { samples } = state.current.velocityTracker;
      if (samples.length >= 2) {
        const lastSample = samples[samples.length - 1];
      const firstSample = samples[0];
      const totalTime = lastSample.time - firstSample.time;
        if (totalTime > 0 && totalTime < 100) {
          const avgX = samples.reduce((sum, s) => sum + s.x, 0) / samples.length;
          const avgY = samples.reduce((sum, s) => sum + s.y, 0) / samples.length;
          state.current.velocity.theta = -avgX * config.current.rotateSensitivity * 0.5;
          state.current.velocity.phi = avgY * config.current.rotateSensitivity * 0.5;
        }
      }
    }
    
    state.current.isDragging = false;
    state.current.isPanning = false;
    state.current.lastInteractionTime = Date.now();
  }, []);
  
  const handleWheel = useCallback((e: WheelEvent) => {
    // ✅ 第1步：立即记录事件（即使 disabled 也记录，用于诊断）
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Wheel event received:', {
        enabled,
        deltaY: e.deltaY,
        target: e.target,
        currentTarget: e.currentTarget,
      });
    }
    
    if (!enabled) return;
    
    // ✅ 关键修复：preventDefault 必须在最前面，且事件监听器需要 { passive: false }
    e.preventDefault();
    e.stopPropagation();
    
    // ✅ 修复 0 值问题：不能用 ??，因为 0 不是 null/undefined
    const raw = configOverrideRef.current.zoomSensitivity;
    const zoomSens = (raw == null || raw <= 0) ? DEFAULT_CONFIG.zoomSensitivity : raw;
    const currentRadius = state.current.targetSpherical.radius;
    
    // ✅ 安全检查：确保 radius 合法
    if (!Number.isFinite(currentRadius) || currentRadius <= 0) {
      state.current.targetSpherical.radius = config.current.distance;
      return;
    }
    
    // ✅ 简化缩放逻辑：使用乘法缩放（更直观、更可靠）
    // 向下滚动（deltaY > 0）：拉远（增加距离）
    // 向上滚动（deltaY < 0）：拉近（减小距离）
    // zoomSens 控制缩放速度（例如 0.1 表示每次滚轮滚动改变 10%）
    const zoomFactor = e.deltaY > 0 
      ? (1 + zoomSens)  // 向下滚动：拉远（增加距离）
      : (1 - zoomSens); // 向上滚动：拉近（减小距离）
    
    // ✅ 计算缩放变化量（用于速度追踪）
    const zoomDelta = currentRadius * (zoomFactor - 1); // 正数=拉远，负数=拉近
    const now = Date.now();
    
    // ✅ 确保 zoomVelocityTracker 存在
    if (!state.current.zoomVelocityTracker) {
      state.current.zoomVelocityTracker = { samples: [] };
    }
    
    // ✅ 记录缩放速度样本（用于惯性衰减）
    state.current.zoomVelocityTracker.samples.push({ delta: zoomDelta, time: now });
    // 只保留最近 200ms 内的样本
    state.current.zoomVelocityTracker.samples = state.current.zoomVelocityTracker.samples.filter(
      s => now - s.time < 200
    );
    
    // ✅ 计算新距离
    let newRadius = currentRadius * zoomFactor;
    
    // ✅ 确保 minDistance 和 maxDistance 是有效值（防止 undefined 导致 NaN）
    const minDist = Number.isFinite(config.current.minDistance) && config.current.minDistance > 0
      ? config.current.minDistance
      : DEFAULT_CONFIG.minDistance;
    const maxDist = Number.isFinite(config.current.maxDistance) && config.current.maxDistance > minDist
      ? config.current.maxDistance
      : DEFAULT_CONFIG.maxDistance;
    
    // ✅ 限制缩放范围（使用安全的值）
    newRadius = Math.max(minDist, Math.min(maxDist, newRadius));
    
    // ✅ 最终验证：确保 newRadius 是有效数字
    if (!Number.isFinite(newRadius) || newRadius <= 0) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Zoom calculation failed:', {
          currentRadius,
          zoomFactor,
          minDist,
          maxDist,
          rawNewRadius: currentRadius * zoomFactor,
        });
      }
      return; // 如果计算失败，直接返回，不更新
    }
    
    // ✅ 调试日志（开发环境）- 增强版（在验证之前记录，看看原始计算结果）
    if (process.env.NODE_ENV === 'development') {
      const change = Number.isFinite(newRadius) ? (newRadius - currentRadius) : NaN;
      const changePercent = Number.isFinite(change) ? ((change / currentRadius) * 100).toFixed(1) : 'invalid';
      const isClamped = Number.isFinite(newRadius) && (newRadius === minDist || newRadius === maxDist);
      console.log('🎯 Wheel Zoom:', {
        deltaY: e.deltaY,
        'zoomSens (raw)': raw,
        'zoomSens (final)': zoomSens,
        zoomFactor: zoomFactor.toFixed(3),
        currentRadius: currentRadius.toFixed(3),
        newRadius: Number.isFinite(newRadius) ? newRadius.toFixed(3) : newRadius,
        change: Number.isFinite(change) ? change.toFixed(3) : change,
        changePercent,
        isClamped,
        'minDistance (config)': config.current.minDistance,
        'maxDistance (config)': config.current.maxDistance,
        'minDist (safe)': minDist,
        'maxDist (safe)': maxDist,
        willUpdate: Number.isFinite(newRadius) && newRadius !== currentRadius,
        'isFinite(newRadius)': Number.isFinite(newRadius),
        'typeof newRadius': typeof newRadius,
      });
    }
    
    // ✅ 验证结果并更新（只要有变化就更新，不需要最小变化阈值）
    if (Number.isFinite(newRadius) && newRadius > 0 && newRadius !== currentRadius) {
      state.current.targetSpherical.radius = newRadius;
    } else if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Zoom skipped:', {
        current: currentRadius,
        new: newRadius,
        zoomSens,
        zoomFactor,
      });
    }
    
    state.current.lastInteractionTime = Date.now();
    setHintVisible(false);
  }, [enabled]);
  
  const handleDoubleClick = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    
    // 双击重置到默认视角
    state.current.targetSpherical.set(
      config.current.distance,
      config.current.phi,
      config.current.theta
    );
    state.current.targetTarget.copy(config.current.target);
    
    // 清除惯性
    state.current.velocity.theta = 0;
    state.current.velocity.phi = 0;
    state.current.velocity.distance = 0;
  }, [enabled]);
  
  // 触摸事件
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    e.preventDefault();
    setHintVisible(false);
    
    if (e.touches.length === 1) {
      // 单指：旋转
      state.current.isDragging = true;
      state.current.lastMouseX = e.touches[0].clientX;
      state.current.lastMouseY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      // 双指：缩放
      state.current.isZooming = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      state.current.touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
    
    state.current.lastInteractionTime = Date.now();
  }, [enabled]);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    
    if (state.current.isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - state.current.lastMouseX;
      const deltaY = e.touches[0].clientY - state.current.lastMouseY;
      
      const sensitivity = config.current.rotateSensitivity * 1.5; // 触摸需要更高灵敏度
      state.current.targetSpherical.theta -= deltaX * sensitivity;
      state.current.targetSpherical.phi += deltaY * sensitivity;
      
      state.current.targetSpherical.phi = MathUtils.clamp(
        state.current.targetSpherical.phi,
        config.current.minPhi,
        config.current.maxPhi
      );
      
      state.current.lastMouseX = e.touches[0].clientX;
      state.current.lastMouseY = e.touches[0].clientY;
    }
    
    if (state.current.isZooming && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = (state.current.touchStartDistance - distance) * 0.01;
      
      state.current.targetSpherical.radius = zoomCurve(
        state.current.targetSpherical.radius,
        delta,
        config.current.minDistance,
        config.current.maxDistance
      );
      
      state.current.touchStartDistance = distance;
    }
    
    state.current.lastInteractionTime = Date.now();
  }, [enabled]);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    state.current.isDragging = false;
    state.current.isZooming = false;
  }, []);
  
  // 阻止右键菜单
  const handleContextMenu = useCallback((e: Event) => {
    e.preventDefault();
  }, []);
  
  // ==================== 事件绑定 ====================
  
  // 🧨 第四修复：useEffect 依赖修复（gl 是 stable ref，而不是 gl.domElement）
  useEffect(() => {
    const { domElement } = gl;
    
    // ✅ 调试：记录 canvas 元素信息
    if (process.env.NODE_ENV === 'development') {
      console.log('🎨 CameraController: Binding events to canvas', {
        canvas: domElement,
        width: domElement.width,
        height: domElement.height,
        pointerEvents: window.getComputedStyle(domElement).pointerEvents,
        parentZIndex: window.getComputedStyle(domElement.parentElement!).zIndex,
      });
    }
    
    // ✅ 确保 canvas 能接收事件
    domElement.style.pointerEvents = 'auto';
    domElement.style.touchAction = 'none';
    
    domElement.addEventListener('mousedown', handleMouseDown);
    domElement.addEventListener('mousemove', handleMouseMove);
    domElement.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('mouseleave', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('dblclick', handleDoubleClick);
    domElement.addEventListener('contextmenu', handleContextMenu);
    
    // 触摸事件
    domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    domElement.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      domElement.removeEventListener('mousedown', handleMouseDown);
      domElement.removeEventListener('mousemove', handleMouseMove);
      domElement.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('mouseleave', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('dblclick', handleDoubleClick);
      domElement.removeEventListener('contextmenu', handleContextMenu);
      
      domElement.removeEventListener('touchstart', handleTouchStart);
      domElement.removeEventListener('touchmove', handleTouchMove);
      domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    gl, // ✅ 使用 gl 而不是 gl.domElement（gl 是 stable ref）
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleDoubleClick,
    handleContextMenu,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);
  
  // 提示自动隐藏
  useEffect(() => {
    if (showHint && hintVisible) {
      const timer = setTimeout(() => setHintVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint, hintVisible]);
  
  // ==================== 动画循环 ====================
  
  useFrame((_, delta) => {
    if (!enabled) return;
    
    const s = state.current;
    const cfg = config.current;
    
    // 🧨 第一致命修复：检查 Spherical 是否变成 NaN（必须在最前面）
    if (
      !Number.isFinite(s.targetSpherical.radius) ||
      !Number.isFinite(s.targetSpherical.phi) ||
      !Number.isFinite(s.targetSpherical.theta) ||
      s.targetSpherical.radius <= 0
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Camera spherical corrupted, reset', {
          radius: s.targetSpherical.radius,
          phi: s.targetSpherical.phi,
          theta: s.targetSpherical.theta,
        });
      }
      s.targetSpherical.set(
        cfg.distance,
        cfg.phi,
        cfg.theta
      );
    }
    
    // 限制 delta 避免大跳跃
    const dt = Math.min(delta, 0.1);
    
    // 应用惯性
    if (cfg.enableInertia && !s.isDragging) {
      // ✅ 安全检查：确保 velocity 合法
      if (Number.isFinite(s.velocity.theta)) {
        s.targetSpherical.theta += s.velocity.theta;
      }
      if (Number.isFinite(s.velocity.phi)) {
        s.targetSpherical.phi += s.velocity.phi;
      }
      
      // 限制垂直角度（必须在更新后立即 clamp）
      s.targetSpherical.phi = MathUtils.clamp(
        Number.isFinite(s.targetSpherical.phi) ? s.targetSpherical.phi : cfg.phi,
        cfg.minPhi,
        cfg.maxPhi
      );
      
      // 衰减惯性
      if (Number.isFinite(s.velocity.theta)) {
        s.velocity.theta *= cfg.inertiaDecay;
        // 速度过小时停止
        if (Math.abs(s.velocity.theta) < 0.0001) s.velocity.theta = 0;
      } else {
        s.velocity.theta = 0;
      }
      
      if (Number.isFinite(s.velocity.phi)) {
        s.velocity.phi *= cfg.inertiaDecay;
        // 速度过小时停止
        if (Math.abs(s.velocity.phi) < 0.0001) s.velocity.phi = 0;
      } else {
        s.velocity.phi = 0;
      }
    }
    
    // ✅ 应用缩放惯性（滚轮停下后继续缩放并逐渐停止）
    const timeSinceLastZoom = Date.now() - s.lastInteractionTime;
    if (cfg.enableInertia && timeSinceLastZoom > 50 && !s.isZooming) {
      // ✅ 确保 zoomVelocityTracker 存在
      if (!s.zoomVelocityTracker) {
        s.zoomVelocityTracker = { samples: [] };
      }
      
      // 计算平均缩放速度（基于最近 200ms 的样本）
      const { samples } = s.zoomVelocityTracker;
      if (samples.length >= 2) {
        const timeSpan = samples[samples.length - 1].time - samples[0].time;
        if (timeSpan > 0 && timeSpan < 300) {
          // 计算总变化量（带方向）
          const totalDelta = samples.reduce((sum, s) => sum + s.delta, 0);
          // 计算平均速度（单位：距离/秒）
          const avgVelocity = totalDelta / (timeSpan / 1000);
          
          // 应用速度到目标距离（每帧累加）
          const velocityContribution = avgVelocity * dt;
          let newTargetRadius = s.targetSpherical.radius + velocityContribution;
          
          // 限制范围
          const minDist = Number.isFinite(cfg.minDistance) && cfg.minDistance > 0
            ? cfg.minDistance
            : DEFAULT_CONFIG.minDistance;
          const maxDist = Number.isFinite(cfg.maxDistance) && cfg.maxDistance > minDist
            ? cfg.maxDistance
            : DEFAULT_CONFIG.maxDistance;
          
          newTargetRadius = Math.max(minDist, Math.min(maxDist, newTargetRadius));
          
          if (Number.isFinite(newTargetRadius) && newTargetRadius > 0) {
            s.targetSpherical.radius = newTargetRadius;
          }
          
          // 衰减速度（让惯性逐渐消失）
          s.velocity.distance = avgVelocity * cfg.inertiaDecay;
          
          // 如果速度很小，清除样本（停止惯性）
          if (Math.abs(avgVelocity) < 0.01) {
            s.zoomVelocityTracker.samples = [];
            s.velocity.distance = 0;
          }
        }
      } else {
        // 如果没有样本，直接衰减当前速度
        if (Number.isFinite(s.velocity.distance) && Math.abs(s.velocity.distance) > 0.001) {
          let newTargetRadius = s.targetSpherical.radius + s.velocity.distance * dt;
          
          const minDist = Number.isFinite(cfg.minDistance) && cfg.minDistance > 0
            ? cfg.minDistance
            : DEFAULT_CONFIG.minDistance;
          const maxDist = Number.isFinite(cfg.maxDistance) && cfg.maxDistance > minDist
            ? cfg.maxDistance
            : DEFAULT_CONFIG.maxDistance;
          
          newTargetRadius = Math.max(minDist, Math.min(maxDist, newTargetRadius));
          
          if (Number.isFinite(newTargetRadius) && newTargetRadius > 0) {
            s.targetSpherical.radius = newTargetRadius;
          }
          
          s.velocity.distance *= cfg.inertiaDecay;
          if (Math.abs(s.velocity.distance) < 0.001) {
            s.velocity.distance = 0;
          }
        }
      }
    } else {
      // 如果正在滚动，不应用惯性（但保留速度用于后续衰减）
      // s.velocity.distance 在 handleWheel 中会被更新
    }
    
    // 自动旋转
    if (cfg.enableAutoRotate && !s.isDragging && !s.isPanning) {
      const timeSinceInteraction = Date.now() - s.lastInteractionTime;
      if (timeSinceInteraction > cfg.autoRotateDelay) {
        s.targetSpherical.theta += cfg.autoRotateSpeed * dt;
      }
    }
    
    // 平滑插值球面坐标（确保所有值都是合法的）
    // ✅ 缩放使用更平滑的插值，配合惯性效果
    const currentRadius = Number.isFinite(s.spherical.radius) ? s.spherical.radius : cfg.distance;
    const targetRadius = Number.isFinite(s.targetSpherical.radius) ? s.targetSpherical.radius : cfg.distance;
    
    // 根据是否有惯性速度调整阻尼系数（有惯性时更平滑）
    const hasZoomInertia = Math.abs(s.velocity.distance) > 0.001;
    const effectiveZoomDamping = hasZoomInertia 
      ? Math.min(cfg.zoomDamping * 0.7, 0.4) // 有惯性时降低阻尼，让惯性更明显
      : cfg.zoomDamping;
    
    s.spherical.radius = MathUtils.lerp(currentRadius, targetRadius, effectiveZoomDamping);
    s.spherical.phi = MathUtils.lerp(
      Number.isFinite(s.spherical.phi) ? s.spherical.phi : cfg.phi,
      s.targetSpherical.phi,
      cfg.rotationDamping
    );
    s.spherical.theta = MathUtils.lerp(
      Number.isFinite(s.spherical.theta) ? s.spherical.theta : cfg.theta,
      s.targetSpherical.theta,
      cfg.rotationDamping
    );
    
    // ✅ 最终保险：在计算相机位置前再次验证
    s.spherical.radius = Math.max(0.001, s.spherical.radius); // 确保 > 0
    s.spherical.phi = MathUtils.clamp(
      Number.isFinite(s.spherical.phi) ? s.spherical.phi : cfg.phi,
      cfg.minPhi,
      cfg.maxPhi
    );
    
    // 平滑插值目标点
    s.target.lerp(s.targetTarget, cfg.positionDamping);
    
    // ✅ 相机跟随 VRM 头部骨骼（自动对准正脸）
    // 优先从 store 获取 VRM 模型（更可靠），否则从 followTarget ref 获取
    const targetVrm = vrmModel || followTarget?.current?.userData?.vrm;
    
    if (targetVrm) {
      try {
        const targetPos = new Vector3();
        let hasValidTarget = false;
        
        // ✅ 从 VRM 模型的头部骨骼获取位置（适用于所有 VRM 标准模型）
        if (targetVrm.humanoid) {
          let headBone = null;
          
          // 尝试获取 head bone（使用多种方式兼容不同的 VRM 版本）
          if (targetVrm.humanoid.humanBones?.['head']?.node) {
            headBone = targetVrm.humanoid.humanBones['head'].node;
          } else if (typeof targetVrm.humanoid.getNormalizedBoneNode === 'function') {
            headBone = targetVrm.humanoid.getNormalizedBoneNode('head');
          }
          
          if (headBone && typeof headBone.getWorldPosition === 'function') {
            // 获取头部骨骼的世界坐标
            headBone.getWorldPosition(targetPos);
            hasValidTarget = true;
            
            // 添加一个小的偏移，让相机对准眼睛位置（头部骨骼通常在头顶，下移一点到脸部）
            if (Number.isFinite(targetPos.y)) {
              targetPos.y -= 0.15; // 从头顶下移到脸部（大约15cm）
            }
          }
        }
        
        // ✅ 验证结果并更新目标点
        if (hasValidTarget && Number.isFinite(targetPos.x) && Number.isFinite(targetPos.y) && Number.isFinite(targetPos.z)) {
          s.targetTarget.copy(targetPos);
        }
      } catch (error) {
        // 静默处理错误，避免 ref 还没准备好时崩溃
        if (process.env.NODE_ENV === 'development') {
          console.warn('CameraController: Failed to get head bone position', error);
        }
      }
    } else if (followTarget?.current) {
      // ✅ 降级处理 - 如果无法获取 VRM 模型，使用组件的世界位置
      try {
        const targetPos = new Vector3();
        let hasValidTarget = false;
        
        if ('position' in followTarget.current && followTarget.current.position instanceof Vector3) {
          targetPos.copy(followTarget.current.position);
          // 添加一个估算的头部高度偏移（VRM 模型通常高度约 1.6-1.7m，头部在 1.5m 左右）
          targetPos.y += 1.5;
          hasValidTarget = true;
        } else if (typeof followTarget.current.getWorldPosition === 'function') {
          followTarget.current.getWorldPosition(targetPos);
          targetPos.y += 1.5; // 添加头部高度偏移
          hasValidTarget = true;
        }
        
        if (hasValidTarget && Number.isFinite(targetPos.x) && Number.isFinite(targetPos.y) && Number.isFinite(targetPos.z)) {
          s.targetTarget.copy(targetPos);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('CameraController: Failed to get fallback target position', error);
        }
      }
    }
    
    // 从球面坐标计算相机位置
    const position = new Vector3();
    position.setFromSpherical(s.spherical);
    position.add(s.target);
    
    // ✅ 最终验证相机位置
    if (
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y) ||
      !Number.isFinite(position.z)
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Camera position is NaN, resetting', {
          position,
          spherical: s.spherical,
          target: s.target,
        });
      }
      // 重置到安全位置
      position.set(0, 1.5, 3);
      s.target.set(0, 0.9, 0);
      s.spherical.set(cfg.distance, cfg.phi, cfg.theta);
    }
    
    // 应用到相机
    camera.position.copy(position);
    camera.lookAt(s.target);
    
    // 回调
    onCameraChange?.(position, s.target);
  });
  
  return null;
};

// ==================== 控制提示组件 ====================

interface CameraControlHintProps {
  visible?: boolean;
}

export const CameraControlHint: React.FC<CameraControlHintProps> = ({ visible = true }) => {
  const [show, setShow] = useState(visible);
    
    useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setShow(false), 5000);
            return () => clearTimeout(timer);
        }
  }, [visible]);
    
  if (!show) return null;
    
    return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
      <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <span className="text-blue-400">🖱️</span>
            <span>左键拖拽旋转</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-green-400">🔍</span>
                    <span>滚轮缩放</span>
                </div>
                <div className="flex items-center space-x-2">
            <span className="text-yellow-400">➡️</span>
            <span>右键平移</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-purple-400">🔄</span>
            <span>双击重置</span>
          </div>
                </div>
            </div>
        </div>
    );
};

// ==================== 兼容旧 API ====================

interface CameraControllerProps {
  vrmRef?: any;
  enableAutoTrack?: boolean;
  enableUserControl?: boolean;
  showHint?: boolean;
  useGameStyle?: boolean;
  cameraSettings?: any;
}

export const CameraController: React.FC<CameraControllerProps> = ({ 
  vrmRef,
  enableAutoTrack = true,
  enableUserControl = true,
  showHint = true,
  useGameStyle = true,
  cameraSettings = {},
}) => {
    return (
    <GameCameraController
      followTarget={enableAutoTrack ? vrmRef : undefined}
      enabled={enableUserControl}
      showHint={showHint}
      config={{
        minDistance: cameraSettings.minDistance,
        maxDistance: cameraSettings.maxDistance,
        enableAutoRotate: cameraSettings.enableAutoRotate,
        autoRotateSpeed: cameraSettings.autoRotateSpeed,
      }}
    />
  );
};
