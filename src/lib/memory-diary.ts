/**
 * Memory Diary System
 *
 * Converts raw MemorySnapshot data from the backend into
 * human-readable short diary entries. Includes audience impressions,
 * danmaku reactions, viewer bonding, and emotion peaks.
 *
 * Diary entries are persisted in localStorage for cross-session context.
 */

import type { MemorySnapshot } from '@/hooks/use-echuu-websocket';

export interface DiaryEntry {
  timestamp: string;
  icon: 'script' | 'heart' | 'gift' | 'emotion' | 'chat' | 'book' | 'star';
  text: string;
  category: 'viewer' | 'progress' | 'emotion' | 'milestone' | 'interaction';
}

const DIARY_HISTORY_KEY = 'echuu_diary_history';

/**
 * Convert a MemorySnapshot into human-readable diary entries.
 */
export function memoryToDiaryEntries(
  snapshot: MemorySnapshot | null,
  locale: 'zh' | 'en' | 'ja' = 'zh',
): DiaryEntry[] {
  if (!snapshot) return [];
  const entries: DiaryEntry[] = [];
  const now = new Date().toISOString();

  // 1. Script progress
  const progress = snapshot.script_progress;
  if (progress?.current_stage) {
    const completedCount = progress.completed_stages?.length || 0;
    entries.push({
      timestamp: now,
      icon: 'script',
      text:
        locale === 'en'
          ? `Entered the "${progress.current_stage}" phase, completed ${completedCount} sections`
          : locale === 'ja'
            ? `「${progress.current_stage}」フェーズに入りました。${completedCount}セクション完了`
            : `进入了「${progress.current_stage}」阶段，已经完成了 ${completedCount} 个部分`,
      category: 'progress',
    });
  }

  // 2. Viewer bonding & audience impressions
  const profiles = snapshot.user_profiles || {};
  const profileList = Object.values(profiles);

  for (const profile of profileList) {
    if ((profile.bonding_level ?? 0) >= 2) {
      const reactionNote =
        profile.reaction_style
          ? locale === 'en'
            ? `, seems like a "${profile.reaction_style}" type`
            : locale === 'ja'
              ? `、「${profile.reaction_style}」タイプみたい`
              : `，感觉是「${profile.reaction_style}」类型`
          : '';
      entries.push({
        timestamp: profile.last_seen || now,
        icon: 'heart',
        text:
          locale === 'en'
            ? `Getting closer with ${profile.username}, ${profile.interaction_count} interactions${reactionNote}`
            : locale === 'ja'
              ? `${profile.username}さんと仲良くなってきた、${profile.interaction_count}回やり取り${reactionNote}`
              : `和 ${profile.username} 越来越熟了，已经互动了 ${profile.interaction_count} 次${reactionNote}`,
        category: 'viewer',
      });
    }

    if ((profile.total_sc_amount ?? 0) > 0) {
      entries.push({
        timestamp: profile.last_seen || now,
        icon: 'gift',
        text:
          locale === 'en'
            ? `${profile.username} sent ¥${profile.total_sc_amount} in super chats!`
            : locale === 'ja'
              ? `${profile.username}さんから ¥${profile.total_sc_amount} のスパチャ！感動！`
              : `${profile.username} 打赏了 ¥${profile.total_sc_amount}，好感动！`,
        category: 'milestone',
      });
    }

    if (profile.special_moments && profile.special_moments.length > 0) {
      entries.push({
        timestamp: profile.last_seen || now,
        icon: 'star',
        text:
          locale === 'en'
            ? `Special moment with ${profile.username}: ${profile.special_moments[profile.special_moments.length - 1]}`
            : locale === 'ja'
              ? `${profile.username}さんとの特別な瞬間：${profile.special_moments[profile.special_moments.length - 1]}`
              : `和 ${profile.username} 的特别瞬间：${profile.special_moments[profile.special_moments.length - 1]}`,
        category: 'milestone',
      });
    }
  }

  // 3. Emotion track
  const emotionTrack = (snapshot.emotion_track || []) as Array<{
    level?: number;
    trigger?: string;
  }>;
  for (const emo of emotionTrack) {
    const levelNames: Record<string, Record<number, string>> = {
      zh: { 1: '有点感动', 2: '很感动', 3: '破防了' },
      en: { 1: 'A little moved', 2: 'Really moved', 3: 'Totally overwhelmed' },
      ja: { 1: 'ちょっと感動', 2: 'すごく感動', 3: '泣いちゃった' },
    };
    const levelName = levelNames[locale]?.[emo.level ?? 0] || '';
    if (levelName) {
      const trigger =
        emo.trigger ||
        (locale === 'en' ? 'a special moment' : locale === 'ja' ? 'あの瞬間' : '某个瞬间');
      entries.push({
        timestamp: now,
        icon: 'emotion',
        text:
          locale === 'en'
            ? `${levelName}! Because of "${trigger}"`
            : locale === 'ja'
              ? `${levelName}！「${trigger}」のせいで`
              : `${levelName}！因为「${trigger}」`,
        category: 'emotion',
      });
    }
  }

  // 4. Danmaku stats & audience reaction summary
  const dm = snapshot.danmaku_memory;
  const responded = dm?.responded?.length || 0;
  const pending = dm?.pending_questions?.length || 0;
  if (responded > 0) {
    const pendingNote =
      pending > 0
        ? locale === 'en'
          ? `, still ${pending} questions to answer`
          : locale === 'ja'
            ? `、まだ ${pending} 個の質問に答えたい`
            : `，还有 ${pending} 个问题想回答`
        : '';
    entries.push({
      timestamp: now,
      icon: 'chat',
      text:
        locale === 'en'
          ? `Replied to ${responded} comments today${pendingNote}`
          : locale === 'ja'
            ? `今日は ${responded} 件のコメントに返信${pendingNote}`
            : `今天回复了 ${responded} 条弹幕${pendingNote}`,
      category: 'interaction',
    });
  }

  // Overall audience vibe from viewer count
  if (profileList.length > 0) {
    const familiarCount = profileList.filter((p) => (p.bonding_level ?? 0) >= 2).length;
    if (familiarCount > 0) {
      entries.push({
        timestamp: now,
        icon: 'heart',
        text:
          locale === 'en'
            ? `${familiarCount} regular viewers showed up today out of ${profileList.length} total`
            : locale === 'ja'
              ? `今日は ${profileList.length} 人中 ${familiarCount} 人の常連さんが来てくれた`
              : `今天 ${profileList.length} 位观众里有 ${familiarCount} 位老朋友`,
        category: 'viewer',
      });
    }
  }

  // 5. Story points
  const mentioned = (snapshot.story_points?.mentioned || []) as string[];
  if (mentioned.length > 0) {
    const topics = mentioned.slice(-3).join(
      locale === 'en' ? ', ' : locale === 'ja' ? '、' : '、',
    );
    entries.push({
      timestamp: now,
      icon: 'book',
      text:
        locale === 'en'
          ? `Talked about: ${topics}`
          : locale === 'ja'
            ? `今日の話題：${topics}`
            : `今天聊到了：${topics}`,
      category: 'progress',
    });
  }

  return entries;
}

/**
 * Save diary entries to localStorage for cross-session persistence.
 */
export function saveDiaryHistory(entries: DiaryEntry[], topic?: string): void {
  if (typeof window === 'undefined' || entries.length === 0) return;
  try {
    const existing = JSON.parse(localStorage.getItem(DIARY_HISTORY_KEY) || '[]') as Array<{
      date: string;
      topic?: string;
      entries: DiaryEntry[];
    }>;
    existing.push({
      date: new Date().toISOString(),
      topic,
      entries,
    });
    // Keep last 30 sessions
    const trimmed = existing.slice(-30);
    localStorage.setItem(DIARY_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore storage errors
  }
}

/**
 * Load diary history from localStorage.
 */
export function loadDiaryHistory(): Array<{
  date: string;
  topic?: string;
  entries: DiaryEntry[];
}> {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(DIARY_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Generate a short summary of recent diary history for use as AI context.
 * This is included in the background field when starting a new stream.
 */
export function getDiarySummaryForContext(locale: 'zh' | 'en' | 'ja' = 'zh'): string {
  const history = loadDiaryHistory();
  if (history.length === 0) return '';

  const recent = history.slice(-3);
  const summaries = recent.map((session) => {
    const date = new Date(session.date).toLocaleDateString(
      locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'zh-CN',
      { month: 'short', day: 'numeric' },
    );
    const topicLine = session.topic ? `[${session.topic}]` : '';
    const lines = session.entries.map((e) => e.text).join('；');
    return `${date} ${topicLine} ${lines}`;
  });

  const header =
    locale === 'en'
      ? 'Recent stream memories:'
      : locale === 'ja'
        ? '最近の配信の思い出：'
        : '最近的直播回忆：';

  return `${header}\n${summaries.join('\n')}`;
}
