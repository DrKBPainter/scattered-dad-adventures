# SHATTERED DAD ADVENTURE — ITERATIVE BUILD PLAN

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
- [ ] Biome tile sets and visual theming
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
- [ ] Asset pipeline: swap `drawSprite`/`drawSpriteRemap` from `fillRect`-per-char to `ctx.drawImage` from PNG sprite sheets; preserve skin-tone remap (`SKIN_SWATCHES`) and cursed-status remap (`dadVisRemap`) via canvas tinting/compositing, since flat per-char recolor no longer applies to baked images
- [ ] Fallback path: keep existing ASCII sprite defs as backup if an image fails to load — no regression risk to saves or the diagnostic harness
- [ ] Hand-author 8 player sprites (7 classes + hidden Granddad), idle frame
- [ ] Hand-author 12 boss sprites
- [ ] Hand-author creature rosters biome-by-biome (~64 creatures across all 10 biomes) reusing the asset pipeline
- [ ] Walk/attack animation frames (2–4 frames) for the player sprite once static art lands
- [ ] Update `tools/tools_export_data.js` and the diagnostic harness sprite-integrity check to validate image assets instead of/alongside `PAL` character sets

### Acceptance Criteria
Player, all bosses, and all creatures render from hand-authored image assets with shading and an outline, not flat single-tone code blocks. Skin-tone selection and cursed-status visuals still work. Diagnostic harness still clears 7/7 classes.

**Nightly build tracking:** see `docs/NIGHTLY_BUILD_ROADMAP.md` chunks N21+.

---

## PHASE 6b — MOBILE PWA + GRAPHICS
*Goal: installable browser-based mobile build (no app store) with upgraded graphics.* Full plan, chunk IDs (M1-M18), sequencing with N21-N29, risks, and definition of done: `docs/MOBILE_PWA_PLAN.md` (authored 2026-10-29). Not yet added to NIGHTLY_BUILD_ROADMAP.md.

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
