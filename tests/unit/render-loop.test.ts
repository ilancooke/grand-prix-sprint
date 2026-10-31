import { expect, it } from 'vitest';
import { CIRCUIT } from '../../src/content/circuit';
import { render } from '../../src/render/renderer';

function recordScene(stationMeters: number): readonly unknown[] {
  const commands: unknown[] = [];
  const record = (name: string) => (...values: number[]): void => { commands.push([name, ...values]); };
  const context = {
    set fillStyle(value: string) { commands.push(['color', value]); },
    fillRect: record('rectangle'), beginPath: record('begin'), arc: record('arc'),
    ellipse: record('ellipse'), moveTo: record('move'), lineTo: record('line'),
    closePath: record('close'), fill: record('fill'), save: record('save'),
    restore: record('restore'), translate: record('translate'),
  } as unknown as CanvasRenderingContext2D;
  render(context, CIRCUIT, { stationMeters, lateralMeters: 1, speedMetersPerSecond: 60 }, 0);
  return commands;
}

it('renders identical geometry, road markers, and scenery at the same station on subsequent loops', () => {
  expect(recordScene(CIRCUIT.lengthMeters)).toEqual(recordScene(0));
  expect(recordScene(CIRCUIT.lengthMeters * 2 + 250)).toEqual(recordScene(250));
});
