import { positiveModulo, segmentAt } from '../game/track';
import type { Track, VehicleState } from '../game/types';
import { drawPlayer, drawScenery } from './art';
import { project, VIEW } from './projection';
import type { ProjectedPoint } from './projection';

interface Strip { readonly near: ProjectedPoint; readonly far: ProjectedPoint; readonly index: number }

function quad(context: CanvasRenderingContext2D, near: ProjectedPoint, far: ProjectedPoint,
  halfWidthMeters: number, color: string): void {
  context.fillStyle = color;
  context.beginPath();
  // Snap strip edges to pixel rows so curb color cannot bleed through the road.
  context.moveTo(near.x - halfWidthMeters * near.scale, Math.ceil(near.y));
  context.lineTo(far.x - halfWidthMeters * far.scale, Math.floor(far.y));
  context.lineTo(far.x + halfWidthMeters * far.scale, Math.floor(far.y));
  context.lineTo(near.x + halfWidthMeters * near.scale, Math.ceil(near.y));
  context.fill();
}

export function render(context: CanvasRenderingContext2D, track: Track, player: VehicleState, steer: number): void {
  context.fillStyle = '#8bc6cc';
  context.fillRect(0, 0, VIEW.width, VIEW.height);
  context.fillStyle = '#f6da95';
  context.beginPath();
  context.arc(757, 92, 38, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#689d98';
  context.beginPath();
  context.moveTo(0, VIEW.horizonY);
  for (let x = 0; x <= VIEW.width; x += 40) {
    context.lineTo(x, 155 + Math.sin(x * 0.013) * 17 + Math.cos(x * 0.027) * 10);
  }
  context.lineTo(VIEW.width, VIEW.horizonY);
  context.fill();
  context.fillStyle = '#4e956a';
  context.fillRect(0, VIEW.horizonY, VIEW.width, VIEW.height - VIEW.horizonY);

  const strips: Strip[] = [];
  const firstIndex = Math.floor(player.stationMeters / track.segmentLengthMeters);
  const segmentFraction = positiveModulo(player.stationMeters, track.segmentLengthMeters) / track.segmentLengthMeters;
  const localCurvature = segmentAt(track, player.stationMeters).curvaturePerMeter;
  // Integrate from a segment boundary behind the near plane. Fractional initialization
  // keeps road curvature continuous when the camera crosses each segment boundary.
  let heading = -localCurvature * segmentFraction * track.segmentLengthMeters;
  let centerMeters = 0.5 * localCurvature * (segmentFraction * track.segmentLengthMeters) ** 2;
  let previous: ProjectedPoint | null = project(
    0.5 * localCurvature * VIEW.nearMeters ** 2 - player.lateralMeters, VIEW.nearMeters);
  for (let offset = 0; offset <= VIEW.drawSegments; offset++) {
    const index = firstIndex + offset;
    const distanceMeters = (offset - segmentFraction) * track.segmentLengthMeters;
    const point = distanceMeters > VIEW.nearMeters ? project(centerMeters - player.lateralMeters, distanceMeters) : null;
    if (point && previous) strips.push({ near: previous, far: point, index });
    if (point) previous = point;
    const curvature = segmentAt(track, index * track.segmentLengthMeters).curvaturePerMeter;
    centerMeters += heading * track.segmentLengthMeters + 0.5 * curvature * track.segmentLengthMeters ** 2;
    heading += curvature * track.segmentLengthMeters;
  }

  for (let i = strips.length - 1; i >= 0; i--) {
    const strip = strips[i];
    if (!strip) continue;
    const { near, far, index } = strip;
    const wrappedIndex = positiveModulo(index, track.segments.length);
    const alternate = Math.floor(wrappedIndex / 3) % 2 === 0;
    context.fillStyle = alternate ? '#4e956a' : '#488c64';
    context.fillRect(0, far.y, VIEW.width, near.y - far.y + 1);
    quad(context, near, far, track.roadHalfWidthMeters + 0.7, alternate ? '#f3e9cf' : '#d55b49');
    quad(context, near, far, track.roadHalfWidthMeters, alternate ? '#52616a' : '#4e5c65');
    if (alternate) {
      for (const lane of [-1, 1]) {
        quad(context,
          { ...near, x: near.x + lane * track.roadHalfWidthMeters / 3 * near.scale },
          { ...far, x: far.x + lane * track.roadHalfWidthMeters / 3 * far.scale },
          0.055, '#eee8cc');
      }
    }
    if (wrappedIndex % 12 === 0) {
      const side = Math.floor(wrappedIndex / 12) % 2 === 0 ? -1 : 1;
      drawScenery(context, far.x + side * (track.roadHalfWidthMeters + 3) * far.scale, far.y, far.scale, wrappedIndex / 12);
    }
  }
  drawPlayer(context, steer);
}
