import { INTERACTION } from '@/constant.js';
import { FireworksEngine } from '@/fireworks/engine.js';
import { DEFAULT_SETTINGS, type EngineStatus, type FireworksSettings, type Mode } from '@/fireworks/settings.js';
import { LitElement, css, html, type PropertyValues } from 'lit';

export class FireworksStage extends LitElement {
  static override properties = {
    settings: { attribute: false },
    mode: { type: String },
    paused: { type: Boolean },
    marker: { state: true }
  };
  declare settings: FireworksSettings;
  declare mode: Mode;
  declare paused: boolean;
  declare marker: { x: number; y: number } | undefined;
  #engine: FireworksEngine | undefined;
  #generation = 0;
  #markerTimer = 0;
  #pointerStart = { x: 0, y: 0 };

  constructor() {
    super();
    this.settings = { ...DEFAULT_SETTINGS };
    this.mode = 'manual';
    this.paused = false;
  }

  static override styles = css`
    :host {
      display: block;
      position: absolute;
      inset: 0;
    }
    .surface {
      width: 100%;
      height: 100%;
      outline-offset: -5px;
      touch-action: none;
      cursor: crosshair;
    }
    .surface:focus-visible {
      outline: 1px solid #e8bd7a;
    }
    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
    .marker {
      position: absolute;
      pointer-events: none;
      border: 1px solid #efcb8d88;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      margin: -16px;
      animation: ripple 0.9s ease-out forwards;
    }
    .marker::before,
    .marker::after {
      content: '';
      position: absolute;
      background: #eccf9c;
      left: 50%;
      top: 50%;
    }
    .marker::before {
      width: 8px;
      height: 1px;
      margin-left: -4px;
    }
    .marker::after {
      width: 1px;
      height: 8px;
      margin-top: -4px;
    }
    @keyframes ripple {
      from {
        transform: scale(0.6);
        opacity: 1;
      }
      to {
        transform: scale(2.2);
        opacity: 0;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .marker {
        animation: none;
      }
    }
  `;

  override firstUpdated(): void {
    void this.#initialize();
  }
  override updated(changes: PropertyValues<this>): void {
    const previous = changes.get('settings');
    if (previous && (previous.hdr !== this.settings.hdr || previous.renderer !== this.settings.renderer)) {
      void this.#initialize();
      return;
    }
    if (changes.has('settings')) {
      this.#engine?.setSettings(this.settings);
    }
    if (changes.has('mode')) {
      this.#engine?.setMode(this.mode);
    }
    if (changes.has('paused')) {
      this.#engine?.setPaused(this.paused);
    }
  }
  override connectedCallback(): void {
    super.connectedCallback();
    if (this.hasUpdated) {
      void this.#initialize();
    }
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#generation++;
    window.clearTimeout(this.#markerTimer);
    void this.#engine?.dispose();
    this.#engine = undefined;
  }

  async #initialize(): Promise<void> {
    const generation = ++this.#generation;
    const previous = this.#engine;
    this.#engine = undefined;
    await previous?.dispose();
    if (generation !== this.#generation || !this.isConnected) {
      return;
    }
    this.#emit('engine-loading');
    const engine = new FireworksEngine(
      this.settings,
      (status: EngineStatus) => {
        if (generation === this.#generation) {
          this.#emit('engine-status', status);
        }
      },
      () => {
        void this.#initialize();
      },
      (sound) => this.#emit('firework-sound', sound)
    );
    this.#engine = engine;
    try {
      const surface = this.renderRoot.querySelector<HTMLElement>('.surface');
      if (!surface) {
        throw new Error('天幕容器尚未就绪。');
      }
      await engine.init(surface);
      if (generation !== this.#generation) {
        await engine.dispose();
        return;
      }
      engine.setMode(this.mode);
      engine.setPaused(this.paused);
    } catch (error) {
      if (generation !== this.#generation) {
        return;
      }
      console.error('Fireworks renderer initialization failed:', error);
      this.#emit('engine-error', error instanceof Error ? error.message : '无法连接图形设备，请尝试 WebGL 模式。');
      await engine.dispose();
    }
  }

  launch(): boolean {
    return this.#engine?.launch() ?? false;
  }
  clear(): void {
    this.#engine?.clear();
  }
  retry(): void {
    void this.#initialize();
  }
  #emit(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
  #pointer(event: PointerEvent): void {
    if (
      event.button !== 0 ||
      this.paused ||
      Math.hypot(event.clientX - this.#pointerStart.x, event.clientY - this.#pointerStart.y) > INTERACTION.dragThreshold
    ) {
      return;
    }
    const target = event.currentTarget;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const rect = target.getBoundingClientRect();
    this.#trigger(event.clientX - rect.left, event.clientY - rect.top, rect);
  }
  #trigger(x: number, y: number, rect: DOMRect): void {
    this.#emit('audio-activate');
    if (!this.#engine?.pointer({ x: x / rect.width, y: y / rect.height }, rect)) {
      this.#emit('stage-busy');
      return;
    }
    this.marker = { x, y };
    window.clearTimeout(this.#markerTimer);
    this.#markerTimer = window.setTimeout(() => {
      this.marker = undefined;
    }, INTERACTION.markerDuration);
  }
  override render() {
    return html`<div
        class="surface"
        role="button"
        tabindex="0"
        aria-label="烟花夜空，点击或按回车在附近燃放烟花"
        @pointerdown=${(event: PointerEvent) => {
          this.#pointerStart = { x: event.clientX, y: event.clientY };
        }}
        @pointerup=${this.#pointer}
        @keydown=${(event: KeyboardEvent) => {
          if (event.key === 'Enter' && !this.paused) {
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            this.#trigger(rect.width / 2, rect.height / 2, rect);
          }
        }}
      ></div>
      ${this.marker ? html`<div class="marker" style=${`left:${this.marker.x}px;top:${this.marker.y}px`}></div>` : ''}`;
  }
}
customElements.define('fireworks-stage', FireworksStage);
