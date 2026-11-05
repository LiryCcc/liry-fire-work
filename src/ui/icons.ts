import { ICON_PATHS } from '@/constant.js';
import { svg } from 'lit';

export type IconName = keyof typeof ICON_PATHS;

export const icon = (name: IconName) =>
  svg`<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${ICON_PATHS[name]} /></svg>`;
