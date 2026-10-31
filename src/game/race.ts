import { HANDLING, RACE, SIMULATION } from './config';
import { createDrivingState, simulate } from './simulate';
import type { CarId, DrivingInput, DrivingState, Track } from './types';

export type RaceStatus = { readonly kind: 'countdown' | 'racing' | 'results' }
  | { readonly kind: 'paused'; readonly resume: 'countdown' | 'racing' };

export interface CarProgress {
  readonly id: CarId;
  readonly acceptedStationMeters: number;
  readonly nextGateStationMeters: number;
  readonly armed: boolean;
  readonly faulted: boolean;
  readonly lapTicks: readonly number[];
  readonly lapStartTick: number;
  readonly finishTick: number | null;
}

export type RaceEvent =
  | { readonly kind: 'countdown'; readonly number: number }
  | { readonly kind: 'go' }
  | { readonly kind: 'lap'; readonly carId: CarId; readonly durationTicks: number; readonly crossingTick: number }
  | { readonly kind: 'finish'; readonly carId: CarId; readonly crossingTick: number };

export interface RaceResults {
  readonly position: number;
  readonly totalTicks: number;
  readonly bestLapTicks: number;
}

export interface RaceState {
  readonly status: RaceStatus;
  readonly countdownTicks: number;
  readonly elapsedTicks: number;
  readonly driving: DrivingState;
  readonly progress: readonly CarProgress[];
  readonly standings: readonly CarId[];
  readonly events: readonly RaceEvent[];
  readonly results: RaceResults | null;
}

export function createRace(): RaceState {
  const driving = createDrivingState();
  const player = { ...driving.player, ...RACE.grid[0] };
  const opponents = driving.opponents.map((opponent, index) => {
    const slot = RACE.grid[index + 1];
    if (!slot) throw new Error('Missing grid slot.');
    return { ...opponent, vehicle: { ...opponent.vehicle, ...slot },
      ai: { laneMeters: slot.lateralMeters, commitmentTicks: 0 } };
  });
  const cars = [{ id: 'player' as const, vehicle: player }, ...opponents];
  const progress = cars.map(({ id, vehicle }) => ({ id, acceptedStationMeters: vehicle.stationMeters,
    nextGateStationMeters: 0, armed: false, faulted: false, lapTicks: [], lapStartTick: 0, finishTick: null }));
  return { status: { kind: 'countdown' }, countdownTicks: 0, elapsedTicks: 0,
    driving: { ...driving, player, opponents }, progress, standings: rankCars(progress),
    events: [{ kind: 'countdown', number: 3 }], results: null };
}

export function pauseRace(state: RaceState): RaceState {
  const kind = state.status.kind;
  return kind === 'countdown' || kind === 'racing'
    ? { ...state, status: { kind: 'paused', resume: kind }, events: [] } : state;
}

export function resumeRace(state: RaceState): RaceState {
  return state.status.kind === 'paused' ? { ...state, status: { kind: state.status.resume }, events: [] } : state;
}

// Fail closed on nonphysical motion. Keep the last lawful station for ranking;
// a corrupted circuit cannot be repaired by subsequent endpoint/gate injections.
export function advanceProgress(progress: CarProgress, beforeMeters: number, afterMeters: number,
  elapsedTick: number, track: Track): { progress: CarProgress; events: readonly RaceEvent[] } {
  if (progress.finishTick !== null || progress.faulted) return { progress, events: [] };
  const displacement = afterMeters - beforeMeters;
  if (!Number.isFinite(beforeMeters) || !Number.isFinite(afterMeters) ||
      Math.abs(beforeMeters - progress.acceptedStationMeters) > RACE.stationToleranceMeters ||
      displacement < 0 || displacement > HANDLING.maxSpeedMetersPerSecond * SIMULATION.stepSeconds + RACE.stationToleranceMeters) {
    return { progress: { ...progress, faulted: true }, events: [] };
  }
  let next = { ...progress, acceptedStationMeters: afterMeters };
  const events: RaceEvent[] = [];
  const gateSpacingMeters = track.lengthMeters / RACE.sectors;
  while (beforeMeters < next.nextGateStationMeters && afterMeters >= next.nextGateStationMeters) {
    const station = next.nextGateStationMeters;
    const crossingTick = elapsedTick - 1 + (station - beforeMeters) / displacement;
    if (!next.armed) {
      next = { ...next, armed: true };
    } else if (station >= (next.lapTicks.length + 1) * track.lengthMeters) {
      const durationTicks = crossingTick - next.lapStartTick;
      next = { ...next, lapTicks: [...next.lapTicks, durationTicks], lapStartTick: crossingTick };
      events.push({ kind: 'lap', carId: next.id, durationTicks, crossingTick });
      if (next.lapTicks.length === RACE.laps) {
        next = { ...next, finishTick: crossingTick };
        events.push({ kind: 'finish', carId: next.id, crossingTick });
      }
    }
    next = { ...next, nextGateStationMeters: station + gateSpacingMeters };
    if (next.finishTick !== null) break;
  }
  return { progress: next, events };
}

export function rankCars(progress: readonly CarProgress[]): readonly CarId[] {
  return [...progress].sort((a, b) => {
    if (a.finishTick !== null || b.finishTick !== null) {
      if (a.finishTick === null) return 1;
      if (b.finishTick === null) return -1;
      return a.finishTick - b.finishTick || RACE.carOrder.indexOf(a.id) - RACE.carOrder.indexOf(b.id);
    }
    return b.acceptedStationMeters - a.acceptedStationMeters ||
      RACE.carOrder.indexOf(a.id) - RACE.carOrder.indexOf(b.id);
  }).map((car) => car.id);
}

// All swept crossings are collected before sorting finishers and freezing results.
export function settleRaceTick(state: RaceState, driving: DrivingState, track: Track): RaceState {
  if (state.status.kind !== 'racing') return state;
  const elapsedTicks = state.elapsedTicks + 1;
  const before = [state.driving.player, ...state.driving.opponents.map((car) => car.vehicle)];
  const after = [driving.player, ...driving.opponents.map((car) => car.vehicle)];
  const events: RaceEvent[] = [];
  const progress = state.progress.map((car, index) => {
    const previous = before[index], current = after[index];
    if (!previous || !current) throw new Error('Missing race car.');
    const updated = advanceProgress(car, previous.stationMeters, current.stationMeters, elapsedTicks, track);
    events.push(...updated.events);
    return updated.progress;
  });
  events.sort((a, b) => {
    const timeA = 'crossingTick' in a ? a.crossingTick : 0;
    const timeB = 'crossingTick' in b ? b.crossingTick : 0;
    return timeA - timeB || ('carId' in a && 'carId' in b
      ? RACE.carOrder.indexOf(a.carId) - RACE.carOrder.indexOf(b.carId) : 0);
  });
  const standings = rankCars(progress);
  const player = progress[0];
  if (!player) throw new Error('Missing player progress.');
  const results = player.finishTick === null ? null : {
    position: standings.indexOf('player') + 1, totalTicks: player.finishTick, bestLapTicks: Math.min(...player.lapTicks),
  };
  return { ...state, driving, elapsedTicks, progress, standings, events, results,
    status: results ? { kind: 'results' } : state.status };
}

export function stepRace(state: RaceState, input: DrivingInput, track: Track): RaceState {
  if (state.status.kind === 'paused' || state.status.kind === 'results') return state;
  if (state.status.kind === 'countdown') {
    const countdownTicks = state.countdownTicks + 1;
    const go = countdownTicks === RACE.countdownTicks;
    const events: readonly RaceEvent[] = go ? [{ kind: 'go' }] : countdownTicks % SIMULATION.ticksPerSecond === 0
      ? [{ kind: 'countdown', number: 3 - countdownTicks / SIMULATION.ticksPerSecond }] : [];
    return { ...state, countdownTicks, status: { kind: go ? 'racing' : 'countdown' }, events };
  }
  return settleRaceTick(state, simulate(state.driving, input, track), track);
}

export function raceHud(state: RaceState) {
  const player = state.progress[0];
  if (!player) throw new Error('Missing player progress.');
  return {
    lap: Math.min(RACE.laps, player.lapTicks.length + 1),
    position: state.results?.position ?? state.standings.indexOf('player') + 1,
    currentLapTicks: state.results ? player.lapTicks[RACE.laps - 1] ?? 0 : state.elapsedTicks - player.lapStartTick,
    bestLapTicks: player.lapTicks.length ? Math.min(...player.lapTicks) : null,
    totalTicks: state.results?.totalTicks ?? state.elapsedTicks,
    countdown: Math.max(1, 3 - Math.floor(state.countdownTicks / SIMULATION.ticksPerSecond)),
  };
}
