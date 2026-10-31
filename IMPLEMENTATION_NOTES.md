# Implementation notes

## Current slice

M1 is implemented with verification still in progress. `SPEC.md` is unchanged. M2–M7 remain pending; the application currently presents free driving rather than unimplemented race controls.

- `src/game/` uses read-only state, explicit input, and fixed timestep arguments; no browser, clock, rendering, storage, or audio APIs. ESLint restricts those dependencies.
- `src/platform/loop.ts` accumulates foreground milliseconds into 60 Hz ticks. A gap over 250 ms interrupts before advancing; pause clears both remainder and baseline. Equal tick-indexed inputs produce exactly equal states at 30/60/120/144 Hz in tests.
- `src/app/controller.ts` owns menu/driving/paused transitions and adapter lifetimes. Focus/visibility interruptions clear input and require explicit resume. HMR teardown removes listeners and animation callbacks.
- The provisional Harbor Loop is 300 five-meter segments (1500 m), with eased left/right curves and a straight seam. Longitudinal position stays unwrapped; road lookup and artwork wrap separately. This is periodic track-coordinate geometry, not a surveyed world-space circuit.
- The 960×540 logical Canvas projects curvature and distance from a fixed-height chase camera. Far-to-near strips and scenery give depth. Pixel-aligned strip boundaries avoid curb-color hairlines; scenery repeats by wrapped segment index. Pure render-command tests verify identical scenes on subsequent loops.
- Provisional handling: acceleration 18 m/s², maximum 84 m/s (302.4 km/h), brake 38 m/s², coasting drag 5 m/s². Steering grows with speed then saturates; a ±12 m verge clamp keeps the slice recoverable. M2 owns corner load, grip, off-road drag, and physical contacts.
- System fonts and all player/scenery graphics are original procedural code. No external assets, fonts, audio, telemetry, APIs, runtime CDN, or third-party media licenses are required. Audio is deferred to M6.

## Verification limits

Logic, static checks, reproducible offline installation, and the static build pass. Native Firefox 156.0.1 review of a temporary inline copy of the production bundle established basic driving, a full loop, pause, focus return, and desktop resize readability. That temporary review file is outside the project and is not a supported launch path or substitute for the local-origin browser suite.

This sandbox denies server binding (`listen EPERM 127.0.0.1:5173`) and npm/browser-download DNS. Registry metadata and integrity-checked package tarballs were acquired with permitted downloads into an ignored local cache; `npm install` and `npm ci` then succeeded offline. No cache helper, fixture, or test-only global is shipped. Chromium archive acquisition succeeded separately, but standard Playwright installation and browser-suite execution remain blocked/unverified. See `VERIFICATION.md` and resume M1 before M2.
