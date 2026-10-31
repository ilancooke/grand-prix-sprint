import { describe, expect, it } from 'vitest';
import { CIRCUIT } from '../../src/content/circuit';
import { HANDLING, SIMULATION } from '../../src/game/config';
import { createDrivingState, simulate } from '../../src/game/simulate';
import { createTrack, wrappedSeparation } from '../../src/game/track';
import { IDLE_INPUT } from '../../src/game/types';
import type { DrivingState } from '../../src/game/types';

const straight = createTrack([{ curvaturePerMeter: 0 }], 2000, 7);

function runLongTraffic() {
  let state = createDrivingState();
  const crossings: number[][] = [[], [], []];
  const starts = state.opponents.map((opponent) => opponent.vehicle.stationMeters);
  const counts = { car: 0, barrier: 0, obstacle: 0 };
  const offRoadTicks = [0, 0, 0];
  for (let tick = 0; tick < 30000 && crossings.some((times) => times.length < 10); tick++) {
    const previous = state;
    state = simulate(state, IDLE_INPUT, CIRCUIT);
    for (const event of state.impacts) counts[event.kind]++;
    state.opponents.forEach((opponent, index) => {
      const before = previous.opponents[index]!.vehicle;
      const delta = opponent.vehicle.stationMeters - before.stationMeters;
      if (delta < 0 || delta > HANDLING.maxSpeedMetersPerSecond * SIMULATION.stepSeconds + 1e-9) throw new Error('Discontinuous motion');
      if (Math.abs(opponent.vehicle.lateralMeters) > CIRCUIT.roadHalfWidthMeters) offRoadTicks[index]!++;
      const line = starts[index]! + (crossings[index]!.length + 1) * CIRCUIT.lengthMeters;
      if (before.stationMeters < line && opponent.vehicle.stationMeters >= line && crossings[index]!.length < 10) {
        crossings[index]!.push((tick + (line - before.stationMeters) / delta) / SIMULATION.ticksPerSecond);
      }
    });
  }
  return { state, crossings, counts, offRoadTicks };
}

describe('four-car traffic integration', () => {
  it('circulates at least ten times per AI with deterministic bounded progress and measured contact counts', () => {
    const first = runLongTraffic();
    expect(runLongTraffic()).toEqual(first);
    expect(first.crossings.map((times) => times.length)).toEqual([10, 10, 10]);
    const traversals = first.crossings.map((times) => times.map((time, i) => time - (times[i - 1] ?? 0)));
    console.info('M3 traffic evidence', JSON.stringify({ traversals, counts: first.counts, offRoadTicks: first.offRoadTicks }));
    for (const times of traversals) for (const time of times) expect(time).toBeLessThan(32);
    expect(first.counts.barrier).toBe(0);
    expect(first.counts.obstacle).toBe(0);
    expect(first.counts.car).toBe(0);
    expect(first.offRoadTicks).toEqual([0, 0, 0]);
    expect(new Set(first.crossings.map((times) => times[9]!.toFixed(2))).size).toBe(3);
  });

  it('allows a faster AI to pass a slower AI and a player on a clear straight', () => {
    let state = createDrivingState();
    state = { ...state, player: { stationMeters: 70, lateralMeters: -3.2, speedMetersPerSecond: 25 },
      opponents: state.opponents.map((opponent, i) => ({ ...opponent,
        vehicle: { stationMeters: i === 0 ? 0 : i === 1 ? 40 : -300, lateralMeters: i === 2 ? 3.2 : -3.2,
          speedMetersPerSecond: i === 0 ? 70 : 25 }, ai: { laneMeters: -3.2, commitmentTicks: 0 } })) };
    for (let tick = 0; tick < 1800; tick++) state = simulate(state, IDLE_INPUT, straight);
    expect(state.opponents[0]!.vehicle.stationMeters).toBeGreaterThan(state.player.stationMeters);
    // Gold remains slightly slower, while Azure can choose a passing lane.
    expect(state.opponents[0]!.vehicle.stationMeters).toBeGreaterThan(state.opponents[1]!.vehicle.stationMeters);
  });

  it('lets the real player input pass an AI side by side without an impact', () => {
    let state = createDrivingState();
    state = { ...state, player: { stationMeters: 0, lateralMeters: -3.2, speedMetersPerSecond: 84 },
      opponents: state.opponents.map((opponent, i) => ({ ...opponent,
        vehicle: { stationMeters: i === 0 ? 10 : 400 + i * 100, lateralMeters: i === 0 ? 0 : 3.2, speedMetersPerSecond: 50 },
        ai: { laneMeters: i === 0 ? 0 : 3.2, commitmentTicks: 120 } })) };
    let hits = 0;
    for (let tick = 0; tick < 180; tick++) {
      state = simulate(state, { ...IDLE_INPUT, accelerate: true }, straight);
      hits += state.impacts.length;
    }
    expect(state.player.stationMeters).toBeGreaterThan(state.opponents[0]!.vehicle.stationMeters + 10);
    expect(hits).toBe(0);
  });

  it('follows a blocked three-wide field instead of overlapping, then passes when an opening appears', () => {
    let state = createDrivingState();
    state = { ...state, player: { stationMeters: 25, lateralMeters: 0, speedMetersPerSecond: 0 },
      opponents: state.opponents.map((opponent, i) => ({ ...opponent,
        vehicle: { stationMeters: i === 0 ? 0 : 25, lateralMeters: i === 0 ? 0 : i === 1 ? -3.2 : 3.2, speedMetersPerSecond: i === 0 ? 20 : 0 },
        ai: { laneMeters: i === 0 ? 0 : i === 1 ? -3.2 : 3.2, commitmentTicks: 0 } })) };
    // Hold the two flank cars as external slow traffic; the follower uses production decisions/motion.
    for (let tick = 0; tick < 90; tick++) {
      const held = state.opponents.slice(1);
      state = simulate(state, IDLE_INPUT, straight);
      state = { ...state, opponents: [state.opponents[0]!, ...held] };
      expect(state.opponents[0]!.vehicle.stationMeters).toBeLessThan(21);
    }
    expect(state.opponents[0]!.vehicle.speedMetersPerSecond).toBeLessThan(5);
    state = { ...state, opponents: state.opponents.map((opponent, i) => i === 0 ? opponent :
      { ...opponent, vehicle: { ...opponent.vehicle, stationMeters: 500 + i * 100 } }) };
    for (let tick = 0; tick < 900; tick++) state = simulate(state, IDLE_INPUT, straight);
    expect(state.opponents[0]!.vehicle.stationMeters).toBeGreaterThan(80);
  });

  it.each([0, 2000])('resolves player/AI impact at seam %s and permits recovery without changing stations', (seam) => {
    let state: DrivingState = createDrivingState();
    state = { ...state, player: { stationMeters: seam - 4.5, lateralMeters: 0, speedMetersPerSecond: 84 },
      opponents: state.opponents.map((opponent, i) => ({ ...opponent,
        vehicle: { stationMeters: seam + i * 100, lateralMeters: i === 0 ? 0 : 3.2, speedMetersPerSecond: 0 } })) };
    const next = simulate(state, { ...IDLE_INPUT, accelerate: true }, straight);
    expect(next.impacts.some((event) => event.kind === 'car')).toBe(true);
    expect(next.player.stationMeters).toBeCloseTo(seam - 4.5 + 84 / 60);
    expect(Math.abs(next.player.lateralMeters - next.opponents[0]!.vehicle.lateralMeters)).toBeGreaterThan(1.8);
    expect(next.player.speedMetersPerSecond).toBeGreaterThan(65);
    state = next;
    for (let tick = 0; tick < 300; tick++) state = simulate(state, { ...IDLE_INPUT, accelerate: true, steer: -0.05 }, straight);
    expect(state.player.stationMeters).toBeGreaterThan(next.player.stationMeters + 300);
    expect(state.opponents[0]!.vehicle.stationMeters).toBeGreaterThan(next.opponents[0]!.vehicle.stationMeters + 200);
  });

  it('separates a four-car pileup near an obstacle and barrier and continues without repeated penalties', () => {
    let state = createDrivingState();
    state = { ...state, player: { stationMeters: 179, lateralMeters: -9, speedMetersPerSecond: 30 },
      opponents: state.opponents.map((opponent) => ({ ...opponent,
        vehicle: { stationMeters: 179, lateralMeters: -9, speedMetersPerSecond: 30 } })) };
    const start = state.player.stationMeters;
    let impacts = 0;
    for (let tick = 0; tick < 600; tick++) {
      state = simulate(state, { ...IDLE_INPUT, accelerate: true, steer: 0.15 }, CIRCUIT);
      impacts += state.impacts.length;
      const cars = [state.player, ...state.opponents.map((opponent) => opponent.vehicle)];
      for (let a = 0; a < cars.length; a++) for (let b = a + 1; b < cars.length; b++) {
        if (Math.abs(wrappedSeparation(cars[a]!.stationMeters, cars[b]!.stationMeters, CIRCUIT.lengthMeters)) < 4.4) {
          expect(Math.abs(cars[a]!.lateralMeters - cars[b]!.lateralMeters)).toBeGreaterThanOrEqual(1.8 - 1e-6);
        }
      }
    }
    expect(state.player.stationMeters - start).toBeGreaterThan(200);
    expect(impacts).toBeLessThan(20);
    for (const opponent of state.opponents) expect(opponent.vehicle.stationMeters - start).toBeGreaterThan(300);
  });


  it('can leave a close stopped queue without reverse motion or a longitudinal reset', () => {
    let state = createDrivingState();
    state = { ...state, opponents: state.opponents.map((opponent, i) => ({ ...opponent,
      vehicle: { stationMeters: i === 0 ? -6 : 500 + i * 100, lateralMeters: 0, speedMetersPerSecond: 0 },
      ai: { laneMeters: 0, commitmentTicks: 0 } })) };
    let hits = 0;
    for (let tick = 0; tick < 900; tick++) {
      const before = state.opponents[0]!.vehicle.stationMeters;
      state = simulate(state, IDLE_INPUT, straight);
      const delta = state.opponents[0]!.vehicle.stationMeters - before;
      expect(delta).toBeGreaterThanOrEqual(0);
      expect(delta).toBeLessThanOrEqual(84 / 60 + 1e-9);
      hits += state.impacts.filter((impact) => impact.kind === 'car').length;
    }
    expect(state.opponents[0]!.vehicle.stationMeters).toBeGreaterThan(100);
    expect(hits).toBeLessThanOrEqual(2);
  });

});
