import { SKY_DISTRIBUTION as D, AUTOMATIC_FOCUS as F, TAU } from '@/constant.js';
import type { Target } from './scheduler.js';

/** Full-sky low-discrepancy coverage, mixed with soft golden-point emphasis. */
export function skyTargets(count: number, random: () => number = Math.random): Target[] {
  const offsetX = random();
  const offsetY = random();
  let focus = Math.floor(random() * D.goldenPoints);
  return Array.from({ length: count }, (_, index) => {
    const uniform = { x: (offsetX + index * D.sequenceX) % 1, y: (offsetY + index * D.sequenceY) % 1 };
    if (Math.floor((index + 1) * D.focusWeight) === Math.floor(index * D.focusWeight)) {
      return uniform;
    }
    const center = {
      x: focus % 2 ? D.goldenHigh : D.goldenLow,
      y: Math.floor(focus / 2) % 2 ? D.goldenHigh : D.goldenLow
    };
    focus++;
    for (let attempt = 0; attempt < D.sampleAttempts; attempt++) {
      const radius = Math.sqrt(-2 * Math.log(Math.max(D.logarithmEpsilon, random()))) * D.focusSigma;
      const angle = random() * TAU;
      const target = { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
      if (target.x >= 0 && target.x <= 1 && target.y >= 0 && target.y <= 1) {
        return target;
      }
    }
    return uniform;
  });
}

export function focusedTargets(
  count: number,
  center: Target,
  aspect: number,
  random: () => number = Math.random
): Target[] {
  const background = skyTargets(count, random);
  const focused = Math.round(count * F.ratio);
  return background.map((target, index) => {
    if (Math.floor(((index + 1) * focused) / count) === Math.floor((index * focused) / count)) {
      return target;
    }
    for (let attempt = 0; attempt < F.sampleAttempts; attempt++) {
      const radius = Math.sqrt(-2 * Math.log(Math.max(D.logarithmEpsilon, random()))) * F.sigma;
      const angle = random() * TAU;
      const point = { x: center.x + (Math.cos(angle) * radius) / aspect, y: center.y + Math.sin(angle) * radius };
      if (point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1) {
        return point;
      }
    }
    return { ...center };
  });
}
