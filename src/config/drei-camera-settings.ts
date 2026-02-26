/**
 * Drei 相机与 CameraShake 统一配置
 * 参考：R3F/drei 官方示例，OrbitControls makeDefault 后 CameraShake 等可基于 state.controls 协同
 * 使用：const controls = useThree(state => state.controls)
 */

/** OrbitControls 相关默认（与 store cameraSettings 配合，这里只放 drei 直接用的） */
export const ORBIT_CONTROLS_DEFAULTS = {
  enableDamping: true,
  dampingFactor: 0.07,   // was 0.01 (5× below default → vertical drag felt stuck); 0.07 = snappy + smooth
  minDistance: 0.5,
  maxDistance: 10,
  enablePan: true,       // allow right-drag/two-finger to pan vertically
  minPolarAngle: Math.PI / 8,       // ~22° from top
  maxPolarAngle: (Math.PI * 7) / 8, // ~157° from top (slightly below feet)
  autoRotate: false,
  autoRotateSpeed: 0.3,
} as const;

/**
 * CameraShake 参数（与 drei 示例对齐，可按需调小做呼吸感）
 * 示例值：maxYaw 0.1, maxPitch 0.05, maxRoll 0.05, intensity 1, decayRate 0.65
 */
export const CAMERA_SHAKE_DEFAULTS = {
  maxYaw: 0.1,
  maxPitch: 0.05,
  maxRoll: 0.05,
  yawFrequency: 0.05,
  pitchFrequency: 0.2,
  rollFrequency: 0.2,
  intensity: 1,
  decayRate: 0.65,
} as const;

/** 较轻柔的呼吸感（当前默认） */
export const CAMERA_SHAKE_SUBTLE = {
  maxYaw: 0.06,
  maxPitch: 0.03,
  maxRoll: 0.03,
  yawFrequency: 0.05,
  pitchFrequency: 0.2,
  rollFrequency: 0.2,
  intensity: 0.6,
  decayRate: 0.9,
} as const;
