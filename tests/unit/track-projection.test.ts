import { describe, expect, it } from 'vitest';
import { CIRCUIT } from '../../src/content/circuit';
import { createTrack, positiveModulo, segmentAt } from '../../src/game/track';
import { interpolateVehicle, project, VIEW } from '../../src/render/projection';

describe('periodic road and chase projection', () => {
  it('wraps positive/negative stations and looks up the same segment on any lap', () => {
    expect(positiveModulo(-1, 1600)).toBe(1599);
    expect(positiveModulo(1600, 1600)).toBe(0);
    expect(segmentAt(CIRCUIT, -1)).toEqual(segmentAt(CIRCUIT, CIRCUIT.lengthMeters - 1));
    expect(segmentAt(CIRCUIT, 17)).toEqual(segmentAt(CIRCUIT, 17 + CIRCUIT.lengthMeters * 3));
    expect(segmentAt(CIRCUIT, CIRCUIT.lengthMeters - 0.001).curvaturePerMeter).toBe(0);
    expect(segmentAt(CIRCUIT, 0).curvaturePerMeter).toBe(0);
  });

  it('has left and right bends and rejects malformed geometry', () => {
    expect(CIRCUIT.segments.some((segment) => segment.curvaturePerMeter > 0)).toBe(true);
    expect(CIRCUIT.segments.some((segment) => segment.curvaturePerMeter < 0)).toBe(true);
    expect(() => createTrack([], 5, 7)).toThrow();
    expect(() => createTrack([{ curvaturePerMeter: NaN }], 5, 7)).toThrow();
    expect(() => createTrack([{ curvaturePerMeter: 0 }], Infinity, 7)).toThrow();
  });

  it('narrows the road with distance and converges toward the horizon', () => {
    const near = project(7, 10);
    const far = project(7, 100);
    expect(near).not.toBeNull();
    expect(far).not.toBeNull();
    expect(near?.scale).toBeGreaterThan(far?.scale ?? 0);
    expect(near?.x).toBeGreaterThan(far?.x ?? 0);
    expect(near?.y).toBeGreaterThan(far?.y ?? 0);
    expect(project(0, 100)?.x).toBe(VIEW.width / 2);
    expect(project(0, 0)).toBeNull();
    expect(project(0, -10)).toBeNull();
    expect(project(0, 1_000_000)?.y).toBeCloseTo(VIEW.horizonY, 2);
  });

  it('interpolates unwrapped motion before looking up the seam', () => {
    const previous = { stationMeters: CIRCUIT.lengthMeters - 1, lateralMeters: 0, speedMetersPerSecond: 60 };
    const current = { ...previous, stationMeters: CIRCUIT.lengthMeters + 1, lateralMeters: 2 };
    const halfway = interpolateVehicle(previous, current, 0.5);
    expect(halfway.stationMeters).toBe(CIRCUIT.lengthMeters);
    expect(halfway.lateralMeters).toBe(1);
    expect(positiveModulo(halfway.stationMeters, CIRCUIT.lengthMeters)).toBe(0);
  });
});
