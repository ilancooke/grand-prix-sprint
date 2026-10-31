import { describe, expect, it } from 'vitest';
import { CIRCUIT, CIRCUIT_SECTIONS } from '../../src/content/circuit';
import { CONTACT, HANDLING, SIMULATION } from '../../src/game/config';
import { lateralLimitMeters, resolveWorldContacts } from '../../src/game/collisions';
import { createTrack, segmentAt } from '../../src/game/track';
import { moveVehicle } from '../../src/game/vehicle';
import { IDLE_INPUT } from '../../src/game/types';
import type { VehicleState } from '../../src/game/types';

const dt = SIMULATION.stepSeconds;
const throttle = { ...IDLE_INPUT, accelerate: true };
const straight = createTrack([{ curvaturePerMeter: 0 }], 2000, 7);
const car = { stationMeters: 650, lateralMeters: 0, speedMetersPerSecond: 84 };

function cornerRun(braked: boolean) {
  let vehicle: VehicleState = car;
  let tick = 0;
  let offRoadTicks = 0;
  let impacts = 0;
  let maximumLateralMeters = 0;
  while (vehicle.stationMeters < 1000 && tick < 3000) {
    // Test driver supplies ordinary input only. Both runs use identical steering;
    // only the speed decision differs. There is no production driving assist.
    const curvature = segmentAt(CIRCUIT, vehicle.stationMeters).curvaturePerMeter;
    const steer = Math.max(-1, Math.min(1,
      curvature * vehicle.speedMetersPerSecond ** 2 * HANDLING.cornerResponseSeconds /
      HANDLING.steeringMetersPerSecond - vehicle.lateralMeters * 0.5));
    const brakingSection = braked && vehicle.stationMeters >= 720 && vehicle.stationMeters < 880;
    const brake = brakingSection && vehicle.speedMetersPerSecond > 49;
    const input = { accelerate: !brakingSection || vehicle.speedMetersPerSecond < 48, brake, steer };
    const next = resolveWorldContacts(vehicle, moveVehicle(vehicle, input, dt, CIRCUIT), CIRCUIT);
    vehicle = next.vehicle;
    impacts += next.impacts.length;
    if (Math.abs(vehicle.lateralMeters) > CIRCUIT.roadHalfWidthMeters) offRoadTicks++;
    maximumLateralMeters = Math.max(maximumLateralMeters, Math.abs(vehicle.lateralMeters));
    tick++;
  }
  return { tick, offRoadTicks, impacts, maximumLateralMeters, exitSpeed: vehicle.speedMetersPerSecond };
}

describe('finished circuit and meaningful cornering', () => {
  it('defines five eased bends, both directions, long passing straights and a straight seam', () => {
    expect(CIRCUIT.lengthMeters).toBe(2000);
    expect(CIRCUIT_SECTIONS.filter((section) => section.curvature !== 0)).toHaveLength(5);
    expect(CIRCUIT_SECTIONS.some((section) => section.curvature < 0)).toBe(true);
    expect(CIRCUIT_SECTIONS.filter((section) => section.curvature === 0 && section.segments * 5 >= 200).length).toBeGreaterThanOrEqual(2);
    expect(CIRCUIT.roadHalfWidthMeters * 2).toBeGreaterThan(CONTACT.carHalfWidthMeters * 4 + 2);
    expect(segmentAt(CIRCUIT, -1).curvaturePerMeter).toBe(0);
    expect(segmentAt(CIRCUIT, 0).curvaturePerMeter).toBe(0);
    // Every sampled join eases toward zero without a sudden curvature step.
    for (let index = 0; index < CIRCUIT.segments.length; index++) {
      const a = segmentAt(CIRCUIT, index * 5).curvaturePerMeter;
      const b = segmentAt(CIRCUIT, (index + 1) * 5).curvaturePerMeter;
      expect(Math.abs(a - b)).toBeLessThan(0.0009);
    }
    expect(CIRCUIT.landmarks.some((landmark) => landmark.label === 'BRAKE 100')).toBe(true);
    expect(CIRCUIT.obstacles).toHaveLength(3);
    // Decorative silhouettes stay beyond the physical barrier; the shoulder
    // tire stacks are the selected collidable objects in the driving verge.
    for (const landmark of CIRCUIT.landmarks) {
      const halfWidthMeters = landmark.kind === 'grandstand' ? 5 : 3;
      expect(Math.abs(landmark.lateralMeters) - halfWidthMeters).toBeGreaterThan(
        CIRCUIT.roadHalfWidthMeters + HANDLING.barrierOffsetMeters);
    }
    expect(Object.isFrozen(CIRCUIT.obstacles[0])).toBe(true);
  });

  it('pushes outward for both corner directions, with speed-squared load', () => {
    const right = createTrack([{ curvaturePerMeter: 0.005 }], 2000, 7);
    const left = createTrack([{ curvaturePerMeter: -0.005 }], 2000, 7);
    const slow = moveVehicle({ ...car, speedMetersPerSecond: 30 }, throttle, dt, right);
    const fast = moveVehicle({ ...car, speedMetersPerSecond: 60 }, throttle, dt, right);
    expect(slow.lateralMeters).toBeLessThan(0);
    expect(fast.lateralMeters / slow.lateralMeters).toBeCloseTo((60.3 / 30.3) ** 2);
    expect(moveVehicle({ ...car, speedMetersPerSecond: 60 }, throttle, dt, left).lateralMeters).toBeCloseTo(-fast.lateralMeters);
    expect(moveVehicle({ ...car, speedMetersPerSecond: 0 }, IDLE_INPUT, dt, right).lateralMeters).toBe(0);
  });

  it('rewards a braked Anchor approach over full throttle with the same steering policy', () => {
    const fast = cornerRun(false);
    const braked = cornerRun(true);
    console.info('Anchor comparison', { fullThrottle: fast, braked });
    expect(fast.offRoadTicks).toBeGreaterThan(0);
    expect(fast.maximumLateralMeters).toBeGreaterThan(CIRCUIT.roadHalfWidthMeters);
    expect(braked.offRoadTicks).toBe(0);
    expect(braked.impacts).toBe(0);
    expect(braked.tick).toBeLessThan(fast.tick);
    expect(braked.exitSpeed).toBeGreaterThan(fast.exitSpeed);
  });

  it.each([-1, 1])('penalizes the %s verge but permits a low-speed rejoin', (side) => {
    let vehicle: VehicleState = { ...car, lateralMeters: side * 9, speedMetersPerSecond: 60 };
    const onRoad = moveVehicle({ ...vehicle, lateralMeters: 0 }, { ...throttle, steer: -side }, dt, straight);
    const offRoad = moveVehicle(vehicle, { ...throttle, steer: -side }, dt, straight);
    expect(offRoad.speedMetersPerSecond).toBeLessThan(onRoad.speedMetersPerSecond);
    expect(Math.abs(offRoad.lateralMeters - vehicle.lateralMeters)).toBeLessThan(Math.abs(onRoad.lateralMeters));
    for (let tick = 0; tick < 240; tick++) {
      vehicle = resolveWorldContacts(vehicle, moveVehicle(vehicle,
        { ...throttle, steer: Math.abs(vehicle.lateralMeters) > 0.1 ? -side : 0 }, dt, straight), straight).vehicle;
    }
    expect(Math.abs(vehicle.lateralMeters)).toBeLessThan(1);
    expect(vehicle.speedMetersPerSecond).toBeGreaterThan(50);
    expect(vehicle.stationMeters).toBeGreaterThan(car.stationMeters);
  });

  it.each([-1, 1])('keeps sustained barrier contact bounded and allows recovery on side %s', (side) => {
    let vehicle: VehicleState = { ...car, lateralMeters: side * (lateralLimitMeters(straight) - 0.05) };
    let impacts = 0;
    for (let tick = 0; tick < 120; tick++) {
      const proposed = moveVehicle(vehicle, { ...throttle, steer: side }, dt, straight);
      const contact = resolveWorldContacts(vehicle, proposed, straight);
      expect(contact.vehicle.stationMeters).toBe(proposed.stationMeters);
      expect(Math.abs(contact.vehicle.lateralMeters)).toBeLessThanOrEqual(lateralLimitMeters(straight));
      vehicle = contact.vehicle;
      impacts += contact.impacts.length;
    }
    expect(impacts).toBe(1);
    expect(vehicle.speedMetersPerSecond).toBeGreaterThan(20);
    for (let tick = 0; tick < 120; tick++) vehicle = resolveWorldContacts(vehicle,
      moveVehicle(vehicle, { ...throttle, steer: -side }, dt, straight), straight).vehicle;
    expect(Math.abs(vehicle.lateralMeters)).toBeLessThan(straight.roadHalfWidthMeters);
  });
});
