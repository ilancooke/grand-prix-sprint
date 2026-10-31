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
