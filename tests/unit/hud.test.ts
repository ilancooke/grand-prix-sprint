import { describe, expect, it } from 'vitest';
import { formatMilliseconds, formatPosition, formatTicks } from '../../src/ui/hud';

describe('readable authoritative race values', () => {
  it.each([[null, '—'], [0, '0:00.000'], [1, '0:00.016'], [60, '0:01.000'],
    [3599.999, '0:59.999'], [3600, '1:00.000'], [36000, '10:00.000'],
    [1567.3681899288822, '0:26.122']] as const)('formats %s ticks as %s', (ticks, expected) => {
    expect(formatTicks(ticks)).toBe(expected);
  });
  it.each([NaN, Infinity, -1])('hides invalid time %s', (value) => {
    expect(formatMilliseconds(value)).toBe('—');
  });
  it.each([[1, '1st / 4'], [2, '2nd / 4'], [3, '3rd / 4'], [4, '4th / 4']])(
    'formats position %s', (position, expected) => { expect(formatPosition(Number(position))).toBe(expected); });
});
