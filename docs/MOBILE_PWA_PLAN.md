# SCATTERED DAD ADVENTURES -- MOBILE PWA + GRAPHICS PLAN

Authored 2026-10-29. Baseline: v0.11.0 (100 floors, 7 classes, mouse-only complete, N21-N29 graphics chunks authored but not started).

## 1. Objective

Ship a mobile-first build, installable from the browser (no app store), with upgraded graphics, while keeping the current desktop build, save format, and diagnostic harness (7/7 class clears) intact.

**Distribution model:** Progressive Web App (PWA) hosted on HTTPS.
- Android (Chrome/Edge/Samsung): native "Install app" prompt via `beforeinstallprompt`.
- iOS/iPadOS: Safari Share -> "Add to Home Screen". No automatic prompt; the game must show its own instructions.
- Desktop: same URL, installable in Chrome/Edge.
- Requirements: HTTPS, a web app manifest, a service worker, correct icon sizes.

## 2. Current-State Constraints (from code review)

| Area | Current state | Mobile impact |
|---|---|---|
| Canvas | Fixed 480x320 (15x10 tiles x 32px); `fitCanvas()` reserves 220px for HUD | Landscape-only 3:2; tiny in portrait |
| Render loop | (Corrected 2026-11-03) Continuous `requestAnimationFrame` loop redrawing every frame even when idle; M4 made it dirty-flag driven | Battery drain on phones until M4 |
| Sprite drawing | `drawSprite` = one `fillRect` per pixel (1,024 calls per 32x32 sprite); 196 SPR_ defs in sprites.js (250 KB) | CPU-heavy on phones; blocks image art |
| Input | 10 `click` listeners, 1 `contextmenu` (right-click), 1 `keydown`; no pointer/touch events | Right-click and hover have no touch equivalent |
| Tooltips | `.st-chip:hover` status tooltips | Unreachable on touch |
| UI chrome | 9-button D-pad (46px) + 14-button action bar + aim bar + hint line | Consumes most of a phone screen |
| Saves | `localStorage` (save, bestiary, graveyard, daily keys) | Safari tab storage can be evicted after 7 days of browser use without visiting the site; Home Screen web apps are exempt |
| Audio | WebAudio procedural SFX | iOS requires unlock on first user gesture |
| Build | Plain `<script>` tags, no bundler | Good: keep no-build; easy to cache offline |
| Repo | OneDrive folder with recurring truncation/mount staleness | Hosting needs a clean source of truth (git) |

## 3. Decisions (LOCKED 2026-11-02)

1. **Art sourcing: option C.** Algorithmically upgrade existing 32x32 ASCII sprites (1px outline, 3-step shading ramps, highlight/shadow pass) and export to PNG atlases. Hand-drawn replacement of heroes/bosses is deferred, not scheduled.
2. **Orientation: portrait-first.** Dynamic viewport (~9x13 tiles portrait); landscape supported but secondary. Controls designed for one-handed portrait play.
3. **Hosting: public.** Public GitHub repo (DrKBPainter/scattered-dad-adventures; renamed 2026-11-04) + GitHub Pages at https://drkbpainter.github.io/scattered-dad-adventures/.

## 4. Phased Plan

Chunk IDs use an `M` prefix so they do not collide with nightly `N` chunks. Graphics chunks N21-N29 are re-sequenced into Phase 4.

### Phase 0 -- Foundation and deploy-first (M1-M2)

- **M1 Source control.** Create a GitHub repo (DrKBPainter/scattered-dad-adventures). Move the working copy out of OneDrive or make git the source of truth; OneDrive becomes a backup only. Rationale: eliminates the mount-truncation class of failures and is required for Pages.
- **M2 Deploy current build.** Rename `ShatteredDadAdventure.html` -> `index.html` (keep a redirect file under the old name). Enable GitHub Pages. Exit criterion: v0.11.0 plays from a phone browser over HTTPS. This proves the no-app-store path before any refactor.

### Phase 1 -- Render engine refactor (M3-M5)

- **M3 Sprite cache.** On load, rasterize each ASCII sprite once to an offscreen canvas (keyed by sprite + remap + skin). `drawSprite` becomes one `drawImage`. Expected: ~1,000x fewer draw calls per sprite. This is also the integration point for N21 PNG assets (image if loaded, cached ASCII raster as fallback).
- **M4 Frame loop.** Add a `requestAnimationFrame` loop that renders only when `dirty` or when an animation is active (preserves battery). Turn logic stays discrete; animation is purely visual.
- **M5 Dynamic viewport + HiDPI.** Make `VIEW_W/VIEW_H` variables computed from screen aspect (portrait ~9x13, landscape 15x10, tablets larger). Scale canvas backing store by integer factor x `devicePixelRatio`; keep `imageSmoothingEnabled=false`. Audit every use of `VIEW_W`, `VIEW_H`, `CW`, `CH`, and the hard-coded 480x320 class-select portrait layout.

### Phase 2 -- Mobile UI and touch controls (M6-M9)

- **M6 Responsive shell.** CSS layout: canvas top, compact HUD strip (HP/Moxie/hunger/thirst/floor), collapsible log (last 2 lines; tap to expand). `env(safe-area-inset-*)` for notches. `touch-action: none` on canvas; disable double-tap zoom, pull-to-refresh, text selection, and long-press callouts.
- **M7 Touch input layer.** Migrate to Pointer Events (covers mouse + touch + pen with one code path):
  - Tap adjacent tile = move/attack. Tap distant tile = auto-walk via existing pathing, interrupted when an enemy enters view.
  - Swipe = 8-direction step; optional on-screen D-pad (setting) for players who prefer it.
  - Long-press = inspect (replaces hover and right-click `contextmenu`).
  - Tap status chip = tooltip (replaces `:hover`).
  - Throw/Place aiming: tap target, confirm button.
- **M8 Action bar redesign.** 4-5 primary thumb buttons (Bag, Scan, Wait, Throw, More). "More" opens a drawer with Dadvice, Map, Bestiary, Codex, Graveyard, Help, Sound, Menu. Minimum touch target 44x44 CSS px.
- **M9 Overlay redesign.** Overlays become full-screen sheets with sticky header + Close. Inventory grid becomes `repeat(auto-fill, minmax(56px,1fr))`; item detail becomes a bottom sheet with Use/Equip/Drop/Combine buttons. Codex/Bestiary grids collapse to 2 columns.

### Phase 3 -- PWA layer (M10-M12)

- **M10 Manifest + icons.** `manifest.webmanifest` (name, short_name, `display: standalone`, `orientation: any`, theme/background colors, `start_url`, `scope`). Icons: 192, 512, 512 maskable, 180 apple-touch-icon. Splash: themed loading screen.
- **M11 Service worker.** Cache-first for the app shell (html, 8 js files, css, sprite atlases, audio). Cache name includes `GAME_VERSION`; on update, show "New version available -- reload" banner rather than silently swapping mid-run. Exit criterion: full run playable in airplane mode.
- **M12 Install + save durability.**
  - Android: capture `beforeinstallprompt`, show "Install" on title screen.
  - iOS: detect Safari non-standalone, show one-time Add to Home Screen instructions.
  - Call `navigator.storage.persist()`.
  - Save on `visibilitychange`/`pagehide` (mobile OS kills backgrounded tabs without warning).
  - Add Export/Import save (copyable text code or file) so saves survive device changes, browser data clears, and the Safari-tab eviction case.
  - Unlock WebAudio on first tap.

### Phase 4 -- Graphics upgrade (N21-N29 + M13-M16)

Order: pipeline -> heroes -> bosses -> creatures -> environment -> juice.

- **N21** PNG pipeline (now built on M3 sprite cache). Skin tint and curse remap via offscreen compositing (`source-atop` tint on masked layers) or by baking per-skin variants at load.
- **M13 Sprite atlas tooling.** Script that converts existing ASCII grids -> PNG (option C upgrade: outline + shading ramps) and packs atlases with a JSON index. Harness sprite check validates atlas index vs CREATURES/BOSSES/CLASSES ids.
- **N22-N28** Heroes, bosses, creatures by biome (unchanged scope).
- **M14 Environment tiles.** Per-biome floor/wall/door/stairs/water tile sets with 2-4 variants each, autotiled wall edges. 10 biomes x ~8 tiles.
- **N29** Player walk/attack frames.
- **M15 Game feel ("juice").** Tweened movement (~80 ms), hit flash, floating damage numbers, knockback nudge, death puff particles, small screen shake on crits/boss phases, smooth FOV falloff/lighting instead of hard visibility edges, boss phase transition banner. All motion respects `prefers-reduced-motion` plus an in-game toggle.
- **M16 UI skin.** Pixel font (licensed OFL), 9-slice panel frames, rarity-colored item borders, illustrated class-select cards replacing the procedural 480x320 backdrops, biome title cards for STORY_CLIPS. Encouragement notes (fridge-drawing "You're the best dad" style) as loading-screen tips and occasional floor pickups, per project tone rules.

### Phase 5 -- QA, performance, release (M17-M18)

- **M17 Device matrix.** Real devices: one recent iPhone (Safari + Home Screen mode), one older/low-end Android (Chrome), one tablet. Plus Chrome DevTools device emulation. Checks: 60 fps during animation on low-end Android, no input lag, overlays scroll, safe areas correct, save/resume after app kill, offline run, SW update flow, audio after unlock.
- Performance budgets: initial download < 5 MB (atlases compressed PNG/WebP), idle CPU near zero (dirty-flag rendering), no layout shift on rotation.
- Regression: harness 7/7 class clears, `node --check` on all js, save-format compatibility (`sda_save_v4` loads unchanged or migrates).
- **M18 Release.** Tag v1.0-mobile, Pages deploy, optional itch.io mirror, QR code on the title/credits screen for sharing.

## 5. Dependency Order

M1 -> M2 -> M3 -> M4 -> M5 -> (M6, M7 parallel) -> M8 -> M9 -> M10 -> M11 -> M12 -> N21 -> M13 -> N22..N28 -> M14 -> N29 -> M15 -> M16 -> M17 -> M18

Critical path rationale: M3 (sprite cache) is the single prerequisite for both mobile performance and the image pipeline; M5 (dynamic viewport) must precede UI layout work; the PWA layer is cheap and should land before the art pass so testers can install early.

## 6. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Art volume (~76 entities + ~80 tiles) stalls the project | High | Algorithmic upgrade (option C) first; hand art replaces incrementally; ASCII fallback always works |
| Dynamic viewport breaks code assuming 15x10 | Moderate | Grep audit of VIEW_W/VIEW_H/CW/CH before M5; harness run after |
| Safari storage eviction loses saves | Moderate (tab users) | Home Screen install prompt, `storage.persist()`, export/import |
| Stale service worker serves old JS after updates | Moderate | Versioned cache names; update banner; never cache-bust mid-run |
| OneDrive truncation corrupts files during refactor | High (historical) | M1 git migration first |
| iOS-specific behavior changes | Low-Moderate | Feature-detect; test on device each phase |

## 7. Definition of Done

A player opens a URL on an iPhone or Android phone, installs to the home screen without an app store, plays a full run Floor 1 -> 100 in portrait using touch only, offline, with hand-authored or upgraded shaded/outlined sprites, biome tile art, and animated movement/combat, and the save survives closing the app. Desktop build and harness 7/7 still pass.

## 8. Progress Log

Weekly scheduled run (Sundays) appends one entry: date, chunk(s) attempted, status, verification performed, blockers.

| Date | Chunk | Status | Verification | Notes/Blockers |
|---|---|---|---|---|
| 2026-11-03 | M1 Source control | blocked | Checked GitHub access: cloud `gh` token invalid (GH_TOKEN rejected); device VM has git but no GitHub credentials; repo DrKBPainter/shattered-dad-adventure does not exist yet (HTTP 404); no add_repo tool available this run. | Needs user: create the public repo (or connect GitHub with push access to the scheduled task) so the next run can push. M2 (Pages deploy) also waits on this. |
| 2026-11-03 | M3 Sprite cache | done | Done out of order because M1/M2 are blocked on GitHub. `js/render.js`: drawSprite/drawSpriteRemap now rasterize each sprite once per (remap,colorMap) variant to an offscreen canvas and draw with one `drawImage`; per-pixel fallback when no canvas is available; `registerSpriteImage(spr,img)` hook for N21 PNGs; `spriteCacheStats()` for debugging. Verified: `node --check` on all 8 js files; harness one class per call: 7/7 clears (grill, diy, tech, gym, tactical, sports, yard); Chromium pixel diff old vs new for all 196 SPR_ sprites x 5 variants (scale 1/2, curse remap + skin colorMap, empty remap): 0 mismatches; full-game Chromium smoke test (title -> class -> difficulty -> story clip -> moves/wait/inventory) gave identical canvas hashes at every step, no page errors; 2,000 sprite draws went from 404 ms to 5.6 ms. Canonical file verified through the Windows path (md5 matches build). Previous version saved as archive/render.pre-M3.js. | No save-format change. Inventory icons in ui.js still draw pixel by pixel on their own canvases (low priority; can switch to the cache during M9). |
| 2026-11-03 (run 2) | M1 Source control (re-check) | blocked | Cloud `gh` token still invalid; GitHub API now says repo access must be granted via add_repo, but no add_repo tool exists in this session; api.github.com/repos/DrKBPainter/shattered-dad-adventure and the Pages URL both return 404 from the device. | Still needs user: create the public repo and give the scheduled task GitHub push access. A local git dir exists at C:/git/sda.git (outside the connected folder, not reachable from the device VM). |
| 2026-11-03 (run 2) | M4 Frame loop | done | Note: the plan's section 2 was out of date: render() already ran a continuous requestAnimationFrame loop, redrawing every frame even when idle. `js/render.js`: the old body is now `drawFrame()`; `render()` (the rAF callback) redraws only when dirty, during an open `requestAnim(ms)` window (for M15), or every 1 s as a safety net. Dirty is set by any input event (capture phase), resize/orientation, visibilitychange/pageshow, every setTimeout callback (wrapped once; covers click-path auto-walk) and `registerSpriteImage`. New helpers: `markDirty()`, `requestAnim(ms)`, `renderStats()`. Verified: `node --check` on all 8 js files; harness per class, built from scratch copy outside OneDrive: 7/7 clears (grill, diy, tech, gym, tactical, sports, yard); Chromium old-vs-new with seeded Math.random: 20 checkpoints across title -> class -> difficulty -> intro -> story clip -> moves/inventory/map, 0 canvas-hash mismatches, no page errors; click-path auto-walk animates step by step and ends on an identical frame; idle 3 s: 3 frames drawn vs 177 skipped (was ~180 drawn); setTimeout wrapper keeps ids/clearTimeout/extra args working. Canonical render.js md5 checked through the Windows path. Old file: archive/render.pre-M4.js. | No save-format change. Any future non-input state change (e.g. N21 async image loads, fetch) should call `markDirty()`; the 1 s safety net covers misses. |
| 2026-11-03 (manual) | M1 Source control | waiting on user push | Repo DrKBPainter/shattered-dad-adventures now exists (public, empty). Claude session can read it but push is refused (Claude GitHub App not installed for this repo). Added index.html redirect to ShatteredDadAdventure.html for Pages. | User to push local repo (gitdir C:/git/sda.git) and enable Pages; install Claude GitHub App for scheduled pushes. |
| 2026-11-04 | M1 Source control | done | User pushed commit aefa5d3 to DrKBPainter/shattered-dad-adventures (main); verified from cloud clone: all top-level files, 8 js files, index.html present. | M2: user to enable Pages (Settings > Pages > main / root). Claude GitHub App still needed for scheduled-task pushes. |
| 2026-11-04 | M2 Deploy current build | done | User enabled Pages (main, root) and confirmed the game loads; repo renamed to DrKBPainter/scattered-dad-adventures; Pages URL https://drkbpainter.github.io/scattered-dad-adventures/ returns HTTP 200 from the cloud. Claude GitHub App installed; push access confirmed from the cloud (git push --dry-run succeeded). index.html redirects to ShatteredDadAdventure.html instead of a rename, so the desktop file name is unchanged. | Next chunk: M5. In-game rename to "Scattered Dad Adventures" is a separate pending decision (not started). Stray private duplicate repo DrKBPainter/shattered-dad-adventure exists; do not push to it. |
