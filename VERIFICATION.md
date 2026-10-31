# Verification evidence

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
