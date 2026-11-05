import { EXPLOSION, GOLDEN_ANGLE, SHAPE, SHAPE_COMPOSITION, TAU } from '@/constant.js';
import type { Pattern } from './settings.js';

export function composePatterns(selected: Pattern[]): Exclude<Pattern, 'mixed'>[] {
  if (!selected.includes('mixed')) {
    return selected.filter((pattern): pattern is Exclude<Pattern, 'mixed'> => pattern !== 'mixed');
  }
  const count =
    SHAPE_COMPOSITION.randomMin +
    Math.floor(Math.random() * (SHAPE_COMPOSITION.randomMax - SHAPE_COMPOSITION.randomMin + 1));
  const pool = [...EXPLOSION.patterns];
  const patterns: Exclude<Pattern, 'mixed'>[] = [];
  while (patterns.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [pattern] = pool.splice(index, 1);
    if (!pattern) {
      throw new Error('随机形态候选池已耗尽。');
    }
    patterns.push(pattern);
  }
  return patterns;
}

/** Initial velocity distributions give each shape a distinct silhouette, on either backend. */
export function shapeVelocity(
  pattern: Exclude<Pattern, 'mixed'>,
  index: number,
  count: number,
  speed: number
): [number, number, number] {
  const fraction = (index + 0.5) / count;
  const angle = fraction * TAU;
  const z = 1 - 2 * fraction;
  const radial = Math.sqrt(1 - z * z);
  const sphere: [number, number, number] = [
    Math.cos(index * GOLDEN_ANGLE) * radial,
    Math.sin(index * GOLDEN_ANGLE) * radial,
    z
  ];
  let direction: [number, number, number];
  switch (pattern) {
    case 'ring':
      direction = [Math.cos(angle), Math.sin(angle), 0];
      break;
    case 'heart': {
      const y = SHAPE.heartY.reduce((sum, coefficient, i) => sum + coefficient * Math.cos((i + 1) * angle), 0);
      direction = [(SHAPE.heartX * Math.sin(angle) ** 3) / SHAPE.heartScale, y / SHAPE.heartScale, 0];
      break;
    }
    case 'star': {
      const vertices = SHAPE.starPoints * 2;
      const segment = fraction * vertices;
      const a = Math.floor(segment);
      const b = (a + 1) % vertices;
      const blend = segment - a;
      const r1 = a % 2 ? SHAPE.starInnerRadius : 1;
      const r2 = b % 2 ? SHAPE.starInnerRadius : 1;
      direction = [
        Math.sin((a / vertices) * TAU) * r1 * (1 - blend) + Math.sin((b / vertices) * TAU) * r2 * blend,
        Math.cos((a / vertices) * TAU) * r1 * (1 - blend) + Math.cos((b / vertices) * TAU) * r2 * blend,
        0
      ];
      break;
    }
    case 'flower': {
      const radius = SHAPE.flowerBase + SHAPE.flowerAmplitude * Math.cos(SHAPE.flowerPetals * angle);
      direction = [Math.cos(angle) * radius, Math.sin(angle) * radius, 0];
      break;
    }
    case 'chrysanthemum': {
      const ray = ((index % SHAPE.chrysanthemumRays) / SHAPE.chrysanthemumRays) * TAU;
      const layer =
        ((Math.floor(index / SHAPE.chrysanthemumRays) % SHAPE.chrysanthemumLayers) + 1) / SHAPE.chrysanthemumLayers;
      direction = [Math.cos(ray) * layer, Math.sin(ray) * layer, z * SHAPE.saturnTilt];
      break;
    }
    case 'peony':
      direction = scaleVector(sphere, index % 2 ? 1 : SHAPE.peonyInner);
      break;
    case 'palm': {
      const branch = index % SHAPE.palmBranches;
      const ray = (branch / (SHAPE.palmBranches - 1)) * Math.PI;
      const length = SHAPE.palmSpread + (1 - SHAPE.palmSpread) * fraction;
      direction = [Math.cos(ray) * length, Math.sin(ray) * length, z * SHAPE.palmSpread];
      break;
    }
    case 'spiral': {
      const ray = angle * SHAPE.spiralTurns + (index % SHAPE.spiralArms) * Math.PI;
      direction = [Math.cos(ray) * fraction, Math.sin(ray) * fraction, z * SHAPE.saturnTilt];
      break;
    }
    case 'saturn':
      direction =
        index % 2
          ? scaleVector(sphere, SHAPE.saturnInner)
          : [Math.cos(angle) * SHAPE.saturnRing, Math.sin(angle) * SHAPE.saturnTilt, Math.sin(angle)];
      break;
    case 'butterfly': {
      const radius =
        (Math.exp(Math.cos(angle)) - 2 * Math.cos(4 * angle) - Math.sin(angle / 12) ** 5) / SHAPE.butterflyScale;
      direction = [Math.sin(angle) * radius, Math.cos(angle) * radius, 0];
      break;
    }
    case 'crossette': {
      const ray =
        ((index % SHAPE.crossetteArms) / SHAPE.crossetteArms) * TAU +
        Math.sin(index * GOLDEN_ANGLE) * SHAPE.crossetteSpread;
      direction = [Math.cos(ray) * fraction, Math.sin(ray) * fraction, 0];
      break;
    }
    case 'waterfall':
      direction = [z * SHAPE.waterfallWidth, fraction * SHAPE.waterfallHeight, Math.sin(angle) * SHAPE.palmSpread];
      break;
    case 'galaxy': {
      const ray = angle * SHAPE.galaxyTurns + ((index % SHAPE.galaxyArms) / SHAPE.galaxyArms) * TAU;
      direction = [Math.cos(ray) * fraction, Math.sin(ray) * fraction * SHAPE.saturnTilt, z * SHAPE.palmSpread];
      break;
    }
    default:
      direction = sphere;
  }
  return scaleVector(direction, speed);
}

function scaleVector(vector: [number, number, number], scale: number): [number, number, number] {
  return [vector[0] * scale, vector[1] * scale, vector[2] * scale];
}
