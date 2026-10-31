import { describe, expect, it } from 'vitest';
import { AI_PROFILES } from '../../src/content/opponents';
import { CIRCUIT } from '../../src/content/circuit';
import { cornerTargetSpeed, decideAi, laneIsSafe } from '../../src/game/ai';
import { AI, HANDLING, SIMULATION } from '../../src/game/config';
import { createTrack } from '../../src/game/track';
import { moveVehicle } from '../../src/game/vehicle';
import type { AiProfile, VehicleState } from '../../src/game/types';

const profile = AI_PROFILES[0]!;
const straight = createTrack([{ curvaturePerMeter: 0 }], 2000, 7);
const car: VehicleState = { stationMeters: 0, lateralMeters: 0, speedMetersPerSecond: 65 };
const memory = { laneMeters: 0, commitmentTicks: 0 };

describe('deterministic traffic controller', () => {
  it('brakes progressively before Anchor, then accelerates on a clear straight', () => {
    const far = cornerTargetSpeed({ ...car, stationMeters: 600 }, profile, CIRCUIT);
    const near = cornerTargetSpeed({ ...car, stationMeters: 740 }, profile, CIRCUIT);
    const apex = cornerTargetSpeed({ ...car, stationMeters: 825 }, profile, CIRCUIT);
    expect(far).toBeGreaterThan(near);
    expect(near).toBeGreaterThan(apex);
    expect(apex).toBeLessThan(46);
    expect(decideAi({ ...car, stationMeters: 740, speedMetersPerSecond: 78 }, memory, profile, [], CIRCUIT).input.brake).toBe(true);
    expect(decideAi({ ...car, stationMeters: 1050 }, memory, profile, [], CIRCUIT).input.accelerate).toBe(true);
  });

  it('uses braking distance with the shared braking capability and margin', () => {
    const track = createTrack(Array.from({ length: 400 }, (_, i) => ({ curvaturePerMeter: i >= 20 && i < 30 ? 0.0095 : 0 })), 5, 7);
    const speed = cornerTargetSpeed({ ...car, stationMeters: 30 }, profile, track);
    const cornerSquared = profile.cornerDriftMetersPerSecond / (0.0095 * HANDLING.cornerResponseSeconds);
    expect(speed ** 2).toBeCloseTo(cornerSquared + 2 * HANDLING.brakingMetersPerSecondSquared * AI.brakingFraction * (70 - AI.brakingMarginMeters));
  });

  it('has exactly three distinct bounded profiles that use shared acceleration and caps', () => {
    expect(AI_PROFILES.map((p) => p.id)).toEqual(['azure', 'gold', 'violet']);
    const speeds = AI_PROFILES.map((p) => {
      let vehicle = { ...car, speedMetersPerSecond: 0 };
      for (let tick = 0; tick < 600; tick++) vehicle = moveVehicle(vehicle,
        { accelerate: true, brake: false, steer: 0 }, SIMULATION.stepSeconds, straight, p);
      expect(vehicle.speedMetersPerSecond).toBe(p.maxSpeedMetersPerSecond);
      return vehicle.speedMetersPerSecond;
    });
    expect(new Set(speeds).size).toBe(3);
    expect(Math.max(...speeds) - Math.min(...speeds)).toBe(6);
  });

  it('rejects occupied destinations, fast rear approaches, crossing alongside and road edges, including seam traffic', () => {
    expect(laneIsSafe(car, 3.2, [{ ...car, stationMeters: 5, lateralMeters: 3.2 }], straight)).toBe(false);
    expect(laneIsSafe(car, 3.2, [{ ...car, stationMeters: -20, lateralMeters: 3.2, speedMetersPerSecond: 81 }], straight)).toBe(false);
    expect(laneIsSafe({ ...car, lateralMeters: -3.2 }, 3.2, [car], straight)).toBe(false);
    expect(laneIsSafe(car, 6.5, [], straight)).toBe(false);
    expect(laneIsSafe({ ...car, stationMeters: 1997 }, 3.2,
      [{ ...car, stationMeters: 2, lateralMeters: 3.2 }], straight)).toBe(false);
    expect(laneIsSafe(car, -3.2, [{ ...car, stationMeters: 20 }], straight)).toBe(true);
    // Keep the passing lane until clear of the car; moving away is still safe.
    expect(laneIsSafe({ ...car, lateralMeters: 3.2 }, -3.2, [{ ...car, stationMeters: 8 }], straight)).toBe(false);
    expect(laneIsSafe({ ...car, lateralMeters: 1 }, 3.2, [{ ...car, stationMeters: 8 }], straight)).toBe(true);
  });

  it('commits to an available passing lane and keeps it across small traffic changes', () => {
    const leader = { ...car, stationMeters: 30, speedMetersPerSecond: 40 };
    const passing = decideAi(car, memory, profile, [leader], straight);
    expect(Math.abs(passing.memory.laneMeters)).toBeGreaterThanOrEqual(2.5);
    expect(passing.memory.commitmentTicks).toBe(AI.commitmentTicks);
    const next = decideAi(car, passing.memory, profile, [{ ...leader, stationMeters: 32 }], straight);
    expect(next.memory.laneMeters).toBe(passing.memory.laneMeters);
    expect(next.memory.commitmentTicks).toBe(AI.commitmentTicks - 1);
  });

  it('brakes when lanes are blocked and abandons a commitment if another car moves into it', () => {
    const traffic = [-3.2, 0, 3.2].map((lateralMeters) => ({ ...car, stationMeters: 10, lateralMeters, speedMetersPerSecond: 20 }));
    const decision = decideAi(car, memory, profile, traffic, straight);
    expect(decision.input.brake).toBe(true);
    expect(decision.memory.laneMeters).toBe(0);
    const unsafe = decideAi(car, { laneMeters: 3.2, commitmentTicks: 100 }, profile, traffic, straight);
    expect(unsafe.memory.commitmentTicks).toBe(0);
    expect(unsafe.memory.laneMeters).toBe(0);
  });

  it.each([-10, 10])('recovers from the %s m verge through steering and shared off-road motion', (lateralMeters) => {
    let vehicle = { ...car, lateralMeters, speedMetersPerSecond: 15 };
    let ai = memory;
    for (let tick = 0; tick < 600; tick++) {
      const decision = decideAi(vehicle, ai, profile, [], straight);
      vehicle = moveVehicle(vehicle, decision.input, SIMULATION.stepSeconds, straight, profile);
      ai = decision.memory;
    }
    expect(vehicle.lateralMeters).toBeCloseTo(profile.preferredLaneMeters, 3);
    expect(vehicle.speedMetersPerSecond).toBeGreaterThan(60);
    expect(vehicle.stationMeters).toBeGreaterThan(300);
  });

  it('countersteers shared corner load and keeps stopped decisions finite', () => {
    const corner = { ...car, stationMeters: 825, speedMetersPerSecond: 40 };
    const decision = decideAi(corner, memory, { ...profile, preferredLaneMeters: 0 }, [], CIRCUIT);
    const next = moveVehicle(corner, decision.input, SIMULATION.stepSeconds, CIRCUIT, profile);
    expect(next.lateralMeters).toBeCloseTo(0, 8);
    const stopped = { ...car, speedMetersPerSecond: 0 };
    const cautious: AiProfile = { ...profile, preferredLaneMeters: 3.2 };
    const input = decideAi(stopped, memory, cautious, [], straight).input;
    expect(Number.isFinite(input.steer)).toBe(true);
  });
});
