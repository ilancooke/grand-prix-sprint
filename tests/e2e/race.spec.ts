import { expect, test } from '@playwright/test';
import { formatPosition, formatTicks } from '../../src/ui/hud';
import { installKeyboardRace, keyboardRace, startKeyboardRace } from '../helpers/keyboard-race';
import { PERSONAL_BEST_KEY } from '../../src/platform/storage';

test('countdown locks the grid and all clocks; pause/focus/stall preserve its phase', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Start Race' }).click();
  await page.keyboard.down('w');
  await page.clock.runFor(1100);
  await expect(page.locator('#countdown-number')).toHaveText('2');
  await expect(page.locator('#speed')).toHaveText('0');
  await expect(page.locator('#lap-time')).toHaveText('0:00.000');
  await expect(page.locator('#distance')).toHaveText('-8');
  await page.keyboard.press('p');
  const number = await page.locator('#countdown-number').textContent();
  await page.clock.runFor(5000);
  await expect(page.locator('#pause')).toBeVisible();
  await expect(page.locator('#countdown-number')).toHaveText(number!);
  await page.keyboard.press('Escape');
  await page.clock.runFor(100);
  await expect(page.locator('#countdown')).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.clock.runFor(4000);
  await expect(page.locator('#pause')).toBeVisible();
  await page.getByRole('button', { name: 'Resume race' }).click();
  await page.clock.runFor(100);
  const frozen = await page.locator('#countdown-number').textContent();
  await page.clock.fastForward(5000);
  await expect(page.locator('#pause')).toBeVisible();
  await expect(page.locator('#countdown-number')).toHaveText(frozen!);
  await page.keyboard.press('Enter');
  await page.clock.runFor(2100);
  await expect(page.locator('#countdown')).toBeHidden();
  await expect(page.locator('#speed')).toHaveText('0'); // interruption cleared the original W
  await expect(page.locator('#lap')).toHaveText('1/3');
  await page.keyboard.up('w');
  await page.keyboard.down('w');
  await page.clock.runFor(1000);
  expect(Number(await page.locator('#speed').textContent())).toBeGreaterThan(50);
  await page.keyboard.press('p');
  await page.clock.runFor(32);
  const time = await page.locator('#lap-time').textContent();
  await page.clock.runFor(4000);
  await expect(page.locator('#lap-time')).toHaveText(time!);
});

test('bounded keyboard race reaches frozen results and clean replay without a refresh', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  const { frames, state, firstLapFrames } = keyboardRace();
  await page.clock.install();
  // A test-only animation wrapper sends normal keyboard events before each frame.
  // The application receives no state fixture, debug global, or alternate driver.
  await installKeyboardRace(page, frames);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  // Freeze before activation so real time between protocol calls cannot shift
  // the reference's first frame or any tick-indexed keyboard transition.
  await startKeyboardRace(page);
  await page.clock.runFor(firstLapFrames * 16);
  await expect(page.locator('#lap')).toHaveText('2/3');
  await expect(page.locator('#results')).toBeHidden();
  const firstRecord = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PERSONAL_BEST_KEY);
  expect(firstRecord.bestLapMilliseconds).toBe(state.progress[0]!.lapTicks[0]! * 1000 / 60);
  await page.clock.runFor((frames.length - firstLapFrames) * 16 + 32);
  await expect(page.getByRole('heading', { name: 'RACE FINISHED' })).toBeVisible();
  await expect(page.locator('#final-position')).toHaveText(formatPosition(state.results!.position));
  await expect(page.locator('#total-time')).toHaveText(formatTicks(state.results!.totalTicks));
  await expect(page.locator('#result-best')).toHaveText(formatTicks(state.results!.bestLapTicks));
  for (const width of [960, 1280, 1920]) {
    await page.setViewportSize({ width, height: width === 960 ? 720 : width === 1280 ? 800 : 1080 });
    const fits = await page.evaluate(() => {
      const game = document.querySelector('.game')!.getBoundingClientRect();
      const panel = document.querySelector('#results .panel')!.getBoundingClientRect();
      return panel.top >= game.top && panel.bottom <= game.bottom;
    });
    expect(fits).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`results-${width}.png`) });
  }
  const result = await page.locator('#results').textContent();
  await page.clock.runFor(10000);
  await expect(page.locator('#results')).toHaveText(result!);
  await page.keyboard.press('Enter');
  await page.clock.runFor(500);
  await expect(page.locator('#results')).toBeHidden();
  await expect(page.locator('#countdown-number')).toHaveText('3');
  await expect(page.locator('#distance')).toHaveText('-8');
  await expect(page.locator('#lap-time')).toHaveText('0:00.000');
  await expect(page.locator('#best-lap')).toHaveText('—');
  await expect(page.locator('#lap')).toHaveText('1/3');
  await expect(page.locator('#speed')).toHaveText('0');
  const saved = await page.evaluate((key) => localStorage.getItem(key), PERSONAL_BEST_KEY);
  expect(JSON.parse(saved!).bestLapMilliseconds).toBe(state.results!.bestLapTicks * 1000 / 60);
  await expect(page.locator('#personal-best')).toHaveText(formatTicks(state.results!.bestLapTicks));
  await page.reload();
  await expect(page.locator('#menu-best')).toHaveText(formatTicks(state.results!.bestLapTicks));
  expect(await page.evaluate((key) => localStorage.getItem(key), PERSONAL_BEST_KEY)).toBe(saved);
  expect(errors).toEqual([]);
});
