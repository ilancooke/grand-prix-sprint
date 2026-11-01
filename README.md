# Grand Prix Sprint

An original desktop-browser arcade racer, built incrementally against the frozen [specification](SPEC.md).

The game runs a complete three-lap race on the 2000 m Harbor Loop against cyan Azure, yellow Gold, and purple Violet. A stationary grid and three-second countdown lead into validated laps, live standings, lap clocks, frozen results, and replay, with personal records retained across reloads and original synthesized racing sound. **M7 release verification is in progress**; the final manual race and representative desktop performance review remain pending. See [PROGRESS.md](PROGRESS.md) and [VERIFICATION.md](VERIFICATION.md) for evidence.

## Setup and launch

Use Node.js **24 LTS** and npm **11**; tested with Node **24.18.0**, npm **11.16.0**, on macOS ARM64 and Node **24.22.2**, npm **11.19.1**, on Linux x64. `.nvmrc` records the original tested Node version. Development dependencies are pinned in `package.json` and `package-lock.json`.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173** in a modern desktop browser. Click **Start Race** or press **Enter**. Use a viewport of at least **960×720**; 1280×800 or larger is preferred. Initial package/browser installation needs network access; gameplay uses local files and has no backend, credentials, hosted assets, or API dependency.

`config/server.ts` is the single host/port configuration for development, preview, and browser tests. Keep the same origin for personal-record persistence. Opening source files directly with `file://` is not supported.

## Controls

| Input | Action |
| --- | --- |
| W / Up | Accelerate |
| S / Down | Brake (takes priority over acceleration) |
| A / Left | Steer left |
| D / Right | Steer right |
| Escape / P | Pause or resume |
| Enter | Start, replay, or activate the focused menu/resume control |
| Mute sound / Unmute sound | Pointer or Tab then Enter; available below the view in every phase |

Hold acceleration and steering together. Releasing acceleration slows the car. Focus loss, hidden tabs, or frame gaps above 250 ms pause immediately and clear held keys. Returning to the game requires explicit resume; time spent away is never simulated.

Audio unlocks when you start or resume through a user interaction. Engine pitch and brightness rise with speed; short signals accompany 3/2/1, GO, player impacts and the finish. Mute is retained across replays for the current page session. Pause/focus loss silences the graph and clears effects; replay reuses one engine. If Web Audio is unavailable or startup is denied, **Sound unavailable** appears and driving continues.

## Build and checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

`build` produces a static `dist/` directory. Preview uses the same local origin as development; stop the development server before previewing. `npm run test:watch` runs interactive logic tests.

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts the local development server automatically, or reuses an existing server outside CI. The eighteen-test suite covers Start/Enter, every driving alias, visible steering while accelerating, coasting/braking, both-verge slowdown and recovery, pause, focus cleanup, resize, exceptional stalls, three distinct moving opponents and their paused field, local-only requests without console errors, countdown immobility and interruption timing, and a bounded complete keyboard race with exact result times, fresh replay, saved records before race finish, slower-lap preservation, reload retention, corrupt storage, denied access/writes, and UI layout at three desktop sizes. Release stress repeats twelve pause/blur/hidden/stall/resize cycles and three complete races with stable gameplay listener and audio graph counts. The hidden-document case explicitly simulates browser visibility; native tab switching remains part of manual review. Audio checks observe real Web Audio gesture startup, speed response, impact/finish signals, mute, cleanup and startup failures. Drivers and observers live only under `tests/`; no test fixture or debugging API ships in the game. To check the static bundle, start `npm run preview` after building and run `npm run test:e2e` in another terminal; Playwright reuses that server outside CI. Browser binaries are development-only downloads.

```sh
npx playwright install firefox webkit
npm run test:e2e:compat
```

The twelve designated driving/UI/record-schema/audio/interruption compatibility checks cover Chromium, Firefox, and WebKit. On Linux, browser system libraries may also require `npx playwright install-deps chromium firefox webkit`. A local server must be permitted to listen on port 5173; restricted environments may require permitted execution for setup, server startup, and browser tests. See [VERIFICATION.md](VERIFICATION.md) for results and earlier resolved environment limits.

On a VM or software-rendered container, use `npm run test:e2e -- --workers=2` and `npm run test:e2e:compat -- --workers=1` to reduce contention; run suites sequentially when they share a managed server. Headless Linux containers need an audio output for real Firefox audio lifecycle checks (M7 used a PulseAudio null sink). This does not replace listening review. The normal desktop game uses the browser's audio device.

## Release performance and manual review

After `npm run build`, run `npm run preview`. In a second terminal, run:

```sh
npm run profile
```

This opens a fresh Chromium window at 1280×800. Drive one uninterrupted three-lap race; keep the tab focused. The command writes `test-results/performance.json` with browser/CPU/viewport details, active-racing frame interval and application callback distributions (mean, p50, p95, p99, maximum), long tasks, interruptions, results and network/console errors. Countdown/menu/pause frames are excluded; no fake clock is used. The engineering target is approximately 60 fps on a typical desktop; record the desktop model, display refresh rate and subjective responsiveness alongside the report. Frame callbacks are a pacing measure, not a measurement of physical display presentation or input latency. Review stalls before changing tuning or optimizing.

`npm run profile -- --headless --auto` runs a real-time full-throttle workload for unattended diagnostics (up to ten minutes). Virtual/headless results are supplemental; they do not establish representative desktop performance or a manual driving pass. The profiler is development-only and uses the already installed Playwright Chromium.

For final manual acceptance, follow setup from a clean install, start from the menu, drive against all three opponents, brake at Anchor, deliberately contact/recover, then finish three legal laps and inspect results. Replay without reloading; reload at the same origin to check the saved best. Separately exercise pause, tab switching and resize. Record one uninterrupted race plus the deliberate recovery/interruption runs, browser/version, desktop and viewport in `VERIFICATION.md`. Retain the earlier confirmed listening review; record Safari manual results when Safari is available.

For manual M2 verification, drive the full 2000 m loop through Lighthouse right, Anchor hairpin, Breakwater right, Pines left, and Home right. Brake at the Anchor approach markers: about **170–180 km/h** at its apex permits a clean turn with steering, while excessive speed overwhelms steering and carries the car wide. Grass reduces grip and speed; steer back with throttle to recover. The yellow/black tire stacks at **180 m left**, **660 m right**, and **1440 m left** are collidable. Trees, signs, and stands are decoration beyond the driving verge. Try both shoulders, barriers and tire stacks at low/high speed, then continue without reloading. Inspect the start line/scenery across the seam, resize, pause/resume, and switch tabs while driving.

For manual M3 review, approach the field on the opening straight and use the available road width to pass beside Azure or Gold. Brake and let an opponent pass you, try a gentle side contact, then recover with steering/throttle. Watch the opponents brake before Anchor and accelerate afterward. Pause freezes the whole field. The HUD shows authoritative lap, position, current lap time and race best.

For manual M4 review, start from the menu, observe 3/2/1 with a stationary field and zero clock, and drive three full circuits. Check 1/3 → 2/3 → 3/3, current/best lap changes, position as rivals pass, and immediate frozen results at the third finish. Pause during countdown and racing, switch tabs, then explicitly resume. Replay should show a fresh stopped grid, zero clock and no race best.

## Implementation scope

Strict TypeScript, Canvas 2D procedural graphics, semantic HTML/CSS, and a 60 Hz pure simulation with interpolated rendering. No game/UI framework or third-party art is used. Circuit data is passed explicitly into motion/contact calculations. Corner load grows with speed squared; contact separation never changes longitudinal position. All four cars use swept pair/world contacts and lateral separation without longitudinal recovery jumps. Small AI speed/acceleration/corner-caution differences produce distinct performance. The deterministic traffic regression runs each AI for ten full traversals twice and compares exact outcomes.

All cars start just before the line. The first forward start crossing arms the circuit; it awards no lap. Quarter-circuit gates must be crossed in order before each subsequent finish crossing. Countdown and pauses do not enter race times; the first lap includes grid-to-line travel. Results appear immediately after the player's third valid lap and freeze the field. **Race again** or Enter starts a clean grid/countdown without reloading. RACE BEST means the best completed player lap in the current race. PERSONAL BEST is the best valid player lap recorded on this browser and origin, including completed laps from unfinished races. Replay clears race clocks and race best while preserving the personal record. Missing, corrupt or unsupported records are ignored. If storage is blocked, “Saving unavailable” appears and an improving personal best remains available for the current session; it cannot survive reload until storage is allowed.

For manual M5 review, inspect the menu, countdown, HUD, pause and results at 960×720 and larger. Use Tab/Enter to activate focused controls; check every key alias. Complete one lap, reload on the same origin and confirm the personal record on the menu; finish/replay and check that race best resets while personal best remains.

For manual M6 review, listen from Start through the finish: 3/2/1/GO, rising engine pitch under acceleration and falling pitch under braking, a short impact sound at a barrier/tire stack, and the finish fanfare. Try mute during countdown/driving/results, pause or switch tabs, resume, and replay several times. Check that cues remain clear, pause stays silent and engines do not multiply. Review the start line, every corner and traffic at the documented desktop sizes.

Final manual release/performance acceptance remains pending in M7. See [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for current choices and limitations.
