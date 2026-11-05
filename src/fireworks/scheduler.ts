import { AUTOMATIC_FOCUS, SCHEDULER } from '@/constant.js';
import { focusedTargets, skyTargets } from './distribution.js';
import type { FireworksSettings, Mode } from './settings.js';
import { sampleRange } from './settings.js';

export interface Target {
  x: number;
  y: number;
}
export interface Launch {
  at: number;
  target: Target;
  settings: FireworksSettings;
  source: 'manual' | 'auto' | 'pointer';
}

/** One animation clock drives all launches; hidden tabs never accumulate timers. */
export class LaunchScheduler {
  #queue: Launch[] = [];
  #nextAuto = 0;
  #mode: Mode = 'manual';
  #focusPoints: Target[] = [];
  #focusBatch = 0;
  #aspect = 1;
  readonly maxPending = SCHEDULER.maxPending;

  get pending(): number {
    return this.#queue.length;
  }

  setMode(mode: Mode, now: number): void {
    this.#mode = mode;
    this.#nextAuto = now;
    if (mode === 'manual') {
      this.#queue = this.#queue.filter((launch) => launch.source !== 'auto');
    }
  }

  setAspect(aspect: number): void {
    this.#aspect = aspect;
  }

  #automaticTargets(count: number): Target[] {
    if (this.#focusBatch % AUTOMATIC_FOCUS.refreshBatches === 0 || !this.#focusPoints.length) {
      this.#focusPoints = skyTargets(AUTOMATIC_FOCUS.pointCount);
    }
    const center = this.#focusPoints[this.#focusBatch % this.#focusPoints.length];
    if (!center) {
      throw new Error('自动燃放缺少重点位置。');
    }
    this.#focusBatch++;
    return focusedTargets(count, center, this.#aspect);
  }

  batch(now: number, settings: FireworksSettings, source: Launch['source'] = 'manual', targets?: Target[]): boolean {
    const count = targets?.length ?? sampleRange(settings.batchCount, true);
    if (this.#queue.length + count > this.maxPending) {
      return false;
    }
    const snapshot = structuredClone(settings);
    const positions = targets ?? (source === 'auto' ? this.#automaticTargets(count) : skyTargets(count));
    for (const [i, target] of positions.entries()) {
      this.#queue.push({
        at: now + (count === 1 ? 0 : (i / (count - 1)) * SCHEDULER.batchWindow),
        target,
        settings: snapshot,
        source
      });
    }
    this.#queue.sort((a, b) => a.at - b.at);
    return true;
  }

  update(now: number, settings: FireworksSettings, emit: (launch: Launch) => void, allowAuto = true): void {
    if (this.#mode === 'auto' && now >= this.#nextAuto) {
      if (allowAuto) {
        this.batch(now, settings, 'auto');
      }
      this.#nextAuto = now + sampleRange(settings.interval);
    }
    let due = 0;
    for (const launch of this.#queue) {
      if (launch.at > now) {
        break;
      }
      emit(launch);
      due++;
    }
    if (due > 0) {
      this.#queue.splice(0, due);
    }
  }

  clear(now: number): void {
    this.#queue = [];
    this.#nextAuto = now + SCHEDULER.resumeDelay;
  }
}

/** Uniform disk sampling, clipped by rejection rather than piling points onto an edge. */
export function pointerTargets(center: Target, radius: number, width: number, height: number, count: number): Target[] {
  const left = Math.max(0, center.x - radius / width);
  const right = Math.min(1, center.x + radius / width);
  const top = Math.max(0, center.y - radius / height);
  const bottom = Math.min(1, center.y + radius / height);
  return Array.from({ length: count }, () => {
    for (let attempt = 0; attempt < SCHEDULER.sampleAttempts; attempt++) {
      const x = left + Math.random() * (right - left);
      const y = top + Math.random() * (bottom - top);
      if (Math.hypot((x - center.x) * width, (y - center.y) * height) <= radius) {
        return { x, y };
      }
    }
    return { ...center };
  });
}
