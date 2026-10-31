# Implementation notes

## Current slice

M1 and M2 are complete with automated and local-origin manual acceptance evidence. `SPEC.md` is unchanged. M3–M7 remain pending; the application offers free driving.

- Strict TypeScript/Canvas 2D/HTML/CSS, original procedural art, no runtime services or external assets. `src/game/` receives explicit state, inputs, track and timestep and uses no browser/clock/render/storage/audio API.
- The 60 Hz fixed-step loop interpolates unwrapped positions. Gaps above 250 ms, blur and hidden tabs pause, clear keys and rebase; explicit resume preserves state. Equal tick-indexed schedules at 30/60/120/144 Hz produce exactly equal snapshots with the final M2 physics.
- Harbor Loop is 400 five-meter segments (2000 m), five eased left/right bends and several 200–300 m passing straights, on a 14 m road. Geometry is periodic track-coordinate geometry, not a surveyed world-space closure. The straight seam carries a checkered stripe; original labeled signs/stands distinguish locations.
- Motion has no invisible corner speed cap. Outward drift is `-curvature × speed² × 0.4 s`, opposed by speed-sensitive steering (up to 9 m/s). Grass gives 55% steering grip and `6 + 0.7 × speed` m/s² extra drag. Forward throttle can still move/rejoin from rest. Handling and contact constants live in `src/game/config.ts`.
- Barriers are 4.5 m beyond each road edge; the 1.8 m wide car center is contained at ±10.6 m. Entry retains 72% speed; sustained contact stays separated without repeated multiplication. Three visible yellow/black tire stacks have explicit shapes and retain 65% speed on entry. An obstacle/barrier pinch separates toward the open side. Distant trees/signs/stands are decorative. Contacts never change station.
- `src/game/collisions.ts` uses swept two-axis rectangle overlap and wrapped nearest separations. Generic car-pair contact fixtures cover the seam, high speed, overlap and boundaries; M3 will integrate each unordered pair once per tick. Physical separation, rather than cooldowns, prevents sustained overlap. No opponent behavior was started.
- The Canvas camera is 7 m behind the physical player station so roadside contacts align with the car's ground position. Periodic render-command tests cover road, stripe, obstacles and scenery. All art remains original code; audio/provenance completion stays in M6.

## Verification and tuning

Typecheck, lint, **42 logic tests**, build, **5 Chromium tests on development and static preview**, and **3 compatibility smoke tests** pass. Native Chrome local-origin review drove every bend, crossed 2000 m, continued to 2284 m, left/rejoined both verges, braked, paused, and recovered after tire/barrier contacts. Native multi-key holding is limited; Playwright verifies real simultaneous inputs. See `VERIFICATION.md` for commands and observations.

The deterministic 650–1000 m Anchor comparison uses the same steering policy for both runs. Braking from 720 m to about 49 m/s and accelerating again after 880 m takes **340 ticks (5.667 s)**, stays on road, and exits at **81.633 m/s**. Full throttle takes **349 ticks (5.817 s)**, spends **104 ticks** off road, hits one barrier, and exits at **62.417 m/s**. Initial tuning allowed the full-throttle run to win; the final hairpin curvature and grass drag correct that behavior without a scripted speed limit.

No M2 acceptance blocker remains. Dependencies/lockfile are unchanged; the earlier M1 audit recorded 11 moderate development-tool findings from minimatch and zero production findings (not rerun in M2). AI traffic, legal race flow/timing, persistence, audio and measured release performance remain M3–M7 work. M3 must check the generic pair solver in four-car traffic, including ordering against world contacts. Stop at M2; leave changes for user review/commit.
