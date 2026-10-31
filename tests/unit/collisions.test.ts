import { describe, expect, it } from 'vitest';
import { CONTACT, HANDLING, SIMULATION } from '../../src/game/config';
import { lateralLimitMeters, resolveCarContact, resolveWorldContacts } from '../../src/game/collisions';
import { createTrack, wrappedSeparation } from '../../src/game/track';
import { moveVehicle } from '../../src/game/vehicle';
import type { VehicleState } from '../../src/game/types';

const track = createTrack([{ curvaturePerMeter: 0 }], 2000, 7,
  [{ stationMeters: 0, lateralMeters: 9.3, halfWidthMeters: 0.65, halfLengthMeters: 1.4 }]);
const car: VehicleState = { stationMeters: 0, lateralMeters: 0, speedMetersPerSecond: 84 };

describe('swept world and generic car contacts', () => {
  it('uses symmetric nearest seam distances', () => {
    expect(wrappedSeparation(1999, 1, 2000)).toBe(-2);
    expect(wrappedSeparation(1, 1999, 2000)).toBe(2);
    expect(wrappedSeparation(-1, 1, 2000)).toBe(-2);
  });

  it.each([0, 2000, 4000])('hits an obstacle across seam %s and rejoins without longitudinal correction', (seam) => {
    const previous = { ...car, stationMeters: seam - 4, lateralMeters: 9.3 };
    const proposed = moveVehicle(previous, { accelerate: true, brake: false, steer: 0 }, SIMULATION.stepSeconds, track);
    const hit = resolveWorldContacts(previous, proposed, track);
    expect(hit.impacts).toEqual(['obstacle']);
    expect(hit.vehicle.stationMeters).toBe(proposed.stationMeters);
    expect(hit.vehicle.speedMetersPerSecond).toBeCloseTo(proposed.speedMetersPerSecond * CONTACT.obstacleSpeedRetention);
    expect(hit.vehicle.lateralMeters).toBeLessThan(9.3 - CONTACT.carHalfWidthMeters - 0.65);
    let vehicle = hit.vehicle;
    for (let tick = 0; tick < 180; tick++) vehicle = resolveWorldContacts(vehicle,
      moveVehicle(vehicle, { accelerate: true, brake: false, steer: vehicle.lateralMeters > 0.1 ? -1 : 0 }, SIMULATION.stepSeconds, track), track).vehicle;
    expect(Math.abs(vehicle.lateralMeters)).toBeLessThan(1);
    expect(vehicle.speedMetersPerSecond).toBeGreaterThan(50);
  });

  it('separates inward when an obstacle and outer barrier leave no car-sized gap', () => {
    const previous = { ...car, stationMeters: -4, lateralMeters: lateralLimitMeters(track) };
    const proposed = { ...previous, stationMeters: -2.6 };
    const contact = resolveWorldContacts(previous, proposed, track);
    expect(contact.impacts).toEqual(['obstacle']);
    expect(contact.vehicle.lateralMeters).toBeLessThan(9.3 - 0.65 - CONTACT.carHalfWidthMeters);
    expect(contact.vehicle.stationMeters).toBe(proposed.stationMeters);
  });

  it('detects a swept crossing whose two endpoint boxes both miss', () => {
    const before = { ...car, stationMeters: -5, lateralMeters: 9.3 };
    const after = { ...before, stationMeters: 5 };
    expect(resolveWorldContacts(before, after, track).impacts).toEqual(['obstacle']);
    // Crossing the two axes at different times must not create a phantom hit.
    expect(resolveWorldContacts({ ...before, lateralMeters: -10 }, { ...after, lateralMeters: 9.3 }, track).impacts).toEqual([]);
  });

  it('separates initial obstacle overlap without repeatedly multiplying speed', () => {
    const before = { ...car, lateralMeters: 9.3 };
    const hit = resolveWorldContacts(before, before, track);
    expect(hit.impacts).toEqual([]);
    expect(hit.vehicle.lateralMeters).toBeLessThan(8);
    expect(hit.vehicle.speedMetersPerSecond).toBe(84);
    expect(resolveWorldContacts(hit.vehicle, hit.vehicle, track).vehicle).toEqual(hit.vehicle);
  });

  it.each([0, 2000])('separates a maximum-speed car contact at seam %s and preserves both stations', (seam) => {
    const a = { ...car, stationMeters: seam - 4.5 };
    const b = { ...car, stationMeters: seam, speedMetersPerSecond: 0 };
    const nextA = { ...a, stationMeters: a.stationMeters + HANDLING.maxSpeedMetersPerSecond * SIMULATION.stepSeconds };
    const [hitA, hitB] = resolveCarContact(a, b, nextA, b, track);
    expect(Math.abs(hitA.lateralMeters - hitB.lateralMeters)).toBeGreaterThan(CONTACT.carHalfWidthMeters * 2);
    expect(hitA.speedMetersPerSecond).toBe(84 * CONTACT.carSpeedRetention);
    expect(hitB.speedMetersPerSecond).toBe(0);
    expect(hitA.stationMeters).toBe(nextA.stationMeters);
    expect(hitB.stationMeters).toBe(b.stationMeters);
    expect(resolveCarContact(hitA, hitB, hitA, hitB, track)).toEqual([hitA, hitB]);
  });

  it('sweeps car crossings and resolves initial overlap near an outer barrier', () => {
    const a = { ...car, stationMeters: -5, lateralMeters: 10.5 };
    const b = { ...car, stationMeters: 0, lateralMeters: 10.5 };
    const [hitA, hitB] = resolveCarContact(a, b, { ...a, stationMeters: 5 }, b, track);
    expect(Math.abs(hitA.lateralMeters - hitB.lateralMeters)).toBeGreaterThan(1.8);
    expect(Math.abs(hitA.lateralMeters)).toBeLessThanOrEqual(lateralLimitMeters(track));
    expect(Math.abs(hitB.lateralMeters)).toBeLessThanOrEqual(lateralLimitMeters(track));
    const [overlapA, overlapB] = resolveCarContact(b, b, b, b, track);
    expect(overlapA.speedMetersPerSecond).toBe(84);
    expect(Math.abs(overlapA.lateralMeters - overlapB.lateralMeters)).toBeGreaterThan(1.8);
  });

  it('leaves safely side-by-side traffic alone', () => {
    const a = { ...car, lateralMeters: -2 };
    const b = { ...car, lateralMeters: 2 };
    expect(resolveCarContact(a, b, a, b, track)).toEqual([a, b]);
  });

  it('rejects invalid collision dimensions and object stations', () => {
    expect(() => createTrack([{ curvaturePerMeter: 0 }], 5, 7, [
      { stationMeters: 0, lateralMeters: 9, halfWidthMeters: -1, halfLengthMeters: 1 },
    ])).toThrow();
    expect(() => createTrack([{ curvaturePerMeter: 0 }], 5, 7, [], [
      { stationMeters: 6, lateralMeters: 9, kind: 'sign', label: 'BAD' },
    ])).toThrow();
  });
});
