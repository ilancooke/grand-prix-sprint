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
  await page.getByRole('button', { name: 'Start Race' }).click();
  await expect(page.locator('#hud')).toBeVisible();
  expect(errors).toEqual([]);
  expect(externalRequests).toEqual([]);
});

test('focus loss clears held input and requires explicit resume', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Race' }).click();
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
  await page.getByRole('button', { name: 'Start Race' }).click();
  await page.clock.runFor(3100);
  await page.keyboard.down('w');
  await page.clock.runFor(1000);
  const distance = await page.locator('#distance').textContent();
  await page.clock.fastForward(5000);
  await expect(page.getByRole('heading', { name: 'PAUSED' })).toBeVisible();
  await expect(page.locator('#distance')).toHaveText(distance ?? '');
  await page.getByRole('button', { name: 'Resume race' }).click();
  await page.clock.runFor(3100);
  await expect(page.locator('#pause')).toBeHidden();
  await page.keyboard.up('w');
});


test('every driving alias steers the road while accelerating, coasts and brakes', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.keyboard.press('Enter');
  await page.clock.runFor(3100);
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
      // M2 barriers and grandstands also use blue-gray. Identify the actual
      // two asphalt colors so their clipped silhouettes cannot bias the sample.
      if ((red === 82 && green === 97 && blue === 106) ||
          (red === 78 && green === 92 && blue === 101)) roadPixels.push(x);
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


test('both verges slow the car and steering permits a return to asphalt', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.keyboard.press('Enter');
  await page.clock.runFor(8100);
  // Let the new grid traffic clear before measuring isolated verge handling.
  const speed = async (): Promise<number> => Number(await page.locator('#speed').textContent());
  for (const [outward, inward] of [['d', 'a'], ['a', 'd']] as const) {
    await page.keyboard.down('w');
    await page.clock.runFor(2000);
    const approachSpeed = await speed();
    await page.keyboard.down(outward);
    await page.clock.runFor(3500);
    await page.keyboard.up(outward);
    const vergeSpeed = await speed();
    expect(vergeSpeed).toBeLessThan(approachSpeed - 20);
    const distance = Number(await page.locator('#distance').textContent());
    await page.keyboard.down(inward);
    await page.clock.runFor(2200);
    await page.keyboard.up(inward);
    await page.clock.runFor(500);
    expect(await speed()).toBeGreaterThan(vergeSpeed + 15);
    expect(Number(await page.locator('#distance').textContent())).toBeGreaterThan(distance);
    await page.keyboard.up('w');
    // A fresh ordinary start keeps each side's check on the opening straight.
    await page.reload();
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    await page.keyboard.press('Enter');
    await page.clock.runFor(8100);
  }
});


test('three distinct opponents move in the chase view and freeze with the paused field', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const colors = async (): Promise<number[]> => page.locator('#race-view').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    const palettes = [[41, 186, 219], [245, 197, 71], [181, 133, 237]];
    return palettes.map((color) => {
      let pixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] === color[0] && data[i + 1] === color[1] && data[i + 2] === color[2]) pixels++;
      }
      return pixels;
    });
  });
  await page.keyboard.press('Enter');
  await page.clock.runFor(3100);
  const seen = [0, 0, 0];
  const samples: number[][] = [];
  // A two-row grid can occlude a rear car. Review palette motion as the
  // stopped player watches the whole field pass, rather than assuming all
  // three silhouettes are unobscured in one arbitrarily selected frame.
  for (let sample = 0; sample < 20; sample++) {
    await page.clock.runFor(400);
    const pixels = await colors();
    samples.push(pixels);
    for (let i = 0; i < 3; i++) seen[i] = Math.max(seen[i]!, pixels[i]!);
    if (sample >= 4 && seen.every((count) => count > 5) && pixels.some((count) => count > 5)) break;
  }
  for (const pixels of seen) expect(pixels).toBeGreaterThan(5);
  for (let i = 0; i < 3; i++) expect(new Set(samples.map((pixels) => pixels[i])).size).toBeGreaterThan(1);
  await page.keyboard.press('p');
  // Let the paused renderer settle from its interpolated frame to the frozen snapshot.
  await page.clock.runFor(32);
  const paused = await colors();
  await page.clock.runFor(3000);
  expect(await colors()).toEqual(paused);
  await page.keyboard.press('p');
  await page.clock.runFor(1000);
  expect(await colors()).not.toEqual(paused);
});
