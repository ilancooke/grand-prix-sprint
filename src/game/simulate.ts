import { resolveWorldContacts } from './collisions';
import { SIMULATION } from './config';
import { moveVehicle } from './vehicle';
import type { DrivingInput, DrivingState, Track } from './types';

export function createDrivingState(): DrivingState {
  return { tick: 0, player: { stationMeters: 0, lateralMeters: 0, speedMetersPerSecond: 0 } };
}

export function simulate(state: DrivingState, input: DrivingInput, track: Track): DrivingState {
  return { tick: state.tick + 1, player: resolveWorldContacts(state.player,
    moveVehicle(state.player, input, SIMULATION.stepSeconds, track), track).vehicle };
}
