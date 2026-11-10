# SCATTERED DAD ADVENTURES — ITERATIVE BUILD PLAN

---

## Philosophy

Build vertically (one complete slice) before building horizontally (all content). Playable and funny beats complete and broken. Each phase should produce something that can be demoed or playtested.

---

## PHASE 0 — FOUNDATION (Week 1–2)
*Goal: One complete, playable floor. No content, just scaffolding.*

### Deliverables
- [ ] Tech stack decision (Python/pygame, Godot, Unity, browser-based, etc.)
- [ ] Tile-based grid map renderer (single floor)
- [ ] Player entity with position, HP, and stats
- [ ] Turn manager (player turn → enemy turn → repeat)
- [ ] Basic movement (WASD or arrow keys)
- [ ] Simple enemy entity with one attack
- [ ] Combat resolution (attack, damage, death)
- [ ] Game state machine: EXPLORE → COMBAT → DEAD → WIN

### Acceptance Criteria
Dad can walk around a room, encounter an enemy, fight it, and either die or survive.

---

## PHASE 1 — ROGUELIKE CORE (Week 3–4)
*Goal: Procedural generation + permadeath loop.*

### Deliverables
- [ ] Procedural floor generator (rooms + corridors, seeded RNG)
- [ ] Permadeath: on death → return to class select
- [ ] Run seed display (so disasters are reproducible for sharing)
- [ ] Floor exit mechanic (stairs/escalator down)
- [ ] Floor counter (current depth / 25)
- [ ] Fog of war (only explored tiles visible)
- [ ] Basic inventory system (pickup, equip, use)
- [ ] 3–5 common loot items with stat effects
- [ ] Save-state for mid-session pause (not cross-session)

### Acceptance Criteria
A complete run can be attempted: character select → floor 1 → descend multiple floors → die → start over.

---

## PHASE 2 — CHARACTER CLASSES (Week 5–6)
*Goal: All 7 (+1 hidden) classes implemented with distinct feel.*

### Deliverables
- [ ] Character select screen with class descriptions
- [ ] Starting loadout system (class-specific gear on spawn)
- [ ] Stat system: Strength, Constitution, Charisma, Dexterity, Wisdom, Intelligence, Perception
- [ ] Passive trait system (always-on class bonuses)
- [ ] Active ability system (cooldown or resource-based)
- [ ] Implement all 7 base classes:
  - [ ] Grillmaster
  - [ ] DIY Dad
  - [ ] Sports Dad
  - [ ] Tech Dad
  - [ ] Yard Dad
  - [ ] Tactical Dad
  - [ ] Gym Dad
- [ ] Hidden class unlock condition (Granddad — post-launch or late beta)
- [ ] Starting quest trigger per class (narrative hook, not full quest system yet)

### Acceptance Criteria
Each class plays noticeably differently. A Gym Dad playthrough feels nothing like a Tech Dad playthrough.

---

## PHASE 3 — CONTENT LAYER 1: FLOORS 1–10 (Week 7–9)
*Goal: First two biomes fully playable with narrative continuity.*

### Deliverables
**Floors 1–5: The Parking Lot of Despair / Warehouse Depths**
- [x] Biome tile sets and visual theming (M14, 2026-11-09: per-biome floor/wall variants + autotiled wall edges, `assets/sprites/tiles.png`)
- [ ] Enemy roster: Shopping Cart Ambush, Confused Senior, Rogue Forklift, Weekend Warrior
- [ ] Traps: Lego Minefield, "Quick Stop" Trap, Vastco Sample Corridor
- [ ] Floor narrative text (loading screen / room descriptions)
- [ ] Boss: The Soccer Tournament Coordinator (Floor 5)
  - [ ] 3 attacks implemented
  - [ ] Boss intro cutscene/text
  - [ ] Defeat reward

**Floors 6–10: The Warehouse Depths**
- [ ] Enemy roster: Appliance Showroom Specter, Extended Warranty Wraith, Sale Sign Golem
- [ ] Traps: School Email Trap, Mystery Subscription
- [ ] Boss: The Appliance Salesman (Floor 10)
  - [ ] 3 attacks + Final Form: Regional Manager
  - [ ] Weakness mechanic (prior research debuff)

**Systems**
- [ ] Status effects: Dad Noise, Knee Twinge, Nap Paralysis
- [ ] Loot rarity tiers (Common through Epic)
- [ ] Named Legendary items (The Good Flashlight, Sacred Allen Wrench)

### Acceptance Criteria
Floors 1–10 can be completed in a single run. Narrative flows from one floor to the next.

---

## PHASE 4 — CONTENT LAYER 2: FLOORS 11–25 (Week 10–13)
*Goal: Full dungeon depth with all 5 bosses.*

### Deliverables
**Floors 11–15: The Family Vacation Corridor**
- [ ] Environmental hazards: Traffic, Budget Drain, Sunburn DoT
- [ ] Multi-phase boss: The Family Vacation (3 phases)
- [ ] "Are We There Yet?" mechanic — repeating unavoidable damage

**Floors 16–20: The IDKEA Labyrinth**
- [ ] Maze-style floor generation (IDKEA has ONE path)
- [ ] Meatball cafeteria rest area (healing zone)
- [ ] Boss: The Furniture Assembly Nightmare
  - [ ] Missing Piece special attack (removes a random equipped item)

**Floors 21–25: The HOA Dominion**
- [ ] HOA Enforcer enemy type (patrols, cites violations)
- [ ] Grass Measurement mini-game (stealth encounter)
- [ ] Boss: The HOA President
  - [ ] "Per My Previous Email" unavoidable psychic damage
  - [ ] Regulation Enforcement attack (removes player buffs)
  - [ ] Post-defeat: Remote of Ultimate Authority drops

**Endgame**
- [ ] Ascent mode: floors replay in reverse with increased difficulty
- [ ] True final boss: "Since You're Up" encounter
- [ ] Win screen / run summary stats

### Acceptance Criteria
A full run can be completed start to finish. The narrative arc resolves. The Remote is retrievable.

---

## PHASE 5 — PROGRESSION & REPLAYABILITY (Week 14–15)
*Goal: Reasons to play again.*

### Deliverables
- [ ] Talent tree system (unlock talents on level-up between floors)
  - [ ] Advanced Dad Reflexes
  - [ ] Thermostat Sense
  - [ ] Grill Telepathy
  - [ ] Nap Optimization
  - [ ] Financial Prophecy
- [ ] Meta-progression (cross-run unlocks): new starting items, new class variants
- [ ] Granddad hidden class unlock condition
- [ ] Run history / graveyard screen ("Here lies Greg. He thought he had enough patience.")
- [ ] Difficulty modes:
  - [ ] Saturday Morning (easy)
  - [ ] Honey-Do List (normal)
  - [ ] HOA Weekend (hard)
  - [ ] Tax Season (nightmare — no free time resource)

### Acceptance Criteria
A veteran player has reasons to try different classes, builds, and difficulty levels. Run variety feels meaningful.

---

## PHASE 6 — POLISH & PRESENTATION (Week 16–17)
*Goal: The game feels finished.*

### Deliverables
- [ ] Main menu with lore text
- [ ] Sound effects: knee crack, "Oof," grill sizzle, HOA letter sound
- [ ] Music: suburban epic, dungeon ambience, boss themes
- [ ] Animated death screen ("Your legacy: one repaired deck and a thermostat argument.")
- [ ] Item description flavor text (all items)
- [ ] Enemy flavor text (all enemies)
- [ ] Accessibility: font size options, colorblind mode
- [ ] Credits screen

---

## PHASE 6a — GRAPHICS UPGRADE: HAND-AUTHORED PIXEL ART
*Goal: Replace code-generated flat-block sprites with real hand-authored pixel art (shading, outlines, anti-aliasing) rendered as image assets instead of per-pixel `fillRect` calls.*

### Current state
All sprites are 32×32 ASCII-grid strings in `js/sprites.js`, mapped through a fixed hex palette (`PAL`) and drawn with `ctx.fillRect` per character (`drawSprite`/`drawSpriteRemap` in `js/render.js`). No image files, no shading ramps, single static frame per entity. Class-select backdrops are procedural vector shapes, not illustration (out of scope here).

### Deliverables
- [ ] Lock **Visual style** decision (resolves Open Question #2 below): hand-authored pixel art, keeping the current GBA-crisp 32×32 grid resolution
- [x] (N21, 2026-11-06) Asset pipeline: swap `drawSprite`/`drawSpriteRemap` from `fillRect`-per-char to `ctx.drawImage` from PNG sprite sheets; preserve skin-tone remap (`SKIN_SWATCHES`) and cursed-status remap (`dadVisRemap`) via canvas tinting/compositing, since flat per-char recolor no longer applies to baked images
- [x] (N21, 2026-11-06) Fallback path: keep existing ASCII sprite defs as backup if an image fails to load — no regression risk to saves or the diagnostic harness
- [x] (N22, 2026-11-06) Player sprites, idle frame: under locked option C the 8 Dad sprites (generic + 7 classes), 5 allies and the family dog are the upgraded `heroes` group (`assets/sprites/heroes.png`); skin tones and cursed remap baked by the N21 pipeline. No hidden Granddad class exists in the code, so none was drawn. Hand-drawn replacement stays deferred
- [x] (N23, 2026-11-07) Boss sprites: under locked option C the 12 bosses are the upgraded `bosses` group (`assets/sprites/bosses.png`, keys `boss:<id>`), shown on the map, in the Codex, in the mobile Bestiary cards and (now wired via `_uiSprImg()`) in the desktop Bestiary list. Hand-drawn replacement stays deferred
- [x] Creature rosters biome-by-biome (~64 creatures across all 10 biomes) reusing the asset pipeline. Under locked option C: (N24, 2026-11-07) The House + Lowe & Behold + aquatic goldfish done (`creatures-house-lowe` group, 16 sprites); (N25, 2026-11-08) The Park + Vastco done (`creatures-park-vastco` group, 12 sprites); (N26, 2026-11-08) Soccer Complex + The School done (`creatures-soccer-school` group, 12 sprites); (N27, 2026-11-09) The Family Restaurant + IDKEA done (`creatures-resto-idkea` group, 12 sprites); (N28, 2026-11-09) The Neighborhood + The HOA Dominion done (`creatures-hood-hoa` group, 12 sprites) -- every creature now has option C art
- [x] (M14, 2026-11-09) Environment tiles under locked option C: `tiles` group in `tools/tools_make_atlas.js` -> `assets/sprites/tiles.png` (120 tiles: per biome 3 floor + 2 wall variants, wall edge overlays n/e/s/w, floor shade overlays n/w; shared water x3; bevelled doors, stairs and biome gates). render.js `registerTileImage()` + `_drawTileArt()`; ASCII floors/walls stay the fallback (`?ascii`)
- [x] (N29, 2026-11-09) Walk/attack animation frames for the player sprite: 4-frame walk cycle (left step, pass, right step, pass) + attack lunge/recover frames with a swing streak, cut at draw time from the Dad's cached sprite (PNG art or ASCII, skin/curse variants included) by `drawDadAnim()` in js/render.js; ~200 ms per step/attack via the M4 `requestAnim()`; idle frame unchanged; off with `?noanim` or prefers-reduced-motion
- [x] (M15, 2026-11-10) Game feel: 80 ms glides (Dad, camera, enemies, companion), hit flash + knockback, floating damage numbers, death puffs, screen shake on big hits / boss kills / HOA phases, hurt vignette, boss and HOA phase banners, smooth FOV falloff; all draw-time in js/render.js (no game-state or RNG changes); MOTION toggle (desktop action bar + MORE drawer, `sda_motion`) and prefers-reduced-motion turn motion off (lighting stays); `?nojuice` = pre-M15 frames
- [x] (M16, 2026-11-10) UI skin: OFL pixel font (Silkscreen, `assets/fonts/`) on headings/buttons/labels, 9-slice panel frames (`assets/ui/`, `tools/tools_make_ui.js`), rarity-coloured item borders, illustrated desktop class-select card, biome title cards on the STORY_CLIPS cards, more rotating loading-screen notes, and Fridge Drawing floor pickups (encouragement notes from the kids, +3 HP). `?noskin` keeps the pre-M16 look.
- [x] (M13, 2026-11-06) Diagnostic harness validates the atlas alongside `PAL` character sets (`node _harness.js atlas`: every key resolves, rects are grid x k inside the sheet); `tools/tools_make_atlas.js --check` verifies sheets match the ASCII source and are in sw.js ASSETS
- [x] (M13, 2026-11-06) Option C generator `tools/tools_make_atlas.js` (outline + 3-step shading); items group live, heroes/bosses/creatures groups ready for N22-N28

### Acceptance Criteria
Player, all bosses, and all creatures render from hand-authored image assets with shading and an outline, not flat single-tone code blocks. Skin-tone selection and cursed-status visuals still work. Diagnostic harness still clears 7/7 classes.

**Nightly build tracking:** see `docs/NIGHTLY_BUILD_ROADMAP.md` chunks N21+.

---

## PHASE 6b — MOBILE PWA + GRAPHICS
*Goal: installable browser-based mobile build (no app store) with upgraded graphics.* Full plan, chunk IDs (M1-M18), sequencing with N21-N29, risks, and definition of done: `docs/MOBILE_PWA_PLAN.md` (authored 2026-10-29). Not yet added to NIGHTLY_BUILD_ROADMAP.md.

- [x] (M1-M17, 2026-11-03 to 2026-11-10) All plan chunks built; M17 real-device rows pending KBP (`docs/M17_DEVICE_CHECKLIST.md`).
- [x] (M18, 2026-11-10) Release v1.0.0: GAME_VERSION 1.0.0, Share the Game sheet with QR code (`js/share.js`, `tools/tools_make_qr.js`, `assets/ui/qr-share.png`), release notes `docs/RELEASE_NOTES.md`. Remaining KBP steps: push, real-device checklist, git tag `v1.0-mobile`; itch.io mirror optional (not done).

---

## PHASE 7 — RELEASE & POST-LAUNCH (Week 18+)

### Deliverables
- [ ] Web build (itch.io) or desktop packaging
- [ ] Daily challenge mode (fixed seed, shared leaderboard)
- [ ] Community event: "The Great Cookout Weekend" (seasonal run modifier)
- [ ] DLC concept: **The Vastco Expansion** (5 additional floors, Warehouse Bulk biome)

---

## OPEN QUESTIONS FOR THE DESIGNER

The following need answers before Phase 3 content can be locked:

1. **Platform** — Browser (Phaser/Godot HTML export), desktop (Godot/Unity), or Python prototype first?
2. **Visual style** — ~~ASCII/roguelike classic, pixel art, or cartoon illustrated?~~ **Decided (2026-07-09): hand-authored pixel art.** See Phase 6a.
3. **Narrative delivery** — Room description text (NetHack style), dialogue boxes, or loading screen lore blurbs?
4. **Narrative thread** — The GDD placeholder states the Remote was confiscated by the HOA President. Does this hold? What event kicked off the descent on *this particular Saturday*?
5. **Floor count** — 25 floors is substantial. Would 10–15 floors with denser content serve the game better for v1?
6. **Multiplayer** — Strictly single-player, or co-op (two dads, one disaster)?
7. **Class count for v1** — All 7 at launch, or start with 3–4 and add the rest?

---

## SUGGESTED NARRATIVE THREAD (FOR REVIEW)

> *It started with the thermostat.*
>
> On a Saturday that had shown such promise, Dad discovered the Remote of Ultimate Authority was missing. Without it, the thermostat was set to 74. The family had been living in a tropical climate for six days.
>
> The last known location: The HOA Community Center, where President Karen Blackwell had confiscated it during Dad's "unauthorized" outdoor speaker installation at the block party.
>
> The Community Center is in the basement of the new home improvement superstore on Route 9.
>
> The store is open.
>
> It is Saturday.
>
> Dad is going in.

Each floor should escalate the chaos organically:
- **Floors 1–5:** Getting from the parking lot to the main floor (it's worse than expected)
- **Floors 6–10:** The appliance section, the salesman encounter, the receipt dispute
- **Floors 11–15:** The store's "vacation display" section triggers a PTSD flashback dungeon
- **Floors 16–20:** IDKEA is inexplicably attached to this Haul Depot. Nobody knows why. Nobody questions it.
- **Floors 21–25:** The HOA wing. This is where they live now.

---

*Build Plan v0.1 — subject to revision after designer review*
