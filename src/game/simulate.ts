import { AI_PROFILES, profileFor } from '../content/opponents';
import { decideAi } from './ai';
import { resolveCarContact, resolveWorldContacts, separateTraffic } from './collisions';
import { AI, SIMULATION } from './config';
import { moveVehicle } from './vehicle';
import type { CarId, DrivingImpact, DrivingInput, DrivingState, Track, VehicleState } from './types';

export function createDrivingState(): DrivingState {
  return { tick: 0, player: { stationMeters: 0, lateralMeters: 0, speedMetersPerSecond: 0 },
    opponents: AI_PROFILES.map((profile, index) => ({ id: profile.id,
      vehicle: { stationMeters: AI.initialLeadMeters + index * AI.initialSpacingMeters, lateralMeters: profile.preferredLaneMeters, speedMetersPerSecond: 0 },
      ai: { laneMeters: profile.preferredLaneMeters, commitmentTicks: 0 } })), impacts: [] };
}

export function simulate(state: DrivingState, input: DrivingInput, track: Track): DrivingState {
  // All decisions see the same previous snapshot, never partially updated traffic.
  const before = [state.player, ...state.opponents.map((opponent) => opponent.vehicle)];
  const ids: readonly CarId[] = ['player', ...state.opponents.map((opponent) => opponent.id)];
  const decisions = state.opponents.map((opponent, index) => decideAi(opponent.vehicle, opponent.ai,
    profileFor(opponent.id), before.filter((_, carIndex) => carIndex !== index + 1), track));
  const proposed: VehicleState[] = before.map((vehicle, index) => {
    if (index === 0) return moveVehicle(vehicle, input, SIMULATION.stepSeconds, track);
    const opponent = state.opponents[index - 1];
    const decision = decisions[index - 1];
    if (!opponent || !decision) throw new Error('Missing opponent decision.');
    return moveVehicle(vehicle, decision.input, SIMULATION.stepSeconds, track, profileFor(opponent.id));
  });
  const impacts: DrivingImpact[] = [];
  const resolved = proposed.map((vehicle, index) => {
    const previous = before[index];
    const carId = ids[index];
    if (!previous || !carId) throw new Error('Missing car state.');
    const contact = resolveWorldContacts(previous, vehicle, track);
    for (const kind of contact.impacts) impacts.push({ carId, kind });
    return contact.vehicle;
  });
  // Apply each unordered pair's swept response once. Recheck world boundaries
  // afterward because lateral pair separation can push a car onto a shoulder.
  for (let a = 0; a < resolved.length; a++) {
    for (let b = a + 1; b < resolved.length; b++) {
      const previousA = before[a], previousB = before[b];
      const carA = resolved[a], carB = resolved[b];
      const idA = ids[a], idB = ids[b];
      if (!previousA || !previousB || !carA || !carB || !idA || !idB) throw new Error('Missing contact pair.');
      const pair = resolveCarContact(previousA, previousB, carA, carB, track);
      resolved[a] = pair[0];
      resolved[b] = pair[1];
      if (pair[0].speedMetersPerSecond < carA.speedMetersPerSecond ||
          pair[1].speedMetersPerSecond < carB.speedMetersPerSecond) {
        impacts.push({ carId: idA, kind: 'car', otherCarId: idB });
      }
    }
  }
  const bounded = resolved.map((vehicle, index) => {
    const previous = proposed[index];
    const carId = ids[index];
    if (!previous || !carId) throw new Error('Missing world contact state.');
    const contact = resolveWorldContacts(previous, vehicle, track);
    for (const kind of contact.impacts) impacts.push({ carId, kind });
    return contact.vehicle;
  });
  const final = separateTraffic(bounded, track);
  const player = final[0];
  if (!player) throw new Error('Missing player.');
  return { tick: state.tick + 1, player, opponents: state.opponents.map((opponent, index) => {
    const vehicle = final[index + 1];
    const decision = decisions[index];
    if (!vehicle || !decision) throw new Error('Missing opponent result.');
    return { id: opponent.id, vehicle, ai: decision.memory };
  }), impacts };
}
