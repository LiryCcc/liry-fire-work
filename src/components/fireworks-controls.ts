import type { AudioState } from '@/audio/types.js';
import {
  BREAKPOINT,
  PALETTE_OPTIONS,
  PATTERN_OPTIONS,
  QUALITY_OPTIONS,
  RENDERER_OPTIONS,
  SETTING_BOUNDS
} from '@/constant.js';
import type { NumberRange } from '@/fireworks/settings.js';
import { DEFAULT_SETTINGS, INITIAL_STATUS, type EngineStatus, type FireworksSettings } from '@/fireworks/settings.js';
import { icon } from '@/ui/icons.js';
import { shared } from '@/ui/shared.js';
import { LitElement, css, html, unsafeCSS } from 'lit';
import './audio-controls.js';
import './setting-range.js';
import './setting-slider.js';

export class FireworksControls extends LitElement {
  static override properties = {
    settings: { attribute: false },
    status: { attribute: false },
    audioState: { type: String }
  };
  declare settings: FireworksSettings;
  declare status: EngineStatus;
  declare audioState: AudioState;

  constructor() {
    super();
    this.audioState = 'idle';
    this.settings = { ...DEFAULT_SETTINGS };
    this.status = { ...INITIAL_STATUS };
  }

  static override styles = [
    shared,
    css`
      :host {
        display: block;
      }
      .heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 25px 24px 20px;
        border-bottom: 1px solid #ffffff0d;
      }
      .eyebrow {
        font-size: 10px;
        letter-spacing: 2px;
        color: #8a91a4;
        margin-bottom: 7px;
      }
      h2 {
        font-weight: 500;
        font-size: 17px;
        margin: 0;
        letter-spacing: 1px;
      }
      .close {
        display: none;
        border: 0;
        border-radius: 10px;
        background: #ffffff08;
        width: 44px;
        height: 44px;
      }
      section {
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
        margin: 0 0 20px;
        letter-spacing: 1px;
      }
      h3 span {
        color: #bd9664;
        font: 10px monospace;
      }
      setting-slider + setting-slider,
      setting-range + setting-range {
        margin-top: 18px;
      }
      .hint {
        color: #737c92;
        font-size: 11px;
        line-height: 1.8;
        margin: 12px 0 0;
      }
      .palettes {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 7px;
        margin-bottom: 21px;
      }
      .palette {
        background: #ffffff03;
        border: 1px solid #ffffff0c;
        border-radius: 9px;
        padding: 10px 0 8px;
        min-height: 57px;
        font-size: 10px;
        color: #8e96a9;
      }
      .palette[aria-pressed='true'] {
        border-color: #d5a46c88;
        background: #e6ad6410;
        color: #eccca3;
      }
      .dots {
        display: flex;
        justify-content: center;
        margin-bottom: 8px;
      }
      .dots i {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        margin: 0 -1px;
        box-shadow: 0 0 7px #ffffff17;
      }
      .label {
        font-size: 12px;
        color: #a7aec0;
        margin-bottom: 10px;
      }
      .patterns {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 5px;
      }
      .patterns button {
        font-size: 11px;
        background: #ffffff04;
        color: #939caf;
        border: 1px solid #ffffff09;
        border-radius: 7px;
        min-height: 38px;
      }
      .patterns button[aria-pressed='true'] {
        background: #e4b97d14;
        color: #f3c990;
        border-color: #b68b5040;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .row label,
      .row strong {
        font-size: 12px;
        font-weight: 400;
        color: #c6c9d4;
      }
      .row small {
        display: block;
        font-size: 10px;
        color: #707c92;
        margin-top: 5px;
      }
      select {
        color: #c8cedd;
        background: #1a2031;
        border: 1px solid #ffffff12;
        border-radius: 7px;
        min-height: 36px;
        padding: 0 8px;
        font-size: 11px;
      }
      .switch {
        width: 38px;
        min-height: 44px;
        border: 0;
        padding: 0;
        background: none;
        position: relative;
      }
      .switch::before {
        content: '';
        display: block;
        width: 36px;
        height: 20px;
        border-radius: 12px;
        background: #30374a;
        transition: background 0.2s;
      }
      .switch::after {
        content: '';
        width: 14px;
        height: 14px;
        background: #abb2c0;
        border-radius: 50%;
        position: absolute;
        top: 15px;
        left: 3px;
        transition: transform 0.2s;
      }
      .switch[aria-checked='true']::before {
        background: #b18a58;
      }
      .switch[aria-checked='true']::after {
        transform: translateX(16px);
        background: #fff0da;
      }
      .hdr {
        margin-top: 16px;
      }
      .reset {
        width: calc(100% - 48px);
        margin: 18px 24px 24px;
        border: 1px solid #ffffff0d;
        border-radius: 8px;
        min-height: 40px;
        background: transparent;
        color: #7c869b;
        font-size: 11px;
      }
      button:hover {
        filter: brightness(1.22);
      }
      @media (max-width: ${unsafeCSS(BREAKPOINT.tablet)}px), (max-height: ${unsafeCSS(BREAKPOINT.short)}px) {
        .close {
          display: inline-grid;
          place-items: center;
        }
        .heading {
          position: sticky;
          top: 0;
          background: #101626f5;
          z-index: 1;
          padding-top: 18px;
          padding-bottom: 14px;
        }
        section {
          padding-top: 19px;
          padding-bottom: 19px;
        }
        .patterns button {
          min-height: 44px;
        }
      }
    `
  ];

  #change<K extends keyof FireworksSettings>(key: K, value: FireworksSettings[K]): void {
    this.dispatchEvent(
      new CustomEvent('settings-change', { detail: { ...this.settings, [key]: value }, bubbles: true, composed: true })
    );
  }

  #slider(key: 'bloom' | 'brightness', label: string) {
    const bounds = SETTING_BOUNDS[key];
    return html`<setting-slider
      .label=${label}
      .value=${this.settings[key]}
      .min=${bounds.min}
      .max=${bounds.max}
      .step=${bounds.step}
      .suffix=${bounds.suffix}
      @value-change=${(event: CustomEvent<number>) => this.#change(key, event.detail)}
    ></setting-slider>`;
  }
  #range(key: 'batchCount' | 'interval' | 'clickCount' | 'clickRadius', label: string) {
    const bounds = SETTING_BOUNDS[key];
    return html`<setting-range
      .label=${label}
      .value=${this.settings[key]}
      .min=${bounds.min}
      .max=${bounds.max}
      .step=${bounds.step}
      .suffix=${bounds.suffix}
      @value-change=${(event: CustomEvent<NumberRange>) => this.#change(key, event.detail)}
    ></setting-range>`;
  }
  #palette(id: FireworksSettings['palettes'][number]): void {
    const selected = this.settings.palettes.includes(id);
    const palettes = selected
      ? this.settings.palettes.filter((value) => value !== id)
      : [...this.settings.palettes, id];
    if (palettes.length) {
      this.#change('palettes', palettes);
    }
  }
  #select(event: Event, key: 'quality' | 'renderer'): void {
    const select = event.currentTarget;
    if (!(select instanceof HTMLSelectElement)) {
      return;
    }
    if (key === 'quality') {
      const value = QUALITY_OPTIONS.find((option) => option === select.value);
      if (value) {
        this.#change('quality', value);
      }
    } else {
      const value = RENDERER_OPTIONS.find((option) => option.id === select.value);
      if (value) {
        this.#change('renderer', value.id);
      }
    }
  }
  #pattern(id: FireworksSettings['patterns'][number]): void {
    if (id === 'mixed') {
      this.#change('patterns', ['mixed']);
      return;
    }
    const current = this.settings.patterns.filter((pattern) => pattern !== 'mixed');
    const next = current.includes(id) ? current.filter((pattern) => pattern !== id) : [...current, id];
    this.#change('patterns', next.length ? next : ['mixed']);
  }
  override render() {
    return html`<div class="heading">
        <div>
          <div class="eyebrow">MAKE IT YOURS</div>
          <h2>调一场喜欢的烟花</h2>
        </div>
        <button
          class="close"
          aria-label="关闭设置"
          @click=${() => this.dispatchEvent(new CustomEvent('close-panel', { bubbles: true, composed: true }))}
        >
          ${icon('close')}
        </button>
      </div>
      <section>
        <h3><span>01</span> 燃放节奏</h3>
        ${this.#range('batchCount', '每批烟花')}${this.#range('interval', '自动燃放间隔')}
        <p class="hint">上下限之间随机取值，相同即固定。每批在 1 秒内依次升空。大批量时自动简化粒子细节。</p>
      </section>
      <section>
        <h3><span>02</span> 指尖烟花</h3>
        ${this.#range('clickCount', '点击燃放数量')}${this.#range('clickRadius', '点击扩散范围')}
        <p class="hint">轻触夜空，在指尖附近点亮一簇烟花。</p>
      </section>
      <section>
        <h3><span>03</span> 色彩与形态</h3>
        <div class="label">色彩组合 · 可多选</div>
        <div class="palettes">
          ${PALETTE_OPTIONS.map((palette) => html`<button class="palette" aria-label=${`${palette.name}配色`} aria-pressed=${this.settings.palettes.includes(palette.id)} @click=${() => this.#palette(palette.id)}><span class="dots">${palette.colors.map((color) => html`<i style=${`background:${color}`}></i>`)}</span>${palette.name}</button>`)}
        </div>
        <div class="label">绽放形态 · 可多选叠加</div>
        <div class="patterns">
          ${PATTERN_OPTIONS.map(({ id, name }) => html`<button aria-pressed=${this.settings.patterns.includes(id)} @click=${() => this.#pattern(id)}>${name}</button>`)}
        </div>
      </section>
      <section>
        <h3><span>04</span> 光影表现</h3>
        ${this.#slider('bloom', '柔光强度')}${this.#slider('brightness', '烟花亮度')}
        <div class="row hdr">
          <div>
            <strong>HDR 高动态范围</strong
            ><small
              >${this.status.hdr ? '正在以 HDR 输出高光' : this.status.hdrAvailable ? '屏幕支持 HDR，可开启' : '当前以 SDR 显示，保留光影层次'}</small
            >
          </div>
          <button
            class="switch"
            role="switch"
            aria-label="HDR 高动态范围"
            aria-checked=${this.settings.hdr}
            @click=${() => this.#change('hdr', !this.settings.hdr)}
          ></button>
        </div>
        ${!this.status.floatBuffer ? html`<p class="hint">当前设备使用基础光效，柔光暂不可用。</p>` : ''}
      </section>
      <section>
        <h3><span>05</span> 渲染设置</h3>
        <div class="row">
          <label for="renderer">渲染引擎</label
          ><select
            id="renderer"
            .value=${this.settings.renderer}
            @change=${(event: Event) => this.#select(event, 'renderer')}
          >
            ${RENDERER_OPTIONS.map(({ id, name }) => html`<option value=${id}>${name}</option>`)}
          </select>
        </div>
        <p class="hint">
          ${this.status.ready ? `当前使用 ${this.status.backend} · ${this.status.hdr ? 'HDR' : 'SDR'}` : '正在准备渲染引擎'}。切换引擎会重新连接并清空当前烟花。
        </p>
        <div class="row">
          <label for="quality">画面质量</label
          ><select
            id="quality"
            .value=${this.settings.quality}
            @change=${(event: Event) => this.#select(event, 'quality')}
          >
            <option value="auto">自适应 · 推荐</option>
            <option value="low">流畅优先</option>
            <option value="high">细节优先</option>
          </select>
        </div>
        <p class="hint">自适应模式根据设备性能调整画面细节。</p>
      </section>
      <audio-controls .settings=${this.settings} .state=${this.audioState}></audio-controls>
      <button
        class="reset"
        @click=${() => this.dispatchEvent(new CustomEvent('settings-change', { detail: structuredClone(DEFAULT_SETTINGS), bubbles: true, composed: true }))}
      >
        恢复默认设置
      </button>`;
  }
}
customElements.define('fireworks-controls', FireworksControls);
