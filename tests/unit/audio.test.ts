import { describe, expect, it, vi } from 'vitest';
import { RacingAudio, SOUND } from '../../src/platform/audio';
import { HANDLING } from '../../src/game/config';

class Parameter {
  value = 0;
  cancelScheduledValues = vi.fn();
  setValueAtTime = vi.fn((value: number) => { this.value = value; });
  setTargetAtTime = vi.fn((value: number) => { this.value = value; });
  linearRampToValueAtTime = vi.fn();
  exponentialRampToValueAtTime = vi.fn();
}

class Node {
  gain = new Parameter();
  frequency = new Parameter();
  Q = new Parameter();
  type = '';
  buffer: unknown;
  onended: (() => void) | null = null;
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

function fixture() {
  const oscillators: Node[] = [], gains: Node[] = [], filters: Node[] = [], sources: Node[] = [];
  const context = {
    currentTime: 0, sampleRate: 48000, state: 'suspended', destination: new Node(),
    createGain: () => { const node = new Node(); gains.push(node); return node; },
    createBiquadFilter: () => { const node = new Node(); filters.push(node); return node; },
    createOscillator: () => { const node = new Node(); oscillators.push(node); return node; },
    createBufferSource: () => { const node = new Node(); sources.push(node); return node; },
    createBuffer: (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
    resume: vi.fn(async () => { context.state = 'running'; }),
    suspend: vi.fn(async () => { context.state = 'suspended'; }),
    close: vi.fn(async () => { context.state = 'closed'; }),
  };
  const factory = vi.fn(() => context as unknown as AudioContext);
  return { audio: new RacingAudio(factory), context, factory, oscillators, gains, filters, sources };
}

const flush = async (): Promise<void> => { await Promise.resolve(); await Promise.resolve(); };

describe('racing sound lifecycle', () => {
  it('creates nothing before a gesture; speed changes engine pitch, filter and level', async () => {
    const f = fixture();
    f.audio.update('countdown', 0);
    f.audio.consume([{ kind: 'countdown', number: 3 }], [], 0);
    expect(f.factory).not.toHaveBeenCalled();
    f.audio.unlock();
    await flush();
    expect(f.context.resume).toHaveBeenCalledOnce();
    expect(f.oscillators).toHaveLength(2);
    expect(f.gains[1]!.gain.value).toBe(0);
    f.audio.update('racing', 0);
    expect(f.oscillators[0]!.frequency.value).toBe(SOUND.idleHertz);
    expect(f.gains[1]!.gain.value).toBe(SOUND.engineGain);
    f.audio.update('racing', HANDLING.maxSpeedMetersPerSecond);
    expect(f.oscillators[0]!.frequency.value).toBe(SOUND.idleHertz + SOUND.rangeHertz);
    expect(f.filters[0]!.frequency.value).toBe(2280);
    f.audio.update('results', HANDLING.maxSpeedMetersPerSecond);
    expect(f.gains[1]!.gain.value).toBe(0);
  });

  it('maps countdown/GO/player finish to distinct short cues and ignores AI finishes/laps', async () => {
    const f = fixture();
    f.audio.update('countdown', 0);
    f.audio.unlock();
    await flush();
    for (const number of [3, 2, 1]) f.audio.consume([{ kind: 'countdown', number }], [], 0);
    expect(f.oscillators.slice(2).map((node) => node.frequency.value)).toEqual([659.25, 659.25, 659.25]);
    f.audio.update('racing', 10);
    f.audio.consume([{ kind: 'go' }], [], 0);
    expect(f.oscillators.at(-1)!.frequency.value).toBe(1046.5);
    f.audio.consume([{ kind: 'finish', carId: 'azure', crossingTick: 100 }], [], 100);
    expect(f.oscillators).toHaveLength(6);
    f.audio.update('results', 60);
    f.audio.consume([{ kind: 'finish', carId: 'player', crossingTick: 120 }], [], 120);
    expect(f.oscillators.slice(-4).map((node) => node.frequency.value)).toEqual([523.25, 659.25, 783.99, 1046.5]);
    expect(f.oscillators.slice(-4).map((node) => node.start.mock.calls[0])).toEqual([[0], [0.14], [0.28], [0.42000000000000004]]);
  });

  it('coalesces player impacts and uses a recoverable tick cooldown; AI-only contacts stay quiet', async () => {
    const f = fixture();
    f.audio.update('racing', 50);
    f.audio.unlock();
    await flush();
    const playerImpact = { carId: 'player' as const, kind: 'barrier' as const };
    f.audio.consume([], [{ carId: 'azure', kind: 'barrier' }], 1);
    expect(f.sources).toHaveLength(0);
    f.audio.consume([], [playerImpact, playerImpact], 2);
    f.audio.consume([], [playerImpact], 3);
    expect(f.sources).toHaveLength(1);
    f.audio.consume([], [playerImpact], 2 + SOUND.impactCooldownTicks);
    expect(f.sources).toHaveLength(2);
    f.audio.reset();
    f.audio.consume([], [playerImpact], 1);
    expect(f.sources).toHaveLength(3);
  });

  it('mute/pause stop and disconnect pending effects; unmute/resume reuse the graph', async () => {
    const f = fixture();
    f.audio.update('racing', 60);
    f.audio.unlock();
    await flush();
    f.audio.consume([{ kind: 'go' }], [], 0);
    const cue = f.oscillators[2]!;
    f.audio.setMuted(true);
    expect(f.gains[0]!.gain.value).toBe(0);
    expect(f.gains[1]!.gain.value).toBe(0);
    expect(cue.stop).toHaveBeenLastCalledWith();
    expect(cue.disconnect).toHaveBeenCalledOnce();
    expect(f.context.state).toBe('suspended');
    f.audio.consume([{ kind: 'go' }], [], 0);
    expect(f.oscillators).toHaveLength(3);
    f.audio.setMuted(false);
    await flush();
    expect(f.factory).toHaveBeenCalledOnce();
    expect(f.gains[1]!.gain.value).toBe(SOUND.engineGain);
    f.audio.update('paused', 60);
    expect(f.context.state).toBe('suspended');
    expect(f.gains[0]!.gain.value).toBe(0);
    f.audio.update('racing', 60);
    f.audio.unlock();
    await flush();
    expect(f.context.state).toBe('running');
  });

  it('cleans natural endings and repeated replay without adding engine nodes; dispose is idempotent', async () => {
    const f = fixture();
    f.audio.update('countdown', 0);
    f.audio.unlock();
    await flush();
    for (let replay = 0; replay < 8; replay++) {
      f.audio.consume([{ kind: 'countdown', number: 3 }], [], 0);
      const cue = f.oscillators.at(-1)!;
      cue.onended?.();
      expect(cue.disconnect).toHaveBeenCalledOnce();
      f.audio.update('results', 50);
      f.audio.consume([{ kind: 'finish', carId: 'player', crossingTick: 1 }], [], 1);
      const finish = f.oscillators.slice(-4);
      f.audio.reset();
      for (const voice of finish) expect(voice.disconnect).toHaveBeenCalledOnce();
      f.audio.update('countdown', 0);
      f.audio.unlock();
      await flush();
    }
    expect(f.factory).toHaveBeenCalledOnce();
    for (const engine of f.oscillators.slice(0, 2)) expect(engine.start).toHaveBeenCalledOnce();
    f.audio.dispose();
    f.audio.dispose();
    expect(f.context.close).toHaveBeenCalledOnce();
    for (const engine of f.oscillators.slice(0, 2)) expect(engine.stop).toHaveBeenCalledOnce();
    f.audio.unlock();
    expect(f.factory).toHaveBeenCalledOnce();
  });

  it('late resume cannot revive a paused/muted/disposed graph or schedule stale cues', async () => {
    const f = fixture();
    let resolve!: () => void;
    f.context.resume.mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
    f.audio.update('countdown', 0);
    f.audio.unlock();
    f.audio.consume([{ kind: 'countdown', number: 3 }], [], 0);
    f.audio.update('paused', 0);
    resolve();
    await flush();
    expect(f.gains[0]!.gain.value).toBe(0);
    expect(f.oscillators).toHaveLength(2);
    f.audio.setMuted(true);
    f.audio.dispose();
    expect(f.context.close).toHaveBeenCalledOnce();
  });

  it('keeps just the latest signal during delayed startup', async () => {
    const f = fixture();
    let resolve!: () => void;
    f.context.resume.mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
    f.audio.update('countdown', 0);
    f.audio.unlock();
    f.audio.consume([{ kind: 'countdown', number: 3 }], [], 0);
    f.audio.consume([{ kind: 'countdown', number: 2 }], [], 0);
    f.audio.update('racing', 0);
    f.audio.consume([{ kind: 'go' }], [], 0);
    f.context.state = 'running';
    resolve();
    await flush();
    expect(f.oscillators).toHaveLength(3);
    expect(f.oscillators[2]!.frequency.value).toBe(1046.5);
  });

  it('contains unavailable context and rejected resume without rejecting gameplay', async () => {
    const unavailable = new RacingAudio(() => { throw new Error('Web Audio unavailable'); });
    unavailable.update('countdown', 0);
    expect(() => unavailable.unlock()).not.toThrow();
    expect(unavailable.snapshot().available).toBe(false);
    const f = fixture();
    f.context.resume.mockRejectedValue(new Error('denied'));
    f.audio.update('countdown', 0);
    f.audio.unlock();
    await flush();
    expect(f.audio.snapshot().available).toBe(false);
    expect(f.context.close).toHaveBeenCalledOnce();
    expect(() => { f.audio.update('racing', 20); f.audio.consume([{ kind: 'go' }], [], 0); }).not.toThrow();
  });
});
