import { describe, expect, it } from 'vitest';
import { HANDLING, SIMULATION } from '../../src/game/config';
import { createDrivingState, simulate } from '../../src/game/simulate';
import { createTrack } from '../../src/game/track';
import { IDLE_INPUT } from '../../src/game/types';
import { moveVehicle } from '../../src/game/vehicle';

const straight = createTrack([{ curvaturePerMeter: 0 }], 2000, 7);
const throttle = { ...IDLE_INPUT, accelerate: true };
const vehicle = { stationMeters: 0, lateralMeters: 0, speedMetersPerSecond: 0 };

describe('vehicle motion', () => {
  it('accelerates gradually and reaches a finite speed cap', () => {
    let state = createDrivingState();
    state = simulate(state, throttle, straight);
    expect(state.player.speedMetersPerSecond).toBeCloseTo(0.3);
    for (let tick = 1; tick < 600; tick++) state = simulate(state, throttle, straight);
    expect(state.tick).toBe(600);
    expect(state.player.speedMetersPerSecond).toBe(HANDLING.maxSpeedMetersPerSecond);
    expect(state.player.stationMeters).toBeGreaterThan(600);
  });

  it('coasts naturally, brakes more strongly, and prioritizes brake over throttle', () => {
    const moving = { ...vehicle, speedMetersPerSecond: 50 };
    const coast = moveVehicle(moving, IDLE_INPUT, 1, straight);
    const brake = moveVehicle(moving, { ...throttle, brake: true }, 1, straight);
    expect(coast.speedMetersPerSecond).toBe(45);
    expect(brake.speedMetersPerSecond).toBe(12);
    expect(moveVehicle(vehicle, { ...throttle, brake: true }, 1, straight).speedMetersPerSecond).toBe(0);
  });

  it('supports throttle plus steering, mirror directions, and speed-dependent steering', () => {
    const slow = { ...vehicle, speedMetersPerSecond: 5 };
    const fast = { ...vehicle, speedMetersPerSecond: 60 };
    const right = { ...throttle, steer: 1 };
    const slowTurn = moveVehicle(slow, right, SIMULATION.stepSeconds, straight);
    const fastTurn = moveVehicle(fast, right, SIMULATION.stepSeconds, straight);
    const leftTurn = moveVehicle(fast, { ...right, steer: -1 }, SIMULATION.stepSeconds, straight);
    expect(slowTurn.lateralMeters).toBeGreaterThan(0);
    expect(fastTurn.lateralMeters).toBeGreaterThan(slowTurn.lateralMeters);
    expect(leftTurn.lateralMeters).toBeCloseTo(-fastTurn.lateralMeters);
    expect(fastTurn.speedMetersPerSecond).toBeGreaterThan(fast.speedMetersPerSecond);
    expect(moveVehicle(vehicle, { ...IDLE_INPUT, steer: 1 }, 1, straight).lateralMeters).toBe(0);
  });

  it('keeps longitudinal progress unwrapped and never mutates the prior snapshot', () => {
    const before = { ...vehicle, stationMeters: 1599, speedMetersPerSecond: 80 };
    const next = moveVehicle(before, throttle, 1, straight);
    expect(next.stationMeters).toBeGreaterThan(1600);
    expect(before.stationMeters).toBe(1599);
    expect(before.speedMetersPerSecond).toBe(80);
  });
});
