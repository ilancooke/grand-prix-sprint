import { raceHud, type RaceState } from '../game/race';
import { formatTicks } from './hud';

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing application element: ${selector}`);
  return found;
}

export function createScreens() {
  const canvas = element<HTMLCanvasElement>('#race-view');
  const menu = element('#menu'), pause = element('#pause'), hud = element('#hud');
  const hint = element('#drive-hint'), countdown = element('#countdown'), results = element('#results');
  const reason = element('#pause-reason');
  const startButton = element<HTMLButtonElement>('#start');
  const resumeButton = element<HTMLButtonElement>('#resume');
  const replayButton = element<HTMLButtonElement>('#replay');
  const fields = Object.fromEntries(['speed', 'distance', 'lap', 'position', 'lap-time', 'best-lap',
    'countdown-number', 'final-position', 'total-time', 'result-best'].map((id) => [id, element(`#${id}`)]));
  const setText = (id: string, value: string): void => {
    const target = fields[id];
    if (target && target.textContent !== value) target.textContent = value;
  };
  return {
    canvas, startButton, resumeButton, replayButton,
    show(phase: 'menu' | RaceState['status']['kind'], pauseReason: string): void {
      menu.hidden = phase !== 'menu';
      hud.hidden = phase === 'menu' || phase === 'results';
      hint.hidden = phase !== 'racing';
      pause.hidden = phase !== 'paused';
      countdown.hidden = phase !== 'countdown';
      results.hidden = phase !== 'results';
      reason.textContent = pauseReason;
      if (phase === 'paused') resumeButton.focus({ preventScroll: true });
      if (phase === 'results') replayButton.focus({ preventScroll: true });
      if (phase === 'racing' || phase === 'countdown') canvas.focus({ preventScroll: true });
    },
    update(state: RaceState): void {
      const values = raceHud(state);
      setText('speed', String(Math.round(state.driving.player.speedMetersPerSecond * 3.6)));
      setText('distance', String(Math.floor(state.driving.player.stationMeters)));
      setText('lap', `${values.lap}/3`);
      setText('position', `${values.position}/4`);
      setText('lap-time', formatTicks(values.currentLapTicks));
      setText('best-lap', formatTicks(values.bestLapTicks));
      setText('countdown-number', String(values.countdown));
      if (state.results) {
        setText('final-position', `${state.results.position}/4`);
        setText('total-time', formatTicks(state.results.totalTicks));
        setText('result-best', formatTicks(state.results.bestLapTicks));
      }
    },
  };
}
