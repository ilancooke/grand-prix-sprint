import { SIMULATION } from './config';
import { moveVehicle } from './vehicle';
import type { DrivingInput, DrivingState } from './types';

export function createDrivingState(): DrivingState {
  return { tick: 0, player: { stationMeters: 0, lateralMeters: 0, speedMetersPerSecond: 0 } };
}

export function simulate(state: DrivingState, input: DrivingInput): DrivingState {
  return { tick: state.tick + 1, player: moveVehicle(state.player, input, SIMULATION.stepSeconds) };
}
