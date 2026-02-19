import { create } from 'zustand';

function getEchuuWsBase(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ECHUU_WS_URL)
    return process.env.NEXT_PUBLIC_ECHUU_WS_URL;
  const api = process.env?.NEXT_PUBLIC_ECHUU_API_URL || 'http://localhost:8000';
  return api.replace(/^http/, 'ws') + '/ws';
}
const MAX_RECONNECT_ATTEMPTS = 8;
const BASE_RECONNECT_DELAY_MS = 800;

export type EchuuConnectionState = 'disconnected' | 'connecting' | 'connected';

export type EchuuStreamState =
  | 'idle'
  | 'initializing'
  | 'generating_script'
  | 'performing'
  | 'finished'
  | 'error';

export interface EchuuStepEvent {
  step: number;
  stage: string;
  speech: string;
  action: string;
  cue: any | null;
  audio_b64: string | null;
  danmaku: string | null;
  emotion_break: any | null;
}

export interface ChatMessage {
  text: string;
  user: string;
  isAI?: boolean;
  timestamp?: number;
}

/** 后端 PerformerMemory 的同步快照（Calendar Memory 等用） */
export interface MemorySnapshot {
  script_progress?: { current_line?: number; total_lines?: number; current_stage?: string; completed_stages?: string[] };
  danmaku_memory?: { received?: unknown[]; responded?: unknown[]; ignored?: unknown[]; pending_questions?: unknown[] };
  user_profiles?: Record<string, {
    username: string;
    interaction_count: number;
    first_seen: string | null;
    last_seen: string | null;
    reaction_style?: string;
    bonding_level?: number;
    special_moments?: string[];
    total_sc_amount?: number;
  }>;
  promises?: unknown[];
  story_points?: { mentioned?: string[]; upcoming?: string[]; revealed?: string[] };
  emotion_track?: unknown[];
}

interface EchuuState {
  // Room（房主开播需 room_id + owner_token）
  roomId: string | null;
  ownerToken: string | null;
  // Connection
  connectionState: EchuuConnectionState;
  ws: WebSocket | null;
  reconnectAttempt: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  manualClose: boolean;

  // Stream state
  streamState: EchuuStreamState;
  currentStep: EchuuStepEvent | null;
  stepHistory: EchuuStepEvent[];
  totalSteps: number;
  scriptPreview: string[];

  // Chat / danmaku
  chatMessages: ChatMessage[];
  onlineCount: number;

  // Memory（与后端 PerformerMemory 同步，供 Calendar 等展示）
  memorySnapshot: MemorySnapshot | null;

  // Info messages from backend
  infoMessage: string;
  errorMessage: string;

  /** 最后收到的 WS 事件类型（便于确认前端能收到后端数据） */
  lastEventType: string | null;
  lastEventAt: number | null;

  // Session stats（用于直播结束 MVP 结算页）
  /** 开始表演的时间戳（streamState → performing 时记录） */
  liveStartedAt: number | null;
  /** 直播结束的时间戳（streamState → finished 时记录） */
  liveEndedAt: number | null;
  /** 本场直播最高在线人数 */
  peakOnlineCount: number;

  /** 其他观众的光标位置（viewer_id -> { x, y } 归一化 0–1，用于直播间内互相看见对方光标） */
  otherCursors: Record<string, { x: number; y: number; updatedAt: number }>;

  // Actions
  setRoom: (roomId: string | null, ownerToken: string | null) => void;
  connect: (roomId: string) => void;
  disconnect: () => void;
  sendDanmaku: (text: string, user?: string) => void;
  /** 发送本机光标位置（归一化 0–1）；后端需广播为 type: 'cursor', viewer_id, x, y */
  sendCursor: (x: number, y: number) => void;
  reset: () => void;
}

export const useEchuuWebSocket = create<EchuuState>((set, get) => ({
  roomId: null,
  ownerToken: null,
  connectionState: 'disconnected',
  ws: null,
  reconnectAttempt: 0,
  reconnectTimer: null,
  manualClose: false,

  streamState: 'idle',
  currentStep: null,
  stepHistory: [],
  totalSteps: 0,
  scriptPreview: [],

  chatMessages: [],
  onlineCount: 0,

  memorySnapshot: null,

  infoMessage: '',
  errorMessage: '',

  lastEventType: null,
  lastEventAt: null,

  liveStartedAt: null,
  liveEndedAt: null,
  peakOnlineCount: 0,

  otherCursors: {},

  setRoom: (roomId, ownerToken) => {
    set({ roomId, ownerToken });
  },

  connect: (roomId: string) => {
    const { ws, connectionState, reconnectTimer } = get();
    if (!roomId) return;
    if (ws || connectionState === 'connecting') return;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    set({ connectionState: 'connecting', manualClose: false });
    const wsBase = getEchuuWsBase();
    const wsUrl = wsBase.includes('?') ? `${wsBase}&room_id=${encodeURIComponent(roomId)}` : `${wsBase}?room_id=${encodeURIComponent(roomId)}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      set({
        connectionState: 'connected',
        ws: socket,
        errorMessage: '',
        reconnectAttempt: 0,
      });
    };

    socket.onclose = () => {
      const { manualClose } = get();
      set({ connectionState: 'disconnected', ws: null });
      if (!manualClose) {
        scheduleReconnect(set, get);
      }
    };

    socket.onerror = () => {
      set({
        connectionState: 'disconnected',
        ws: null,
        errorMessage: 'WebSocket connection failed',
      });
    };

    socket.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        set({ lastEventType: msg.type ?? null, lastEventAt: Date.now() });
        handleMessage(msg, set, get);
      } catch {
        // ignore non-JSON
      }
    };
  },

  disconnect: () => {
    const { ws, reconnectTimer } = get();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
    if (ws) {
      ws.close();
    }
    set({ connectionState: 'disconnected', ws: null, manualClose: true, reconnectTimer: null });
  },

  sendDanmaku: (text: string, user = '观众') => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'danmaku', text, user }));
    }
  },

  sendCursor: (x: number, y: number) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'cursor', x, y }));
    }
  },

  reset: () => {
    set({
      streamState: 'idle',
      currentStep: null,
      stepHistory: [],
      totalSteps: 0,
      scriptPreview: [],
      chatMessages: [],
      memorySnapshot: null,
      infoMessage: '',
      errorMessage: '',
      liveStartedAt: null,
      liveEndedAt: null,
      peakOnlineCount: 0,
      otherCursors: {},
    });
  },
}));

function handleMessage(
  msg: any,
  set: (partial: Partial<EchuuState>) => void,
  get: () => EchuuState
) {
  switch (msg.type) {
    case 'system':
      break;

    case 'user_count': {
      const count = msg.count ?? 0;
      const prev = get().peakOnlineCount;
      set({ onlineCount: count, peakOnlineCount: Math.max(prev, count) });
      break;
    }

    case 'info':
      set({ infoMessage: msg.content ?? '' });
      if (msg.content?.includes('初始化')) {
        set({ streamState: 'initializing' });
      } else if (msg.content?.includes('剧本')) {
        set({ streamState: 'generating_script' });
      } else if (msg.content?.includes('表演')) {
        set({ streamState: 'performing' });
      }
      break;

    case 'script_ready':
      set({
        streamState: 'performing',
        totalSteps: msg.total_steps ?? 0,
        scriptPreview: msg.script_preview ?? [],
        infoMessage: msg.content ?? '',
        liveStartedAt: get().liveStartedAt ?? Date.now(),
      });
      break;

    case 'step': {
      const stepEvent: EchuuStepEvent = {
        step: msg.step ?? 0,
        stage: msg.stage ?? '',
        speech: msg.speech ?? '',
        action: msg.action ?? 'continue',
        cue: msg.cue ?? null,
        audio_b64: msg.audio_b64 ?? null,
        danmaku: msg.danmaku ?? null,
        emotion_break: msg.emotion_break ?? null,
      };
      const prev = get().stepHistory;
      const messages = get().chatMessages;
      const newMessages = [...messages];
      if (stepEvent.speech) {
        newMessages.push({
          text: stepEvent.speech,
          user: 'AI',
          isAI: true,
          timestamp: Date.now(),
        });
      }
      set({
        currentStep: stepEvent,
        stepHistory: [...prev, stepEvent],
        chatMessages: newMessages,
      });
      break;
    }

    case 'danmaku': {
      const messages = get().chatMessages;
      set({
        chatMessages: [
          ...messages,
          {
            text: msg.text ?? '',
            user: msg.user ?? '观众',
            isAI: false,
            timestamp: Date.now(),
          },
        ],
      });
      break;
    }

    case 'memory':
      set({ memorySnapshot: msg.memory ?? null });
      break;

    case 'success':
      set({ streamState: 'finished', infoMessage: msg.content ?? '', liveEndedAt: Date.now() });
      break;

    case 'error':
      set({
        streamState: 'error',
        errorMessage: msg.content ?? 'Unknown error',
      });
      break;

    case 'cursor': {
      const viewerId = msg.viewer_id ?? msg.client_id;
      const x = typeof msg.x === 'number' ? msg.x : 0;
      const y = typeof msg.y === 'number' ? msg.y : 0;
      if (viewerId == null) break;
      const prev = get().otherCursors;
      set({
        otherCursors: {
          ...prev,
          [viewerId]: { x, y, updatedAt: Date.now() },
        },
      });
      break;
    }
  }
}

function scheduleReconnect(
  set: (partial: Partial<EchuuState>) => void,
  get: () => EchuuState
) {
  const { reconnectAttempt } = get();
  if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
    set({ errorMessage: 'WebSocket reconnect failed' });
    return;
  }

  const nextAttempt = reconnectAttempt + 1;
  const jitter = Math.random() * 250;
  const delay = Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempt) + jitter, 15000);
  const roomId = get().roomId;

  const timer = setTimeout(() => {
    set({ reconnectTimer: null });
    if (roomId) get().connect(roomId);
  }, delay);

  set({ reconnectAttempt: nextAttempt, reconnectTimer: timer });
}
