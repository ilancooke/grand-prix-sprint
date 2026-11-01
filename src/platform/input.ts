import type { DrivingInput } from '../game/types';

const drivingCodes = new Set(['KeyW', 'ArrowUp', 'KeyS', 'ArrowDown', 'KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight']);

export class HeldKeys {
  private readonly held = new Set<string>();

  press(code: string): void { if (drivingCodes.has(code)) this.held.add(code); }
  release(code: string): void { this.held.delete(code); }
  clear(): void { this.held.clear(); }

  snapshot(): DrivingInput {
    const left = this.held.has('KeyA') || this.held.has('ArrowLeft');
    const right = this.held.has('KeyD') || this.held.has('ArrowRight');
    return {
      accelerate: this.held.has('KeyW') || this.held.has('ArrowUp'),
      brake: this.held.has('KeyS') || this.held.has('ArrowDown'),
      steer: Number(right) - Number(left),
    };
  }
}

interface KeyboardActions {
  readonly ownsDrivingInput: () => boolean;
  readonly isDriving: () => boolean;
  readonly confirm: () => void;
  readonly pause: () => void;
  readonly interrupt: () => void;
}

export function bindKeyboard(keys: HeldKeys, actions: KeyboardActions): () => void {
  const keydown = (event: KeyboardEvent): void => {
    if (drivingCodes.has(event.code) && actions.ownsDrivingInput()) {
      event.preventDefault();
      if (actions.isDriving()) keys.press(event.code);
    } else if (event.code === 'Escape' || event.code === 'KeyP') {
      if (actions.ownsDrivingInput()) event.preventDefault();
      if (!event.repeat) actions.pause();
    } else if (event.code === 'Enter' && !event.repeat) {
      // Native controls and links retain their focused Enter action.
      if (!(event.target instanceof Element && event.target.closest('button, a, input, select, textarea'))) {
        event.preventDefault();
        actions.confirm();
      }
    }
  };
  const keyup = (event: KeyboardEvent): void => { keys.release(event.code); };
  const interrupt = (): void => { keys.clear(); actions.interrupt(); };
  const visibility = (): void => { if (document.hidden) interrupt(); };
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);
  window.addEventListener('blur', interrupt);
  document.addEventListener('visibilitychange', visibility);
  return () => {
    window.removeEventListener('keydown', keydown);
    window.removeEventListener('keyup', keyup);
    window.removeEventListener('blur', interrupt);
    document.removeEventListener('visibilitychange', visibility);
    keys.clear();
  };
}
