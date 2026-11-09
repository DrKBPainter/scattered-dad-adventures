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
| BUG-009 | Max zoom-in on a phone switches the map to the tablet tile grid | `js/config.js` | open | 2026-11-09 |

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
- **Status:** open
- **Logged:** 2026-11-09

**Description:** At the top zoom step (300%) on a portrait phone the canvas is wider than the screen, the page overflows, window.innerWidth grows past 700 and pickViewport() picks the portrait-tablet grid (11x15 instead of 9x13; landscape 15x10 -> 17x12). Pre-existing: same on the build before MOB-04's zoom-out change. Found while verifying MOB-04.

**Repro steps:** Pixel 5 or iPhone 13 landscape: zoom in 8 times (pinch apart or ZOOM +): at the last step VIEW_W x VIEW_H changes from 9x13 to 11x15

---
## Resolved Bugs

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
*Generated by tools/tools_log_bug.js — append entries above this line*
