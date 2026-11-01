import { HANDLING } from '../game/config';
import type { RaceEvent, RaceState } from '../game/race';
import type { DrivingImpact } from '../game/types';

type Phase = 'menu' | RaceState['status']['kind'];
type Signal = 'countdown' | 'go' | 'finish';

// Conservative levels leave room for the engine and a cue to sound together.
export const SOUND = Object.freeze({ masterGain: 0.45, engineGain: 0.075,
  idleHertz: 48, rangeHertz: 192, impactCooldownTicks: 18 });

interface Graph {
  readonly context: AudioContext;
  readonly master: GainNode;
  readonly engine: GainNode;
  readonly filter: BiquadFilterNode;
  readonly oscillators: readonly OscillatorNode[];
  readonly noise: AudioBuffer;
}

interface Voice { readonly source: AudioScheduledSourceNode; readonly nodes: readonly AudioNode[] }

function createGraph(context: AudioContext): Graph {
  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);
  const engine = context.createGain();
  engine.gain.value = 0;
  engine.connect(master);
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.6;
  filter.connect(engine);
  const oscillators = [context.createOscillator(), context.createOscillator()];
  oscillators.forEach((oscillator, index) => {
    oscillator.type = index === 0 ? 'sawtooth' : 'triangle';
    oscillator.frequency.value = SOUND.idleHertz * (index === 0 ? 1 : 2.003);
    oscillator.connect(filter);
    oscillator.start();
  });
  const noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.16), context.sampleRate);
  const samples = noise.getChannelData(0);
  let seed = 7127;
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    samples[i] = seed / 0x80000000 - 1;
  }
  return { context, master, engine, filter, oscillators, noise };
}

/** One graph per application, owned across replays. No audio API reaches the simulation. */
export class RacingAudio {
  private graph: Graph | null = null;
  private readonly voices = new Set<Voice>();
  private phase: Phase = 'menu';
  private speedMetersPerSecond = 0;
  private pendingSignal: Signal | null = null;
  private lastImpactTick = -Infinity;
  private request = 0;
  private disposed = false;
  private isMuted = false;
  private isAvailable = true;

  constructor(private readonly createContext: () => AudioContext = () => new AudioContext()) {}

  snapshot(): { readonly muted: boolean; readonly available: boolean } {
    return { muted: this.isMuted, available: this.isAvailable };
  }

  /** Call synchronously from Start/Enter/Resume/unmute, never from a simulation tick. */
  unlock(): void {
    if (this.disposed || this.isMuted || !this.isAvailable || this.phase === 'menu' || this.phase === 'paused') return;
    try {
      if (!this.graph) {
        const context = this.createContext();
        try { this.graph = createGraph(context); }
        catch (error) { void context.close().catch(() => {}); throw error; }
      }
      const graph = this.graph;
      const request = ++this.request;
      // Invoke resume inside the gesture, before any promise continuation.
      void graph.context.resume().then(() => {
        if (this.disposed || request !== this.request) return;
        this.applyLevels();
        if (this.pendingSignal) {
          const signal = this.pendingSignal;
          this.pendingSignal = null;
          this.signal(signal);
        }
      }).catch(() => { if (request === this.request) this.fail(); });
      this.applyLevels();
    } catch { this.fail(); }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) this.silence();
    else this.unlock();
  }

  update(phase: Phase, speedMetersPerSecond: number): void {
    if (phase !== this.phase) {
      this.pendingSignal = null;
      this.clearVoices();
    }
    this.phase = phase;
    this.speedMetersPerSecond = speedMetersPerSecond;
    if (phase === 'paused' || phase === 'menu') this.silence();
    else this.applyLevels();
  }

  consume(events: readonly RaceEvent[], impacts: readonly DrivingImpact[], elapsedTick: number): void {
    if (this.isMuted || !this.isAvailable || this.disposed) return;
    for (const event of events) {
      if (event.kind === 'countdown' && this.phase === 'countdown') this.signal('countdown');
      if (event.kind === 'go' && this.phase === 'racing') this.signal('go');
      if (event.kind === 'finish' && event.carId === 'player' && this.phase === 'results') this.signal('finish');
    }
    if (this.phase === 'racing' && elapsedTick - this.lastImpactTick >= SOUND.impactCooldownTicks &&
        impacts.some((impact) => impact.carId === 'player') && this.ready()) {
      this.lastImpactTick = elapsedTick;
      this.impact();
    }
  }

  reset(): void {
    this.pendingSignal = null;
    this.lastImpactTick = -Infinity;
    this.clearVoices();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseGraph();
  }

  private ready(): Graph | null {
    return !this.isMuted && !this.disposed && this.isAvailable && this.graph?.context.state === 'running'
      ? this.graph : null;
  }

  private applyLevels(): void {
    const graph = this.graph;
    if (!graph || this.disposed || !this.isAvailable) return;
    const { context, master, engine, filter, oscillators } = graph;
    const audible = !this.isMuted && this.phase !== 'paused' && this.phase !== 'menu';
    master.gain.setValueAtTime(audible ? SOUND.masterGain : 0, context.currentTime);
    const ratio = Math.max(0, Math.min(1, this.speedMetersPerSecond / HANDLING.maxSpeedMetersPerSecond));
    oscillators.forEach((oscillator, index) => oscillator.frequency.setTargetAtTime(
      (SOUND.idleHertz + SOUND.rangeHertz * ratio) * (index === 0 ? 1 : 2.003), context.currentTime, 0.045));
    filter.frequency.setTargetAtTime(380 + 1900 * ratio, context.currentTime, 0.06);
    engine.gain.setTargetAtTime(audible && this.phase === 'racing' ? SOUND.engineGain : 0, context.currentTime, 0.025);
  }

  private silence(): void {
    this.pendingSignal = null;
    this.clearVoices();
    const graph = this.graph;
    if (!graph) return;
    graph.master.gain.cancelScheduledValues(graph.context.currentTime);
    graph.master.gain.setValueAtTime(0, graph.context.currentTime);
    graph.engine.gain.cancelScheduledValues(graph.context.currentTime);
    graph.engine.gain.setValueAtTime(0, graph.context.currentTime);
    // Invalidate a delayed unlock so it cannot revive audio after focus loss.
    const request = ++this.request;
    void graph.context.suspend().catch(() => { if (request === this.request) this.fail(); });
  }

  private signal(signal: Signal): void {
    const graph = this.ready();
    if (!graph) {
      // Keep at most the latest signal during a pending gesture unlock. Never
      // accumulate a backlog of countdowns or impacts in a suspended context.
      if (this.graph) this.pendingSignal = signal;
      return;
    }
    if (signal === 'finish') {
      [523.25, 659.25, 783.99, 1046.5].forEach((hertz, index) =>
        this.tone(graph, hertz, index * 0.14, index === 3 ? 0.4 : 0.18));
    } else this.tone(graph, signal === 'go' ? 1046.5 : 659.25, 0, signal === 'go' ? 0.3 : 0.12);
  }

  private tone(graph: Graph, hertz: number, delaySeconds: number, durationSeconds: number): void {
    const source = graph.context.createOscillator();
    source.type = 'triangle';
    source.frequency.value = hertz;
    this.voice(graph, source, source, [], delaySeconds, durationSeconds, 0.18);
  }

  private impact(): void {
    const graph = this.ready();
    if (!graph) return;
    const source = graph.context.createBufferSource();
    source.buffer = graph.noise;
    const filter = graph.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 850;
    source.connect(filter);
    this.voice(graph, source, filter, [filter], 0, 0.15, 0.25);
  }

  private voice(graph: Graph, source: AudioScheduledSourceNode, output: AudioNode,
    extraNodes: readonly AudioNode[], delaySeconds: number, durationSeconds: number, peak: number): void {
    const gain = graph.context.createGain();
    const start = graph.context.currentTime + delaySeconds;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSeconds);
    output.connect(gain);
    gain.connect(graph.master);
    const voice = { source, nodes: [source, ...extraNodes, gain] };
    this.voices.add(voice);
    source.onended = () => this.disconnectVoice(voice);
    source.start(start);
    source.stop(start + durationSeconds + 0.01);
  }

  private disconnectVoice(voice: Voice): void {
    if (!this.voices.delete(voice)) return;
    voice.source.onended = null;
    for (const node of voice.nodes) node.disconnect();
  }

  private clearVoices(): void {
    for (const voice of this.voices) {
      voice.source.stop();
      this.disconnectVoice(voice);
    }
  }

  private releaseGraph(): void {
    ++this.request;
    this.clearVoices();
    const graph = this.graph;
    if (!graph) return;
    this.graph = null;
    for (const oscillator of graph.oscillators) { oscillator.stop(); oscillator.disconnect(); }
    graph.filter.disconnect();
    graph.engine.disconnect();
    graph.master.disconnect();
    void graph.context.close().catch(() => {});
  }

  private fail(): void {
    this.isAvailable = false;
    this.pendingSignal = null;
    this.releaseGraph();
  }
}
