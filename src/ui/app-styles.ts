import { BREAKPOINT } from '@/constant.js';
import { css, unsafeCSS } from 'lit';

export const appStyles = css`
  :host {
    --text: #f3f0e9;
    display: block;
    width: 100%;
    height: 100%;
    color-scheme: dark;
    background: #030610;
  }
  .app {
    height: 100%;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    padding: 18px;
    gap: 18px;
    max-width: 2560px;
    margin: 0 auto;
  }
  .workspace {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 16px;
  }
  .app-header {
    padding: 4px 8px 0;
  }
  .theater {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid #ffffff12;
    border-radius: 18px;
    background: #030610;
    box-shadow: 0 8px 50px #0003;
  }
  .bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 12px 2px;
  }
  launch-controls {
    max-width: 100%;
  }
  .panel {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: linear-gradient(165deg, #131a2b, #0c1220);
    border: 1px solid #ffffff0d;
    border-radius: 18px;
    scrollbar-width: thin;
    scrollbar-color: #353b4a transparent;
  }
  .scrim {
    display: none;
  }
  .message {
    color: #d3b88c;
    font-size: 11px;
    min-height: 15px;
    margin-top: 4px;
    text-align: center;
  }
  .error {
    text-align: center;
    color: #e9bd94;
    font-size: 12px;
  }
  .error p {
    margin: 6px 0;
  }
  .error button {
    color: #efd3a9;
    background: #232b3b;
    border: 1px solid #ffffff15;
    border-radius: 7px;
    min-height: 36px;
    padding: 6px 12px;
    margin: 3px;
  }
  @media (min-width: ${unsafeCSS(BREAKPOINT.wide)}px) {
    .app {
      grid-template-columns: minmax(0, 1fr) 370px;
      padding: 24px;
      gap: 24px;
    }
  }
  @media (max-width: ${unsafeCSS(BREAKPOINT.tablet)}px), (max-height: ${unsafeCSS(BREAKPOINT.short)}px) {
    .app {
      display: block;
      padding: max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right))
        max(10px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left));
    }
    .workspace {
      height: 100%;
      gap: 12px;
    }
    .app-header {
      padding: 0 2px;
    }
    .panel {
      display: none;
      position: fixed;
      z-index: 5;
      bottom: 0;
      right: 0;
      width: min(420px, 100%);
      max-height: 88dvh;
      border-radius: 22px 22px 0 0;
      padding-bottom: max(12px, env(safe-area-inset-bottom));
      box-shadow: 0 -10px 80px #0008;
    }
    .panel.open {
      display: block;
    }
    .scrim.open {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 4;
      background: #0008;
      backdrop-filter: blur(5px);
      border: 0;
      width: 100%;
      height: 100%;
    }
  }
  @media (max-width: ${unsafeCSS(BREAKPOINT.mobile)}px) {
    .app {
      padding-top: max(12px, env(safe-area-inset-top));
      padding-left: max(12px, env(safe-area-inset-left));
      padding-right: max(12px, env(safe-area-inset-right));
    }
    .workspace {
      gap: 10px;
    }
    .theater {
      border-radius: 13px;
    }
    .bottom {
      padding: 0;
    }
    launch-controls {
      width: 100%;
      max-width: 440px;
    }
    .panel {
      width: 100%;
      max-height: 86dvh;
    }
  }
  @media (max-height: ${unsafeCSS(BREAKPOINT.short)}px) {
    .app {
      padding-top: max(8px, env(safe-area-inset-top));
      padding-bottom: max(6px, env(safe-area-inset-bottom));
    }
    .workspace {
      gap: 6px;
    }
    .panel {
      height: 100dvh;
      max-height: 100dvh;
      border-radius: 18px 0 0 18px;
    }
    .message:empty {
      display: none;
    }
  }
`;
