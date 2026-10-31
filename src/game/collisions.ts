import { CONTACT, HANDLING } from './config';
import { wrappedSeparation } from './track';
import type { Track, VehicleState } from './types';

type Impact = 'barrier' | 'obstacle';
export interface ContactResult {
  readonly vehicle: VehicleState;
  readonly impacts: readonly Impact[];
}

export function lateralLimitMeters(track: Track): number {
  return track.roadHalfWidthMeters + HANDLING.barrierOffsetMeters - CONTACT.carHalfWidthMeters;
}

// Slab intersection for a moving point against an expanded contact rectangle.
// Both axes share one time interval; checking their sweeps separately gives false hits.
function sweptOverlap(z: number, x: number, dz: number, dx: number, halfLength: number, halfWidth: number): boolean {
  let enter = 0;
  let exit = 1;
  for (const [position, delta, extent] of [[z, dz, halfLength], [x, dx, halfWidth]]) {
    if (position === undefined || delta === undefined || extent === undefined) return false;
    if (Math.abs(delta) < 1e-12) {
      if (Math.abs(position) > extent) return false;
    } else {
      const a = (-extent - position) / delta;
      const b = (extent - position) / delta;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (enter > exit) return false;
    }
  }
  return true;
}

export function resolveWorldContacts(previous: VehicleState, proposed: VehicleState, track: Track): ContactResult {
  let vehicle = proposed;
  const impacts: Impact[] = [];
  const limit = lateralLimitMeters(track);
  if (Math.abs(vehicle.lateralMeters) > limit) {
    const entered = Math.abs(previous.lateralMeters) < limit - CONTACT.separationMeters;
    vehicle = { ...vehicle, lateralMeters: Math.sign(vehicle.lateralMeters) * limit,
      speedMetersPerSecond: vehicle.speedMetersPerSecond * (entered ? CONTACT.barrierSpeedRetention : 1) };
    if (entered) impacts.push('barrier');
  }
  for (const obstacle of track.obstacles) {
    const z = wrappedSeparation(previous.stationMeters, obstacle.stationMeters, track.lengthMeters);
    const x = previous.lateralMeters - obstacle.lateralMeters;
    const halfLength = CONTACT.carHalfLengthMeters + obstacle.halfLengthMeters;
    const halfWidth = CONTACT.carHalfWidthMeters + obstacle.halfWidthMeters;
    if (!sweptOverlap(z, x, vehicle.stationMeters - previous.stationMeters,
      vehicle.lateralMeters - previous.lateralMeters, halfLength, halfWidth)) continue;
    // Separate laterally even during sustained contact; never move station to recover.
    let side = Math.sign(x) || -Math.sign(obstacle.lateralMeters) || 1;
    // A shoulder object can leave too little space beside the outer barrier.
    // Choose the open side instead of clamping a car inside the obstacle.
    if (Math.abs(obstacle.lateralMeters + side * (halfWidth + CONTACT.separationMeters)) > limit) side = -side;
    const entered = Math.abs(z) > halfLength || Math.abs(x) > halfWidth + CONTACT.separationMeters;
    vehicle = { ...vehicle,
      lateralMeters: Math.max(-limit, Math.min(limit,
        obstacle.lateralMeters + side * (halfWidth + CONTACT.separationMeters))),
      speedMetersPerSecond: vehicle.speedMetersPerSecond * (entered ? CONTACT.obstacleSpeedRetention : 1) };
    if (entered) impacts.push('obstacle');
  }
  return { vehicle, impacts };
}

// Generic two-car contact for M3. Caller resolves each unordered pair once per tick.
// Previous and proposed states permit swept contact at the seam and at maximum speed.
export function resolveCarContact(previousA: VehicleState, previousB: VehicleState,
  proposedA: VehicleState, proposedB: VehicleState, track: Track): readonly [VehicleState, VehicleState] {
  const z = wrappedSeparation(previousA.stationMeters, previousB.stationMeters, track.lengthMeters);
  const x = previousA.lateralMeters - previousB.lateralMeters;
  const halfLength = CONTACT.carHalfLengthMeters * 2;
  const halfWidth = CONTACT.carHalfWidthMeters * 2;
  if (!sweptOverlap(z, x,
    (proposedA.stationMeters - previousA.stationMeters) - (proposedB.stationMeters - previousB.stationMeters),
    (proposedA.lateralMeters - previousA.lateralMeters) - (proposedB.lateralMeters - previousB.lateralMeters),
    halfLength, halfWidth)) return [proposedA, proposedB];
  const side = Math.sign(x) || 1;
  const spacing = halfWidth + CONTACT.separationMeters;
  const limit = lateralLimitMeters(track) - spacing / 2;
  const middle = Math.max(-limit, Math.min(limit, (proposedA.lateralMeters + proposedB.lateralMeters) / 2));
  const entered = Math.abs(z) > halfLength || Math.abs(x) > halfWidth + CONTACT.separationMeters;
  const retention = entered ? CONTACT.carSpeedRetention : 1;
  return [
    { ...proposedA, lateralMeters: middle + side * spacing / 2,
      speedMetersPerSecond: proposedA.speedMetersPerSecond * retention },
    { ...proposedB, lateralMeters: middle - side * spacing / 2,
      speedMetersPerSecond: proposedB.speedMetersPerSecond * retention },
  ];
}
