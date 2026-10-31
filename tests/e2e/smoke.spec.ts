import { expect, test } from '@playwright/test';
import { LOCAL_ORIGIN } from '../../config/server';

test('local launch, Start/Enter, combined driving, braking and pause @compat', async ({ page }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== LOCAL_ORIGIN) externalRequests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'GRAND PRIX SPRINT' })).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#hud')).toBeVisible();
  await page.keyboard.down('w');
  await page.keyboard.down('d');
  await expect.poll(async () => Number(await page.locator('#speed').textContent())).toBeGreaterThan(30);
  await page.keyboard.up('d');
  await page.keyboard.up('w');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
  const pausedDistance = await page.locator('#distance').textContent();
  await page.waitForTimeout(350);
  await expect(page.locator('#distance')).toHaveText(pausedDistance ?? '');
  await page.keyboard.press('p');
  await expect(page.locator('#pause')).toBeHidden();
  await page.keyboard.down('ArrowDown');
  await expect(page.locator('#speed')).toHaveText('0');
  await page.keyboard.up('ArrowDown');
  await page.reload();
  await page.getByRole('button', { name: 'Start driving' }).click();
  await expect(page.locator('#hud')).toBeVisible();
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('focus loss clears held input and requires explicit resume', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start driving' }).click();
  await page.keyboard.down('ArrowUp');
  await expect.poll(async () => Number(await page.locator('#speed').textContent())).toBeGreaterThan(40);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
  const distance = await page.locator('#distance').textContent();
  const speed = Number(await page.locator('#speed').textContent());
  await page.waitForTimeout(400);
  await expect(page.locator('#distance')).toHaveText(distance ?? '');
  await page.keyboard.press('Enter');
  await expect(page.locator('#pause')).toBeHidden();
  await expect.poll(async () => Number(await page.locator('#speed').textContent())).toBeLessThan(speed - 2);
  await page.keyboard.up('ArrowUp');
  await page.setViewportSize({ width: 960, height: 720 });
  await expect(page.locator('#race-view')).toBeInViewport();
  await expect(page.locator('#speed')).toBeVisible();
});

test('exceptional frame stall visibly pauses before integrating the gap', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Start driving' }).click();
  await page.clock.runFor(100);
  await page.keyboard.down('w');
  await page.clock.runFor(1000);
  const distance = await page.locator('#distance').textContent();
  await page.clock.fastForward(5000);
  await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
  await expect(page.locator('#distance')).toHaveText(distance ?? '');
  await page.getByRole('button', { name: 'Resume driving' }).click();
  await page.clock.runFor(100);
  await expect(page.locator('#pause')).toBeHidden();
  await page.keyboard.up('w');
});


test('every driving alias steers the road while accelerating, coasts and brakes', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.keyboard.press('Enter');
  await page.clock.runFor(100);
  await page.keyboard.down('w');
  await page.clock.runFor(1000);
  const speed = async (): Promise<number> => Number(await page.locator('#speed').textContent());
  const roadCenter = async (): Promise<number> => page.locator('#race-view').evaluate((element) => {
    // Sample the road above the player on the opening straight. Its blue-gray
    // surface contrasts with the green verge; no game state is exposed for tests.
    const canvas = element as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0, 300, canvas.width, 1).data;
    const roadPixels: number[] = [];
    for (let x = 0; x < canvas.width; x++) {
      const red = pixels[x * 4]!;
      const green = pixels[x * 4 + 1]!;
      const blue = pixels[x * 4 + 2]!;
      if (blue > green && green > red) roadPixels.push(x);
    }
    if (roadPixels.length < 100) throw new Error('Expected visible road surface');
    return (roadPixels[0]! + roadPixels[roadPixels.length - 1]!) / 2;
  });
  for (const [key, direction] of [['a', 1], ['d', -1], ['ArrowLeft', 1], ['ArrowRight', -1]] as const) {
    const beforeCenter = await roadCenter();
    const beforeSpeed = await speed();
    await page.keyboard.down(key);
    await page.clock.runFor(250);
    await page.keyboard.up(key);
    expect(((await roadCenter()) - beforeCenter) * direction).toBeGreaterThan(15);
    expect(await speed()).toBeGreaterThan(beforeSpeed);
  }
  await page.keyboard.up('w');
  const beforeCoasting = await speed();
  await page.clock.runFor(500);
  expect(await speed()).toBeLessThan(beforeCoasting);
  for (const brake of ['s', 'ArrowDown']) {
    await page.keyboard.down(brake);
    await page.clock.runFor(2000);
    expect(await speed()).toBe(0);
    await page.keyboard.up(brake);
    await page.keyboard.down('ArrowUp');
    await page.clock.runFor(1000);
    await page.keyboard.up('ArrowUp');
    expect(await speed()).toBeGreaterThan(50);
  }
});
