import { BREAKPOINT, DEFAULT_SETTINGS } from '@/constant.js';
import type { Mode, NumberRange } from '@/fireworks/settings.js';
import { icon } from '@/ui/icons.js';
import { shared } from '@/ui/shared.js';
import { LitElement, css, html, unsafeCSS } from 'lit';

export class LaunchControls extends LitElement {
  static override properties = {
    mode: { type: String },
    paused: { type: Boolean },
    ready: { type: Boolean },
    count: { attribute: false }
  };
  declare mode: Mode;
  declare paused: boolean;
  declare ready: boolean;
  declare count: NumberRange;
  constructor() {
    super();
    this.mode = 'manual';
    this.paused = false;
    this.ready = false;
    this.count = DEFAULT_SETTINGS.batchCount;
  }
  static override styles = [
    shared,
    css`
      :host {
        display: block;
      }
      .dock {
        display: flex;
        align-items: center;
        gap: 18px;
        padding: 11px 12px 11px 19px;
        border-radius: 18px;
        background: #101625e8;
        border: 1px solid #ffffff12;
        backdrop-filter: blur(20px);
        box-shadow: 0 12px 45px #0006;
      }
      .modes {
        display: flex;
        gap: 4px;
        background: #050914aa;
        border: 1px solid #ffffff06;
        padding: 4px;
        border-radius: 10px;
      }
      .modes button {
        min-height: 39px;
        padding: 0 17px;
        white-space: nowrap;
        background: transparent;
        color: #7e899f;
        border: 0;
        border-radius: 7px;
        font-size: 12px;
      }
      .modes button[aria-pressed='true'] {
        color: #e8d7bb;
        background: #293041;
        box-shadow: 0 1px 5px #0004;
      }
      .launch {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-width: 170px;
        min-height: 50px;
        border: 1px solid #ffdc9c55;
        border-radius: 11px;
        color: #302218;
        background: linear-gradient(120deg, #f3d2a2, #dca864);
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 0 22px #e8ac5f17;
        transition:
          filter 0.2s,
          transform 0.2s;
      }
      .launch:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }
      .launch:active {
        transform: translateY(1px);
      }
      .key {
        border: 1px solid #39281d30;
        border-radius: 4px;
        padding: 2px 4px;
        font-size: 9px;
        font-weight: 400;
      }
      .settings {
        display: none;
        min-width: 46px;
        min-height: 46px;
        border-radius: 10px;
        border: 1px solid #ffffff14;
        background: #ffffff06;
        color: #d3d4de;
      }
      .caption {
        text-align: center;
        margin-top: 13px;
        font-size: 10px;
        letter-spacing: 1px;
        color: #68758c;
      }
      .caption span {
        display: inline-block;
        width: 4px;
        height: 4px;
        background: #bc9460;
        border-radius: 50%;
        margin: 0 7px 2px;
      }
      @media (max-width: ${unsafeCSS(BREAKPOINT.tablet)}px), (max-height: ${unsafeCSS(BREAKPOINT.short)}px) {
        .settings {
          display: inline-grid;
          place-items: center;
        }
      }
      @media (max-width: ${unsafeCSS(BREAKPOINT.mobile)}px) {
        .dock {
          gap: 9px;
          padding: 10px;
          border-radius: 15px;
          flex-wrap: wrap;
        }
        .modes {
          flex: 1 0 calc(100% - 60px);
        }
        .modes button {
          flex: 1;
          min-height: 36px;
        }
        .settings {
          order: 0;
        }
        .launch {
          order: 1;
          flex: 1 0 100%;
          min-height: 48px;
        }
        .key {
          display: none;
        }
        .caption {
          margin-top: 10px;
          font-size: 9px;
        }
      }
      @media (max-height: ${unsafeCSS(BREAKPOINT.landscape)}px) and (min-width: ${unsafeCSS(BREAKPOINT.minLandscapeWidth)}px) {
        .caption {
          display: none;
        }
        .dock {
          padding: 7px 9px;
        }
        .launch {
          min-height: 44px;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .launch {
          transition: none;
        }
      }
    `
  ];
  #event(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
  override render() {
    return html`<div class="dock">
        <div class="modes" role="group" aria-label="燃放模式">
          <button aria-pressed=${this.mode === 'manual'} @click=${() => this.#event('mode-change', 'manual')}>
            手动燃放
          </button>
          <button aria-pressed=${this.mode === 'auto'} @click=${() => this.#event('mode-change', 'auto')}>
            自动燃放
          </button>
        </div>
        <button
          class="launch"
          ?disabled=${!this.ready}
          @click=${() => this.#event(this.mode === 'auto' || this.paused ? 'toggle-pause' : 'launch-batch')}
        >
          ${icon(this.mode === 'auto' ? (this.paused ? 'play' : 'pause') : this.paused ? 'play' : 'spark')}
          ${this.paused ? '继续燃放' : this.mode === 'auto' ? '暂停自动燃放' : '点亮这一刻'}
          ${this.mode === 'manual' && !this.paused ? html`<span class="key">SPACE</span>` : ''}</button
        ><button
          class="settings"
          aria-label="打开烟花设置"
          aria-haspopup="dialog"
          @click=${() => this.#event('open-panel')}
        >
          ${icon('settings')}
        </button>
      </div>
      <div class="caption">
        ${this.paused ? '夜空已暂停' : this.mode === 'auto' ? '让美好不断发生' : `一批 ${this.count.min === this.count.max ? this.count.min : `${this.count.min}–${this.count.max}`} 朵，1 秒内依次升空`}<span
        ></span>轻触夜空，自由绽放
      </div>`;
  }
}
customElements.define('launch-controls', LaunchControls);
