# Grand Prix Sprint — Implementation Progress

## Current handoff

- **Phase:** M1 complete; session boundary reached. M2–M7 remain pending.
- **Selected milestone:** M1 — Playable chase-view driving slice. No dependencies.
- **Next concrete step:** In a new authorized session, begin M2: finalize the circuit, add meaningful corner/off-road handling and recoverable collisions, and run its deterministic/manual acceptance checks. Do not begin M2 in this session.
- **Implementation verification:** Standard `npm ci`, typecheck, lint, 23 logic tests, build, all 4 Chromium tests (development and production preview), and 3 compatibility smoke tests pass. Native Chrome local-origin full-loop, controls, pause/tab-return, and 960×720 review pass. See `VERIFICATION.md`.
- **Remaining issues:** No M1 acceptance blockers. npm reports one moderate minimatch denial-of-service advisory propagated through 11 development-tool packages; production-only audit reports zero vulnerabilities. Dependency versions remain pinned; no automatic audit fixes were applied. Full race, final handling, audio, persistence, and release performance/compatibility remain later-milestone work.

## Milestone status

This is the single completion ledger. Use `pending`, `in progress`, or `complete`; keep at most one milestone `in progress`. Select the first unfinished milestone in roadmap order. Mark it complete only after all its acceptance criteria and required verification have evidence. Stop after that milestone and leave changes for the user to review and commit.

| Milestone | Outcome | Status | Evidence |
| --- | --- | --- | --- |
| M1 | Playable chase-view driving slice | complete | Standard setup/dev/preview pass; typecheck/lint/build, 23 logic tests, 4 Chromium tests on dev and preview, 3 compatibility smoke tests, and native Chrome local-origin driving/resize/interruption review pass. |
| M2 | Complete circuit, meaningful handling, and recoverable collisions | pending | No implementation or verification yet. |
| M3 | Three functioning opponents and overtaking | pending | No implementation or verification yet. |
| M4 | Valid three-lap race, correct standings, pause, and replay | pending | No implementation or verification yet. |
| M5 | Complete readable UI and persistent personal best | pending | No implementation or verification yet. |
| M6 | Finished retro presentation and original racing audio | pending | No implementation or verification yet. |
| M7 | Integrated release verification and complete handoff | pending | No implementation or verification yet. |

## Session records

### 2026-10-31 — M1 implementation and partial verification

**Selected milestone:** M1, dependencies none. **Result: in progress.** M2–M7 were not started. The initial workspace contained only planning documents and was not a Git repository; no Git mutations or commits were made. `SPEC.md` was not changed.

**Implemented:** Pinned TypeScript/Vite/Vitest/ESLint/Playwright tooling and lockfile, centralized server settings, a 60 Hz pure simulation, read-only snapshots, unwrapped positions, a provisional 1500 m periodic circuit, perspective road/scenery/car art, keyboard aliases/held inputs, gradual acceleration/cap/brake/coasting/speed-sensitive steering, semantic Start/Enter and HUD, explicit pause/resume, focus/hidden/stall interruption with held-input clearing and clock rebasing, render interpolation, HMR cleanup, and tests. Source is under `src/{game,content,platform,render,app,ui}`; configuration at the root and `config/server.ts`; checks under `tests/{unit,e2e}`. Added README, implementation notes, and incremental verification evidence; updated guidance/planning status without changing requirement coverage.

**Acceptance evidence:**

| M1 criterion | Evidence and remaining limit |
| --- | --- |
| Documented local launch with no backend/CDN | Local scripts and static bundle exist; source audit finds no external runtime URLs/network client. Actual dev/preview launch and runtime request audit blocked by port-binding policy. |
| Start/Enter, throttle/brake/steer and simultaneous input | Native Firefox verified Start/Enter and every driving alias. Pure tests verify aliases, held keys, simultaneous throttle/steering and brake priority. Configured real-browser combined-input test has not executed. |
| Chase camera, perspective, bends, moving detail, exposed wheels/body/wing | Native Firefox scenes/driving review passed; projection and periodic-render tests pass. Final renderer reviewed at 960×720 after hairline fixes. |
| Coasting, speed-sensitive steering, looping seam | Physics tests pass; native review drove beyond 2869 m, then 3337 m on the 1500 m loop. Unwrapped interpolation, modulo lookup, and exactly repeating scenery/geometry covered by tests. |
| Pause/focus/rebase and frame independence | Native P/Escape and tab-return pause verified. 30/60/120/144 Hz schedules produce the exact same 1200-tick state. Unit interruption/remainder tests pass; held-key blur and exceptional-stall browser tests remain blocked. |
| Type/lint/unit/build/browser smoke pass | First four pass; primary browser suite blocked before tests start. This prevents milestone completion. |

**Commands/results:** `npm install --offline --cache .npm-cache --no-audit --no-fund` and `npm ci --offline --cache .npm-cache --no-audit --no-fund` each installed 133 packages successfully. Final `npm run typecheck`, `npm run lint`, `npm test` (**23/23**, 5 files), and `npm run build` passed. Build: HTML 2.79 kB / CSS 3.71 kB / JS 9.70 kB. `npm run dev`, `npm run preview`, `PLAYWRIGHT_BROWSERS_PATH=/tmp/gps-playwright npm run test:e2e`, and `PLAYWRIGHT_BROWSERS_PATH=/tmp/gps-playwright npm run test:e2e:compat` failed on `listen EPERM 127.0.0.1:5173`, with no browser tests executed. Standard npm setup and `PLAYWRIGHT_BROWSERS_PATH=/tmp/gps-playwright npx playwright install chromium` failed DNS. Exact commands, workaround limits, and not-run checks are in `VERIFICATION.md`.

**Manual method/limits:** Native Firefox 156.0.1 opened a temporary inline copy of the built bundle because the supported server could not bind. Readability, steering, braking to 0 km/h, coasting, full-loop motion, P/Escape, focus-return pause, and 960×720 resize were observed. This is useful gameplay evidence but does not substitute for README/local-origin launch or the Chromium suite. Native automation could not hold two non-modifier keys simultaneously; combined-input browser acceptance remains unverified. No full-release performance, compatibility, audio, race, or persistence claims are made.

**Tuning/assumptions:** Provisional maximum 84 m/s (302.4 km/h), acceleration 18 m/s², braking 38 m/s², coasting drag 5 m/s², 250 ms exceptional-frame cutoff, 960×540 rendering. Pixel-aligned road strips fix curb-color hairlines; wrapped scenery indexes keep artwork identical across loops. M1's ±12 m verge clamp is provisional containment; meaningful corner load/off-road/contact behavior stays in M2. No new product scope or architecture departure.

**Next concrete step:** Resume M1; follow README on the documented origin with permitted local server/browser execution, finish the primary browser and local-origin manual checks above, fix any defects, and update this ledger. Only after all M1 acceptance evidence passes may M1 be marked complete. Stop at that boundary and leave M2 for a later authorized session.

### 2026-10-31 — M1 resumed and completed

**Selected milestone:** M1, dependencies none. **Result: complete.** The existing driving implementation was retained; no M2 gameplay was added. The workspace was clean at the start of this session. No commits, staging, or other version-control mutations were made; `SPEC.md` is unchanged.

**Changes:** Strengthened `tests/e2e/smoke.spec.ts`: console errors now fail the launch audit; a deterministic real-keyboard test checks all four steering aliases by reading visible road displacement while acceleration continues, both brake aliases to rest, coasting, and both throttle aliases. No test-only game API or production fixture was added. Updated `PROGRESS.md`, `VERIFICATION.md`, README, implementation notes, and guidance/architecture status to replace the prior blockers with executed evidence. No tuning or architecture changes were necessary.

**Acceptance evidence:**

| M1 criterion | Completion evidence |
| --- | --- |
| Documented local setup/launch; no backend/CDN | Standard `npm ci` installed 133 packages; `npm run dev` and `npm run preview` each served `http://127.0.0.1:5173`. Browser audit on both servers reported no external HTTP requests, console errors, or uncaught errors. |
| Start/Enter, throttle/brake/steer and simultaneous inputs | Four Chromium tests pass on development and static preview. The added test asserts road movement in the proper direction for A/D/Left/Right while speed rises, W/Up acceleration, S/Down stopping, and released-throttle deceleration. Native Enter and pointer Start also work. |
| Chase perspective, moving detail, car silhouette | Native Chrome 156.0.8078.74 local-origin review shows road narrowing, visible bends, roadside detail progression, four exposed tires/body/wing, and a convincing chase view. Driving responds promptly. |
| Coasting, speed-sensitive steering, continuous seam | Existing physics/projection/seam tests pass; native drive reached 2449 m, continued beyond 3151 m on the 1500 m provisional loop, and braked to 0 km/h. 302 km/h cap and coasting observed. No load or seam discontinuity was observed. |
| Pause/focus/rebase/frame independence | Browser tests verify held-key blur cleanup, explicit resume, frozen paused distance, and a 5 s exceptional gap without advancement. Native tab switch returned paused at 3183 m / 120 km/h; responsive resize preserved the drive. Existing exact 1200-tick equivalence at 30/60/120/144 Hz passes. |
| Required automated and manual checks | Typecheck, lint, 23/23 logic tests, build, 4/4 Chromium tests on development and production, plus 3/3 compatibility smoke tests pass. Native desktop and 960×720 menu/HUD/pause review passes. |

**Commands/results:** `npx playwright install chromium` and `npx playwright install firefox webkit` now succeed with permitted execution. `npm run test:e2e`: 4/4 passed with Playwright-managed dev startup (3.6 s), then 4/4 against an already-running `npm run preview` (3.1 s). `npm run test:e2e:compat`: 3/3 passed on Chromium, Firefox, and WebKit (8.8 s). `npm ci` passed using the README command; subsequent typecheck/lint/23 tests/build passed. Static output remains HTML 2.79 kB / CSS 3.71 kB / JS 9.70 kB. `git diff --check` passed. Full command evidence and environment are in `VERIFICATION.md`.

**Manual method/limits:** Native Chrome loaded the documented HTTP origin, first from Vite dev and then static preview. Drove the loop, steered in both directions, braked/coasted, paused with P/Escape, resumed with Enter/button, switched tabs, resized to 960×720, and inspected menu/HUD/pause readability and original artwork. Native key automation is supplemented by real simultaneous-key Playwright coverage. This accepts the M1 slice only; no full-race, final braking/collision feel, sound, persistence, or release-performance claims are made.

**Resolved blockers / known issue:** The prior default-sandbox bind and download failures were resolved using permitted elevated execution, with the same application commands and origin; no product workaround was introduced. Standard install emits the existing optional fsevents script warning and 11 moderate development-tool findings caused by minimatch advisory GHSA-g3hv-75wg-m249. `npm audit --json` exits 1; `npm audit --omit=dev` passes with zero findings. This affects development glob processing and is not in the production bundle. Review compatible patched lint dependencies when available; do not apply npm's suggested breaking downgrades blindly.

**Next concrete step:** Stop here. In the next authorized session select M2 (M1 prerequisite now complete), read the handoff and frozen specification, and implement only M2. Leave these changes for the user's review and commit.
