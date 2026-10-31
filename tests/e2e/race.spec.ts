import { expect, test } from '@playwright/test';
import { CIRCUIT } from '../../src/content/circuit';
import { createRace, stepRace } from '../../src/game/race';
import { IDLE_INPUT, type DrivingInput } from '../../src/game/types';
import { FixedStepClock } from '../../src/platform/loop';
import { formatTicks } from '../../src/ui/hud';
import { driver } from '../helpers/race-driver';

function keyboardRace() {
  const clock = new FixedStepClock();
  let state = createRace();
  const frames: DrivingInput[] = [];
  for (let frame = 0; frame < 8000 && state.status.kind !== 'results'; frame++) {
    const planned = state.status.kind === 'racing' ? driver(state) : IDLE_INPUT;
    const input = { ...planned, steer: Math.abs(planned.steer) > 0.08 ? Math.sign(planned.steer) : 0 };
    frames.push(input);
    clock.advance(frame * 16, () => { state = stepRace(state, input, CIRCUIT); });
  }
  expect(state.status.kind).toBe('results');
  return { frames, state };
}

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

test('bounded keyboard race reaches frozen results and clean replay without a refresh', async ({ page }) => {
  test.setTimeout(90000);
  const { frames, state } = keyboardRace();
  await page.clock.install();
  // A test-only animation wrapper sends normal keyboard events before each frame.
  // The application receives no state fixture, debug global, or alternate driver.
  await page.addInitScript((inputs) => {
    const raf = window.requestAnimationFrame.bind(window);
    let frame = -1;
    const held = new Set<string>();
    window.addEventListener('test-keyboard-race', () => { frame = 0; });
    window.requestAnimationFrame = (callback) => raf((now) => {
      if (frame >= 0) {
        const input = inputs[frame++];
        const desired = new Set<string>();
        if (input?.accelerate) desired.add('KeyW');
        if (input?.brake) desired.add('KeyS');
        if (input && input.steer < 0) desired.add('KeyA');
        if (input && input.steer > 0) desired.add('KeyD');
        for (const code of held) if (!desired.has(code)) {
          window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true })); held.delete(code);
        }
        for (const code of desired) if (!held.has(code)) {
          window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true })); held.add(code);
        }
      }
      callback(now);
    });
  }, frames);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  // Freeze before activation so real time between protocol calls cannot shift
  // the reference's first frame or any tick-indexed keyboard transition.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('#start')!.click();
    window.dispatchEvent(new Event('test-keyboard-race'));
  });
  await page.clock.runFor(frames.length * 16 + 32);
  await expect(page.getByRole('heading', { name: 'RACE FINISHED' })).toBeVisible();
  await expect(page.locator('#final-position')).toHaveText(`${state.results!.position}/4`);
  await expect(page.locator('#total-time')).toHaveText(formatTicks(state.results!.totalTicks));
  await expect(page.locator('#result-best')).toHaveText(formatTicks(state.results!.bestLapTicks));
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
  expect(errors).toEqual([]);
});
