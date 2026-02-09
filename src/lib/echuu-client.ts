const ECHUU_API_BASE = 'http://localhost:8000';

export interface StartLiveConfig {
  character_name: string;
  persona: string;
  background: string;
  topic: string;
  danmaku?: string[];
  /** TTS 音色，与侧栏「声音」一致，后端据此设置 TTS_VOICE */
  voice?: string;
}

export async function startLive(config: StartLiveConfig) {
  const res = await fetch(`${ECHUU_API_BASE}/api/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to start live');
  }
  return res.json();
}

export async function getOnlineCount(): Promise<number> {
  const res = await fetch(`${ECHUU_API_BASE}/api/online-count`);
  const data = await res.json();
  return data.count ?? 0;
}

export async function sendDanmaku(text: string, user = '观众') {
  const res = await fetch(`${ECHUU_API_BASE}/api/danmaku`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, user }),
  });
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${ECHUU_API_BASE}/api/status`);
  return res.json();
}

export async function getHistory() {
  const res = await fetch(`${ECHUU_API_BASE}/api/history`);
  return res.json();
}
