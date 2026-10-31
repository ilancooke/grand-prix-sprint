# Grand Prix Sprint — Implementation Roadmap

## Planning baseline

`SPEC.md` is the authoritative, frozen version 1.0 specification. Do not modify it. Architecture and assumptions are in `ARCHITECTURE.md`. This roadmap plans implementation only; none of the milestones has been started by this planning session.

Use seven sequential milestones. Tests accompany every milestone. Each milestone leaves the local application runnable; early milestones provide a working incremental game, while the complete required product is accepted only after milestone 7. Do not spend an initial milestone on tooling alone. File paths below are expected modules and may be consolidated without changing behavior or architectural boundaries.

Implementation uses one milestone per session. `PROGRESS.md` is the completion ledger; select the first milestone below not marked `complete`, resuming it if already `in progress`. After its implementation, verification, and handoff update, stop without starting another milestone. The user commits the changes and starts the next session with fresh context.

| Milestone | Outcome | Depends on |
| --- | --- | --- |
| M1 | Playable chase-view driving slice | None |
| M2 | Complete circuit, meaningful handling, and recoverable collisions | M1 |
| M3 | Three functioning opponents and overtaking | M2 |
| M4 | Valid three-lap race, correct standings, pause, and replay | M3 |
| M5 | Complete readable UI and persistent personal best | M4 |
| M6 | Finished retro presentation and original racing audio | M5 |
| M7 | Integrated release verification and complete handoff | M6 |

## M1 — Playable driving first

**Goal:** Launch locally and drive a recognizable open-wheel car through a moving, curved pseudo-3D chase view.

**Scope:** Establish only the tooling needed for this slice: TypeScript, Vite, unit testing, type/lint checks, and a minimal Playwright smoke test. Build the fixed-step loop, keyboard-held inputs and aliases, unwrapped track coordinates, basic periodic road segments, projection, a player car, gradual acceleration, maximum speed, brake, drag, and initial speed-sensitive steering. Include initial road/verge contrast and enough moving track detail to judge speed. Add a simple Start control/Enter action and a pause indicator. Handle focus loss and key clearing from the beginning, even before formal race rules exist.

**Deliverables:** `package.json` and lockfile; TypeScript/Vite/Vitest/Playwright/lint configuration; `index.html`; `src/main.ts`; initial `src/game/{types,config,track,vehicle,simulate}.ts`; `src/content/circuit.ts`; `src/platform/{input,loop}.ts`; `src/render/{projection,renderer,art}.ts`; minimal `src/ui/screens.ts` and CSS; relevant `tests/unit/` plus `tests/e2e/smoke.spec.ts`; starter `README.md` with actual setup/run/test commands.

**Dependencies:** None. Tool configuration and gameplay are delivered together.

**Acceptance criteria:**

- The documented local command launches a browser game with no backend or runtime CDN requests.
- Start/Enter begins driving. W/Up accelerates gradually to a cap; S/Down brakes; A/Left and D/Right steer, including simultaneous acceleration and steering.
- The camera is behind the player. Road width narrows with distance, at least one bend is visible, roadside detail moves, and the car shows exposed wheels, bodywork, and a rear wing.
- Releasing accelerate slows the car. Steering effect changes with speed. The provisional circuit loops without a loading screen or seam jump.
- Escape/P pauses/resumes; blur/hidden pauses, clears input, and resumes without integrating the missing wall time. Frame rate does not scale simulated speed.
- Type checking, lint, unit tests, build, and the browser launch/input smoke check pass.

**Verification:** Unit-test projection and modulo math, acceleration/cap/brake/drag/steering, aliases and held keys, and fixed-step behavior under 30/60/120/144 Hz schedules. Browser-smoke Start/Enter and combined steering/throttle. Manually drive a full loop, resize, pause, and switch tabs. Record whether the chase illusion and input response are convincing before adding more systems.

**Risks:** Projection seams and draw order can undermine the entire presentation; isolate projection math. Tooling can consume the slice; limit setup to commands needed to run and verify gameplay. Keep tuning constants explicit so the provisional handling can be refined in M2.

## M2 — Final circuit and meaningful driving

**Goal:** Make one complete original circuit enjoyable to drive, with braking decisions, clear boundaries, and reliable recovery.

**Scope:** Finish the periodic circuit with multiple straights, at least four distinct corners containing left and right turns, a tight corner requiring speed reduction, visible start/finish line, recognizable scenery locations, and road width for multiple passing opportunities. Tune outward corner load, grip, off-road drag, lateral boundaries, barrier/obstacle contacts, and recovery. Add selected visible collidable roadside obstacles; keep distant decoration non-collidable. Establish generic car contact handling and its fixtures for M3 without adding opponent behavior yet.

**Deliverables:** Finished `src/content/circuit.ts`; refined `src/game/{track,vehicle}.ts`; `src/game/collisions.ts`; road/curb/barrier/start-line/scenery rendering; handling and contact constants; circuit-validation, handling, and collision tests; short recorded handling observations.

**Dependencies:** M1.

**Acceptance criteria:**

- One original circuit loops continuously and visibly meets the straight/corner/start-line/scenery/boundary requirements.
- At least two sections offer enough width and length for cars to run side by side and pass in M3.
- A repeatable tight-corner approach at excessive speed produces outward drift and an off-track/contact penalty; a braked approach can negotiate the same section cleanly and with a better exit or section time.
- Off-track driving measurably reduces speed or grip. The player can return to the surface and continue after off-road, obstacle, or barrier contact without resetting the page or teleporting forward.
- Contacts are noticeable, bounded, and do not trap the car in repeated penalties. Road/car collision math works at the circuit seam.
- The M1 driving slice and its checks still work.

**Verification:** Unit-test curvature direction, speed-dependent corner load, off-road penalties, barrier and obstacle recovery, seam overlap, and maximum-speed contact detection. Run deterministic full-throttle versus braked corner scenarios. Manually drive every corner, intentionally leave the track on both sides, strike an obstacle/barrier, and recover at low and high speed. Inspect the full-loop scenery and road seam.

**Risks:** Arbitrary penalties may feel unfair; connect them visibly to curve load/contact and tune with driving. Overly narrow roads would obstruct M3 overtaking. Collision overlap can cause oscillation or tunneling; validate movement bounds and use sweep/substeps only where needed.

## M3 — Three opponents and traffic

**Goal:** Race alongside exactly three independent, credible AI cars that can pass and be passed.

**Scope:** Add three distinct visual palettes and slightly different performance profiles. Implement curvature/braking lookahead, straight acceleration, lane tracking, slower-car following, safe passing-lane selection, passing commitment/hysteresis, and off-road recovery using shared vehicle physics. Integrate car-to-car collision response. Preserve actual continuous progress for all four cars; formal lap/ranking legality is completed in M4.

**Deliverables:** `src/game/ai.ts`; AI profile data; four-car simulation/rendering; completed car-to-car contacts; unit and deterministic traffic integration tests; recorded multi-lap AI observations.

**Dependencies:** M2.

**Acceptance criteria:**

- Exactly three distinguishable AI cars continuously circulate, slow before corners, and accelerate on straights.
- Small profile differences produce observably different performance with no scripted position jumps or hidden teleport recovery.
- A faster AI can pass a slower car on an open straight; the player can pass an AI and an AI can pass the player. Blocked lanes cause following/braking rather than permanent overlap.
- Car contacts apply bounded, visible responses and allow continued racing.
- In a deterministic run spanning at least ten circuit traversals per AI, each completes all traversals without permanent stalls or constant barrier collisions. Record contact counts and traversal times; use the evidence to tune a meaningful regression bound instead of inventing a universal collision rate.
- All prior checks pass and the game remains playable with traffic.

**Verification:** Unit-test corner speed lookahead, braking distance, profile differences, lane safety, and lane commitment. Integrate blocked-lane, passing, side-by-side, off-road recovery, and seam-contact scenarios. Run a long deterministic simulation twice and compare outcomes. Manually drive behind, beside, and through the field to judge overtaking and fairness.

**Risks:** Lane oscillation, late braking, repeated contact, and indistinguishable profiles. Use a few candidate lanes, speed lookahead, bounded performance differences, and common physics; avoid machine learning or full racing-line optimization.

## M4 — Complete and correct race loop

**Goal:** Run a complete three-lap race with legitimate progress, correct results, pausing, and replay.

**Scope:** Implement menu/countdown/racing/paused/results transitions; a four-car grid; exact three-second countdown; gate-based lap validity; lap/current/best/total timing; actual-progress standings; finish ordering; player finish after lap three; frozen results; replay reset. Connect minimal functional HUD and screens so all rules are observable. Extend pause/interruption behavior to countdown and every race clock. Use the initial start crossing only to arm each car's first circuit, not to award a lap.

**Deliverables:** `src/game/race.ts`; authoritative race state and tick/event logic; `src/app/controller.ts`; functional `src/ui/{screens,hud}.ts`; race-rule unit tests; full-race integration tests; browser race/replay and pause tests.

**Dependencies:** M3.

**Acceptance criteria:**

- All four cars begin in separate grid slots and remain stationary for 180 simulation ticks. Timing starts at GO.
- Initial grid-to-line crossing awards no lap. A completed lap requires a full correctly directed circuit with ordered gates; reverse crossings, skipped gates, duplicate crossings, finish-line oscillation, and discontinuous jumps do not award a lap or fraudulent rank.
- HUD exposes speed, lap 1/3–3/3, position /4, current lap time, and race best lap. Simulation also tracks total elapsed time.
- Rankings account for legitimate within-lap progress, completed laps, and already finished cars, including seam crossings and close finishes within one tick.
- The player's third valid lap immediately produces final position, total time, and best lap; a fourth player lap cannot begin. Results remain stable while displayed.
- Escape/P pauses/resumes countdown or racing without moving cars or advancing any relevant clock. Focus loss/long interruption follows the same visible-pause/rebase path.
- Replay starts a clean grid/countdown without refreshing the page, stale keys, old AI decisions, or carried race times.

**Verification:** Exhaustively test start arming, gates, skipped/reverse/duplicate/discontinuous crossings, legal off-road traversal, multi-car standings at the seam, AI finish order, fractional-tick finish ordering, exact countdown, lap/total times, and pause/resume. Run a deterministic three-lap player scenario and an AI-finishes-first scenario. Browser-test real pause controls and a bounded complete-race/replay flow through the input boundary. Manually complete a race.

**Risks:** Grid distance can create a false first lap; initial crossing only arms progression. Multiple clocks or standings calculated by the UI can disagree; use authoritative simulation state. Updates within a tick can bias results; process all crossing events before freezing results.

## M5 — Complete UI and durable best lap

**Goal:** Make the complete racing flow clear and keyboard-operable, with the player's record surviving reloads.

**Scope:** Finish coherent menu/HUD/pause/results styling and readable time/position formatting. Show all specified controls, title, Start Race, previous record when present, replay, and visible pause indicator. Make Enter confirm the focused action and keep driving keys from scrolling during play. Add versioned validated storage, personal-best updates after valid completed laps, and a graceful storage-failure path. Preserve layout on desktop viewport changes. Keep the race best and stored personal best labels unambiguous.

**Deliverables:** Finished `src/ui/{screens,hud}.ts` and `src/styles.css`; `src/platform/storage.ts`; record integration; storage/formatting tests; browser menu/HUD/reload/replay tests; updated README controls.

**Dependencies:** M4.

**Acceptance criteria:**

- Main menu displays title, Start Race, concise instructions for every specified key/alias, and a personal best only when one exists.
- HUD and pause/results screens remain readable without overlapping essential gameplay at documented desktop viewports.
- Results show final position, total time, best completed race lap, and replay. Enter works for start/confirm, and keyboard focus is visible on menu controls.
- A valid improved player lap becomes the stored personal record, including before that race finishes. Slower/invalid laps do not replace it.
- Reloading on the same origin retains the record; replay clears race state while retaining that record.
- Missing/corrupt/unsupported storage records are ignored safely. Denied writes leave the game playable with a session best and a concise saving-unavailable indication.

**Verification:** Unit-test time/position formatting and storage schema validation. Browser-test first launch, new record, slower lap, record before finish, reload, replay, corrupt data, and storage exceptions. Inspect menu, countdown, HUD, pause, and results at multiple desktop viewport sizes; exercise every key alias and Enter selection.

**Risks:** Persistence can accidentally use incomplete lap times, or two different best-lap concepts can confuse players. Save only validated lap events and label race versus personal records consistently. Browser policy can deny storage; test fallback without making persistence optional on ordinary browsers.

## M6 — Finished retro visuals and racing audio

**Goal:** Turn the complete racing loop into a coherent compact arcade game with original visuals and basic sound.

**Scope:** Finish the existing road/car/scenery artwork, consistent retro palette/typography, depth clipping, and distinct opponents. Add synthesized speed-responsive engine audio, countdown/start signal, collision/off-track feedback, finish cue, and a visible mute control. Unlock audio through a user gesture and integrate pause, focus loss, results, and replay cleanup. Keep all media original/programmatically generated or explicitly licensed and local.

**Deliverables:** Finished `src/render/{projection,renderer,art}.ts`; final local art/content; `src/platform/audio.ts`; mute UI; audio adapter tests and browser lifecycle checks; asset provenance notes in `IMPLEMENTATION_NOTES.md` (license file only if third-party assets are actually used).

**Dependencies:** M5.

**Acceptance criteria:**

- The view convincingly resembles a retro pseudo-3D chase racer; corners, trackside motion, start line, boundaries, and opponents remain legible through a full lap.
- Player art clearly exposes wheels, bodywork, and rear wing; opponent colors and silhouettes are distinguishable against scenery.
- Engine pitch/timbre audibly changes with speed. Countdown/start, impact or off-track feedback, and finish cues occur at the correct events.
- Audio starts only after an allowed interaction, mute works throughout the flow, pause/focus loss silences racing audio, and replay creates no duplicate engine/effect nodes.
- The game remains playable when Web Audio startup fails. No external media requests or unaccounted asset rights are introduced.

**Verification:** Test mapping from speed/events/mute/pause to audio adapter calls and verify cleanup across repeated replay. Browser-smoke user-gesture startup, mute, and context failure; manually listen to all cues and engine response because mocked audio tests cannot establish sound quality. Capture/review representative scenes and drive every corner with the finished art. Re-run the race and persistence regressions.

**Risks:** Autoplay policy, harsh engine sound, repeated-contact audio spam, poor contrast, or sprite draw-order bugs. Use gesture initialization, conservative gain, cooldowns, visual review, and local procedural media. Do not expand into music or additional effects beyond what supports the required feedback.

## M7 — Release verification and handoff

**Goal:** Deliver a complete, reproducible local game and evidence that the frozen specification is satisfied.

**Scope:** Close integration defects only; perform full acceptance, frame-rate independence, focus/stall/replay stress, browser compatibility, and representative-desktop performance checks. Validate the production build from the README in a clean install. Finish source/config/test handoff, limitations/known issues, and requirement verification records. Profile before optimizing; changes remain within the specified product.

**Deliverables:** Complete source, lockfile and build/test configuration; final `README.md`; `IMPLEMENTATION_NOTES.md`; `VERIFICATION.md` with commands, versions, machine/viewport, results, manual observations, and any limitations; completed requirement mapping; updated `AGENTS.md` with actual commands and continuity status.

**Dependencies:** M6 and all earlier milestones.

**Acceptance criteria:**

- A clean supported Node/npm environment can install, run, build, preview, and test using only the documented steps. Production output is static and requires no API, credentials, backend, paid service, or CDN.
- All type/lint, unit/integration, and designated browser tests pass. Chromium passes the full flow; Firefox and WebKit pass compatibility smoke checks, with Safari manual results recorded when available.
- At representative desktop settings, a complete race stays responsive and approximately meets the documented 60 fps target; record frame-time distribution and resolve recurring simulation/render stalls that compromise play.
- Equivalent tick-indexed races across 30/60/120/144 Hz render schedules have equivalent outcomes. Repeated focus loss, pause, resize, stall, and replay do not create time jumps, invalid laps, stuck keys, or growing audio/listener counts.
- Every specification item mapped below has recorded verification. No required-path placeholder remains, and no known issue prevents any of the ten Definition of Done actions.
- A manual tester can launch, start, drive, compete with three AI, brake/collide/recover, finish three legal laps, view correct results, replay, reload with their best lap retained, and run the tests.

**Verification:** Follow README from a clean dependency install, run the complete check suite, serve `dist` locally and inspect network/console, conduct one uninterrupted manual race plus deliberate recovery and interruption runs, and profile a named representative desktop. Record actual evidence and unresolved limitations; do not label required behavior complete based only on a plan or a screenshot.

**Risks:** Last-minute tuning may invalidate AI/race assumptions; rerun affected deterministic scenarios and the complete flow after changes. Hardware and browsers vary; report measured conditions and fix functional problems rather than claiming untested universal compatibility. Release hardening must not become a feature-expansion milestone.

## Specification-to-milestone mapping

This checklist follows every section of the frozen `SPEC.md`. M1–M6 provide implementation and local verification; M7 verifies the integrated release for every row. Grouped rows explicitly list all requirements in that group.

| Spec reference | Requirement coverage | Implementation / primary verification |
| --- | --- | --- |
| §1 | Original single-player Formula-style arcade game; responsive controls; retro pseudo-3D; opponents; complete three-lap experience; polished compact title | M1 driving/presentation; M3 opponents; M4 race; M5–M6 polish |
| §2.1–2.3 | Third-person chase camera; depth/motion/perspective illusion; visibly curving road and moving scenery | M1 projection/drive; M2 final circuit; M6 visual review |
| §2.4 | Recognizable open-wheel player car with wheels, bodywork, rear wing | M1 silhouette; M6 final art review |
| §2.5 | Visually distinct opponent cars | M3 palettes; M6 final review |
| §2.6 | Trackside details such as grass, curbs, barriers, signs, grandstands | M2 circuit detail; M6 art |
| §2.7 | Coherent retro aesthetic, clear typography, readable HUD | M5 UI; M6 final visual review |
| §2.8 | Racing surface distinguishable from off-track | M1 surface contrast; M2 boundaries; M6 review |
| §2.9 | Original, programmatic, or appropriately licensed visuals and sounds | M1–M3 original art; M6 audio/provenance |
| §2 closing paragraph | Browser-compatible rendering must resemble pseudo-3D racer rather than overhead | M1 Canvas chase view; M6 visual review |
| §3 opening | One original closed-loop circuit | M1 periodic track; M2 final layout |
| §3.1–3.3 | Multiple straights; at least four distinct corners with left and right turns; challenging corner requiring reduced speed | M2 geometry validation and braking comparison |
| §3.4–3.5 | Visible start/finish line; continuous laps without loading | M2 line/seam; M4 lap flow |
| §3.6–3.7 | Scenery conveying speed/location; clearly defined boundaries | M2 full-loop review; M6 visual finish |
| §3 closing paragraph | Multiple overtaking opportunities | M2 road/layout; M3 passing scenarios |
| §4 table: accelerate/brake | Up/W accelerate; Down/S brake | M1 key and physics tests |
| §4 table: steering | Left/A steer left; Right/D steer right | M1 key and steering tests |
| §4 table: pause | Escape/P pause/resume | M1 basic pause; M4 countdown/race clocks |
| §4 table: confirm | Enter confirms menu selection or starts race | M1 start; M5 focused-action tests |
| §4 closing paragraphs | Simultaneous inputs; responsive controls throughout race | M1 held-key smoke; M3 traffic; M7 full-race performance |
| §5.1–5.3 | Gradual acceleration/max speed; braking/natural deceleration; steering influenced by speed | M1 physics tests; M2 tuning |
| §5.4 and closing paragraphs | Too-fast cornering has consequences; appropriate braking/cornering rewarded; full throttle has consequences; real-world F1 accuracy unnecessary | M2 corner load, deterministic comparison, manual feel |
| §5.5 | Reduced speed or grip off racing surface | M2 off-road tests |
| §5.6 | Recovery after leaving track or colliding with obstacle | M2 barrier/obstacle recovery; M3 car recovery |
| §5.7 | Noticeable playable collision responses | M2 obstacle/barrier; M3 car contact; M6 feedback |
| §6 opening and closing | Exactly three AI cars; no ML/RL needed | M3 deterministic controller and profiles |
| §6.1–6.2 | AI circulate/complete laps; slow for corners/accelerate on straights | M3 long-run and controller tests; M4 valid laps |
| §6.3–6.4 | Slight performance differences; overtake and be overtaken | M3 profiles and bidirectional passing tests |
| §6.5 | No constant barrier collisions, permanent stalls, or teleporting | M3 long-run/contact/progress tests |
| §6.6 | Opponent positions reflect actual circuit progress | M3 continuous motion; M4 lawful standings |
| §7.1–7.3 | Three laps; four-car starting grid; three-second immobility countdown | M4 exact-tick rules and grid tests |
| §7.4 | Lap count, current lap time, best lap, total elapsed time, race position tracked | M4 authoritative state/HUD/results |
| §7.5 | Lap only after full circuit in correct direction | M4 ordered gates/adversarial tests |
| §7.6 | Positions from legitimate progress, including completed laps | M4 seam/gate/finish-order tests |
| §7.7–7.8 | Player ends after third lap; final position, total time, best lap displayed | M4 finish and frozen results; M5 styling |
| §7.9 | Another race without refreshing | M4 replay reset; M5 persistence interaction |
| §7.10 | Best recorded player lap survives reload | M5 storage and reload tests |
| §8 Main menu | Title, Start Race, keyboard explanation, stored best when present | M5 menu tests/review |
| §8 HUD | Speed, lap number, race position, current lap time, best lap time | M4 functional HUD; M5 readable final HUD |
| §8 Results | Final position, total race time, best lap time, replay | M4 results; M5 final UI |
| §8 Pause | Simulation/timing stopped, visible indicator, resume without reset | M1 basic safety; M4 full pause; M5 visual review |
| §9.1 | Engine changes with speed | M6 adapter tests and listening |
| §9.2 | Countdown or start signal | M6 event/cue tests and listening |
| §9.3 | Collision or off-track sound feedback | M6 feedback/cooldown tests and listening |
| §9.4 | Race-finish cue | M6 finish event and listening |
| §9 closing paragraph | Browser autoplay restrictions respected; mute option | M6 gesture/mute/failure tests |
| §10.1–10.4 | Local modern desktop browser; no paid service/API/credentials/backend; clear setup/run; no mandatory hosted assets/CDN | M1 local build/setup; M6 asset audit; M7 clean production launch/network audit |
| §10.5 | Responsive, smooth on typical desktop | M1 early driving; M3 traffic; M7 measured full-race sample |
| §10.6 | Speed/timing independent of display frame rate | M1 fixed-step schedule tests; M4 tick clocks; M7 integrated validation |
| §10.7 | Focus loss without large jumps or invalid lap times | M1 pause/rebase; M4 timing; M7 interruption stress |
| §10.8–10.9 | Calculations sufficiently separate from rendering; automated important-logic tests | M1 module boundary/tests; M2–M6 incremental suites |
| §10.10 | No incomplete required-path placeholders | M7 requirement audit and full playthrough |
| §11.1–11.2 | Complete source; dependency/build configuration | M1 foundation; M2–M6 code; M7 source/build audit |
| §11.3 | README installation and controls | M1 initial instructions; M5 controls; M7 clean-install verification |
| §11.4 | Automated tests with running instructions | M1 initial suite/instructions; M2–M6 coverage; M7 full documented suite |
| §11.5 | Working playable game | M1 playable slice; M4 full race; M5–M7 complete release |
| §11.6 | Short implementation choices, limitations, known-issues summary | M6 provenance; M7 `IMPLEMENTATION_NOTES.md` |
| §12.1 | Launch from README | M1 local launch; M7 clean-install acceptance |
| §12.2 | Start from main menu | M4 flow; M5 menu; M7 browser/manual acceptance |
| §12.3 | Control car around recognizable pseudo-3D circuit | M1–M2 driving; M6 visuals; M7 playthrough |
| §12.4 | Compete against three functioning AI | M3 behavior; M4 race integration; M7 playthrough |
| §12.5 | Meaningful steering, braking, collisions | M2 handling; M3 car contact; M7 playthrough |
| §12.6 | Finish three valid laps | M4 rule tests/full race; M7 playthrough |
| §12.7 | Correct results | M4 result tests; M5 screen; M7 playthrough |
| §12.8 | Replay without application restart | M4 replay; M7 repeated-flow test |
| §12.9 | Reload retaining best lap | M5 reload test; M7 production-origin check |
| §12.10 | Included automated tests pass | M1–M6 incremental checks; M7 full suite |
| §12 closing paragraph | Reasonable decisions; complete/reliable/enjoyable over extra features | All milestones; scope limits and assumptions in `ARCHITECTURE.md` |

## Execution and continuity

For each implementation session, read `AGENTS.md`, `SPEC.md`, `ARCHITECTURE.md`, this roadmap, and `PROGRESS.md`. Use the ledger's `pending`, `in progress`, and `complete` statuses to select the first unfinished milestone. Complete only that milestone, record actual changes/checks/blockers and the next concrete step in the ledger, and stop. If acceptance criteria or required verification remain unfinished, retain `in progress` so the next session resumes the same milestone. Do not begin a later milestone or commit changes unless the user explicitly requests it.

Mark a milestone complete only after its acceptance criteria have evidence. Keep the status table and evidence in `PROGRESS.md` rather than duplicating changing completion statuses in this roadmap. The user commits implementation and handoff updates together between sessions. M7 adds the final consolidated `VERIFICATION.md`; it does not replace incremental tests or records. Update plans to reflect implementation details when necessary, preserving every frozen specification requirement and explicitly recording any new assumption.

Reusable session prompt:

> Read AGENTS.md, SPEC.md, ARCHITECTURE.md, ROADMAP.md, and PROGRESS.md. Implement only the first unfinished milestone, resuming it if partially completed. Run its required verification and update PROGRESS.md with completion status, evidence, remaining issues, and the next step. Stop after that milestone; do not begin another milestone or commit changes.
