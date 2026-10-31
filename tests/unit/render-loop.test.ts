import { expect, it } from 'vitest';
import { CIRCUIT } from '../../src/content/circuit';
import { createDrivingState } from '../../src/game/simulate';
import { render } from '../../src/render/renderer';

function recordScene(stationMeters: number, withTraffic = false, trafficOffsetMeters = 0): readonly unknown[] {
  const commands: unknown[] = [];
  const record = (name: string) => (...values: number[]): void => { commands.push([name, ...values]); };
  const context = {
    set fillStyle(value: string) { commands.push(['color', value]); },
    fillText: (text: string, ...values: number[]) => { commands.push(['text', text, ...values]); },
    fillRect: record('rectangle'), beginPath: record('begin'), arc: record('arc'),
    ellipse: record('ellipse'), moveTo: record('move'), lineTo: record('line'),
    closePath: record('close'), fill: record('fill'), save: record('save'),
    restore: record('restore'), scale: record('scale'), translate: record('translate'),
  } as unknown as CanvasRenderingContext2D;
  render(context, CIRCUIT, { stationMeters, lateralMeters: 1, speedMetersPerSecond: 60 }, 0,
    withTraffic ? createDrivingState().opponents.map((opponent) => ({ ...opponent,
      vehicle: { ...opponent.vehicle, stationMeters: opponent.vehicle.stationMeters + stationMeters + trafficOffsetMeters } })) : []);
  return commands;
}

it('renders identical geometry, road markers, and scenery at the same station on subsequent loops', () => {
  expect(recordScene(CIRCUIT.lengthMeters)).toEqual(recordScene(0));
  expect(recordScene(CIRCUIT.lengthMeters * 2 + 250)).toEqual(recordScene(250));
});

it('projects three distinct palettes periodically and omits cars behind the chase camera', () => {
  const scene = recordScene(0, true);
  for (const color of ['#29badb', '#f5c547', '#b585ed']) expect(scene).toContainEqual(['color', color]);
  expect(recordScene(2000, true)).toEqual(scene);
  const behind = recordScene(0, true, -100);
  for (const color of ['#29badb', '#f5c547', '#b585ed']) expect(behind).not.toContainEqual(['color', color]);
});
