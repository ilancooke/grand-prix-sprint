import { CIRCUIT } from '../content/circuit';
import { createRace, pauseRace, resumeRace, stepRace } from '../game/race';
import { bindKeyboard, HeldKeys } from '../platform/input';
import { FixedStepClock } from '../platform/loop';
import { PersonalRecords } from '../platform/storage';
import { RacingAudio } from '../platform/audio';
import { interpolateVehicle } from '../render/projection';
import { render } from '../render/renderer';
import { createScreens } from '../ui/screens';

export function startApplication(): () => void {
  const screens = createScreens();
  const context = screens.canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required to play Grand Prix Sprint.');
  const records = new PersonalRecords();
  const audio = new RacingAudio();
  const keys = new HeldKeys();
  const clock = new FixedStepClock();
  let menu = true;
  let state = createRace();
  let previous = state.driving;
  let animationHandle = 0;
  const active = (): boolean => !menu && (state.status.kind === 'countdown' || state.status.kind === 'racing');

  const refreshPhase = (reason = 'Your race is on hold.'): void => {
    keys.clear();
    clock.reset();
    previous = state.driving;
    screens.show(menu ? 'menu' : state.status.kind, reason);
    screens.update(state, records.snapshot());
    audio.update(menu ? 'menu' : state.status.kind, state.driving.player.speedMetersPerSecond);
  };
  const confirm = (): void => {
    if (document.hidden) return;
    if (menu || state.status.kind === 'results') { audio.reset(); state = createRace(); menu = false; }
    else if (state.status.kind === 'paused') state = resumeRace(state);
    else return;
    refreshPhase();
    audio.unlock();
    audio.consume(state.events, [], state.elapsedTicks);
  };
  const pause = (): void => {
    if (menu) return;
    if (active()) state = pauseRace(state);
    else if (state.status.kind === 'paused' && !document.hidden) state = resumeRace(state);
    else return;
    refreshPhase();
    if (active()) audio.unlock();
  };
  const interrupt = (): void => {
    if (active()) { state = pauseRace(state); refreshPhase('Focus lost. Press Resume when you are ready.'); }
  };
  const buttons = [screens.startButton, screens.resumeButton, screens.replayButton];
  for (const button of buttons) button.addEventListener('click', confirm);
  const toggleMute = (): void => {
    audio.setMuted(!audio.snapshot().muted);
    screens.updateAudio(audio.snapshot());
  };
  screens.muteButton.addEventListener('click', toggleMute);
  const unbindKeyboard = bindKeyboard(keys, {
    ownsDrivingInput: () => !menu,
    isDriving: active, confirm, pause, interrupt,
  });

  const frame = (nowMilliseconds: number): void => {
    let alpha = 1;
    if (active()) {
      const result = clock.advance(nowMilliseconds, () => {
        // A catch-up frame can finish mid-batch. Consume that final event list
        // once; later callbacks in this batch must not replay the finish cue.
        if (!active()) return;
        previous = state.driving;
        const kind = state.status.kind;
        state = stepRace(state, keys.snapshot(), CIRCUIT);
        records.consume(state.events);
        audio.update(state.status.kind, state.driving.player.speedMetersPerSecond);
        audio.consume(state.events, state.driving.impacts, state.elapsedTicks);
        if (kind !== state.status.kind) {
          // Do not reset the accumulator inside its tick callback. GO needs no
          // rebase; results stop further ticks and clear all held input.
          if (state.status.kind === 'results') keys.clear();
          previous = state.driving;
          screens.show(state.status.kind, '');
        }
      });
      alpha = state.status.kind === 'results' ? 1 : result.alpha;
      if (result.interrupted) {
        state = pauseRace(state);
        refreshPhase('Frame interrupted. Resume to continue from here.');
      }
    }
    render(context, CIRCUIT, interpolateVehicle(previous.player, state.driving.player, alpha), keys.snapshot().steer,
      state.driving.opponents.map((opponent, index) => ({ id: opponent.id, vehicle: interpolateVehicle(
        previous.opponents[index]?.vehicle ?? opponent.vehicle, opponent.vehicle, alpha) })));
    screens.update(state, records.snapshot());
    screens.updateAudio(audio.snapshot());
    animationHandle = requestAnimationFrame(frame);
  };
  refreshPhase();
  animationHandle = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(animationHandle);
    unbindKeyboard();
    audio.dispose();
    screens.muteButton.removeEventListener('click', toggleMute);
    for (const button of buttons) button.removeEventListener('click', confirm);
  };
}
