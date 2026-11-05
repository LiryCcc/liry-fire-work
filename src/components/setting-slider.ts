import { SLIDER_DEFAULTS } from '@/constant.js';
import { shared } from '@/ui/shared.js';
import { LitElement, css, html } from 'lit';

export class SettingSlider extends LitElement {
  static override properties = {
    label: { type: String },
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    suffix: { type: String }
  };
  declare label: string;
  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare suffix: string;

  constructor() {
    super();
    this.label = '';
    this.value = SLIDER_DEFAULTS.value;
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
      .label {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 12px;
        margin-bottom: 9px;
      }
      label {
        font-size: 13px;
        color: #c6c9d4;
      }
      output {
        font:
          500 16px/1.3 'SFMono-Regular',
          Consolas,
          monospace;
        color: #f2cf9d;
      }
      output small {
        font: 11px system-ui;
        color: #7e8598;
        margin-left: 4px;
      }
      input {
        display: block;
        width: 100%;
        height: 28px;
        margin: 0;
        appearance: none;
        background: transparent;
        cursor: pointer;
        touch-action: pan-y;
      }
      input::-webkit-slider-runnable-track {
        height: 3px;
        border-radius: 3px;
        background: linear-gradient(to right, #e8b575 var(--fill), #2b3042 var(--fill));
      }
      input::-webkit-slider-thumb {
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #f6cc93;
        margin-top: -5.5px;
        border: 3px solid #302a29;
        box-shadow: 0 0 0 1px #c69762;
      }
      input::-moz-range-track {
        height: 3px;
        border-radius: 3px;
        background: #2b3042;
      }
      input::-moz-range-progress {
        height: 3px;
        background: #e8b575;
      }
      input::-moz-range-thumb {
        width: 11px;
        height: 11px;
        border-radius: 50%;
        background: #f6cc93;
        border: 2px solid #302a29;
      }
      .bounds {
        display: flex;
        justify-content: space-between;
        color: #616a80;
        font-size: 10px;
        font-variant-numeric: tabular-nums;
        margin-top: 1px;
      }
      @media (pointer: coarse) {
        input {
          height: 36px;
        }
        input::-webkit-slider-thumb {
          width: 20px;
          height: 20px;
          margin-top: -8.5px;
        }
      }
    `
  ];

  override render() {
    const decimals =
      this.step < 1
        ? this.step < SLIDER_DEFAULTS.fineStep
          ? SLIDER_DEFAULTS.fineDecimals
          : SLIDER_DEFAULTS.decimals
        : 0;
    return html` <div class="label">
        <label for="range">${this.label}</label
        ><output for="range">${this.value.toFixed(decimals)}<small>${this.suffix}</small></output>
      </div>
      <input
        id="range"
        type="range"
        min=${this.min}
        max=${this.max}
        step=${this.step}
        .value=${String(this.value)}
        style=${`--fill: ${((this.value - this.min) / (this.max - this.min)) * 100}%`}
        @input=${(event: InputEvent) => {
          const input = event.currentTarget;
          if (!(input instanceof HTMLInputElement) || !Number.isFinite(input.valueAsNumber)) {
            return;
          }
          this.dispatchEvent(
            new CustomEvent('value-change', {
              detail: input.valueAsNumber,
              bubbles: true,
              composed: true
            })
          );
        }}
      />
      <div class="bounds" aria-hidden="true">
        <span>${this.min}${this.suffix}</span><span>${this.max}${this.suffix}</span>
      </div>`;
  }
}
customElements.define('setting-slider', SettingSlider);
