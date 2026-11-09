# assets/sprites/

Image art for the N21 PNG sprite pipeline. The ASCII sprites in `js/sprites.js` / `js/data.js` stay the source of truth and the fallback.

- `atlas.js` — the index (`var SPRITE_ATLAS={version:1,sheets:[...]}`), loaded by a `<script>` tag before `js/spriteimg.js`. Format and rules are in its header comment. Ships empty; M13 fills it.
- **Generated (M13):** `atlas.js` and the `*.png` sheets are written by `node tools/tools_make_atlas.js` (option C upgrade: 1px outline + highlight/base/shadow ramps, same 32x32 size, k=1). Don't hand-edit them; change `ENABLED` / `TUNING` in the tool and re-run. `--check` fails when they are stale or a sheet is missing from sw.js; `--preview DIR` writes before/after images for every group. Live groups: `items` (M13), `heroes` (N22), `bosses` (N23), `creatures-house-lowe` (N24), `creatures-park-vastco` (N25), `creatures-soccer-school` (N26), `creatures-resto-idkea` (N27). Ready for the last chunk: `creatures-hood-hoa` (N28).
- `*.png` — sprite sheets listed in `atlas.js`. Each sheet must also go into `ASSETS` in `sw.js`, then run `node tools/tools_sw_stamp.js`.

Keys: `SPR_*` (a sprite constant), `creature:<id>`, `boss:<id>`. Rect size = grid size x k (k = 1..8).

Fallbacks: missing/broken sheet, unknown key, wrong size, or `?ascii` in the URL → ASCII sprite. Opened from disk (`file://`), plain images still draw, but skin-tone and cursed variants use the ASCII sprite (the browser blocks reading the pixels).

Debug: `spriteImageStats()` in the console.
