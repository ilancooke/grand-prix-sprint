# Grand Prix Sprint

An original desktop-browser arcade racer, built incrementally against the frozen [specification](SPEC.md).

The current **M5 UI and records slice** runs a complete three-lap race on the 2000 m Harbor Loop against cyan Azure, yellow Gold, and purple Violet. A stationary grid and three-second countdown lead into validated laps, live standings, lap clocks, frozen results, and replay, with personal records retained across reloads. See [PROGRESS.md](PROGRESS.md) and [VERIFICATION.md](VERIFICATION.md) for milestone status and acceptance evidence.

## Setup and launch

Use Node.js **24 LTS** and npm **11**; tested with Node **24.18.0**, npm **11.16.0**, on macOS ARM64. `.nvmrc` records the tested Node version. Development dependencies are pinned in `package.json` and `package-lock.json`.

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

Hold acceleration and steering together. Releasing acceleration slows the car. Focus loss, hidden tabs, or frame gaps above 250 ms pause immediately and clear held keys. Returning to the game requires explicit resume; time spent away is never simulated.

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

Playwright starts the local development server automatically, or reuses an existing server outside CI. The twelve-test suite covers Start/Enter, every driving alias, visible steering while accelerating, coasting/braking, both-verge slowdown and recovery, pause, focus cleanup, resize, exceptional stalls, three distinct moving opponents and their paused field, local-only requests without console errors, countdown immobility and interruption timing, and a bounded complete keyboard race with exact result times, fresh replay, saved records before race finish, slower-lap preservation, reload retention, corrupt storage, denied access/writes, and UI layout at three desktop sizes. The full-race driver lives only under `tests/` and sends ordinary keyboard events; no test fixture or debugging API ships in the game. To check the static bundle, start `npm run preview` after building and run `npm run test:e2e` in another terminal; Playwright reuses that server outside CI. Browser binaries are development-only downloads.

```sh
npx playwright install firefox webkit
npm run test:e2e:compat
```

The six designated driving/UI/record-schema compatibility checks pass in Chromium, Firefox, and WebKit. Full-release compatibility remains M7 work. A local server must be permitted to listen on port 5173; restricted environments may require permitted execution for setup, server startup, and browser tests. See [VERIFICATION.md](VERIFICATION.md) for results and earlier resolved environment limits.

For manual M2 verification, drive the full 2000 m loop through Lighthouse right, Anchor hairpin, Breakwater right, Pines left, and Home right. Brake at the Anchor approach markers: about **170–180 km/h** at its apex permits a clean turn with steering, while excessive speed overwhelms steering and carries the car wide. Grass reduces grip and speed; steer back with throttle to recover. The yellow/black tire stacks at **180 m left**, **660 m right**, and **1440 m left** are collidable. Trees, signs, and stands are decoration beyond the driving verge. Try both shoulders, barriers and tire stacks at low/high speed, then continue without reloading. Inspect the start line/scenery across the seam, resize, pause/resume, and switch tabs while driving.

For manual M3 review, approach the field on the opening straight and use the available road width to pass beside Azure or Gold. Brake and let an opponent pass you, try a gentle side contact, then recover with steering/throttle. Watch the opponents brake before Anchor and accelerate afterward. Pause freezes the whole field. The HUD shows authoritative lap, position, current lap time and race best.

For manual M4 review, start from the menu, observe 3/2/1 with a stationary field and zero clock, and drive three full circuits. Check 1/3 → 2/3 → 3/3, current/best lap changes, position as rivals pass, and immediate frozen results at the third finish. Pause during countdown and racing, switch tabs, then explicitly resume. Replay should show a fresh stopped grid, zero clock and no race best.

## Implementation scope

Strict TypeScript, Canvas 2D procedural graphics, semantic HTML/CSS, and a 60 Hz pure simulation with interpolated rendering. No game/UI framework or third-party art is used. Circuit data is passed explicitly into motion/contact calculations. Corner load grows with speed squared; contact separation never changes longitudinal position. All four cars use swept pair/world contacts and lateral separation without longitudinal recovery jumps. Small AI speed/acceleration/corner-caution differences produce distinct performance. The deterministic traffic regression runs each AI for ten full traversals twice and compares exact outcomes.

All cars start just before the line. The first forward start crossing arms the circuit; it awards no lap. Quarter-circuit gates must be crossed in order before each subsequent finish crossing. Countdown and pauses do not enter race times; the first lap includes grid-to-line travel. Results appear immediately after the player's third valid lap and freeze the field. **Race again** or Enter starts a clean grid/countdown without reloading. RACE BEST means the best completed player lap in the current race. PERSONAL BEST is the best valid player lap recorded on this browser and origin, including completed laps from unfinished races. Replay clears race clocks and race best while preserving the personal record. Missing, corrupt or unsupported records are ignored. If storage is blocked, “Saving unavailable” appears and an improving personal best remains available for the current session; it cannot survive reload until storage is allowed.

For manual M5 review, inspect the menu, countdown, HUD, pause and results at 960×720 and larger. Use Tab/Enter to activate focused controls; check every key alias. Complete one lap, reload on the same origin and confirm the personal record on the menu; finish/replay and check that race best resets while personal best remains.

Audio and final art polish remain M6; release/performance acceptance remains M7. No audio is provided yet. See [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for current choices and limitations. Stop at M5; no commits are created.
