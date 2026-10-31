# Implementation notes

## Current slice

M1–M3 are complete with automated and local-origin manual acceptance evidence. `SPEC.md` is unchanged. M4–M7 remain pending; the application offers free driving with exactly three opponents.

- Strict TypeScript/Canvas 2D/HTML/CSS, original procedural art, no runtime services or external assets. `src/game/` receives explicit state, inputs, track and timestep and uses no browser/clock/render/storage/audio API.
- The 60 Hz fixed-step loop interpolates unwrapped positions. Gaps above 250 ms, blur and hidden tabs pause, clear keys and rebase; explicit resume preserves state. Equal tick-indexed schedules at 30/60/120/144 Hz produce exactly equal four-car snapshots, including AI memory.
- Harbor Loop is 400 five-meter segments (2000 m), five eased left/right bends and several 200–300 m passing straights, on a 14 m road. Geometry is periodic track-coordinate geometry, not a surveyed world-space closure. The straight seam carries a checkered stripe; original labeled signs/stands distinguish locations.
- Motion has no invisible corner speed cap. Outward drift is `-curvature × speed² × 0.4 s`, opposed by speed-sensitive steering (up to 9 m/s). Grass gives 55% steering grip and `6 + 0.7 × speed` m/s² extra drag. Forward throttle can still move/rejoin from rest. Handling and contact constants live in `src/game/config.ts`.
- Barriers are 4.5 m beyond each road edge; the 1.8 m wide car center is contained at ±10.6 m. Entry retains 72% speed; sustained contact stays separated without repeated multiplication. Three visible yellow/black tire stacks have explicit shapes and retain 65% speed on entry. An obstacle/barrier pinch separates toward the open side. Distant trees/signs/stands are decorative. Contacts never change station.
- `src/game/collisions.ts` uses swept two-axis rectangle overlap and wrapped nearest separations. Every unordered car pair now receives one swept response per tick. World constraints and a final lateral free-space separation pass prevent four-car pileups from re-overlapping. A 1e-9 m geometry tolerance prevents separation rounding from retriggering impact loss. Stations never change during resolution.
- The Canvas camera is 7 m behind the physical player station so roadside contacts align with the car's ground position. Periodic render-command tests cover road, stripe, obstacles and scenery. All art remains original code; audio/provenance completion stays in M6.

- Three deterministic profiles in `src/content/opponents.ts` vary caps (78/75/81 m/s), acceleration (17/16/18 m/s²) and corner caution. The controller samples 165 m ahead using shared braking capability, compensates shared corner load through steering input, and chooses safe lanes with 120-tick commitment. Following leaves room to steer around stopped traffic; bounded creep prevents a close queue from permanently trapping a car. No randomness, rubber banding or longitudinal position correction is used.
- Opponents use original cyan/yellow/purple variants of the open-wheel silhouette, projected by actual unwrapped/interpolated position into far-to-near road strips. All decisions read the same prior snapshot. Synchronous impact records are available for later audio wiring; the free-drive UI does not invent race positions or timing.

## Verification and tuning

Typecheck, lint, **61 logic tests**, build, **6 Chromium tests on development and static preview**, and **3 compatibility smoke tests** on both pass. Native Chrome local-origin review drove behind/beside/through the field, passed nearby cars, let Gold pass after braking, recovered from contact and paused the field. See `VERIFICATION.md` for commands, observations and all 30 measured traversal times.

Two exactly repeated long runs cover at least **20 km per AI** with zero car/barrier/obstacle impacts and zero off-road ticks. Warm traversal times are approximately **27.084 s Azure / 28.383 s Gold / 26.146 s Violet**. This specific measured scenario now requires <32 s per traversal and zero contacts/off-road ticks. Separate blocked-lane, close-queue, side-by-side, player/AI passing, seam impact and crowded four-car recovery regressions cover interaction that the natural field does not provoke.

M2's unchanged handling comparison still passes: the same steering policy over 650–1000 m takes **340 ticks** braked versus **349 ticks** full throttle, with zero versus 104 off-road ticks and a stronger braked exit. No invisible curve speed cap was added to player handling; AI speed targets operate only through normal inputs.

No M3 acceptance blocker remains. Dependencies/lockfile are unchanged; the earlier M1 audit recorded 11 moderate development-tool findings from minimatch and zero production findings (not rerun). Legal race flow/timing/results/replay, persistence, audio and measured release performance remain M4–M7. Next session selects M4; stop at the M3 boundary and leave changes for user review/commit.
