import { raceHud, type RaceState } from '../game/race';
import type { PersonalRecord } from '../platform/storage';
import { formatMilliseconds, formatPosition, formatTicks } from './hud';

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
  const menuRecord = element('#menu-record'), resultRecord = element('#result-record');
  const savingStatus = element('#saving-status'), personalRecord = element('#personal-record');
  const startButton = element<HTMLButtonElement>('#start');
  const resumeButton = element<HTMLButtonElement>('#resume');
  const replayButton = element<HTMLButtonElement>('#replay');
  const muteButton = element<HTMLButtonElement>('#mute');
  const fields = Object.fromEntries(['speed', 'distance', 'lap', 'position', 'lap-time', 'best-lap',
    'countdown-number', 'final-position', 'total-time', 'result-best', 'menu-best', 'personal-best', 'result-personal'].map((id) => [id, element(`#${id}`)]));
  const setText = (id: string, value: string): void => {
    const target = fields[id];
    if (target && target.textContent !== value) target.textContent = value;
  };
  return {
    canvas, startButton, resumeButton, replayButton, muteButton,
    updateAudio(audio: { readonly muted: boolean; readonly available: boolean }): void {
      const label = audio.available ? audio.muted ? 'Unmute sound' : 'Mute sound' : 'Sound unavailable';
      if (muteButton.textContent !== label) muteButton.textContent = label;
      muteButton.setAttribute('aria-pressed', String(audio.muted));
      muteButton.disabled = !audio.available;
    },
    show(phase: 'menu' | RaceState['status']['kind'], pauseReason: string): void {
      menu.hidden = phase !== 'menu';
      hud.hidden = phase === 'menu' || phase === 'results';
      hint.hidden = phase !== 'racing';
      pause.hidden = phase !== 'paused';
      countdown.hidden = phase !== 'countdown';
      results.hidden = phase !== 'results';
      reason.textContent = pauseReason;
      if (phase === 'menu') startButton.focus({ preventScroll: true });
      if (phase === 'paused') resumeButton.focus({ preventScroll: true });
      if (phase === 'results') replayButton.focus({ preventScroll: true });
      if (phase === 'racing' || phase === 'countdown') canvas.focus({ preventScroll: true });
    },
    update(state: RaceState, record: PersonalRecord): void {
      const personalBest = formatMilliseconds(record.bestLapMilliseconds);
      menuRecord.hidden = resultRecord.hidden = personalRecord.hidden = record.bestLapMilliseconds === null;
      setText('menu-best', personalBest);
      setText('personal-best', personalBest);
      setText('result-personal', personalBest);
      const savingMessage = record.savingAvailable ? 'Records saved on this browser' : 'Saving unavailable · personal best kept for this session';
      if (savingStatus.textContent !== savingMessage) savingStatus.textContent = savingMessage;
      savingStatus.classList.toggle('unavailable', !record.savingAvailable);
      const values = raceHud(state);
      setText('speed', String(Math.round(state.driving.player.speedMetersPerSecond * 3.6)));
      setText('distance', String(Math.floor(state.driving.player.stationMeters)));
      setText('lap', `${values.lap}/3`);
      setText('position', formatPosition(values.position));
      setText('lap-time', formatTicks(values.currentLapTicks));
      setText('best-lap', formatTicks(values.bestLapTicks));
      setText('countdown-number', String(values.countdown));
      if (state.results) {
        setText('final-position', formatPosition(state.results.position));
        setText('total-time', formatTicks(state.results.totalTicks));
        setText('result-best', formatTicks(state.results.bestLapTicks));
      }
    },
  };
}
