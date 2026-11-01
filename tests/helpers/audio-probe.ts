import type { Page } from '@playwright/test';

interface AudioProbe {
  readonly contexts: AudioContext[];
  readonly oscillators: OscillatorNode[];
  readonly gains: GainNode[];
  readonly impacts: AudioBufferSourceNode[];
  readonly liveNodes: Set<AudioNode>;
}

declare global { interface Window { __audioProbe: AudioProbe } }

/** Test-only observer around real Web Audio; no production hooks or alternate sounds. */
export async function installAudioProbe(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const probe: AudioProbe = { contexts: [], oscillators: [], gains: [], impacts: [], liveNodes: new Set() };
    window.__audioProbe = probe;
    const observe = <T extends AudioNode>(node: T): T => {
      probe.liveNodes.add(node);
      const disconnect = node.disconnect.bind(node);
      node.disconnect = () => { probe.liveNodes.delete(node); disconnect(); };
      return node;
    };
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) { super(options); probe.contexts.push(this); }
      createGain(): GainNode {
        const node = observe(super.createGain()); probe.gains.push(node); return node;
      }
      createOscillator(): OscillatorNode {
        const node = observe(super.createOscillator()); probe.oscillators.push(node); return node;
      }
      createBiquadFilter(): BiquadFilterNode { return observe(super.createBiquadFilter()); }
      createBufferSource(): AudioBufferSourceNode {
        const node = observe(super.createBufferSource()); probe.impacts.push(node); return node;
      }
    };
  });
}

export async function readAudioProbe(page: Page) {
  return page.evaluate(() => {
    const probe = window.__audioProbe;
    return { contexts: probe.contexts.length, state: probe.contexts[0]?.state ?? 'absent',
      engineHertz: probe.oscillators[0]?.frequency.value ?? 0,
      engineGain: probe.gains[1]?.gain.value ?? 0, masterGain: probe.gains[0]?.gain.value ?? 0,
      cueHertz: probe.oscillators.slice(2).map((node) => node.frequency.value),
      liveNodes: probe.liveNodes.size, impacts: probe.impacts.length };
  });
}
