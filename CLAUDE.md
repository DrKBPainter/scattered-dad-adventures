# SCATTERED DAD ADVENTURES — Project Instructions

> For AI assistants working in this project. Read this before touching anything.

---

## What This Is

A browser-based tactical roguelike. A middle-aged dad descends through 100 floors of suburban chaos to recover the Remote of Ultimate Authority. Tone: deadpan narrator treating mundane catastrophe with complete seriousness. Influences: Terry Pratchett, Mel Brooks, King of the Hill.

**To play:** Open `ShatteredDadAdventure.html` in a browser. No build step. No server required.

**Title:** The game is titled *Scattered Dad Adventures* (renamed 2026-11-03; acronym SDA unchanged). Only display titles and docs were renamed. File names (`ShatteredDadAdventure.html`, `docs/SHATTERED DAD Adventure notes.txt`, `lore/Shattered_Dad_*`), the GitHub repo name, the project folder name, the `lore/` document headings ("SHATTERED DAD DUNGEON"), and the `sda_` localStorage keys keep the old spelling. Do not rename them unless asked.

---

## Critical Rule: One Source of Truth

**`js/data.js` is the source of truth for all game content.**

The `data/*.txt` files are human-readable mirrors — they do NOT drive the game. Editing a `.txt` file changes nothing. To make a content change:

1. Edit the relevant array in `js/data.js`
2. Run `tools/tools_export_data.js` (Node.js) to regenerate the `.txt` mirrors
3. If you add a creature, update `data/CREATURES_TABLE.md` manually

Never edit `.txt` files directly expecting the game to change. Never edit `data/CREATURES_TABLE.md` as a substitute for editing `js/data.js`.

---

## Folder Map (quick nav)

```
ShatteredDadAdventure.html   ← main game, open to play
js/config.js                 ← constants (MAXDEPTH, tile size, save key)
js/data.js                   ← ALL content arrays (edit here for content changes)
js/game.js                   ← core logic (combat, spawning, floor gen, save/load)
js/render.js                 ← canvas drawing
js/ui.js                     ← HUD, inventory, modals
js/input.js                  ← keyboard/mouse handlers
js/sprites.js                ← tile/ASCII character definitions
data/creatures.txt           ← creature mirror (read-only reference)
data/CREATURES_TABLE.md      ← full structured creature reference with spawn data
FOLDER_STRUCTURE.md          ← complete directory map with file descriptions
docs/GAME_DESIGN_REFERENCE.md← master GDD, start here for design questions
docs/BUILD_PLAN.md           ← phased roadmap with acceptance criteria
docs/NIGHTLY_BUILD_ROADMAP.md← sprint-level task tracking
lore/                        ← bestiary expansions and extended class lore
archive/                     ← v0.3 and v0.4 single-file backups
tools/tools_export_data.js   ← regenerates data/*.txt from js/data.js
tools/tools_log_bug.js       ← CLI: append a bug entry to bugs/BUG_LOG.md
tools/tools_scan_bugs.js     ← scan js/*.js for TODO/FIXME/HACK/BUG; auto-log new ones
bugs/BUG_LOG.md              ← persistent bug registry
```

---

## Key Constants (from `js/config.js`)

| Constant | Value | Meaning |
|---|---|---|
| `MAXDEPTH` | **100** | Maximum floor depth |
| `TILE` | 16 | Tile size in pixels |
| `MAP_W / MAP_H` | 40 / 30 | Map grid dimensions |
| `SAVE_KEY` | `sda_save_v4` | localStorage key for run persistence |
| `BESTIARY_KEY` | `sda_bestiary_v1` | localStorage key for discovered creature log |

> **GDD discrepancy:** `docs/GAME_DESIGN_REFERENCE.md` may reference 20 or 25 floors; the live game now caps at 100. Use 100 as the authoritative value. Update the GDD to reflect the 10-biome structure.

---

## How the Game Engine Works

### Floor Generation (`js/game.js`)
- `genFloor(depth, seed)` — procedural room+corridor layout, seeded RNG
- `buildFloor()` — populates enemies, loot, traps, vendor, boss, water tiles
- Enemy count per floor: `3 + floor(depth × 0.7) + random(0–2)`

### Creature Spawning
```javascript
// From js/game.js — pickCreature()
depth <= 10  → "The House"
depth <= 20  → "Lowe & Behold"
depth <= 30  → "The Park"
depth <= 40  → "Vastco"
depth <= 50  → "Soccer Complex"
depth <= 60  → "The School"
depth <= 70  → "The Family Restaurant"
depth <= 80  → "IDKEA"
depth <= 90  → "The Neighborhood"
else         → "The HOA Dominion"
```
Selection within biome is **uniform random** — equal weight per creature. To make a creature spawn more often, add it to the array multiple times.

### Bosses
- Spawn at every `depth % 10 === 0`
- Unique bosses at floors 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
- Floor 100 (The HOA President) is the final boss and must remain last in the `BOSSES` array
- Regular creatures still spawn alongside the boss

### Vendors
- `isVendorFloor(depth)` — `!!VENDORS[depth]`
- Vendor floors: 5, 15, 25, 35, 45, 55, 65, 75, 85, 95 (10 total)

### Combat
- Damage to enemy: `max(1, roll(effAtk()) - floor(enemy.def / 2))`
- Damage to player: enemy ATK (modified by player status effects)
- Loot drop chance: `0.12 + (enemy.xp / 120)`

### Water Floors
- Randomly assigned at run start
- Flood one room with water tiles
- Spawn goldfish (aquatic) — **not** in the regular `pickCreature()` pool

---

## Content Conventions

### Tone Rules (non-negotiable)
- Narrator treats ridiculous events with complete seriousness
- Never wink at the audience; never break the fourth wall
- Mundane = epic. A clogged sink is a dragon attack.
- Every triumph creates a new problem (narrative rule)
- Confidence is inversely proportional to competence

### Naming Conventions
- Real store names → fictionalized: IKEA → "The Isle of IKEA", Costco → "Vastco", Home Depot/Lowe's → "Lowe & Behold"
- Item rarity: Common → Rare → Epic → Legendary → Mythic
- Status effects that hurt: "Learning Experience" (not "debuff" in flavor text)

### Adding a New Creature
1. Add entry to `CREATURES` array in `js/data.js` with: `id`, `name`, `biome`, `hp`, `atk`, `def`, `xp`, `gold`, `speed`, `sprite`, `flavor`
2. Biome must match one of: `"The House"`, `"Lowe & Behold"`, `"The Park"`, `"Vastco"`, `"Soccer Complex"`, `"The School"`, `"The Family Restaurant"`, `"IDKEA"`, `"The Neighborhood"`, `"The HOA Dominion"`, `"water"`
3. Use Python/bash for insertions — **do not use the Edit tool for blocks longer than ~1500 chars** (risk of file truncation)
4. Run `tools/tools_export_data.js` to regenerate `data/creatures.txt`
5. **Update `data/CREATURES_TABLE.md`**: add row with name, new spawn chance (1 ÷ new pool size), all stats, and lore; update pool size note
6. Test: open game, reach correct floor range, verify creature appears

> **CREATURES_TABLE.md is the canonical human reference for spawn data.** It must always match `js/data.js`. Verify by running the Node sanity check: `node -e "..." ` (see Common Tasks below).

### Adding a New Dadism (class ability)
1. Add to `DADISMS` array in `js/data.js`: `id`, `name`, `classes[]`, `cost`, `kind`, `power`, `desc`
2. Valid `kind` values: `dmg`, `buff`, `heal`, `stun`, `rootall`, `aoe`, `random`, `scan`, `blind`
3. Add to the relevant class's `dadisms[]` in the `CLASSES` array
4. Run export tool, update `data/dadisms.txt`

### Adding a Boss
1. Add to `BOSSES` array in `js/data.js`: `id`, `name`, `floor`, `hp`, `atk`, `def`, `xp`, `gold`, `speed`, `sprite`, `flavor`
2. Boss spawns when `depth % 10 === 0` AND `BOSSES.find(b => b.floor === depth)` matches
3. If no match, falls back to last entry — make sure The HOA President (floor 100) is last
4. Use Python/bash for insertion — **do not use the Edit tool for large boss sprite blocks**
5. Run export tool, then **update `data/CREATURES_TABLE.md` bosses section** with new stats and lore

---

## What NOT to Do

- **Don't edit `data/*.txt` files** expecting game changes — they're mirrors
- **Don't modify `js/config.js`** constants without checking all dependent calculations in `js/game.js`
- **Don't change `SAVE_KEY`** without incrementing the version — old saves will break silently
- **Don't add real brand names** to in-game content — use the fictionalized versions
- **Don't make any victory complete** — per narrative rules, every win unlocks a new problem
- **Don't touch `archive/`** — legacy backups only, kept for rollback reference
- **Don't move `ShatteredDadAdventure.html`** or the `js/` and `data/` folders — relative paths are hardcoded

---

## Common Tasks

### "Add content" (creature / item / weapon / armor)
→ Edit `js/data.js` (use Python/bash for large blocks) → run `tools/tools_export_data.js` → update `data/CREATURES_TABLE.md`

### "Verify CREATURES_TABLE.md matches data.js"
Run this Node one-liner to get live counts and spot discrepancies:
```
node -e "
const fs=require('fs'),vm=require('vm');
const ORDER=['js/config.js','js/sprites.js','js/data.js','js/game.js','js/render.js','js/ui.js','js/input.js'];
let js=ORDER.map(f=>fs.readFileSync(f,'utf8')).join('\n');
js+=';globalThis.__D={CREATURES,BOSSES,VENDORS};';
const localStorage={getItem:()=>null,setItem:()=>{},removeItem:()=>{}};
const fc=()=>({getContext:()=>new Proxy({},{get:()=>()=>{}}),style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],width:320,height:240});
const el=()=>({...fc(),set innerHTML(v){},textContent:''});
const sb={localStorage,document:{getElementById:id=>id==='screen'||id==='mapcv'?fc():el(),addEventListener:()=>{},createElement:fc},window:{addEventListener:()=>{},innerWidth:1200,innerHeight:800},requestAnimationFrame:()=>{},Math,JSON,console,Array,Object,Proxy,globalThis:{}};
vm.createContext(sb);vm.runInContext(js,sb);
const D=sb.globalThis.__D;
const b={};D.CREATURES.forEach(c=>{b[c.biome]=(b[c.biome]||0)+1;});
Object.entries(b).sort().forEach(([biome,n])=>console.log(biome+': '+n+' creatures ('+Math.round(100/n)+'% each)'));
console.log('Bosses:',D.BOSSES.length,'| Vendors:',Object.keys(D.VENDORS).length);
"
```

### "How does X spawn / what floors does Y appear on?"
→ Check `data/CREATURES_TABLE.md` first — it has floors, spawn chance, and lore in one place

### "What's the design intent for X?"
→ `docs/GAME_DESIGN_REFERENCE.md` (master GDD)

### "What's left to build?"
→ `docs/BUILD_PLAN.md` (phases) and `docs/NIGHTLY_BUILD_ROADMAP.md` (sprint tasks)

### "What does this status effect do?"
→ `data/illnesses.txt` (status effects) or `data/buffs.txt` (item affixes)

### "How do I craft X?"
→ `data/recipes.txt`

### "The game is broken / something changed unexpectedly"
→ Check `archive/` for the last working single-file build to diff against

### "Log a bug I just found"
```
node tools/tools_log_bug.js \
  --title "Short title" \
  --desc  "What breaks and under what conditions" \
  --file  "js/game.js" \
  --status open \
  --repro "Steps to reproduce (optional)"
```
→ Entry appears in `bugs/BUG_LOG.md`. Mark resolved by re-running with `--status resolved --fix "What fixed it"`.

### "Scan source for untracked inline TODO/FIXME comments"
```
node tools/tools_scan_bugs.js          # logs new comments to BUG_LOG.md
node tools/tools_scan_bugs.js --dry-run  # preview only, no writes
```

### "Bug discovered during a session (AI assistants)"
When you encounter a reproducible bug mid-session, log it immediately:
1. Run `tools/tools_log_bug.js` with `--title`, `--desc`, `--file`, `--status open`
2. Note the assigned BUG-NNN id in your response so the user is aware
3. If you fix it in the same session, re-run with `--status resolved --fix "..."`

---

## Balance Reference

Creature stat scaling by biome (approximate):
- The House (floors 1–10): HP 4–18, ATK 2–5, DEF 0–2
- Lowe & Behold (11–20): HP 6–18, ATK 3–5, DEF 0–3
- The Park (21–30): HP 10–20, ATK 4–6, DEF 0–2
- Vastco (31–40): HP 8–26, ATK 3–7, DEF 0–5
- Soccer Complex (41–50): HP 10–24, ATK 4–7, DEF 0–3
- The School (51–60): HP 12–26, ATK 5–8, DEF 0–4
- The Family Restaurant (61–70): HP 14–28, ATK 5–8, DEF 0–4
- IDKEA (71–80): HP 16–30, ATK 6–9, DEF 1–5
- The Neighborhood (81–90): HP 18–32, ATK 7–10, DEF 1–5
- The HOA Dominion (91–100): HP 20–36, ATK 8–12, DEF 2–6

Boss stat scaling (approximate):
- Floor 10: HP 90, ATK 11, DEF 4
- Floor 20: HP 90, ATK 11, DEF 4
- Floor 30: HP 120, ATK 13, DEF 5
- Floor 40: HP 150, ATK 15, DEF 6
- Floor 50: HP 180, ATK 17, DEF 7
- Floor 60: HP 210, ATK 19, DEF 8
- Floor 70: HP 240, ATK 21, DEF 9
- Floor 80: HP 270, ATK 23, DEF 10
- Floor 90: HP 300, ATK 25, DEF 11
- Floor 100 (Final): HP 350, ATK 28, DEF 12

New creatures should stay within range for their biome tier. Biomes with only 3 stub creatures (Soccer Complex, The School, The Family Restaurant, IDKEA, The Neighborhood, The HOA Dominion) each have a 33% per-creature spawn chance — fill to 6–8 creatures per nightly build session to reduce per-creature frequency.
