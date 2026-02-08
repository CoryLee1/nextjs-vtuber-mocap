import { create } from 'zustand';

const ECHUU_WS_URL = 'ws://localhost:8000/ws';
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

interface EchuuState {
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

  // Info messages from backend
  infoMessage: string;
  errorMessage: string;

  // Actions
  connect: () => void;
  disconnect: () => void;
  sendDanmaku: (text: string, user?: string) => void;
  reset: () => void;
}

export const useEchuuWebSocket = create<EchuuState>((set, get) => ({
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

  infoMessage: '',
  errorMessage: '',

  connect: () => {
    const { ws, connectionState, reconnectTimer } = get();
    if (ws || connectionState === 'connecting') return;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }

    set({ connectionState: 'connecting', manualClose: false });

    const socket = new WebSocket(ECHUU_WS_URL);

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

  reset: () => {
    set({
      streamState: 'idle',
      currentStep: null,
      stepHistory: [],
      totalSteps: 0,
      scriptPreview: [],
      chatMessages: [],
      infoMessage: '',
      errorMessage: '',
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

    case 'user_count':
      set({ onlineCount: msg.count ?? 0 });
      break;

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

    case 'success':
      set({ streamState: 'finished', infoMessage: msg.content ?? '' });
      break;

    case 'error':
      set({
        streamState: 'error',
        errorMessage: msg.content ?? 'Unknown error',
      });
      break;
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

  const timer = setTimeout(() => {
    set({ reconnectTimer: null });
    get().connect();
  }, delay);

  set({ reconnectAttempt: nextAttempt, reconnectTimer: timer });
}
