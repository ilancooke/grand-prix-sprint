import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { cpus, platform, arch, totalmem } from 'node:os';
import { LOCAL_ORIGIN } from '../../config/server.ts';

interface FrameProfile {
  intervals: number[];
  callbacks: number[];
  longTasks: number[];
  interruptions: number;
  complete: boolean;
}
declare global { interface Window { __frameProfile: FrameProfile } }

// Opt-in real-time measurement. No fake clock, simulation fixture or production
// instrumentation; default mode lets a person drive the visible browser.
const headless = process.argv.includes('--headless');
const automatic = process.argv.includes('--auto');
const browser = await chromium.launch({ headless });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors: string[] = [];
const externalRequests: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('request', (request) => {
  if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== LOCAL_ORIGIN) externalRequests.push(request.url());
});
await page.addInitScript(() => {
  const profile: FrameProfile = { intervals: [], callbacks: [], longTasks: [], interruptions: 0, complete: false };
  window.__frameProfile = profile;
  const raf = window.requestAnimationFrame.bind(window);
  let previous: number | undefined;
  let active = false;
  let wasPaused = false;
  if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
    new PerformanceObserver((list) => {
      if (active) for (const entry of list.getEntries()) profile.longTasks.push(entry.duration);
    }).observe({ type: 'longtask' });
  }
  window.requestAnimationFrame = (callback) => raf((now) => {
    const start = performance.now();
    callback(now);
    const duration = performance.now() - start;
    const visible = (id: string): boolean => document.getElementById(id)?.hidden === false;
    const paused = visible('pause');
    if (paused && !wasPaused) profile.interruptions++;
    wasPaused = paused;
    active = visible('hud') && !visible('countdown') && !paused && !visible('menu');
    if (active) {
      if (previous !== undefined) profile.intervals.push(now - previous);
      profile.callbacks.push(duration);
      previous = now;
    } else previous = undefined;
    if (visible('results')) profile.complete = true;
  });
});

const distribution = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (fraction: number): number | null => sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? null;
  return { samples: values.length, mean: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99), max: sorted.at(-1) ?? null };
};

try {
  await page.goto(LOCAL_ORIGIN);
  console.log(`Profiling ${LOCAL_ORIGIN} at 1280×800. ${automatic ? 'Automatic full-throttle workload.' : 'Drive one complete race in the browser.'}`);
  if (automatic) { await page.keyboard.press('Enter'); await page.keyboard.down('w'); }
  await page.waitForFunction((auto) => window.__frameProfile.complete ||
    (auto && window.__frameProfile.interruptions > 0), automatic, { timeout: 600000, polling: 500 });
} catch (error) {
  errors.push(String(error));
  process.exitCode = 1;
} finally {
  const profile = await page.evaluate(() => window.__frameProfile);
  const intervals = distribution(profile.intervals);
  const report = {
    date: new Date().toISOString(), origin: LOCAL_ORIGIN, browser: browser.version(),
    environment: { platform: platform(), arch: arch(), cpu: cpus()[0]?.model, logicalCpus: cpus().length,
      memoryGiB: totalmem() / 1024 ** 3, viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, headless, automatic },
    complete: profile.complete, interruptions: profile.interruptions,
    frameIntervalsMilliseconds: intervals, meanFramesPerSecond: intervals.mean ? 1000 / intervals.mean : null,
    applicationCallbackMilliseconds: distribution(profile.callbacks),
    longTasksMilliseconds: distribution(profile.longTasks),
    gapsOver25Milliseconds: profile.intervals.filter((value) => value > 25).length,
    gapsOver50Milliseconds: profile.intervals.filter((value) => value > 50).length,
    gapsOver250Milliseconds: profile.intervals.filter((value) => value > 250).length,
    results: await page.locator('#results').innerText(), errors, externalRequests,
    raw: profile,
  };
  await mkdir('test-results', { recursive: true });
  await writeFile('test-results/performance.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, raw: undefined }, null, 2));
  await browser.close();
  if (!profile.complete || errors.length || externalRequests.length) process.exitCode = 1;
}
