import { HANDLING } from './config';
import { segmentAt } from './track';
import type { DrivingInput, Track, VehiclePerformance, VehicleState } from './types';

export function moveVehicle(vehicle: VehicleState, input: DrivingInput, stepSeconds: number, track: Track,
  performance: VehiclePerformance = HANDLING): VehicleState {
  const offRoad = Math.abs(vehicle.lateralMeters) > track.roadHalfWidthMeters;
  const acceleration = input.brake ? -HANDLING.brakingMetersPerSecondSquared
    : input.accelerate ? performance.accelerationMetersPerSecondSquared
      : -HANDLING.coastingMetersPerSecondSquared;
  const offRoadDrag = offRoad ? HANDLING.offRoadBaseDragMetersPerSecondSquared +
    vehicle.speedMetersPerSecond * HANDLING.offRoadSpeedDragPerSecond : 0;
  const speedMetersPerSecond = Math.max(0, Math.min(performance.maxSpeedMetersPerSecond,
    vehicle.speedMetersPerSecond + (acceleration - offRoadDrag) * stepSeconds));
  const speedFraction = speedMetersPerSecond / HANDLING.maxSpeedMetersPerSecond;
  const steeringSpeed = HANDLING.steeringMetersPerSecond * Math.min(1, speedFraction * 3) *
    (offRoad ? HANDLING.offRoadGripFraction : 1);
  const curvature = segmentAt(track, vehicle.stationMeters).curvaturePerMeter;
  const outwardMetersPerSecond = -curvature * speedMetersPerSecond ** 2 * HANDLING.cornerResponseSeconds;
  return {
    // Keep station unwrapped. Contacts must never adjust longitudinal progress.
    stationMeters: vehicle.stationMeters + speedMetersPerSecond * stepSeconds,
    lateralMeters: vehicle.lateralMeters +
      (Math.max(-1, Math.min(1, input.steer)) * steeringSpeed + outwardMetersPerSecond) * stepSeconds,
    speedMetersPerSecond,
  };
}
