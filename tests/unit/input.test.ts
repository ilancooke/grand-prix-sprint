import { describe, expect, it } from 'vitest';
import { HeldKeys } from '../../src/platform/input';

describe('held keyboard input', () => {
  it.each([
    ['KeyW', 'ArrowUp', 'accelerate'],
    ['KeyS', 'ArrowDown', 'brake'],
  ] as const)('treats %s and %s as independent aliases', (letter, arrow, action) => {
    const keys = new HeldKeys();
    keys.press(letter);
    expect(keys.snapshot()[action]).toBe(true);
    keys.press(arrow);
    keys.release(letter);
    expect(keys.snapshot()[action]).toBe(true);
    keys.release(arrow);
    expect(keys.snapshot()[action]).toBe(false);
  });

  it.each([['KeyA', -1], ['ArrowLeft', -1], ['KeyD', 1], ['ArrowRight', 1]] as const)(
    'handles %s steering while holding throttle', (code, steer) => {
      const keys = new HeldKeys();
      keys.press('KeyW');
      keys.press(code);
      expect(keys.snapshot()).toEqual({ accelerate: true, brake: false, steer });
    });

  it('cancels opposite steering, ignores unrelated keys, and clears every held key', () => {
    const keys = new HeldKeys();
    for (const code of ['KeyW', 'KeyA', 'ArrowRight', 'KeyQ']) keys.press(code);
    expect(keys.snapshot().steer).toBe(0);
    keys.clear();
    expect(keys.snapshot()).toEqual({ accelerate: false, brake: false, steer: 0 });
  });
});
