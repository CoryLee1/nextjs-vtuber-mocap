const ECHUU_API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ECHUU_API_URL) || 'http://localhost:8000';

export interface StartLiveConfig {
  character_name: string;
  persona: string;
  background: string;
  topic: string;
  danmaku?: string[];
  voice?: string;
}

/** 创建直播间，返回 room_id 与 owner_token，房主需保存 owner_token */
export async function createRoom(): Promise<{ room_id: string; owner_token: string }> {
  const res = await fetch(`${ECHUU_API_BASE}/api/room`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json();
}

export async function startLive(
  config: StartLiveConfig,
  roomId: string,
  ownerToken: string
) {
  const res = await fetch(`${ECHUU_API_BASE}/api/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...config,
      room_id: roomId,
      owner_token: ownerToken,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Failed to start live');
  }
  return res.json();
}

export async function getOnlineCount(roomId: string): Promise<number> {
  if (!roomId) return 0;
  const res = await fetch(`${ECHUU_API_BASE}/api/online-count?room_id=${encodeURIComponent(roomId)}`);
  const data = await res.json();
  return data.count ?? 0;
}

export async function sendDanmaku(roomId: string, text: string, user = '观众') {
  const res = await fetch(`${ECHUU_API_BASE}/api/danmaku`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId, text, user }),
  });
  return res.json();
}

export async function getStatus(roomId: string) {
  const res = await fetch(`${ECHUU_API_BASE}/api/status?room_id=${encodeURIComponent(roomId)}`);
  return res.json();
}

export async function getHistory() {
  const res = await fetch(`${ECHUU_API_BASE}/api/history`);
  return res.json();
}
