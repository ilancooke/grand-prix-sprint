import { createTrack } from '../game/track';

// Original 2000 m Harbor Loop, periodic in track coordinates. Each bend eases
// from/to zero curvature; the start seam sits in the long pit straight.
export const CIRCUIT_SECTIONS = [
  { name: 'Pit straight', segments: 60, curvature: 0 },
  { name: 'Lighthouse right', segments: 50, curvature: 0.0025 },
  { name: 'Quay straight', segments: 40, curvature: 0 },
  { name: 'Anchor hairpin', segments: 36, curvature: -0.0095 },
  { name: 'Marina straight', segments: 30, curvature: 0 },
  { name: 'Breakwater right', segments: 44, curvature: 0.0032 },
  { name: 'Coast straight', segments: 44, curvature: 0 },
  { name: 'Pines left', segments: 40, curvature: -0.0035 },
  { name: 'Home right', segments: 26, curvature: 0.0025 },
  { name: 'Home straight', segments: 30, curvature: 0 },
] as const;

export const CIRCUIT = createTrack(CIRCUIT_SECTIONS.flatMap((section) =>
  Array.from({ length: section.segments }, (_, index) => ({
    curvaturePerMeter: section.curvature * Math.sin(Math.PI * (index + 0.5) / section.segments) ** 2,
  }))), 5, 7, [
  { stationMeters: 180, lateralMeters: -9.3, halfWidthMeters: 0.65, halfLengthMeters: 1.4 },
  { stationMeters: 660, lateralMeters: 9.3, halfWidthMeters: 0.65, halfLengthMeters: 1.4 },
  { stationMeters: 1440, lateralMeters: -9.3, halfWidthMeters: 0.65, halfLengthMeters: 1.4 },
], [
  { stationMeters: 70, lateralMeters: -18.5, kind: 'grandstand', label: 'HARBOR' },
  { stationMeters: 270, lateralMeters: 15, kind: 'sign', label: 'LIGHTHOUSE' },
  { stationMeters: 650, lateralMeters: -15, kind: 'sign', label: 'BRAKE 100' },
  { stationMeters: 700, lateralMeters: -15, kind: 'sign', label: 'ANCHOR 50' },
  { stationMeters: 970, lateralMeters: 18.5, kind: 'grandstand', label: 'MARINA' },
  { stationMeters: 1080, lateralMeters: -15, kind: 'sign', label: 'BREAKWATER' },
  { stationMeters: 1510, lateralMeters: 15, kind: 'sign', label: 'PINES' },
]);
