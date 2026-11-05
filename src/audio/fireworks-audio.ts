import { AUDIO, DEFAULT_SETTINGS } from '@/constant.js';
import type { FireworksSettings } from '@/fireworks/settings.js';
import { pickRandom } from '@/utils/random.js';
import workletUrl from './fireworks.worklet.ts?worker&url';
import type { AudioState, FireworkSound } from './types.js';
console.log(`worklet url ${workletUrl}`);
const random = (range: readonly [number, number]) => range[0] + Math.random() * (range[1] - range[0]);

export class FireworksAudio {
  #context: AudioContext | undefined;
  #node: AudioWorkletNode | undefined;
  #gain: GainNode | undefined;
  #initializing: Promise<void> | undefined;
  #settings = structuredClone(DEFAULT_SETTINGS);
  #paused = false;
  #disposed = false;
  #lastLaunch = -Infinity;
  #lastExplosion = -Infinity;
  #lastSpeech = -Infinity;
  #lastAutoSpeech = -Infinity;
  #onState: (state: AudioState) => void;
  #onError: (message: string) => void;

  constructor(onState: (state: AudioState) => void, onError: (message: string) => void) {
    this.#onState = onState;
    this.#onError = onError;
    document.addEventListener('visibilitychange', this.#visibility);
  }

  configure(settings: FireworksSettings, paused: boolean): void {
    this.#settings = settings;
    this.#paused = paused;
    this.#applyGain();
    if (!settings.speech || paused || document.hidden) {
      window.speechSynthesis?.cancel();
    }
  }

  unlock(): void {
    if (!this.#settings.sound || this.#disposed) {
      return;
    }
    if (this.#context) {
      void this.#context.resume().catch(() => {});
      return;
    }
    if (this.#initializing) {
      return;
    }
    this.#onState('loading');
    try {
      this.#context = new AudioContext({ latencyHint: 'interactive' });
      const context = this.#context;
      // Resume synchronously within the user's gesture; module loading may finish later.
      const resumed = context.resume();
      this.#initializing = (async () => {
        if (!context.audioWorklet) {
          throw new Error('此浏览器暂不支持 AudioWorklet，画面仍可正常播放。');
        }
        await context.audioWorklet.addModule(workletUrl);
        if (this.#disposed) {
          return;
        }
        this.#node = new AudioWorkletNode(context, AUDIO.processorName, {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          processorOptions: { config: AUDIO.processor }
        });
        this.#node.onprocessorerror = () => {
          this.#onState('unavailable');
          this.#onError('音效处理已停止，可刷新页面重新启用。');
        };
        this.#gain = context.createGain();
        this.#node.connect(this.#gain).connect(context.destination);
        this.#applyGain();
        await resumed;
        if (!this.#disposed) {
          this.#onState('ready');
        }
      })().catch((error: unknown) => {
        if (this.#disposed) {
          return;
        }
        this.#onState('unavailable');
        this.#onError(error instanceof Error ? error.message : '当前浏览器无法启用音效。');
        this.#node?.disconnect();
        void context.close().catch(() => {});
        this.#context = undefined;
        this.#initializing = undefined;
      });
    } catch {
      this.#onState('unavailable');
      this.#onError('当前环境无法启用声音，画面仍可正常播放。');
    }
  }

  play(sound: FireworkSound, automatic: boolean): void {
    if (automatic && performance.now() - this.#lastAutoSpeech > AUDIO.autoSpeechInterval) {
      this.#lastAutoSpeech = performance.now();
      this.say();
    }
    if (!this.#settings.sound || !this.#node || !this.#context || this.#paused || document.hidden) {
      return;
    }
    const now = this.#context.currentTime;
    if (sound.kind === 'launch') {
      if (now - this.#lastLaunch < AUDIO.minLaunchGap) {
        return;
      }
      this.#lastLaunch = now;
    } else {
      if (now - this.#lastExplosion < AUDIO.minExplosionGap) {
        return;
      }
      this.#lastExplosion = now;
    }
    this.#node.port.postMessage({ type: 'play', ...sound });
  }

  say(): void {
    const synth = window.speechSynthesis;
    if (
      !this.#settings.speech ||
      this.#paused ||
      document.hidden ||
      !synth ||
      synth.speaking ||
      performance.now() - this.#lastSpeech < AUDIO.speechCooldown
    ) {
      return;
    }
    const text = pickRandom(AUDIO.phrases);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = AUDIO.speechLanguage;
    const voices = synth.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith('zh'));
    const voice = voices[Math.floor(Math.random() * voices.length)];
    if (voice) {
      utterance.voice = voice;
    }
    utterance.rate = random(AUDIO.speechRate);
    utterance.pitch = random(AUDIO.speechPitch);
    utterance.volume = this.#settings.volume;
    this.#lastSpeech = performance.now();
    synth.speak(utterance);
  }

  clear(): void {
    this.#node?.port.postMessage({ type: 'clear' });
    window.speechSynthesis?.cancel();
  }

  #applyGain(): void {
    const muted = !this.#settings.sound || this.#paused || document.hidden;
    if (this.#context && this.#gain) {
      this.#gain.gain.setTargetAtTime(muted ? 0 : this.#settings.volume, this.#context.currentTime, AUDIO.gainRamp);
      if (muted) {
        this.#node?.port.postMessage({ type: 'clear' });
      }
    }
  }

  readonly #visibility = (): void => {
    this.#applyGain();
    if (document.hidden) {
      this.clear();
    }
  };

  dispose(): void {
    this.#disposed = true;
    document.removeEventListener('visibilitychange', this.#visibility);
    this.clear();
    this.#node?.disconnect();
    this.#gain?.disconnect();
    void this.#context?.close().catch(() => {});
  }
}
