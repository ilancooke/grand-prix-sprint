export const SIMULATION = { ticksPerSecond: 60, stepSeconds: 1 / 60 } as const;

export const HANDLING = {
  maxSpeedMetersPerSecond: 84,
  accelerationMetersPerSecondSquared: 18,
  brakingMetersPerSecondSquared: 38,
  coastingMetersPerSecondSquared: 5,
  steeringMetersPerSecond: 9,
  // Arcade lateral response: curvature × speed² × response time is outward drift speed.
  cornerResponseSeconds: 0.4,
  offRoadGripFraction: 0.55,
  offRoadBaseDragMetersPerSecondSquared: 6,
  offRoadSpeedDragPerSecond: 0.7,
  barrierOffsetMeters: 4.5,
} as const;

export const CONTACT = {
  carHalfWidthMeters: 0.9,
  carHalfLengthMeters: 2.2,
  separationMeters: 0.02,
  barrierSpeedRetention: 0.72,
  obstacleSpeedRetention: 0.65,
  carSpeedRetention: 0.85,
} as const;
