import { CIRCUIT } from '../../src/content/circuit';
import { AI_PROFILES } from '../../src/content/opponents';
import { decideAi } from '../../src/game/ai';
import type { RaceState } from '../../src/game/race';
import type { DrivingInput } from '../../src/game/types';

// Test-only driver: normal shared steering/throttle/brake input, no position edits.
export function driver(state: RaceState): DrivingInput {
  const decision = decideAi(state.driving.player, { laneMeters: -1.6, commitmentTicks: 0 },
    AI_PROFILES[2]!, state.driving.opponents.map((car) => car.vehicle), CIRCUIT);
  return decision.input;
}

