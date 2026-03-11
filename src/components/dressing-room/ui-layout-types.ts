import { TTS_VOICES } from '@/config/tts-voices';

/** 单次直播回忆：供 agent 下次直播参考 */
export type StreamMemory = {
  date: string; // YYYY-MM-DD
  topic: string;
  summary?: string;
  participantsRemembered?: string[]; // 被记住的观众/互动者
};

export type StreamRoomPanel = 'character' | 'live' | 'sound' | 'scene' | 'calendar' | 'mocap';

export const ECHUU_CONFIG_KEY = 'echuu_config';
export const ECHUU_LIVE_SETTINGS_KEY = 'echuu_live_settings';
export const ECHUU_SOUND_SETTINGS_KEY = 'echuu_sound_settings';
export const ECHUU_SCENE_SETTINGS_KEY = 'echuu_scene_settings';
export const ECHUU_CALENDAR_SETTINGS_KEY = 'echuu_calendar_settings';

/** 支持的直播推流平台 */
export const LIVE_PLATFORMS: { id: 'twitch' | 'youtube'; labelZh: string; labelEn: string }[] = [
  { id: 'twitch', labelZh: 'Twitch', labelEn: 'Twitch' },
  { id: 'youtube', labelZh: 'YouTube', labelEn: 'YouTube' },
];

// BGM 预设：4 首转为 MP3 后命名为 xxx-Cynthia-xmyri.mp3，放在 public/sounds/bgm/
export const BGM_PRESETS: { id: string; url: string; nameZh: string; nameEn: string }[] = [
  { id: 'cold-background', url: '/sounds/bgm/cold-background-Cynthia-xmyri.mp3', nameZh: 'Cold Background', nameEn: 'Cold Background' },
  { id: 'deep-sleep-wip', url: '/sounds/bgm/deep-sleep-wip-Cynthia-xmyri.mp3', nameZh: 'Deep Sleep WIP', nameEn: 'Deep Sleep WIP' },
  { id: 'reboot-background-wip', url: '/sounds/bgm/reboot-background-wip-Cynthia-xmyri.mp3', nameZh: 'Reboot Background WIP', nameEn: 'Reboot Background WIP' },
  { id: 'absent-wip', url: '/sounds/bgm/absent-wip-Cynthia-xmyri.mp3', nameZh: 'Absent WIP', nameEn: 'Absent WIP' },
];
