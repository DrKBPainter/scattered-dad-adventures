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
| BUG-019 | MOB-50: biome boss could be skipped; stairs down opened with the boss alive | `js/game.js` | resolved | 2026-11-12 |
| BUG-020 | MOB-56: item lying on the stairs could not be picked up (stairs question replaced the pick-up question) | `js/game.js, js/ui.js` | resolved | 2026-11-14 |
| BUG-021 | Crafted item lost when a worn cap item is consumed with a full bag (MOB-57) | `js/game.js` | resolved | 2026-11-15 |
| BUG-022 | Ally hunt quest target missing, quest cannot be completed (MOB-58) | `js/game.js` | resolved | 2026-11-15 |
| BUG-023 | Locked rooms could be entered without the key (diagonal corner step / secret wall beside the corner) (MOB-22) | `js/game.js` | resolved | 2026-11-16 |
| BUG-024 | Gym Dad door option 'Kick it down' throws ReferenceError (kickDoor is not defined) | `js/game.js` | open | 2026-11-16 |
| BUG-025 | Target box covered the creature it listed (and Dad or items) in the lower-right corner of the map (MOB-68) | `js/ui.js` | resolved | 2026-11-17 |
| BUG-026 | Gear lost kneeRelief: mkGear did not copy it (Compression Knee Sleeves, Tactical Compression Cargo System gave no knee relief) | `js/game.js` | resolved | 2026-11-17 |
| BUG-027 | Plywood Barricade places an HOA Violation Notice instead of a barricade | `js/data.js, js/game.js` | open | 2026-11-17 |
| BUG-028 | Frozen (Update Installing) did not stop Dad from moving | `js/game.js` | resolved | 2026-11-18 |
| BUG-029 | Equipping a charm (or any gear) with a full bag destroyed the item taken off | `js/game.js` | resolved | 2026-11-18 |
| BUG-030 | Vendor stock never ran out | `js/ui.js` | resolved | 2026-11-18 |

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



### BUG-024 — Gym Dad door option 'Kick it down' throws ReferenceError (kickDoor is not defined)

- **File:** `js/game.js`
- **Status:** open
- **Logged:** 2026-11-16

**Description:** doorOptions() in js/game.js offers 'Kick it down' to the Gym Dad, but no kickDoor() function exists anywhere in the project, so choosing it throws and the door stays shut. Found during the 2026-11-16 nightly run 4 (MOB-66/67 door tests); not fixed tonight (no item covers it).

**Repro steps:** Start a Gym Dad run, bump a closed door, choose 'Kick it down': console shows ReferenceError: kickDoor is not defined (reproduced in Playwright on the current build and the build before tonight's changes).

---

### BUG-027 — Plywood Barricade places an HOA Violation Notice instead of a barricade

- **File:** `js/data.js, js/game.js`
- **Status:** open
- **Logged:** 2026-11-17

**Description:** The Screws + Plywood recipe output has trapId 'barricade', but TRAPS_DEF has no 'barricade' entry, so placeTrap() falls back to TRAPS_DEF[0] (HOA Violation Notice): the placed object does not block the tile and springs as a 0-damage hangry trap.

**Repro steps:** Craft Screws + Plywood as DIY, PLACE TRAP next to Dad: the tile holds an HOA Violation Notice; creatures walk onto it.

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

### BUG-019 — MOB-50: biome boss could be skipped; stairs down opened with the boss alive

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-12

**Description:** On boss floors that end a biome (10, 20 ... 100) the stairs down offered 'Descend to Floor N+1?' while the boss was still alive, so a player could walk past it into the next biome. The kill message 'The way down is clear.' implied a gate that the code never enforced.

**Repro steps:** Start a run, go to floor 10, stand on the stairs down (or tap WAIT on them) with The Garage (As Entity) alive: the descend confirm appears.

**Fix:** game.js: new bossBarsStairs(); the stairs step shows a log line instead of the descend confirm while a living boss is on floors 10, 20 ... 100 (descent only; Ascent and mid-biome bosses on 15 and 25 unchanged). Boss arrival line adds 'The stairs down stay shut until it falls.' No RNG, no save change.

---
### BUG-020 — MOB-56: item lying on the stairs could not be picked up (stairs question replaced the pick-up question)

- **File:** `js/game.js, js/ui.js`
- **Status:** resolved
- **Logged:** 2026-11-14

**Description:** Stepping onto a stairs tile with loot on it opened the Pick up? confirm and then at once the Descend/Ascend confirm, which replaced it (one pendingConfirm); with a pile, the menu text was overwritten too. The item could never be picked up there. Player report via the feedback form, Galaxy S25+, floor 8.

**Repro steps:** Put loot on game.stairs, step onto it: only 'Descend to Floor N+1?' appears.

**Fix:** game.js tryMove: the stairs question is wrapped in _stairsAsk(); when something lies on the stairs tile, the pick-up question (or the pile menu) is shown first and carries the stairs question as a follow-up. ui.js resolveConfirm/resolveMenu run the follow-up (new _m56Then) after Yes or No, or hand it on to the next question the answer opened (pile -> pick-up confirm -> stairs). Gold and Fridge Drawings are still picked up at once, then the stairs question. No RNG, no save change. Fixed 2026-11-14 (nightly run).

---

### BUG-021 — Crafted item lost when a worn cap item is consumed with a full bag (MOB-57)

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-15

**Description:** Crafting Cargo Shorts (worn, +2 slots) with Compression Knee Sleeves while the bag was full consumed both, the bag cap dropped by 2, and addItem() refused the crafted Tactical Compression Cargo System (Inventory full), so the result vanished. Player report via feedback form, Galaxy S25+, build 1.0.0-1b07448909.

**Repro steps:** Wear Cargo Shorts, fill the bag to invCap(), combine the worn shorts with Knee Sleeves (success roll).

**Fix:** tryCraft: _craftWear() puts a weapon/armor/charm result straight into a slot a worn ingredient freed; _craftKeep() otherwise adds it to the bag or drops it at Dad's feet (also used for the failed-craft Duct Tape).

---

### BUG-022 — Ally hunt quest target missing, quest cannot be completed (MOB-58)

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-15

**Description:** Officer Doug's hunt quest needs an isQuestElite creature on the floor, but it can be missing: Continue rebuilds the floor without it (the saved ally keeps the quest), the first spawn spot can be the stairs or Dad's tile (no spawn, no retry), the family dog can chase it off, and kills by Dadisms or the companion never called tryCompleteHuntQuest. Player report via feedback form, Galaxy S25+, build 1.0.0-1b07448909, floor 4.

**Repro steps:** Meet an ally with a hunt quest, save, close and reopen (Continue): no elite on the floor; talking to the ally only repeats the request.

**Fix:** _spawnHuntElite() (retries, Math.random only) as fallback at floor build and whenever the ally is talked to with no live target, plus a compass hint; huntQuestSweep() at the start of endTurn/allyEncounter completes the quest when the tracked target dies by any means.

---

### BUG-023 — Locked rooms could be entered without the key (diagonal corner step / secret wall beside the corner) (MOB-22)

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-16

**Description:** Movement allows diagonal steps with no corner rule, but genFloor only counted orthogonal openings when choosing a room to lock. About 0.9% of locked rooms (70 of 7644 in 1000 seeds x 99 floors) had a corridor tile at an outside corner, so Dad could step diagonally into the vault past the locked door; a few more had a secret wall cache beside the corner (or next to a hidden chamber) that opened a second way in once found.

**Repro steps:** Seed 14143, floor 86: stand on the corridor tile (8,18) and step down-left into (7,19): Dad is inside the locked room without the key.

**Fix:** genFloor: _cornersSealed() keeps a room with an open outside corner off the lock list (lockable list and RNG calls unchanged); after all RNG calls, any secret that would join the locked room (or a hidden chamber opening off it) to the outside is dropped (its tile stays wall). Probe: 0 ways in across 99,000 floors.

---

### BUG-025 — Target box covered the creature it listed (and Dad or items) in the lower-right corner of the map (MOB-68)

- **File:** `js/ui.js`
- **Status:** resolved
- **Logged:** 2026-11-17

**Description:** On phones the IN REACH target box (104x130 CSS px, 96 px wide in landscape) sits over the lower-right 2-3 tiles of the map. With a reach weapon (garden hose, reach 4), or with Dad near the bottom or right edge of the floor where the camera stops scrolling, the creature shown in the box, Dad himself or an item could be under the box: the creature appeared in the box but not on the map. Player report via feedback form, Galaxy S25+ Firefox, build 1.0.0-ca55653482, floor 1, DIY Dad. Probe (Chromium, open test floor, hose, 414 positions per profile): target tile covered in 29-88 cases, Dad's tile in 57-104.

**Repro steps:** Garden hose equipped, Dad at (20,15), creature at (23,19): the box shows the creature and covers its tile.

**Fix:** ui.js _tgtPlace(): after each update the box picks the corner that covers least (lower-right, lower-left, upper-right, upper-left; target or Dad weigh 4, other targets 2, other visible enemies or items 1; ties keep the earlier corner). CSS classes tb-left / tb-top in ShatteredDadAdventure.html. Probe after: 0 covered targets and 0 covered Dad tiles on all 5 profiles.

---

### BUG-026 — Gear lost kneeRelief: mkGear did not copy it (Compression Knee Sleeves, Tactical Compression Cargo System gave no knee relief)

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-17

**Description:** mkGear() in js/game.js copied only atk/def/per/wis/cap/slot/wear/reach/throw/sprite, so kneeRelief:true in ARMORS and recipe outputs never reached the item; hasKneeRelief() was always false for them.

**Repro steps:** node: mkGear(ARMORS.find(a=>a.id==='knee_sleeves'),'armor',null,true).kneeRelief -> undefined

**Fix:** MOB-40 (2026-11-17): mkGear also copies kneeRelief (plus the new critPct, blindOnHit, breakOnRemove).

---

### BUG-028 — Frozen (Update Installing) did not stop Dad from moving

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-18

**Description:** The rooted status (STATUSES.rooted, from the Unskippable Ad trap, 12 turns) says 'Cannot move' but tryMove never checked it, so Dad walked freely. Reported via the feedback form 2026-11-16 (MOB-70).

**Repro steps:** applyStatus('rooted',3); press a direction toward an open floor tile: Dad moved.

**Fix:** tryMove: while rooted, a step toward an open tile is refused, one turn passes (endTurn), auto-travel is cleared and a log line gives the turns left; attacks on adjacent or in-reach creatures still work. MOB-70.

---

### BUG-029 — Equipping a charm (or any gear) with a full bag destroyed the item taken off

- **File:** `js/game.js`
- **Status:** resolved
- **Logged:** 2026-11-18

**Description:** equip() swapped the new piece in, then addItem(old); when the old piece gave extra bag slots (Keychain charm +1, Cargo Shorts +2) the cap shrank and addItem refused, so the old piece vanished. With both charm slots full the game also always replaced charm slot 1 with no choice. Reported via the feedback form 2026-11-16 (MOB-71).

**Repro steps:** Wear Keychain (45 Keys) in charm slot 1 and another charm in slot 2, fill the bag to cap, equip The Studfinder of Prophecy from the bag: the Keychain is in neither slot, bag nor floor.

**Fix:** equip(it,silent,slotPick): both charm slots full -> menu asking which charm to swap out; the piece taken off goes in the bag, or onto the floor at Dad's feet when the bag is full (_m71KeepOld, steps off stairs like dropItem). MOB-71.

---

### BUG-030 — Vendor stock never ran out

- **File:** `js/ui.js`
- **Status:** resolved
- **Logged:** 2026-11-18

**Description:** buildShop showed 'In stock: N' (1-5 by rarity) but buying never reduced it, so any item could be bought without limit. Reported via the feedback form 2026-11-16 (MOB-72).

**Repro steps:** Open a vendor with plenty of moolah and buy a Common item 6+ times: every purchase succeeds and the row still says In stock: 5.

**Fix:** game.js shopStockQty/shopLeft/shopNoteSold with an in-memory per-run, per-floor, per-row count (_shopSold, reset in newRun); ui.js buildShop shows the remaining count or 'Sold out' (dimmed) and the buy handler refuses sold-out rows. Not stored in the save: a Continue restocks the stall. MOB-72.

---
*Generated by tools/tools_log_bug.js — append entries above this line*
