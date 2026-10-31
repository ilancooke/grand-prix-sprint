import { describe, expect, it } from 'vitest';
import { createDrivingState, simulate } from '../../src/game/simulate';
import { FixedStepClock, LOOP } from '../../src/platform/loop';

function runSchedule(hertz: number) {
  const clock = new FixedStepClock();
  let state = createDrivingState();
  for (let frame = 0; frame <= hertz * 20; frame++) {
    const result = clock.advance(frame * 1000 / hertz, () => {
      const tick = state.tick;
      state = simulate(state, {
        accelerate: tick < 500 || tick >= 700,
        brake: tick >= 500 && tick < 600,
        steer: tick >= 200 && tick < 230 ? 1 : tick >= 800 && tick < 830 ? -1 : 0,
      });
    });
    expect(result.interrupted).toBe(false);
    expect(result.alpha).toBeGreaterThanOrEqual(0);
    expect(result.alpha).toBeLessThan(1);
  }
  return state;
}

describe('fixed-step clock', () => {
  it.each([30, 60, 120, 144])('produces the same tick-indexed driving state at %s Hz', (hertz) => {
    const reference = runSchedule(60);
    const actual = runSchedule(hertz);
    expect(actual.tick).toBe(1200);
    expect(actual).toEqual(reference);
  });

  it('runs bounded catch-up and does not integrate an exceptional stall', () => {
    const clock = new FixedStepClock();
    let ticks = 0;
    const tick = (): void => { ticks++; };
    clock.advance(0, tick);
    clock.advance(LOOP.maxFrameGapMilliseconds, tick);
    expect(ticks).toBe(15);
    expect(clock.advance(1000, tick).interrupted).toBe(true);
    expect(ticks).toBe(15);
    clock.advance(100000, tick);
    expect(ticks).toBe(15);
    clock.advance(100000 + LOOP.stepMilliseconds, tick);
    expect(ticks).toBe(16);
  });

  it('rebases on pause/resume without advancing the background gap or remainder', () => {
    const clock = new FixedStepClock();
    let ticks = 0;
    const tick = (): void => { ticks++; };
    clock.advance(0, tick);
    clock.advance(25, tick);
    expect(ticks).toBe(1);
    clock.reset();
    clock.advance(100000, tick);
    expect(ticks).toBe(1);
    expect(clock.advance(100000 + LOOP.stepMilliseconds, tick).alpha).toBeCloseTo(0);
    expect(ticks).toBe(2);
  });

  it('interrupts rather than advancing when the clock moves backward', () => {
    const clock = new FixedStepClock();
    clock.advance(20, () => undefined);
    expect(clock.advance(10, () => { throw new Error('must not tick'); }).interrupted).toBe(true);
  });
});
