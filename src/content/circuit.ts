import { createTrack } from '../game/track';

// Original provisional Harbor Loop: eased right/left sweeps and a straight across the seam.
// Curvature is sampled at segment centers, with zero endpoints at section joins.
const sections = [
  { segments: 30, curvature: 0 },
  { segments: 50, curvature: 0.0025 },
  { segments: 20, curvature: 0 },
  { segments: 50, curvature: -0.003 },
  { segments: 20, curvature: 0 },
  { segments: 40, curvature: 0.002 },
  { segments: 20, curvature: 0 },
  { segments: 40, curvature: -0.0018 },
  { segments: 30, curvature: 0 },
] as const;

export const CIRCUIT = createTrack(sections.flatMap((section) =>
  Array.from({ length: section.segments }, (_, index) => ({
    curvaturePerMeter: section.curvature * Math.sin(Math.PI * (index + 0.5) / section.segments) ** 2,
  }))), 5, 7);
