import { expect, type Page } from '@playwright/test';
import { CIRCUIT } from '../../src/content/circuit';
import { createRace, stepRace } from '../../src/game/race';
import { IDLE_INPUT, type DrivingInput } from '../../src/game/types';
import { FixedStepClock } from '../../src/platform/loop';
import { driver } from './race-driver';

export function keyboardRace() {
  const clock = new FixedStepClock();
  let state = createRace();
  const frames: DrivingInput[] = [];
  let firstLapFrames = 0;
  for (let frame = 0; frame < 8000 && state.status.kind !== 'results'; frame++) {
    const planned = state.status.kind === 'racing' ? driver(state) : IDLE_INPUT;
    const input = { ...planned, steer: Math.abs(planned.steer) > 0.08 ? Math.sign(planned.steer) : 0 };
    frames.push(input);
    clock.advance(frame * 16, () => { state = stepRace(state, input, CIRCUIT); });
    if (!firstLapFrames && state.progress[0]!.lapTicks.length > 0) firstLapFrames = frames.length;
  }
  expect(state.status.kind).toBe('results');
  return { frames, state, firstLapFrames };
}

export async function installKeyboardRace(page: Page, frames: DrivingInput[]): Promise<void> {
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
}

export async function startKeyboardRace(page: Page): Promise<void> {
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('#start')!.click();
    window.dispatchEvent(new Event('test-keyboard-race'));
  });
}
