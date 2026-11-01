import { expect, test } from '@playwright/test';
import { PERSONAL_BEST_KEY } from '../../src/platform/storage';
import { formatTicks } from '../../src/ui/hud';
import { installKeyboardRace, keyboardRace, startKeyboardRace } from '../helpers/keyboard-race';

test('first launch, schema failures, focused Enter and responsive menu/pause @compat', async ({ page }, testInfo) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'GRAND PRIX SPRINT' })).toBeVisible();
  await expect(page.locator('#menu-record')).toBeHidden();
  await expect(page.locator('#personal-record')).toBeHidden();
  await expect(page.locator('#start')).toBeFocused();
  for (const raw of ['{broken', '{"version":2,"bestLapMilliseconds":12345}', '{"version":1,"bestLapMilliseconds":-1}']) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), { key: PERSONAL_BEST_KEY, raw });
    await page.reload();
    await expect(page.locator('#menu-record')).toBeHidden();
    await expect(page.locator('#saving-status')).not.toContainText('unavailable');
  }
  await page.evaluate((key) => localStorage.setItem(key, '{"version":1,"bestLapMilliseconds":26122.803165}'), PERSONAL_BEST_KEY);
  await page.reload();
  await expect(page.locator('#menu-best')).toHaveText('0:26.122');
  // Layout captures can take longer than the intentional stall threshold on
  // a software-rendered VM. Advance only the explicit schedule from here.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  for (const viewport of [{ width: 960, height: 720 }, { width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    const fits = await page.evaluate(() => {
      const game = document.querySelector('.game')!.getBoundingClientRect();
      const panel = document.querySelector('#menu .panel')!.getBoundingClientRect();
      return panel.top >= game.top && panel.bottom <= game.bottom && document.documentElement.scrollWidth <= innerWidth;
    });
    expect(fits).toBe(true);
    await expect(page.locator('#mute')).toBeInViewport({ ratio: 1 });
    await page.screenshot({ path: testInfo.outputPath(`menu-${viewport.width}.png`) });
  }
  await page.locator('#start').focus();
  expect(await page.locator('#start').evaluate((node) => node.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Enter');
  await page.clock.runFor(500);
  await page.screenshot({ path: testInfo.outputPath('countdown.png') });
  await page.clock.runFor(2700);
  await expect(page.locator('#menu')).toBeHidden();
  const scroll = await page.evaluate(() => scrollY);
  await page.keyboard.down('ArrowUp');
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(200);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('ArrowLeft');
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  for (const width of [960, 1280, 1920]) {
    await page.setViewportSize({ width, height: width === 960 ? 720 : width === 1280 ? 800 : 1080 });
    await page.clock.runFor(32);
    await page.screenshot({ path: testInfo.outputPath(`hud-${width}.png`) });
    await page.keyboard.press('p');
    await expect(page.locator('#resume')).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`pause-${width}.png`) });
    await page.keyboard.press('Enter');
  }
  await page.keyboard.press('p');
  await expect(page.locator('#resume')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#pause')).toBeHidden();
});

test('a slower valid lap keeps the previous personal record distinct from race best', async ({ page }) => {
  test.setTimeout(60000);
  const { frames, state, firstLapFrames } = keyboardRace();
  await page.clock.install();
  await installKeyboardRace(page, frames);
  await page.goto('/');
  // Valid schema with a faster prior record; the actual driven lap is slower.
  await page.evaluate((key) => localStorage.setItem(key, '{"version":1,"bestLapMilliseconds":20000}'), PERSONAL_BEST_KEY);
  await page.reload();
  await startKeyboardRace(page);
  await page.clock.runFor(firstLapFrames * 16);
  await expect(page.locator('#best-lap')).toHaveText(formatTicks(state.progress[0]!.lapTicks[0]!));
  await expect(page.locator('#personal-best')).toHaveText('0:20.000');
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).bestLapMilliseconds, PERSONAL_BEST_KEY)).toBe(20000);
});

test('denied writes retain a session record, visible fallback and playable pause/resume', async ({ page }) => {
  test.setTimeout(60000);
  const { frames, state, firstLapFrames } = keyboardRace();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install();
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'QuotaExceededError'); };
  });
  await installKeyboardRace(page, frames);
  await page.goto('/');
  await startKeyboardRace(page);
  await page.clock.runFor(firstLapFrames * 16);
  await expect(page.locator('#lap')).toHaveText('2/3');
  await expect(page.locator('#personal-best')).toHaveText(formatTicks(state.progress[0]!.lapTicks[0]!));
  await expect(page.locator('#saving-status')).toContainText('Saving unavailable');
  expect(await page.evaluate((key) => localStorage.getItem(key), PERSONAL_BEST_KEY)).toBeNull();
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.locator('#pause')).toBeHidden();
  expect(errors).toEqual([]);
});

test('denied storage getter does not block start or pause/resume', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get: () => { throw new DOMException('Blocked', 'SecurityError'); } });
  });
  await page.clock.install();
  await page.goto('/');
  await expect(page.locator('#saving-status')).toContainText('Saving unavailable');
  await expect(page.locator('#menu-record')).toBeHidden();
  await page.keyboard.press('Enter');
  await page.clock.runFor(3200);
  await page.keyboard.down('w');
  await page.clock.runFor(1000);
  expect(Number(await page.locator('#speed').textContent())).toBeGreaterThan(0);
  await page.keyboard.up('w');
  await page.keyboard.press('p');
  await page.keyboard.press('Enter');
  await expect(page.locator('#pause')).toBeHidden();
  expect(errors).toEqual([]);
});
