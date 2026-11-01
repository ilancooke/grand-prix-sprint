# Grand Prix Sprint — Coding Agent Guidance

## Product authority and current status

- Read the entire `SPEC.md` (version 1.0) before implementation. It is the authoritative, frozen specification; do not edit or replace it.
- Read `ARCHITECTURE.md`, `ROADMAP.md`, and `PROGRESS.md`. Preserve their requirement coverage and recorded assumptions. The specification wins over a conflicting plan; `PROGRESS.md` records current implementation status.
- The planning phase established documents only. Do not treat proposed paths or commands as existing implementation; consult `PROGRESS.md` and the workspace for the current verified state.
- Begin implementation only in response to a user request authorizing it. Once authorized, make routine engineering decisions autonomously within the selected milestone; no separate approval is needed for ordinary reversible implementation steps.
- Deliver one original desktop-browser pseudo-3D arcade racer, one circuit, exactly three AI opponents, three laps, complete UI/audio/replay/persistence. Do not add unrelated features. Do not require backend services, credentials, paid services, external APIs, or mandatory hosted runtime dependencies.

## One-milestone session boundary

- Unless the user explicitly requests otherwise, implement exactly one milestone per session: the first milestone in `ROADMAP.md` not marked `complete` in `PROGRESS.md`. Resume an `in progress` milestone rather than skipping it. Confirm its dependencies are complete before starting.
- After implementing that milestone, run its required verification, update the progress ledger and relevant documentation, summarize the handoff, and stop. Do not begin the next milestone, even if time or context remains.
- If the session ends before all acceptance criteria are verified, leave the milestone `in progress`, record the remaining work and blockers, and stop without claiming completion. Missing required manual verification also leaves it unfinished.
- The user reviews and commits changes between sessions. Do not create commits, stage changes, push, or otherwise perform version-control mutations unless explicitly requested. Leave implementation and handoff documents ready for the user's commit.
- If all milestones are complete, report that status and stop; do not invent another milestone.

## Architecture and coding conventions

- Use strict TypeScript ES modules, Canvas 2D rendering, ordinary HTML/CSS UI, Web Audio synthesis, and a safe `localStorage` adapter. Keep dependencies minimal; do not add a UI/game/physics framework without a concrete need and a documented decision.
- Core modules under `src/game/` must not import DOM, rendering, audio, storage, animation, or wall-clock APIs. Use explicit state, configuration, input, and timestep arguments. Expose read-only snapshots to renderers.
- Use a 60 Hz fixed simulation tick, integer ticks as the clock base, and interpolation for rendering. Derive lap/finish timestamps using the same deterministic within-tick crossing fraction for times and finish ordering. Never base motion on frame count or silently advance a background-tab gap. Blur/hidden/exceptional stalls pause, clear held input, and rebase the loop; explicit resume preserves state.
- Keep longitudinal position unwrapped; wrap only for lookup/rendering. Use consistent world meters/seconds and descriptive unit-bearing names where ambiguity is possible. HUD speed is km/h.
- Centralize named handling, collision, AI, and race constants. Prefer small functions and explicit state types/discriminated phases. Avoid `any`, shared mutable global state, generic event buses, ECS, premature caching, and unrelated abstractions.
- Player and AI share motion/collision rules. AI gets deterministic profile differences and safe passing behavior, never teleports or scripted progress. Introduce seeded randomness only if actually needed.
- Initial grid-to-start crossing arms the first circuit. Ordered forward gates validate laps; skipped/reverse/duplicate/discontinuous progress must not award lap or ranking credit. Off-road itself is not an invented lap-invalidating rule. Compute all car crossings before freezing player results.
- Use ordered finish events and lawful circuit progress for standings. UI displays authoritative simulation values, not separately derived clocks or standings.
- Collision penalties must be bounded and recoverable. Do not move a car longitudinally to recover it. Check seam contacts and tunneling bounds; cooldowns do not replace physical separation.
- Use synchronous gameplay events to trigger adapters. Lazy-start audio from a user gesture, provide mute, and clean up on pause/replay. Persist only valid completed player laps; keep personal record and race best distinct.
- Prefer original procedural art and synthesized sound. Bundle any necessary asset locally and record provenance/license. No runtime CDNs, external fonts, analytics, or API calls.
- Follow established formatting once configuration exists. Name behavior clearly, use comments to explain non-obvious math/rules, and keep tuning decisions separate from mechanics. Do not introduce test-only public globals or ship test fixtures in the production build.

## Build and test commands

M1–M5 are complete: use Node.js 24 LTS and npm 11; tested Node 24.18.0 / npm 11.16.0 on macOS ARM64. Exact dependency versions are pinned in `package.json` and the lockfile; `.nvmrc` records Node. M5 typecheck/lint, 126 logic tests, build, 12 Chromium tests and 6 compatibility checks on both dev and preview, saved-before-finish/reload/replay/slower-lap/denied-storage coverage, three-size UI capture review and native menu/Enter/countdown/driving/pause review pass. Three repeated preview stall checks pass after freezing the test clock during protocol calls. M4's exact full-race schedules at 30/60/120/144 Hz and native full-race evidence, plus M3's repeated ten-full-traversal traffic evidence, remain intact. M1 verified standard `npm ci`; M2–M5 changed no dependencies. Earlier default-sandbox port/DNS failures were resolved through permitted execution with unchanged project commands. M1's audit reported 11 moderate development-tool findings from one minimatch advisory and zero production findings; not rerun in M2–M5. See `VERIFICATION.md`. The next authorized session selects M6; do not start it during M5 closeout.

| Command | Intended use |
| --- | --- |
| `npm install` | Install declared dependencies and update the lockfile; M1 bootstrap verified with `--offline --cache .npm-cache --no-audit --no-fund`. |
| `npm ci` | Reproducible setup; standard command and offline cache setup verified. |
| `npm run dev` | Start local Vite development server. |
| `npm run typecheck` | Run TypeScript checking without emission. |
| `npm run lint` | Run the minimal ESLint correctness checks. |
| `npm test` | Run Vitest unit/integration tests once, without watch mode. |
| `npm run test:watch` | Optional interactive Vitest watch mode. |
| `npm run build` | Produce the static production bundle. |
| `npm run preview` | Serve the production build locally. |
| `npx playwright install chromium` | One-time setup for the primary local browser-test target. |
| `npm run test:e2e` | Run the primary Chromium browser suite using Playwright-managed local server startup. |
| `npx playwright install firefox webkit` | Additional browser setup for compatibility verification. |
| `npm run test:e2e:compat` | Run designated Chromium/Firefox/WebKit compatibility smoke tests. |

Host/port settings live only in `config/server.ts`; the documented development/test/preview origin is `http://127.0.0.1:5173`. Keep that origin for future persistent-record checks. Browser downloads are development setup; the game runtime remains self-contained apart from its local static server. Full browser compatibility verification is deferred to its planned milestones; configured scripts alone are not evidence of passing checks.

## Milestone execution and verification

1. Use the milestone status table in `PROGRESS.md` to select the first unfinished milestone in `ROADMAP.md`; mark it `in progress` when work begins. M1 must contain a playable driving slice, not only scaffolding.
2. Work within that milestone and prerequisites. Keep the application runnable after each milestone; do not leave placeholder required-path controls or mark incomplete features complete.
3. Add meaningful tests as behavior is added: physics/track in M1–M2; traffic in M3; race legality/timing in M4; persistence/UI in M5; audio lifecycle in M6. Keep high-volume deterministic coverage in pure simulation tests and a small browser suite for actual integration.
4. Run affected tests during work. At milestone completion, run typecheck, lint, unit/integration tests, build, and relevant browser tests once those commands exist. Record unsupported/unavailable checks explicitly and resolve missing required evidence before claiming completion.
5. Verify the milestone's manual criteria too: controls, pseudo-3D readability, braking reward, overtaking, collision recovery, sound quality, and complete-race feel cannot be established by unit tests alone.
6. Compare equal tick-indexed input schedules across different render rates; test pause/focus and grid/seam boundaries. Use float tolerances for calculations and exact tick assertions for clocks.
7. Re-run affected checks after fixes or tuning. Broaden testing when a failure or unresolved concern justifies it; avoid repeated broad runs without changes.
8. Mark completion only when all acceptance criteria are satisfied with evidence. M7 must reconcile every row of the specification map and all ten Definition of Done actions.
9. Finish the handoff record and stop at the session boundary. Completing a milestone does not authorize starting another in the same session.

No deployment, account creation, hosted service, or public publishing is needed. Do not alter the product scope to bypass a hard requirement. Document ambiguities and use the assumptions in `ARCHITECTURE.md`; ask the user only if a conflict fundamentally changes scope or makes compliance impossible.

## Continuity between implementation sessions

- `PROGRESS.md` is the single completion ledger. It starts with every milestone `pending`; use only `pending`, `in progress`, and `complete`. Keep a status row for M1–M7 in roadmap order and at most one milestone `in progress`. If the file is absent, initialize it before implementation and reconcile any existing work against acceptance evidence rather than guessing completion.
- Before coding in each fresh session, read the ledger with the specification, architecture, roadmap, this file, and relevant code/tests. Inspect workspace status and preserve unrelated user changes; this planning workspace was not initially a Git repository. A previous conversation or a commit message is not a substitute for the repository handoff record.
- Record the current milestone, acceptance criteria with completion evidence, changed modules, exact commands/results, manual checks, remaining failures, tuning evidence, assumptions, and the next concrete step. Distinguish planned work, passing checks, failing checks, and checks not run. Keep concise evidence for completed milestones so later sessions can verify their prerequisites. Do not store credentials or private machine data.
- Update `PROGRESS.md` in the same working changes as the implementation, ready for the user to commit them together. Do not mark work complete merely because it was committed; completion requires the milestone's acceptance evidence.
- After meaningful architecture changes, update `ARCHITECTURE.md` and affected roadmap entries/mapping while preserving the frozen requirements. Record the reason; avoid rebuilding plans around unrelated ideas.
- Maintain README commands and controls as soon as implemented. At handoff, keep `IMPLEMENTATION_NOTES.md` concise and accurate and consolidate release evidence in `VERIFICATION.md`.
- End each session with what changed, what was verified, what remains, and any real blocker. Never claim tests passed without execution or a milestone complete without its acceptance evidence.
