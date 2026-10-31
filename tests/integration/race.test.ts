import { describe, expect, it } from 'vitest';
import { CIRCUIT } from '../../src/content/circuit';
import { createRace, stepRace } from '../../src/game/race';
import { IDLE_INPUT } from '../../src/game/types';
import { driver } from '../helpers/race-driver';
import { FixedStepClock } from '../../src/platform/loop';

function fullRace(delayTicks = 0, offRoad = false) {
  let state = createRace();
  if (offRoad) {
    state = { ...state, driving: { ...state.driving, player: { ...state.driving.player, lateralMeters: 8 } } };
  }
  let ticks = 0;
  const laps: number[] = [];
  while (state.status.kind !== 'results' && ticks++ < 18000) {
    state = stepRace(state, state.elapsedTicks < delayTicks ? IDLE_INPUT : driver(state), CIRCUIT);
    for (const event of state.events) if (event.kind === 'lap' && event.carId === 'player') laps.push(event.durationTicks);
  }
  expect(state.status.kind).toBe('results');
  expect(state.progress.every((car) => !car.faulted)).toBe(true);
  expect(laps).toHaveLength(3);
  expect(laps.reduce((sum, lap) => sum + lap, 0)).toBe(state.results!.totalTicks);
  expect(state.results!.bestLapTicks).toBe(Math.min(...laps));
  return state;
}

describe('complete real-physics races', () => {
  it('finishes three legal laps, freezes results/world and repeats deterministically', () => {
    const first = fullRace();
    expect(fullRace()).toEqual(first);
    expect(first.driving.player.stationMeters).toBeGreaterThanOrEqual(6000);
    expect(stepRace(first, driver(first), CIRCUIT)).toBe(first);
    console.info('M4 clean race', first.results, first.progress.map((car) => ({ id: car.id, lapTicks: car.lapTicks, finishTick: car.finishTick })));
  });

  it('keeps already finished AI ahead and gives immediate fourth-place results', () => {
    const state = fullRace(2400);
    expect(state.results!.position).toBe(4);
    for (const car of state.progress.slice(1)) {
      expect(car.lapTicks).toHaveLength(3);
      expect(car.finishTick).toBeLessThan(state.results!.totalTicks);
    }
  });

  it('allows off-road recovery followed by three valid laps', () => { fullRace(0, true); });

  it.each([30, 60, 120, 144])('produces exactly equal race clocks, legality, traffic and standings at %s Hz', (hertz) => {
    const run = (rate: number) => {
      const clock = new FixedStepClock();
      let state = createRace();
      for (let frame = 0; frame <= rate * 100; frame++) clock.advance(frame * 1000 / rate,
        () => { state = stepRace(state, driver(state), CIRCUIT); });
      return state;
    };
    const actual = run(hertz);
    expect(actual.status.kind).toBe('results');
    expect(actual).toEqual(run(60));
  });
});
