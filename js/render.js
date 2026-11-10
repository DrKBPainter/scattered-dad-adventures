/* ===== SCATTERED DAD ADVENTURES -- render.js =====
   Canvas rendering: drawSprite, drawWorld, drawFX, inspect display.
   Depends on: sprites.js, data.js, game.js
   =============================================== */

/* M3 SPRITE CACHE (mobile plan). Each ASCII sprite is rasterized ONCE per (remap,colorMap) variant to an
   offscreen canvas; drawSprite/drawSpriteRemap then issue a single drawImage instead of ~1,024 fillRects.
   Falls back to the original per-pixel path when no offscreen canvas exists (node harness, old browsers).
   N21 PNG PIPELINE: registerSpriteImage(spr,img) attaches image art (an Image or canvas whose size is the
   ASCII grid size times an integer k, 1-8) to a sprite. _sprCached then returns the image for every draw:
   plain draws use it as-is; skin colorMap / curse remap variants are baked once per variant by recoloring
   the image pixels whose ASCII cell char changes color (luminance ratio vs the PAL source color, so the
   shading ramp is kept), and cached. If the pixels cannot be read (file:// taint) or the image is missing,
   that draw falls back to the cached ASCII raster. Loader: js/spriteimg.js + assets/sprites/atlas.js. */
const _sprIdCache=new WeakMap(),_sprKeyCache=new Map(),_sprImg=new WeakMap();let _sprCacheOK=null;
function _sprPx(spr,remap,colorMap,put){for(let y=0;y<spr.length;y++){const row=spr[y];for(let x=0;x<row.length;x++){let ch=row[x];if(remap&&remap[ch])ch=remap[ch];const c=(colorMap&&colorMap[ch])?colorMap[ch]:PAL[ch];if(!c)continue;put(c,x,y);}}}
function _sprDirect(spr,dx,dy,sc,remap,colorMap){_sprPx(spr,remap,colorMap,(c,x,y)=>{ctx.fillStyle=c;ctx.fillRect(dx+x*sc,dy+y*sc,sc,sc);});}
function _sprNewCanvas(w,h){try{if(typeof document==="undefined"||!document.createElement)return null;const c=document.createElement("canvas");if(!c||typeof c.getContext!=="function")return null;c.width=w;c.height=h;const x=c.getContext("2d");if(!x||typeof x.fillRect!=="function")return null;return{c,x};}catch(e){return null;}}
function _sprVKey(remap,colorMap){let k="";if(remap)for(const a of Object.keys(remap).sort())k+=a+remap[a];k+="|";if(colorMap)for(const a of Object.keys(colorMap).sort())k+=a+colorMap[a]+",";return k;}
function _sprRecord(spr){let r=_sprIdCache.get(spr);if(r)return r;const ck=spr.join("\n");r=_sprKeyCache.get(ck);if(!r){let w=0;for(const row of spr)if(row.length>w)w=row.length;r={w,h:spr.length,v:new Map()};if(_sprKeyCache.size>4000)_sprKeyCache.clear();_sprKeyCache.set(ck,r);}_sprIdCache.set(spr,r);return r;}
function _sprCached(spr,remap,colorMap){const r=_sprRecord(spr);const vk=_sprVKey(remap,colorMap);const ie=_sprImg.get(spr);if(ie){const iv=_sprImgVariant(ie,spr,remap,colorMap,vk);if(iv)return{cv:iv,w:r.w,h:r.h,img:true};}let cv=r.v.get(vk);if(cv)return{cv,w:r.w,h:r.h};const o=_sprNewCanvas(r.w||1,r.h||1);if(!o)return null;_sprPx(spr,remap,colorMap,(c,x,y)=>{o.x.fillStyle=c;o.x.fillRect(x,y,1,1);});cv=o.c;if(r.v.size>64)r.v.clear();r.v.set(vk,cv);return{cv,w:r.w,h:r.h};}
function _sprBlit(spr,dx,dy,sc,remap,colorMap){sc=sc||1;if(!spr||!spr.length)return;if(_sprCacheOK===null)_sprCacheOK=!!_sprNewCanvas(1,1);if(!_sprCacheOK){_sprDirect(spr,dx,dy,sc,remap,colorMap);return;}const e=_sprCached(spr,remap,colorMap);if(!e){_sprDirect(spr,dx,dy,sc,remap,colorMap);return;}ctx.imageSmoothingEnabled=false;ctx.drawImage(e.cv,dx,dy,e.w*sc,e.h*sc);}
function _sprImgDims(img){return{w:img.naturalWidth||img.width||0,h:img.naturalHeight||img.height||0};}
function registerSpriteImage(spr,img){if(!spr||typeof spr!=="object"||!spr.length||!img)return false;if(img.complete===false){if(img.addEventListener)img.addEventListener("load",()=>registerSpriteImage(spr,img),{once:true});return false;}
 const r=_sprRecord(spr),d=_sprImgDims(img),k=r.w?d.w/r.w:0;if(!(k>=1&&k<=8&&k===Math.floor(k)&&d.h===r.h*k)){if(typeof console!=="undefined"&&console.warn)console.warn("sprite image rejected: "+d.w+"x"+d.h+" does not fit a "+r.w+"x"+r.h+" grid");return false;}
 const chars=new Set();for(const row of spr)for(const ch of row)chars.add(ch);_sprImg.set(spr,{img,k,W:d.w,H:d.h,chars,v:new Map()});if(typeof markDirty==="function")markDirty();return true;}
function unregisterSpriteImage(spr){if(spr&&_sprImg.has(spr)){_sprImg.delete(spr);if(typeof markDirty==="function")markDirty();}}
/* M14: environment tile art. Keys tile:<biome>:floor|wall:<n>, tile:<biome>:edge:n|e|s|w, tile:<biome>:shade:n|w,
   tile:all:water:<n> (assets/sprites/tiles.png via spriteimg.js). A biome draws tile art only when its floor:0 and wall:0
   are registered; otherwise drawWorld keeps the ASCII floor/wall sprites (so ?ascii and file-less runs are unchanged).
   Variant picks hash the map cell + depth (no RNG). Edges/shades only look at SEEN neighbours (no map info leak). */
const _tileArt=new Map(),_tileSets=new Map();
function registerTileImage(key,img){if(typeof key!=="string"||!/^tile:[a-z]+:[a-z]+:[a-z0-9]+$/.test(key)||!img)return false;const d=_sprImgDims(img);if(d.w!==TILE||d.h!==TILE){if(typeof console!=="undefined"&&console.warn)console.warn("tile image rejected: "+key+" "+d.w+"x"+d.h);return false;}_tileArt.set(key,img);_tileSets.clear();if(typeof markDirty==="function")markDirty();return true;}
function tileArtStats(){return{tiles:_tileArt.size};}
function _tileSlug(depth){const L=(typeof TILE_BIOMES!=="undefined")?TILE_BIOMES:null;if(!L)return null;return L[Math.max(0,Math.min(L.length-1,Math.floor(((depth||1)-1)/10)))];}
function _tileSet(depth){if(!_tileArt.size)return null;const b=_tileSlug(depth);if(!b)return null;if(_tileSets.has(b))return _tileSets.get(b);
 const g=k=>_tileArt.get("tile:"+b+":"+k)||null,list=(kind,pre)=>{const a=[];for(let n=0;n<8;n++){const i=_tileArt.get(pre+kind+":"+n);if(i)a.push(i);else break;}return a;};
 const fl=list("floor","tile:"+b+":"),wa=list("wall","tile:"+b+":");
 const ts=(fl.length&&wa.length)?{fl,wa,wt:list("water","tile:all:"),eN:g("edge:n"),eE:g("edge:e"),eS:g("edge:s"),eW:g("edge:w"),sN:g("shade:n"),sW:g("shade:w")}:null;
 _tileSets.set(b,ts);return ts;}
function _tileHash(x,y,z){let h=(x*374761393+y*668265263+z*1442695041)|0;h=Math.imul(h^(h>>>13),1274126177);return(h^(h>>>16))>>>0;}
function _tilePick(a,h,common){if(a.length<2)return a[0];if(h%100<common)return a[0];return a[1+((h>>>8)%(a.length-1))];}
/* draws the base tile (+ wall edges / floor shade) for one map cell; false = caller draws the ASCII sprite */
function _drawTileArt(ts,tg,mx,my,px,py){const G=game.floor.grid,S=game.seen,h=_tileHash(mx,my,game.depth|0);
 const sw=(x,y)=>x>=0&&y>=0&&x<MAP_W&&y<MAP_H&&G[y][x]===1&&S[y][x],so=(x,y)=>x>=0&&y>=0&&x<MAP_W&&y<MAP_H&&G[y][x]!==1&&S[y][x];
 ctx.imageSmoothingEnabled=false;const d=i=>{if(i)ctx.drawImage(i,px,py,TILE,TILE);};
 if(tg===1){d(_tilePick(ts.wa,h,80));if(so(mx,my-1))d(ts.eN);if(so(mx+1,my))d(ts.eE);if(so(mx,my+1))d(ts.eS);if(so(mx-1,my))d(ts.eW);return true;}
 if(tg===2){if(!ts.wt.length)return false;d(ts.wt[h%ts.wt.length]);}else d(_tilePick(ts.fl,h,70));
 if(sw(mx,my-1))d(ts.sN);if(sw(mx-1,my))d(ts.sW);return true;}
function hasSpriteImage(spr){return !!(spr&&typeof spr==="object"&&_sprImg.get(spr));}
const _sprHexC=new Map();function _sprHex(h){let v=_sprHexC.get(h);if(v)return v;const m=/^#?([0-9a-f]{6})$/i.exec(h||"");v=m?[parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)]:[0,0,0];_sprHexC.set(h,v);return v;}
/* image variant for (remap,colorMap): the image itself when no cell changes color; a baked recolor otherwise; null = use ASCII */
function _sprImgVariant(e,spr,remap,colorMap,vk){const ch=new Map();for(const c of e.chars){const src=PAL[c];if(!src)continue;const c2=(remap&&remap[c])?remap[c]:c;const t=(colorMap&&colorMap[c2])?colorMap[c2]:PAL[c2];if(t!==src)ch.set(c,t||null);}
 if(!ch.size)return e.img;if(e.v.has(vk))return e.v.get(vk);if(e.v.size>64)e.v.clear();
 const o=_sprNewCanvas(e.W,e.H);if(!o){e.v.set(vk,null);return null;}let d;try{o.x.drawImage(e.img,0,0);d=o.x.getImageData(0,0,e.W,e.H);}catch(err){e.v.set(vk,null);return null;}
 const a=d.data,k=e.k;for(let gy=0;gy<spr.length;gy++){const row=spr[gy];for(let gx=0;gx<row.length;gx++){const c=row[gx];if(!ch.has(c))continue;const t=ch.get(c),s=_sprHex(PAL[c]),ls=0.299*s[0]+0.587*s[1]+0.114*s[2]+1,tc=t?_sprHex(t):null;
  for(let yy=gy*k;yy<gy*k+k;yy++)for(let xx=gx*k;xx<gx*k+k;xx++){const i=(yy*e.W+xx)*4;if(!a[i+3])continue;if(!tc){a[i+3]=0;continue;}const f=(0.299*a[i]+0.587*a[i+1]+0.114*a[i+2]+1)/ls;a[i]=Math.min(255,Math.round(tc[0]*f));a[i+1]=Math.min(255,Math.round(tc[1]*f));a[i+2]=Math.min(255,Math.round(tc[2]*f));}}}
 o.x.putImageData(d,0,0);e.v.set(vk,o.c);return o.c;}
function spriteCacheStats(){let variants=0;for(const r of _sprKeyCache.values())variants+=r.v.size;return{enabled:!!_sprCacheOK,sprites:_sprKeyCache.size,variants};}
function drawSprite(spr,dx,dy,sc){_sprBlit(spr,dx,dy,sc||1,null,null);}
/* Draw sprite with palette-char substitution. remap = {fromChar:toChar,...} */
function drawSpriteRemap(spr,dx,dy,sc,remap,colorMap){const hasR=remap&&Object.keys(remap).length;_sprBlit(spr,dx,dy,sc,hasR?remap:null,colorMap||null);}
/* skinColorMap: direct char->hex override for the dad's skin chars 'f'/'F'.
   In PLAY uses game.skin; on the CLASS-select screen uses skinCursor. */
function skinColorMap(){let idx=0;if(typeof game!=="undefined"&&game&&typeof game.skin==="number")idx=game.skin;else if(typeof skinCursor!=="undefined"&&typeof skinCursor==="number")idx=skinCursor;const list=(typeof SKIN_SWATCHES!=="undefined")?SKIN_SWATCHES:null;const s=list?list[((idx%list.length)+list.length)%list.length]:null;return s?{'f':s.f,'F':s.F}:null;}
/* Select the 32x32 sprite for the current class */
function dadSprite(){let id;if(typeof game==="undefined"||!game||!game.cls){if(typeof CLASSES!=="undefined"&&typeof classCursor!=="undefined"&&CLASSES[classCursor])id=CLASSES[classCursor].id;else return SPR_DAD;}else{id=game.cls.id;}if(id==="grill")return SPR_DAD_GRILL;if(id==="diy")return SPR_DAD_DIY;if(id==="tech")return SPR_DAD_TECH;if(id==="gym")return SPR_DAD_GYM;if(id==="tactical")return SPR_DAD_TACTICAL;if(id==="sports")return SPR_DAD_SPORTS;if(id==="yard")return SPR_DAD_YARD;return SPR_DAD;}
/* Build palette remap for cursed state (turns grays/blues red) */
function dadVisRemap(){const remap={};const hasCurse=game&&game.equip&&typeof SLOTS!=="undefined"&&SLOTS.some(s=>typeof isCursed==="function"&&isCursed(game.equip[s]));if(hasCurse){remap['s']='r';remap['S']='R';remap['2']='R';}return remap;}
/* Draw the hero sprite (32x32) with cursed remap and equipped-weapon indicator */
function drawDad(dx,dy,sc){sc=sc||1;const spr=dadSprite();const remap=(typeof game!=="undefined"&&game)?dadVisRemap():{};drawSpriteRemap(spr,dx,dy,sc,remap,skinColorMap());if(typeof game==="undefined"||!game)return;if(game.equip&&game.equip.weapon){ctx.fillStyle=PAL['y'];ctx.fillRect(dx+24*sc,dy+18*sc,sc,sc);ctx.fillRect(dx+24*sc,dy+19*sc,sc,sc);}}
/* N29 PLAYER ANIMATION (mobile plan). A 4-frame walk cycle (left step, pass, right step, pass) and a basic attack
   frame (lunge + lean toward the target, with a short swing streak), cut at draw time from the Dad's cached sprite
   (PNG art or ASCII raster, skin/curse variant included): the sprite is drawn as 3 slices (left leg, right leg,
   upper body) with per-frame pixel offsets (the leg slices start as many rows higher as the body is raised, so no seam opens). The leg split is found once per sprite from the ASCII grid (lowest rows
   with a gap between the legs). Purely visual: a step is detected in drawWorld when game.px/py moves by one tile on
   the same floor; attack(e) in game.js calls dadAnimAttack(dx,dy). Each plays ~200 ms via requestAnim (M4), then the
   idle frame is the unchanged drawDad(). Off with ?noanim or prefers-reduced-motion. dadAnimStats() for tests. */
const DAD_STEP_MS=110,DAD_WALK_MS=200,DAD_LUNGE_MS=130,DAD_ATK_MS=200,DAD_SLASH_MS=90;
const _daGeo=new WeakMap();let _daOff=null,_daLast=null,_daWalk=null,_daAtk=null,_daStep=0,_daWalks=0,_daAtks=0,_daFrames=0;
function _daOn(){if(_daOff===null){_daOff=false;try{if(typeof location!=="undefined"&&location&&/[?&]noanim(?:[=&]|$)/.test(location.search||""))_daOff=true;}catch(e){}}return !_daOff&&juiceMotion();}/* M15: the MOTION toggle / prefers-reduced-motion (juiceMotion) also governs the walk + attack frames */
function _daLegs(spr){let g=_daGeo.get(spr);if(g)return g;const H=spr.length;let top=-1,mid=0,n=0;
 for(let y=H-1;y>=0;y--){const row=spr[y]||"";let a=-1,b=-1;for(let x=0;x<row.length;x++)if(row[x]!=="."){if(a<0)a=x;b=x;}
  if(a<0){if(top<0)continue;break;}let best=null;for(let x=a+1;x<b;x++){if(row[x]!==".")continue;let e=x;while(e+1<b&&row[e+1]===".")e++;const m=(x+e)/2;if(!best||Math.abs(m-15.5)<Math.abs(best-15.5))best=m;x=e;}
  if(best===null||Math.abs(best-15.5)>6)break;top=y;mid+=best;n++;}
 if(top<0||H-top<4){top=H-8;g={top:top,split:16};}else{if(H-top>14)top=H-14;g={top:top,split:Math.ceil(mid/n)};}
 _daGeo.set(spr,g);return g;}
function dadAnimAttack(dx,dy){if(!_daOn())return;_daAtk={t0:_rNow(),dx:Math.sign(dx||0),dy:Math.sign(dy||0)};_daWalk=null;_daAtks++;requestAnim(DAD_ATK_MS+40);}
function _daTrack(){if(typeof game==="undefined"||!game)return;const L=_daLast;if(L&&L.g===game&&L.d===game.depth){const ddx=game.px-L.x,ddy=game.py-L.y;if((ddx||ddy)&&Math.abs(ddx)<=1&&Math.abs(ddy)<=1&&_daOn()){_daStep++;_daWalks++;_daWalk={t0:_rNow(),left:(_daStep&1)===1};_daAtk=null;requestAnim(DAD_WALK_MS+40);}}else{_daWalk=null;_daAtk=null;}
 _daLast={g:game,d:game.depth,x:game.px,y:game.py};}
function _daFrame(){if(!_daOn())return null;const n=_rNow();
 if(_daAtk){const t=n-_daAtk.t0,a=_daAtk;if(t>=0&&t<DAD_ATK_MS){const lg=t<DAD_LUNGE_MS;const L=lg?5:2;return{k:lg?"attack":"recover",x:a.dx*L,y:a.dy*L,b:0,bx:a.dx*(lg?2:1),by:a.dy*(lg?1:0),l:0,r:0,slash:t<DAD_SLASH_MS?a:null};}_daAtk=null;}
 if(_daWalk){const t=n-_daWalk.t0;if(t>=0&&t<DAD_WALK_MS){if(t<DAD_STEP_MS)return _daWalk.left?{k:"stepL",x:0,y:0,b:-1,bx:0,by:0,l:-2,r:0}:{k:"stepR",x:0,y:0,b:-1,bx:0,by:0,l:0,r:-2};return{k:"pass",x:0,y:0,b:1,bx:0,by:0,l:0,r:0};}_daWalk=null;}
 return null;}
function dadAnimStats(){const f=_daFrame();return{on:_daOn(),walks:_daWalks,attacks:_daAtks,frames:_daFrames,frame:f?f.k:"idle"};}
function _daBlit(e,sx,sy,sw,sh,dx,dy,sc){if(sw<=0||sh<=0)return;const k=_sprImgDims(e.cv).w/e.w||1;ctx.drawImage(e.cv,sx*k,sy*k,sw*k,sh*k,dx+sx*sc,dy+sy*sc,sw*sc,sh*sc);}
/* drawWorld's Dad: the animated frame when one is playing, else exactly drawDad() */
function drawDadAnim(dx,dy,sc){sc=sc||1;_daTrack();const f=_daFrame();if(!f){drawDad(dx,dy,sc);return;}
 const spr=dadSprite();const remap=dadVisRemap();const hasR=remap&&Object.keys(remap).length;if(_sprCacheOK===null)_sprCacheOK=!!_sprNewCanvas(1,1);
 const e=_sprCacheOK?_sprCached(spr,hasR?remap:null,skinColorMap()):null;if(!e||!e.cv){drawDad(dx,dy,sc);return;}
 const g=_daLegs(spr),W=e.w,H=e.h,lt=Math.max(0,g.top-Math.max(0,-(f.b+f.by))),ox=dx+f.x*sc,oy=dy+f.y*sc;ctx.imageSmoothingEnabled=false;_daFrames++;
 _daBlit(e,0,lt,g.split,H-lt,ox,oy+f.l*sc,sc);_daBlit(e,g.split,lt,W-g.split,H-lt,ox,oy+f.r*sc,sc);
 const bx=ox+f.bx*sc,by=oy+(f.b+f.by)*sc;_daBlit(e,0,0,W,g.top,bx,by,sc);
 if(game.equip&&game.equip.weapon){ctx.fillStyle=PAL['y'];ctx.fillRect(bx+24*sc,by+18*sc,sc,sc);ctx.fillRect(bx+24*sc,by+19*sc,sc,sc);}
 if(f.slash&&(f.slash.dx||f.slash.dy)){const a=f.slash,cx=dx+16*sc+a.dx*22*sc,cy=dy+16*sc+a.dy*22*sc,px=-a.dy,py=a.dx;ctx.fillStyle="#f4f1e8";
  for(let i=-3;i<=3;i++){const bend=-Math.abs(i);ctx.fillRect(Math.round(cx+(px*i*2+a.dx*bend)*sc)-sc,Math.round(cy+(py*i*2+a.dy*bend)*sc)-sc,2*sc,2*sc);}}}
/* ===== M15 GAME FEEL ("juice", mobile plan) =====
   Purely visual: no game state is changed and Math.random is never called (all jitter comes from _tileHash), so
   seeded runs and the harness are unaffected. Everything is detected at draw time in drawWorld by comparing each
   entity with what the previous drawn frame saw (position, hp, presence), so every damage source is covered
   without hooks in game.js:
   - tweened movement (JUICE_TWEEN_MS): Dad, camera, enemies and the companion glide one tile instead of jumping;
   - hit flash (white silhouette) + knockback nudge on enemies, floating numbers (-n red/white, +n green, KO gold);
   - death puff particles when a visible enemy disappears (gold and bigger for bosses);
   - small screen shake on big hits, boss kills and HOA phase changes; red edge vignette when the Dad is hurt;
   - boss banner when a boss first comes into view, and on each HOA finale phase change;
   - smooth FOV falloff: a radial darkening toward the edge of the Dad's sight radius (not motion; stays on).
   Motion (everything except lighting and a static banner) follows juiceMotion(): the in-game MOTION toggle
   (localStorage sda_motion "1"/"0"), else off under prefers-reduced-motion. N29's walk/attack frames use the same
   switch. ?nojuice turns all of M15 off (frames identical to the pre-M15 build); ?nolight turns off only the
   lighting. juiceStats() for tests. */
const JUICE_TWEEN_MS=80,JUICE_FLASH_MS=110,JUICE_KNOCK_MS=120,JUICE_FLOAT_MS=650,JUICE_PUFF_MS=450,JUICE_VIG_MS=280,JUICE_BANNER_MS=1800;
const JUICE_BOSS_SUBS=["It has been expecting you. It has a clipboard.","It has read the reviews. It wrote some of them.","There is no appointment. It does not need one.","It knows about the garage. Everyone knows about the garage.","It was here first. It will remind you of this."];
let _jzOff=null,_jzNoLight=null,_jzKey=null,_jzE=new WeakMap(),_jzPrev=[],_jzCam=null,_jzDad=null,_jzAlly=null,_jzFx=[],_jzShake=null,_jzVig=null,_jzBanner=null,_jzBossSeen=new WeakSet();
const _jzStats={tweens:0,flashes:0,floats:0,puffs:0,shakes:0,banners:0,vignettes:0,knocks:0,lit:0};let _jzLast={cam:[0,0],dad:[0,0],shake:[0,0]};
const _jzSilC=new WeakMap();
function _jzQ(re){try{return typeof location!=="undefined"&&location&&re.test(location.search||"");}catch(e){return false;}}
function juiceOn(){if(_jzOff===null)_jzOff=_jzQ(/[?&]nojuice(?:[=&]|$)/);return !_jzOff;}
function _jzLightOn(){if(_jzNoLight===null)_jzNoLight=_jzQ(/[?&]nolight(?:[=&]|$)/);return juiceOn()&&!_jzNoLight;}
function juiceMotion(){let p=null;try{p=localStorage.getItem("sda_motion");}catch(e){}if(p==="1")return true;if(p==="0")return false;
 try{if(typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches)return false;}catch(e){}return true;}
function setJuiceMotion(on){try{localStorage.setItem("sda_motion",on?"1":"0");}catch(e){}if(!on){_jzFx=[];_jzShake=null;_jzVig=null;_jzCam=null;_jzDad=null;_jzAlly=null;_daWalk=null;_daAtk=null;}if(typeof syncMotionBtn==="function")syncMotionBtn();markDirty();}
function toggleJuiceMotion(){const on=!juiceMotion();setJuiceMotion(on);return on;}
function syncMotionBtn(){try{if(typeof document==="undefined"||!document.querySelectorAll)return;const on=juiceMotion();document.querySelectorAll('[data-act="motion"]').forEach(b=>{b.textContent=on?"MOTION":"MOTION ✕";b.title=(on?"Turn off":"Turn on")+" motion effects (screen shake, sliding, damage numbers)";});}catch(e){}}
function juiceStats(){return{on:juiceOn(),motion:juiceMotion(),light:_jzLightOn(),active:_jzFx.length,banner:_jzBanner?_jzBanner.title:null,cam:_jzLast.cam.slice(),dad:_jzLast.dad.slice(),shake:_jzLast.shake.slice(),..._jzStats};}
function _jzEase(p){p=Math.max(0,Math.min(1,p));return 1-(1-p)*(1-p);}
/* a glide from (fx,fy) to (x,y) in tiles; restarting mid-glide starts from where it is drawn now */
function _jzTw(rec,x,y,n,max){if(!rec)return{x:x,y:y,fx:x,fy:y,t0:-1e9};if(rec.x!==x||rec.y!==y){const c=_jzTwAt(rec,n);const far=Math.abs(x-rec.x)>max||Math.abs(y-rec.y)>max;rec.fx=far?x:c[0];rec.fy=far?y:c[1];rec.x=x;rec.y=y;rec.t0=n;if(!far){_jzStats.tweens++;requestAnim(JUICE_TWEEN_MS+30);}}return rec;}
function _jzTwAt(rec,n){if(!rec)return[0,0];const p=(n-rec.t0)/JUICE_TWEEN_MS;if(p>=1)return[rec.x,rec.y];const e=_jzEase(p);return[rec.fx+(rec.x-rec.fx)*e,rec.fy+(rec.y-rec.fy)*e];}
function _jzAdd(f){_jzFx.push(f);if(_jzFx.length>80)_jzFx.splice(0,_jzFx.length-80);requestAnim((f.ms||600)+40);}
function _jzFloat(x,y,txt,col,n){let k=0;for(const f of _jzFx)if(f.k==="float"&&f.x===x&&f.y===y&&n-f.t0<JUICE_FLOAT_MS)k++;_jzAdd({k:"float",x:x,y:y,txt:txt,col:col,t0:n,ms:JUICE_FLOAT_MS,dy:k*11});_jzStats.floats++;}
function _jzShakeAt(amp,ms,n){if(!_jzShake||n-_jzShake.t0>=_jzShake.ms||amp>=_jzShake.amp){_jzShake={amp:amp,ms:ms,t0:n};}_jzStats.shakes++;requestAnim(ms+30);}
function _jzBannerAt(title,sub,n){_jzBanner={title:title,sub:sub||"",t0:n,ms:JUICE_BANNER_MS};_jzStats.banners++;requestAnim(JUICE_BANNER_MS+40);}
function _jzSil(cv,col){let m=_jzSilC.get(cv);if(!m){m=new Map();_jzSilC.set(cv,m);}let s=m.get(col);if(s)return s;const d=_sprImgDims(cv);const nc=_sprNewCanvas(d.w,d.h);if(!nc)return null;const x=nc.x;x.drawImage(cv,0,0);x.globalCompositeOperation="source-in";x.fillStyle=col;x.fillRect(0,0,d.w,d.h);s=nc.c;m.set(col,s);return s;}
/* called once per drawWorld after the camera is known: updates trackers, spawns effects, applies the world offset */
function _jzBegin(){if(!juiceOn())return null;const n=_rNow(),mo=juiceMotion();
 if(!_jzKey||_jzKey.g!==game||_jzKey.f!==game.floor||_jzKey.w!==VIEW_W||_jzKey.h!==VIEW_H){const fresh=!_jzKey||_jzKey.g!==game||_jzKey.f!==game.floor;_jzKey={g:game,f:game.floor,w:VIEW_W,h:VIEW_H};_jzCam=null;_jzDad=null;if(fresh){_jzE=new WeakMap();_jzPrev=[];_jzAlly=null;_jzFx=[];_jzDad=null;_jzKey.hp=game.hp;}}
 /* Dad + camera glides */
 if(mo){_jzCam=_jzTw(_jzCam,camX,camY,n,1);_jzDad=_jzTw(_jzDad,game.px,game.py,n,1);}else{_jzCam=null;_jzDad=null;}
 const cam=mo?_jzTwAt(_jzCam,n):[camX,camY],dad=mo?_jzTwAt(_jzDad,n):[game.px,game.py];
 /* Dad hp */
 if(typeof _jzKey.hp!=="number")_jzKey.hp=game.hp;const dh=game.hp-_jzKey.hp;
 if(dh&&mo){if(dh<0){_jzFloat(game.px,game.py,String(dh),"#ff5a4a",n);_jzVig={t0:n,ms:JUICE_VIG_MS,a:Math.min(0.55,0.25+(-dh)/Math.max(1,game.maxhp))};_jzStats.vignettes++;requestAnim(JUICE_VIG_MS+30);if(-dh>=Math.max(8,game.maxhp*0.25))_jzShakeAt(3,200,n);}else _jzFloat(game.px,game.py,"+"+dh,"#7be36a",n);}
 _jzKey.hp=game.hp;
 /* enemies: glide, hit flash, knockback, numbers, boss banners */
 const cur=[];for(const e of game.enemies){let r=_jzE.get(e);const v=!!(game.vis[e.y]&&game.vis[e.y][e.x]);
  if(!r){r={tw:null,hp:e.hp,fl:-1e9,kn:null,ph:e.hoaPhase};_jzE.set(e,r);}
  if(mo)r.tw=_jzTw(r.tw,e.x,e.y,n,2);else r.tw=null;
  if(e.hp!==r.hp&&v&&mo){const d=e.hp-r.hp;if(d<0){r.fl=n;_jzStats.flashes++;_jzFloat(e.x,e.y,String(d),"#ffffff",n);requestAnim(JUICE_FLASH_MS+30);
    const kx=Math.sign(e.x-game.px),ky=Math.sign(e.y-game.py);if((kx||ky)&&Math.abs(e.x-game.px)<=1&&Math.abs(e.y-game.py)<=1){r.kn={dx:kx,dy:ky,t0:n};_jzStats.knocks++;requestAnim(JUICE_KNOCK_MS+30);}
    if(-d>=Math.max(6,(e.maxhp||1)*0.4))_jzShakeAt(e.isBoss?3:2,150,n);}else _jzFloat(e.x,e.y,"+"+d,"#7be36a",n);}
  r.hp=e.hp;
  if(e.isBoss&&v&&!_jzBossSeen.has(e)){_jzBossSeen.add(e);_jzBannerAt("BOSS: "+(e.def.name||"Something Large").toUpperCase(),JUICE_BOSS_SUBS[_tileHash(game.depth|0,7,3)%JUICE_BOSS_SUBS.length],n);}
  if(e.hoaPhase!==r.ph){if(r.ph!==undefined&&e.hoaPhase>r.ph&&typeof HOA_PHASES!=="undefined"&&HOA_PHASES[e.hoaPhase-1]){const P=HOA_PHASES[e.hoaPhase-1];_jzBannerAt("PHASE "+e.hoaPhase+": "+String(P.name||"").toUpperCase(),"The meeting is not over. The meeting is never over.",n);if(mo)_jzShakeAt(4,350,n);}r.ph=e.hoaPhase;}
  cur.push({e:e,x:e.x,y:e.y,boss:!!e.isBoss,v:v});}
 /* a visible enemy that vanished from the same floor was defeated: puff + KO */
 if(_jzPrev.length){const now=new Set(game.enemies);for(const p of _jzPrev){if(now.has(p.e)||!p.v)continue;if(mo){_jzAdd({k:"puff",x:p.x,y:p.y,boss:p.boss,t0:n,ms:JUICE_PUFF_MS*(p.boss?1.5:1),seed:_tileHash(p.x,p.y,(game.turn|0)+(game.depth|0)*977)});_jzStats.puffs++;_jzFloat(p.x,p.y,"KO","#f4c430",n);if(p.boss)_jzShakeAt(4,400,n);}}}
 _jzPrev=cur;
 /* companion glide + hp */
 const A=game.ally;if(A&&typeof A.x==="number"){if(!_jzAlly||_jzAlly.a!==A)_jzAlly={a:A,tw:null,hp:A.hp};if(mo)_jzAlly.tw=_jzTw(_jzAlly.tw,A.x,A.y,n,2);else _jzAlly.tw=null;
  if(typeof A.hp==="number"&&A.hp!==_jzAlly.hp&&mo&&game.vis[A.y]&&game.vis[A.y][A.x]){const d=A.hp-_jzAlly.hp;_jzFloat(A.x,A.y,d<0?String(d):"+"+d,d<0?"#ffa64a":"#7be36a",n);}_jzAlly.hp=A.hp;}else _jzAlly=null;
 /* world offset = camera glide + shake (whole logical px, so tiles never get seams) */
 let ox=Math.round((camX-cam[0])*TILE),oy=Math.round((camY-cam[1])*TILE),sx=0,sy=0;
 if(_jzShake&&mo){const t=n-_jzShake.t0;if(t<_jzShake.ms){const a=_jzShake.amp*(1-t/_jzShake.ms),k=Math.floor(t/32),h=_tileHash(k,_jzShake.t0|0,5);sx=Math.round(((h%3)-1)*a);sy=Math.round((((h>>>4)%3)-1)*a);if(!sx&&!sy)sx=Math.round(a)*(k&1?1:-1);}else _jzShake=null;}
 ox+=sx;oy+=sy;_jzLast={cam:[ox-sx,oy-sy],dad:[Math.round((dad[0]-game.px)*TILE),Math.round((dad[1]-game.py)*TILE)],shake:[sx,sy]};
 if((ox||oy)&&ctx.translate)ctx.translate(ox,oy);
 const J={n:n,mo:mo,ox:ox,oy:oy,dad:dad,grad:null};
 if(_jzLightOn()&&typeof ctx.createRadialGradient==="function"){const R=Math.max(4,Math.min(8,4+Math.floor((typeof effPer==="function"?effPer():0)/3)));const cx=(dad[0]-camX)*TILE+TILE/2,cy=(dad[1]-camY)*TILE+TILE/2,rp=(R+0.5)*TILE;
  const g=ctx.createRadialGradient(cx,cy,rp*0.42,cx,cy,rp);g.addColorStop(0,"rgba(4,5,9,0)");g.addColorStop(0.55,"rgba(4,5,9,0.12)");g.addColorStop(1,"rgba(4,5,9,0.36)");J.grad=g;}
 return J;}
function _jzLight(J,px,py){if(J&&J.grad){ctx.fillStyle=J.grad;ctx.fillRect(px,py,TILE,TILE);_jzStats.lit++;}}
/* where an entity is drawn this frame (logical px, world space), incl. glide + knockback */
function _jzPos(J,e,px,py){if(!J||!J.mo)return[px,py];const r=_jzE.get(e);if(!r)return[px,py];let x=px,y=py;if(r.tw){const c=_jzTwAt(r.tw,J.n);x+=Math.round((c[0]-e.x)*TILE);y+=Math.round((c[1]-e.y)*TILE);}
 if(r.kn){const t=(J.n-r.kn.t0)/JUICE_KNOCK_MS;if(t<1){const s=Math.round(3*Math.sin(Math.PI*t));x+=r.kn.dx*s;y+=r.kn.dy*s;}else r.kn=null;}return[x,y];}
function _jzAllyPos(J,px,py){if(!J||!J.mo||!_jzAlly||!_jzAlly.tw||!game.ally)return[px,py];const c=_jzTwAt(_jzAlly.tw,J.n);return[px+Math.round((c[0]-game.ally.x)*TILE),py+Math.round((c[1]-game.ally.y)*TILE)];}
function _jzDadPos(J,px,py){if(!J||!J.mo)return[px,py];return[px+Math.round((J.dad[0]-game.px)*TILE),py+Math.round((J.dad[1]-game.py)*TILE)];}
function _jzFlash(J,e,x,y){if(!J||!J.mo)return;const r=_jzE.get(e);if(!r)return;const t=(J.n-r.fl)/JUICE_FLASH_MS;if(t<0||t>=1)return;if(_sprCacheOK===null)_sprCacheOK=!!_sprNewCanvas(1,1);if(!_sprCacheOK)return;
 const c=_sprCached(e.def.sprite,null,null);if(!c||!c.cv)return;const s=_jzSil(c.cv,"#ffffff");if(!s)return;ctx.globalAlpha=0.85*(1-t);ctx.drawImage(s,x,y,c.w,c.h);ctx.globalAlpha=1;}
/* world-space effects (after drawFX): puffs and floating numbers */
function _jzWorldFx(J){if(!J)return;const n=J.n;
 for(let i=_jzFx.length-1;i>=0;i--){const f=_jzFx[i],t=(n-f.t0)/f.ms;if(t>=1){_jzFx.splice(i,1);continue;}if(t<0)continue;const bx=(f.x-camX)*TILE+TILE/2,by=(f.y-camY)*TILE+TILE/2;
  if(f.k==="puff"){const N=f.boss?18:10,sp=(f.boss?22:16)*_jzEase(t),sz=Math.max(2,Math.round((f.boss?5:4)*(1-t*0.6)));ctx.globalAlpha=Math.max(0,0.9*(1-t));
   for(let q=0;q<N;q++){const h=_tileHash(q,f.seed&0xffff,f.seed>>>16),ang=(q/N)*Math.PI*2+((h%100)/100-0.5)*0.7,v=0.6+((h>>>8)%40)/100;ctx.fillStyle=(q%3===0)?(f.boss?"#fff2b0":"#ffffff"):(f.boss?"#f4c430":"#cfc9bb");
    ctx.fillRect(Math.round(bx+Math.cos(ang)*sp*v)-1,Math.round(by+Math.sin(ang)*sp*v-4*t)-1,sz,sz);}ctx.globalAlpha=1;}
  else if(f.k==="float"){const y=Math.round(by-17-12*_jzEase(t)-f.dy),a=t<0.6?1:Math.max(0,1-(t-0.6)/0.4);ctx.globalAlpha=a;ctx.font="bold 11px monospace";ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=3;ctx.strokeStyle="#0b0b10";ctx.strokeText(f.txt,Math.round(bx),y);ctx.fillStyle=f.col;ctx.fillText(f.txt,Math.round(bx),y);ctx.globalAlpha=1;ctx.textAlign="start";ctx.textBaseline="alphabetic";}}}
/* screen-space effects (after the world offset is undone): hurt vignette and the boss banner */
function _jzScreenFx(J){if(!J)return;const n=J.n,CW=VIEW_W*TILE,CH=VIEW_H*TILE;
 if(_jzVig&&J.mo&&typeof ctx.createRadialGradient==="function"){const t=(n-_jzVig.t0)/_jzVig.ms;if(t<1){const g=ctx.createRadialGradient(CW/2,CH/2,Math.min(CW,CH)*0.32,CW/2,CH/2,Math.max(CW,CH)*0.72);g.addColorStop(0,"rgba(200,30,30,0)");g.addColorStop(1,"rgba(200,30,30,"+(_jzVig.a*(1-t)).toFixed(3)+")");ctx.fillStyle=g;ctx.fillRect(0,0,CW,CH);}else _jzVig=null;}
 if(_jzBanner){const B=_jzBanner,t=n-B.t0;if(t>=B.ms||t<0){_jzBanner=null;return;}const H=36,y=Math.round(CH*0.16);let x=0,a=1;
  if(J.mo){if(t<180)x=-Math.round(CW*(1-_jzEase(t/180)));if(t>B.ms-300)a=Math.max(0,(B.ms-t)/300);}
  ctx.globalAlpha=a*0.9;ctx.fillStyle="#2a0b0b";ctx.fillRect(x,y,CW,H);ctx.globalAlpha=a;ctx.fillStyle="#f4c430";ctx.fillRect(x,y,CW,2);ctx.fillRect(x,y+H-2,CW,2);
  ctx.textAlign="center";ctx.textBaseline="middle";let fs=14;ctx.font="bold "+fs+"px monospace";while(fs>8&&ctx.measureText&&ctx.measureText(B.title).width>CW-12){fs--;ctx.font="bold "+fs+"px monospace";}
  ctx.fillStyle="#f4c430";ctx.fillText(B.title,x+CW/2,y+13);let ss=9;ctx.font=ss+"px monospace";while(ss>6&&ctx.measureText&&ctx.measureText(B.sub).width>CW-10){ss--;ctx.font=ss+"px monospace";}ctx.fillStyle="#f4f1e8";ctx.fillText(B.sub,x+CW/2,y+27);
  ctx.globalAlpha=1;ctx.textAlign="start";ctx.textBaseline="alphabetic";}}
function _jzEnd(J){if(!J)return;if((J.ox||J.oy)&&ctx.setTransform)ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);_jzScreenFx(J);}
function lootSprite(it){return it.kind==="weapon"?SPR_GEAR_W:it.kind==="armor"?SPR_GEAR_A:it.kind==="charm"?SPR_CHARM:it.kind==="key"?SPR_KEY:it.kind==="object"?SPR_OBJECT:SPR_POTION;}
/* itemIconSprite: returns 32x32 sprite for inventory icon if available, else 16x16 fallback */
function itemIconSprite(it){return(it&&it.sprite)?it.sprite:lootSprite(it);}
function showEnemyHP(e){return game.globalReveal||e.shownHP||effPer()>=SHOW_HP_PER;}
/* M4 FRAME LOOP (mobile plan). render() is the requestAnimationFrame callback, but it only redraws when
   something may have changed: markDirty() was called, an animation window from requestAnim(ms) is open, or the
   RENDER_IDLE_MS safety net has elapsed. Any input event (capture phase), resize/rotation, visibility change and
   every setTimeout callback (click-path auto-walk, etc.) marks the frame dirty, so game logic needs no changes.
   Turn logic stays discrete; animation (M15) is purely visual and uses requestAnim(ms). Idle CPU ~0. */
const RENDER_IDLE_MS=1000;let _rDirty=true,_rAnimUntil=0,_rLastDraw=-1e9,_rFrames=0,_rSkipped=0;
function _rNow(){return(typeof performance!=="undefined"&&performance&&typeof performance.now==="function")?performance.now():Date.now();}
function markDirty(){_rDirty=true;}
function requestAnim(ms){const n=_rNow();if(n+(ms||0)>_rAnimUntil)_rAnimUntil=n+(ms||0);_rDirty=true;}
function renderStats(){return{frames:_rFrames,skipped:_rSkipped,dirty:_rDirty,animating:_rNow()<_rAnimUntil};}
(function _installDirtyHooks(){try{const h=()=>{_rDirty=true;};
 if(typeof window!=="undefined"&&window&&typeof window.addEventListener==="function"){
  ["keydown","keyup","pointerdown","pointerup","pointermove","pointercancel","mousedown","mouseup","mousemove","click","contextmenu","wheel","touchstart","touchend","resize","orientationchange","focus","pageshow"].forEach(t=>window.addEventListener(t,h,true));
  if(typeof window.setTimeout==="function"&&!window.__sdaTimeoutHooked){const _st=window.setTimeout.bind(window);
   window.setTimeout=function(fn,ms){const a=Array.prototype.slice.call(arguments,2);if(typeof fn!=="function")return _st.apply(null,arguments);return _st(function(){try{return fn.apply(this,a);}finally{_rDirty=true;}},ms);};
   window.__sdaTimeoutHooked=true;}}
 if(typeof document!=="undefined"&&document&&typeof document.addEventListener==="function")document.addEventListener("visibilitychange",h,true);
}catch(e){}})();
function drawFrame(){const CW=VIEW_W*TILE,CH=VIEW_H*TILE;try{if(ctx.setTransform)ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle="#06070b";ctx.fillRect(0,0,CW,CH);if(mode===State.PLAY&&game&&game.floor&&game.seen&&game.vis&&isFinite(game.px)&&isFinite(game.py))drawWorld();else drawMenuBackdrop();}catch(err){/* A draw error must never kill the loop (prevents the frozen-map / vanished-dad freeze). */if(typeof console!=="undefined")console.warn("render skipped frame:",err);}}
function render(){const n=_rNow();/* MOB-03: effects advance one step per drawn frame, so keep drawing while any are playing (the scan pulse used to wait for the next tap) */const _fxOn=typeof game!=="undefined"&&game&&game.fx&&game.fx.length>0&&typeof mode!=="undefined"&&mode===State.PLAY;if(_rDirty||_fxOn||n<_rAnimUntil||n-_rLastDraw>=RENDER_IDLE_MS){_rDirty=false;_rLastDraw=n;_rFrames++;drawFrame();}else _rSkipped++;requestAnimationFrame(render);}

/* ===== CLASS SELECT PORTRAITS =====
   Per-class illustrated backdrop drawn at 6× sprite scale (192×192) centered
   in the VIEW_W*TILE x VIEW_H*TILE canvas (480×320 desktop, 288×416 portrait) during State.CLASS. Scene elements fill the full canvas.
   ============================================================= */
const PORTRAIT_CFG={
  grill:   {top:'#2a0d00',bot:'#6a2200',accent:'#d97a2b'},
  diy:     {top:'#120c04',bot:'#2e1c0a',accent:'#c9a227'},
  tech:    {top:'#04080e',bot:'#0a1220',accent:'#37b0b0'},
  gym:     {top:'#160404',bot:'#360a0a',accent:'#e0453a'},
  tactical:{top:'#070d07',bot:'#111c11',accent:'#5fbf4f'},
  sports:  {top:'#050e05',bot:'#0a2010',accent:'#5fa8e0'},
  yard:    {top:'#060e04',bot:'#102808',accent:'#3a7d34'},
};
function drawPortraitScene(id,CW,CH){
  switch(id){
    case 'grill':{
      const fg=ctx.createRadialGradient(CW/2,CH,0,CW/2,CH,CH*0.85);
      fg.addColorStop(0,'rgba(200,80,0,0.55)');fg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=fg;ctx.fillRect(0,0,CW,CH);
      ctx.fillStyle='#4a1a00';ctx.fillRect(0,CH*0.72,CW,CH*0.28);
      const fw=Math.ceil(CW/10);
      for(let i=0;i<10;i++){
        const fx=Math.round(i*CW/9);const fh=28+(i%3)*18;
        ctx.fillStyle='#c96a1a';ctx.fillRect(fx,CH-fh,fw,fh);
        ctx.fillStyle='#f09030';ctx.fillRect(fx+Math.round(fw*0.3),CH-Math.round(fh*0.6),Math.round(fw*0.4),Math.round(fh*0.6));
        ctx.fillStyle='#f4c430';ctx.fillRect(fx+Math.round(fw*0.4),CH-Math.round(fh*0.28),Math.round(fw*0.2),Math.round(fh*0.28));
      }
      ctx.fillStyle='rgba(70,70,70,0.18)';
      ctx.fillRect(Math.round(CW*0.18),0,36,Math.round(CH*0.62));
      ctx.fillRect(Math.round(CW*0.58),0,28,Math.round(CH*0.55));
      break;}
    case 'diy':{
      ctx.strokeStyle='rgba(42,58,90,0.38)';ctx.lineWidth=1;
      for(let x=0;x<CW;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
      for(let y=0;y<CH;y+=24){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
      ctx.strokeStyle='rgba(95,168,224,0.28)';ctx.lineWidth=1;
      [[120,80],[360,80],[120,240],[360,240]].forEach(([x,y])=>{
        ctx.beginPath();ctx.moveTo(x-10,y);ctx.lineTo(x+10,y);ctx.stroke();
        ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x,y+10);ctx.stroke();
      });
      ctx.fillStyle='#3a2208';ctx.fillRect(0,Math.round(CH*0.8),CW,Math.round(CH*0.2));
      for(let i=0;i<3;i++){ctx.fillStyle='#4a2e10';ctx.fillRect(0,Math.round(CH*0.8)+i*9,CW,5);}
      break;}
    case 'tech':{
      ctx.fillStyle='rgba(55,176,176,0.05)';
      for(let y=0;y<CH;y+=10){ctx.fillRect(0,y,CW,5);}
      const sg=ctx.createRadialGradient(CW/2,CH*0.38,0,CW/2,CH*0.38,CW*0.55);
      sg.addColorStop(0,'rgba(55,176,176,0.14)');sg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=sg;ctx.fillRect(0,0,CW,CH);
      ctx.fillStyle='rgba(95,191,79,0.22)';
      [[0.08,0.18,0.18],[0.10,0.27,0.13],[0.08,0.36,0.24],[0.10,0.45,0.10],[0.08,0.70,0.20],[0.10,0.79,0.14]].forEach(([xr,yr,wr])=>{ctx.fillRect(Math.round(CW*xr),Math.round(CH*yr),Math.round(CW*wr),3);});
      ctx.fillStyle='rgba(95,168,224,0.28)';
      [[0.70,0.18,0.16],[0.74,0.36,0.11],[0.71,0.79,0.13]].forEach(([xr,yr,wr])=>{ctx.fillRect(Math.round(CW*xr),Math.round(CH*yr),Math.round(CW*wr),3);});
      break;}
    case 'gym':{
      const gl=ctx.createRadialGradient(CW/2,CH*0.32,16,CW/2,CH*0.5,CW*0.6);
      gl.addColorStop(0,'rgba(224,69,58,0.18)');gl.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=gl;ctx.fillRect(0,0,CW,CH);
      ctx.fillStyle='#2e1a0a';ctx.fillRect(0,Math.round(CH*0.8),CW,Math.round(CH*0.2));
      ctx.fillStyle='#1a0a04';
      for(let x=0;x<CW;x+=28){ctx.fillRect(x,Math.round(CH*0.8),2,Math.round(CH*0.2));}
      const dw=64,by=Math.round(CH*0.8)-14;
      [[36,by],[CW-36-dw,by]].forEach(([bx,by2])=>{
        ctx.fillStyle='#2a2a2a';ctx.fillRect(bx,by2,dw,12);
        ctx.fillStyle='#e0453a';ctx.fillRect(bx,by2,18,12);ctx.fillRect(bx+dw-18,by2,18,12);
        ctx.fillStyle='#3a3a3a';ctx.fillRect(bx+18,by2,dw-36,12);
      });
      break;}
    case 'tactical':{
      [['rgba(18,34,14,0.65)',0,0,160,120],['rgba(10,22,8,0.45)',240,0,240,100],
       ['rgba(26,46,20,0.38)',0,180,180,140],['rgba(8,18,6,0.55)',300,160,180,160],
       ['rgba(18,34,14,0.50)',100,70,120,90]].forEach(([c,x,y,w,h])=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);});
      ctx.strokeStyle='rgba(95,191,79,0.11)';ctx.lineWidth=1;
      for(let x=0;x<CW;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
      for(let y=0;y<CH;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
      const rcx=CW/2,rcy=CH/2,rr=22;
      ctx.strokeStyle='rgba(95,191,79,0.22)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(rcx,rcy,rr,0,Math.PI*2);ctx.stroke();
      [[rcx-rr-12,rcy,rcx-rr+6,rcy],[rcx+rr-6,rcy,rcx+rr+12,rcy],
       [rcx,rcy-rr-12,rcx,rcy-rr+6],[rcx,rcy+rr-6,rcx,rcy+rr+12]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
      break;}
    case 'sports':{
      ctx.fillStyle='#0a1e08';ctx.fillRect(0,Math.round(CH*0.6),CW,Math.round(CH*0.4));
      ctx.strokeStyle='rgba(95,191,79,0.28)';ctx.lineWidth=2;
      ctx.strokeRect(28,Math.round(CH*0.62),CW-56,Math.round(CH*0.36));
      ctx.beginPath();ctx.moveTo(CW/2,Math.round(CH*0.62));ctx.lineTo(CW/2,CH);ctx.stroke();
      ctx.beginPath();ctx.arc(CW/2,Math.round(CH*0.8),36,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,0.028)';
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(CW*0.28,0);ctx.lineTo(CW*0.68,CH);ctx.lineTo(CW*0.38,CH);ctx.closePath();ctx.fill();
      break;}
    case 'yard':{
      ctx.fillStyle='#143808';ctx.fillRect(0,Math.round(CH*0.68),CW,Math.round(CH*0.32));
      ctx.fillStyle='#3a7d34';
      for(let x=4;x<CW;x+=8){ctx.fillRect(x,Math.round(CH*0.65),4,Math.round(CH*0.06));}
      ctx.fillStyle='#5fbf4f';
      for(let x=8;x<CW;x+=12){ctx.fillRect(x,Math.round(CH*0.66),2,Math.round(CH*0.04));}
      ctx.fillStyle='#7a4a8c';
      [[28,0.60,6,20],[52,0.57,5,24],[CW-42,0.61,6,18],[CW-62,0.58,5,22]].forEach(([x,yr,w,h])=>{
        ctx.fillRect(x,Math.round(CH*yr),w,h);ctx.fillRect(x-4,Math.round(CH*yr)-10,w+8,12);});
      ctx.fillStyle='#b06fd0';
      [[33,0.56,6,6],[CW-38,0.57,6,6]].forEach(([x,yr,w,h])=>{ctx.fillRect(x,Math.round(CH*yr),w,h);});
      ctx.fillStyle='rgba(244,196,48,0.048)';
      ctx.beginPath();ctx.moveTo(CW,0);ctx.lineTo(CW*0.58,0);ctx.lineTo(0,CH*0.68);
      ctx.lineTo(0,CH);ctx.lineTo(CW*0.28,CH);ctx.lineTo(CW,CH*0.28);ctx.closePath();ctx.fill();
      break;}
  }
}
/* Main portrait compositor: gradient BG → scene → 6× sprite → accent frame */
function drawClassPortrait(cls,CW,CH){
  const cfg=PORTRAIT_CFG[cls.id]||{top:'#0d1b2a',bot:'#1b263b',accent:'#f4c430'};
  const bg=ctx.createLinearGradient(0,0,0,CH);
  bg.addColorStop(0,cfg.top);bg.addColorStop(1,cfg.bot);
  ctx.fillStyle=bg;ctx.fillRect(0,0,CW,CH);
  drawPortraitScene(cls.id,CW,CH);
  const SC=6,SW=SPR_SIZE*SC,SH=SPR_SIZE*SC;
  const px=Math.floor((CW-SW)/2),py=Math.floor((CH-SH)/2);
  /* drop shadow */
  ctx.fillStyle='rgba(0,0,0,0.45)';ctx.fillRect(px+6,py+6,SW,SH);
  /* sprite at 6× — transparent pixels let the scene show through; skin previewed live */
  drawSpriteRemap(dadSprite(),px,py,SC,null,skinColorMap());
  /* accent border + inner highlight */
  ctx.strokeStyle=cfg.accent;ctx.lineWidth=3;ctx.strokeRect(px-2,py-2,SW+4,SH+4);
  ctx.strokeStyle='rgba(255,255,255,0.08)';ctx.lineWidth=1;ctx.strokeRect(px-1,py-1,SW+2,SH+2);
}
function drawMenuBackdrop(){const CW=VIEW_W*TILE,CH=VIEW_H*TILE;if(typeof mode!=="undefined"&&mode===State.CLASS&&typeof classCursor!=="undefined"&&typeof CLASSES!=="undefined"&&CLASSES[classCursor]){drawClassPortrait(CLASSES[classCursor],CW,CH);}else{ctx.fillStyle="#11131a";ctx.fillRect(0,0,CW,CH);for(let i=0;i<80;i++){ctx.fillStyle="#1c2030";ctx.fillRect((i*53)%CW,(i*37)%CH,2,2);}drawDad(Math.floor(CW/2)-16,Math.floor(CH/2)-16,1);}}
function drawWorld(){camX=VIEW_W>MAP_W?-Math.floor((VIEW_W-MAP_W)/2):Math.max(0,Math.min(MAP_W-VIEW_W,game.px-Math.floor(VIEW_W/2)));camY=VIEW_H>MAP_H?-Math.floor((VIEW_H-MAP_H)/2):Math.max(0,Math.min(MAP_H-VIEW_H,game.py-Math.floor(VIEW_H/2)));/* MOB-04: a view wider/taller than the floor centers it */
 const _J=_jzBegin();/* M15 */
 const [flrSpr,wallSpr]=(typeof getBiomeSprites==="function")?getBiomeSprites(game.depth):[SPR_FLOOR,SPR_WALL];const _tset=_tileSet(game.depth);/* M14 */
 const _ext=_J&&_J.mo?1:0;/* M15: one spare ring of tiles for the camera glide */
 for(let vy=-_ext;vy<VIEW_H+_ext;vy++)for(let vx=-_ext;vx<VIEW_W+_ext;vx++){const mx=camX+vx,my=camY+vy;if(mx<0||my<0||mx>=MAP_W||my>=MAP_H)continue;const px=vx*TILE,py=vy*TILE;if(!game.seen[my][mx]){ctx.fillStyle="#06070b";ctx.fillRect(px,py,TILE,TILE);continue;}const _tg=game.floor.grid[my][mx];if(!_tset||!_drawTileArt(_tset,_tg,mx,my,px,py))drawSprite(_tg===1?wallSpr:_tg===2?SPR_WATER:flrSpr,px,py,1);const dr=doorAt(mx,my);if(dr){if(!dr.open)drawSprite(dr.locked?SPR_DOOR_L:SPR_DOOR,px,py,1);else drawSprite(SPR_DOOR_OPEN,px,py,1);}if(!game.vis[my][mx]){ctx.fillStyle="rgba(4,5,9,0.55)";ctx.fillRect(px,py,TILE,TILE);}else if(_J)_jzLight(_J,px,py);}
 const sx=(game.stairs.x-camX)*TILE,sy=(game.stairs.y-camY)*TILE;const _gDn=game.depth%10===0&&typeof SPR_BIOME_GATE!=="undefined",_gUp=game.depth%10===1&&game.depth>1&&typeof SPR_BIOME_GATE_UP!=="undefined";/* MOB-15: biome gates on the floors where the stairs cross into another biome */if(game.seen[game.stairs.y][game.stairs.x])drawSprite(_gDn?SPR_BIOME_GATE:SPR_STAIRS,sx,sy,1);if(game.stairsUp&&game.seen[game.stairsUp.y]&&game.seen[game.stairsUp.y][game.stairsUp.x]){drawSprite(_gUp?SPR_BIOME_GATE_UP:SPR_STAIRS_UP,(game.stairsUp.x-camX)*TILE,(game.stairsUp.y-camY)*TILE,1);}
 for(const t of game.traps){if(t.sprung||!game.vis[t.y][t.x])continue;if(t.known)drawSprite(t.def.sprite||SPR_TRAP,(t.x-camX)*TILE,(t.y-camY)*TILE,1);}
 for(const l of game.loot){if(!game.vis[l.y][l.x])continue;const px=(l.x-camX)*TILE,py=(l.y-camY)*TILE;if(l.item.kind==="gold"){ctx.fillStyle="#f4c430";ctx.fillRect(px+5,py+6,6,5);ctx.fillStyle="#c9a227";ctx.fillRect(px+5,py+10,6,2);}else drawSprite(itemIconSprite(l.item),px,py,1);}
 if(game.vendor&&game.seen[game.vendor.y][game.vendor.x])drawSprite(SPR_VENDOR,(game.vendor.x-camX)*TILE,(game.vendor.y-camY)*TILE,1);
 if(game.fountains)for(const fn of game.fountains){if(game.seen[fn.y][fn.x]){if(fn.charges>0)drawSprite(SPR_FOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1);else drawSpriteRemap(SPR_FOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1,{'B':'S','b':'s','C':'m'});}}
 if(game.healFountains)for(const fn of game.healFountains){if(game.seen[fn.y][fn.x]){if(fn.charges>0)drawSprite(SPR_HEALFOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1);else drawSpriteRemap(SPR_HEALFOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1,{'r':'m','R':'M','O':'s','o':'m'});}}
 for(const e of game.enemies){if(!game.vis[e.y][e.x])continue;const [px,py]=_jzPos(_J,e,(e.x-camX)*TILE,(e.y-camY)*TILE);drawSprite(e.def.sprite,px,py,1);_jzFlash(_J,e,px,py);if(showEnemyHP(e)){const w=TILE-2;ctx.fillStyle="#3a0d0d";ctx.fillRect(px+1,py-3,w,2);ctx.fillStyle=e.isBoss?"#f0a040":"#5fbf4f";ctx.fillRect(px+1,py-3,Math.max(0,w*e.hp/e.maxhp),2);}}
 // Draw unrecruited ally on map (solid cyan bar = friendly)
 if(game.ally&&!game.ally.following){const [ax,ay]=_jzAllyPos(_J,(game.ally.x-camX)*TILE,(game.ally.y-camY)*TILE);if(game.vis[game.ally.y]&&game.vis[game.ally.y][game.ally.x]){const adef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(adef)drawSprite(adef.sprite,ax,ay,1);ctx.fillStyle="#37b0b0";ctx.fillRect(ax+1,ay-3,TILE-2,2);}}
 // Draw active following ally with HP bar
 if(game.ally&&game.ally.following){const [ax,ay]=_jzAllyPos(_J,(game.ally.x-camX)*TILE,(game.ally.y-camY)*TILE);if(game.vis[game.ally.y]&&game.vis[game.ally.y][game.ally.x]){const adef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(adef){drawSprite(adef.sprite,ax,ay,1);const w=TILE-2;ctx.fillStyle="#1a3a1a";ctx.fillRect(ax+1,ay-3,w,2);ctx.fillStyle="#37b0b0";ctx.fillRect(ax+1,ay-3,Math.max(0,w*game.ally.hp/game.ally.maxhp),2);}}}
 {const _dp=_jzDadPos(_J,(game.px-camX)*TILE,(game.py-camY)*TILE);drawDadAnim(_dp[0],_dp[1],1);}/* N29 + M15 glide */
 drawFX();_jzWorldFx(_J);
 if(inspectOn){const px=(insX-camX)*TILE,py=(insY-camY)*TILE;ctx.strokeStyle="#f4c430";ctx.lineWidth=1;ctx.strokeRect(px+0.5,py+0.5,TILE-1,TILE-1);}
 drawAimPreview();_jzEnd(_J);}
/* M7: touch aiming preview. aimTgt is set by a tap/swipe while aiming/placing; the aim bar CONFIRM fires it. */
function drawAimPreview(){if(typeof aimTgt==="undefined"||!aimTgt||!(aiming||placing)||!game)return;
 ctx.fillStyle="rgba(244,196,48,0.22)";ctx.strokeStyle="#f4c430";ctx.lineWidth=2;let last=null;
 if(aiming){const rg=(throwRef&&throwRef.it&&throwRef.it.throw&&throwRef.it.throw.range)||8;let x=game.px,y=game.py;
  for(let i=0;i<rg;i++){x+=aimTgt.dx;y+=aimTgt.dy;if(x<0||y<0||x>=MAP_W||y>=MAP_H||game.floor.grid[y][x]===1)break;const dr=doorAt(x,y);if(dr&&!dr.open)break;
   ctx.fillRect((x-camX)*TILE,(y-camY)*TILE,TILE,TILE);last={x:x,y:y};if(game.vis[y]&&game.vis[y][x]&&game.enemies.some(e=>e.x===x&&e.y===y))break;}}
 else{const x=game.px+aimTgt.dx,y=game.py+aimTgt.dy;ctx.fillRect((x-camX)*TILE,(y-camY)*TILE,TILE,TILE);last={x:x,y:y};}
 if(last)ctx.strokeRect((last.x-camX)*TILE+1,(last.y-camY)*TILE+1,TILE-2,TILE-2);}
function drawFX(){for(let i=game.fx.length-1;i>=0;i--){const f=game.fx[i];if(f.kind==="proj"){const idx=Math.min(Math.floor(f.i/2),f.cells.length-1);const c=f.cells[idx];if(c)drawSprite(f.spr,(c.x-camX)*TILE,(c.y-camY)*TILE,1);f.i++;if(f.i>=f.life)game.fx.splice(i,1);}else if(f.kind==="pulse"){const prog=f.t/f.life;const rad=prog*f.r;ctx.globalAlpha=Math.max(0,0.85*(1-prog));ctx.fillStyle="#7fd0ff";for(let a=0;a<360;a+=10){const x=f.cx+Math.cos(a*Math.PI/180)*rad,y=f.cy+Math.sin(a*Math.PI/180)*rad;ctx.fillRect((x-camX)*TILE+TILE/2-1,(y-camY)*TILE+TILE/2-1,2,2);}ctx.globalAlpha=1;f.t++;if(f.t>=f.life)game.fx.splice(i,1);}else{const a=0.5*(1-f.t/f.life);ctx.fillStyle=f.color;ctx.globalAlpha=Math.max(0,a);for(const c of f.cells){if(c.x>=camX&&c.y>=camY)ctx.fillRect((c.x-camX)*TILE,(c.y-camY)*TILE,TILE,TILE);}ctx.globalAlpha=1;f.t++;if(f.t>=f.life)game.fx.splice(i,1);}}}
/* ===== inspect ===== */
function qualHP(e){const f=e.hp/e.maxhp;return f>0.75?"barely scratched":f>0.4?"roughed up":f>0.15?"badly hurt":"about to drop";}
function inspectAt(x,y){if(x<0||y<0||x>=MAP_W||y>=MAP_H||!game.seen[y][x])return null;
 const e=game.enemies.find(e=>e.x===x&&e.y===y);if(e){growPerception("e"+e.uid);if(effPer()>=3)e.shownHP=true;const hp=showEnemyHP(e)?("HP "+Math.max(0,e.hp)+"/"+e.maxhp):("looks "+qualHP(e)+" (raise Perception for exact HP)");return {t:e.def.name+(e.isBoss?" [BOSS]":"")+(e.isDog?" [CHAOTIC NEUTRAL]":""),b:"max ATK "+e.def.atk+" \xb7 DEF "+e.def.def+" \xb7 "+hp+"<br>"+e.def.flavor};}
 if(game.vendor&&game.vendor.x===x&&game.vendor.y===y)return {t:game.vendor.def.name,b:game.vendor.def.greet+" Walk into the stall to shop."};
 const fn=game.fountains&&game.fountains.find(f=>f.x===x&&f.y===y);if(fn)return {t:fn.charges>0?"Water Fountain":"Water Fountain (Empty)",b:fn.charges>0?"Working fountain. "+fn.charges+" charge(s). Walk into it to interact.":"It tried its best. It gave all "+5+" charges. It has no more to give."};
 const hfn=game.healFountains&&game.healFountains.find(f=>f.x===x&&f.y===y);if(hfn)return {t:hfn.charges>0?"The Cooler of Restoration":"The Cooler (Empty)",b:hfn.charges>0?"A roadside cooler of humming red liquid. "+hfn.charges+" sip(s) left. Walk into it to drink and heal.":"Empty. Whatever it was, it's gone. The cooler keeps its secrets."};
 const lStack=game.loot.filter(l=>l.x===x&&l.y===y);if(lStack.length){growPerception("l"+x+","+y);if(lStack.length>1)return {t:lStack.length+" items piled here",b:"Walk onto the tile to choose which to grab: "+lStack.map(l=>l.item.name||"Gold").join(", ")+"."};const it=lStack[0].item;return {t:it.name||"Gold",b:(it.desc||"")+(it.rarity?" \xb7 "+it.rarity:"")};}
 const t=game.traps.find(t=>t.x===x&&t.y===y&&!t.sprung);if(t){growPerception("t"+x+","+y);if(trapDetected(t)){t.known=true;return {t:"TRAP: "+t.def.name,b:t.def.desc+" (Throw an object at it to disarm.)"};}return {t:"The floor here",b:"Looks... fine? Your Perception isn't sharp enough to be sure."};}
 const dr=doorAt(x,y);if(dr)return {t:dr.locked?"A Locked Door":"A Door",b:dr.locked?"You'll need a key.":(dr.open?"Open. Left-click it to close (costs 1 turn).": "Closed. Bump it to open.")};
 if(x===game.stairs.x&&y===game.stairs.y)return {t:"The Stairs Down",b:"Deeper suburban peril. Step on them to descend."};if(game.stairsUp&&x===game.stairsUp.x&&y===game.stairsUp.y)return game.ascent&&game.depth===1?{t:"The Basement Door",b:"Daylight leaks under it. Home. The thermostat. Destiny."}:{t:"The Stairs Up",b:"Floor "+(game.depth-1)+" awaits above. Whatever you left behind is still there. Step on them to ascend."};
 if(x===game.px&&y===game.py)return {t:"You, "+game.cls.name,b:"HP "+game.hp+"/"+game.maxhp+"  Gold: "+game.gold+"g"};
 if(game.ally&&!game.ally.following&&game.ally.x===x&&game.ally.y===y){const adef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(adef){const questPending=adef.quest&&!game.ally.questDone;return {t:"ALLY: "+adef.name,b:adef.flavor+(questPending?" Quest: "+adef.quest.summary+".":" Walk into them to recruit.")};}}
 if(game.ally&&game.ally.following&&game.ally.x===x&&game.ally.y===y){const adef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(adef)return {t:"ALLY (Active): "+adef.name,b:"HP "+Math.max(0,game.ally.hp)+"/"+game.ally.maxhp+". "+adef.flavor};}
 if(game.floor.grid[y][x]===2){const notes=["The sock situation is irreversible. Whatever was in there before is no longer a sock.",
  "Technically this could be a water feature. Nobody permitted this water feature.",
   "This puddle has dreams of becoming a lake. You respect the ambition. You do not step in it.",
  "There is a rainbow sheen on this. Someone has been meaning to look into that. That someone is you. You have not looked into it."];return {t:"Standing Water",b:notes[(x*7+y*13)%4]+" You search for the source of the leak. You do not find the source. The search has become the point."};}
 if(game.floor.grid[y][x]===1)return {t:"A Wall",b:"Load-bearing. Probably. Do not test this."};
 return {t:"Floor",b:"Suspiciously ordinary linoleum."};}
