import { BREAKPOINT } from '@/constant.js';
import { INITIAL_STATUS, type EngineStatus } from '@/fireworks/settings.js';
import { icon } from '@/ui/icons.js';
import { shared } from '@/ui/shared.js';
import { LitElement, css, html, unsafeCSS } from 'lit';

export class FireworksToolbar extends LitElement {
  static override properties = { status: { attribute: false }, paused: { type: Boolean }, sound: { type: Boolean } };
  declare status: EngineStatus;
  declare paused: boolean;
  declare sound: boolean;
  constructor() {
    super();
    this.sound = true;
    this.status = { ...INITIAL_STATUS };
    this.paused = false;
  }
  static override styles = [
    shared,
    css`
      :host {
        display: block;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .mark {
        width: 39px;
        height: 39px;
        display: grid;
        place-items: center;
        color: #e7bd85;
        background: #c79c5c0b;
        border: 1px solid #c79c5c35;
        border-radius: 12px;
      }
      .name {
        font-size: 17px;
        font-weight: 600;
        letter-spacing: 4px;
      }
      .sub {
        font-size: 8px;
        letter-spacing: 2.6px;
        color: #7a859b;
        margin-top: 5px;
      }
      .tools {
        display: flex;
        align-items: center;
        gap: 7px;
      }
      .status {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #8592a9;
        font: 10px monospace;
        margin-right: 10px;
      }
      .status i {
        display: block;
        width: 5px;
        height: 5px;
        background: #83b89a;
        border-radius: 50%;
        box-shadow: 0 0 9px #72c69c4d;
      }
      .badge {
        color: #d0b58e;
        font-size: 9px;
        border: 1px solid #c5a67735;
        padding: 4px 6px;
        border-radius: 5px;
      }
      button {
        display: grid;
        place-items: center;
        background: #101726a8;
        border: 1px solid #ffffff0d;
        border-radius: 10px;
        width: 40px;
        height: 40px;
        color: #a2adc0;
      }
      button:hover {
        color: #f3cca0;
        background: #1e2739;
      }
      @media (max-width: ${unsafeCSS(BREAKPOINT.mobile)}px) {
        .brand {
          gap: 8px;
        }
        .mark {
          width: 34px;
          height: 34px;
          border-radius: 10px;
        }
        .name {
          font-size: 14px;
        }
        .sub {
          font-size: 7px;
          letter-spacing: 1.4px;
        }
        .tools {
          gap: 4px;
        }
        .status {
          margin-right: 3px;
        }
        .backend,
        .fps {
          display: none;
        }
        button {
          width: 36px;
          height: 44px;
          background: transparent;
          border-color: transparent;
        }
        .expand {
          display: none;
        }
      }
    `
  ];
  #action(action: string): void {
    this.dispatchEvent(new CustomEvent(action, { bubbles: true, composed: true }));
  }
  override render() {
    return html`<header>
      <div class="brand">
        <div class="mark">${icon('spark')}</div>
        <div>
          <div class="name">LIRY</div>
          <div class="sub">A LITTLE LIGHT, A LITTLE WONDER</div>
        </div>
      </div>
      <div class="tools">
        <button
          aria-label=${this.sound ? '关闭音效' : '开启音效'}
          title=${this.sound ? '关闭音效' : '开启音效'}
          aria-pressed=${this.sound}
          @click=${() => this.#action('toggle-sound')}
        >
          ${icon(this.sound ? 'sound' : 'mute')}
        </button>
        <div
          class="status"
          aria-label=${`输出模式 ${this.status.hdr ? 'HDR' : 'SDR'}，${this.status.backend || '连接中'}`}
        >
          <i></i><span class="backend">${this.status.backend || '连接中'}</span
          ><span class="badge">${this.status.hdr ? 'HDR' : 'SDR'}</span
          ><span class="fps">${this.status.fps || '—'} FPS</span>
        </div>
        <button
          ?disabled=${!this.status.ready}
          aria-label=${this.paused ? '继续动画' : '暂停动画'}
          title=${this.paused ? '继续动画' : '暂停动画'}
          @click=${() => this.#action('toggle-pause')}
        >
          ${icon(this.paused ? 'play' : 'pause')}
        </button>
        <button
          ?disabled=${!this.status.ready}
          aria-label="清空夜空"
          title="清空夜空"
          @click=${() => this.#action('clear-stage')}
        >
          ${icon('clear')}
        </button>
        <button class="expand" aria-label="切换全屏" title="切换全屏" @click=${() => this.#action('toggle-fullscreen')}>
          ${icon('expand')}
        </button>
      </div>
    </header>`;
  }
}
customElements.define('fireworks-toolbar', FireworksToolbar);
