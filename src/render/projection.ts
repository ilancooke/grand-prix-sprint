import type { VehicleState } from '../game/types';

export const VIEW = {
  width: 960, height: 540, horizonY: 190, focalPixels: 620,
  chaseDistanceMeters: 7, cameraHeightMeters: 2.7, nearMeters: 4, drawSegments: 135,
} as const;

export interface ProjectedPoint { readonly x: number; readonly y: number; readonly scale: number }

export function project(lateralMeters: number, distanceMeters: number): ProjectedPoint | null {
  if (distanceMeters < VIEW.nearMeters) return null;
  const scale = VIEW.focalPixels / distanceMeters;
  return { x: VIEW.width / 2 + lateralMeters * scale, y: VIEW.horizonY + VIEW.cameraHeightMeters * scale, scale };
}

export function interpolateVehicle(previous: VehicleState, current: VehicleState, alpha: number): VehicleState {
  const lerp = (a: number, b: number): number => a + (b - a) * alpha;
  return {
    stationMeters: lerp(previous.stationMeters, current.stationMeters),
    lateralMeters: lerp(previous.lateralMeters, current.lateralMeters),
    speedMetersPerSecond: lerp(previous.speedMetersPerSecond, current.speedMetersPerSecond),
  };
}
