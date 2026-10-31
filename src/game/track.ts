import type { Landmark, RoadObstacle, RoadSegment, Track } from './types';

export function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

export function createTrack(
  segments: readonly RoadSegment[],
  segmentLengthMeters: number,
  roadHalfWidthMeters: number,
  obstacles: readonly RoadObstacle[] = [],
  landmarks: readonly Landmark[] = [],
): Track {
  if (segments.length === 0 || segmentLengthMeters <= 0 || roadHalfWidthMeters <= 0 ||
      !Number.isFinite(segmentLengthMeters) || !Number.isFinite(roadHalfWidthMeters) ||
      segments.some((segment) => !Number.isFinite(segment.curvaturePerMeter))) {
    throw new Error('Track requires finite geometry and at least one segment.');
  }
  const lengthMeters = segments.length * segmentLengthMeters;
  if (obstacles.some((obstacle) => !Number.isFinite(obstacle.stationMeters) ||
      obstacle.stationMeters < 0 || obstacle.stationMeters >= lengthMeters ||
      !Number.isFinite(obstacle.lateralMeters) || !Number.isFinite(obstacle.halfWidthMeters) ||
      !Number.isFinite(obstacle.halfLengthMeters) || obstacle.halfWidthMeters <= 0 ||
      obstacle.halfLengthMeters <= 0) ||
      landmarks.some((landmark) => !Number.isFinite(landmark.stationMeters) ||
        landmark.stationMeters < 0 || landmark.stationMeters >= lengthMeters ||
        !Number.isFinite(landmark.lateralMeters))) {
    throw new Error('Track objects require finite positions and positive collision dimensions.');
  }
  return Object.freeze({
    segments: Object.freeze(segments.map((segment) => Object.freeze({ ...segment }))),
    segmentLengthMeters,
    roadHalfWidthMeters,
    lengthMeters,
    obstacles: Object.freeze(obstacles.map((obstacle) => Object.freeze({ ...obstacle }))),
    landmarks: Object.freeze(landmarks.map((landmark) => Object.freeze({ ...landmark }))),
  });
}

export function segmentAt(track: Track, stationMeters: number): RoadSegment {
  const index = Math.floor(positiveModulo(stationMeters, track.lengthMeters) / track.segmentLengthMeters);
  const segment = track.segments[index];
  if (!segment) throw new Error('Invalid track station.');
  return segment;
}

// Signed shortest separation, including a contact straddling the finish seam.
export function wrappedSeparation(aMeters: number, bMeters: number, lengthMeters: number): number {
  return positiveModulo(aMeters - bMeters + lengthMeters / 2, lengthMeters) - lengthMeters / 2;
}
