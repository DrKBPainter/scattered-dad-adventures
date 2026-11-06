/* ===== SCATTERED DAD ADVENTURES -- tools/tools_make_icons.js (M10) =====
   Generates the PWA / home-screen icons from the game's own 32x32 ASCII Dad sprite,
   so the icon always matches the in-game art (option C: outline + drop shadow, no hand art).
   Output (project root): icons/icon-192.png, icons/icon-512.png, icons/icon-512-maskable.png,
                          icons/apple-touch-icon.png (180), icons/favicon-32.png
   Usage (from the project root, needs Node + Playwright with Chromium):
     node tools/tools_make_icons.js            (default Dad: grill)
     node tools/tools_make_icons.js tech       (any CLASSES id)
   ======================================================================= */
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const ROOT = path.resolve(__dirname, "..");
const DAD = process.argv[2] || "grill";
const OUT = path.join(ROOT, "icons");
const SPECS = [
  { file: "icon-192.png", size: 192, mask: false },
  { file: "icon-512.png", size: 512, mask: false },
  { file: "icon-512-maskable.png", size: 512, mask: true },
  { file: "apple-touch-icon.png", size: 180, mask: false, apple: true },   // iOS rounds the corners itself: full bleed, no frame
  { file: "favicon-32.png", size: 32, mask: false, tiny: true },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", e => console.error("page error:", e.message));
  await page.goto("file://" + path.join(ROOT, "ShatteredDadAdventure.html"));
  await page.waitForFunction(() => typeof CLASSES !== "undefined" && typeof _dsDrawSprite === "function");
  for (const s of SPECS) {
    const b64 = await page.evaluate(({ dad, size, mask, tiny, apple }) => {
      const cfg = (typeof PORTRAIT_CFG !== "undefined" && PORTRAIT_CFG[dad]) || { top: "#2a0d00", bot: "#6a2200", accent: "#d97a2b" };
      // 1) the sprite at 1x, current default skin
      const sp = document.createElement("canvas"); sp.width = 32; sp.height = 32; _dsDrawSprite(sp, dad);
      // 2) silhouette of the sprite (for outline + shadow)
      const sil = document.createElement("canvas"); sil.width = 32; sil.height = 32;
      const sx = sil.getContext("2d"); sx.drawImage(sp, 0, 0); sx.globalCompositeOperation = "source-in"; sx.fillStyle = "#07080c"; sx.fillRect(0, 0, 32, 32);
      // trim: bounding box of opaque pixels
      const d = sp.getContext("2d").getImageData(0, 0, 32, 32).data; let x0 = 32, y0 = 32, x1 = -1, y1 = -1;
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (d[(y * 32 + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      const bw = x1 - x0 + 3, bh = y1 - y0 + 3; // +2 for the 1px outline each side
      const cv = document.createElement("canvas"); cv.width = size; cv.height = size; const c = cv.getContext("2d"); c.imageSmoothingEnabled = false;
      // background: the comic-cover gradient + sunburst rays in the Dad's colors (full bleed)
      const g = c.createLinearGradient(0, 0, 0, size); g.addColorStop(0, cfg.top); g.addColorStop(1, cfg.bot); c.fillStyle = g; c.fillRect(0, 0, size, size);
      const cx = size / 2, cy = size * 0.52, R = size * 0.75, N = tiny ? 8 : 16;
      c.fillStyle = cfg.accent; c.globalAlpha = tiny ? 0.35 : 0.28;
      for (let i = 0; i < N; i++) { const a0 = (i / N) * Math.PI * 2, a1 = a0 + Math.PI / N; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R); c.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R); c.closePath(); c.fill(); }
      c.globalAlpha = 1;
      const rg = c.createRadialGradient(cx, cy, 0, cx, cy, size * 0.42); rg.addColorStop(0, "rgba(255,240,200,0.30)"); rg.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = rg; c.fillRect(0, 0, size, size);
      // sprite scale: integer, content inside the safe zone (maskable: 80% circle -> ~62% box)
      const box = size * (tiny ? 0.98 : mask ? 0.60 : apple ? 0.68 : 0.74);
      const k = Math.max(1, Math.floor(box / Math.max(bw, bh)));
      const ox = Math.round(cx - (bw * k) / 2), oy = Math.round(cy - (bh * k) / 2);
      const sxp = ox + k - x0 * k, syp = oy + k - y0 * k; // top-left of the 32x32 sprite on the icon
      // drop shadow, 1px outline (8 directions), then the sprite
      if (!tiny) { c.globalAlpha = 0.45; c.drawImage(sil, sxp + k * 2, syp + k * 2, 32 * k, 32 * k); c.globalAlpha = 1; }
      for (const [dx, dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]) c.drawImage(sil, sxp + dx * k, syp + dy * k, 32 * k, 32 * k);
      c.drawImage(sp, sxp, syp, 32 * k, 32 * k);
      // thin accent frame on the non-maskable icons (maskable/apple get cropped by the OS)
      if (!mask && !tiny && !apple) { c.strokeStyle = cfg.accent; c.lineWidth = Math.max(2, Math.round(size / 48)); c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, size - c.lineWidth, size - c.lineWidth); }
      return cv.toDataURL("image/png").split(",")[1];
    }, { dad: DAD, size: s.size, mask: s.mask, tiny: !!s.tiny, apple: !!s.apple });
    fs.writeFileSync(path.join(OUT, s.file), Buffer.from(b64, "base64"));
    console.log("wrote icons/" + s.file);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
