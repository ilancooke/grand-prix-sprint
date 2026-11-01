import { SIMULATION } from '../game/config';

export function formatMilliseconds(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value < 0) return '—';
  const milliseconds = Math.floor(value);
  return `${Math.floor(milliseconds / 60000)}:${String(Math.floor(milliseconds / 1000) % 60).padStart(2, '0')}.${String(milliseconds % 1000).padStart(3, '0')}`;
}

export function formatTicks(ticks: number | null): string {
  return formatMilliseconds(ticks === null ? null : ticks * 1000 / SIMULATION.ticksPerSecond);
}

export function formatPosition(position: number): string {
  const suffix = position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th';
  return `${position}${suffix} / 4`;
}
