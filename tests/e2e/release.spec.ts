import { expect, test } from '@playwright/test';
import { installAudioProbe, readAudioProbe } from '../helpers/audio-probe';
import { gameplayListenerCount, installListenerProbe } from '../helpers/listener-probe';
import { installKeyboardRace, keyboardRace, startKeyboardRace } from '../helpers/keyboard-race';
import { formatTicks } from '../../src/ui/hud';

test('repeated pause, blur, hidden, stall and resize preserve clocks and clear held input @compat', async ({ page }) => {
  test.setTimeout(90000);
  await installAudioProbe(page);
  await installListenerProbe(page);
  await page.clock.install();
  await page.goto('/');
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.keyboard.press('Enter');
  await page.clock.runFor(3100);
  const listeners = await gameplayListenerCount(page);
  expect(listeners).toBe(4);
  const frozenHud = () => page.locator('#hud').textContent();
  for (let cycle = 0; cycle < 12; cycle++) {
    await page.keyboard.down('w');
    await page.clock.runFor(500);
    if (cycle % 4 === 0) await page.keyboard.press('p');
    if (cycle % 4 === 1) await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    if (cycle % 4 === 2) await page.evaluate(() => {
      // Exercise the actual hidden-document handler; native tab visibility is
      // environment-dependent in headless engines, so this fixture is explicit.
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    if (cycle % 4 === 3) await page.clock.fastForward(5000);
    await expect(page.locator('#pause')).toBeVisible();
    await page.clock.runFor(32);
    const hud = await frozenHud();
    const speed = Number(await page.locator('#speed').textContent());
    const countdown = await page.locator('#countdown-number').textContent();
    await page.setViewportSize(cycle % 2 ? { width: 960, height: 720 } : { width: 1920, height: 1080 });
    await page.clock.runFor(5000);
    expect(await frozenHud()).toBe(hud);
    await expect(page.locator('#countdown-number')).toHaveText(countdown!);
    await expect.poll(async () => (await readAudioProbe(page)).state).toBe('suspended');
    expect((await readAudioProbe(page)).liveNodes).toBe(5);
    await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); });
    await page.getByRole('button', { name: 'Resume race' }).click();
    await page.clock.runFor(300);
    // W is still physically held: resuming must coast until a new keydown.
    expect(Number(await page.locator('#speed').textContent())).toBeLessThan(speed);
    await page.keyboard.up('w');
    expect(await gameplayListenerCount(page)).toBe(listeners);
    expect((await readAudioProbe(page)).contexts).toBe(1);
    await expect(page.locator('#lap')).toHaveText('1/3');
    await expect(page.locator('#best-lap')).toHaveText('—');
  }
});

test('three complete races reuse listeners and one audio graph through replay', async ({ page }) => {
  test.setTimeout(180000);
  const { frames, state } = keyboardRace();
  await page.clock.install();
  await installKeyboardRace(page, frames);
  await installAudioProbe(page);
  await installListenerProbe(page);
  await page.goto('/');
  await startKeyboardRace(page);
  const listeners = await gameplayListenerCount(page);
  for (let race = 0; race < 3; race++) {
    await page.clock.runFor((frames.length + 2) * 16);
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#total-time')).toHaveText(formatTicks(state.results!.totalTicks));
    await expect(page.locator('#result-best')).toHaveText(formatTicks(state.results!.bestLapTicks));
    expect(await gameplayListenerCount(page)).toBe(listeners);
    expect((await readAudioProbe(page)).contexts).toBe(1);
    await page.getByRole('button', { name: 'Mute sound' }).click();
    expect((await readAudioProbe(page)).liveNodes).toBe(5);
    if (race < 2) {
      await page.getByRole('button', { name: 'Race again' }).click();
      await expect(page.locator('#distance')).toHaveText('-8');
      await expect(page.locator('#lap-time')).toHaveText('0:00.000');
      await expect(page.locator('#best-lap')).toHaveText('—');
      await page.getByRole('button', { name: 'Unmute sound' }).click();
      await page.evaluate(() => window.dispatchEvent(new Event('test-keyboard-race')));
    }
  }
});
