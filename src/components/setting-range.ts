import { SLIDER_DEFAULTS } from '@/constant.js';
import type { NumberRange } from '@/fireworks/settings.js';
import { shared } from '@/ui/shared.js';
import { LitElement, css, html } from 'lit';

export class SettingRange extends LitElement {
  static override properties = {
    label: { type: String },
    value: { attribute: false },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    suffix: { type: String }
  };
  declare label: string;
  declare value: NumberRange;
  declare min: number;
  declare max: number;
  declare step: number;
  declare suffix: string;
  constructor() {
    super();
    this.label = '';
    this.value = { min: SLIDER_DEFAULTS.value, max: SLIDER_DEFAULTS.value };
    this.min = SLIDER_DEFAULTS.min;
    this.max = SLIDER_DEFAULTS.max;
    this.step = SLIDER_DEFAULTS.step;
    this.suffix = '';
  }
  static override styles = [
    shared,
    css`
      :host {
        display: block;
      }
      .heading {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 12px;
      }
      .label {
        font-size: 13px;
        color: #c6c9d4;
      }
      .unit {
        font-size: 10px;
        color: #7e8598;
      }
      .fields {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 15px minmax(0, 1fr);
        align-items: start;
        gap: 7px;
      }
      .dash {
        color: #6f7a92;
        padding-top: 20px;
        text-align: center;
      }
      label {
        display: block;
        color: #78849b;
        font-size: 10px;
      }
      input[type='number'] {
        display: block;
        width: 100%;
        min-height: 40px;
        margin-top: 5px;
        color: #efd0a4;
        background: #050a1690;
        border: 1px solid #ffffff12;
        border-radius: 7px;
        padding: 5px 8px;
        font: 14px monospace;
      }
      input[type='range'] {
        display: block;
        width: 100%;
        min-height: 32px;
        margin: 2px 0 0;
        accent-color: #e6b77b;
        cursor: pointer;
      }
      .allowed {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        color: #657089;
        margin-top: 1px;
      }
    `
  ];
  #change(key: keyof NumberRange, candidate: number): void {
    if (!Number.isFinite(candidate)) {
      return;
    }
    const bounded = Math.min(this.max, Math.max(this.min, candidate));
    const value = { ...this.value, [key]: bounded };
    if (key === 'min' && bounded > value.max) {
      value.max = bounded;
    }
    if (key === 'max' && bounded < value.min) {
      value.min = bounded;
    }
    this.dispatchEvent(new CustomEvent('value-change', { detail: value, bubbles: true, composed: true }));
  }
  #input(event: Event, key: keyof NumberRange): void {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }
    this.#change(key, input.valueAsNumber);
  }
  override render() {
    return html`<div class="heading">
        <span class="label">${this.label}</span
        ><span class="unit">${this.value.min === this.value.max ? '固定值' : '范围内随机'} · ${this.suffix}</span>
      </div>
      <div class="fields">
        ${(['min', 'max'] as const).map(
          (key, index) =>
            html`${index ? html`<span class="dash">—</span>` : ''}
              <div>
                <label
                  >${key === 'min' ? '最小值' : '最大值'}<input
                    type="number"
                    aria-label=${`${this.label}${key === 'min' ? '最小值' : '最大值'}`}
                    min=${this.min}
                    max=${this.max}
                    step=${this.step}
                    .value=${String(this.value[key])}
                    @change=${(event: Event) => this.#input(event, key)} /></label
                ><input
                  type="range"
                  aria-label=${`${this.label}${key === 'min' ? '下限滑块' : '上限滑块'}`}
                  min=${this.min}
                  max=${this.max}
                  step=${this.step}
                  .value=${String(this.value[key])}
                  @input=${(event: Event) => this.#change(key, (event.target as HTMLInputElement).valueAsNumber)}
                />
              </div>`
        )}
      </div>
      <div class="allowed"><span>可选 ${this.min}–${this.max}${this.suffix}</span><span>相同即固定</span></div>`;
  }
}
customElements.define('setting-range', SettingRange);
