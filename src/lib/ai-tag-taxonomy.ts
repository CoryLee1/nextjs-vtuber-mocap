export type CanonicalGender = 'male' | 'female' | 'nonbinary';

export const ECHUU_AGENT_TTS_VOICES = [
  'Cherry', 'Serena', 'Ethan', 'Chelsie', 'Momo', 'Vivian', 'Moon', 'Maia',
  'Kai', 'Nofish', 'Bella', 'Jennifer', 'Ryan', 'Katerina', 'Aiden', 'Eldric Sage',
  'Mia', 'Mochi', 'Bellona', 'Vincent', 'Bunny', 'Neil', 'Elias', 'Arthur',
  'Nini', 'Ebona', 'Seren', 'Pip', 'Stella', 'Bodega', 'Sonrisa', 'Alek',
  'Dolce', 'Sohee', 'Ono Anna', 'Lenn', 'Emilien', 'Andre', 'Radio Gol',
  'Jada', 'Dylan', 'Li', 'Marcus', 'Roy', 'Peter', 'Sunny', 'Eric', 'Rocky', 'Kiki',
] as const;

export const ECHUU_AGENT_TTS_VOICE_SET = new Set<string>(ECHUU_AGENT_TTS_VOICES);
export const DEFAULT_TTS_VOICE = 'Cherry';

export const TECHNICAL_TAG_BLACKLIST = new Set<string>(['vrm', 's3']);

export function normalizeGender(raw: unknown): CanonicalGender {
  const value = String(raw ?? '').trim().toLowerCase();
  if (value === 'male') return 'male';
  if (value === 'female') return 'female';
  if (value === 'neutral' || value === 'non-binary' || value === 'nonbinary') return 'nonbinary';
  return 'nonbinary';
}

export function normalizeVoice(raw: unknown): string {
  const value = String(raw ?? '').trim();
  if (!value) return DEFAULT_TTS_VOICE;
  if (ECHUU_AGENT_TTS_VOICE_SET.has(value)) return value;
  return DEFAULT_TTS_VOICE;
}

export function normalizeModelName(raw: unknown, fallbackName: string): string {
  const input = String(raw ?? '').trim() || fallbackName;
  const cleaned = input
    .replace(/\.vrm$/i, '')
    .replace(/[_-]?\d{8,}.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return fallbackName;
  return cleaned.slice(0, 64);
}

export function buildCanonicalTags(params: {
  gender?: CanonicalGender;
  identity?: string;
  styleTags?: string[];
  suggestedVoice?: string;
  baseTags?: string[];
}): string[] {
  const set = new Set<string>();

  (params.baseTags ?? [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .forEach((t) => {
      if (!TECHNICAL_TAG_BLACKLIST.has(t.toLowerCase())) set.add(t);
    });

  if (params.gender) set.add(`gender:${params.gender}`);
  if (params.identity) set.add(`identity:${params.identity}`);
  if (params.suggestedVoice) set.add(`voice:${params.suggestedVoice}`);
  (params.styleTags ?? [])
    .map((t) => String(t).trim())
    .filter(Boolean)
    .forEach((t) => set.add(t));

  return Array.from(set);
}
