import { SIMULATION } from '../game/config';
import type { RaceEvent } from '../game/race';

export const PERSONAL_BEST_KEY = 'grand-prix-sprint.personal-best';

interface RecordStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface PersonalRecord {
  readonly bestLapMilliseconds: number | null;
  readonly savingAvailable: boolean;
}

export function validLapMilliseconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= Number.MAX_SAFE_INTEGER;
}

export function parsePersonalBest(raw: string | null): number | null {
  if (raw === null) return null;
  try {
    const record: unknown = JSON.parse(raw);
    if (typeof record !== 'object' || record === null || !('version' in record) || record.version !== 1 ||
        !('bestLapMilliseconds' in record) || !validLapMilliseconds(record.bestLapMilliseconds)) return null;
    return record.bestLapMilliseconds;
  } catch { return null; }
}

// The factory keeps even a denied localStorage getter inside the failure boundary.
// Only the controller's synchronous, validated lap events enter this adapter.
export class PersonalRecords {
  private bestLapMilliseconds: number | null = null;
  private savingAvailable = true;

  constructor(private readonly storage: () => RecordStorage = () => window.localStorage) {
    this.read();
  }

  snapshot(): PersonalRecord {
    return { bestLapMilliseconds: this.bestLapMilliseconds, savingAvailable: this.savingAvailable };
  }

  private read(): void {
    try {
      const saved = parsePersonalBest(this.storage().getItem(PERSONAL_BEST_KEY));
      if (saved !== null && (this.bestLapMilliseconds === null || saved < this.bestLapMilliseconds)) {
        this.bestLapMilliseconds = saved;
      }
    } catch { this.savingAvailable = false; }
  }

  consume(events: readonly RaceEvent[]): void {
    for (const event of events) {
      if (event.kind !== 'lap' || event.carId !== 'player') continue;
      const milliseconds = event.durationTicks * 1000 / SIMULATION.ticksPerSecond;
      if (!validLapMilliseconds(milliseconds)) continue;
      // Re-read before comparing so a better record saved in another tab wins.
      this.read();
      if (this.bestLapMilliseconds !== null && milliseconds >= this.bestLapMilliseconds) continue;
      this.bestLapMilliseconds = milliseconds;
      try {
        this.storage().setItem(PERSONAL_BEST_KEY, JSON.stringify({ version: 1, bestLapMilliseconds: milliseconds }));
      } catch { this.savingAvailable = false; }
    }
  }
}
