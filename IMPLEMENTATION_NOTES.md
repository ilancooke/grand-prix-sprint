# Implementation notes

## Current slice

M1 is complete with automated and local-origin manual acceptance verified. `SPEC.md` is unchanged. M2–M7 remain pending; the application currently presents free driving rather than unimplemented race controls.

- `src/game/` uses read-only state, explicit input, and fixed timestep arguments; no browser, clock, rendering, storage, or audio APIs. ESLint restricts those dependencies.
- `src/platform/loop.ts` accumulates foreground milliseconds into 60 Hz ticks. A gap over 250 ms interrupts before advancing; pause clears both remainder and baseline. Equal tick-indexed inputs produce exactly equal states at 30/60/120/144 Hz in tests.
- `src/app/controller.ts` owns menu/driving/paused transitions and adapter lifetimes. Focus/visibility interruptions clear input and require explicit resume. HMR teardown removes listeners and animation callbacks.
- The provisional Harbor Loop is 300 five-meter segments (1500 m), with eased left/right curves and a straight seam. Longitudinal position stays unwrapped; road lookup and artwork wrap separately. This is periodic track-coordinate geometry, not a surveyed world-space circuit.
- The 960×540 logical Canvas projects curvature and distance from a fixed-height chase camera. Far-to-near strips and scenery give depth. Pixel-aligned strip boundaries avoid curb-color hairlines; scenery repeats by wrapped segment index. Pure render-command tests verify identical scenes on subsequent loops.
- Provisional handling: acceleration 18 m/s², maximum 84 m/s (302.4 km/h), brake 38 m/s², coasting drag 5 m/s². Steering grows with speed then saturates; a ±12 m verge clamp keeps the slice recoverable. M2 owns corner load, grip, off-road drag, and physical contacts.
- System fonts and all player/scenery graphics are original procedural code. No external assets, fonts, audio, telemetry, APIs, runtime CDN, or third-party media licenses are required. Audio is deferred to M6.

## Verification and limits

Standard `npm ci`, typecheck, lint, 23 logic tests, and the static build pass. Four Chromium browser tests pass on both the development server and production preview; compatibility smoke passes in Chromium, Firefox, and WebKit. The stronger browser suite checks rendered steering with simultaneous throttle for every alias without exposing game internals. Native Chrome 156.0.8078.74 review on `http://127.0.0.1:5173` verified full-loop motion, steering/braking/coasting, P/Escape, tab-return pause, and readable menu/HUD/pause at 960×720. See `VERIFICATION.md` for exact evidence.

The earlier sandbox bind/download failures are resolved through permitted execution using unchanged project commands. No application workaround, fixture, or test-only global is shipped. npm reports a moderate minimatch glob-processing advisory through 11 development-tool packages; `npm audit --omit=dev` reports zero findings. Versions remain pinned; review a compatible lint dependency fix when available. No M1 acceptance blocker remains. Final handling/collision feel, AI, full races, storage, audio, and measured release performance remain M2–M7 work. Stop after M1 in this session.
