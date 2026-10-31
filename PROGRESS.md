# Grand Prix Sprint — Implementation Progress

## Current handoff

- **Phase:** M3 complete; session boundary reached. M4–M7 remain pending.
- **Selected milestone:** M3 — Three functioning opponents and overtaking. Dependencies M1 and M2 are complete.
- **Next concrete step:** In the next authorized session, select M4: add the separate grid/countdown, ordered-gate legality, authoritative clocks/standings, three-lap results and replay. Do not begin M4 during M3 closeout.
- **Implementation verification:** Typecheck, lint, 61 logic tests, build, 6 Chromium tests on development and static preview, and 3 compatibility smoke tests on both pass. Ten full traversals per AI repeat exactly with zero contacts/off-road ticks; native Chrome traffic/passing/contact/recovery review passes. See `VERIFICATION.md`.
- **Remaining issues:** No M3 acceptance blocker. This remains free driving with traffic; formal valid laps/ranking, race flow/results/replay, persistence, audio and release performance remain M4–M7. Dependencies are unchanged; the prior 11 moderate development-only minimatch findings were not re-audited.

## Milestone status

This is the single completion ledger. Use `pending`, `in progress`, or `complete`; keep at most one milestone `in progress`. Select the first unfinished milestone in roadmap order. Mark it complete only after all its acceptance criteria and required verification have evidence. Stop after that milestone and leave changes for the user to review and commit.

| Milestone | Outcome | Status | Evidence |
| --- | --- | --- | --- |
| M1 | Playable chase-view driving slice | complete | Standard setup/dev/preview pass; typecheck/lint/build, 23 logic tests, 4 Chromium tests on dev and preview, 3 compatibility smoke tests, and native Chrome local-origin driving/resize/interruption review pass. |
| M2 | Complete circuit, meaningful handling, and recoverable collisions | complete | Final 2000 m circuit; braking comparison, recovery/seam/sweep fixtures; 42 logic tests, typecheck/lint/build, 5 Chromium tests on dev/preview, 3 compatibility smoke tests, and native full-loop/contact review pass. |
| M3 | Three functioning opponents and overtaking | complete | Three shared-physics profiles; repeated ten-traversal traffic run, passing/blocked/contact regressions; 61 logic tests, type/lint/build, 6 Chromium + 3 compatibility tests on dev/preview, native traffic review. |
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

### 2026-10-31 — M2 implemented and completed

**Selected milestone:** M2, dependency M1 verified complete from its recorded acceptance evidence. **Result: complete.** M3–M7 were not started. Workspace was clean on initial permitted Git inspection; no unrelated changes were present. No commits/staging/push or other version-control mutations were made. `SPEC.md`, package pins and lockfile are unchanged.

**Changes:** Finalized Harbor Loop at 2000 m / 400 segments, five eased bends, multiple wide passing straights, a tight Anchor hairpin, checkered start line, outer boundaries, original location signs/grandstands and three explicit collidable tire stacks. Added curvature/speed-squared outward drift, grass drag/reduced steering grip, bounded barrier/obstacle responses and open-side pinch recovery. Added swept two-axis, wrapped-seam world contacts and generic car-pair contact fixtures for M3. Motion/simulation now take the track explicitly. The chase camera follows 7 m behind the physical player station. Updated README, architecture, guidance, notes and verification evidence.

**Changed modules:** `src/content/circuit.ts`, `src/game/{types,config,track,vehicle,simulate,collisions}.ts`, `src/render/{renderer,art,projection}.ts`, the controller call site and free-drive menu copy. New `tests/unit/{handling,collisions}.test.ts`, affected existing motion/clock/render tests, and an added keyboard both-verge browser test. No production fixture/global or new dependency was introduced.

| M2 criterion | Completion evidence |
| --- | --- |
| Original continuous circuit, straights, ≥4 bends/both signs, challenging turn, visible line/scenery/boundaries | Five named eased bends and a straight periodic seam; native full drive crossed 2000 m and continued to 2284 m. Original line, signs, stands, tire stacks and moving decoration reviewed. Periodic render-command tests include the new art. |
| At least two passing sections | 14 m road with 300 m Pit, 200 m Quay and 220 m Coast straights; geometry/width assertions pass. Actual traffic passing stays in M3. |
| Braking beats excessive-speed corner entry | Same steering policy over 650–1000 m: braked **340 ticks / 81.633 m/s exit**, no off-road/contact; full throttle **349 ticks / 62.417 m/s exit**, 104 off-road ticks and one barrier. Native hairpin/braking review confirms outward load and useful speed reduction. |
| Reduced off-road grip/speed; continued recovery | Both-sign pure fixtures and real keyboard browser checks pass. Native deliberate excursions/rejoins and tire/barrier recovery continue without reset. |
| Noticeable, bounded contacts; no trapping; seam/tunneling | Entry-only speed loss with always-active lateral separation. Tire impact observed 60→45 km/h followed by 209 km/h recovery; fast right-barrier run recovered 77→152 km/h. Unit fixtures cover sustained barriers, initial overlap, obstacle/barrier pinch, swept maximum-speed contacts and multiple unwrapped seam crossings; station remains untouched. |
| M1 slice and checks retained | All aliases/simultaneous input, brake/coast, focus/held-key cleanup, stall/rebase, resize and local-only launch checks pass. Exact 1200-tick equivalence at 30/60/120/144 Hz now uses final M2 handling/contacts. |

**Commands/results:** `npm run dev` served the documented origin for manual and browser review. `npm test -- --reporter=verbose tests/unit/handling.test.ts tests/unit/collisions.test.ts`: 19/19 passed with comparison metrics. Final `npm run typecheck`, `npm run lint`, `npm test` (**42/42**, 7 files), `npm run build`, and `git diff --check` pass. Build: HTML 2.79 kB / CSS 3.71 kB / JS 14.46 kB. `npm run test:e2e`: **5/5** on dev (5.6 s), then **5/5** on static `npm run preview` (5.6 s). `npm run test:e2e:compat`: **3/3** Chromium/Firefox/WebKit smoke on dev (4.1 s), repeated on final preview (3.9 s). Network/console audit passes; no external runtime dependency found. Normal npm setup was already verified in M1 and was not repeated because dependencies did not change.

**Manual method/limits:** Native Chrome on `http://127.0.0.1:5173`, actual keys and visible HUD/Canvas, reviewed every bend and seam, both surface departures/rejoins, braking to rest, shoulder tires, a fast barrier approach, recovery at low/high speeds and pause/resume. Road width, surface/verge contrast and scenery locations remain legible. Native multi-key holding is limited; Playwright supplies genuine simultaneous-input coverage, while the pure corner scenario supplies precise repeatable comparison. No complete-race, sound or release-performance acceptance is claimed.

**Tuning/fixes:** Initial weaker hairpin/grass drag let full throttle win despite off-road drift; the failed comparison drove final peak Anchor curvature −0.0095/m and extra off-road drag `6 + 0.7 × speed` m/s². Steering grip on grass is 55%; barriers retain 72% speed, obstacles 65%, generic pair entry 85%. No scripted curve speed cap. Fixed the obstacle/barrier pinch, moved decorative signs/stands beyond the barrier, narrowed the initially overlong start stripe, made the rendered-road test sample actual asphalt colors instead of also counting new barriers, and corrected a TypeScript key-tuple inference error. Affected checks were rerun; no unresolved failures remain. No new product assumption or scope change.

**Remaining work / next step:** Stop after M2 and leave changes ready for the user's commit. In a new authorized session begin M3, integrate pair resolution once per unordered pair alongside world contacts, add exactly three deterministic AI profiles, and verify overtaking/blocked lanes/long-run circulation. No M3 behavior has been added.


### 2026-10-31 — M3 implemented and completed

**Selected milestone:** M3, dependency M2 verified complete from the ledger and recorded evidence. **Result: complete.** M4–M7 were not started. Initial worktree was clean; no commits, staging, push or other version-control mutations occurred. `SPEC.md`, dependency pins and lockfile are unchanged.

**Changes:** Exactly three deterministic opponents (cyan Azure, yellow Gold, purple Violet), shared motion with small acceleration/cap differences, curvature/braking lookahead, corner-load countersteering, safe lane selection and crossing/rear checks, 120-tick passing commitment, following/braking, and physical off-road/close-queue recovery. Every AI decision reads the same prior snapshot. All four cars use shared world/pair contacts; pair responses run once per unordered pair, followed by world constraints and a lateral-only free-space separation pass for crowded contacts. Synchronous impact records support traffic measurements and later adapters. Opponent positions interpolate unwrapped and render at projected road depth with distinct original palettes. The current UI explicitly remains free driving, without M4 rules.

**Changed modules:** New `src/game/ai.ts`, `src/content/opponents.ts`, `tests/unit/ai.test.ts`, and `tests/integration/traffic.test.ts`; extended simulation/types/config/shared vehicle/contacts, renderer/art/controller, traffic menu copy, collision/render/browser tests, and Vitest integration discovery. Updated README, architecture, guidance, notes and verification. No dependency or test-only production API was added.

| M3 criterion | Completion evidence |
| --- | --- |
| Exactly three distinct, continuously moving rivals; braking/straight acceleration | Three creation/profile assertions, curvature/braking-distance tests, real rendered-palette motion test and native driving review. Each AI covers ten full 2000 m traversals from its own initial station. |
| Small observable performance differences; no teleports | Caps 78/75/81 m/s, acceleration 17/16/18 m/s², corner drift budgets 6.6/6.2/7 m/s. Warm traversal times approximately 27.084 / 28.383 / 26.146 s. Every long-run tick asserts nonnegative displacement ≤84/60 m. |
| AI passes AI/player; player passes AI; blocked lanes follow then release | Real shared-simulation scenarios pass in both directions, including three blocked lanes, a newly opened lane, safe side-by-side running and a close stopped queue. Lane safety rejects occupied destinations, fast rear approaches, crossing alongside and premature cutback, including the seam. |
| Bounded visible contacts and continued racing | Seam impact/recovery and 600-tick four-car pileup regressions preserve stations and prohibit endpoint penetration. Sustained inward steering for 120 ticks applies only one entry speed loss. Native close contact around 368–390 m remained at 273–278 km/h, then recovered to 294–298 km/h by 610–629 m and continued. |
| Repeated long-run evidence and regression bounds | Two exactly equal runs, ≥20 km per AI, zero car/barrier/obstacle impacts and zero off-road ticks. All 30 traversal times are recorded in `VERIFICATION.md`; measured max 30.729 s supports a <32 s bound and zero-contact/off-road bounds for this specific scenario. |
| Prior checks and traffic playability | Typecheck/lint, 61/61 tests, production build, 6/6 Chromium on dev and preview, and 3/3 Chromium/Firefox/WebKit smoke on both pass. Equal 1200-tick input schedules at 30/60/120/144 Hz now compare all four cars and AI memory. Native behind/beside/through-field driving, passing, braking, contact recovery and pause review passes. |

**Commands/results:** `npm test -- --reporter=verbose tests/unit/ai.test.ts tests/integration/traffic.test.ts` used during tuning; final `npm test -- --reporter=verbose tests/integration/traffic.test.ts` passed **8/8** and printed all traversal/contact metrics. Final `npm run typecheck`, `npm run lint`, `npm test` (**61/61**, 9 files), and `npm run build` pass. Static output: HTML **2.78 kB**, CSS **3.71 kB**, JS **22.98 kB**. `npm run dev` and `npm run preview` served the unchanged documented origin. Final `npm run test:e2e`: **6/6**, static preview 5.8 s and managed dev 6.2 s; `npm run test:e2e:compat`: **3/3**, preview 4.0 s and managed dev 4.4 s. Runtime network/console audit passes. `git diff --check` and source/dependency-scope inspection pass. Setup/install/audit were not repeated because dependencies did not change.

**Manual method and tuning:** Native Chrome on `http://127.0.0.1:5173`, actual Start/W/A/D/S/P controls and Canvas/HUD. Reviewed cyan/yellow/purple separation, approach depth, close side-by-side silhouettes, player passing, AI passing back after braking, and continued response after contact. At 368–390 m the field ran close alongside; subsequent steering/throttle continued to 629 m, and braking to 39–44 km/h around 716–720 m let Gold pass ahead again. Initial review found repeated speed losses from floating-point separation rounding; a named geometry tolerance and a 120-tick sustained-contact test fix it. A blocked-queue test found premature preferred-lane return and throttle deadband trapping: directional transit safety, enough following room, and bounded creep toward a clear lane resolve it. A four-car fixture exposed re-overlap after pair/world response, fixed by final lateral constraints. Initial test assumptions about profile caps/preferred lanes were corrected. A preview pixel test sampled before the first paused render; it now advances one render before comparing the frozen field. All affected checks pass after fixes.

**Limits / next step:** No M3 blocker remains. The 1200-tick frame-schedule checks retain exact clocks; long-run crossing times here measure physical traversal, not legal race laps (M4). Native multi-key automation is supplemented by actual simultaneous-key Playwright coverage. Audio, full-race feel, storage and measured release performance are unimplemented/unclaimed later work. Stop here; the next authorized session selects only M4.
