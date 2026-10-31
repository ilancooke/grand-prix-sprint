# Grand Prix Sprint

An original desktop-browser arcade racer, built incrementally against the frozen [specification](SPEC.md).

The current **M1 driving slice** contains a looping pseudo-3D chase view, an open-wheel player car, keyboard driving, speed/distance displays, and safe pause/resume. M1 is **complete**: setup, logic/build checks, Chromium tests on development and production preview, compatibility smoke tests, and local-origin manual driving review pass. See [PROGRESS.md](PROGRESS.md) and [VERIFICATION.md](VERIFICATION.md).

## Setup and launch

Use Node.js **24 LTS** and npm **11**; tested with Node **24.18.0**, npm **11.16.0**, on macOS ARM64. `.nvmrc` records the tested Node version. Development dependencies are pinned in `package.json` and `package-lock.json`.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5173** in a modern desktop browser. Click **Start driving** or press **Enter**. Use a viewport of at least **960×720**; 1280×800 or larger is preferred. Initial package/browser installation needs network access; gameplay uses local files and has no backend, credentials, hosted assets, or API dependency.

`config/server.ts` is the single host/port configuration for development, preview, and browser tests. Keep the same origin for future personal-record checks. Opening source files directly with `file://` is not supported.

## Controls

| Input | Action |
| --- | --- |
| W / Up | Accelerate |
| S / Down | Brake (takes priority over acceleration) |
| A / Left | Steer left |
| D / Right | Steer right |
| Escape / P | Pause or resume |
| Enter | Start or activate the focused menu/resume control |

Hold acceleration and steering together. Releasing acceleration slows the car. Focus loss, hidden tabs, or frame gaps above 250 ms pause immediately and clear held keys. Returning to the game requires explicit resume; time spent away is never simulated.

## Build and checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

`build` produces a static `dist/` directory. Preview uses the same local origin as development; stop the development server before previewing. `npm run test:watch` runs interactive logic tests.

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts the local development server automatically, or reuses an existing server outside CI. The suite covers Start/Enter, every driving alias, visible steering while accelerating, coasting/braking, pause, focus cleanup, resize, exceptional stalls, and local-only requests without console errors. To check the static bundle, start `npm run preview` after building and run `npm run test:e2e` in another terminal; Playwright reuses that server outside CI. Browser binaries are development-only downloads.

```sh
npx playwright install firefox webkit
npm run test:e2e:compat
```

The current driving-slice compatibility smoke check passes in Chromium, Firefox, and WebKit. Full-release compatibility remains M7 work. A local server must be permitted to listen on port 5173; restricted environments may require permitted execution for setup, server startup, and browser tests. See [VERIFICATION.md](VERIFICATION.md) for results and earlier resolved environment limits.

For manual M1 verification, drive at least one 1500 m loop, inspect both curve directions and moving roadside details, try every control alias and simultaneous acceleration/steering, brake to a stop, coast, pause/resume, resize, and switch tabs while driving. Confirm returning leaves the game paused and preserves position.

## Implementation scope

Strict TypeScript, Canvas 2D procedural graphics, semantic HTML/CSS, and a 60 Hz pure simulation with interpolated rendering. No game/UI framework or third-party art is used. The provisional circuit and handling will be refined in M2. Off-road penalties and collisions, three opponents, race rules/countdown/results/replay, persistent records, and audio belong to M2–M6 and are not yet implemented. The free-drive UI does not claim to run a complete race.

See [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for current choices and limitations. This session changes only M1 and creates no commits.
