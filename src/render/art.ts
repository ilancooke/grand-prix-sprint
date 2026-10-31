import type { Landmark } from '../game/types';

export function drawPlayer(context: CanvasRenderingContext2D, steering: number): void {
  context.save();
  context.translate(480 + steering * 3, 467);
  context.fillStyle = '#09273188';
  context.beginPath();
  context.ellipse(0, 12, 88, 18, 0, 0, Math.PI * 2);
  context.fill();
  // Four exposed slick tires, suspension, tapered body, cockpit, and broad rear wing.
  context.fillStyle = '#0d1a25';
  context.fillRect(-69, -64, 29, 34);
  context.fillRect(40, -64, 29, 34);
  context.fillRect(-81, -17, 34, 44);
  context.fillRect(47, -17, 34, 44);
  context.fillStyle = '#657886';
  context.fillRect(-52, -45, 104, 6);
  context.fillRect(-60, 0, 120, 7);
  context.fillStyle = '#e9513f';
  context.beginPath();
  context.moveTo(-13, -87);
  context.lineTo(13, -87);
  context.lineTo(34, 15);
  context.lineTo(-34, 15);
  context.closePath();
  context.fill();
  context.fillStyle = '#ffd7a5';
  context.fillRect(-4, -83, 8, 56);
  context.fillStyle = '#102938';
  context.fillRect(-15, -42, 30, 29);
  context.fillStyle = '#e6f6ea';
  context.beginPath();
  context.arc(0, -29, 10, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = '#6fbcc8';
  context.fillRect(-8, -31, 16, 5);
  context.fillStyle = '#ef684c';
  context.fillRect(-68, 10, 136, 14);
  context.fillStyle = '#fff0cc';
  context.fillRect(-63, 13, 126, 3);
  context.fillStyle = '#142e3b';
  context.fillRect(-71, 7, 8, 22);
  context.fillRect(63, 7, 8, 22);
  context.restore();
}

export function drawScenery(context: CanvasRenderingContext2D, x: number, y: number, scale: number, index: number): void {
  const height = 5 * scale;
  if (index % 3 === 0) {
    context.fillStyle = '#c5b99b';
    context.fillRect(x - scale * 0.15, y - height, scale * 0.3, height);
    context.fillStyle = '#f6d584';
    context.fillRect(x - 1.7 * scale, y - height, 3.4 * scale, 1.7 * scale);
    context.fillStyle = '#173a48';
    context.fillRect(x - 1.2 * scale, y - height + 0.6 * scale, 2.4 * scale, 0.25 * scale);
  } else {
    context.fillStyle = '#535c42';
    context.fillRect(x - scale * 0.2, y - height * 0.7, scale * 0.4, height * 0.7);
    context.fillStyle = index % 2 ? '#1c6354' : '#257363';
    context.beginPath();
    context.moveTo(x, y - height * 1.5);
    context.lineTo(x + 2 * scale, y - height * 0.4);
    context.lineTo(x - 2 * scale, y - height * 0.4);
    context.fill();
  }
}

export function drawObstacle(context: CanvasRenderingContext2D, x: number, y: number,
  scale: number, halfWidthMeters: number): void {
  // Yellow/black shoulder tire stacks; these alone have obstacle collision shapes.
  const width = halfWidthMeters * 2 * scale;
  context.fillStyle = '#172c36';
  context.fillRect(x - width / 2, y - scale * 0.9, width, scale * 0.9);
  context.fillStyle = '#f5c85b';
  context.fillRect(x - width / 2, y - scale * 0.7, width, scale * 0.2);
  context.fillRect(x - width / 2, y - scale * 0.3, width, scale * 0.15);
}

export function drawLandmark(context: CanvasRenderingContext2D, x: number, y: number,
  scale: number, landmark: Landmark): void {
  const stand = landmark.kind === 'grandstand';
  const width = (stand ? 10 : 6) * scale;
  const height = (stand ? 4 : 2) * scale;
  const top = y - 5 * scale;
  context.fillStyle = '#b4b9a5';
  context.fillRect(x - width * 0.4, top, scale * 0.2, y - top);
  context.fillRect(x + width * 0.4, top, scale * 0.2, y - top);
  context.fillStyle = stand ? '#355667' : '#f6d584';
  context.fillRect(x - width / 2, top, width, height);
  if (stand) {
    for (let row = 1; row < 5; row++) {
      context.fillStyle = row % 2 ? '#d7bf96' : '#db6a4c';
      context.fillRect(x - width / 2, top + row * height / 5, width, height / 10);
    }
  }
  context.fillStyle = stand ? '#fff0cc' : '#173a48';
  context.font = `bold ${Math.max(1, Math.round(scale * 0.7))}px monospace`;
  context.textAlign = 'center';
  context.fillText(landmark.label, x, top + scale * 1.2, width * 0.95);
}
