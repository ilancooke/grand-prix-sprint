import type { DrivingState } from '../game/types';

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing application element: ${selector}`);
  return found;
}

export function createScreens() {
  const canvas = element<HTMLCanvasElement>('#race-view');
  const menu = element('#menu');
  const pause = element('#pause');
  const hud = element('#hud');
  const hint = element('#drive-hint');
  const speed = element<HTMLOutputElement>('#speed');
  const distance = element<HTMLOutputElement>('#distance');
  const reason = element('#pause-reason');
  const startButton = element<HTMLButtonElement>('#start');
  const resumeButton = element<HTMLButtonElement>('#resume');
  const setText = (target: HTMLElement, value: string): void => {
    if (target.textContent !== value) target.textContent = value;
  };
  return {
    canvas,
    startButton,
    resumeButton,
    show(phase: 'menu' | 'driving' | 'paused', pauseReason: string): void {
      menu.hidden = phase !== 'menu';
      hud.hidden = phase === 'menu';
      hint.hidden = phase !== 'driving';
      pause.hidden = phase !== 'paused';
      reason.textContent = pauseReason;
      if (phase === 'paused') resumeButton.focus({ preventScroll: true });
      if (phase === 'driving') canvas.focus({ preventScroll: true });
    },
    update(state: DrivingState): void {
      setText(speed, String(Math.round(state.player.speedMetersPerSecond * 3.6)));
      setText(distance, String(Math.floor(state.player.stationMeters)));
    },
  };
}
