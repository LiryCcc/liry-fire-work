import { AUDIO } from '@/constant.js';
import type { AudioProcessorConfig, AudioWorkletGlobalScope, SynthCommand } from './types.js';

declare const self: AudioWorkletGlobalScope;

interface Voice {
  kind: 'launch' | 'explosion';
  age: number;
  life: number;
  phase: number;
  pitch: number;
  sweep: number;
  decay: number;
  filter: number;
  low: number;
  crackle: number;
  crackleChance: number;
  variant: number;
  gain: number;
  left: number;
  right: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProcessorConfig(value: unknown): value is AudioProcessorConfig {
  if (!isRecord(value)) {
    return false;
  }
  for (const [key, expected] of Object.entries(AUDIO.processor)) {
    const candidate = value[key];
    if (typeof expected === 'number') {
      if (typeof candidate !== 'number' || !Number.isFinite(candidate) || candidate < 0) {
        return false;
      }
    } else {
      if (!Array.isArray(candidate) || candidate.length !== expected.length) {
        return false;
      }
      const [min, max] = candidate;
      if (
        typeof min !== 'number' ||
        typeof max !== 'number' ||
        !Number.isFinite(min) ||
        !Number.isFinite(max) ||
        min < 0 ||
        max < min
      ) {
        return false;
      }
    }
  }
  const voices = value['maxVoices'];
  const echo = value['echoSeconds'];
  const left = value['echoLeft'];
  const right = value['echoRight'];
  const attack = value['attack'];
  return (
    typeof voices === 'number' &&
    Number.isInteger(voices) &&
    voices > 0 &&
    voices <= AUDIO.processor.maxVoices &&
    typeof echo === 'number' &&
    echo > 0 &&
    typeof left === 'number' &&
    left < echo &&
    typeof right === 'number' &&
    right < echo &&
    typeof attack === 'number' &&
    attack > 0
  );
}

/** Self-contained audio-thread module. All sound tuning arrives through processorOptions. */
class FireworksProcessor extends AudioWorkletProcessor {
  readonly #config: AudioProcessorConfig;
  readonly #voices: Voice[] = [];
  readonly #echoLeft: Float32Array;
  readonly #echoRight: Float32Array;
  #cursor = 0;

  constructor(options: AudioWorkletNodeOptions) {
    super();
    const data: unknown = options.processorOptions;
    const config = isRecord(data) ? data['config'] : undefined;
    this.#config = isProcessorConfig(config) ? config : AUDIO.processor;
    this.#echoLeft = new Float32Array(Math.ceil(self.sampleRate * this.#config.echoSeconds));
    this.#echoRight = new Float32Array(this.#echoLeft.length);
    this.port.onmessage = (event: MessageEvent<unknown>) => {
      const command = event.data;
      if (!isRecord(command)) {
        return;
      }
      if (command['type'] === 'clear') {
        this.#voices.length = 0;
        this.#echoLeft.fill(0);
        this.#echoRight.fill(0);
      } else if (
        command['type'] === 'play' &&
        (command['kind'] === 'launch' || command['kind'] === 'explosion') &&
        typeof command['pan'] === 'number' &&
        Number.isFinite(command['pan']) &&
        typeof command['power'] === 'number' &&
        Number.isFinite(command['power'])
      ) {
        this.#start({ type: 'play', kind: command['kind'], pan: command['pan'], power: command['power'] });
      }
    };
  }

  #random(range: readonly [number, number]): number {
    return range[0] + Math.random() * (range[1] - range[0]);
  }

  #start(command: Extract<SynthCommand, { type: 'play' }>): void {
    const c = this.#config;
    if (this.#voices.length >= c.maxVoices) {
      this.#voices.shift();
    }
    const pan = Math.min(1, Math.max(-1, command.pan + (Math.random() * 2 - 1) * c.panJitter));
    this.#voices.push({
      kind: command.kind,
      age: 0,
      phase: Math.random() * Math.PI * 2,
      life: this.#random(command.kind === 'launch' ? c.launchLife : c.explosionLife),
      pitch: this.#random(command.kind === 'launch' ? c.launchPitch : c.explosionPitch),
      sweep: this.#random(c.launchSweep),
      decay: this.#random(c.decay),
      filter: this.#random(c.filter),
      low: 0,
      crackle: 0,
      crackleChance: this.#random(c.crackleChance),
      variant: Math.random(),
      gain: Math.min(1, Math.max(0, command.power)) * this.#random(c.gainJitter),
      left: Math.cos(((pan + 1) * Math.PI) / 4),
      right: Math.sin(((pan + 1) * Math.PI) / 4)
    });
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
    void inputs;
    const channels = outputs[0];
    const left = channels?.[0];
    const right = channels?.[1];
    if (!left || !right) {
      return true;
    }
    const c = this.#config;
    const delayL = Math.floor(self.sampleRate * c.echoLeft);
    const delayR = Math.floor(self.sampleRate * c.echoRight);
    for (let sample = 0; sample < left.length; sample++) {
      let sumL = 0;
      let sumR = 0;
      for (let index = this.#voices.length - 1; index >= 0; index--) {
        const voice = this.#voices[index];
        if (!voice) {
          throw new RangeError('音频声部索引越界。');
        }
        if (voice.age >= voice.life) {
          this.#voices.splice(index, 1);
          continue;
        }
        const noise = Math.random() * 2 - 1;
        voice.low += voice.filter * (noise - voice.low);
        const progress = voice.age / voice.life;
        let signal: number;
        if (voice.kind === 'launch') {
          voice.phase += ((voice.pitch + voice.sweep * progress * progress) / self.sampleRate) * Math.PI * 2;
          const envelope = Math.sin(progress * Math.PI) ** 2;
          signal = (noise * c.launchNoise + Math.sin(voice.phase) * c.launchTone) * envelope;
        } else {
          voice.phase += ((voice.pitch * Math.exp(-voice.age * c.pitchDrop)) / self.sampleRate) * Math.PI * 2;
          if (Math.random() < voice.crackleChance) {
            voice.crackle = noise;
          }
          voice.crackle *= c.crackleDecay;
          const envelope = Math.min(1, voice.age / c.attack) * Math.exp(-voice.age * voice.decay);
          const rumble = Math.sin(voice.phase) * c.lowGain + Math.sin(voice.phase * c.secondaryPitch) * c.secondaryGain;
          const texture = voice.low * c.noiseGain + voice.crackle * c.crackleGain * voice.variant;
          const whistle = Math.sin(voice.phase * c.pitchDrop) * c.whistleGain * (1 - voice.variant);
          signal = (rumble + texture + whistle) * envelope;
        }
        voice.age += 1 / self.sampleRate;
        sumL += signal * voice.gain * voice.left;
        sumR += signal * voice.gain * voice.right;
      }
      const echoL = this.#echoLeft[(this.#cursor - delayL + this.#echoLeft.length) % this.#echoLeft.length];
      const echoR = this.#echoRight[(this.#cursor - delayR + this.#echoRight.length) % this.#echoRight.length];
      if (echoL === undefined || echoR === undefined) {
        throw new RangeError('音频回声缓冲索引越界。');
      }
      this.#echoLeft[this.#cursor] = sumL + echoL * c.echoFeedback;
      this.#echoRight[this.#cursor] = sumR + echoR * c.echoFeedback;
      left[sample] = Math.tanh((sumL + echoL * c.echoMix) * c.masterGain);
      right[sample] = Math.tanh((sumR + echoR * c.echoMix) * c.masterGain);
      this.#cursor = (this.#cursor + 1) % this.#echoLeft.length;
    }
    return true;
  }
}

// The name is supplied by the host along with all numeric configuration.
self.registerProcessor(AUDIO.processorName, FireworksProcessor);
