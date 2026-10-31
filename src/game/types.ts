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

export interface Track {
  readonly segmentLengthMeters: number;
  readonly roadHalfWidthMeters: number;
  readonly segments: readonly RoadSegment[];
  readonly lengthMeters: number;
}

export const IDLE_INPUT: DrivingInput = Object.freeze({ accelerate: false, brake: false, steer: 0 });
