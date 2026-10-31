# Verification evidence

## M1 — 2026-10-31

**Status: in progress.** Required local-server/browser acceptance remains unverified. No M2 work started.

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
