/* ===== SCATTERED DAD ADVENTURES — config.js =====
   Global constants, canvas reference, resize handler.
   Load this FIRST — everything else depends on it.
   =============================================== */

"use strict";
/* ===== SCATTERED DAD ADVENTURES v0.6 ===== */
const GAME_VERSION="1.0.0";
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
/* MOB-04: zooming out past 100% shows MORE tiles (wider view) instead of shrinking the canvas. zoomOut 0 = normal view;
   each step multiplies the base tile grid by ZOOM_OUT_STEPS[n-1]; the last step always fits the whole 40x30 floor. */
let zoomOut=0,_vBase=[15,10];const ZOOM_OUT_STEPS=[1.5,2.25,3.25];
function _zoomOutList(vw,vh){const full=Math.max(MAP_W/vw,MAP_H/vh);const l=ZOOM_OUT_STEPS.filter(f=>f<full-0.05);l.push(full);return l;}
function canZoomOut(){return zoomStep>0||zoomOut<_zoomOutList(_vBase[0],_vBase[1]).length;}
function zoomOutIsFull(){return zoomOut>0&&zoomOut>=_zoomOutList(_vBase[0],_vBase[1]).length;}
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
function fitCanvas(){const iw=window.innerWidth||0,ih=window.innerHeight||0;const _l=_m6Layout(iw,ih);const v=pickViewport(iw,ih);
 /* MOB-55: phone/tablet landscape: the map fills the left half of the screen, so its tile count follows that half's shape
    (rows stay as picked; columns = rows x half width / height, never more than picked). ?view=WxH still wins. */
 if(_l&&_l.land&&!_viewOverride()&&_l.maxH>0)v[0]=Math.max(5,Math.min(v[0],Math.round(v[1]*_l.maxW/_l.maxH)));
 VIEW_W=v[0];VIEW_H=v[1];_vBase=[v[0],v[1]];
 if(zoomOut>0){const zl=_zoomOutList(v[0],v[1]);if(zoomOut>zl.length)zoomOut=zl.length;const zf=zl[zoomOut-1];VIEW_W=Math.round(v[0]*zf);VIEW_H=Math.round(v[1]*zf);if(zoomOut===zl.length){VIEW_W=Math.max(VIEW_W,MAP_W);VIEW_H=Math.max(VIEW_H,MAP_H);}}
 let cw=VIEW_W*TILE,ch=VIEW_H*TILE;let maxW=Math.min((iw||cw+32)-32,2400),maxH=Math.min((ih||ch+220)-220,1400);
 if(_l){maxW=Math.max(60,_l.maxW);maxH=Math.max(60,_l.maxH);}
 let zm=ZOOM_STEPS[zoomStep]||1;
 /* MOB-29: on phones/tablets zooming in shows fewer, larger tiles inside the same map box (the canvas never grows past
    its slot, so the HUD and buttons stay put and the page never overflows). Desktop keeps the enlarged canvas. */
 if(_l&&zm>1&&zoomOut===0){VIEW_W=Math.max(3,Math.round(v[0]/zm));VIEW_H=Math.max(3,Math.round(v[1]/zm));cw=VIEW_W*TILE;ch=VIEW_H*TILE;zm=1;}
 const s=Math.max(zoomOut>0?0.05:0.5,Math.min(maxW/cw,maxH/ch));
 canvas.style.width=Math.round(cw*s*zm)+"px";canvas.style.height=Math.round(ch*s*zm)+"px";
 const dpr=(typeof window.devicePixelRatio==="number"&&window.devicePixelRatio>0)?window.devicePixelRatio:1;
 const k=Math.max(1,Math.min(4,Math.ceil(s*zm*dpr-0.01)));
 if(canvas.width!==cw*k||canvas.height!==ch*k){canvas.width=cw*k;canvas.height=ch*k;}
 RENDER_SCALE=k;try{ctx.setTransform(k,0,0,k,0,0);}catch(e){}ctx.imageSmoothingEnabled=false;
 if(typeof markDirty==="function")markDirty();}
/* ===== M6 RESPONSIVE SHELL =====
   Compact (phone/tablet) layout when the window is small (w<760 or h<560) or the primary pointer is touch. Portrait: canvas on top,
   HUD + controls below; the canvas gets whatever height the HUD/D-pad/action bar leave
   (measured, with safe-area padding from #wrap). Landscape: canvas left, side column right.
   During play the reserve only ever grows (largest HUD / control heights seen), so the
   canvas does not jump when the D-pad hides for an overlay or the aim bar appears. */
let COMPACT=false,LANDSCAPE_UI=false,_m6Play=false,_m6HudMax=0,_m6CtlMax=0,_m6Key="";
function _isCompact(w,h){return w>0&&h>0&&(w<760||h<560||_coarsePointer());}
function _m6H(id){try{const e=document.getElementById(id);return(e&&e.offsetHeight>0)?e.offsetHeight:0;}catch(e){return 0;}}
function _m6Layout(iw,ih){
 /* innerWidth/Height grow when content overflows on mobile (page zooms out), so size from the layout viewport. */
 try{const de=document.documentElement;if(de&&de.clientWidth>0)iw=Math.min(iw||de.clientWidth,de.clientWidth);if(de&&de.clientHeight>0)ih=Math.min(ih||de.clientHeight,de.clientHeight);}catch(e){}
 COMPACT=_isCompact(iw,ih);LANDSCAPE_UI=COMPACT&&iw>ih;
 const key=iw+"x"+ih;if(key!==_m6Key){_m6Key=key;_m6HudMax=0;_m6CtlMax=0;}
 try{const b=document.body;if(b&&b.classList){b.classList.toggle("m-compact",COMPACT);b.classList.toggle("m-land",LANDSCAPE_UI);}}catch(e){}
 if(!COMPACT)return null;
 let pt=4,pr=4,pb=4,pl=4,gap=4;
 try{const cs=getComputedStyle(document.getElementById("wrap"));pt=parseFloat(cs.paddingTop)||0;pr=parseFloat(cs.paddingRight)||0;pb=parseFloat(cs.paddingBottom)||0;pl=parseFloat(cs.paddingLeft)||0;gap=parseFloat(cs.rowGap)||0;}catch(e){}
 const bord=2;
 /* MOB-55: landscape: the map column is exactly the left half of the screen (the column gap straddles the middle);
    HUD, log, D-pad and buttons take the right half. The column width goes to CSS as --m55-mapw on #wrap. */
 if(LANDSCAPE_UI){let cg=6;try{cg=parseFloat(getComputedStyle(document.getElementById("wrap")).columnGap)||6;}catch(e){}
  const colW=Math.max(60,Math.floor(iw/2-pl-cg/2));try{document.getElementById("wrap").style.setProperty("--m55-mapw",colW+"px");}catch(e){}
  return{land:true,maxW:colW-bord,maxH:ih-pt-pb-bord};}
 let hud=_m6H("hud"),ctl=0;const dp=_m6H("dpad"),ab=_m6H("actionbar"),am=_m6H("aimbar");
 if(dp)ctl+=dp+gap;if(ab)ctl+=ab+gap;if(am&&!dp&&!ab)ctl=am+gap;
 if(_m6Play){_m6HudMax=Math.max(_m6HudMax,hud);_m6CtlMax=Math.max(_m6CtlMax,ctl);hud=_m6HudMax;ctl=_m6CtlMax;}
 return{maxW:iw-pl-pr-bord,maxH:ih-pt-pb-bord-(hud?hud+gap:0)-ctl};}
/* Called from syncUI(): marks live play (log collapses to 2 lines) and refits when the mode changes. */
function _m6SetMode(play){play=!!play;try{const b=document.body;if(b&&b.classList)b.classList.toggle("m-play",play);
 const lg=document.getElementById("log");if(lg&&lg.classList){lg.classList.toggle("log-play",play);if(!play){lg.classList.remove("log-open");const h=document.getElementById("hud");if(h&&h.classList)h.classList.remove("log-open-host");}}}catch(e){}
 if(play!==_m6Play){_m6Play=play;_m6HudMax=0;_m6CtlMax=0;if(COMPACT)_m6Refit();}}
let _m6Q=false;
function _m6Refit(){if(_m6Q)return;_m6Q=true;const f=()=>{_m6Q=false;fitCanvas();};try{requestAnimationFrame(f);}catch(e){_m6Q=false;}}
(function _m6Observe(){try{if(typeof ResizeObserver!=="function")return;const ro=new ResizeObserver(()=>{if(COMPACT&&!LANDSCAPE_UI)_m6Refit();});
 ["hud","dpad","actionbar","aimbar"].forEach(id=>{const e=document.getElementById(id);if(e)ro.observe(e);});}catch(e){}})();
window.addEventListener("resize",fitCanvas);
window.addEventListener("orientationchange",fitCanvas);
