# assets/sprites/

Image art for the N21 PNG sprite pipeline. The ASCII sprites in `js/sprites.js` / `js/data.js` stay the source of truth and the fallback.

- `atlas.js` — the index (`var SPRITE_ATLAS={version:1,sheets:[...]}`), loaded by a `<script>` tag before `js/spriteimg.js`. Format and rules are in its header comment. Ships empty; M13 fills it.
- `*.png` — sprite sheets listed in `atlas.js`. Each sheet must also go into `ASSETS` in `sw.js`, then run `node tools/tools_sw_stamp.js`.

Keys: `SPR_*` (a sprite constant), `creature:<id>`, `boss:<id>`. Rect size = grid size x k (k = 1..8).

Fallbacks: missing/broken sheet, unknown key, wrong size, or `?ascii` in the URL → ASCII sprite. Opened from disk (`file://`), plain images still draw, but skin-tone and cursed variants use the ASCII sprite (the browser blocks reading the pixels).

Debug: `spriteImageStats()` in the console.
