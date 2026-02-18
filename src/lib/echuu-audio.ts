type PlaybackCallbacks = {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
  /** 当前段音频时长（ms），用于 caption 与声音同步 */
  onSegmentDuration?: (durationMs: number) => void;
};

const DEFAULT_MIME = 'audio/wav';

function base64ToBytes(b64: string): Uint8Array {
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return new Uint8Array();
  }
}

function detectAudioMime(bytes: Uint8Array): string {
  if (bytes.length < 4) return DEFAULT_MIME;
  // WAV: "RIFF"...."WAVE"
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    return 'audio/wav';
  }
  // MP3: "ID3" or 0xFF 0xFB
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
    return 'audio/mpeg';
  }
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return 'audio/mpeg';
  }
  return DEFAULT_MIME;
}

export function normalizeAudioSource(audioB64: string): string {
  if (!audioB64) return '';
  if (audioB64.startsWith('data:audio/')) return audioB64;
  const bytes = base64ToBytes(audioB64.slice(0, 2048));
  const mime = detectAudioMime(bytes);
  return `data:${mime};base64,${audioB64}`;
}

class EchuuAudioQueue {
  private queue: string[] = [];
  private audio: HTMLAudioElement | null = null;
  private callbacks: PlaybackCallbacks;
  private isPlaying = false;

  constructor(callbacks: PlaybackCallbacks) {
    this.callbacks = callbacks;
  }

  enqueue(audioB64: string) {
    if (!audioB64) return;
    this.queue.push(audioB64);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
    this.queue = [];
    this.isPlaying = false;
    this.callbacks.onEnd?.();
  }

  private playNext() {
    const next = this.queue.shift();
    if (!next) {
      this.isPlaying = false;
      this.callbacks.onEnd?.();
      return;
    }

    const audio = new Audio(normalizeAudioSource(next));
    this.audio = audio;
    this.isPlaying = true;

    // 元数据加载 → 先发送 duration（在 play 之前就绪）
    audio.onloadedmetadata = () => {
      const durationMs = Number.isFinite(audio.duration) ? audio.duration * 1000 : 0;
      if (durationMs > 0) this.callbacks.onSegmentDuration?.(durationMs);
    };

    audio.onended = () => {
      this.isPlaying = false;
      this.playNext();
    };

    audio.onerror = (event) => {
      this.isPlaying = false;
      this.callbacks.onError?.(event);
      this.playNext();
    };

    // play() 返回 Promise — resolve 时音频真正开始播放，此时 metadata 已就绪
    audio.play().then(() => {
      // 音频真正开始播放 → 通知上层
      this.callbacks.onStart?.();
    }).catch((error) => {
      this.isPlaying = false;
      this.callbacks.onError?.(error);
      this.playNext();
    });
  }
}

export function createEchuuAudioQueue(callbacks: PlaybackCallbacks) {
  return new EchuuAudioQueue(callbacks);
}
