import { HANDLING } from './config';
import type { DrivingInput, VehicleState } from './types';

export function moveVehicle(vehicle: VehicleState, input: DrivingInput, stepSeconds: number): VehicleState {
  const acceleration = input.brake ? -HANDLING.brakingMetersPerSecondSquared
    : input.accelerate ? HANDLING.accelerationMetersPerSecondSquared
      : -HANDLING.coastingMetersPerSecondSquared;
  const speedMetersPerSecond = Math.max(0, Math.min(HANDLING.maxSpeedMetersPerSecond,
    vehicle.speedMetersPerSecond + acceleration * stepSeconds));
  const speedFraction = speedMetersPerSecond / HANDLING.maxSpeedMetersPerSecond;
  const steeringSpeed = HANDLING.steeringMetersPerSecond * Math.min(1, speedFraction * 3);
  const lateralMeters = Math.max(-HANDLING.lateralVergeLimitMeters,
    Math.min(HANDLING.lateralVergeLimitMeters,
      vehicle.lateralMeters + Math.max(-1, Math.min(1, input.steer)) * steeringSpeed * stepSeconds));
  return {
    // Keep station unwrapped. Wrapping before interpolation causes seam jumps.
    stationMeters: vehicle.stationMeters + speedMetersPerSecond * stepSeconds,
    lateralMeters,
    speedMetersPerSecond,
  };
}
