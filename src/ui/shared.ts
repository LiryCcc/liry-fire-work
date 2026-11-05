import { css } from 'lit';

export const shared = css`
  :host {
    color: var(--text, #f2f0ec);
    font: inherit;
  }
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  button,
  select,
  input {
    font: inherit;
  }
  button {
    color: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid #f7bb78;
    outline-offset: 4px;
  }
  button {
    touch-action: manipulation;
  }
  svg {
    flex: none;
    vertical-align: middle;
  }
`;
