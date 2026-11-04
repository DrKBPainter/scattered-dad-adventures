/* ===== SCATTERED DAD ADVENTURES — input.js =====
   Keyboard and mouse event handlers, game loop start.
   Depends on: everything else
   =============================================== */

function tileFromEvent(ev){const r=canvas.getBoundingClientRect();const sx=(VIEW_W*TILE)/r.width,sy=(VIEW_H*TILE)/r.height;/* M5: logical px (backing store is RENDER_SCALE x larger) */const cxp=(ev.clientX-r.left)*sx,cyp=(ev.clientY-r.top)*sy;return {x:camX+Math.floor(cxp/TILE),y:camY+Math.floor(cyp/TILE)};}
canvas.addEventListener("click",(ev)=>{if(mode!==State.PLAY)return;
 // Mouse aiming (handled BEFORE the overlay guard). Click a tile to set throw direction / trap tile.
 // Esc or the on-screen CANCEL button aborts; keyboard aiming path stays intact.
 if(aiming){const t=tileFromEvent(ev);const dx=Math.sign(t.x-game.px),dy=Math.sign(t.y-game.py);if(dx===0&&dy===0){log("Aim away from yourself — click a tile in the throw direction.","dim");return;}clearMouseInspect();doThrow(dx,dy);return;}
 if(placing){const t=tileFromEvent(ev);const dx=t.x-game.px,dy=t.y-game.py;if(Math.max(Math.abs(dx),Math.abs(dy))!==1){log("Traps go on an adjacent tile — click a square right next to you.","dim");return;}clearMouseInspect();placeTrap(dx,dy);return;}
 if(pendingConfirm||pendingMenu||ovInv||ovDad||ovBest||ovInstr||ovMap)return;const {x,y}=tileFromEvent(ev);if(x<0||y<0||x>=MAP_W||y>=MAP_H)return;
 // Shift+click directs the active companion: shift+click an enemy = attack it, shift+click a tile = move there.
 if(ev.shiftKey&&game&&game.ally&&game.ally.following){game.clickPath=[];orderAlly(x,y);return;}
 if(game)game.clickPath=[];// cancel any existing path
 // Doors auto-close; clicking an open door inspects it
 const _dr=doorAt(x,y);if(_dr&&_dr.open){showInspect(x,y);return;}
 // Adjacency = Chebyshev distance 1, so all 8 neighbours (orthogonal AND diagonal) route to tryMove.
 // tryMove attacks an occupying enemy or steps into an empty tile — this gives click-to-attack on diagonals.
 const _dxa=Math.abs(x-game.px),_dya=Math.abs(y-game.py);const adj=Math.max(_dxa,_dya)===1;
 if(adj){clearMouseInspect();tryMove(Math.sign(x-game.px),Math.sign(y-game.py));}
 else if(game.vis&&game.vis[y]&&game.vis[y][x]){
  // Visible non-adjacent tile: pathfind toward it
  const path=bfsPath(game.px,game.py,x,y);
  if(path&&path.length){game.clickPath=path;continueClickPath();}
  else{showInspect(x,y);}
 }else{showInspect(x,y);}});
canvas.addEventListener("contextmenu",(ev)=>{ev.preventDefault();if(mode===State.PLAY){const {x,y}=tileFromEvent(ev);showInspect(x,y);}});
// click inventory / dadism rows
oInv.addEventListener("click",(ev)=>{
 // Bag-item action buttons (mouse-only): route to the SAME invAction() branch the keys use. Examine ("x") logs the item's flavor.
 const act=ev.target.closest("[data-invact]");
 if(act){const a=act.dataset.invact;const e=game.inv[invSel];
  if(a==="x"){if(e)log(itemDisplayName(e.it)+" — "+(e.it.desc||e.it.kind),"dim");return;}
  invAction(a);return;}
 const row=ev.target.closest("[data-inv]");if(!row)return;invSel=+row.dataset.inv;buildInv();});
// Dadism list: clicking a row selects it; clicking its Cast button casts it (mouse-only casting).
oD.addEventListener("click",(ev)=>{const cast=ev.target.closest("[data-cast]");if(cast){const kn=DADISMS.filter(d=>game.dadisms.includes(d.id));const ci=+cast.dataset.cast;if(kn[ci])castDadism(kn[ci].id);return;}const row=ev.target.closest("[data-dad]");if(!row)return;dadSel=+row.dataset.dad;buildDad();});
// Confirm dialog + option menus: clickable Yes/No (data-cf) and numbered rows (data-menu; -1 = cancel).
cf.addEventListener("click",(ev)=>{const cb=ev.target.closest("[data-cf]");if(cb){resolveConfirm(cb.dataset.cf==="y");return;}const mb=ev.target.closest("[data-menu]");if(mb){resolveMenu(parseInt(mb.dataset.menu,10));return;}});
// Title / class / difficulty / end-screen options: click the same rows the keys trigger.
elLog.addEventListener("click",(ev)=>{
 if(mode===State.TITLE){const opt=ev.target.closest("[data-title]");if(!opt)return;const a=opt.dataset.title;
  if(a==="new"){pendingDaily=false;mode=State.CLASS;syncUI();}
  else if(a==="continue"){if(hasSave()){if(!continueRun()){mode=State.CLASS;syncUI();}}}
  else if(a==="daily"){pendingDaily=true;mode=State.CLASS;syncUI();}
  else if(a==="help"){closeOverlays();ovInstr=true;buildInstr();syncOverlays();}
  else if(a==="best"){closeOverlays();ovBest=true;buildBest();syncOverlays();}
  else if(a==="grave"){closeOverlays();ovGrave=true;buildGraveyard();syncOverlays();}
  return;}
 if(mode===State.CLASS){const cr=ev.target.closest("[data-class]");if(!cr)return;classCursor=+cr.dataset.class;const c=CLASSES[classCursor];syncUI();openConfirm(c.name.toUpperCase()+" — "+(c.backstory||c.blurb)+"   [Y/Enter] Begin the descent · [N] Pick a different Dad",()=>{pendingClass=c;mode=State.DIFF;diffCursor=1;syncUI();});return;}
 if(mode===State.DIFF){const dr=ev.target.closest("[data-diff]");if(!dr)return;if(dr.dataset.diff==="back"){mode=State.CLASS;syncUI();return;}diffCursor=+dr.dataset.diff;const _diff=DIFFICULTY_MODES[diffCursor];log(pendingClass.name+" on "+_diff.name+": "+_diff.flavor,"gold");const _dseed=pendingDaily?dailySeedFor(dailyDateStr()):undefined;pendingDaily=false;newRun(pendingClass,_diff,_dseed);return;}
 if(mode===State.DEAD||mode===State.WIN){const en=ev.target.closest("[data-end]");if(!en)return;const a=en.dataset.end;
  if(a==="title"){mode=State.TITLE;messages=[];syncUI();}
  else if(a==="best"){closeOverlays();ovBest=true;buildBest();syncOverlays();}
  else if(a==="ascent"&&mode===State.WIN&&!game.ascentDone&&!game.ascent&&typeof startAscent==="function"){startAscent();}
  return;}
});
// Skin-tone swatch/arrows on the Dad-select screen (rendered in the status line).
elStatuses.addEventListener("click",(ev)=>{if(mode!==State.CLASS)return;const s=ev.target.closest("[data-skin]");if(!s||typeof SKIN_SWATCHES==="undefined")return;if(s.dataset.skin==="prev")skinCursor=(skinCursor+SKIN_SWATCHES.length-1)%SKIN_SWATCHES.length;else skinCursor=(skinCursor+1)%SKIN_SWATCHES.length;syncUI();});
// On-screen action bar: Scan, Zoom +/-, and Menu(save+quit) — same handlers as their keys.
const oAct=document.getElementById("actionbar");
// Keep the SOUND button label in sync with the mute state (mirrors the [U] key).
function syncMuteBtn(){const b=document.getElementById("btnMute");if(!b)return;const muted=(typeof SFX_MUTED!=="undefined"&&SFX_MUTED);b.textContent=muted?"SOUND ✕":"SOUND";b.title=(muted?"Unmute":"Mute")+" sound (U)";}
if(oAct)oAct.addEventListener("click",(ev)=>{const btn=ev.target.closest("[data-act]");if(!btn)return;
 // Mute is a global toggle (like its key) — handle it BEFORE the play-mode guard so it always works when the bar is visible.
 if(btn.dataset.act==="mute"){if(typeof sfxToggleMute==="function"){sfxToggleMute();syncMuteBtn();if(mode===State.PLAY)log("Sound "+(SFX_MUTED?"muted":"unmuted")+". Click SOUND or press [U] to toggle.","dim");}return;}
 if(mode!==State.PLAY||pendingConfirm||pendingMenu||aiming||placing||ovInv||ovDad||ovBest||ovInstr||ovMap||ovCodex||ovGrave||shopOpen)return;
 const a=btn.dataset.act;if(a==="scan")scanArea();else if(a==="zoomin")doZoom(1);else if(a==="zoomout")doZoom(-1);else if(a==="quit")quitToMenu();else if(a==="throw")quickThrow();else if(a==="place")quickPlace();else if(a==="inv"||a==="dad"||a==="map"||a==="best"||a==="codex"||a==="instr"||a==="grave")openOverlayByName(a);});
// Floating Close button (mouse-only): dismisses any open overlay/shop, same as Esc.
const oClose=document.getElementById("ovClose");
if(oClose)oClose.addEventListener("click",()=>{closeOverlays();if(inspectOn&&typeof toggleInspect==="function")toggleInspect();syncUI();});
// Aim/place CANCEL bar: clears aiming/placing (same effect as pressing Esc) and refreshes the HUD.
const oAim=document.getElementById("aimbar");
if(oAim)oAim.addEventListener("click",(ev)=>{const btn=ev.target.closest("[data-aim]");if(!btn)return;
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