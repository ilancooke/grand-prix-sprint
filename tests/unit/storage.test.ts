import { describe, expect, it, vi } from 'vitest';
import { PERSONAL_BEST_KEY, PersonalRecords, parsePersonalBest } from '../../src/platform/storage';
import type { RaceEvent } from '../../src/game/race';

const lap = (durationTicks: number, carId: 'player' | 'azure' = 'player'): RaceEvent =>
  ({ kind: 'lap', carId, durationTicks, crossingTick: durationTicks });

function memory(initial: string | null = null) {
  let raw = initial;
  return { getItem: vi.fn(() => raw), setItem: vi.fn((_key: string, value: string) => { raw = value; }) };
}

describe('personal record schema', () => {
  it.each([null, '', '{', 'null', '[]', '42', 'true', '{}',
    '{"version":2,"bestLapMilliseconds":1000}', '{"version":"1","bestLapMilliseconds":1000}',
    '{"version":1}', '{"version":1,"bestLapMilliseconds":"1000"}',
    '{"version":1,"bestLapMilliseconds":0}', '{"version":1,"bestLapMilliseconds":-1}',
    '{"version":1,"bestLapMilliseconds":1e999}', '{"version":1,"bestLapMilliseconds":9007199254740992}',
  ])('ignores missing, malformed or unsupported record %s', (raw) => {
    expect(parsePersonalBest(raw)).toBeNull();
  });
  it('keeps finite positive fractional milliseconds without rounding', () => {
    expect(parsePersonalBest('{"version":1,"bestLapMilliseconds":26122.803165}')).toBe(26122.803165);
  });
});

describe('safe personal records', () => {
  it('saves only improved valid player lap events and survives adapter reconstruction', () => {
    const storage = memory();
    const records = new PersonalRecords(() => storage);
    expect(records.snapshot()).toEqual({ bestLapMilliseconds: null, savingAvailable: true });
    records.consume([{ kind: 'go' }, lap(600, 'azure'), lap(0), lap(-1), lap(NaN), lap(Infinity)]);
    expect(storage.setItem).not.toHaveBeenCalled();
    records.consume([lap(1800)]);
    expect(storage.setItem).toHaveBeenLastCalledWith(PERSONAL_BEST_KEY,
      JSON.stringify({ version: 1, bestLapMilliseconds: 30000 }));
    records.consume([lap(1800), lap(2400), { kind: 'finish', carId: 'player', crossingTick: 1 }]);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    records.consume([lap(1567.3681899288822)]);
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(new PersonalRecords(() => storage).snapshot()).toEqual(records.snapshot());
  });
  it('does not overwrite a faster record saved by another tab', () => {
    const storage = memory();
    const records = new PersonalRecords(() => storage);
    storage.setItem(PERSONAL_BEST_KEY, '{"version":1,"bestLapMilliseconds":20000}');
    records.consume([lap(1800)]);
    expect(records.snapshot().bestLapMilliseconds).toBe(20000);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });
  it('replaces corrupt data only when a valid player lap completes', () => {
    const storage = memory('{broken');
    const records = new PersonalRecords(() => storage);
    expect(records.snapshot().bestLapMilliseconds).toBeNull();
    expect(storage.setItem).not.toHaveBeenCalled();
    records.consume([lap(1800)]);
    expect(parsePersonalBest(storage.getItem())).toBe(30000);
  });
  it.each(['getter', 'read', 'write'])('retains an improving session record when %s throws', (failure) => {
    const storage = memory();
    if (failure === 'read') storage.getItem.mockImplementation(() => { throw new Error('denied'); });
    if (failure === 'write') storage.setItem.mockImplementation(() => { throw new Error('quota'); });
    const records = new PersonalRecords(() => {
      if (failure === 'getter') throw new Error('denied');
      return storage;
    });
    records.consume([lap(1800), lap(2000), lap(1600)]);
    expect(records.snapshot()).toEqual({ bestLapMilliseconds: 1600 * 1000 / 60, savingAvailable: false });
  });
});
