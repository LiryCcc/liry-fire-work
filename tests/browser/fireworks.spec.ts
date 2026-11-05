import type { AppRoot } from '@/../src/app-root.js';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const state = (page: Page) =>
  page.evaluate(() => {
    const app = document.querySelector<AppRoot>('app-root');
    if (!app) {
      throw new Error('应用根组件尚未挂载');
    }
    return app.status;
  });
async function ready(page: Page) {
  await expect.poll(async () => (await state(page)).ready, { timeout: 30000 }).toBe(true);
}

test('manual, pointer, auto, pause, palettes, shapes and WebGL fallback', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto('/');
  await ready(page);
  await page.getByRole('button', { name: '点亮这一刻' }).click();
  await expect.poll(async () => (await state(page)).launched).toBeGreaterThanOrEqual(8);
  await page.waitForTimeout(1100);
  const batch = (await state(page)).launched;
  expect(batch).toBeLessThanOrEqual(12);
  await page
    .getByRole('button', { name: '烟花夜空，点击或按回车在附近燃放烟花', exact: true })
    .click({ position: { x: 150, y: 200 } });
  await expect.poll(async () => (await state(page)).launched).toBeGreaterThanOrEqual(batch + 3);
  await page.getByRole('button', { name: '自动燃放', exact: true }).click();
  await expect.poll(async () => (await state(page)).launched).toBeGreaterThan(batch + 10);
  await page.getByRole('button', { name: '暂停动画', exact: true }).click();
  await expect(page.getByRole('button', { name: '继续动画', exact: true })).toBeVisible();
  const paused = (await state(page)).launched;
  await page.waitForTimeout(1200);
  expect((await state(page)).launched).toBe(paused);
  await page.getByRole('button', { name: '手动燃放', exact: true }).click();
  await page.getByRole('button', { name: '鎏金配色' }).click();
  await expect(page.getByRole('button', { name: '缤纷配色' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '鎏金配色' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: '爱心', exact: true }).click();
  await expect(page.getByRole('button', { name: '爱心', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('渲染引擎', { exact: true }).selectOption('webgl');
  await ready(page);
  await expect.poll(async () => (await state(page)).backend).toBe('WebGL 2');
  await page.getByRole('button', { name: '点亮这一刻' }).click();
  await expect.poll(async () => (await state(page)).launched).toBeGreaterThanOrEqual(8);
  await page.waitForTimeout(1200);
  expect((await state(page)).error).toBe('');
  expect(errors).toEqual([]);
});

test('2000 fireworks are accepted and dispatched without silently lowering the count', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.getByRole('spinbutton', { name: '每批烟花最小值', exact: true }).fill('2000');
  await page.getByRole('spinbutton', { name: '每批烟花最小值', exact: true }).press('Tab');
  await page.getByRole('button', { name: '点亮这一刻' }).click();
  await expect.poll(async () => (await state(page)).launched, { timeout: 15000 }).toBe(2000);
  await page.waitForTimeout(1400);
  expect((await state(page)).ready).toBe(true);
  expect((await state(page)).error).toBe('');
  await page.getByRole('button', { name: '清空夜空' }).click();
  await expect.poll(async () => (await state(page)).active).toBe(0);
});

test('responsive canvas and drawer cover phones, tablets, narrow and wide computers', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  for (const [width, height] of [
    [320, 700],
    [390, 844],
    [844, 390],
    [768, 1024],
    [1024, 768],
    [800, 1280],
    [1280, 800],
    [1920, 1080]
  ] as const) {
    await page.setViewportSize({ width, height });
    const theater = page.getByRole('main', { name: '动态烟花天幕' });
    const box = await theater.boundingBox();
    if (!box) {
      throw new Error('Canvas missing');
    }
    expect(box.width).toBeGreaterThan(250);
    expect(box.height).toBeGreaterThan(100);
    expect(await theater.innerText()).toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const open = page.getByRole('button', { name: '打开烟花设置', exact: true });
    if (width <= 1023 || height <= 550) {
      await open.click();
      await expect(page.getByRole('dialog', { name: '烟花设置' })).toBeVisible();
      await page.getByRole('button', { name: '关闭设置', exact: true }).click();
    } else {
      await expect(open).toBeHidden();
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: '打开烟花设置' }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.workspace')).not.toHaveAttribute('inert', '');
});

test('fullscreen contains only the sky', async ({ page }) => {
  await page.goto('/');
  await ready(page);
  await page.getByRole('button', { name: '切换全屏', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const root = document.fullscreenElement;
        return root?.shadowRoot?.fullscreenElement?.tagName ?? root?.tagName;
      })
    )
    .toBe('FIREWORKS-STAGE');
  await page.keyboard.press('Escape');
});

test('HDR presentation uses a half-float canvas and extended tone mapping', async ({ page }) => {
  // Emulate only the capability signal; this validates configuration, not physical screen luminance.
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = (query) => {
      const result = original(query);
      if (query === '(dynamic-range: high)') {
        Object.defineProperty(result, 'matches', { value: true });
      }
      return result;
    };
  });
  await page.goto('/');
  await ready(page);
  test.skip((await state(page)).backend !== 'WebGPU', 'HDR presentation requires an available WebGPU backend.');
  expect((await state(page)).hdr).toBe(true);
  const configuration = await page.locator('fireworks-stage').evaluate((stage) => {
    const root = stage.shadowRoot;
    if (!root) {
      throw new Error('天幕组件缺少 Shadow DOM');
    }
    const canvas = root.querySelector('canvas');
    if (!canvas) {
      throw new Error('天幕画布尚未挂载');
    }
    const context = canvas.getContext('webgpu');
    if (typeof GPUCanvasContext === 'undefined' || !(context instanceof GPUCanvasContext)) {
      throw new Error('当前天幕没有 WebGPU 上下文');
    }
    return context.getConfiguration();
  });
  expect(configuration?.format).toBe('rgba16float');
  expect(configuration?.toneMapping?.mode).toBe('extended');
  await page.getByRole('button', { name: '点亮这一刻' }).click();
  await expect.poll(async () => (await state(page)).launched).toBeGreaterThanOrEqual(8);
  expect((await state(page)).error).toBe('');
});
