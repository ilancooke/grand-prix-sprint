import { expect, test } from '@playwright/test';
import { installAudioProbe, readAudioProbe } from '../helpers/audio-probe';

test('gesture audio, speed response, mute and interruption cleanup @compat', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await installAudioProbe(page);
  await page.clock.install();
  await page.goto('/');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  expect((await readAudioProbe(page)).contexts).toBe(0);
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await readAudioProbe(page)).state).toBe('running');
  expect((await readAudioProbe(page)).cueHertz).toEqual([659.25]);
  await page.clock.runFor(3100);
  expect((await readAudioProbe(page)).cueHertz).toEqual([659.25, 659.25, 659.25, 1046.5]);
  await page.keyboard.down('w');
  await page.clock.runFor(1000);
  await expect.poll(async () => (await readAudioProbe(page)).engineHertz).toBeGreaterThan(65);
  await expect.poll(async () => (await readAudioProbe(page)).engineGain).toBeGreaterThan(0.05);
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await readAudioProbe(page)).state).toBe('suspended');
  expect((await readAudioProbe(page)).liveNodes).toBe(5);
  await page.locator('#mute').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#countdown')).toBeHidden(); // focused Enter unmutes; no replay
  await expect.poll(async () => (await readAudioProbe(page)).state).toBe('running');
  await page.keyboard.press('p');
  await expect.poll(async () => (await readAudioProbe(page)).state).toBe('suspended');
  // Unmuting in pause cannot revive the engine/context.
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await page.getByRole('button', { name: 'Unmute sound' }).click();
  expect((await readAudioProbe(page)).state).toBe('suspended');
  await page.getByRole('button', { name: 'Resume race' }).click();
  await expect.poll(async () => (await readAudioProbe(page)).state).toBe('running');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect.poll(async () => (await readAudioProbe(page)).state).toBe('suspended');
  expect((await readAudioProbe(page)).contexts).toBe(1);
  expect(errors).toEqual([]);
});

test('muting before Start defers all audio creation until unmuted', async ({ page }) => {
  await installAudioProbe(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Mute sound' }).click();
  await page.getByRole('button', { name: 'Start Race' }).click();
  expect((await readAudioProbe(page)).contexts).toBe(0);
  await page.getByRole('button', { name: 'Unmute sound' }).click();
  await expect.poll(async () => (await readAudioProbe(page)).state).toBe('running');
  expect((await readAudioProbe(page)).contexts).toBe(1);
});

for (const failure of ['constructor', 'resume']) {
  test(`${failure} failure preserves driving, pause and mute fallback`, async ({ page }) => {
    await page.addInitScript((mode) => {
      const NativeAudioContext = window.AudioContext;
      window.AudioContext = class extends NativeAudioContext {
        constructor() {
          if (mode === 'constructor') throw new Error('Audio deliberately unavailable');
          super();
        }
        resume(): Promise<void> { return Promise.reject(new Error('Audio deliberately denied')); }
      };
    }, failure);
    await page.clock.install();
    await page.goto('/');
    await page.getByRole('button', { name: 'Start Race' }).click();
    await expect(page.getByRole('button', { name: 'Sound unavailable' })).toBeDisabled();
    await page.clock.runFor(3100);
    await page.keyboard.down('w');
    await page.clock.runFor(1000);
    expect(Number(await page.locator('#speed').textContent())).toBeGreaterThan(40);
    await page.keyboard.press('p');
    await expect(page.locator('#pause')).toBeVisible();
    await page.getByRole('button', { name: 'Resume race' }).click();
    await page.clock.runFor(32);
    await expect(page.locator('#pause')).toBeHidden();
    await page.keyboard.up('w');
  });
}
