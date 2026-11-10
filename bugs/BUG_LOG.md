# SHATTERED DAD ADVENTURE — Bug Log

> Managed by `tools/tools_log_bug.js`. Add bugs via CLI; do not edit rows manually.
> Scan for inline TODO/FIXME comments with `tools/tools_scan_bugs.js`.

---

## Summary Table

| ID | Title | File | Status | Logged |
|---|---|---|---|---|
| BUG-001 | Directional movement dead (arrows/WASD) | `js/game.js` | resolved | 2026-06-18 |
| BUG-002 | Choose Your Dad confirm popup cut off on mobile; Yes/No unreachable | `ShatteredDadAdventure.html, js/ui.js, js/input.js` | resolved | 2026-11-05 |
| BUG-003 | device_commit_files re-sends stale content for a previously committed staged path | `tooling` | resolved | 2026-11-05 |
| BUG-004 | Landscape phone with optional D-pad: side column taller than screen | `ShatteredDadAdventure.html` | open | 2026-11-05 |
| BUG-005 | Mobile Dad deck: page behind the deck scrolls vertically | `ShatteredDadAdventure.html` | open | 2026-11-06 |
| BUG-006 | MOB-02: doors auto-close on a creature, companion or item standing in the doorway | `js/game.js` | resolved | 2026-11-06 |
| BUG-007 | MOB-03: scan pulse (and other effects) freeze after one tap until the next input | `js/render.js` | resolved | 2026-11-06 |
| BUG-008 | MOB-13: unrecruited companion carried to later floors at stale coordinates (shows inside walls) | `js/game.js` | resolved | 2026-11-06 |
| BUG-009 | Max zoom-in on a phone switches the map to the tablet tile grid | `js/config.js` | resolved | 2026-11-09 |
| BUG-010 | MOB-21: locked door could seal the start room (Dad starts inside the locked room, or walled in by a hidden lock); key always one tile from the arrival stairs | `js/game.js` | resolved | 2026-11-09 |
| BUG-011 | M15 hit-flash silhouette aborted the frame | `js/render.js` | resolved | 2026-11-10 |
| BUG-012 | Desktop Choose-Your-Dad portrait shows the previous run's Dad and skin | `js/render.js` | resolved | 2026-11-10 |
| BUG-013 | MOB-29: zooming in on phones enlarged the whole page; HUD and action buttons pushed off screen | `js/config.js` | resolved | 2026-11-10 |
| BUG-014 | MOB-35: Hunger/Thirst meters broken after Continue (NaN: bars drawn full, no damage, food and drink had no effect) | `js/game.js` | resolved | 2026-11-10 |
| BUG-015 | M17: soft-light falloff halves frame rate on a software-rasterised canvas (emulated low-end Android) | `js/render.js` | resolved | 2026-11-10 |
| BUG-016 | Desktop: page scrolls and the action bar sits below the fold at common laptop sizes | `js/config.js` | open | 2026-11-10 |
| BUG-017 | Share sheet: game keys dead after closing it with Esc | `js/share.js` | resolved | 2026-11-10 |
| BUG-018 | MOB-39: light around Dad flickers during auto-travel with MOTION on | `js/render.js` | resolved | 2026-11-10 |

---

## Open Bugs

### BUG-004 — Landscape phone with optional D-pad: side column taller than screen

- **File:** `ShatteredDadAdventure.html`
- **Status:** open
- **Logged:** 2026-11-05

**Description:** Compact landscape with the D-pad turned on (sda_dpad=1): HUD (164-193 px, varies with status/ally text) + D-pad stack in the side column exceeds short viewports, so the page scrolls vertically (iPhone SE landscape 330/320 px, iPhone 13 landscape 359/342 px). Pre-existing since M6/M7 (baseline SE landscape 338/320); M8 trimmed D-pad rows to 44 px which fixed portrait iPhone SE but not landscape. D-pad is off by default on touch layouts.

**Repro steps:** Playwright iPhone SE landscape, localStorage sda_dpad=1, start a run, compare documentElement.scrollHeight to clientHeight

---



### BUG-005 — Mobile Dad deck: page behind the deck scrolls vertically

- **File:** `ShatteredDadAdventure.html`
- **Status:** open
- **Logged:** 2026-11-06

**Description:** On compact layouts with the Choose-Your-Dad deck open, the document is taller than the viewport (iPhone SE: scrollHeight 975 vs 568) and body overflow is not hidden (the title cover sets it hidden), so window.scrollTo moves the page 407 px under the fixed #dadsel. Nothing visible changes (both layers are fixed), but on iOS a vertical drag on the deck may rubber-band or collapse the address bar. Pre-existing: identical on the pre-N22 build. Protected screen: a fix (overflow hidden while body.m-dadsel) is a bug fix, allowed, but was out of scope for N22.

**Repro steps:** iPhone SE emulation, title cover -> New Adventure -> window.scrollTo(0,1e5); window.scrollY becomes 407.

---

### BUG-009 — Max zoom-in on a phone switches the map to the tablet tile grid

- **File:** `js/config.js`
- **Status:** resolved
- **Logged:** 2026-11-09

**Description:** At the top zoom step (300%) on a portrait phone the canvas is wider than the screen, the page overflows, window.innerWidth grows past 700 and pickViewport() picks the portrait-tablet grid (11x15 instead of 9x13; landscape 15x10 -> 17x12). Pre-existing: same on the build before MOB-04's zoom-out change. Found while verifying MOB-04.

**Repro steps:** Pixel 5 or iPhone 13 landscape: zoom in 8 times (pinch apart or ZOOM +): at the last step VIEW_W x VIEW_H changes from 9x13 to 11x15


**Fix:** 2026-11-10 (MOB-29, BUG-013): on compact layouts zoom-in no longer enlarges the canvas (fewer, larger tiles in the same box), so the page never overflows and the grid stays on the phone layout; verified on Galaxy S25+, iPhone SE and Pixel 5 profiles (9x13 down to 3x4 at the top step, no 11x15 flip).

---

### BUG-012 — Desktop Choose-Your-Dad portrait shows the previous run's Dad and skin

- **File:** `js/render.js`
- **Status:** resolved
- **Logged:** 2026-11-10

**Description:** drawClassPortrait() used dadSprite()/skinColorMap(), which prefer game.cls/game.skin; game is not cleared when a run ends, so after a run the desktop CLASS screen drew the last run's Dad and skin whatever the cursor. Compact deck unaffected (draws its own cards).

**Repro steps:** Desktop: start a run as Tech Dad, return to the title, choose New Adventure, move the cursor: the portrait stays the Tech Dad.


**Fix:** M16 (2026-11-10): the desktop class card m16ClassCard() draws the Dad for the class under the cursor (_m16ClsSprite) with skinCursor (_m16SkinMap). The pre-M16 portrait, still used under ?noskin, keeps the old behaviour.

---

### BUG-016 — Desktop: page scrolls and the action bar sits below the fold at common laptop sizes

- **File:** `js/config.js`
- **Status:** open
- **Logged:** 2026-11-10

**Description:** Non-compact layout: at 1280x800 the document is 1026 px tall and #actionbar starts at y=934; 1366x768 -> 984 px (bar at 892); 1920x1080 -> 1278 px (bar at 1186). The canvas is sized to the viewport height but HUD/log/aim bar/action bar stack below it. Pre-existing (identical on the pre-M17 build); mobile/compact layouts are unaffected.

**Repro steps:** Desktop Chrome 1280x800, start a run: the action buttons are only reachable by scrolling the page

---

## Resolved Bugs

### BUG-018 — MOB-39: light around Dad flickers during auto-travel with MOTION on

- **File:** `js/render.js`
- **Status:** resolved
- **Logged:** 2026-11-10

**Description:** KBP (2026-11-10) reports the screen seems to flicker while Dad moves. Device, what flickers (whole map, walls, Dad, lighting) and whether MOTION off changes it are not stated.

**Repro steps:** Not reproduced: Playwright iPhone 13, iPhone SE, Galaxy S25+ profile, 8 steps with rAF sampling of the map canvas: no single-frame brightness jumps, no canvas resizes during moves.

**Device (KBP 2026-11-10):** Galaxy S25+; only while auto-traveling; the light around Dad flickers; MOTION off stops it.

**Cause:** with MOTION on, each step glides Dad and the camera over 80 ms, but the field of view (which tiles are dimmed and which get the soft light) switched to the new position at once. On screen the lit area jumped a tile ahead of Dad at the start of every step and slid back during the glide; auto-travel steps every 120 ms, so the edge of the light pulsed about 8 times a second.

**Fix:** js/render.js `_jzMask()`: while Dad glides, the dim/light mask is drawn in a second pass shifted by his glide offset, so it moves with him (same on-screen result as MOTION off); frames at rest take the old path unchanged. Measured (flat-tile probe, lit-area centroid over a 13-step auto-travel, Galaxy S25+): direction reversals 13 -> 0, movement 429 -> 157 px (MOTION off: 153). Fixed 2026-11-10 (nightly run 5).

---

### BUG-001 — Directional movement dead (arrows/WASD)

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-06-18

**Description:** clearMouseInspect() called in ui.js keydown PLAY branch and input.js click handler but never defined; ReferenceError aborts handler before tryMove() runs, breaking all movement.

**Fix:** Added clearMouseInspect() definition in game.js (clears mouse-driven inspect when not in keyboard inspect mode).

---


### BUG-002 — Choose Your Dad confirm popup cut off on mobile; Yes/No unreachable

- **File:** `ShatteredDadAdventure.html, js/ui.js, js/input.js`
- **Status:** resolved
- **Logged:** 2026-11-05

**Description:** #confirm was absolutely positioned inside #stage (canvas-sized). On the class-select screen the tall HUD class list shrinks the canvas, so the backstory dialog overflowed: top clipped, buttons hidden under the HUD (iPhone SE tap landed on the class list). Run could not start on phones.

**Repro steps:** Mobile (e.g., 320x568): New Adventure -> tap any Dad -> popup text cut off, Yes button not tappable

**Fix:** Compact layouts: #confirm is position:fixed full-viewport (z 200, safe-area padding); box is a flex column capped at viewport height, text scrolls, buttons pinned with 44px touch targets. openConfirm() takes optional button labels; new openClassConfirm() shared by tap+Enter with labels 'Begin the descent'/'Pick a different Dad'. Class/difficulty rows styled as tap cards; larger skin arrows; touch hint text. Desktop layout unchanged except labels moved into the buttons.

---

### BUG-003 — device_commit_files re-sends stale content for a previously committed staged path

- **File:** `tooling`
- **Status:** resolved
- **Logged:** 2026-11-05

**Description:** Committing /mnt/user-data/outputs/<same path> a second time wrote the first version's bytes (new mtime, old size) to the Windows file.

**Repro steps:** Commit outputs/X, change X, commit outputs/X again; device file keeps old content

**Fix:** Commit from a new staged path (e.g., outputs/r2/X); verify md5 on the device after every commit.

---

### BUG-006 — MOB-02: doors auto-close on a creature, companion or item standing in the doorway

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-06

**Description:** endTurn() closed an open door after 3 turns (or once the player stepped off) without checking the tile. An enemy, an unrecruited or following companion, or a dropped item in the doorway ended up inside a closed door (drawn under the door sprite, enemy trapped).

**Repro steps:** Open a door, let an enemy step into the doorway (or drop an item on it), step away 3 turns: the door closes on it

**Fix:** New _doorOccupied(d) (enemy, loot, companion, vendor on the tile); endTurn keeps an occupied door open and closes it on the first turn after the tile is clear. Verified in vm + Playwright on 4 phone profiles.

---

### BUG-007 — MOB-03: scan pulse (and other effects) freeze after one tap until the next input

- **File:** `js/render.js`
- **Status:** resolved
- **Logged:** 2026-11-06

**Description:** M4 dirty-flag frame loop redraws only on input or the 1 s safety net, but drawFX advances effects one step per drawn frame. A single SCAN tap drew one frame of the pulse; it only finished radiating after more taps (about one step per second otherwise). Same for thrown items and blasts.

**Repro steps:** Phone: tap SCAN once and wait: the pulse ring stays at its first frame; tap again and it moves

**Fix:** render() also redraws every frame while game.fx has entries during PLAY. Pulse now completes in about 0.25 s after one tap (Playwright: base 1 effect left after 1.45 s, fixed 0) on iPhone SE, iPhone 13, Pixel 5, iPhone 13 landscape and desktop.

---

### BUG-008 — MOB-13: unrecruited companion carried to later floors at stale coordinates (shows inside walls)

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-06

**Description:** buildFloor() only spawned an ally when game.ally was null and never cleared an unrecruited (not following) ally when the player left its floor, so it kept its old x/y on every later floor, usually inside a wall, and blocked new ally encounters. Probe: 3,084 wall placements over 60 seeds x 100 floors (all were this ally); enemies, bosses and loot were already placed on floor tiles.

**Repro steps:** Meet a companion, do not recruit, take the stairs: the companion appears in a wall on the next floor when that tile is in view

**Fix:** buildFloor/_restoreFloorFromCache drop an unrecruited ally from another floor; new _settlePlacements() safety net (no RNG) moves any player/enemy/loot/ally on a wall tile to the nearest open floor tile after every build, restore and continueRun. Probe after fix: 0 across 60 seeds x 100 floors and a full 1-class harness run.

---

### BUG-010 — MOB-21: locked door could seal the start room (Dad starts inside the locked room, or walled in by a hidden lock); key always one tile from the arrival stairs

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-09

**Description:** genFloor locked any dead-end room with one entry, including rooms[0] (where Dad arrives) and, in an Ascent, the stairs room he arrives in. Probe 60 seeds x 100 floors: 314 of 780 locked floors sealed the start room (about half as hidden locks, so Dad started in a room whose only exit was a hidden wall); in Ascent 693 of 780 locked floors left the key unreachable. buildFloor always put the key in rooms[0], one tile from the arrival stairs.

**Repro steps:** Seeded floors: start a run, look for the floor log line about a locked door: the key lies next to Dad and the lock is often on the start room's own doorway

**Fix:** genFloor never locks the arrival room or a door within 5 tiles of the arrival stairs (same RNG calls); new _keySpot() puts the key in another room at least 8 tiles from both stairs and the locked door; _restoreFloorFromCache keeps cached doors/hidden locks. Probe after: 0 start-room locks, 0 keys or locked doors within 5 tiles of arrival, 0 unreachable keys (descent and Ascent).

---

### BUG-011 — M15 hit-flash silhouette aborted the frame

- **File:** `js/render.js`
- **Status:** resolved
- **Logged:** 2026-11-10

**Description:** During M15 development, _jzSil() in js/render.js treated the {c,x} pair returned by _sprNewCanvas() as a canvas; s.getContext threw, drawFrame caught it and skipped the rest of the world draw (Dad and effects missing while an enemy flashed). Found before shipping.

**Repro steps:** Hit an enemy with M15 on; console: 'render skipped frame: TypeError: s.getContext is not a function'

**Fix:** _jzSil() uses nc.c / nc.x from _sprNewCanvas(); the Playwright test lib now fails on any 'render skipped frame' console warning

---

### BUG-013 — MOB-29: zooming in on phones enlarged the whole page; HUD and action buttons pushed off screen

- **File:** `js/config.js`
- **Status:** resolved
- **Logged:** 2026-11-10

**Description:** On compact layouts fitCanvas() multiplied the canvas CSS size by ZOOM_STEPS[zoomStep], so each in-game zoom step made the canvas taller/wider than its slot; the page overflowed, mobile Chrome zoomed the layout out and the action bar (BAG/SCAN/WAIT/THROW/MORE) ended below the screen, also inside BAG and the junk drawer. Browser pinch on the HUD could also page-zoom (viewport allowed user scaling). Same mechanism as BUG-009 (max zoom flipped the grid to 11x15).

**Repro steps:** Galaxy S25+ (384x832) or iPhone SE: start a run, zoom in 1-4 steps (pinch the map or + key): action bar buttons move below the screen; document height grows from 832 to 1255+ px

**Fix:** fitCanvas: on compact layouts zoom-in shows fewer, larger tiles (VIEW_W/VIEW_H divided by the zoom factor, min 3) inside the same canvas box; desktop unchanged. Viewport meta maximum-scale=1, user-scalable=no; iOS gesturestart blocked (js/input.js).

---

### BUG-014 — MOB-35: Hunger/Thirst meters broken after Continue (NaN: bars drawn full, no damage, food and drink had no effect)

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-10

**Description:** saveRun() never stored hunger or hydra, and continueRun() did not set them, so after any Continue (including reopening the app after the auto-save) game.hunger/game.hydra were undefined -> NaN. meter() then wrote width:NaN%, which the browser ignores, so both bars rendered full; NaN>=cap is false, so no damage; eating/drinking gave Math.max(0,NaN-x)=NaN.

**Repro steps:** Start a run, take a few turns, reload, Continue: Hunger and Thirst bars full; eat food: unchanged; wait 500 turns: no starving damage

**Fix:** continueRun sets hunger 0 and hydra to the class start value; survivalTick resets any non-finite meter to 0. Saving the meter values themselves needs new sda_save_v4 fields (LARGE ITEM rule), pending KBP approval on MOB-35.

---

### BUG-015 — M17: soft-light falloff halves frame rate on a software-rasterised canvas (emulated low-end Android)

- **File:** `js/render.js`
- **Status:** resolved
- **Logged:** 2026-11-10

**Description:** M15 lighting fills a radial gradient on every lit tile. With Chrome emulating a Moto G4 at 4x CPU throttle (software canvas, RENDER_SCALE 4, 1152x1664 backing store) animation ran at 32-37 fps; ?nolight gave 60-62 fps. drawFrame JS time was only ~2 ms p90, so the cost is rasterising the gradient fills, which real phones normally do on the GPU but GPU-blocklisted low-end devices do not.

**Repro steps:** Playwright Moto G4 profile, CDP Emulation.setCPUThrottlingRate 4, start a run, requestAnim(1500), count rAF frames for 1 s: 32-37

**Fix:** render.js frame-rate governor _rGovern(): while frames are drawn back to back it averages 45 intervals; above 26 ms it turns the soft lighting off for this page load only (same as ?nolight, nothing saved). Emulated low-end then holds 60 fps; all other emulated devices never trip it and their frames are md5-identical to before. ?nogov disables it; renderGovStats() for tests.

---

### BUG-017 — Share sheet: game keys dead after closing it with Esc

- **File:** `js/share.js`
- **Status:** resolved
- **Logged:** 2026-11-10

**Description:** M18 Share sheet (#m18share): after Esc/Close, keyboard focus stayed on the hidden Close button inside the sheet; the sheet's own keydown guard stopped propagation, so Q/H/Enter did nothing until the player clicked elsewhere (found by the M18 Playwright test: [Q] on the end screen after a previous Esc).

**Fix:** closeShare() blurs the focused element when it is inside the sheet. Found and fixed before verification in the same run (2026-11-10 weekly run 4).

---
*Generated by tools/tools_log_bug.js — append entries above this line*
