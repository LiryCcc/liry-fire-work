import type { AudioState } from '@/audio/types.js';
import { DEFAULT_SETTINGS, SETTING_BOUNDS } from '@/constant.js';
import type { FireworksSettings } from '@/fireworks/settings.js';
import { shared } from '@/ui/shared.js';
import { LitElement, css, html } from 'lit';
import './setting-slider.js';

export class AudioControls extends LitElement {
  static override properties = { settings: { attribute: false }, state: { type: String } };
  declare settings: FireworksSettings;
  declare state: AudioState;
  constructor() {
    super();
    this.settings = structuredClone(DEFAULT_SETTINGS);
    this.state = 'idle';
  }
  static override styles = [
    shared,
    css`
      :host {
        display: block;
        padding: 22px 24px;
        border-bottom: 1px solid #ffffff0b;
      }
      h3 {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 12px;
        font-weight: 500;
        color: #eeeef2;
        margin: 0 0 14px;
        letter-spacing: 1px;
      }
      h3 span {
        color: #bd9664;
        font: 10px monospace;
      }
      .row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .row strong {
        color: #c6c9d4;
        font-size: 12px;
        font-weight: 400;
      }
      .hint {
        font-size: 10px;
        color: #748198;
        line-height: 1.8;
        margin: 5px 0 12px;
      }
      button {
        width: 44px;
        height: 44px;
        border: 0;
        background: none;
        position: relative;
      }
      button::before {
        content: '';
        width: 36px;
        height: 20px;
        border-radius: 12px;
        background: #30374a;
        display: block;
      }
      button::after {
        content: '';
        position: absolute;
        top: 15px;
        left: 7px;
        width: 14px;
        height: 14px;
        background: #abb2c0;
        border-radius: 50%;
        transition: transform 0.2s;
      }
      button[aria-checked='true']::before {
        background: #b18a58;
      }
      button[aria-checked='true']::after {
        background: #fff0da;
        transform: translateX(16px);
      }
      setting-slider {
        margin-top: 12px;
      }
    `
  ];
  #change(key: 'sound' | 'speech' | 'volume', value: boolean | number): void {
    this.dispatchEvent(
      new CustomEvent('settings-change', { detail: { ...this.settings, [key]: value }, bubbles: true, composed: true })
    );
  }
  override render() {
    const bounds = SETTING_BOUNDS.volume;
    return html`<h3><span>06</span> 听见烟花</h3>
      <div class="row">
        <strong>随机烟花音效</strong
        ><button
          role="switch"
          aria-label="随机烟花音效"
          aria-checked=${this.settings.sound}
          @click=${() => this.#change('sound', !this.settings.sound)}
        ></button>
      </div>
      <p class="hint" role="status">
        ${!this.settings.sound ? '音效已关闭' : this.state === 'ready' ? '音效已就绪 · 随机升空、爆炸与噼啪声' : this.state === 'loading' ? '正在准备声音…' : this.state === 'unavailable' ? '当前浏览器无法使用音效' : '首次点击燃放或天幕后启用声音'}
      </p>
      <div class="row">
        <strong>语音播报</strong
        ><button
          role="switch"
          aria-label="语音播报"
          aria-checked=${this.settings.speech}
          @click=${() => this.#change('speech', !this.settings.speech)}
        ></button>
      </div>
      <p class="hint">随机短句轻声播报，自动燃放时偶尔出现。</p>
      <setting-slider
        label="声音音量"
        .value=${this.settings.volume}
        .min=${bounds.min}
        .max=${bounds.max}
        .step=${bounds.step}
        @value-change=${(event: CustomEvent<number>) => this.#change('volume', event.detail)}
      ></setting-slider>`;
  }
}
customElements.define('audio-controls', AudioControls);
