import type { AiProfile } from '../game/types';

// Bounded performance differences; every car still uses the same motion/contact rules.
export const AI_PROFILES: readonly AiProfile[] = Object.freeze([
  Object.freeze({ id: 'azure', maxSpeedMetersPerSecond: 78, accelerationMetersPerSecondSquared: 17,
    cornerDriftMetersPerSecond: 6.6, preferredLaneMeters: -3.2, passingSide: 1 }),
  Object.freeze({ id: 'gold', maxSpeedMetersPerSecond: 75, accelerationMetersPerSecondSquared: 16,
    cornerDriftMetersPerSecond: 6.2, preferredLaneMeters: 0, passingSide: -1 }),
  Object.freeze({ id: 'violet', maxSpeedMetersPerSecond: 81, accelerationMetersPerSecondSquared: 18,
    cornerDriftMetersPerSecond: 7, preferredLaneMeters: 3.2, passingSide: -1 }),
]);

export function profileFor(id: AiProfile['id']): AiProfile {
  const profile = AI_PROFILES.find((candidate) => candidate.id === id);
  if (!profile) throw new Error('Unknown opponent profile.');
  return profile;
}
