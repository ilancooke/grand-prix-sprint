import { describe, expect, it } from 'vitest';
import { CIRCUIT } from '../../src/content/circuit';
import { RACE } from '../../src/game/config';
import { advanceProgress, createRace, pauseRace, raceHud, rankCars, resumeRace, settleRaceTick, stepRace, type CarProgress } from '../../src/game/race';
import { IDLE_INPUT } from '../../src/game/types';

const throttle = { ...IDLE_INPUT, accelerate: true };
function progress(): CarProgress { return createRace().progress[0]!; }
function travel(end: number, start = progress()) {
  let car = start;
  let tick = 0;
  const events = [];
  while (car.acceptedStationMeters < end) {
    const before = car.acceptedStationMeters;
    const updated = advanceProgress(car, before, Math.min(end, before + 1), ++tick, CIRCUIT);
    car = updated.progress;
    events.push(...updated.events);
    if (car.finishTick !== null) break;
  }
  return { car, events, tick };
}

describe('grid, countdown and pause', () => {
  it('places four stopped cars before the line, locks all motion for exactly 180 ticks and starts clocks at GO', () => {
    let race = createRace();
    const grid = race.driving;
    expect(new Set([grid.player, ...grid.opponents.map((car) => car.vehicle)].map((car) => `${car.stationMeters}/${car.lateralMeters}`)).size).toBe(4);
    for (const car of [grid.player, ...grid.opponents.map((car) => car.vehicle)]) {
      expect(car.stationMeters).toBeLessThan(0);
      expect(car.speedMetersPerSecond).toBe(0);
    }
    for (let i = 1; i <= 180; i++) {
      race = stepRace(race, throttle, CIRCUIT);
      expect(race.driving).toBe(grid);
      expect(race.elapsedTicks).toBe(0);
      expect(race.status.kind).toBe(i === 180 ? 'racing' : 'countdown');
      if (i === 60 || i === 120) expect(race.events).toEqual([{ kind: 'countdown', number: 3 - i / 60 }]);
    }
    expect(race.events).toEqual([{ kind: 'go' }]);
    race = stepRace(race, throttle, CIRCUIT);
    expect(race.elapsedTicks).toBe(1);
    expect(race.driving.player.stationMeters).toBeGreaterThan(grid.player.stationMeters);
  });

  it.each([65, 250])('preserves exact countdown/race counters and car/AI state across pause at tick %s', (ticks) => {
    let race = createRace();
    for (let i = 0; i < ticks; i++) race = stepRace(race, throttle, CIRCUIT);
    const paused = pauseRace(race);
    for (let i = 0; i < 10000; i++) expect(stepRace(paused, throttle, CIRCUIT)).toBe(paused);
    expect(resumeRace(paused)).toEqual({ ...race, events: [] });
    expect(pauseRace(paused)).toBe(paused);
  });
});

describe('lawful swept progress', () => {
  it('arms at the first line without a lap and visits each quarter gate before awarding a circuit', () => {
    const armed = travel(0);
    expect(armed.car.armed).toBe(true);
    expect(armed.car.lapTicks).toEqual([]);
    expect(armed.car.nextGateStationMeters).toBe(500);
    for (const end of [500, 1000, 1500, 1999]) {
      const { car } = travel(end);
      expect(car.lapTicks).toEqual([]);
      expect(car.faulted).toBe(false);
    }
    const first = travel(2000);
    expect(first.car.lapTicks).toEqual([2008]); // includes the grid-to-line trip
    expect(first.events).toEqual([{ kind: 'lap', carId: 'player', durationTicks: 2008, crossingTick: 2008 }]);
  });

  it.each([[-1, 1], [1999, 2001], [-8, 500], [-8, 2001], [-8, -9], [-8, NaN], [-8, Infinity]])(
    'rejects unanchored, skipped, reverse or discontinuous motion %s → %s with no ranking credit', (before, after) => {
      const original = progress();
      const result = advanceProgress(original, before, after, 1, CIRCUIT);
      expect(result.progress.faulted).toBe(true);
      expect(result.progress.acceptedStationMeters).toBe(original.acceptedStationMeters);
      expect(result.progress.lapTicks).toEqual([]);
      expect(result.events).toEqual([]);
      expect(advanceProgress(result.progress, after, after + 1, 2, CIRCUIT).progress).toBe(result.progress);
    });

  it('does not duplicate gate/finish contact and rejects seam oscillation', () => {
    const first = travel(2000).car;
    const duplicate = advanceProgress(first, 2000, 2000, 2009, CIRCUIT);
    expect(duplicate.progress.lapTicks).toHaveLength(1);
    expect(duplicate.events).toEqual([]);
    const reverse = advanceProgress(first, 2000, 1999.5, 2009, CIRCUIT);
    const forward = advanceProgress(reverse.progress, 1999.5, 2000.5, 2010, CIRCUIT);
    expect(forward.progress.lapTicks).toHaveLength(1);
    expect(forward.events).toEqual([]);
  });

  it('uses fractional crossing time for laps and total, stops at three and never starts lap four', () => {
    let car = { ...progress(), acceptedStationMeters: -0.25 };
    const events = [];
    for (let tick = 1; tick <= 6001; tick++) {
      const before = car.acceptedStationMeters;
      const result = advanceProgress(car, before, before + 1, tick, CIRCUIT);
      car = result.progress;
      events.push(...result.events);
    }
    expect(car.lapTicks).toEqual([2000.25, 2000, 2000]);
    expect(car.finishTick).toBe(6000.25);
    expect(car.lapTicks.reduce((sum, value) => sum + value, 0)).toBe(car.finishTick);
    expect(events.filter((event) => event.kind === 'finish')).toHaveLength(1);
    expect(advanceProgress(car, 6000.75, 6001.75, 6002, CIRCUIT).progress).toBe(car);
  });

  it('orders lawful progress across the seam, finished cars first, and exact ties by stable identity', () => {
    const a = { ...progress(), id: 'azure' as const, acceptedStationMeters: 1999 };
    const b = { ...travel(2001).car, id: 'gold' as const };
    const c = { ...progress(), id: 'violet' as const, acceptedStationMeters: 100, finishTick: 9000.5 };
    expect(rankCars([a, b, c, progress()])).toEqual(['violet', 'gold', 'azure', 'player']);
    expect(rankCars([{ ...c, id: 'azure' }, { ...c, id: 'player' }])).toEqual(['player', 'azure']);
  });

  it.each([0.1, 0.5, 0.9])('collects all same-tick finishers before freezing the player (AI crossing fraction %s)', (aiFraction) => {
    const initial = createRace();
    const playerBefore = 5999.5;
    const aiBefore = 6000 - aiFraction;
    const stations = [playerBefore, aiBefore, 1500, 0];
    const driving = { ...initial.driving, player: { ...initial.driving.player, stationMeters: playerBefore },
      opponents: initial.driving.opponents.map((car, index) => ({ ...car, vehicle: { ...car.vehicle, stationMeters: stations[index + 1]! } })) };
    const state = { ...initial, status: { kind: 'racing' as const }, elapsedTicks: 8999, driving,
      progress: initial.progress.map((car, index) => ({ ...car, armed: true, acceptedStationMeters: stations[index]!,
        nextGateStationMeters: index < 2 ? 6000 : 2000, lapTicks: index < 2 ? [3000, 3000] : [], lapStartTick: index < 2 ? 6000 : 0 })) };
    const nextDriving = { ...driving, tick: driving.tick + 1, player: { ...driving.player, stationMeters: 6000.5 },
      opponents: driving.opponents.map((car) => ({ ...car, vehicle: { ...car.vehicle, stationMeters: car.vehicle.stationMeters + 1 } })) };
    const result = settleRaceTick(state, nextDriving, CIRCUIT);
    expect(result.results).toEqual({ position: aiFraction < 0.5 ? 2 : 1, totalTicks: 8999.5, bestLapTicks: 2999.5 });
    expect(result.progress[1]!.finishTick).toBeCloseTo(8999 + aiFraction);
    expect(result.events.filter((event) => event.kind === 'finish').map((event) => 'carId' in event && event.carId))
      .toEqual(aiFraction < 0.5 ? ['azure', 'player'] : ['player', 'azure']);
    expect(stepRace(result, throttle, CIRCUIT)).toBe(result);
    expect(raceHud(result).lap).toBe(3);
  });

  it('accepts a legal finish crossing on the grass without inventing lap invalidation', () => {
    const initial = createRace();
    const lawful = travel(1999.5).car;
    const driving = { ...initial.driving, player: { stationMeters: 1999.5, lateralMeters: 8, speedMetersPerSecond: 30 } };
    const state = { ...initial, status: { kind: 'racing' as const }, elapsedTicks: 2007, driving,
      progress: [lawful, ...initial.progress.slice(1)] };
    const updated = settleRaceTick(state, { ...driving, player: { ...driving.player, stationMeters: 2000.5 } }, CIRCUIT);
    expect(updated.progress[0]!.lapTicks).toEqual([2007.5]);
    expect(updated.progress[0]!.faulted).toBe(false);
  });

  it('replay constructs a pristine grid, clocks, AI memory, gates and empty results', () => {
    let race = createRace();
    for (let tick = 0; tick < 800; tick++) race = stepRace(race, throttle, CIRCUIT);
    expect(race).not.toEqual(createRace());
    const fresh = createRace();
    expect(fresh.elapsedTicks).toBe(0);
    expect(fresh.countdownTicks).toBe(0);
    expect(fresh.results).toBeNull();
    expect(fresh.driving.tick).toBe(0);
    expect(fresh.driving.impacts).toEqual([]);
    expect(fresh.driving.opponents.map((car) => car.ai)).toEqual(
      RACE.grid.slice(1).map((slot) => ({ laneMeters: slot.lateralMeters, commitmentTicks: 0 })));
    expect(createRace().progress.every((car) => car.lapTicks.length === 0 && !car.armed)).toBe(true);
    expect(RACE.laps).toBe(3);
  });
});
