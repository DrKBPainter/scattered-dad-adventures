/* ===== SHATTERED DAD ADVENTURE — config.js =====
   Global constants, canvas reference, resize handler.
   Load this FIRST — everything else depends on it.
   =============================================== */

"use strict";
/* ===== SHATTERED DAD ADVENTURE v0.6 ===== */
const GAME_VERSION="0.11.0";
const TILE=32, VIEW_W=15, VIEW_H=10, MAP_W=40, MAP_H=30, MAXDEPTH=100;
const SPR_SIZE=32; /* creature/boss/ally sprites are 32x32 pixels (1 char = 1 pixel at scale 1) */
const SAVE_KEY="sda_save_v4", BESTIARY_KEY="sda_bestiary_v1", GRAVEYARD_KEY="sda_graveyard_v1", DAILY_KEY="sda_daily_v1";
const SHOW_HP_PER=5, INSPECT_PER_GROWTH=5;
const canvas=document.getElementById("screen"); const ctx=canvas.getContext("2d"); ctx.imageSmoothingEnabled=false;
canvas.width=VIEW_W*TILE; canvas.height=VIEW_H*TILE;
/* Zoom: 9 steps (100%-300%). +/= zooms in, - zooms out. */
let zoomStep=0;
const ZOOM_STEPS=[1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75,3.0];
/* fitCanvas: fractional CSS scaling fills large monitors without browser zoom needed.
   zoomStep scales the final CSS dimensions so the player can zoom in/out freely. */
function fitCanvas(){const cw=VIEW_W*TILE,ch=VIEW_H*TILE;const maxW=Math.min(window.innerWidth-32,2400),maxH=Math.min(window.innerHeight-220,1400);const s=Math.max(1,Math.min(maxW/cw,maxH/ch));const zm=ZOOM_STEPS[zoomStep]||1;canvas.style.width=Math.round(cw*s*zm)+"px";canvas.style.height=Math.round(ch*s*zm)+"px";}
window.addEventListener("resize",fitCanvas);
