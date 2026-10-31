export interface DrivingInput {
  readonly accelerate: boolean;
  readonly brake: boolean;
  readonly steer: number;
}

export interface VehicleState {
  readonly stationMeters: number;
  readonly lateralMeters: number;
  readonly speedMetersPerSecond: number;
}

export interface DrivingState {
  readonly tick: number;
  readonly player: VehicleState;
  readonly opponents: readonly OpponentState[];
  readonly impacts: readonly DrivingImpact[];
}

export interface RoadSegment {
  readonly curvaturePerMeter: number;
}

export interface RoadObstacle {
  readonly stationMeters: number;
  readonly lateralMeters: number;
  readonly halfWidthMeters: number;
  readonly halfLengthMeters: number;
}

export interface Landmark {
  readonly stationMeters: number;
  readonly lateralMeters: number;
  readonly kind: 'sign' | 'grandstand';
  readonly label: string;
}

export interface Track {
  readonly segmentLengthMeters: number;
  readonly roadHalfWidthMeters: number;
  readonly segments: readonly RoadSegment[];
  readonly lengthMeters: number;
  readonly obstacles: readonly RoadObstacle[];
  readonly landmarks: readonly Landmark[];
}

export const IDLE_INPUT: DrivingInput = Object.freeze({ accelerate: false, brake: false, steer: 0 });

export interface VehiclePerformance {
  readonly maxSpeedMetersPerSecond: number;
  readonly accelerationMetersPerSecondSquared: number;
}

export type OpponentId = 'azure' | 'gold' | 'violet';
export type CarId = 'player' | OpponentId;

export interface AiProfile extends VehiclePerformance {
  readonly id: OpponentId;
  readonly cornerDriftMetersPerSecond: number;
  readonly preferredLaneMeters: number;
  readonly passingSide: -1 | 1;
}

export interface AiMemory {
  readonly laneMeters: number;
  readonly commitmentTicks: number;
}

export interface OpponentState {
  readonly id: OpponentId;
  readonly vehicle: VehicleState;
  readonly ai: AiMemory;
}

export interface DrivingImpact {
  readonly carId: CarId;
  readonly kind: 'barrier' | 'obstacle' | 'car';
  readonly otherCarId?: CarId;
}
