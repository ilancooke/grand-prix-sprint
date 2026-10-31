import { CIRCUIT } from '../content/circuit';
import { createDrivingState, simulate } from '../game/simulate';
import { bindKeyboard, HeldKeys } from '../platform/input';
import { FixedStepClock } from '../platform/loop';
import { interpolateVehicle } from '../render/projection';
import { render } from '../render/renderer';
import { createScreens } from '../ui/screens';

export function startApplication(): () => void {
  const screens = createScreens();
  const context = screens.canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is required to play Grand Prix Sprint.');
  const keys = new HeldKeys();
  const clock = new FixedStepClock();
  let phase: 'menu' | 'driving' | 'paused' = 'menu';
  let state = createDrivingState();
  let previous = state;
  let animationHandle = 0;

  const transition = (next: typeof phase, reason = 'Your drive is on hold.'): void => {
    // Hidden tabs cannot be resumed programmatically into an advancing simulation.
    if (next === 'driving' && document.hidden) return;
    keys.clear();
    clock.reset();
    previous = state;
    phase = next;
    screens.show(phase, reason);
  };
  const confirm = (): void => { if (phase !== 'driving') transition('driving'); };
  const pause = (): void => {
    if (phase === 'driving') transition('paused');
    else if (phase === 'paused') transition('driving');
  };
  const interrupt = (): void => {
    if (phase === 'driving') transition('paused', 'Focus lost. Press Resume when you are ready.');
  };
  screens.startButton.addEventListener('click', confirm);
  screens.resumeButton.addEventListener('click', confirm);
  const unbindKeyboard = bindKeyboard(keys, {
    ownsDrivingInput: () => phase !== 'menu',
    isDriving: () => phase === 'driving', confirm, pause, interrupt,
  });

  const frame = (nowMilliseconds: number): void => {
    let alpha = 1;
    if (phase === 'driving') {
      const result = clock.advance(nowMilliseconds, () => {
        previous = state;
        state = simulate(state, keys.snapshot());
      });
      alpha = result.alpha;
      if (result.interrupted) transition('paused', 'Frame interrupted. Resume to continue from here.');
    }
    render(context, CIRCUIT, interpolateVehicle(previous.player, state.player, alpha), keys.snapshot().steer);
    screens.update(state);
    animationHandle = requestAnimationFrame(frame);
  };
  screens.show('menu', '');
  animationHandle = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(animationHandle);
    unbindKeyboard();
    screens.startButton.removeEventListener('click', confirm);
    screens.resumeButton.removeEventListener('click', confirm);
  };
}
