# Verification evidence

## M3 — 2026-10-31

**Status: complete.** M2 prerequisite evidence was read before implementation. Only M3 was implemented; M4–M7 remain pending. Initial worktree was clean; no commits/staging/push or other version-control mutations occurred. `SPEC.md`, dependencies and lockfile are unchanged.

Environment: macOS ARM64, Node **24.18.0**, npm **11.16.0**, existing Playwright **1.64.1** browser installation. Native manual review used Chrome at ordinary desktop size on **http://127.0.0.1:5173**. Browser checks include the **960×720** resize. Commands requiring writes/server/browser access used permitted execution; no setup/download/audit was repeated.

| Exact command | Result |
| --- | --- |
| `npm test -- --reporter=verbose tests/unit/ai.test.ts tests/integration/traffic.test.ts` | Used during controller tuning; all then-current 15 scenarios passed after blocked-traffic fixes. |
| `npm test -- --reporter=verbose tests/integration/traffic.test.ts` | Final **8/8 passed**, prints all 30 full traversal times and contact/off-road counts; long-run scenario executes twice and compares complete outcomes exactly. |
| `npm test -- tests/unit/collisions.test.ts tests/unit/ai.test.ts tests/integration/traffic.test.ts` | **29/29 passed** after the contact-entry tolerance fix; further close-queue coverage was added afterward and is included below. |
| `npm run typecheck` | Passed on final source and again after the browser test correction. |
| `npm run lint` | Passed on final source and again after the browser test correction. |
| `npm test` | **61/61 passed**, 9 files, final run 580 ms. Includes exact 1200-tick equality at 30/60/120/144 Hz for all four cars and AI memory, plus all M1–M2 regressions. |
| `npm run build` | Passed; 20 modules. HTML **2.78 kB**, CSS **3.71 kB**, JS **22.98 kB** (gzip 1.19 / 1.51 / 7.49 kB). |
| `npm run dev` | Served the unchanged local origin for native review and browser tests; stopped before preview. |
| `npm run test:e2e` (final managed development startup) | **6/6 Chromium passed**, **6.2 s**. |
| `npm run test:e2e:compat` (final managed development startup) | **3/3 passed**, **4.4 s**, Chromium/Firefox/WebKit designated smoke. |
| `npm run preview` | Served final static `dist` at the same local origin; stopped after preview checks. |
| `npm run test:e2e` (preview already running) | **6/6 Chromium passed**, **5.8 s** after correcting first-paused-render sampling. Runtime audit reported no external HTTP requests, console errors or uncaught errors. |
| `npm run test:e2e:compat` (preview already running) | **3/3 passed**, **4.0 s**. |
| `git diff --check` | Passed after final source/document changes; Git used only for inspection. |

### Ten full traversals per AI

The normal four-car state starts from rest with the player parked at station 0. Each AI is measured over **ten complete 2000 m intervals from its own initial station**, rather than crediting its shortened first trip to the seam. All three travel at least 20 km. The run terminates when every AI has ten intervals; the faster cars continue circulating naturally while waiting for the slowest. Every tick checks forward-only displacement bounded by **84/60 m**. Two runs compare the entire final state, all crossing times, impact counts and off-road ticks exactly.

Traversal seconds (rounded to 0.001 s for this table; tests retain full precision):

| Traversal | Azure (cyan) | Gold (yellow) | Violet (purple) |
| --- | --- | --- | --- |
| 1, from rest | 29.372 | 30.728 | 28.384 |
| 2 | 27.084 | 28.380 | 26.143 |
| 3 | 27.084 | 28.380 | 26.147 |
| 4 | 27.084 | 28.382 | 26.145 |
| 5 | 27.084 | 28.383 | 26.148 |
| 6 | 27.084 | 28.383 | 26.143 |
| 7 | 27.084 | 28.383 | 26.147 |
| 8 | 27.084 | 28.383 | 26.145 |
| 9 | 27.084 | 28.383 | 26.148 |
| 10 | 27.084 | 28.384 | 26.142 |

Both runs: **0 car impacts, 0 barrier impacts, 0 obstacle impacts; 0 off-road ticks for every AI**. The measured maximum is **30.728187 s** including starting acceleration; the regression requires **<32 s per full traversal**, zero world/car impacts and zero off-road ticks for this particular natural-field scenario. These are evidence-derived fixture bounds, not a claim about a universal acceptable collision rate. Physical traversal times are not M4 legal lap timing.

Separate scenarios verify faster AI passing slower AI and the player, normal player inputs passing an AI side by side, three blocked lanes following/braking then opening, close stopped-queue recovery, off-road steering recovery, seam contacts at 0/2000 m, and a 600-tick four-car obstacle/barrier pileup. The crowded fixture asserts no endpoint car overlap and continued progress, with fewer than 20 impacts over its deliberately overlapping initial state. A 120-tick inward-steering contact fixture verifies exactly one 15% entry speed loss rather than repeated multiplication.

### Manual traffic review and resolved defects

Native Chrome used actual local-origin Start/W/A/D/S/P controls and observed Canvas/HUD, driving behind, beside and through the field:

- Cyan, yellow and purple silhouettes remain distinct on straights and bends; depth scaling, exposed wheels/bodywork/rear wings and nearby side-by-side cars are readable. Normal controls remain responsive with all four cars moving.
- Approached close traffic at **368–390 m / 273–278 km/h**, with Gold alongside right and Azure ahead left. Steering and throttle continued past nearby cars to **610–629 m / 294–298 km/h** without a reset. Car contact gives visible separation and a bounded speed change, then permits recovery.
- Braking near Anchor reduced speed to **39–44 km/h at 716–720 m** and let Gold pass ahead again. Lane width permits passing and being passed. P freezes the field and explicit resume preserves the drive.
- Native multi-key holding is limited; genuine simultaneous-key browser coverage and deterministic traffic scenarios supplement the live driving review. M2 full-loop/scenery/braking evidence remains intact. No complete-race, audio or measured-performance acceptance is claimed.

Resolved during implementation: initial unit assumptions overlooked profile speed caps and preferred lanes; corrected the fixtures. A blocked queue exposed premature cutback and zero-speed throttle deadband trapping; directional transit checks, following clearance, and bounded creep toward a clear lane resolve both blocked and exceptionally close stopped traffic. A four-car pileup exposed re-overlap from later pair/world responses; a final free-space lateral constraint fixes it without another impulse or longitudinal correction. Manual contact exposed floating-point rounding at the separation boundary; a named 1e-9 m tolerance prevents repeated entry penalties, with a sustained-contact regression. The first preview traffic-pixel check sampled the pre-pause interpolated image; it now waits one render before comparing the frozen snapshot. All affected checks pass after fixes. Existing Playwright NO_COLOR/FORCE_COLOR warnings remain benign.

No M3 blocker remains. Three-lap grid/countdown/legality/standings/results/replay belong to M4; persistence/UI to M5; final audio/presentation to M6; release performance/full compatibility to M7. Prior development-only minimatch findings remain recorded below and were not re-audited. Stop at M3 and leave changes ready for the user's commit.

## M2 — 2026-10-31

**Status: complete.** M1 prerequisite evidence was read before implementation. Only M2 was implemented; M3–M7 remain pending. Workspace was clean at start; no version-control mutations were made and `SPEC.md`, dependencies and lockfile are unchanged.

Environment: macOS ARM64, Node **24.18.0**, npm **11.16.0**, existing Playwright **1.64.1** browsers. Native manual review used Google Chrome at ordinary desktop size on **http://127.0.0.1:5173**. Browser checks include the existing **960×720** resize. No browser downloads or installs were required in this session. Commands needing writes/server/browser access used permitted elevated execution.

| Exact command | Result |
| --- | --- |
| `npm run dev` | Passed; served the documented local origin for browser and native driving review. Stopped before preview. |
| `npm test -- --reporter=verbose tests/unit/handling.test.ts tests/unit/collisions.test.ts` | **19/19 passed** after tuning and the obstacle/barrier pinch fix; prints the corner comparison below. |
| `npm run typecheck` | Passed after fixing the new browser test's tuple typing. |
| `npm run lint` | Passed. |
| `npm test` | **42/42 passed**, 7 files; final run 172 ms. Includes exact 1200-tick equality at 30/60/120/144 Hz using final circuit/handling/contacts. |
| `npm run build` | Passed; 18 modules, HTML **2.79 kB**, CSS **3.71 kB**, JS **14.46 kB** (gzip 1.20 / 1.51 / 5.08 kB). |
| `npm run test:e2e` (development) | **5/5 Chromium passed**, 5.6 s. All prior input/pause/focus/stall/resize checks plus both-verge slowdown and rejoin. |
| `npm run test:e2e:compat` | **3/3 passed**, Chromium/Firefox/WebKit designated smoke: 4.1 s on dev, then 3.9 s on final preview. Full compatibility acceptance remains M7. |
| `npm run preview` | Passed on the same local origin with final `dist`. |
| `npm run test:e2e` (preview already running) | **5/5 Chromium passed**, 5.6 s. Runtime audit found no external HTTP requests, console errors or uncaught errors. |
| `git diff --check` | Passed after code and documentation changes. Git used only for inspection. |

Logic evidence covers five eased bends/both directions, multiple ≥200 m passing straights, a straight seam, explicit immutable track objects, speed-squared outward load, both-verge drag/grip/rejoin, bounded sustained barrier contact, swept obstacle/car contacts, initial overlap, simultaneous two-axis sweep, nearest seam distance on multiple unwrapped laps, maximum-speed hits, and continued recovery without longitudinal correction. Pair contacts remain a generic fixture for M3 rather than integrated opponents.

### Braking comparison and fixes

The same test steering policy drives both **650–1000 m** scenarios, starting at **84 m/s** centered. The braked run brakes from 720 m to about 49 m/s, holds near 48–49 m/s until 880 m, then accelerates. Only ordinary inputs enter the production motion/contact functions; no driving assist or test hook is shipped.

| Measurement | Full throttle | Braked |
| --- | --- | --- |
| Section ticks / seconds | 349 / 5.817 | 340 / 5.667 |
| Off-road ticks | 104 | 0 |
| Barrier impacts | 1 | 0 |
| Maximum absolute lateral position | 10.600 m | 0.0091 m (rounded up) |
| Exit speed | 62.417 m/s (224.7 km/h) | 81.633 m/s (293.9 km/h) |

Initial tuning did cause outward drift, but full throttle was faster; that comparison failed and was resolved by tightening Anchor to peak curvature **−0.0095/m** and increasing off-road speed drag to **0.7/s**. The final model retains physical corner load rather than a curve speed cap. Code review also caught the shoulder obstacle/barrier pinch; its regression verifies separation toward the open side. The first Chromium run failed because the old blue-gray pixel heuristic included the new barriers; the test now identifies the two actual asphalt colors. A TypeScript check caught a non-const key tuple in the added browser test; fixed and rerun. No unresolved failing checks remain. Playwright's existing NO_COLOR/FORCE_COLOR warnings are benign.

### Manual driving and visual acceptance

Native Chrome used the real local server with ordinary keyboard input, stopping/pausing between inspected sections:

- Drove Lighthouse right, Anchor left hairpin, Breakwater right, Pines left and Home right; observed location signs, Marina/Harbor stands, moving curbs/trees, yellow/black shoulder stacks, and wide straights. Crossed the **2000 m** seam to **2011 m**, then continued to **2284 m** without loading or a visible road/scenery jump. Surface/verge contrast and chase perspective remain clear.
- Throttle builds speed, braking promptly reduces it to zero, and leaving the surface produces a strong readable slowdown. The tight hairpin pushes outward at speed; braking reduces that load. Deliberately left/rejoined both verges; recovered from rest/low speed with throttle and inward steering. Steering remains usable, and recovery does not snap to the center.
- On the second traversal, approached the left shoulder tire stack at **2172 m / 60 km/h**; after crossing it, the car was separated inward at **2185 m / 45 km/h**. Steered back and continued to **2284 m / 209 km/h** without reset. The tire contact is noticeable and does not trap the car.
- A separate fast opening-straight approach deliberately steered into the right outer boundary; the car stopped moving outward alongside the drawn barrier at **377 m / 77 km/h**. Inward steering/throttle recovered to **482 m / 152 km/h**. Off-road and barrier losses are bounded and recoverable; the pure tests additionally isolate sustained contact and both signs.
- P/Enter pause/resume preserved the drive during review. Existing real-browser regressions cover all aliases with simultaneous throttle, held-key focus cleanup, exceptional stalls and resize. Native multi-key holding remains limited; browser integration and deterministic scenarios supply precise combined-input/comparison evidence.
- Visual review shortened an initially overlong checkered stripe and moved decorative signs/stands beyond the barrier; final periodic rendering tests and production build were rerun. Native static-preview review confirmed the shortened stripe and decoration placement. All art is original procedural code; no asset/network dependency was added.

No M2 blocker remains. This is incremental driving/contact acceptance, not a complete-race or measured-performance claim. M1's prior development-only minimatch advisory remains recorded below; audit was not rerun and dependencies were unchanged. Next authorized session selects **M3**: integrate exactly three opponents and pair contacts, then verify passing and long-run traffic. Stop at M2; no commits/staging/push occurred.

## M1 closeout — 2026-10-31

**Status: complete.** All M1 acceptance criteria have executed evidence. M2–M7 remain pending; no later milestone was started. `SPEC.md` and production gameplay code were unchanged during closeout.

Environment: macOS ARM64, Node.js **24.18.0**, npm **11.16.0**. Playwright 1.64.1 installed Chromium **156.0.8078.4**, Firefox **157.0**, and WebKit **27.2** using the normal installer. Native local-origin review used Google Chrome **156.0.8078.74**, normal desktop size and Responsive Mode at **960×720**, DPR 2. This is M1 slice verification, not the M7 release/performance audit.

### Executed command evidence

Commands ran from the project root with permitted elevated execution for writes, network, server binding, and browser launch. No application configuration or origin was changed to bypass an environment limit.

| Exact command | Result |
| --- | --- |
| `npm ci` | Passed: installed 133 packages and audited 134 in 23 s. Lockfile unchanged. Audit and optional-script warnings described below. |
| `npx playwright install chromium` | Passed: normal Chromium, headless shell, and FFmpeg installation. |
| `npx playwright install firefox webkit` | Passed: both engines installed normally. |
| `npm run dev` | Passed: Vite started at `http://127.0.0.1:5173`; native Chrome launch/driving review performed. Stopped before managed-startup verification and preview. |
| `npm run typecheck` | Passed after browser-test changes and again after standard clean installation. |
| `npm run lint` | Passed after browser-test changes and again after standard clean installation. |
| `npm test` | Passed: **23/23 tests**, 5 files, including exact 1200-tick equality at 30/60/120/144 Hz. |
| `npm run build` | Passed: 17 modules; HTML **2.79 kB**, CSS **3.71 kB**, JS **9.70 kB** (gzip 1.20 / 1.51 / 3.61 kB). |
| `npm run test:e2e` | **4/4 Chromium tests passed** after test changes. Final dev run used Playwright-managed Vite startup/shutdown, **3.6 s**. |
| `npm run test:e2e:compat` | **3/3 passed**: Chromium, Firefox, WebKit designated slice smoke, **8.8 s**, using the running dev server. |
| `npm run preview` | Passed: static production output served at the same documented origin. Native Chrome menu/start/drive/pause review performed. |
| `npm run test:e2e` (while preview was running, outside CI) | **4/4 passed**, **3.1 s**; Playwright reused static preview. Launch/input audit found no external HTTP requests, console errors, or uncaught errors. |
| `npm audit --json` | Exited **1**: 11 moderate development-tool findings, all propagated from the minimatch globparts amplification advisory [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249). |
| `npm audit --omit=dev` | Passed: **0 vulnerabilities**. There are no production npm dependencies. |
| `git diff --check` | Passed; no whitespace errors. Git was used for read-only inspection only. |

`npm ci` emitted the optional `fsevents@2.3.3` install-script warning; setup/checks succeed without approving it. Playwright emitted the benign `NO_COLOR`/`FORCE_COLOR` warning. No script permissions were changed. Dependency pins were preserved; no `npm audit fix` or suggested breaking downgrade was applied. The minimatch issue concerns development glob processing and is absent from the static game bundle; review a compatible lint dependency patch when available. It does not block M1 launch/driving acceptance.

### Browser and manual acceptance

The browser suite now has four tests. Alongside Start/Enter, held-key blur clearing, preserved paused distance, resize, and a five-second exceptional gap without simulation advancement, it asserts visible steering through Canvas road displacement while acceleration continues for **A, D, Left, Right**. It also verifies **W/Up**, coasting, and **S/Down** braking to zero. The test uses rendered pixels above the car on the opening straight, not a public game-state hook. The launch test now fails on console errors as well as uncaught errors and external HTTP requests. No fixtures or test globals enter the production bundle.

Native Chrome used the real documented HTTP origin with actual keyboard/pointer input:

- Enter started the development slice; pointer Start also worked on static preview. W/Up acceleration reached the **302 km/h** displayed cap, and releasing throttle reduced speed. A/D and Left/Right shifted the road in the expected direction; S/Down stopped at **0 km/h**.
- Sustained driving passed **2449 m**, then continued beyond **3151 m** on the **1500 m** provisional circuit. Road/scenery progressed through bends and the looping seam without loading or a visible discontinuity. Existing seam/interpolation/render-command tests additionally cover exact repeated geometry and scenery.
- Perspective narrowing, curved road, roadside trees/signs/curbs, four exposed tires, bodywork, cockpit, and rear wing read as a convincing chase racer. Inputs respond promptly; final braking/corner-load and recovery feel are intentionally M2 work.
- P paused, Escape resumed, and Enter/button resumed. Switching to another tab and returning left the visible focus-loss pause at **3183 m / 120 km/h**. Resizing preserved that drive; no background travel was integrated. Browser tests separately establish clearing a key held during blur and exceptional-stall rebasing.
- At **960×720**, the menu, HUD, canvas, and pause controls remained readable. The native review resumed after resize and braked to rest at **3197 m**. Static preview was then reloaded at that size; menu/start, steering/braking, and pause worked (55 m / 109 km/h at pause). The browser suite also verifies canvas/HUD visibility after resize.
- Native multi-key holding remains limited by the automation API; the passing Playwright simultaneous-input/pixel check supplies that integration evidence. Native visual observations and browser assertions complement each other.

### Handoff and remaining limits

No M1 acceptance blocker remains. Prior default-sandbox bind/DNS failures are historical and resolved with permitted execution using standard commands. Browser downloads remain development setup only; runtime uses the local static server and original procedural art.

M2 owns final circuit/meaningful handling/collisions. AI, race legality/timing/results/replay, persistent records, audio, full-release browser compatibility, Safari manual acceptance, and measured performance remain their planned later milestones. No full-race or release-readiness claim is made. Stop after M1; the next authorized session starts M2.

## Historical first M1 handoff — 2026-10-31

**Status at that handoff: in progress.** Local-server/browser acceptance was unverified then; the closeout above supersedes these blockers. No M2 work started.

Environment: macOS ARM64, Node.js 24.18.0, npm 11.16.0. Native visual review used Firefox 156.0.1 at the normal desktop size and Firefox Responsive Design Mode at 960×720, DPR 2. This is incremental M1 evidence, not the M7 compatibility/performance release audit.

### Passing executed checks

| Exact command | Result |
| --- | --- |
| `node --version` / `npm --version` | `v24.18.0` / `11.16.0` |
| `npm install --offline --cache .npm-cache --no-audit --no-fund` | Installed 133 development packages; generated lockfile. |
| `npm ci --offline --cache .npm-cache --no-audit --no-fund` | Reinstalled 133 packages from the lockfile successfully. |
| `npm run typecheck` | Passed after final source changes. |
| `npm run lint` | Passed after final source changes. |
| `npm test` | 5 files, **23 tests passed** after final source changes; final run 209 ms. |
| `npm run build` | Passed after final source changes: 17 modules; static HTML 2.79 kB, CSS 3.71 kB, JS 9.70 kB (gzip 1.20 / 1.51 / 3.61 kB). |
| `npm run test:e2e -- --list` | Configuration loads and discovers all 3 Chromium smoke tests; discovery does not execute browsers. |

The npm commands emitted a warning about the optional `fsevents` install script not being approved by npm 11. Installation, checks, and bundling succeeded without it. No script approval or permission changes were made.

Logic coverage: positive/negative modulo and periodic lookup, malformed track geometry, both curve directions, perspective/near-plane behavior, unwrapped seam interpolation, repeated-loop rendering/scenery identity, acceleration/speed cap/coasting/brake priority, speed-sensitive simultaneous throttle/steering, immutable prior state, all driving aliases, opposite steering and key clearing. The clock integration runs the same 1200-tick input schedule at 30/60/120/144 Hz and obtains **exactly equal** simulation snapshots; interruption and reset tests verify no missing-gap integration or retained accumulator remainder.

Source audit with `rg -n 'https?://|fetch\(|XMLHttpRequest|WebSocket|localStorage|AudioContext|Math.random|window\.|document\.' src index.html` found browser APIs only in platform/controller/UI code; no external runtime URL or network client appeared. Production entry imports no tests/fixtures. A runtime local-origin network/console audit is still pending.

### Failed or blocked executed checks

| Exact command | Actual result |
| --- | --- |
| `npm install --cache .npm-cache --fetch-retries=0 --fetch-timeout=10000` | `ENOTFOUND registry.npmjs.org`; ordinary npm DNS blocked. |
| `npm run dev` | `listen EPERM: operation not permitted 127.0.0.1:5173`; server could not bind. |
| `npm run preview` | Same local port-binding denial. |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/gps-playwright npx playwright install chromium` | `ENOTFOUND cdn.playwright.dev`; standard browser installation did not complete. |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/gps-playwright npm run test:e2e` | Playwright's managed Vite server failed with the same `listen EPERM`; **no browser tests executed**. |
| `PLAYWRIGHT_BROWSERS_PATH=/tmp/gps-playwright npm run test:e2e:compat` | Same managed-server failure; **no compatibility tests executed**. |

Permitted direct downloads of registry metadata/tarballs populated the ignored `.npm-cache`; npm verified integrity while installing offline. A Chromium archive was also downloaded/unpacked under `/tmp`; that does not establish a standard Playwright installation or passing browser tests. No environment workaround is required by the application or included in its source.

### Native manual/visual evidence

Because a local server could not bind, a temporary review document in `/tmp` inlined the exact built JS/CSS into the generated HTML. Native Firefox opened this document; it was not shipped, and it is not the supported README launch path.

- Enter and the Start button each began driving. W/Up accelerated, A/D and Left/Right shifted the road relative to the chase car while moving, and S/Down braked; the final stop displayed **0 km/h**.
- A sustained drive passed **2869 m**, beyond the provisional **1500 m** circuit; continued driving later reached **3337 m**. Motion continued through bends and repeated the track without a load screen. Exact seam/scenery repeat is also covered by deterministic render tests.
- The road narrows to the horizon, visibly bends, and shows moving curb/lane/scenery detail. The player shows four exposed tires, suspension, bodywork, cockpit, and rear wing. The presentation reads as a chase racer. Controls respond promptly; stronger corner/braking feel is intentionally M2 work.
- P displayed PAUSED; Escape resumed with the same drive. Switching away and back left the overlay visible with “Focus lost. Press Resume when you are ready.” Position/speed stayed preserved while paused.
- Menu, HUD, canvas, and pause overlay remained readable at the normal desktop size and **960×720**. Native resizing did not reset the drive.
- Visual review exposed curb-color hairlines; pixel-row strip edges fixed them. The final bundle was rebuilt and reviewed again, including arrow steering and both brake aliases. A separate test corrected/guards scenery changing sides on subsequent loops.
- Native input automation cannot hold two non-modifier keys together. Simultaneous throttle/steering passes pure tests, but real-browser simultaneous-input verification remains pending with the configured suite. Clearing a key held during blur and exceptional-stall handling also require the pending browser checks.

### Remaining evidence and next step

Resume **M1** with a terminal permitted to bind the documented local port. Follow README setup, install Playwright Chromium, run the primary suite, and review a full drive on **http://127.0.0.1:5173** (also preview `dist`). Verify simultaneous input, focus/held-key cleanup, exceptional stalls, resize, and local-only requests/no console errors. Fix any observed failures and rerun affected checks. Mark M1 complete only when that required evidence passes, then stop; M2 is a later session.

Firefox/WebKit browser-suite installation/execution and the M7 full release/performance audit have not passed or been claimed. No commits, staging, repository initialization, deployment, or publishing occurred.
