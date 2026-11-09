/* ===== SCATTERED DAD ADVENTURES — input.js =====
   Keyboard and mouse event handlers, game loop start.
   Depends on: everything else
   =============================================== */

function tileFromEvent(ev){const r=canvas.getBoundingClientRect();const sx=(VIEW_W*TILE)/r.width,sy=(VIEW_H*TILE)/r.height;/* M5: logical px (backing store is RENDER_SCALE x larger) */const cxp=(ev.clientX-r.left)*sx,cyp=(ev.clientY-r.top)*sy;return {x:camX+Math.floor(cxp/TILE),y:camY+Math.floor(cyp/TILE)};}
/* M7: canvasTap() is the single tap/click action, fed by the Pointer Events layer below (mouse, touch and pen).
   touchy=true (touch/pen): aiming taps set a target that the aim bar CONFIRM button fires; tapping your own tile waits. */
function canvasTap(ev,touchy){if(mode!==State.PLAY)return;
 // Mouse aiming (handled BEFORE the overlay guard). Click a tile to set throw direction / trap tile.
 // Esc or the on-screen CANCEL button aborts; keyboard aiming path stays intact.
 if(aiming){const t=tileFromEvent(ev);const dx=Math.sign(t.x-game.px),dy=Math.sign(t.y-game.py);if(dx===0&&dy===0){log("Aim away from yourself — click a tile in the throw direction.","dim");return;}if(touchy){_m7SetAim(dx,dy,t.x,t.y);return;}clearMouseInspect();doThrow(dx,dy);return;}
 if(placing){const t=tileFromEvent(ev);const dx=t.x-game.px,dy=t.y-game.py;if(Math.max(Math.abs(dx),Math.abs(dy))!==1){log("Traps go on an adjacent tile — click a square right next to you.","dim");return;}if(touchy){_m7SetAim(dx,dy,t.x,t.y);return;}clearMouseInspect();placeTrap(dx,dy);return;}
 if(pendingConfirm||pendingMenu||ovInv||ovDad||ovBest||ovInstr||ovMap)return;const {x,y}=tileFromEvent(ev);if(x<0||y<0||x>=MAP_W||y>=MAP_H)return;
 // Shift+click directs the active companion: shift+click an enemy = attack it, shift+click a tile = move there.
 if(ev.shiftKey&&game&&game.ally&&game.ally.following){game.clickPath=[];orderAlly(x,y);return;}
 if(game){game.clickPath=[];game.clickDoor=null;}// cancel any existing path
 // Doors auto-close; clicking an open door inspects it
 const _dr=doorAt(x,y);if(_dr&&_dr.open){showInspect(x,y);return;}
 // Adjacency = Chebyshev distance 1, so all 8 neighbours (orthogonal AND diagonal) route to tryMove.
 // tryMove attacks an occupying enemy or steps into an empty tile — this gives click-to-attack on diagonals.
 if(touchy&&x===game.px&&y===game.py){clearMouseInspect();tryMove(0,0);return;}// M7: tap your own tile = wait (or take the stairs you stand on)
 const _dxa=Math.abs(x-game.px),_dya=Math.abs(y-game.py);const adj=Math.max(_dxa,_dya)===1;
 if(adj){clearMouseInspect();tryMove(Math.sign(x-game.px),Math.sign(y-game.py));}
 else if((game.vis&&game.vis[y]&&game.vis[y][x])||(game.seen&&game.seen[y]&&game.seen[y][x])){
  // Visible or discovered (MOB-12: shaded tiles too) non-adjacent tile: pathfind toward it
  // MOB-01: a closed door is never a path tile, so walk to the tile beside it, then ask what to do.
  const _cd=(_dr&&!_dr.open)?_dr:null;const _wl=!_cd&&game.floor.grid[y][x]===1;/* MOB-05: a tapped wall walks to the nearest floor tile beside it */const path=_cd?pathToDoor(_cd):_wl?pathToWall(x,y):bfsPath(game.px,game.py,x,y);
  if(path&&path.length){game.clickPath=path;if(_cd)game.clickDoor={x:_cd.x,y:_cd.y};continueClickPath();}
  else{showInspect(x,y);}
 }else{showInspect(x,y);}}
/* ===== M7 touch input layer =====
   Pointer Events give mouse, touch and pen one code path on the canvas.
   Mouse: left button = canvasTap (same as the old click). Right button stays on contextmenu (inspect).
   Touch/pen: tap = canvasTap; swipe (>=24 CSS px, <0.9 s) = one 8-direction step; press and hold (480 ms, no drag) = inspect.
   A second finger cancels the gesture. */
const M7_SWIPE=24,M7_SLOP=10,M7_LONG=480;let _m7P=null;
function _m7Busy(){return !!(pendingConfirm||pendingMenu||ovInv||ovDad||ovBest||ovInstr||ovMap||ovCodex||ovGrave||shopOpen);}
function _m7Dir(dx,dy){const o=Math.round(Math.atan2(dy,dx)/(Math.PI/4));const D=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];return D[(o+8)%8];}
function _m7SetAim(dx,dy,tx,ty){aimTgt={dx:dx,dy:dy,x:tx,y:ty};clearMouseInspect();if(typeof markDirty==="function")markDirty();syncAimBar();}
function _m7Swipe(dx,dy){if(mode!==State.PLAY||_m7Busy()||!game)return;
 if(aiming||placing){_m7SetAim(dx,dy,game.px+dx,game.py+dy);return;}
 game.clickPath=[];clearMouseInspect();tryMove(dx,dy);}
function _m7End(){const p=_m7P;if(p&&p.timer)clearTimeout(p.timer);_m7P=null;}
/* MOB-04: two fingers on the map = pinch zoom. Fingers together = zoom out, apart = zoom in (one ZOOM_STEPS step per 25% change in spread).
   The second finger cancels the one-finger tap/swipe/hold, so a pinch never moves Dad. Mouse and keyboard zoom are unchanged. */
const M4P_STEP=1.25;const _m4Pts=new Map();let _m4Pinch=null;
function _m4Dist(){const a=Array.from(_m4Pts.values());return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}
function _m4Move(){if(!_m4Pinch||_m4Pts.size!==2||mode!==State.PLAY||_m7Busy()||!game)return;const d=_m4Dist();if(_m4Pinch.d0<1){_m4Pinch.d0=d;return;}const r=d/_m4Pinch.d0;
 if(r>=M4P_STEP){_m4Pinch.d0=d;if(zoomStep<ZOOM_STEPS.length-1)doZoom(1);}else if(r<=1/M4P_STEP){_m4Pinch.d0=d;if(zoomStep>0)doZoom(-1);}}
function _m4Up(ev){if(!_m4Pts.has(ev.pointerId))return;_m4Pts.delete(ev.pointerId);if(_m4Pts.size<2)_m4Pinch=null;}
canvas.addEventListener("pointermove",(ev)=>{if(!_m4Pts.has(ev.pointerId))return;_m4Pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});_m4Move();});
document.addEventListener("pointerup",_m4Up,true);document.addEventListener("pointercancel",_m4Up,true);
canvas.addEventListener("pointerdown",(ev)=>{
 if(ev.pointerType!=="mouse"){_m4Pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(_m4Pts.size>=2){_m7End();try{canvas.setPointerCapture(ev.pointerId);}catch(e){}_m4Pinch=_m4Pts.size===2?{d0:_m4Dist()}:null;return;}}
 if(!ev.isPrimary){_m7End();return;}
 if(ev.pointerType==="mouse"&&ev.button!==0){_m7End();return;}
 _m7End();const p={id:ev.pointerId,type:ev.pointerType,x0:ev.clientX,y0:ev.clientY,t0:Date.now(),moved:false,long:false,timer:null};_m7P=p;
 try{canvas.setPointerCapture(ev.pointerId);}catch(e){}
 if(ev.pointerType!=="mouse"){p.timer=setTimeout(()=>{p.timer=null;if(_m7P!==p||p.moved)return;p.long=true;
  if(mode===State.PLAY&&!_m7Busy()&&game){const t=tileFromEvent({clientX:p.x0,clientY:p.y0});if(t.x>=0&&t.y>=0&&t.x<MAP_W&&t.y<MAP_H){inspectKb=false;showInspect(t.x,t.y);try{if(navigator.vibrate)navigator.vibrate(12);}catch(e){}}}},M7_LONG);}});
canvas.addEventListener("pointermove",(ev)=>{const p=_m7P;if(!p||ev.pointerId!==p.id||p.moved)return;
 if(Math.hypot(ev.clientX-p.x0,ev.clientY-p.y0)>M7_SLOP){p.moved=true;if(p.timer){clearTimeout(p.timer);p.timer=null;}}});
canvas.addEventListener("pointerup",(ev)=>{const p=_m7P;if(!p||ev.pointerId!==p.id)return;_m7End();if(p.long)return;
 if(p.type==="mouse"){canvasTap(ev,false);return;}
 const dx=ev.clientX-p.x0,dy=ev.clientY-p.y0,d=Math.hypot(dx,dy);
 if(d>=M7_SWIPE&&Date.now()-p.t0<900){const v=_m7Dir(dx,dy);_m7Swipe(v[0],v[1]);return;}
 if(d<=M7_SLOP*2)canvasTap({clientX:p.x0,clientY:p.y0,shiftKey:false},true);});
canvas.addEventListener("pointercancel",()=>{_m7End();});
// M7: status chips show their tooltip on tap (touch has no :hover). Tap again, or anywhere else, to close.
function _m7CloseTips(keep){try{document.querySelectorAll(".st-chip.st-open").forEach(c=>{if(c!==keep)c.classList.remove("st-open");});}catch(e){}}
elStatuses.addEventListener("click",(ev)=>{const chip=ev.target.closest(".st-chip");if(!chip)return;const open=!chip.classList.contains("st-open");_m7CloseTips(chip);chip.classList.toggle("st-open",open);if(!open)return;
 const tip=chip.querySelector(".st-tip");if(!tip)return;tip.style.left="";tip.style.top="";tip.style.bottom="";
 const vw=document.documentElement.clientWidth||window.innerWidth;let r=tip.getBoundingClientRect();
 if(r.right>vw-4)tip.style.left=(-(r.right-(vw-4)))+"px";r=tip.getBoundingClientRect();if(r.left<4)tip.style.left=((parseFloat(tip.style.left)||0)+(4-r.left))+"px";
 if(r.top<4){tip.style.bottom="auto";tip.style.top="130%";}});
document.addEventListener("pointerdown",(ev)=>{const t=ev.target;if(!(t&&t.closest&&t.closest(".st-chip")))_m7CloseTips(null);},true);
canvas.addEventListener("contextmenu",(ev)=>{ev.preventDefault();if(mode===State.PLAY){const {x,y}=tileFromEvent(ev);showInspect(x,y);}});
// click inventory / dadism rows
oInv.addEventListener("click",(ev)=>{
 // Bag-item action buttons (mouse-only): route to the SAME invAction() branch the keys use. Examine ("x") logs the item's flavor.
 const m9b=ev.target.closest("[data-m9]");if(m9b){_m9Act(m9b.dataset.m9);return;}// M9: worn-item sheet buttons + sheet Close
 const act=ev.target.closest("[data-invact]");
 const _cp=(typeof COMPACT!=="undefined"&&COMPACT);
 if(act){const a=act.dataset.invact;const e=game.inv[invSel];
  if(a==="x"){if(e)log(itemDisplayName(e.it)+" — "+(e.it.desc||e.it.kind),"dim");if(_cp&&ovInv)buildInv();return;}
  invAction(a);if(_cp&&ovInv){if(game.inv[invSel]!==e)_m9Det=false;buildInv();}return;}
 const row=ev.target.closest("[data-inv]");if(!row)return;invSel=+row.dataset.inv;if(_cp){_m9Slot=null;_m9Det=!!game.inv[invSel];}buildInv();});
// Dadism list: clicking a row selects it; clicking its Cast button casts it (mouse-only casting).
oD.addEventListener("click",(ev)=>{const cast=ev.target.closest("[data-cast]");if(cast){const kn=DADISMS.filter(d=>game.dadisms.includes(d.id));const ci=+cast.dataset.cast;if(kn[ci])castDadism(kn[ci].id);return;}const row=ev.target.closest("[data-dad]");if(!row)return;dadSel=+row.dataset.dad;buildDad();});
// Confirm dialog + option menus: clickable Yes/No (data-cf) and numbered rows (data-menu; -1 = cancel).
cf.addEventListener("click",(ev)=>{const cb=ev.target.closest("[data-cf]");if(cb){resolveConfirm(cb.dataset.cf==="y");return;}const mb=ev.target.closest("[data-menu]");if(mb){resolveMenu(parseInt(mb.dataset.menu,10));return;}});
/* Title menu actions, shared by the HUD rows (desktop) and the compact comic cover (js/titlecover.js). */
function doTitleAction(a){
  if(a==="new"){pendingDaily=false;mode=State.CLASS;syncUI();}
  else if(a==="continue"){if(hasSave()){if(!continueRun()){mode=State.CLASS;syncUI();}}}
  else if(a==="daily"){pendingDaily=true;mode=State.CLASS;syncUI();}
  else if(a==="help"){closeOverlays();ovInstr=true;buildInstr();syncOverlays();}
  else if(a==="best"){closeOverlays();ovBest=true;buildBest();syncOverlays();}
  else if(a==="grave"){closeOverlays();ovGrave=true;buildGraveyard();syncOverlays();}
  else if(a==="backup"){if(typeof openSaveBackup==="function")openSaveBackup();}
}
// Title / class / difficulty / end-screen options: click the same rows the keys trigger.
elLog.addEventListener("click",(ev)=>{
 if(mode===State.TITLE){const opt=ev.target.closest("[data-title]");if(!opt)return;doTitleAction(opt.dataset.title);return;}
 if(mode===State.CLASS){const cr=ev.target.closest("[data-class]");if(!cr)return;classCursor=+cr.dataset.class;syncUI();openClassConfirm(CLASSES[classCursor]);return;}
 if(mode===State.DIFF){const dr=ev.target.closest("[data-diff]");if(!dr)return;if(dr.dataset.diff==="back"){mode=State.CLASS;syncUI();return;}diffCursor=+dr.dataset.diff;const _diff=DIFFICULTY_MODES[diffCursor];log(pendingClass.name+" on "+_diff.name+": "+_diff.flavor,"gold");const _dseed=pendingDaily?dailySeedFor(dailyDateStr()):undefined;pendingDaily=false;newRun(pendingClass,_diff,_dseed);return;}
 if(mode===State.DEAD||mode===State.WIN){const en=ev.target.closest("[data-end]");if(!en)return;const a=en.dataset.end;
  if(a==="title"){mode=State.TITLE;messages=[];syncUI();}
  else if(a==="best"){closeOverlays();ovBest=true;buildBest();syncOverlays();}
  else if(a==="ascent"&&mode===State.WIN&&!game.ascentDone&&!game.ascent&&typeof startAscent==="function"){startAscent();}
  return;}
});
// M6 compact shell: during play the log is collapsed to its last 2 lines; tap it to expand/collapse.
elLog.addEventListener("click",()=>{if(mode!==State.PLAY||!document.body.classList.contains("m-compact"))return;const open=!elLog.classList.contains("log-open");elLog.classList.toggle("log-open",open);const h=document.getElementById("hud");if(h)h.classList.toggle("log-open-host",open);if(open)elLog.scrollTop=elLog.scrollHeight;});
// Skin-tone swatch/arrows on the Dad-select screen (rendered in the status line).
elStatuses.addEventListener("click",(ev)=>{if(mode!==State.CLASS)return;const s=ev.target.closest("[data-skin]");if(!s||typeof SKIN_SWATCHES==="undefined")return;if(s.dataset.skin==="prev")skinCursor=(skinCursor+SKIN_SWATCHES.length-1)%SKIN_SWATCHES.length;else skinCursor=(skinCursor+1)%SKIN_SWATCHES.length;syncUI();});
// On-screen action bar: Scan, Zoom +/-, and Menu(save+quit) — same handlers as their keys.
const oAct=document.getElementById("actionbar");
// Keep the SOUND button label in sync with the mute state (mirrors the [U] key).
function syncMuteBtn(){const muted=(typeof SFX_MUTED!=="undefined"&&SFX_MUTED);if(document.querySelectorAll)document.querySelectorAll('[data-act="mute"]').forEach(b=>{b.textContent=muted?"SOUND ✕":"SOUND";b.title=(muted?"Unmute":"Mute")+" sound (U)";});}
// M8: one dispatcher shared by the action bar and the compact MORE drawer.
function barAction(a){
 // Mute is a global toggle (like its key) — handle it BEFORE the play-mode guard so it always works when the bar is visible.
 if(a==="mute"){if(typeof sfxToggleMute==="function"){sfxToggleMute();syncMuteBtn();if(mode===State.PLAY)log("Sound "+(SFX_MUTED?"muted":"unmuted")+". Click SOUND or press [U] to toggle.","dim");}return;}
 if(mode!==State.PLAY||pendingConfirm||pendingMenu||aiming||placing||ovInv||ovDad||ovBest||ovInstr||ovMap||ovCodex||ovGrave||shopOpen)return;
 if(a==="more"){setMoreOpen(!_m8More);return;}
 if(a==="backup"){setMoreOpen(false);if(typeof openSaveBackup==="function")openSaveBackup();return;}
 if(a!=="pad")setMoreOpen(false);
 if(a==="wait"){if(game)game.clickPath=[];clearMouseInspect();tryMove(0,0);return;}
 if(a==="scan")scanArea();else if(a==="zoomin")doZoom(1);else if(a==="zoomout")doZoom(-1);else if(a==="quit")quitToMenu();else if(a==="throw")quickThrow();else if(a==="pad")toggleDpadPref();else if(a==="place")quickPlace();else if(a==="inv"||a==="dad"||a==="map"||a==="best"||a==="codex"||a==="instr"||a==="grave")openOverlayByName(a);}
if(oAct)oAct.addEventListener("click",(ev)=>{const btn=ev.target.closest("[data-act]");if(btn)barAction(btn.dataset.act);});
const oMore=document.getElementById("moresheet");
if(oMore)oMore.addEventListener("click",(ev)=>{if(ev.target===oMore||ev.target.closest("[data-more=close]")){setMoreOpen(false);return;}const btn=ev.target.closest("[data-act]");if(btn)barAction(btn.dataset.act);});
// Floating Close button (mouse-only): dismisses any open overlay/shop, same as Esc.
const oClose=document.getElementById("ovClose");
if(oClose)oClose.addEventListener("click",()=>{closeOverlays();if(inspectOn&&typeof toggleInspect==="function")toggleInspect();syncUI();});
// Aim/place CANCEL bar: clears aiming/placing (same effect as pressing Esc) and refreshes the HUD.
const oAim=document.getElementById("aimbar");
if(oAim)oAim.addEventListener("click",(ev)=>{const btn=ev.target.closest("[data-aim]");if(!btn)return;
 if(btn.dataset.aim==="confirm"){const t=aimTgt;aimTgt=null;if(t){clearMouseInspect();if(aiming)doThrow(t.dx,t.dy);else if(placing)placeTrap(t.dx,t.dy);}syncUI();return;}// M7: fire the tapped target
 if(aiming){aiming=false;throwRef=null;log("Throw cancelled.","dim");}
 else if(placing){placing=false;placeRef=null;log("Placement cancelled.","dim");}
 syncUI();});
// On-screen D-pad: each button fires the same tryMove() as its key. Center (0,0) = wait/pass turn.
// Single-step tryMove calls never auto-travel, so the "stop on negative effect" rule (continueClickPath) is inherently honoured.
const oDpad=document.getElementById("dpad");
if(oDpad)oDpad.addEventListener("click",(ev)=>{const btn=ev.target.closest("[data-dx]");if(!btn)return;
 if(mode!==State.PLAY||pendingConfirm||pendingMenu||aiming||placing||ovInv||ovDad||ovBest||ovInstr||ovMap||shopOpen)return;
 if(game)game.clickPath=[];clearMouseInspect();
 tryMove(parseInt(btn.dataset.dx,10),parseInt(btn.dataset.dy,10));});

/* ===== boot ===== */
fitCanvas();render();syncUI();if(typeof syncMuteBtn==="function")syncMuteBtn();