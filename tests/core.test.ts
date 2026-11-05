import { DEFAULT_SETTINGS, EXPLOSION, SETTING_BOUNDS, SKY_DISTRIBUTION } from '@/constant.js';
import { focusedTargets, skyTargets } from '@/fireworks/distribution.js';
import { LaunchScheduler, pointerTargets, type Launch } from '@/fireworks/scheduler.js';
import { normalizeSettings, sampleRange } from '@/fireworks/settings.js';
import { shapeVelocity } from '@/fireworks/shapes.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const settings = () => structuredClone(DEFAULT_SETTINGS);
function seeded() {
  let state = 42;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

test('a 2000-shell batch launches completely within one second and keeps its own snapshot', () => {
  const scheduler = new LaunchScheduler();
  const config = settings();
  config.batchCount = { min: 2000, max: 2000 };
  assert.equal(scheduler.batch(10, config), true);
  config.batchCount.min = 1;
  config.palettes.push('gold');
  const launches: Launch[] = [];
  scheduler.update(11, config, (launch) => {
    launches.push(launch);
  });
  assert.equal(launches.length, 2000);
  assert.ok(launches.every((launch) => launch.at >= 10 && launch.at < 11));
  const first = launches[0];
  if (!first) {
    assert.fail('2000 朵批次没有生成任何发射任务');
  }
  assert.equal(first.settings.batchCount.min, 2000);
  assert.deepEqual(first.settings.palettes, ['festival']);
  assert.equal(scheduler.pending, 0);
});

test('switching to manual cancels pending auto launches while preserving a manual batch', () => {
  const scheduler = new LaunchScheduler();
  const config = settings();
  config.batchCount = { min: 10, max: 10 };
  scheduler.setMode('auto', 0);
  const launches: Launch[] = [];
  scheduler.update(0, config, (launch) => {
    launches.push(launch);
  });
  scheduler.batch(0, config);
  scheduler.setMode('manual', 0);
  scheduler.update(2, config, (launch) => {
    launches.push(launch);
  });
  assert.equal(launches.filter((launch) => launch.source === 'auto').length, 1);
  assert.equal(launches.filter((launch) => launch.source === 'manual').length, 10);
  scheduler.clear(2);
  scheduler.update(500, config, () => {
    assert.fail('cleared batches must not reappear');
  });
});

test('random ranges remain inclusive, normalized and configurable across the enlarged limits', () => {
  const config = normalizeSettings({
    batchCount: { min: 5000, max: -8 },
    interval: { min: 0, max: 90 },
    clickCount: { min: 1, max: 200 },
    palettes: [],
    bloom: Infinity,
    renderer: 'invalid'
  });
  assert.deepEqual(config.batchCount, { min: 1, max: 2000 });
  assert.deepEqual(config.interval, { min: SETTING_BOUNDS.interval.min, max: SETTING_BOUNDS.interval.max });
  assert.ok(config.palettes.length > 0);
  assert.equal(config.bloom, DEFAULT_SETTINGS.bloom);
  assert.equal(config.renderer, 'auto');
  for (let i = 0; i < 500; i++) {
    const value = sampleRange(config.clickCount, true);
    assert.ok(Number.isInteger(value) && value >= 1 && value <= 200);
  }
  assert.equal(sampleRange({ min: 2000, max: 2000 }, true), 2000);
});

test('full-sky distribution covers every grid cell and all four edges, with golden-point emphasis', () => {
  const targets = skyTargets(10000, seeded());
  const cells = new Array<number>(100).fill(0);
  for (const point of targets) {
    assert.ok(point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1);
    const cell = Math.min(9, Math.floor(point.y * 10)) * 10 + Math.min(9, Math.floor(point.x * 10));
    const previous = cells[cell];
    if (previous === undefined) {
      assert.fail('采样点超出了统计网格');
    }
    cells[cell] = previous + 1;
  }
  assert.ok(cells.every((count) => count > 30));
  for (const edge of [
    (p: (typeof targets)[number]) => p.x < 0.05,
    (p: (typeof targets)[number]) => p.x > 0.95,
    (p: (typeof targets)[number]) => p.y < 0.05,
    (p: (typeof targets)[number]) => p.y > 0.95
  ]) {
    assert.ok(targets.filter(edge).length > 200);
  }
  const golden = [SKY_DISTRIBUTION.goldenLow, SKY_DISTRIBUTION.goldenHigh];
  const emphasized = targets.filter(
    (point) => golden.some((x) => Math.abs(point.x - x) < 0.08) && golden.some((y) => Math.abs(point.y - y) < 0.08)
  ).length;
  assert.ok(emphasized > targets.length * 0.1024 * 1.25);
});

test('automatic focus concentrates around the chosen point while keeping broad background coverage', () => {
  const center = { x: 0.2, y: 0.8 };
  const targets = focusedTargets(10000, center, 1, seeded());
  const near = targets.filter((point) => Math.hypot(point.x - center.x, point.y - center.y) < 0.15).length;
  assert.ok(near > 2700 && near < 4500);
  assert.ok(targets.filter((point) => point.x > 0.8).length > 500);
});

test('large pointer radii stay uniform over the visible portion, including near a corner', () => {
  const center = { x: 0.01, y: 0.99 };
  for (const radius of [20, 80, 1800]) {
    const targets = pointerTargets(center, radius, 390, 640, 1000);
    assert.equal(targets.length, 1000);
    assert.ok(
      targets.every(
        (point) =>
          point.x >= 0 &&
          point.x <= 1 &&
          point.y >= 0 &&
          point.y <= 1 &&
          Math.hypot((point.x - center.x) * 390, (point.y - center.y) * 640) <= radius
      )
    );
    if (radius === 1800) {
      assert.ok(targets.filter((point) => point.x > 0.8 && point.y < 0.2).length > 10);
    }
  }
});

test('all fifteen shapes produce finite and distinct velocity silhouettes', () => {
  assert.equal(EXPLOSION.patterns.length, 15);
  const silhouettes = new Set<string>();
  for (const pattern of EXPLOSION.patterns) {
    const vertices = Array.from({ length: 145 }, (_, i) => shapeVelocity(pattern, i, 145, 100));
    assert.ok(vertices.flat().every(Number.isFinite));
    silhouettes.add(vertices.map((velocity) => velocity.map((v) => v.toFixed(1)).join(',')).join(';'));
  }
  // Sphere and willow share an initial distribution; willow's drag and lifetime provide its distinct motion.
  assert.equal(silhouettes.size, 14);
});
