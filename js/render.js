/* ===== SCATTERED DAD ADVENTURES -- render.js =====
   Canvas rendering: drawSprite, drawWorld, drawFX, inspect display.
   Depends on: sprites.js, data.js, game.js
   =============================================== */

/* M3 SPRITE CACHE (mobile plan). Each ASCII sprite is rasterized ONCE per (remap,colorMap) variant to an
   offscreen canvas; drawSprite/drawSpriteRemap then issue a single drawImage instead of ~1,024 fillRects.
   Falls back to the original per-pixel path when no offscreen canvas exists (node harness, old browsers).
   N21 hook: registerSpriteImage(spr,img) overrides a sprite with loaded PNG art for un-remapped draws;
   the cached ASCII raster always remains the fallback. */
const _sprIdCache=new WeakMap(),_sprKeyCache=new Map(),_sprImg=new WeakMap();let _sprCacheOK=null;
function _sprPx(spr,remap,colorMap,put){for(let y=0;y<spr.length;y++){const row=spr[y];for(let x=0;x<row.length;x++){let ch=row[x];if(remap&&remap[ch])ch=remap[ch];const c=(colorMap&&colorMap[ch])?colorMap[ch]:PAL[ch];if(!c)continue;put(c,x,y);}}}
function _sprDirect(spr,dx,dy,sc,remap,colorMap){_sprPx(spr,remap,colorMap,(c,x,y)=>{ctx.fillStyle=c;ctx.fillRect(dx+x*sc,dy+y*sc,sc,sc);});}
function _sprNewCanvas(w,h){try{if(typeof document==="undefined"||!document.createElement)return null;const c=document.createElement("canvas");if(!c||typeof c.getContext!=="function")return null;c.width=w;c.height=h;const x=c.getContext("2d");if(!x||typeof x.fillRect!=="function")return null;return{c,x};}catch(e){return null;}}
function _sprVKey(remap,colorMap){let k="";if(remap)for(const a of Object.keys(remap).sort())k+=a+remap[a];k+="|";if(colorMap)for(const a of Object.keys(colorMap).sort())k+=a+colorMap[a]+",";return k;}
function _sprRecord(spr){let r=_sprIdCache.get(spr);if(r)return r;const ck=spr.join("\n");r=_sprKeyCache.get(ck);if(!r){let w=0;for(const row of spr)if(row.length>w)w=row.length;r={w,h:spr.length,v:new Map()};if(_sprKeyCache.size>4000)_sprKeyCache.clear();_sprKeyCache.set(ck,r);}_sprIdCache.set(spr,r);return r;}
function _sprCached(spr,remap,colorMap){const r=_sprRecord(spr);const vk=_sprVKey(remap,colorMap);let cv=r.v.get(vk);if(cv)return{cv,w:r.w,h:r.h};const o=_sprNewCanvas(r.w||1,r.h||1);if(!o)return null;_sprPx(spr,remap,colorMap,(c,x,y)=>{o.x.fillStyle=c;o.x.fillRect(x,y,1,1);});cv=o.c;if(r.v.size>64)r.v.clear();r.v.set(vk,cv);return{cv,w:r.w,h:r.h};}
function _sprBlit(spr,dx,dy,sc,remap,colorMap){sc=sc||1;if(!spr||!spr.length)return;if(_sprCacheOK===null)_sprCacheOK=!!_sprNewCanvas(1,1);if(!_sprCacheOK){_sprDirect(spr,dx,dy,sc,remap,colorMap);return;}const e=_sprCached(spr,remap,colorMap);if(!e){_sprDirect(spr,dx,dy,sc,remap,colorMap);return;}ctx.imageSmoothingEnabled=false;ctx.drawImage(e.cv,dx,dy,e.w*sc,e.h*sc);}
function registerSpriteImage(spr,img){if(spr&&typeof spr==="object"&&img){_sprImg.set(spr,img);if(typeof markDirty==="function")markDirty();}}
function spriteCacheStats(){let variants=0;for(const r of _sprKeyCache.values())variants+=r.v.size;return{enabled:!!_sprCacheOK,sprites:_sprKeyCache.size,variants};}
function drawSprite(spr,dx,dy,sc){sc=sc||1;const im=spr&&typeof spr==="object"?_sprImg.get(spr):null;if(im&&im.complete!==false&&im.naturalWidth!==0){ctx.imageSmoothingEnabled=false;ctx.drawImage(im,dx,dy,(spr[0]?spr[0].length:32)*sc,spr.length*sc);return;}_sprBlit(spr,dx,dy,sc,null,null);}
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
function render(){const n=_rNow();if(_rDirty||n<_rAnimUntil||n-_rLastDraw>=RENDER_IDLE_MS){_rDirty=false;_rLastDraw=n;_rFrames++;drawFrame();}else _rSkipped++;requestAnimationFrame(render);}

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
function drawWorld(){camX=Math.max(0,Math.min(MAP_W-VIEW_W,game.px-Math.floor(VIEW_W/2)));camY=Math.max(0,Math.min(MAP_H-VIEW_H,game.py-Math.floor(VIEW_H/2)));
 const [flrSpr,wallSpr]=(typeof getBiomeSprites==="function")?getBiomeSprites(game.depth):[SPR_FLOOR,SPR_WALL];
 for(let vy=0;vy<VIEW_H;vy++)for(let vx=0;vx<VIEW_W;vx++){const mx=camX+vx,my=camY+vy;if(mx>=MAP_W||my>=MAP_H)continue;const px=vx*TILE,py=vy*TILE;if(!game.seen[my][mx]){ctx.fillStyle="#06070b";ctx.fillRect(px,py,TILE,TILE);continue;}const _tg=game.floor.grid[my][mx];drawSprite(_tg===1?wallSpr:_tg===2?SPR_WATER:flrSpr,px,py,1);const dr=doorAt(mx,my);if(dr){if(!dr.open)drawSprite(dr.locked?SPR_DOOR_L:SPR_DOOR,px,py,1);else drawSprite(SPR_DOOR_OPEN,px,py,1);}if(!game.vis[my][mx]){ctx.fillStyle="rgba(4,5,9,0.55)";ctx.fillRect(px,py,TILE,TILE);}}
 const sx=(game.stairs.x-camX)*TILE,sy=(game.stairs.y-camY)*TILE;if(game.seen[game.stairs.y][game.stairs.x])drawSprite(SPR_STAIRS,sx,sy,1);if(game.stairsUp&&game.seen[game.stairsUp.y]&&game.seen[game.stairsUp.y][game.stairsUp.x]){drawSprite(SPR_STAIRS_UP,(game.stairsUp.x-camX)*TILE,(game.stairsUp.y-camY)*TILE,1);}
 for(const t of game.traps){if(t.sprung||!game.vis[t.y][t.x])continue;if(t.known)drawSprite(t.def.sprite||SPR_TRAP,(t.x-camX)*TILE,(t.y-camY)*TILE,1);}
 for(const l of game.loot){if(!game.vis[l.y][l.x])continue;const px=(l.x-camX)*TILE,py=(l.y-camY)*TILE;if(l.item.kind==="gold"){ctx.fillStyle="#f4c430";ctx.fillRect(px+5,py+6,6,5);ctx.fillStyle="#c9a227";ctx.fillRect(px+5,py+10,6,2);}else drawSprite(itemIconSprite(l.item),px,py,1);}
 if(game.vendor&&game.seen[game.vendor.y][game.vendor.x])drawSprite(SPR_VENDOR,(game.vendor.x-camX)*TILE,(game.vendor.y-camY)*TILE,1);
 if(game.fountains)for(const fn of game.fountains){if(game.seen[fn.y][fn.x]){if(fn.charges>0)drawSprite(SPR_FOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1);else drawSpriteRemap(SPR_FOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1,{'B':'S','b':'s','C':'m'});}}
 if(game.healFountains)for(const fn of game.healFountains){if(game.seen[fn.y][fn.x]){if(fn.charges>0)drawSprite(SPR_HEALFOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1);else drawSpriteRemap(SPR_HEALFOUNTAIN,(fn.x-camX)*TILE,(fn.y-camY)*TILE,1,{'r':'m','R':'M','O':'s','o':'m'});}}
 for(const e of game.enemies){if(!game.vis[e.y][e.x])continue;const px=(e.x-camX)*TILE,py=(e.y-camY)*TILE;drawSprite(e.def.sprite,px,py,1);if(showEnemyHP(e)){const w=TILE-2;ctx.fillStyle="#3a0d0d";ctx.fillRect(px+1,py-3,w,2);ctx.fillStyle=e.isBoss?"#f0a040":"#5fbf4f";ctx.fillRect(px+1,py-3,Math.max(0,w*e.hp/e.maxhp),2);}}
 // Draw unrecruited ally on map (solid cyan bar = friendly)
 if(game.ally&&!game.ally.following){const ax=(game.ally.x-camX)*TILE,ay=(game.ally.y-camY)*TILE;if(game.vis[game.ally.y]&&game.vis[game.ally.y][game.ally.x]){const adef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(adef)drawSprite(adef.sprite,ax,ay,1);ctx.fillStyle="#37b0b0";ctx.fillRect(ax+1,ay-3,TILE-2,2);}}
 // Draw active following ally with HP bar
 if(game.ally&&game.ally.following){const ax=(game.ally.x-camX)*TILE,ay=(game.ally.y-camY)*TILE;if(game.vis[game.ally.y]&&game.vis[game.ally.y][game.ally.x]){const adef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(adef){drawSprite(adef.sprite,ax,ay,1);const w=TILE-2;ctx.fillStyle="#1a3a1a";ctx.fillRect(ax+1,ay-3,w,2);ctx.fillStyle="#37b0b0";ctx.fillRect(ax+1,ay-3,Math.max(0,w*game.ally.hp/game.ally.maxhp),2);}}}
 drawDad((game.px-camX)*TILE,(game.py-camY)*TILE,1);
 drawFX();
 if(inspectOn){const px=(insX-camX)*TILE,py=(insY-camY)*TILE;ctx.strokeStyle="#f4c430";ctx.lineWidth=1;ctx.strokeRect(px+0.5,py+0.5,TILE-1,TILE-1);}
 drawAimPreview();}
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
