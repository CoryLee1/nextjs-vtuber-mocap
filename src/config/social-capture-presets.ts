/**
 * 截屏/录屏输出预设：适配各社交平台推荐尺寸，便于宣传与分享
 * 参考：Instagram / TikTok / 小红书 / Twitter 等 2024 常用规格
 */

export interface SocialCapturePreset {
  id: string;
  /** 展示名称 */
  label: string;
  /** 英文/通用名 */
  labelEn: string;
  /** 输出宽度（像素） */
  width: number;
  /** 输出高度（像素） */
  height: number;
  /** 宽高比，用于裁剪时 cover 计算 */
  aspect: number;
  /** 平台提示，便于用户选择 */
  platforms: string[];
}

/** 竖屏 9:16，TikTok / Reels / 抖音 / 小红书竖屏 */
export const PRESET_9_16: SocialCapturePreset = {
  id: '9:16',
  label: '竖屏 9:16',
  labelEn: 'Vertical 9:16',
  width: 1080,
  height: 1920,
  aspect: 9 / 16,
  platforms: ['TikTok', 'Instagram Reels', '抖音', '小红书竖屏'],
};

/** 正方形 1:1，Instagram 动态 / 小红书正方形 */
export const PRESET_1_1: SocialCapturePreset = {
  id: '1:1',
  label: '正方形 1:1',
  labelEn: 'Square 1:1',
  width: 1080,
  height: 1080,
  aspect: 1,
  platforms: ['Instagram', '小红书'],
};

/** 横屏 16:9 */
export const PRESET_16_9: SocialCapturePreset = {
  id: '16:9',
  label: '横屏 16:9',
  labelEn: 'Landscape 16:9',
  width: 1920,
  height: 1080,
  aspect: 16 / 9,
  platforms: ['YouTube', 'B站', '横屏视频'],
};

/** 竖屏 3:4，小红书笔记常用 */
export const PRESET_3_4: SocialCapturePreset = {
  id: '3:4',
  label: '竖屏 3:4',
  labelEn: 'Vertical 3:4',
  width: 1080,
  height: 1440,
  aspect: 3 / 4,
  platforms: ['小红书'],
};

export const SOCIAL_CAPTURE_PRESETS: SocialCapturePreset[] = [
  PRESET_9_16,
  PRESET_1_1,
  PRESET_16_9,
  PRESET_3_4,
];

export const PRESET_BY_ID: Record<string, SocialCapturePreset> = Object.fromEntries(
  SOCIAL_CAPTURE_PRESETS.map((p) => [p.id, p])
);

/** 截图 JPEG 质量（0–1），用于控制文件大小，便于社交媒体上传 */
export const DEFAULT_JPEG_QUALITY = 0.88;
