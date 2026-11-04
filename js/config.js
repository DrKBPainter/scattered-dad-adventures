/* ===== SCATTERED DAD ADVENTURES — config.js =====
   Global constants, canvas reference, resize handler.
   Load this FIRST — everything else depends on it.
   =============================================== */

"use strict";
/* ===== SCATTERED DAD ADVENTURES v0.6 ===== */
const GAME_VERSION="0.11.0";
const TILE=32, MAP_W=40, MAP_H=30, MAXDEPTH=100;
/* M5: VIEW_W/VIEW_H are variables now (dynamic viewport, set by fitCanvas). RENDER_SCALE = integer backing-store factor. */
let VIEW_W=15, VIEW_H=10, RENDER_SCALE=1;
const SPR_SIZE=32; /* creature/boss/ally sprites are 32x32 pixels (1 char = 1 pixel at scale 1) */
const SAVE_KEY="sda_save_v4", BESTIARY_KEY="sda_bestiary_v1", GRAVEYARD_KEY="sda_graveyard_v1", DAILY_KEY="sda_daily_v1";
const SHOW_HP_PER=5, INSPECT_PER_GROWTH=5;
const canvas=document.getElementById("screen"); const ctx=canvas.getContext("2d"); ctx.imageSmoothingEnabled=false;
canvas.width=VIEW_W*TILE; canvas.height=VIEW_H*TILE;
/* Zoom: 9 steps (100%-300%). +/= zooms in, - zooms out. */
let zoomStep=0;
const ZOOM_STEPS=[1.0,1.25,1.5,1.75,2.0,2.25,2.5,2.75,3.0];
/* ===== M5 DYNAMIC VIEWPORT + HiDPI (mobile plan) =====
   pickViewport(w,h) chooses the tile grid from the window shape:
     landscape / desktop      15x10 (unchanged desktop build)
     portrait phone            9x13
     portrait tablet (w>=700) 11x15
     landscape touch tablet   17x12 (coarse pointer, short side >= 600)
   Override for testing: ?view=WxH in the URL (W 7-25, H 7-20).
   fitCanvas: fractional CSS scaling fills the window (may shrink below 1x on small phones);
   zoomStep scales the final CSS size. The backing store is an INTEGER multiple (RENDER_SCALE)
   of the logical VIEW_W*TILE x VIEW_H*TILE size, chosen from CSS scale x devicePixelRatio,
   and ctx carries a matching setTransform, so all draw code keeps using logical pixels. */
function _viewOverride(){try{const m=/[?&]view=(\d+)x(\d+)/i.exec((typeof location!=="undefined"&&location&&location.search)||"");if(m){const w=+m[1],h=+m[2];if(w>=7&&w<=25&&h>=7&&h<=20)return[w,h];}}catch(e){}return null;}
function _coarsePointer(){try{return !!(typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(pointer: coarse)").matches);}catch(e){return false;}}
function pickViewport(w,h){const o=_viewOverride();if(o)return o;
 if(!(w>0&&h>0))return[15,10];
 if(h>w*1.15)return w>=700?[11,15]:[9,13];
 if(_coarsePointer()&&Math.min(w,h)>=600)return[17,12];
 return[15,10];}
function fitCanvas(){const iw=window.innerWidth||0,ih=window.innerHeight||0;const v=pickViewport(iw,ih);VIEW_W=v[0];VIEW_H=v[1];
 const cw=VIEW_W*TILE,ch=VIEW_H*TILE;const maxW=Math.min((iw||cw+32)-32,2400),maxH=Math.min((ih||ch+220)-220,1400);
 const s=Math.max(0.5,Math.min(maxW/cw,maxH/ch));const zm=ZOOM_STEPS[zoomStep]||1;
 canvas.style.width=Math.round(cw*s*zm)+"px";canvas.style.height=Math.round(ch*s*zm)+"px";
 const dpr=(typeof window.devicePixelRatio==="number"&&window.devicePixelRatio>0)?window.devicePixelRatio:1;
 const k=Math.max(1,Math.min(4,Math.ceil(s*zm*dpr-0.01)));
 if(canvas.width!==cw*k||canvas.height!==ch*k){canvas.width=cw*k;canvas.height=ch*k;}
 RENDER_SCALE=k;try{ctx.setTransform(k,0,0,k,0,0);}catch(e){}ctx.imageSmoothingEnabled=false;
 if(typeof markDirty==="function")markDirty();}
window.addEventListener("resize",fitCanvas);
window.addEventListener("orientationchange",fitCanvas);
