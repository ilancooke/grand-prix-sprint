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
  geometryToleranceMeters: 1e-9,
  barrierSpeedRetention: 0.72,
  obstacleSpeedRetention: 0.65,
  carSpeedRetention: 0.85,
} as const;

export const AI = {
  lookaheadMeters: 165,
  initialLeadMeters: 22,
  initialSpacingMeters: 18,
  sampleMeters: 5,
  brakingMarginMeters: 12,
  brakingFraction: 0.82,
  laneGainPerSecond: 2.5,
  laneSpacingMeters: 3.2,
  laneClearanceMeters: 2.5,
  frontGapMeters: 14,
  rearGapMeters: 12,
  reactionSeconds: 0.9,
  followGapMeters: 16,
  passingBufferMeters: 2,
  passingCreepMetersPerSecond: 1.5,
  throttleDeadbandMetersPerSecond: 0.1,
  followSeconds: 0.8,
  passingLookaheadMeters: 75,
  commitmentTicks: 120,
  speedDeadbandMetersPerSecond: 0.6,
  recoverySpeedMetersPerSecond: 22,
} as const;

export const RACE = {
  laps: 3,
  sectors: 4,
  countdownTicks: 180,
  stationToleranceMeters: 1e-8,
  carOrder: ['player', 'azure', 'gold', 'violet'],
  grid: [
    { stationMeters: -8, lateralMeters: -1.6 },
    { stationMeters: -8, lateralMeters: 1.6 },
    { stationMeters: -16, lateralMeters: -1.6 },
    { stationMeters: -16, lateralMeters: 1.6 },
  ],
} as const;
