import type { AUDIO } from '@/constant.js';

export interface FireworkSound {
  kind: 'launch' | 'explosion';
  pan: number;
  power: number;
}
export type AudioProcessorConfig = {
  [Key in keyof typeof AUDIO.processor]: (typeof AUDIO.processor)[Key] extends readonly [number, number]
    ? readonly [number, number]
    : number;
};
export type SynthCommand = ({ type: 'play' } & FireworkSound) | { type: 'clear' };
export type AudioState = 'idle' | 'loading' | 'ready' | 'unavailable';

export interface WorkletProcessor {
  readonly port: MessagePort;
}
export interface AudioWorkletGlobalScope {
  readonly sampleRate: number;
  readonly currentFrame: number;
  readonly currentTime: number;
  readonly AudioWorkletProcessor: new (options?: AudioWorkletNodeOptions) => WorkletProcessor;
  registerProcessor: (name: string, processor: new (options: AudioWorkletNodeOptions) => WorkletProcessor) => void;
}
