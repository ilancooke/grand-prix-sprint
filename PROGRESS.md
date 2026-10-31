# Grand Prix Sprint — Implementation Progress

## Current handoff

- **Phase:** M1 driving slice implemented; required local-origin browser verification blocked.
- **Selected milestone:** M1 — Playable chase-view driving slice. No dependencies.
- **Next concrete step:** Resume M1 in an environment permitted to bind `127.0.0.1:5173`; run README launch/preview and Chromium smoke checks, finish local-origin manual verification, and resolve any failures before marking complete. Do not start M2.
- **Implementation verification:** Typecheck, lint, 23 logic tests, build, and reproducible offline installation pass. Native Firefox driving/visual checks pass with the limitations below. Full evidence: `VERIFICATION.md`.
- **Blockers:** Sandbox port binding fails with `listen EPERM`; Playwright's managed server therefore cannot start. Ordinary npm/Playwright downloads also fail DNS; dependencies were installed from an integrity-checked local cache, but standard browser installation remains unverified.

## Milestone status

This is the single completion ledger. Use `pending`, `in progress`, or `complete`; keep at most one milestone `in progress`. Select the first unfinished milestone in roadmap order. Mark it complete only after all its acceptance criteria and required verification have evidence. Stop after that milestone and leave changes for the user to review and commit.

| Milestone | Outcome | Status | Evidence |
| --- | --- | --- | --- |
| M1 | Playable chase-view driving slice | in progress | Slice implemented; typecheck/lint/build and 23 tests pass; native Firefox full-loop/input/pause/resize review performed. Required local-server and Chromium checks blocked by `listen EPERM`. |
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
