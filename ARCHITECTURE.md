# Grand Prix Sprint — Architecture Plan

## Status and source of truth

This document preserves the architecture plan and its assumptions. M1 now has source code, pinned local tooling, a playable free-driving slice, and passing logic/build/local-origin browser and manual verification. Its acceptance evidence is recorded in `VERIFICATION.md`. `PROGRESS.md` is the authoritative completion ledger. Later components below remain planned until their milestones are verified.

`SPEC.md`, titled **Grand Prix Sprint — Game Specification**, version 1.0, is the authoritative, frozen specification. Do not edit or replace it.

The product is one original, single-player, desktop-browser arcade racer: one closed circuit, a player and exactly three AI cars, three laps, complete menu/race/results/replay flow, persistent best lap, and basic racing audio. The implementation must meet the specification without a backend, credentials, paid services, external APIs, or mandatory hosted runtime assets.

## Technology choices

| Area | Choice | Reason |
| --- | --- | --- |
| Language | TypeScript with strict checking; ordinary ES modules | Explicit simulation/state contracts and useful checks without introducing a framework. |
| Development and build | Vite, npm, a supported Node.js LTS release | Small static browser application, local development server, production bundling, and preview. Pin the actual Node/npm and package versions when implementation begins; commit the lockfile. Node is a development/build dependency, not a deployed game service. |
| Rendering | Browser Canvas 2D at a fixed logical resolution, scaled to the available desktop viewport | Segment projection and flat-color sprites fit retro pseudo-3D well. Canvas provides direct control of road clipping, draw order, and pixel styling without a 3D engine. |
| Menus and HUD | Semantic HTML and CSS over/around the canvas | Readable type, keyboard-operable controls, responsive layout, and simple browser assertions. No React or component framework is needed. |
| Audio | Native Web Audio API with synthesized sounds | Original engine, signals, feedback, and finish cue; no downloads or asset licensing dependency. |
| Persistence | Versioned, validated `localStorage` record | Satisfies best-lap persistence without a service. Storage errors are recoverable. |
| Logic tests | Vitest | Fast deterministic TypeScript tests for simulation, track, AI, timing, collisions, and race rules. |
| Browser tests | Playwright | Real keyboard input, complete races, pause/focus behavior, reload persistence, and production-build smoke checks. Chromium is the primary automated target; Firefox and WebKit get compatibility checks. WebKit testing is supplemented by a Safari manual check when available. |
| Static checks | TypeScript compiler plus a small ESLint configuration | Catch type and correctness errors. Avoid elaborate lint plugins, code generation, or custom build infrastructure. |

Use local packages and bundled assets only. npm package acquisition and optional Playwright browser downloads occur during development setup; the running application must not request a third-party service or CDN. Do not introduce an engine, ECS, physics library, worker pool, online leaderboard, multiplayer, mobile controls, multiple circuits, tuning shop, weather, damage model, or track editor.

## High-level design

```text
Keyboard / menu actions ──> application state controller
                                 │
                                 v
requestAnimationFrame ──> fixed-step simulation ──> read-only render snapshot
                                 │                        │
                                 │                        ├─> Canvas road / cars / scenery
                                 │                        └─> HTML HUD / screens
                                 v
                         discrete gameplay events
                                 │
                                 ├─> audio adapter
                                 └─> best-lap persistence adapter
```

Keep the design as functions and small modules. Simulation receives explicit configuration, state, input, and a fixed timestep; it never reads the DOM, storage, audio, wall clock, or animation APIs. Rendering does not modify simulation. The application controller owns transitions and adapter effects. A synchronous ordered event list is sufficient; a generic event bus is unnecessary.

### Planned components and files

These paths describe intended responsibilities. The M1 subset now exists; later race, AI, collision, audio, persistence, and final-UI modules remain planned. Combine small neighboring modules if that keeps the code easier to follow.

| Planned path | Responsibility |
| --- | --- |
| `index.html`, `src/main.ts`, `src/styles.css` | Bootstrap, canvas/HTML layout, application composition. |
| `src/app/controller.ts` | Menu/countdown/racing/paused/results transitions, replay reset, adapter ownership. |
| `src/platform/input.ts` | Held-key state, key aliases, edge-triggered menu/pause actions, focus cleanup. |
| `src/platform/loop.ts` | Animation callback, accumulator, interpolation, long-gap handling. |
| `src/platform/audio.ts` | Lazy Web Audio startup, engine modulation, effects, mute/suspend/dispose. |
| `src/platform/storage.ts` | Best-lap validation, schema version, safe reads/writes. |
| `src/game/types.ts`, `src/game/config.ts` | Explicit state types, units, named handling/race constants. |
| `src/game/track.ts`, `src/content/circuit.ts` | Periodic segment lookup, track boundaries, gates, original circuit/scenery data. |
| `src/game/vehicle.ts` | Speed, lateral movement, grip, corner load, off-track penalties. |
| `src/game/collisions.ts` | Car/obstacle/barrier contacts and bounded recovery. |
| `src/game/ai.ts` | Deterministic speed planning, following, passing, rejoining. |
| `src/game/race.ts`, `src/game/simulate.ts` | Fixed-tick updates, countdown, valid laps, clocks, rankings, finish events. |
| `src/render/projection.ts`, `src/render/renderer.ts`, `src/render/art.ts` | Projection/clipping, draw order, original procedural car/scenery artwork. |
| `src/ui/screens.ts`, `src/ui/hud.ts` | Menu, controls, HUD, pause, results, replay, mute. |
| `tests/unit/`, `tests/integration/`, `tests/e2e/` | Pure logic tests, multi-system race scenarios, real-browser flows. |
| `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js` | Minimal local tool configuration, established during implementation. |
| `README.md`, `IMPLEMENTATION_NOTES.md` | Setup/run/test instructions; final choices, limitations, and known issues. |

## Game state and simulation

### Coordinates and state

Represent the circuit as a periodic ordered array of equal-length road segments with curvature, width, surface/curb colors, scenery placements, and optional obstacles. Track length is `segmentCount × segmentLength`. Keep a continuous, unwrapped longitudinal station for each car; derive the wrapped station only for track lookup and rendering. Store lateral position in world-distance units relative to the road center. Physical dimensions, speed, acceleration, and time use consistent world meters and seconds; convert speed to km/h for the HUD.

Each car stores identity, longitudinal/lateral position, speed, lateral velocity or steering response, dimensions, legal lap/gate progress, lap timestamps, finish status, and contact cooldowns. An AI car additionally stores its performance profile, desired lane, and a short-lived passing commitment. Initial differences are explicit constants, not runtime randomness. Use a seeded generator only if a later necessary behavior actually requires randomness; replay determinism should not depend on `Math.random()`.

Race state contains the phase, prior phase when paused, all four cars, countdown ticks, active race ticks, current-lap start timestamps, completed-lap times, session best, starting-grid data, and immutable results once the player finishes. The stored personal best is separate from the current race best. Clocks and ranking have one simulation source of truth; HUD and results never recalculate them independently.

### Fixed-step loop and timing

- Start with a 60 Hz simulation and render using `requestAnimationFrame`. A render snapshot interpolates previous/current positions; interpolate unwrapped stations before wrapping so finish-line crossings do not jump visually.
- Use integer simulation ticks as the clock base. Derive lap/finish crossing timestamps from the tick plus the deterministic fraction of that tick at which a swept crossing occurs; use those same timestamps for lap duration, total time, and finish ordering. The countdown lasts exactly 180 active simulation ticks; all cars remain stationary until GO. Race and first-lap time begin at GO, excluding countdown and pause.
- Accumulate elapsed foreground time and run fixed updates. At ordinary 30/60/120/144 Hz render rates, equal active durations and tick-indexed inputs must produce equal simulation outcomes. Bound catch-up work to prevent a spiral under load.
- On `blur` or a hidden document, pause immediately, clear held keys, suspend audio, and discard the accumulated wall-time gap. Returning to the page leaves a visible pause overlay; explicit resume restarts the frame baseline.
- Treat an exceptional frame gap beyond the tested catch-up budget as an interruption: enter the same pause path before advancing the gap, clear the accumulator, and require resume. Never silently discard a large gap while continuing a timed race. Thresholds are named constants tuned and tested in implementation.
- Pause during countdown or racing preserves that exact phase and all counters. Menu/results have no active race clock. Resume must not reset car state or countdown.

### Vehicle behavior and collisions

Use deliberately arcade dynamics: bounded gradual acceleration, braking to zero, rolling drag, a maximum speed, and speed-dependent steering. The required controls do not imply reverse; assume forward-only propulsion. Resolve simultaneous accelerator/brake consistently with braking taking priority. Held accelerate plus steer must work.

Use local curvature and speed to calculate outward corner load, approximately proportional to speed squared times curvature, opposed by steering and available grip. Calibrate one tight corner so full throttle through that section causes a measurable wide exit/off-track slowdown, while timely braking permits a faster clean passage. Merely drawing a curve or imposing an invisible curve speed limit is insufficient evidence of meaningful cornering. AI uses the same motion and penalties as the player, driven by its own input/controller.

Off-road reduces available grip and adds drag without permanently immobilizing a car. Bound the playable lateral verge; an outer barrier stops further outward movement and applies a moderate speed loss/inward recovery. Recovery never advances longitudinal race progress or teleports a car along the circuit. Avoid forcing every off-road excursion back to center.

Detect collisions in track coordinates using car length/width and the shortest appropriate wrapped longitudinal separation. Use swept overlap or bounded substeps for contacts if maximum relative motion could tunnel through a car or obstacle within one tick. Resolve unordered car pairs once per tick, with small lateral separation and bounded speed loss. Barriers and selected visible roadside obstacles have explicit collision shapes; decorative distant scenery does not. Cooldowns suppress repeated impact/audio spam without disabling physical separation. Handle contact near the lap seam identically to other locations. Cars must always be able to continue or rejoin.

### Opponent AI

Exactly three profiles provide small differences in straight speed, acceleration, corner caution, and passing preference. A deterministic lookahead controller estimates a safe target speed from upcoming curvature and braking distance, accelerates on straights, and brakes before corners. Do not use a scripted longitudinal position timeline, rubber-band teleports, or a second set of physics rules.

Choose a preferred lateral line, detect a slower car ahead, and evaluate a few candidate passing lanes against car widths, road boundaries, and a forward safety gap. Commit briefly with hysteresis to avoid lane oscillation. If no lane is safe, follow and brake; retry when space opens. An off-track recovery controller steers toward the road with reduced throttle. Test prolonged blocked traffic, side-by-side racing, and seam crossings. This small controller is preferable to machine learning, full pathfinding, or expensive optimal racing-line computation.

### Race progression and results

Use `menu → countdown → racing → results`, with pause preserving countdown/racing. All four cars occupy distinct stationary grid slots before GO. Replay constructs fresh race/car/input/contact/AI state and clears timing accumulators while preserving personal best and mute preference for the current session.

Grid slots lie just before the start line, with negative unwrapped stations. Each car's initial forward crossing arms its first circuit; it does not count a completed lap. Ordered sector gates, including that start crossing, establish traversal of the whole circuit. A subsequent forward finish crossing counts only after all required gates were crossed in order. First-lap time includes the initial grid-to-line travel because its clock began at GO. Each car finishes upon its third valid completed circuit. Inspect gate crossings over the entire previous-to-current swept interval, including a modulo wrap, rather than relying on an exact segment equality. Reject reverse crossings, duplicate finish contacts, skipped gates, and injected discontinuous progress; a valid tick's displacement cannot exceed the configured physical movement bound. Normal off-track driving is penalized physically, not made lap-invalid by an invented racing rule.

Rank unfinished cars by validated circuit/sector progress and distance within the current legal sector; longitudinal progress is continuous across the seam. A malformed jump cannot gain a lap or ranking credit. Cars already finished rank ahead in finish-crossing order, using crossing time within a tick and a stable identity tie-breaker for exact ties. Update all four cars and crossing events before taking the player's final position. When the player completes lap three, freeze the world and results; opponents still racing rank behind all finishers, so there is no wait for AI to finish. Total time, best completed lap, and final position come from the same authoritative state.

## Rendering strategy

Render a fixed-height chase view behind a recognizable player open-wheel car. Project upcoming road segments from track space into screen space with perspective scaling. Accumulate lateral curvature into the projected road center. Draw sky/horizon, far-to-near grass/verge/road/curbs, then depth-sorted scenery and opponent sprites with consistent segment clipping; composite the player car near the bottom. Distance scaling, repeated road markers, and distinct scenery clusters convey motion and track location. The start/finish line is visible on the road and wraps continuously with the circuit.

Draw original car art from polygons/rectangles or locally generated sprites: distinct exposed wheels, bodywork, and rear wing. Give opponents distinct palettes with readable silhouettes. Build one coherent limited retro palette, sharp shapes, system monospace typography, and sufficiently contrasted HUD text. Use grass, curbs, barriers, signs, and selected grandstands to make boundaries and corner locations legible. Keep the racing surface visually distinct from the verge.

Use a modest logical canvas such as 960×540, letterboxed/scaled without stretching. The exact size is a tuning choice, not a product requirement. Resize display/layout without changing simulation units. Limit draw distance and reuse procedural art; cache only artwork that profiling identifies as costly. Do not add elevation, dynamic lighting, a minimap, or full 3D scenery to solve the specified flat-road presentation.

## UI, audio, and persistence

- Main menu: title, Start Race, compact explanation of every keyboard action, and personal best when available. Enter starts/confirms the currently focused action.
- Race HUD: speed, current lap clamped to 1–3, position out of four, current lap time, and best lap. Show an em dash before a completed lap exists. Track total elapsed time internally and show it in results; an extra total-time HUD element is not required.
- Results: frozen final position, total race time, race best lap, and replay. Menu shows the stored personal record; during a race the best-lap label means the best completed lap of that race.
- Pause: visible overlay, no simulation or clock movement, explicit resume via Escape/P or a control. Prevent key-repeat from toggling repeatedly and prevent driving keys from scrolling the page when gameplay owns input.
- Audio: initialize/resume the audio context from a Start/Enter/click user gesture. Modulate an oscillator/filter/gain from speed, schedule short original countdown/start and finish cues, and rate-limit impact/off-track feedback. Provide a visible keyboard-accessible mute control in all phases. Audio denial/failure must not block play. Suspend engine/effects during pause or focus loss; replay must not duplicate nodes or listeners.
- Best lap: persist each newly improved valid completed player lap, including laps from an unfinished race. Version and validate finite positive milliseconds; ignore corrupt/unknown records and handle unavailable storage. Ordinary reload on the same origin retains the record. If the browser blocks storage, gameplay continues with a session record and a concise indication that saving is unavailable. Persistence cannot be guaranteed against browser policy or user-cleared site data.

## Testing and verification

Every implementation milestone adds tests for its new behavior and retains a runnable application. Tests are not postponed to a final infrastructure phase.

1. **Pure unit tests:** acceleration/cap/drag/braking, simultaneous inputs, speed-sensitive steering, corner load, off-road slowdown, contact/recovery/seam math, projection/clipping math, AI braking/lane choice, grid arming, ordered gates, forward-only lap validity, ranking, exact countdown, lap/race timing, and schema validation.
2. **Deterministic integration tests:** prescribed tick-indexed inputs against the real simulation; equivalent render schedules; pause/resume and interruption rebasing; three AI cars racing for many laps; blocked/passable traffic; standings when opponents finish first; full three-lap results; replay reset; persistence event boundaries. Compare state with explicit float tolerances and exact tick counts. Automated drivers are test helpers, never production assist features.
3. **Browser tests:** actual menu and key aliases, held accelerate/steer, countdown lock, Escape/P, focus cleanup, HUD updates, mute gesture, results/replay, persistent best after reload, storage failure, and no runtime errors. Use a bounded test driver through the same input boundary or a deterministic start fixture for expensive full-race coverage; separately validate real keyboard driving. Keep any fixture behind test-only startup and exclude it from production output.
4. **Visual/manual review:** confirm pseudo-3D chase presentation, visible cornering, wheel/body/wing recognition, distinct opponents, clear surface boundaries, start line, readable screens, overtaking room, audible speed change, and recovery feel. Screenshots alone do not prove responsive driving or a fun braking model.
5. **Release/performance checks:** serve the production build locally with no external runtime requests. Record a named representative desktop, browser/version, viewport, and a full-race performance sample. Aim for approximately 60 rendered fps on a 60 Hz typical desktop, with a frame-time distribution and observations of recurring stalls; diagnose before optimizing. Verify simulation outcomes at 30/60/120/144 Hz render schedules, plus browser resizing and interruptions.

Use constrained, named test fixtures rather than exposing simulation internals as permanent global debugging APIs. Avoid brittle pixel-perfect snapshots for all scenes; use deterministic projection assertions and a few reviewable scene captures. The final README must distinguish unit tests, browser setup, browser tests, and manual verification.

## Significant risks and mitigations

| Risk / dependency | Mitigation and completion evidence |
| --- | --- |
| Road rendering looks flat, overhead, or disconnected at corners/seam | Establish projection and chase silhouette in milestone 1; review a full looping drive, clipping, road width, and seam continuity before detailed art. |
| Handling is unresponsive or full throttle is always optimal | Tune controls in the first playable slice; in milestone 2 compare the same tight-corner approach with braking versus full throttle, then manually validate the result. Keep physics constants centralized. |
| Wrong laps or standings at the grid/seam | Design unwrapped coordinates from the start; ordered gates, initial arming, swept crossings, finish-time ordering, and adversarial tests in milestone 4. |
| AI oscillates, crashes constantly, blocks overtaking, or gets stuck | Share physics, use braking lookahead and lane hysteresis, and run seeded/deterministic multi-lap traffic scenarios in milestone 3. |
| Repeated impacts or tunneling make cars unusable | Check motion bounds, use sweep/substeps when required, bound penalties, and test sustained contact plus off-road recovery. |
| Pauses/background tabs corrupt time or input | Centralize tick clocks, input clearing, phase-preserving pause, and frame-baseline reset; test focus loss during countdown and racing. |
| Canvas projection/DOM updates miss smoothness target | Limit visible segments, avoid unnecessary HUD writes, profile representative scenes, and add caching only after measurement. |
| Audio autoplay restrictions or leaking nodes | Unlock from explicit user gesture, provide mute/fallback, suspend on pause, and verify repeated replay. |
| Browser storage is denied/corrupt | Safe versioned adapter with validation and a session fallback; verify ordinary reload persistence and denied-storage behavior separately. |
| End-to-end races become slow or flaky | Put exhaustive rules in fast simulation tests; keep a small browser suite with deterministic bounded drivers and genuine-keyboard smoke coverage. |
| Art licensing or asset hosting introduces a dependency | Prefer original procedural visuals and synthesized sound; document any local third-party asset and its license before use. |
| Product completeness is lost to polish or infrastructure | Seven dependency-ordered milestones, an early playable slice, and a requirement-to-milestone map in `ROADMAP.md`; no unrelated features. |

## Recorded assumptions and boundaries

- `SPEC.md` is the authoritative, frozen specification.
- Desktop keyboard use is primary. Pointer-operable menu/mute controls are sensible UI; touch driving, gamepads, and mobile support are outside scope.
- The circuit can be flat. It needs at least four distinct left/right corners and multiple straights/overtaking sections, not elevation or a real-world licensed layout.
- Forward-only driving is sufficient. Lap validation must nevertheless reject reverse/discontinuous test inputs and finish-line oscillation.
- Countdown time and paused/unfocused time are excluded from race/lap clocks. Focus return requires explicit resume, and exceptional stalls use the same interruption policy.
- Personal best means any valid completed player lap. Race results show the best lap from that race; the menu displays the persistent record.
- Final position is the player's position at their legitimate third-lap finish, with prior AI finishers ahead; results appear immediately.
- The spec's smoothness and typical-desktop language has no numeric baseline. The proposed 60 fps target is an engineering verification target, with the measured machine and conditions documented rather than an unsupported universal guarantee.
- Persistent record storage is per browser origin. Run the same local origin/port across reloads; file-URL launch is not the supported setup.
