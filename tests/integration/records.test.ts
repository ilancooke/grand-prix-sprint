import { expect, it } from 'vitest';
import { CIRCUIT } from '../../src/content/circuit';
import { advanceProgress, createRace, stepRace } from '../../src/game/race';
import { PersonalRecords, parsePersonalBest } from '../../src/platform/storage';
import { driver } from '../helpers/race-driver';

it('persists only legal completed player laps, before results, and keeps the record across a fresh race', () => {
  let raw: string | null = null;
  const records = new PersonalRecords(() => ({ getItem: () => raw, setItem: (_key, value) => { raw = value; } }));
  let state = createRace();
  for (let ticks = 0; state.progress[0]!.lapTicks.length === 0 && ticks < 6000; ticks++) {
    state = stepRace(state, driver(state), CIRCUIT);
    records.consume(state.events);
    if (state.progress[0]!.lapTicks.length === 0) expect(raw).toBeNull();
  }
  expect(state.status.kind).toBe('racing');
  expect(state.progress[0]!.lapTicks).toHaveLength(1);
  const saved = parsePersonalBest(raw);
  expect(saved).toBe(state.progress[0]!.lapTicks[0]! * 1000 / 60);
  const fresh = createRace();
  records.consume(fresh.events);
  expect(records.snapshot().bestLapMilliseconds).toBe(saved);
  const invalid = advanceProgress(fresh.progress[0]!, -8, CIRCUIT.lengthMeters, 1, CIRCUIT);
  records.consume(invalid.events);
  expect(invalid.progress.faulted).toBe(true);
  expect(parsePersonalBest(raw)).toBe(saved);
});
