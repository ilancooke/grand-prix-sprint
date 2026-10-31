import { expect, test } from '@playwright/test';
import { LOCAL_ORIGIN } from '../../config/server';

test('local launch, Start/Enter, combined driving, braking and pause @compat', async ({ page }) => {
  const errors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
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
