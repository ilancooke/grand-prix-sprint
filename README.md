# Grand Prix Sprint

An original desktop-browser arcade racer, built incrementally against the frozen [specification](SPEC.md).

The current **M2 driving slice** has a finished 2000 m Harbor Loop with five bends, a checkered start line, braking markers, wide passing straights, off-road handling, barriers, and collidable shoulder tire stacks. M1 and M2 are **complete**; the application currently offers free driving. See [PROGRESS.md](PROGRESS.md) and [VERIFICATION.md](VERIFICATION.md) for acceptance evidence.

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

Playwright starts the local development server automatically, or reuses an existing server outside CI. The five-test suite covers Start/Enter, every driving alias, visible steering while accelerating, coasting/braking, both-verge slowdown and recovery, pause, focus cleanup, resize, exceptional stalls, and local-only requests without console errors. To check the static bundle, start `npm run preview` after building and run `npm run test:e2e` in another terminal; Playwright reuses that server outside CI. Browser binaries are development-only downloads.

```sh
npx playwright install firefox webkit
npm run test:e2e:compat
```

The current driving-slice compatibility smoke check passes in Chromium, Firefox, and WebKit. Full-release compatibility remains M7 work. A local server must be permitted to listen on port 5173; restricted environments may require permitted execution for setup, server startup, and browser tests. See [VERIFICATION.md](VERIFICATION.md) for results and earlier resolved environment limits.

For manual M2 verification, drive the full 2000 m loop through Lighthouse right, Anchor hairpin, Breakwater right, Pines left, and Home right. Brake at the Anchor approach markers: about **170–180 km/h** at its apex permits a clean turn with steering, while excessive speed overwhelms steering and carries the car wide. Grass reduces grip and speed; steer back with throttle to recover. The yellow/black tire stacks at **180 m left**, **660 m right**, and **1440 m left** are collidable. Trees, signs, and stands are decoration beyond the driving verge. Try both shoulders, barriers and tire stacks at low/high speed, then continue without reloading. Inspect the start line/scenery across the seam, resize, pause/resume, and switch tabs while driving.

## Implementation scope

Strict TypeScript, Canvas 2D procedural graphics, semantic HTML/CSS, and a 60 Hz pure simulation with interpolated rendering. No game/UI framework or third-party art is used. Circuit data is passed explicitly into motion/contact calculations. Corner load grows with speed squared; contact separation never changes longitudinal position. Generic two-car contacts have fixtures ready for M3, but no opponents are present yet.

Three opponents, race rules/countdown/results/replay, persistent records, and audio belong to M3–M6. The free-drive UI does not claim to run a complete race. See [IMPLEMENTATION_NOTES.md](IMPLEMENTATION_NOTES.md) for current choices and limitations. Stop after M2; no commits are created.
