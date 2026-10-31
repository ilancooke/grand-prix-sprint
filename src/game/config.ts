export const SIMULATION = { ticksPerSecond: 60, stepSeconds: 1 / 60 } as const;

// M1 handling is provisional. Corner grip, off-road drag, and contacts belong to M2.
export const HANDLING = {
  maxSpeedMetersPerSecond: 84,
  accelerationMetersPerSecondSquared: 18,
  brakingMetersPerSecondSquared: 38,
  coastingMetersPerSecondSquared: 5,
  steeringMetersPerSecond: 9,
  lateralVergeLimitMeters: 12,
} as const;
