import { SIMULATION } from '../game/config';

export function formatTicks(ticks: number | null): string {
  if (ticks === null) return '—';
  const milliseconds = Math.floor(ticks * 1000 / SIMULATION.ticksPerSecond);
  return `${Math.floor(milliseconds / 60000)}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, '0')}.${String(milliseconds % 1000).padStart(3, '0')}`;
}
