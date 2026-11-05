import {
  DEFAULT_SETTINGS,
  PALETTE_OPTIONS,
  PATTERN_OPTIONS,
  QUALITY_OPTIONS,
  RENDERER_OPTIONS,
  SETTING_BOUNDS,
  STORAGE_KEY
} from '@/constant.js';
import { isRecord } from '@/utils/guards.js';
export { DEFAULT_SETTINGS, INITIAL_STATUS } from '@/constant.js';

export type Mode = 'manual' | 'auto';
export type Quality = 'auto' | 'low' | 'high';
export type Pattern =
  | 'mixed'
  | 'sphere'
  | 'ring'
  | 'willow'
  | 'heart'
  | 'star'
  | 'chrysanthemum'
  | 'peony'
  | 'palm'
  | 'spiral'
  | 'saturn'
  | 'butterfly'
  | 'crossette'
  | 'waterfall'
  | 'flower'
  | 'galaxy';
export type Palette =
  | 'festival'
  | 'gold'
  | 'aurora'
  | 'rose'
  | 'ocean'
  | 'ember'
  | 'lavender'
  | 'neon'
  | 'ice'
  | 'sunset'
  | 'forest'
  | 'pearl';
export type RendererChoice = 'auto' | 'webgpu' | 'webgl';
export interface NumberRange {
  min: number;
  max: number;
}

export interface FireworksSettings {
  batchCount: NumberRange;
  clickCount: NumberRange;
  clickRadius: NumberRange;
  interval: NumberRange;
  bloom: number;
  brightness: number;
  quality: Quality;
  patterns: Pattern[];
  palettes: Palette[];
  renderer: RendererChoice;
  hdr: boolean;
  sound: boolean;
  speech: boolean;
  volume: number;
}

export interface EngineStatus {
  ready: boolean;
  backend: string;
  hdr: boolean;
  hdrAvailable: boolean;
  floatBuffer: boolean;
  fps: number;
  active: number;
  launched: number;
  error: string;
}

export function normalizeSettings(input: unknown): FireworksSettings {
  const source = isRecord(input) ? input : {};
  const number = (key: keyof typeof SETTING_BOUNDS, candidate: unknown, fallback: number) => {
    const { min, max, step } = SETTING_BOUNDS[key];
    const value =
      typeof candidate === 'number' && Number.isFinite(candidate) ? Math.min(max, Math.max(min, candidate)) : fallback;
    const stepped = min + Math.round((value - min) / step) * step;
    return Number(stepped.toFixed(String(step).split('.')[1]?.length ?? 0));
  };
  const range = (key: 'batchCount' | 'clickCount' | 'clickRadius' | 'interval'): NumberRange => {
    const candidate = source[key];
    const value = isRecord(candidate) ? candidate : { min: candidate, max: candidate };
    const low = number(key, value['min'], DEFAULT_SETTINGS[key].min);
    const high = number(key, value['max'], DEFAULT_SETTINGS[key].max);
    return { min: Math.min(low, high), max: Math.max(low, high) };
  };
  const palettes = PALETTE_OPTIONS.filter(
    ({ id }) => Array.isArray(source['palettes']) && source['palettes'].includes(id)
  ).map(({ id }) => id);
  const patternSource = Array.isArray(source['patterns']) ? source['patterns'] : [source['pattern']];
  const patterns = PATTERN_OPTIONS.filter(({ id }) => patternSource.includes(id)).map(({ id }) => id);
  return {
    batchCount: range('batchCount'),
    clickCount: range('clickCount'),
    clickRadius: range('clickRadius'),
    interval: range('interval'),
    bloom: number('bloom', source['bloom'], DEFAULT_SETTINGS.bloom),
    brightness: number('brightness', source['brightness'], DEFAULT_SETTINGS.brightness),
    quality: QUALITY_OPTIONS.find((value) => value === source['quality']) ?? DEFAULT_SETTINGS.quality,
    patterns: patterns.length
      ? patterns.length > 1
        ? patterns.filter((id) => id !== 'mixed')
        : patterns
      : [...DEFAULT_SETTINGS.patterns],
    palettes: palettes.length ? palettes : [...DEFAULT_SETTINGS.palettes],
    renderer: RENDERER_OPTIONS.find(({ id }) => id === source['renderer'])?.id ?? DEFAULT_SETTINGS.renderer,
    hdr: typeof source['hdr'] === 'boolean' ? source['hdr'] : DEFAULT_SETTINGS.hdr,
    sound: typeof source['sound'] === 'boolean' ? source['sound'] : DEFAULT_SETTINGS.sound,
    speech: typeof source['speech'] === 'boolean' ? source['speech'] : DEFAULT_SETTINGS.speech,
    volume: number('volume', source['volume'], DEFAULT_SETTINGS.volume)
  };
}

export function loadSettings(): FireworksSettings {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: FireworksSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* Private browsing can disable storage. */
  }
}

export function sampleRange(range: NumberRange, integer = false): number {
  if (range.min === range.max) {
    return range.min;
  }
  return integer
    ? range.min + Math.floor(Math.random() * (range.max - range.min + 1))
    : range.min + Math.random() * (range.max - range.min);
}
