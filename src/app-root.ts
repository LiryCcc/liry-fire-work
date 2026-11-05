import { LitElement, html, type PropertyValues } from 'lit';
import { FireworksAudio } from './audio/fireworks-audio.js';
import type { AudioState, FireworkSound } from './audio/types.js';
import './components/fireworks-controls.js';
import { FireworksStage } from './components/fireworks-stage.js';
import './components/fireworks-toolbar.js';
import './components/launch-controls.js';
import { DRAWER_QUERY, INTERACTION, RENDERER_QUERY_KEY, WEBGL_QUERY_VALUE } from './constant.js';
import {
  INITIAL_STATUS,
  loadSettings,
  normalizeSettings,
  saveSettings,
  type EngineStatus,
  type FireworksSettings,
  type Mode
} from './fireworks/settings.js';
import { appStyles } from './ui/app-styles.js';
import { shared } from './ui/shared.js';

export class AppRoot extends LitElement {
  static override properties = {
    settings: { state: true },
    mode: { state: true },
    paused: { state: true },
    status: { state: true },
    panelOpen: { state: true },
    notice: { state: true },
    audioState: { state: true }
  };
  static override styles = [shared, appStyles];
  declare settings: FireworksSettings;
  declare mode: Mode;
  declare paused: boolean;
  declare status: EngineStatus;
  declare panelOpen: boolean;
  declare notice: string;
  declare audioState: AudioState;
  readonly #audio = new FireworksAudio(
    (state) => {
      this.audioState = state;
    },
    (message) => this.#notify(message)
  );
  #toastTimer = 0;
  readonly #drawerQuery = matchMedia(DRAWER_QUERY);
  readonly #onLayout = (): void => {
    if (!this.#drawerQuery.matches) {
      this.panelOpen = false;
    }
  };

  constructor() {
    super();
    this.settings = loadSettings();
    if (new URLSearchParams(location.search).get(RENDERER_QUERY_KEY) === WEBGL_QUERY_VALUE) {
      this.settings.renderer = 'webgl';
    }
    this.mode = 'manual';
    this.paused = false;
    this.status = { ...INITIAL_STATUS };
    this.panelOpen = false;
    this.notice = '';
    this.audioState = 'idle';
  }

  override connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener('keydown', this.#onKey);
    this.#drawerQuery.addEventListener('change', this.#onLayout);
  }
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#audio.dispose();
    window.removeEventListener('keydown', this.#onKey);
    this.#drawerQuery.removeEventListener('change', this.#onLayout);
    window.clearTimeout(this.#toastTimer);
  }
  override updated(changes: PropertyValues<this>): void {
    if (changes.has('settings') || changes.has('paused')) {
      this.#audio.configure(this.settings, this.paused);
    }
  }
  get #stage(): FireworksStage | null {
    return this.renderRoot.querySelector<FireworksStage>('fireworks-stage');
  }

  #notify(message: string): void {
    this.notice = message;
    window.clearTimeout(this.#toastTimer);
    this.#toastTimer = window.setTimeout(() => {
      this.notice = '';
    }, INTERACTION.toastDuration);
  }
  #launch(): void {
    this.#audio.unlock();
    this.#audio.say();
    if (!this.status.ready) {
      return;
    }
    if (this.paused) {
      this.paused = false;
      return;
    }
    if (!this.#stage?.launch()) {
      this.#notify('夜空有点热闹，请稍等片刻再点亮。');
    }
  }
  #settingsChange(event: CustomEvent<FireworksSettings>): void {
    const speechWasEnabled = this.settings.speech;
    this.settings = normalizeSettings(event.detail);
    saveSettings(this.settings);
    this.#audio.configure(this.settings, this.paused);
    this.#audio.unlock();
    if (this.settings.speech && !speechWasEnabled) {
      this.#audio.say();
    }
  }
  #closePanel(): void {
    this.panelOpen = false;
    this.renderRoot
      .querySelector('launch-controls')
      ?.shadowRoot?.querySelector<HTMLButtonElement>('.settings')
      ?.focus();
  }
  async #openPanel(): Promise<void> {
    this.panelOpen = true;
    await this.updateComplete;
    this.renderRoot
      .querySelector('fireworks-controls')
      ?.shadowRoot?.querySelector<HTMLButtonElement>('.close')
      ?.focus();
  }
  readonly #onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.panelOpen) {
      this.#closePanel();
      return;
    }
    if (
      event.code !== 'Space' ||
      event.repeat ||
      this.panelOpen ||
      event
        .composedPath()
        .some(
          (target) =>
            target instanceof HTMLElement &&
            (['INPUT', 'SELECT', 'BUTTON', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable)
        )
    ) {
      return;
    }
    event.preventDefault();
    if (this.mode === 'auto') {
      this.paused = !this.paused;
    } else {
      this.#launch();
    }
  };
  async #fullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await this.#stage?.requestFullscreen();
      }
    } catch {
      this.#notify('当前浏览器暂不支持全屏，仍可正常燃放。');
    }
  }

  override render() {
    return html`<div
      class="app"
      @toggle-pause=${() => {
        this.paused = !this.paused;
      }}
      @clear-stage=${() => {
        this.#audio.clear();
        this.#stage?.clear();
        this.#notify('夜空已清空。');
      }}
      @toggle-fullscreen=${() => {
        void this.#fullscreen();
      }}
      @launch-batch=${this.#launch}
      @mode-change=${(event: CustomEvent<Mode>) => {
        this.mode = event.detail;
        this.paused = false;
        this.#audio.configure(this.settings, false);
        this.#audio.unlock();
        this.#audio.say();
      }}
      @open-panel=${() => {
        void this.#openPanel();
      }}
      @close-panel=${this.#closePanel}
      @settings-change=${this.#settingsChange}
      @audio-activate=${() => {
        this.#audio.unlock();
      }}
      @firework-sound=${(event: CustomEvent<FireworkSound>) => this.#audio.play(event.detail, this.mode === 'auto')}
      @toggle-sound=${() => this.#settingsChange(new CustomEvent('settings-change', { detail: { ...this.settings, sound: !this.settings.sound } }))}
    >
      <div class="workspace" ?inert=${this.panelOpen}>
        <header class="app-header">
          <fireworks-toolbar
            .status=${this.status}
            .paused=${this.paused}
            .sound=${this.settings.sound}
          ></fireworks-toolbar>
        </header>
        <main class="theater" aria-label="动态烟花天幕">
          <fireworks-stage
            .settings=${this.settings}
            .mode=${this.mode}
            .paused=${this.paused}
            @engine-loading=${() => {
              this.status = { ...INITIAL_STATUS };
            }}
            @engine-status=${(event: CustomEvent<EngineStatus>) => {
              this.status = event.detail;
            }}
            @engine-error=${(event: CustomEvent<string>) => {
              this.status = { ...this.status, ready: false, error: event.detail };
            }}
            @stage-busy=${() => this.#notify(this.paused ? '先继续动画，再点亮夜空。' : '夜空有点热闹，请稍等片刻。')}
          >
          </fireworks-stage>
        </main>
        <footer class="bottom">
          <launch-controls
            .mode=${this.mode}
            .paused=${this.paused}
            .ready=${this.status.ready}
            .count=${this.settings.batchCount}
          ></launch-controls>
          <div class="message" role="status" aria-live="polite">
            ${this.notice || (!this.status.ready && !this.status.error ? '正在准备天幕与烟花…' : '')}
          </div>
          ${
            this.status.error
              ? html`<div class="error" role="alert">
                  <p>${this.status.error}</p>
                  <button @click=${() => this.#stage?.retry()}>重新连接</button
                  ><button
                    @click=${() => {
                      this.settings = { ...this.settings, renderer: 'webgl' };
                      saveSettings(this.settings);
                    }}
                  >
                    使用 WebGL 2
                  </button>
                </div>`
              : ''
          }
        </footer>
      </div>
      <button
        class=${`scrim ${this.panelOpen ? 'open' : ''}`}
        aria-label="关闭设置遮罩"
        tabindex="-1"
        @click=${this.#closePanel}
      ></button>
      <aside
        class=${`panel ${this.panelOpen ? 'open' : ''}`}
        role=${this.panelOpen ? 'dialog' : 'complementary'}
        aria-modal=${this.panelOpen ? 'true' : 'false'}
        aria-label="烟花设置"
        @keydown=${this.#trapFocus}
      >
        <fireworks-controls
          .settings=${this.settings}
          .status=${this.status}
          .audioState=${this.audioState}
        ></fireworks-controls>
      </aside>
    </div>`;
  }
  #trapFocus(event: KeyboardEvent): void {
    if (!this.panelOpen || event.key !== 'Tab') {
      return;
    }
    const panel = this.renderRoot.querySelector('fireworks-controls')?.shadowRoot;
    if (!panel) {
      return;
    }
    const focusable: HTMLElement[] = [];
    for (const element of panel.querySelectorAll<HTMLElement>('button, select, setting-slider, setting-range')) {
      if (element.tagName === 'SETTING-SLIDER' || element.tagName === 'SETTING-RANGE') {
        focusable.push(...(element.shadowRoot?.querySelectorAll<HTMLInputElement>('input') ?? []));
      } else {
        focusable.push(element);
      }
    }
    const active = event.composedPath()[0];
    if (event.shiftKey && active === focusable[0]) {
      event.preventDefault();
      focusable.at(-1)?.focus();
    } else if (!event.shiftKey && active === focusable.at(-1)) {
      event.preventDefault();
      focusable[0]?.focus();
    }
  }
}
customElements.define('app-root', AppRoot);
