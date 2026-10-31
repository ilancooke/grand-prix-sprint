import { AI, CONTACT, HANDLING, SIMULATION } from './config';
import { segmentAt, wrappedSeparation } from './track';
import type { AiMemory, AiProfile, DrivingInput, Track, VehicleState } from './types';

export interface AiDecision {
  readonly input: DrivingInput;
  readonly memory: AiMemory;
  readonly targetSpeedMetersPerSecond: number;
}

export function cornerTargetSpeed(vehicle: VehicleState, profile: AiProfile, track: Track): number {
  let target = profile.maxSpeedMetersPerSecond;
  for (let distance = 0; distance <= AI.lookaheadMeters; distance += AI.sampleMeters) {
    const curvature = Math.abs(segmentAt(track, vehicle.stationMeters + distance).curvaturePerMeter);
    if (curvature < 1e-9) continue;
    const cornerSpeedSquared = profile.cornerDriftMetersPerSecond / (curvature * HANDLING.cornerResponseSeconds);
    const brakingDistance = Math.max(0, distance - AI.brakingMarginMeters);
    target = Math.min(target, Math.sqrt(cornerSpeedSquared +
      2 * HANDLING.brakingMetersPerSecondSquared * AI.brakingFraction * brakingDistance));
  }
  return target;
}

export function laneIsSafe(vehicle: VehicleState, laneMeters: number,
  traffic: readonly VehicleState[], track: Track): boolean {
  if (Math.abs(laneMeters) > track.roadHalfWidthMeters - CONTACT.carHalfWidthMeters - 0.5) return false;
  return traffic.every((other) => {
    const ahead = wrappedSeparation(other.stationMeters, vehicle.stationMeters, track.lengthMeters);
    const front = AI.frontGapMeters + Math.max(0, vehicle.speedMetersPerSecond - other.speedMetersPerSecond) * AI.reactionSeconds;
    const rear = AI.rearGapMeters + Math.max(0, other.speedMetersPerSecond - vehicle.speedMetersPerSecond) * AI.reactionSeconds;
    if (Math.abs(other.lateralMeters - laneMeters) < AI.laneClearanceMeters && ahead > -rear && ahead < front) return false;
    // A clear destination is insufficient if the lane change crosses a car alongside.
    const direction = Math.sign(laneMeters - vehicle.lateralMeters);
    const towardOther = (other.lateralMeters - vehicle.lateralMeters) * direction;
    const crosses = towardOther > 0 &&
      towardOther < Math.abs(laneMeters - vehicle.lateralMeters) + CONTACT.carHalfWidthMeters * 2;
    return !(crosses && ahead > -rear && ahead < front);
  });
}

export function decideAi(vehicle: VehicleState, memory: AiMemory, profile: AiProfile,
  traffic: readonly VehicleState[], track: Track): AiDecision {
  let target = cornerTargetSpeed(vehicle, profile, track);
  let lane = memory.laneMeters;
  let commitment = Math.max(0, memory.commitmentTicks - 1);
  const leader = traffic.map((other) => ({ other,
    gap: wrappedSeparation(other.stationMeters, vehicle.stationMeters, track.lengthMeters) }))
    .filter(({ other, gap }) => gap > 0 && gap < AI.passingLookaheadMeters &&
      Math.abs(other.lateralMeters - vehicle.lateralMeters) < AI.laneClearanceMeters)
    .sort((a, b) => a.gap - b.gap)[0];
  const recovering = Math.abs(vehicle.lateralMeters) > track.roadHalfWidthMeters - CONTACT.carHalfWidthMeters;
  if (recovering) {
    lane = profile.preferredLaneMeters;
    commitment = 0;
    target = Math.min(target, AI.recoverySpeedMetersPerSecond);
  } else if (commitment === 0) {
    const shouldPass = leader && (leader.other.speedMetersPerSecond < target - 1 || leader.gap < 25);
    const candidates = shouldPass
      ? [vehicle.lateralMeters + profile.passingSide * AI.laneSpacingMeters,
        vehicle.lateralMeters - profile.passingSide * AI.laneSpacingMeters,
        -AI.laneSpacingMeters, 0, AI.laneSpacingMeters]
      : [profile.preferredLaneMeters];
    const safe = candidates.find((candidate) =>
      (!shouldPass || Math.abs(candidate - leader.other.lateralMeters) >= AI.laneClearanceMeters) &&
      laneIsSafe(vehicle, candidate, traffic, track));
    if (safe !== undefined) {
      lane = safe;
      if (shouldPass) commitment = AI.commitmentTicks;
    }
  }
  // A commitment never grants right of way: abandon an unsafe destination.
  if (!recovering && !laneIsSafe(vehicle, lane, traffic, track)) {
    lane = vehicle.lateralMeters;
    commitment = 0;
  }
  for (const other of traffic) {
    const gap = wrappedSeparation(other.stationMeters, vehicle.stationMeters, track.lengthMeters);
    const inPath = Math.abs(other.lateralMeters - vehicle.lateralMeters) < AI.laneClearanceMeters ||
      Math.abs(other.lateralMeters - lane) < AI.laneClearanceMeters;
    if (gap > 0 && gap < AI.passingLookaheadMeters && inPath) {
      // Leave enough longitudinal room to steer around a stopped car. At low
      // speed shared steering gives at most (3 × steering / maxSpeed) m/m.
      const passing = Math.abs(other.lateralMeters - lane) >= AI.laneClearanceMeters &&
        laneIsSafe(vehicle, lane, traffic, track);
      const remainingLateral = Math.max(0, AI.laneClearanceMeters - Math.abs(other.lateralMeters - vehicle.lateralMeters));
      const clearanceDistance = CONTACT.carHalfLengthMeters * 2 + AI.passingBufferMeters +
        remainingLateral * HANDLING.maxSpeedMetersPerSecond / (3 * HANDLING.steeringMetersPerSecond);
      const followGap = passing ? clearanceDistance : AI.followGapMeters;
      const followSpeed = other.speedMetersPerSecond + (gap - followGap) / AI.followSeconds;
      // If abrupt braking left too little room to steer from rest, creep
      // toward the clear lane; shared contacts can separate an unavoidable touch.
      const creep = passing ? AI.passingCreepMetersPerSecond : 0;
      target = Math.min(target, Math.max(creep, followSpeed, 0));
    }
  }
  const brake = vehicle.speedMetersPerSecond > target + AI.speedDeadbandMetersPerSecond;
  const accelerate = vehicle.speedMetersPerSecond < target - AI.throttleDeadbandMetersPerSecond;
  // Feed forward the same curvature load as shared motion, leaving steering headroom
  // for lane correction. This is controller input, never a position correction.
  const nextSpeed = Math.max(0, vehicle.speedMetersPerSecond + (brake ? -HANDLING.brakingMetersPerSecondSquared :
    accelerate ? profile.accelerationMetersPerSecondSquared : -HANDLING.coastingMetersPerSecondSquared) * SIMULATION.stepSeconds);
  const steeringSpeed = HANDLING.steeringMetersPerSecond * Math.min(1, nextSpeed / HANDLING.maxSpeedMetersPerSecond * 3) *
    (Math.abs(vehicle.lateralMeters) > track.roadHalfWidthMeters ? HANDLING.offRoadGripFraction : 1);
  const outward = -segmentAt(track, vehicle.stationMeters).curvaturePerMeter * nextSpeed ** 2 * HANDLING.cornerResponseSeconds;
  const steer = steeringSpeed > 0 ? Math.max(-1, Math.min(1,
    ((lane - vehicle.lateralMeters) * AI.laneGainPerSecond - outward) / steeringSpeed)) : 0;
  return { input: { accelerate, brake, steer }, memory: { laneMeters: lane, commitmentTicks: commitment },
    targetSpeedMetersPerSecond: target };
}
