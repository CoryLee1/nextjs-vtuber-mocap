/**
 * VTuber 动画配置：idle / speaking 两组，全部来自 S3。
 * 前端统一走 /api/s3/read-object，服务端签名 GET，避免公有读桶依赖。
 * 规则：文件名（小写）包含 "talking" 或 "telling" → speaking；其余 → idle。
 */
import { getS3ObjectReadUrlByKey } from '@/lib/s3-read-url';

/** S3 animations/ 下的所有 .fbx（与桶内一致） */
const ALL_ANIMATION_FILES: string[] = [
  'Bashful.fbx',
  'Breakdance 1990.fbx',
  'Breakdance Uprock Var 2.fbx',
  'Capoeira.fbx',
  'Disappointed.fbx',
  'Idle.fbx',
  'Listening To Music.fbx',
  'Mma Kick.fbx',
  'Sad Idle.fbx',
  'Sitting Laughing.fbx',
  'Sitting Talking.fbx',
  'Talking.fbx',
  'Taunt.fbx',
  'Telling A Secret.fbx',
  'Twist Dance.fbx',
];

/** 判断是否为「说话」类动画（按文件名关键词） */
function isTalkingAnimation(filename: string): boolean {
  const lower = filename.toLowerCase();
  return /talking|telling|speak/.test(lower);
}

export interface AnimationItem {
  id: string;
  name: string;
  url: string;
}

function toItem(filename: string, index: number, prefix: string): AnimationItem {
  const name = filename.replace(/\.fbx$/i, '');
  return {
    id: `${prefix}_${index + 1}`,
    name,
    url: getS3ObjectReadUrlByKey(`animations/${filename}`),
  };
}

/** 按规则自动分为 idle / speaking 两组 */
function buildConfig(): { idle: AnimationItem[]; speaking: AnimationItem[] } {
  const idle: AnimationItem[] = [];
  const speaking: AnimationItem[] = [];

  ALL_ANIMATION_FILES.forEach((filename) => {
    if (isTalkingAnimation(filename)) {
      speaking.push(toItem(filename, speaking.length, 'speaking'));
    } else {
      idle.push(toItem(filename, idle.length, 'idle'));
    }
  });

  return { idle, speaking };
}

const _config = buildConfig();

/** 待机动画列表（idle 组，全量） */
export const IDLE_ANIMATIONS: AnimationItem[] = _config.idle;

/** 状态机 idle 随机轮播只用这 4 个 */
const IDLE_ROTATION_FILENAMES = [
  'Idle.fbx',
  'Disappointed.fbx',
  'Bashful.fbx',
  'Listening To Music.fbx',
];
export const IDLE_ROTATION_ANIMATIONS: AnimationItem[] = IDLE_ROTATION_FILENAMES
  .map((filename) => {
    const name = filename.replace(/\.fbx$/i, '');
    return {
      id: `idle_rot_${name.replace(/\s+/g, '_')}`,
      name,
      url: getS3ObjectReadUrlByKey(`animations/${filename}`),
    };
  });

/** 说话动画列表（talking 组） */
export const SPEAKING_ANIMATIONS: AnimationItem[] = _config.speaking;

/** 完整配置，供状态机等使用 */
export const VTUBER_ANIMATION_CONFIG = {
  idle: IDLE_ANIMATIONS,
  speaking: SPEAKING_ANIMATIONS,
} as const;

/** 默认使用的 idle 动画 URL（列表第一个，S3） */
export const DEFAULT_IDLE_URL = IDLE_ANIMATIONS[0]?.url ?? getS3ObjectReadUrlByKey('animations/Idle.fbx');

/** 默认使用的 speaking 动画 URL（列表第一个，S3） */
export const DEFAULT_SPEAKING_URL = SPEAKING_ANIMATIONS[0]?.url ?? getS3ObjectReadUrlByKey('animations/Talking.fbx');

/** 状态机用到的动画 URL 列表，用于预加载（idle 轮播 4 个 + speaking 1 个） */
export const PRELOAD_ANIMATION_URLS: string[] = [
  ...IDLE_ROTATION_ANIMATIONS.map((a) => a.url),
  DEFAULT_SPEAKING_URL,
].filter((url, i, arr) => arr.indexOf(url) === i);

/** 引导页/占位用默认 3D 模型（透明背景预览、播 idle） */
export const DEFAULT_PREVIEW_MODEL_URL = getS3ObjectReadUrlByKey('AvatarSample_A.vrm');
