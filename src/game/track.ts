import type { RoadSegment, Track } from './types';

export function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

export function createTrack(
  segments: readonly RoadSegment[],
  segmentLengthMeters: number,
  roadHalfWidthMeters: number,
): Track {
  if (segments.length === 0 || segmentLengthMeters <= 0 || roadHalfWidthMeters <= 0 ||
      !Number.isFinite(segmentLengthMeters) || !Number.isFinite(roadHalfWidthMeters) ||
      segments.some((segment) => !Number.isFinite(segment.curvaturePerMeter))) {
    throw new Error('Track requires finite geometry and at least one segment.');
  }
  return Object.freeze({
    segments: Object.freeze(segments.map((segment) => Object.freeze({ ...segment }))),
    segmentLengthMeters,
    roadHalfWidthMeters,
    lengthMeters: segments.length * segmentLengthMeters,
  });
}

export function segmentAt(track: Track, stationMeters: number): RoadSegment {
  const index = Math.floor(positiveModulo(stationMeters, track.lengthMeters) / track.segmentLengthMeters);
  const segment = track.segments[index];
  if (!segment) throw new Error('Invalid track station.');
  return segment;
}
