# Verification evidence

## M7 — 2026-11-01 (in progress)

M1–M6 prerequisites are complete. Only M7 release verification is selected. The worktree was initially clean. No commits, staging, pushes, deployment or changes to the frozen specification, gameplay, art, audio, dependency versions or lockfile. New files are development-only release tests, listener observation and a real-time profiler; `package.json` adds only the profiler command.

**Required evidence still pending:** The user answered **“I can’t review now; record it as pending”** for the final uninterrupted manual race/recovery/replay/reload and representative desktop performance review. M4's native complete race, M2/M3 driving/contact review, and M6's user-confirmed listening/visual evidence remain valid historical evidence; they do not replace M7's explicitly required final manual run. Safari is unavailable on this Linux host; record a Safari manual check when available (conditional, not an invented release requirement).

### Environment and method

Host: Ubuntu 24.04 x64 VM, **QEMU Virtual CPU version 2.5+**, four logical CPUs at reported 2.4 GHz, approximately **7.76 GiB RAM**. No host Node executable. Standard `node:24-bookworm-slim` container provides Debian 12 x64, **Node 24.22.2 / npm 11.19.1**, within the declared supported majors. Workspace is mounted at `/workspace`, commands run as UID 1000; browser library installation alone runs as root inside the disposable container. This is a virtual test machine, not a representative physical desktop. Origin remains **http://127.0.0.1:5173** inside that environment.

For reproducibility, commands below are ordinary README commands executed with `docker exec gps-m7 …`; the container name is a session convenience, not a game dependency. `npm ci --cache /tmp/gps-npm-cache --no-fund` removed/replaced existing dependencies and installed **134 packages**, audited **135**, from the unchanged lockfile in **48 s**. Browser setup used `npx playwright install chromium firefox webkit` and `npx playwright install-deps chromium firefox webkit` (Linux libraries). Initial browser validation ran while library setup was still finishing and warned of missing GTK/X libraries; library installation subsequently completed. No package or application changes were needed.

### Release checks

Browser device presets initially use **1280×720** (Chromium/Firefox DPR 1, WebKit DPR 2); those project presets override the config's global viewport. The full keyboard-race capture explicitly selects **1280×800**, and UI/resize tests exercise **960×720**, **1280×800** and **1920×1080**. The separate profiler explicitly uses **1280×800 / DPR 1**. Pure logic retains exact complete-race equality at **30/60/120/144 Hz**, repeated ten-traversal AI traffic, braking reward, lawful gates, fractional finish ordering and safe persistence.

| Exact command inside the supported container | Result |
| --- | --- |
| `node --version` / `npm --version` | **24.22.2 / 11.19.1**. |
| `npm ci --cache /tmp/gps-npm-cache --no-fund` | Pass; clean replacement, 134 installed / 135 audited, lockfile unchanged. |
| `npx playwright install chromium firefox webkit` | Pass; Playwright 1.64.1 engines Chromium **156.0.8078.4**, Firefox **157.0**, WebKit **27.2**. |
| `npx playwright install-deps chromium firefox webkit` | Pass; standard Linux browser-library setup. |
| `npm run typecheck` | Pass on all added TypeScript tests/profiler. |
| `npm run lint` | Pass, including enforced pure-game boundary. |
| `npm test` | **134/134**, 15 files, final run **6.29 s**. Exact deterministic timing/traffic/handling baselines retained. |
| `npm run build` | Pass, **24 modules**, final **172 ms**. Static HTML **4.30 kB**, CSS **5.86 kB**, JS **35.60 kB**; identical asset hashes to the M6 implementation. |
| `npm audit --json` | Exit **1**, **11 moderate** development-only findings from minimatch **GHSA-g3hv-75wg-m249**, unchanged from M1. No high/critical findings. No breaking automated fix applied. |
| `npm audit --omit=dev` | Pass, **0 vulnerabilities**. No production npm dependencies. |
| Specification-map comparison | **67/67** exact reference rows reconciled; no missing/extra row. All ten §12 actions explicitly covered. |
| Frozen specification/lockfile and source/bundle audit | Unchanged; no runtime network clients, hosted assets, required-path placeholders or test-probe/driver markers in `src/` or `dist/`. `performance` in vehicle code is an explicit vehicle configuration argument, not a wall clock. |
| `npm run test:e2e -- --workers=2 --output=test-results/m7-dev-final` | **18/18 passed**, **2.3 min**, Playwright-managed development server. Three-race replay test **1.6 min**; interruption stress **28.7 s**. |
| `npm run test:e2e:compat -- --workers=1 --output=test-results/m7-dev-compat-serial` | **12/12 passed**, **3.2 min**, managed development server. Chromium, Firefox and WebKit driving/UI/audio plus twelve-cycle interruption stress. |
| `npm run preview` | Static production build serves the unchanged documented origin. |
| `npm run test:e2e -- --workers=2 --output=test-results/m7-preview` | **18/18 passed**, **2.2 min** against static preview. Three-race replay **1.5 min**, interruption stress **29.3 s**; exact results, records/reload, audio, local-only requests and console audit pass. |
| `npm run test:e2e:compat -- --workers=1 --output=test-results/m7-preview-compat` | **12/12 passed**, **3.1 min** against static preview, Chromium/Firefox/WebKit. |
| `npm run profile -- --headless --auto` | Pass: complete real-time three-lap workload, **4th / 4**, total **3:50.708**, best **1:03.128**, zero interruptions/errors/external requests. Conditions and distribution below. |
| `git diff --check`, frozen-file and production-boundary checks | Pass. No Git mutations. |

### Supplemental real-time VM performance

Isolated static preview, Chromium **156.0.8078.4**, headless Linux x64 QEMU machine described above, **1280×800 / DPR 1**, default browser pacing, ordinary held throttle (no steering/braking assist). Finished at **2026-11-01 16:11:39 UTC**. No other test suite ran during measurement; no fake clock, CPU throttle, or production instrumentation. Raw samples and full machine/results metadata are in ignored `test-results/performance.json`, reproducible with the documented command.

| Measurement | Samples | Mean | p50 | p95 | p99 | Maximum |
| --- | --- | --- | --- | --- | --- | --- |
| Active-racing rAF interval (ms) | 13,842 | 16.666 | 16.700 | 16.800 | 16.800 | 16.800 |
| Whole application callback (ms) | 13,843 | 0.961 | 0.900 | 1.400 | 1.800 | 3.200 |

Mean pacing **60.002 fps** across approximately **230.69 s** of recorded active-racing intervals. **Zero** intervals over 25/50/250 ms, **zero** observed long tasks and **zero** interruptions. The player reached real three-lap results with **3:50.708** authoritative total / **1:03.128** best; headless full throttle is deliberately slower than the controlled racing regression. No runtime/console errors or external HTTP requests. No recurring simulation/render stall appeared in this isolated workload, so no production optimization or handling/timing change was justified.

This is useful headless VM callback/pacing evidence, **not representative physical desktop acceptance**. It does not measure physical frame presentation, input latency, human braking/recovery feel or listening. A named physical desktop, display refresh rate and uninterrupted manual run/report remain required. Default visible `npm run profile` mode is implemented/typechecked but not manually exercised on this display-less host. All automated release checks pass; **M7 remains in progress** solely for the documented manual/representative evidence. Preview and the disposable browser/audio container are stopped at handoff.

**Resolved verification issues:** The first development suite passed the sixteen existing checks but failed the new stress timeout and replay fixture. The stress test now has a 90 s budget for VM rendering. Replay installs the fake clock before the keyboard animation wrapper, matching the existing complete-race fixture; otherwise the clock replaced that wrapper and left the player stationary. The listener observer now attributes registrations to application module/bundle stacks, excluding late Playwright/Vite blur listeners. An initially overlapping compatibility command lost its reused managed server when the primary command shut it down; all subsequent suites run sequentially.

This container has no `/dev/snd`. Firefox's real context stayed suspended until a real PulseAudio service with a virtual null output was provided: standard development setup `apt-get install -y --no-install-recommends pulseaudio`, then as the browser user `pulseaudio --start --exit-idle-time=-1` and `pactl load-module module-null-sink sink_name=gps_test`. This is neither a mocked AudioContext nor a listening claim. A two-worker compatibility run also triggered WebKit's intentional >250 ms stall pause and disrupted a pause-toggle assertion during slow screenshots. Serial execution reduces contention; freezing the layout test's clock before activation/captures removes screenshot-latency effects while preserving the dedicated real-time launch and interruption checks. No runtime threshold or gameplay change was made. All twelve development compatibility checks then passed, including actual Firefox audio and WebKit focused controls/interruption stress.

New release coverage:

- Twelve cycles of pause, blur, hidden, exceptional 5 s stall and resize; another 5 s pause each cycle; immutable HUD clocks/station, no fraudulent lap/record, held-W clearing on resume, one audio context, five persistent graph nodes while suspended and stable gameplay listeners. Hidden state is explicitly simulated at the document handler; this is not a native-tab manual claim.
- Three whole keyboard races in one page with real results/replay, exact authoritative total/race-best times, fresh grid/clocks, one audio context and unchanged gameplay listener count. Muting after each finish removes effects back to five persistent nodes. The observer counts application window/document keydown/keyup/blur/visibility listeners; it does not claim to count arbitrary browser-internal listeners.
- `npm run profile`: opt-in visible Chromium, real wall time and user controls; active-racing rAF intervals, whole application callback duration, long tasks, interruptions and network/console audit. No fake clock or driver ships in production. `--headless --auto` uses only ordinary held throttle as a supplemental workload. Reports retain raw samples in ignored `test-results/performance.json`. Headless VM pacing cannot establish physical display presentation, input latency or representative desktop feel.

### Specification reconciliation

Every row of the frozen-spec mapping in `ROADMAP.md` is reconciled here. **Automated pass** below means the implemented requirement has executed logic/browser evidence, supplemented by the specified historical manual/visual/listening evidence. **Manual pending** identifies the remaining M7 acceptance, not a known gameplay failure. Source/test filenames are relative to the repository. Release command totals must also pass before closeout.

| Spec reference | Evidence and release disposition |
| --- | --- |
| §1 | Complete keyboard race, `race.spec.ts`, three-race replay stress; original Canvas/AI/audio source and M6 visual/listening review. Final compact-title driving feel: **manual pending**. |
| §2.1–2.3 | `track-projection.test.ts`, `render-loop.test.ts`; M2 full-loop and M6 seven circuit scenes confirm chase/depth/curves/motion. |
| §2.4 | `render/art.ts`; M6 player wheels/body/rear-wing scene review. |
| §2.5 | `smoke.spec.ts` distinct moving palette test, three explicit opponent palettes; M3/M6 silhouette review. |
| §2.6 | `content/circuit.ts`, renderer; M2/M6 grass/curb/barrier/sign/stand review. |
| §2.7 | `records.spec.ts` three-size menu/pause and `race.spec.ts` results captures; M5/M6 visual review. |
| §2.8 | Asphalt-color steering test, both-verge recovery test, M6 surface/grass contrast review. |
| §2.9 | Procedural Canvas art and Web Audio synthesis; provenance in `IMPLEMENTATION_NOTES.md`; no external media. |
| §2 closing paragraph | Perspective projection tests and M6 chase-view review; browser Canvas 2D, no overhead mode. |
| §3 opening | `track-projection.test.ts`, `handling.test.ts`; single periodic 2000 m Harbor Loop. |
| §3.1–3.3 | Five eased left/right bends and multiple straights; `handling.test.ts` identical-steering braking comparison (340 vs 349 ticks, 0 vs 104 grass ticks). |
| §3.4–3.5 | Seam render/lookup tests, visible checkered stripe (M6 scenes), repeated legal laps without navigation/loading. |
| §3.6–3.7 | Circuit landmark/obstacle data; M2 full-loop and M6 all-corner/scenery/boundary review. |
| §3 closing paragraph | Wide passing straights validated in `handling.test.ts`; bidirectional passing in `traffic.test.ts`, M3 native review. |
| §4 table: accelerate/brake | `input.test.ts`, `vehicle.test.ts`, all-alias genuine browser-key smoke. |
| §4 table: steering | `input.test.ts`, speed-sensitive motion, browser asphalt displacement for A/D/Left/Right. |
| §4 table: pause | `race.test.ts`, countdown browser test, P/Escape and twelve-cycle stress. |
| §4 table: confirm | Focused Start/Resume/Replay/Enter browser tests; mute focused Enter retains native action. |
| §4 closing paragraphs | Held-key combined steering/throttle browser checks; integrated timing stress. Representative sustained responsiveness: **manual/performance pending**. |
| §5.1–5.3 | `vehicle.test.ts`: gradual acceleration/cap, drag, brake priority, speed-sensitive steering. |
| §5.4 and closing paragraphs | `handling.test.ts` braked Anchor faster/cleaner than full throttle, speed-squared load; M2 native corner review. Final manual feel pending. |
| §5.5 | `handling.test.ts`, browser both-verge slowdown/rejoin. |
| §5.6 | `collisions.test.ts`, `traffic.test.ts`, off-road full-race integration; M2 native obstacle/barrier recovery. |
| §5.7 | Bounded entry losses, physical separation/seam/sweep/pileup tests; M2/M3 native contact review and M6 impact listening. |
| §6 opening and closing | Exactly three explicit deterministic profiles, shared physics; `ai.test.ts`, `traffic.test.ts`. |
| §6.1–6.2 | AI corner lookahead and acceleration tests, repeated ten traversals, actual valid AI-first race in `integration/race.test.ts`. |
| §6.3–6.4 | Distinct profile caps/performance and both-direction overtaking/blocked-lane tests; M3 native field review. |
| §6.5 | Two exact long traffic runs, ≥20 km/AI, bounded per-tick motion, zero world/car contacts or off-road ticks in that scenario; queue release/recovery fixtures. |
| §6.6 | Lawful unwrapped standings and time-sorted finish tests, seam/invalid-progress fixtures. |
| §7.1–7.3 | Four separate grid slots, exactly 180 immobile countdown ticks, three legal laps; unit/browser countdown. |
| §7.4 | `raceHud` authority, exact lap/current/best/total/results browser comparison. |
| §7.5 | Arming/ordered quarter gates, skipped/reverse/duplicate/nonfinite/discontinuous/adversarial fixtures; ordinary grass remains legal. |
| §7.6 | Lawful progress snapshots, completed laps, ordered finishers, seam and same-tick fraction fixtures. |
| §7.7–7.8 | Immediate frozen third-lap results, exact position/total/best browser assertions; no fourth lap. |
| §7.9 | Three whole races without page reload, pristine grid/AI/contact/clock reset. |
| §7.10 | Completed valid player-lap events saved before finish; complete-race/replay/reload and slower-record preservation browser checks. |
| §8 Main menu | First-launch/schema/menu test: title, Start, all aliases, saved record only when present. |
| §8 HUD | Actual speed/kmh, lap, ordinal position, current and race best from simulation; three-size review. |
| §8 Results | Browser exact frozen position/total/race best, focused replay; three-size captures. |
| §8 Pause | Visible overlay; exact pure counters/field freeze and browser HUD/focus/stall/resume stress. |
| §9.1 | Speed→pitch/filter tests, actual AudioParam browser response; M6 user-confirmed listening. |
| §9.2 | Countdown/GO event mapping, actual cue frequencies; M6 user-confirmed listening. |
| §9.3 | Player-only impact events, coalescing and 18-tick cooldown; M6 actual-impact runs/user-confirmed listening. |
| §9.4 | Exactly one fanfare in multi-tick finish; tone mapping and M6 user-confirmed listening. |
| §9 closing paragraph | Gesture-only context creation, mute across phases, suspension/reuse, denial fallback, three-browser lifecycle tests. |
| §10.1–10.4 | Supported clean Node/npm install; README dev/build/static preview; local-only request/console audit and no runtime packages/assets/services. |
| §10.5 | Real-time diagnostic profiler provided. **Representative physical desktop distribution and responsiveness pending**; headless measurements are supplemental only. |
| §10.6 | Exact complete-race snapshots/results at 30/60/120/144 Hz, fixed 60 Hz ticks and fractional crossings. |
| §10.7 | Twelve-cycle interruption test, pure accumulator rebase and clock tests; native tab-switch review remains in final manual run. |
| §10.8–10.9 | DOM-free `src/game/`, enforced lint import/global boundary, 134 logic tests plus browser integration. |
| §10.10 | Source required-path audit has no TODO/FIXME/placeholder; automated menu→three laps→results→replay→reload. Final manual path pending. |
| §11.1–11.2 | All source/config/lockfile present; clean reproducible static build. |
| §11.3 | README commands, supported majors, fixed origin and every key/alias; clean install/dev/preview exercised. |
| §11.4 | Documented type/lint/logic/primary/compatibility commands, release stress and opt-in profiler. |
| §11.5 | Complete automated game flow and earlier native playthrough; final release manual/performance acceptance pending. |
| §11.6 | `IMPLEMENTATION_NOTES.md`: architecture, provenance, storage/audio/browser boundaries and explicit remaining acceptance. |
| §12.1 | Clean install and documented dev/static launch exercised; final manual README pass pending. |
| §12.2 | Pointer Start and focused Enter browser pass; earlier native menu acceptance; final manual pending. |
| §12.3 | Real simultaneous-key controls, projection and full-race tests, M2/M6 visual/driving evidence; final manual pending. |
| §12.4 | Exactly three functional opponents, long traffic and complete AI-first/player-first races; final manual pending. |
| §12.5 | Braking comparison, off-road/contact recovery/seam fixtures and genuine keyboard smoke; final manual pending. |
| §12.6 | Three ordered-gate circuits in pure/browser flow, three repeated full races; final manual pending. |
| §12.7 | Exact authoritative results and fractional ordering tests; final manual pending. |
| §12.8 | Three whole-race replays with stable graph/listener counts; final manual pending. |
| §12.9 | Actual valid record saved before finish/replay/reload in the same origin; final manual pending. |
| §12.10 | Full documented static/logic/browser check results recorded in this section. |
| §12 closing paragraph | No new gameplay feature, dependency, handling tuning, or scope expansion; verification and handoff only. |

### Resume M7

Complete the README manual release checklist and run `npm run profile` on a named representative desktop (record browser, viewport, refresh rate, distributions and feel). Record Safari manual results if available. Resolve any defects and rerun affected checks; mark M7 complete only when every acceptance criterion is verified. Do not invent M8 or claim all milestones complete while these required checks are pending.

## M6 — 2026-10-31

**Status: complete.** Only M6 implemented; M7 untouched. macOS ARM64, Node 24.18.0/npm 11.16.0, existing Playwright browsers; unchanged local origin http://127.0.0.1:5173. No dependency setup/download/audit repeated.

Typecheck/lint and **134/134 logic tests** pass. `npm run build` passes: 24 modules, HTML **4.30 kB**, CSS **5.86 kB**, JS **35.60 kB**. Initial dev suites: **16/16 Chromium** (33.7 s), **9/9 compatibility** (12.9 s). Corrected finish-batch focused preview regression passes **1/1** (32.0 s). Three repeated Firefox lifecycle checks pass **3/3** (5.2 s). Final static preview: `npm run test:e2e -- --output=test-results/m6-final` **16/16 passed** (33.0 s); `npm run test:e2e:compat -- --output=test-results/m6-final-compat` **9/9 passed** (12.6 s). Final typecheck/lint and 134 tests pass (1.10 s).

Audio tests cover lazy startup, speed/filter mapping, countdown/GO/player finish, player impact coalescing/cooldown, eight replays, disposal, late startup and denial. Test-only observers wrap real browser Web Audio; no production globals or fixtures. The full race checks exactly one finish fanfare in a multi-tick frame, exact clocks/results, replay and record retention. User explicitly confirmed **“Listening check passes”** for the requested engine/cue/mute/pause/replay review. Native computer-use access failed; no native listening or driving is claimed by the agent.

Reviewed actual input-driven circuit captures at 0/360/800/1160/1610/1780/1998 m and desktop menu/HUD/pause/results captures at 960×720, 1280×800 and 1920×1080. Chase perspective, five bends, road/grass contrast, seam stripe, scenery, open wheels/body/wing and opponent palettes remain readable. Tire highlights and height-aware layout finish contrast and keep mute visible. All art/sound is original procedural code; no external media, fonts or license obligations added. Captures remain ignored under test-results/.

Resolved verification issues: use float tolerance for browser oscillator frequencies and context suspension for silence (gain getters can retain their last rendered value). Removed an unreliable fixed-duration barrier assertion after successful runs and later approach inconsistency; player event/cooldown unit coverage and the user’s actual listening confirmation remain. Test driver holds steady throttle only on the final 15 m to batch finish ticks reproducibly. The controller now stops consuming events after results, preventing duplicate finish cues within catch-up batches.

Final whitespace/frozen-file/core/production-boundary inspections pass. Preview stopped after review. No M6 blocker remains. No release-performance or M7 acceptance claimed; earlier development-only audit findings unchanged.

## M5 — 2026-10-31

**Status: complete.** M4 and earlier prerequisites were read and verified complete. Only M5 was implemented; M6–M7 remain pending. Worktree initially clean; no commits/staging/push. `SPEC.md`, dependency pins and lockfile unchanged.

Environment: macOS ARM64, Node **24.18.0**, npm **11.16.0**, existing Playwright **1.64.1** browsers. Documented origin **http://127.0.0.1:5173** on both dev and static preview. Desktop captures: **960×720**, **1280×800**, **1920×1080**. Native Chrome review used the existing local-origin window (same installed Chrome as M4). Commands requiring writes/server/browser access used permitted execution; setup/download/audit not repeated.

| Exact command | Result |
| --- | --- |
| `npm test -- tests/unit/storage.test.ts tests/unit/hud.test.ts` | **38/38 passed**, initial affected logic checks. |
| `npm run typecheck` | Passed final source/tests; repeated after stall-fixture edit. |
| `npm run lint` | Passed final source/tests; repeated after stall-fixture edit. |
| `npm test` | **126/126 passed**, 14 files, 1.07 s. Includes 39 new formatting/storage/event-integration cases and all prior deterministic simulation regressions. |
| `npm run build` | Passed, 23 modules. HTML **4.23 kB**, CSS **5.56 kB**, JS **29.96 kB** (gzip 1.60 / 1.94 / 9.70 kB). |
| `npm run dev` | Served documented origin for native UI/keyboard and automated checks; stopped before preview. One duplicate start while the managed test server owned the port exited port-in-use; reused that server without changing commands/origin. |
| `npm run test:e2e` (final dev implementation) | **12/12 Chromium passed**, 32.1 s. |
| `npm run test:e2e:compat` (dev) | **6/6 passed**, 9.7 s. Driving smoke plus menu/schema/focus/layout/seeded-record reload in Chromium/Firefox/WebKit. |
| `npm run preview` | Served final static bundle at the documented origin; native menu/Enter/countdown/P passed. Stopped after review. |
| `npm run test:e2e -- --grep 'exceptional frame stall' --repeat-each=3` (preview) | **3/3 passed**, 3.0 s, after freezing the test clock during protocol calls. |
| `npm run test:e2e` (final preview) | **12/12 passed**, 32.0 s, after stall-fixture fix. |
| `npm run test:e2e:compat` (final preview) | **6/6 passed**, 9.6 s. |
| `git diff --check`, frozen-file and boundary inspection | Pass. No changes to frozen spec/dependencies; no browser APIs in pure game modules or test-driver markers in production. Git used only for inspection. |

### Records, UI and acceptance evidence

The controller synchronously passes each fixed tick's event list to a session-owned `PersonalRecords` adapter. Only a finite positive completed **player** lap improves the record, stored as version 1 JSON in milliseconds with fractional precision. Tests cover missing data, malformed JSON, wrong schema versions/types, zero/negative/infinite/oversized durations, slower/equal laps, AI laps, storage acquisition/read/write exceptions, and an already faster record from another tab. A real simulation integration test proves no write before lap completion, a saved record during racing, fresh-race retention, and no credit for physically discontinuous progress. No simulation/AI/handling/timing rule changes were needed.

The complete browser race now stops at lap 2 to compare the saved first lap against the reference while results remain hidden, continues to correct frozen three-lap results, replays to fresh race clocks/best while retaining the personal record, then reloads to the same menu value. A separate actual slower-lap run preserves a prior **0:20.000** record while showing its own distinct race best. Denied writes retain the actual completed lap as the session personal best and show **Saving unavailable**; pause/resume continues without page errors. Denied storage getters, corrupt/version/value data and empty first launch do not block play. Ordinary-origin persistence passes on final production preview as well as dev.

Main menu explains every specified key/alias including Enter; focused Start/Resume/Replay have clear outlines. Positions use ordinal strings and clocks retain the established truncation to milliseconds. HUD/results say **RACE BEST**, menu/results/external strip say **PERSONAL BEST**, and personal rows are hidden when no record exists. Record/status UI initializes synchronously without waiting for animation. Actual menu/HUD/pause/results captures were manually inspected at all three desktop sizes; countdown at 1920×1080 and native countdown reviewed. No panel clipping/overlap was found; essential driving view remains clear. Screenshots are reproducible ignored artifacts under `test-results/`, not production assets.

Native Chrome: reviewed menu instructions/focus, Enter start, 3 countdown, P pause, Enter resume, brief throttle/steer/brake with authoritative HUD and visible pause; repeated menu/Enter/countdown/P against final static preview. M4's native full-race evidence remains intact; M5's expensive complete race/persistence/reload uses ordinary inputs from the test-only keyboard wrapper. Multi-key behavior is separately covered by genuine Playwright keys. No audio, final art or release-performance acceptance is claimed here.

### Resolved failures and remaining limits

An initial targeted browser run passed four storage/UI cases but failed reload text because a frozen animation clock prevented the first UI update. The controller now initializes fields on phase changes; full suites pass. The first preview suite then passed 11/12 but the existing stall test observed **0 m → 1 m** between protocol calls while its installed clock still ran. Freezing the test clock before activation fixes the observation race; **three repeats** and final **12/12 preview** pass. This required no simulation change. Existing NO_COLOR/FORCE_COLOR warnings are benign. Runtime console/local-only request checks pass.

No M5 blocker remains. Browser policy/site-data deletion can prevent retention; the explicit session fallback is tested. Re-reading before comparisons is not an atomic multi-tab locking guarantee. M6 audio/final art and M7 release/performance remain pending, as do any later full-release Safari/manual checks. Earlier development-only audit findings are unchanged/unretested. Stop after M5 and leave changes for user review/commit.

## M4 — 2026-10-31

**Status: complete.** M3 prerequisite evidence was read before implementation; M1–M2 are also complete. Only M4 was implemented. M5–M7 remain pending. Initial worktree was clean; no commits/staging/push or other version-control mutations occurred. `SPEC.md`, package pins and lockfile are unchanged.

Environment: macOS ARM64, Node **24.18.0**, npm **11.16.0**, existing Playwright **1.64.1** browsers. Native manual review used Chrome **156.0.8078.74** on **http://127.0.0.1:5173**. Automated browser viewport is 1280×800 with the retained 960×720 resize check. Commands needing writes/server/browser access used permitted execution; no setup/download/audit was repeated.

| Exact command | Result |
| --- | --- |
| `npm test -- tests/unit/race.test.ts tests/integration/race.test.ts` | Initial **24/24 passed**; later exact-tie and grass-finish cases are included in the final suite below. |
| `npm test -- --reporter=verbose tests/unit/race.test.ts tests/integration/race.test.ts` | **25/25 passed** after exact-tie addition; printed complete-race clocks/finish data below. The grass-finish case was added afterward. |
| `npm run typecheck` | Passed on final source/tests. |
| `npm run lint` | Passed on final source/tests. |
| `npm test` | Final **87/87 passed**, 11 files, 1.01 s. Includes 26 new race tests and all M1–M3 regressions. |
| `npm run build` | Passed; 22 modules. HTML **3.63 kB**, CSS **4.19 kB**, JS **28.08 kB** (gzip 1.42 / 1.62 / 9.05 kB). |
| `npm run test:e2e -- --grep 'bounded keyboard' --repeat-each=2 --workers=2` | **2/2 passed**, 30.7 s after freezing the test clock before activation. |
| `npm run test:e2e -- --grep 'both verges' --repeat-each=2` | **2/2 passed**, 13.4 s after letting grid traffic clear before isolated handling measurement. |
| `npm run dev` | Served documented origin for native full-race review and browser tests; stopped before preview. |
| `npm run test:e2e` (final development server) | **8/8 Chromium passed**, 31.2 s. |
| `npm run test:e2e:compat` (final development server) | **3/3 Chromium/Firefox/WebKit smoke passed**, 7.1 s. |
| `npm run preview` | Served final static build at the same local origin; native Start/Enter/countdown/P review passed. Stopped after verification. |
| `npm run test:e2e` (final preview already running) | **8/8 Chromium passed**, 31.3 s. Includes exact displayed complete-race result times and fresh replay. |
| `npm run test:e2e:compat` (final preview already running) | **3/3 passed**, 7.0 s. |
| `git diff --check` and scope inspection | Passed after final documentation changes; frozen specification/dependencies unchanged; Git used only for inspection. Core/browser API and production fixture string audit has no matches. |

### Race rules and deterministic timing

Four separate pre-line slots remain stationary for all **180** countdown ticks; GO leaves elapsed time at zero and movement begins on the next tick. First crossing arms only. Quarter gates at 500/1000/1500/2000 m must be swept forward in order. Each next station is anchored to the previous accepted station with a physical **84/60 m** displacement bound. Reverse, skipped/unanchored, duplicate/oscillating, nonfinite or discontinuous progress cannot earn laps or ranking credit. Faulted injected motion preserves the last lawful station until replay. Lateral grass position does not invalidate a lap; a grass finish and off-road recovery/full race are covered.

All cars' crossing events are computed before results. Same-tick fixtures place the player's third finish at fraction **0.5** and an AI at **0.1**, **0.5**, or **0.9**, checking earlier/later ordering and stable identity ties. Finishers rank ahead of unfinished cars. A real delayed-player scenario finishes fourth after all three AI; another full race finishes first and repeats its entire state exactly. Three completed laps stop player progress and freeze the world/results, including repeated attempted inputs. Replay reconstructs clocks, grid, AI memory, gates and contact state.

Pure real-physics player-first run (tick units retain full precision):

| Value | Active ticks | Seconds |
| --- | --- | --- |
| Lap 1, including grid travel | 1708.0630148270031 | 28.467716914 |
| Lap 2 | 1567.8463563196535 | 26.130772605 |
| Lap 3 / race best | 1567.3681899288822 | 26.122803165 |
| Total / finish | 4843.277561075539 | 80.721292685 |

Lap durations sum exactly to the finish timestamp. Full 100 s tick-indexed schedules at **30/60/120/144 Hz** yield exactly equal race snapshots, clocks, standings, car/AI states, events and results. Pause tests preserve countdown/racing phase and all clocks; browser tests exercise P/Escape/Enter, blur, held-input cleanup, and a 5 s exceptional gap without simulation/timing jumps.

The bounded browser race uses a test-only reference driver reduced to ordinary W/S/A/D states and an injected animation wrapper that dispatches standard keyboard events. It neither edits simulation state nor exposes an application test API; no fixture/driver is bundled in production. The browser asserts exact total/best time strings against the reference, stable results, then Enter replay with stopped grid, lap 1/3, zero clock and no old best. Separate genuine keyboard tests retain all aliases, simultaneous steering/throttle, braking/coasting and both-verge recovery. Runtime request/console audit on development and preview finds no external HTTP requests, console errors or uncaught errors.

### Manual race and resolved test issues

Native Chrome completed a three-lap race through actual controls at the documented origin. The HUD advanced to **2/3 at 2397 m**, then **3/3 at 4016 m**, and the third finish immediately showed **4/4**, **6:31.129 total**, **2:00.619 best**. Foreground coasting and off-road slowdowns account for this deliberately slow run; it is functional acceptance, not a performance or competitive-lap measurement. The game continued after surface departures and the chase view/clock/position/best values remained readable. Throttle at results did not alter the frozen screen. Enter replay reset station to **−8 m**, speed **0**, lap **1/3**, lap clock **0:00.000**, and best **—**. P paused the replay countdown; explicit resume returned to the preserved **3**. Final static preview also passed native menu/Enter/countdown/pause review.

Resolved browser-fixture issues: countdown was added to prior driving setup; paused HUD sampling now waits a render; new two-row grid occlusion is handled by observing distinct palettes over visible approach frames; the field is paused before leaving view. The isolated-verge test now lets adjacent grid traffic pass before comparing slowdown, since side contact can legitimately delay departure. The full-race test clock is frozen before activation so real time between automation calls cannot shift a tick-indexed steering schedule. Both affected expensive/scenario tests repeat twice, and the final full suites pass on dev/preview. No handling/AI tuning or production fixture was needed. Existing NO_COLOR/FORCE_COLOR warnings are benign.

No M4 blocker remains. Native multiple non-modifier key holding is unavailable, supplemented by real simultaneous-key Playwright coverage. Personal-record persistence/final UI, audio, full-release compatibility/performance remain M5–M7. The earlier M1 development-only minimatch findings remain recorded below and were not re-audited. Stop after M4 and leave changes for review/commit.

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
