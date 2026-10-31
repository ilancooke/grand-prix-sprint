import { HANDLING } from '../game/config';
import { positiveModulo, segmentAt } from '../game/track';
import type { Track, VehicleState } from '../game/types';
import { drawLandmark, drawObstacle, drawPlayer, drawScenery } from './art';
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
  const cameraStationMeters = player.stationMeters - VIEW.chaseDistanceMeters;
  const firstIndex = Math.floor(cameraStationMeters / track.segmentLengthMeters);
  const segmentFraction = positiveModulo(cameraStationMeters, track.segmentLengthMeters) / track.segmentLengthMeters;
  const localCurvature = segmentAt(track, cameraStationMeters).curvaturePerMeter;
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
    // A narrow two-row checkered stripe straddles the circuit seam.
    const stripPoint = (fraction: number): ProjectedPoint => ({
      x: near.x + (far.x - near.x) * fraction,
      y: near.y + (far.y - near.y) * fraction,
      scale: near.scale + (far.scale - near.scale) * fraction,
    });
    if (wrappedIndex < 2) {
      const cellWidth = track.roadHalfWidthMeters * 2 / 16;
      for (let cell = 0; cell < 16; cell++) {
        const lateral = -track.roadHalfWidthMeters + (cell + 0.5) * cellWidth;
        const stripeNear = wrappedIndex === 0 ? stripPoint(0.85) : near;
        const stripeFar = wrappedIndex === 0 ? far : stripPoint(0.15);
        quad(context, { ...stripeNear, x: stripeNear.x + lateral * stripeNear.scale },
          { ...stripeFar, x: stripeFar.x + lateral * stripeFar.scale }, cellWidth / 2,
          (cell + wrappedIndex) % 2 ? '#182e38' : '#fff0cc');
      }
    }
    for (const side of [-1, 1]) {
      const boundary = side * (track.roadHalfWidthMeters + HANDLING.barrierOffsetMeters);
      quad(context, { ...near, x: near.x + boundary * near.scale },
        { ...far, x: far.x + boundary * far.scale }, 0.18, alternate ? '#d7c9ad' : '#344c55');
    }
    if (alternate && wrappedIndex >= 2) {
      for (const lane of [-1, 1]) {
        quad(context,
          { ...near, x: near.x + lane * track.roadHalfWidthMeters / 3 * near.scale },
          { ...far, x: far.x + lane * track.roadHalfWidthMeters / 3 * far.scale },
          0.055, '#eee8cc');
      }
    }
    for (const landmark of track.landmarks) {
      if (Math.floor(landmark.stationMeters / track.segmentLengthMeters) === wrappedIndex) {
        drawLandmark(context, far.x + landmark.lateralMeters * far.scale, far.y, far.scale, landmark);
      }
    }
    for (const obstacle of track.obstacles) {
      if (Math.floor(obstacle.stationMeters / track.segmentLengthMeters) === wrappedIndex) {
        drawObstacle(context, far.x + obstacle.lateralMeters * far.scale, far.y, far.scale, obstacle.halfWidthMeters);
      }
    }
    if (wrappedIndex % 12 === 0) {
      const side = Math.floor(wrappedIndex / 12) % 2 === 0 ? -1 : 1;
      drawScenery(context, far.x + side * (track.roadHalfWidthMeters + 8) * far.scale, far.y, far.scale, wrappedIndex / 12);
    }
  }
  drawPlayer(context, steer);
}
