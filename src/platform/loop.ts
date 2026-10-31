import { SIMULATION } from '../game/config';

export const LOOP = { stepMilliseconds: 1000 / SIMULATION.ticksPerSecond, maxFrameGapMilliseconds: 250 } as const;

// Wall time enters through this adapter; the game receives only fixed simulation ticks.
export class FixedStepClock {
  private previousMilliseconds: number | undefined;
  private accumulatorMilliseconds = 0;

  reset(): void {
    this.previousMilliseconds = undefined;
    this.accumulatorMilliseconds = 0;
  }

  advance(nowMilliseconds: number, tick: () => void): { alpha: number; interrupted: boolean } {
    if (this.previousMilliseconds === undefined) {
      this.previousMilliseconds = nowMilliseconds;
      return { alpha: 0, interrupted: false };
    }
    const elapsedMilliseconds = nowMilliseconds - this.previousMilliseconds;
    this.previousMilliseconds = nowMilliseconds;
    if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0 ||
        elapsedMilliseconds > LOOP.maxFrameGapMilliseconds) {
      this.reset();
      return { alpha: 0, interrupted: true };
    }
    this.accumulatorMilliseconds += elapsedMilliseconds;
    // The epsilon only absorbs floating point error at a tick boundary.
    while (this.accumulatorMilliseconds + 1e-7 >= LOOP.stepMilliseconds) {
      tick();
      this.accumulatorMilliseconds = Math.max(0, this.accumulatorMilliseconds - LOOP.stepMilliseconds);
    }
    return { alpha: this.accumulatorMilliseconds / LOOP.stepMilliseconds, interrupted: false };
  }
}
