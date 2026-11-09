/* ===== SCATTERED DAD ADVENTURES — ui.js =====
   HUD sync, overlay builders (inventory, shop, bestiary, map, dadisms),
   confirm dialog, inspect helpers.
   Depends on: sprites.js, data.js, game.js, render.js
   =========================================== */

function renderClassPreview(cls){const cv=document.getElementById("classSprPv");if(!cv)return;const cx=cv.getContext("2d");cx.imageSmoothingEnabled=false;cx.fillStyle="#06070b";cx.fillRect(0,0,64,64);const id=cls?cls.id:"";const spr=id==="grill"?SPR_DAD_GRILL:id==="diy"?SPR_DAD_DIY:id==="tech"?SPR_DAD_TECH:id==="gym"?SPR_DAD_GYM:id==="tactical"?SPR_DAD_TACTICAL:id==="sports"?SPR_DAD_SPORTS:id==="yard"?SPR_DAD_YARD:SPR_DAD;if(!spr)return;if(_uiSprImg(cx,spr,64,64))return;const sc=2;for(let y=0;y<spr.length;y++){const row=spr[y];for(let x=0;x<row.length;x++){const ch=row[x];const col=PAL[ch];if(!col)continue;cx.fillStyle=col;cx.fillRect(x*sc,y*sc,sc,sc);}}}
function bar(cls,v,m){return '<span class="bar '+cls+'"><span style="width:'+Math.max(0,Math.min(100,100*v/m))+'%"></span></span>';}
function meter(cls,v){return '<span class="meter '+cls+'"><span style="width:'+Math.max(0,Math.min(100,v))+'%"></span></span>';}
function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function statusChip(id){const S=STATUSES[id];if(!S)return "";const shakes=(id==="thirst"&&game.statuses[id]&&game.statuses[id].craving>=6);const nm=esc(S.name)+(shakes?" (the shakes)":"");const tip=esc((S.name+(shakes?" (the shakes)":""))+" — "+S.desc);return '<span class="st-chip '+(S.bad?"st-bad":"st-good")+'" title="'+tip+'">'+esc(S.icon||S.name)+'<span class="st-tip"><b>'+nm+'</b><br>'+esc(S.desc)+'</span></span>';}
function syncUI(){
 if(typeof _m6SetMode==="function")_m6SetMode(mode===State.PLAY);
 if(mode===State.PLAY&&game&&!_m7Hinted&&typeof COMPACT!=="undefined"&&COMPACT){_m7Hinted=true;log("Field manual: swipe the map to step, tap a tile to walk there, tap your Dad (or WAIT) to wait, press and hold to inspect, tap a status chip to read it. MORE opens the junk drawer: map, Dadvice, codex, traps, zoom, sound. Taped inside the cover, in crayon: \"you are the best dad.\"","dim");}
 if(mode===State.TITLE){const n=Object.keys(discovered).length;const gn=loadGraveyard().length;const dRec=todaysDailyRecord();const dStat=dRec?('best: <b class="l-gold">'+(dRec.outcome==="win"?"WON":"Floor "+dRec.depth)+'</b> as '+dRec.clsName+' ('+dRec.attempts+' attempt'+(dRec.attempts===1?"":"s")+')'):'not yet attempted';elStat.innerHTML='<b style="font-size:16px">SCATTERED DAD ADVENTURES</b> <span class="dim">v'+GAME_VERSION+'</span>';elStatuses.innerHTML="";elLog.innerHTML='<div class="ti-opt" data-title="new">[ENTER] New Adventure</div>'+(hasSave()?'<div class="ti-opt" data-title="continue">[C] Continue Run</div>':'')+'<div class="ti-opt" data-title="daily">[D] Daily Challenge ('+dailyDateStr()+') &middot; <span class="l-dim">'+dStat+'</span></div>'+'<div><span class="ti-opt" data-title="help">[H] How To Play</span> &nbsp; <span class="ti-opt" data-title="best">[B] Discovered Creatures ('+n+'/'+(CREATURES.length+BOSSES.length)+')</span> &nbsp; <span class="ti-opt" data-title="grave">[G] Graveyard ('+gn+')</span> &nbsp; <span class="ti-opt" data-title="backup">[S] Save Backup</span></div>';}
 else if(mode===State.CLASS){elStat.innerHTML='<b>CHOOSE YOUR DAD'+(pendingDaily?' &mdash; DAILY CHALLENGE':'')+'</b> <span class="dim">'+((typeof COMPACT!=="undefined"&&COMPACT)?'(tap a Dad to choose &middot; tap the arrows to change skin)':'(UP/DOWN pick Dad, [ / ] pick skin, ENTER)')+'</span>';const _sk=(typeof SKIN_SWATCHES!=="undefined")?SKIN_SWATCHES[((skinCursor%SKIN_SWATCHES.length)+SKIN_SWATCHES.length)%SKIN_SWATCHES.length]:null;elStatuses.innerHTML=_sk?('<div>Skin Tone: <b>'+_sk.name+'</b> <span class="ti-opt" data-skin="next" title="Click to cycle skin tone" style="display:inline-block;width:12px;height:12px;vertical-align:middle;border:1px solid #000;background:'+_sk.f+'"></span> <span class="l-dim"><span class="ti-opt" data-skin="prev">&larr; [</span> &nbsp; <span class="ti-opt" data-skin="next">] &rarr;</span></span></div>'):"";let h="";CLASSES.forEach((c,i)=>{h+='<div class="ti-opt '+(i===classCursor?"l-gold":"")+'" data-class="'+i+'">'+(i===classCursor?"&#9654; ":"&nbsp;&nbsp; ")+'<b>'+c.name+'</b> &mdash; HP'+c.hp+' STR'+c.str+' DEF'+c.def+' PER'+c.per+' WIS'+c.wis+' &middot; <span class="l-dim">'+c.blurb+'</span></div>';});elLog.innerHTML=h;}
 else if(mode===State.DIFF){elStat.innerHTML='<b>CHOOSE DIFFICULTY'+(pendingDaily?' &mdash; DAILY CHALLENGE':'')+'</b> <span class="dim">(UP/DOWN, ENTER &middot; Esc = back)</span>';elStatuses.innerHTML='<span class="dim">Chosen dad: <b class="l-gold">'+(pendingClass?pendingClass.name:'')+'</b></span>';let h='';DIFFICULTY_MODES.forEach((d,i)=>{h+='<div class="ti-opt '+(i===diffCursor?'l-gold':'')+'" data-diff="'+i+'">'+(i===diffCursor?'&#9654; ':'&nbsp;&nbsp; ')+'<b>'+d.name+'</b> &mdash; <span class="l-dim">'+d.blurb+'</span></div>';});h+='<div class="ti-opt l-dim" data-diff="back" style="margin-top:6px">&larr; Back to Dad select</div>';elLog.innerHTML=h;}
 else if(mode===State.PLAY){elStat.innerHTML=(game.ascent?'<span class="l-gold">[ASCENT] </span>':'')+(game.isDaily?'<span class="l-gold">[DAILY '+(game.dailyDate||"")+']</span> ':'')+'<b>'+game.cls.name+'</b> Lv'+game.level+' '+bar("hp",game.hp,game.maxhp)+' <span class="l-red">'+Math.max(0,game.hp)+'/'+game.maxhp+'</span> &nbsp;Patience '+bar("mox",game.moxie,game.maxmoxie)+' '+game.moxie+'/'+game.maxmoxie+' &nbsp;XP '+bar("xp",game.xp,game.xpNext)+' &nbsp;<span class="l-blu">Floor '+game.depth+'/'+MAXDEPTH+'</span> &nbsp;<b>'+game.gold+' moolah</b> &nbsp;STR '+game.str+' ATK '+effAtk()+' DEF '+effDef()+' PER '+effPer()+' WIS '+effWis()+' &nbsp;Hunger '+meter("hun",100*game.hunger/(game.hungerCap||100))+' Thirst '+meter("thi",100*game.hydra/(game.hydraCap||100));
  const ss=Object.keys(game.statuses);let statusHTML=ss.length?('<span class="st-lbl">Status:</span> '+ss.map(id=>statusChip(id)).join("")):'<span class="dim">No active conditions.</span>';if(game.ally&&game.ally.following){const adef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(adef){let ord='';if(game.allyOrder){if(game.allyOrder.type==="attack"&&game.allyOrder.target&&game.allyOrder.target.def)ord=' &middot; <span class="l-gold">ordered: attack '+game.allyOrder.target.def.name+'</span>';else if(game.allyOrder.type==="move")ord=' &middot; <span class="l-gold">ordered: hold position</span>';}else{ord=' <span class="dim">(Shift+click to direct)</span>';}statusHTML+=' &nbsp;&#9733; <span class="st-good">Ally: '+adef.name+' HP '+Math.max(0,game.ally.hp)+'/'+game.ally.maxhp+'</span>'+ord;}}else if(game.ally&&!game.ally.following){const pdef=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;const questPending=pdef&&pdef.quest&&!game.ally.questDone;statusHTML+=' &nbsp;<span class="dim">('+(questPending?"Friendly nearby — quest pending: "+pdef.quest.summary:"Friendly nearby — walk into them to recruit")+')</span>';}elStatuses.innerHTML=statusHTML;
  elLog.innerHTML=messages.map(m=>'<div class="l-'+m.c+'">'+m.t+'</div>').join("");}
 else if(mode===State.DEAD||mode===State.WIN){const won=mode===State.WIN;elStat.innerHTML='<b style="font-size:16px" class="'+(won?"l-grn":"l-red")+'">'+(won?"VICTORY":"YOU TAPPED OUT")+(game.isDaily?' <span class="l-gold" style="font-size:12px">— DAILY CHALLENGE ('+(game.dailyDate||"")+')</span>':'')+'</b>';elStatuses.innerHTML=(won?'<span class="dim">'+(game.ascentDone?'The Remote is home. Daylight confirmed. Someone has already mentioned the gutters.':'The Remote is recovered. Thermostat: 72.')+'</span>':'<span class="dim">Not defeated. Merely... done for the day. Reached floor '+game.depth+'.</span>')+(game.isDaily?' <span class="dim">Daily result recorded.</span>':'');elLog.innerHTML=(won?'<div class="l-grn">All discovered creatures retained.</div>':((typeof deathReport!=="undefined"&&deathReport)?deathReport.map(m=>'<div class="l-'+m.c+'">'+m.t+'</div>').join(''):'<div class="l-grn">All discovered creatures retained.</div>'))+'<div class="l-gold"><span class="ti-opt" data-end="title">[ENTER] Title</span> &nbsp; <span class="ti-opt" data-end="best">[B] Bestiary</span>'+(won&&!game.ascentDone&&!game.ascent?' &nbsp; <span class="ti-opt" data-end="ascent">[A] ASCENT &mdash; carry it home (everything is angrier)</span>':'')+'</div>';}
 if(typeof syncDadSelect==="function")syncDadSelect();
 if(typeof syncTitleCover==="function")syncTitleCover();
 if(typeof syncDurable==="function")syncDurable();
 syncOverlays();}
/* ===== overlays ===== */
const oI=document.getElementById("ovInstr"),oInv=document.getElementById("ovInv"),oD=document.getElementById("ovDad"),oShop=document.getElementById("ovShop"),oB=document.getElementById("ovBest"),oMap=document.getElementById("ovMap"),oCodex=document.getElementById("ovCodex"),oGrave=document.getElementById("ovGrave"),cf=document.getElementById("confirm"),cfT=document.getElementById("cf-text"),cfBtns=document.getElementById("cf-btns");
const elStat=document.getElementById("statline"),elStatuses=document.getElementById("statuses"),elLog=document.getElementById("log");
function syncOverlays(){oI.classList.toggle("show",ovInstr);oInv.classList.toggle("show",ovInv);oD.classList.toggle("show",ovDad);oShop.classList.toggle("show",shopOpen);oB.classList.toggle("show",ovBest);oMap.classList.toggle("show",ovMap);oCodex.classList.toggle("show",ovCodex);oGrave.classList.toggle("show",ovGrave);cf.classList.toggle("show",!!pendingConfirm||!!pendingMenu);const _oc=document.getElementById("ovClose");if(_oc)_oc.style.display=(ovInstr||ovInv||ovDad||shopOpen||ovBest||ovMap||ovCodex||ovGrave)&&!pendingConfirm&&!pendingMenu?"block":"none";syncDpad();syncActionBar();syncAimBar();_m9Body();}
// Overlay-open shared by the I/K/M/H/B/J keys and the on-screen action-bar panel buttons.
// Opens the named overlay via the SAME closeOverlays()+build+syncOverlays() path the keys use, so behaviour is identical.
function openOverlayByName(name){
 if((name==="inv"||name==="dad"||name==="map")&&mode!==State.PLAY)return;
 if(name==="inv"){ovInv=!ovInv;if(ovInv){closeOverlays();ovInv=true;invSel=Math.min(invSel,Math.max(0,game.inv.length-1));buildInv();}syncOverlays();return;}
 if(name==="dad"){ovDad=!ovDad;if(ovDad){closeOverlays();ovDad=true;dadSel=0;buildDad();}syncOverlays();return;}
 if(name==="map"){ovMap=!ovMap;if(ovMap){closeOverlays();ovMap=true;buildMap();}syncOverlays();return;}
 if(name==="instr"){ovInstr=!ovInstr;if(ovInstr){closeOverlays();ovInstr=true;buildInstr();}syncOverlays();return;}
 if(name==="best"){ovBest=!ovBest;if(ovBest){closeOverlays();ovBest=true;buildBest();}syncOverlays();return;}
 if(name==="codex"){ovCodex=!ovCodex;if(ovCodex){closeOverlays();ovCodex=true;buildCodex();}syncOverlays();return;}
 if(name==="grave"){ovGrave=!ovGrave;if(ovGrave){closeOverlays();ovGrave=true;buildGraveyard();}syncOverlays();return;}
}
// On-screen D-pad: visible only during live play, hidden whenever a modal/overlay is up.
/* M7: on-screen D-pad is optional. Preference in localStorage "sda_dpad" ("1" show / "0" hide); default: shown on desktop, hidden on compact/touch layouts (swipe instead). */
var aimTgt=null,_m7Hinted=false;
function dpadOn(){let p=null;try{p=localStorage.getItem("sda_dpad");}catch(e){}if(p==="1")return true;if(p==="0")return false;return !(typeof COMPACT!=="undefined"&&COMPACT);}
function toggleDpadPref(){const on=!dpadOn();try{localStorage.setItem("sda_dpad",on?"1":"0");}catch(e){}if(typeof _m6CtlMax!=="undefined"){_m6HudMax=0;_m6CtlMax=0;}
 log(on?"The D-pad unfolds. Tradition is honored.":"The D-pad folds away. Swipe the map to step; tap your Dad to wait.","dim");syncUI();if(typeof _m6Refit==="function"&&typeof COMPACT!=="undefined"&&COMPACT)_m6Refit();}
function syncDpad(){if(document.querySelectorAll)document.querySelectorAll('[data-act="pad"]').forEach(pb=>{pb.textContent=dpadOn()?"D-PAD \u2713":"D-PAD";});try{document.body.classList.toggle("m-nopad",!dpadOn());}catch(e){}const dp=document.getElementById("dpad");if(!dp)return;const anyOv=ovInv||ovDad||ovBest||ovInstr||ovMap||ovCodex||ovGrave||shopOpen||!!pendingConfirm||!!pendingMenu||aiming||placing;dp.style.display=(mode===State.PLAY&&!anyOv&&dpadOn())?"grid":"none";}
// On-screen action bar (Scan / Zoom / Menu): same visibility rules as the D-pad.
function syncActionBar(){const ab=document.getElementById("actionbar");if(!ab)return;const anyOv=ovInv||ovDad||ovBest||ovInstr||ovMap||ovCodex||ovGrave||shopOpen||!!pendingConfirm||!!pendingMenu||aiming||placing;const cpt=(typeof COMPACT!=="undefined"&&COMPACT);const vis=mode===State.PLAY&&!anyOv;ab.style.display=vis?(cpt?"grid":"flex"):"none";if(_m8More&&(!vis||!cpt))setMoreOpen(false);}
/* M8: compact "More" drawer (#moresheet). Opened by the MORE button; closes on backdrop tap, Close, Esc, or any action except SOUND / D-PAD. */
var _m8More=false;
/* The sheet sits just above the action bar (portrait) or left of the side column (landscape), so the bar stays visible and tappable. */
function _m8Place(){const s=document.getElementById("moresheet"),ab=document.getElementById("actionbar");if(!s||!ab)return;const de=document.documentElement,vw=de.clientWidth||window.innerWidth,vh=de.clientHeight||window.innerHeight;
 if(typeof LANDSCAPE_UI!=="undefined"&&LANDSCAPE_UI){const h=document.getElementById("hud");const l=Math.min(h?h.getBoundingClientRect().left:vw,ab.getBoundingClientRect().left);s.style.setProperty("--ms-b","0px");s.style.setProperty("--ms-r",Math.max(0,Math.round(vw-l+4))+"px");}
 else{const t=ab.getBoundingClientRect().top;s.style.setProperty("--ms-b",Math.max(0,Math.round(vh-t+4))+"px");s.style.setProperty("--ms-r","0px");}}
const M8_NOTES=["Taped to the drawer, in crayon: \"DAD YOU ARE THE STRONGEST. EVEN YOUR BACK SAYS SO.\"","A sticky note in a child's handwriting: \"thank you for fixing my bike. it is the fastest bike now.\"","A drawing of a stick figure holding a wrench. The caption reads: \"BEST DAD (TRIED HIS BEST)\".","On the back of a receipt: \"we know you are tired. we noticed. love you.\"","Glitter glue, still damp: \"You are doing a good job, Dad. Mom said so too.\"","Folded twice: \"you always come back up the stairs. that is the bravest part.\""];
function setMoreOpen(on){on=!!on&&(typeof COMPACT!=="undefined"&&COMPACT)&&mode===State.PLAY;_m8More=on;try{if(on)_m8Place();document.body.classList.toggle("m-more",on);const s=document.getElementById("moresheet");if(s)s.setAttribute("aria-hidden",on?"false":"true");
 if(on){const n=document.getElementById("msNote");if(n)n.textContent=(Math.random()<0.5)?M8_NOTES[Math.floor(Math.random()*M8_NOTES.length)]:"";}}catch(e){}if(typeof markDirty==="function")markDirty();}
// Aim/place bar: visible only while aiming a throw or placing a trap. Prompts the player to click a target tile.
function syncAimBar(){const ab=document.getElementById("aimbar");if(!ab)return;const on=mode===State.PLAY&&(aiming||placing);if(!on)aimTgt=null;ab.style.display=on?"flex":"none";const go=document.getElementById("aimGo");if(go){go.style.display=(on&&aimTgt)?"":"none";go.textContent=aiming?"THROW":"PLACE";}if(on){const lbl=document.getElementById("aimlabel");const cp=(typeof COMPACT!=="undefined"&&COMPACT);if(lbl)lbl.textContent=cp?(aiming?(aimTgt?"Throw that way?":"Aiming throw — tap a tile or swipe"):(aimTgt?"Place it there?":"Placing trap — tap an adjacent tile")):(aiming?"Aiming throw — click a tile":"Placing trap — click an adjacent tile");}}
// Zoom helper shared by +/- keys and the on-screen ZOOM buttons (respects ZOOM_STEPS cap). MOB-04: below 100% it widens the view (zoomOut) up to the whole floor.
function doZoom(dir){if(dir>0&&zoomOut>0){zoomOut--;fitCanvas();log(zoomOut?"Zoom: a little closer. The floor plan regains some detail.":"Zoom: 100%. Back to the view he was issued.","dim");return;}if(dir>0){if(zoomStep<ZOOM_STEPS.length-1){zoomStep++;fitCanvas();log("Zoom: "+Math.round(ZOOM_STEPS[zoomStep]*100)+"%. His reading glasses are no longer required.","dim");}else{log("Maximum zoom. The tiles are as large as they can be without becoming a safety concern.","dim");}}else{if(zoomStep>0){zoomStep--;fitCanvas();log("Zoom: "+Math.round(ZOOM_STEPS[zoomStep]*100)+"%. He can now see slightly more of his impending doom.","dim");}else if(canZoomOut()){zoomOut++;fitCanvas();log(zoomOutIsFull()?"Zoom: the whole floor. He surveys his domain like a man on a ladder he was told not to climb.":"Zoom: wider view. He steps back from the problem, which is also how he paints.","dim");}else{log("The whole floor is already in view. There is no further back to stand.","dim");}}}
// Quit-to-menu (save + return to title) shared by the Q key and the on-screen MENU button.
function quitToMenu(){closeOverlays();openConfirm("Abandon the descent and return to the main menu? Your progress is saved — you can Continue this run later.",()=>{if(typeof saveRun==="function")saveRun();closeOverlays();mode=State.TITLE;messages=[];syncUI();});}
function closeOverlays(){ovInv=ovDad=ovBest=ovInstr=ovMap=ovCodex=ovGrave=shopOpen=false;combineMark=null;_m9Det=false;_m9Slot=null;syncOverlays();}
function openConfirm(t,fn,lbl){pendingConfirm={fn};if(lbl&&lbl.title){cfT.innerHTML='<b class="cf-title">'+esc(lbl.title)+'</b>'+esc(t);}else cfT.textContent=t;cfT.classList.toggle("cf-story",!!(lbl&&lbl.story));const _y=(lbl&&lbl.yes)||"Yes",_n=(lbl&&lbl.no)||"No";cfBtns.innerHTML=(lbl&&lbl.single)?'<button type="button" class="cf-btn cf-yes cf-single" data-cf="y">'+_y+'</button>':'<button type="button" class="cf-btn cf-yes" data-cf="y">[Y] '+_y+'</button><button type="button" class="cf-btn" data-cf="n">[N] '+_n+'</button>';try{cfT.scrollTop=0;}catch(e){}syncOverlays();}
/* Dad-select story card: shown only after a Dad is chosen (tap card deck "Choose", click a row, or ENTER). One Continue button -> difficulty. Esc/N dismisses. */
function openClassConfirm(c){openConfirm(c.backstory||c.blurb,()=>{pendingClass=c;mode=State.DIFF;diffCursor=1;syncUI();},{title:c.name.toUpperCase(),story:true,single:true,yes:"Continue \u25B8"});}
function resolveConfirm(y){if(!pendingConfirm)return;const fn=pendingConfirm.fn;pendingConfirm=null;syncOverlays();if(y&&fn)fn();}
/* ===== option menu (doors, etc.) ===== */
// Options render as clickable rows (data-menu index) plus a cancel button (data-menu="-1"); keys 1-9/Esc still work.
function openMenu(title,options){pendingMenu={options};cfT.innerHTML='<b>'+title+'</b><br>'+options.map((o,i)=>'<button type="button" class="cf-menu" data-menu="'+i+'"><span class="key">['+(i+1)+']</span> '+o.label+'</button>').join('');cfBtns.innerHTML='<button type="button" class="cf-btn" data-menu="-1">[Esc] Cancel</button>';syncOverlays();}
function resolveMenu(i){if(!pendingMenu)return;const opts=pendingMenu.options;pendingMenu=null;syncOverlays();if(i>=0&&i<opts.length&&opts[i].fn)opts[i].fn();}
function buildInstr(){oI.innerHTML='<h1>HOW TO PLAY</h1>'+(typeof openSaveBackup==="function"?'<p class="m12-howto"><button type="button" data-m12open="1" title="Back up, restore, or install">SAVE BACKUP &amp; INSTALL</button> <span class="dim">Copy your saves to a code or file, restore them on another device, or install the game.</span></p>':'')
 +'<h2>The Situation</h2>'
 +'<p>It is Saturday. The Remote of Ultimate Authority is missing, the thermostat is stuck at 81&deg;. You are Dad. This is not a situation. This is a quest.</p>'
 +'<p>The descent spans <b>100 floors</b> across 10 distinct biomes — each one a suburban battlefield you have visited before, under far less dire circumstances:</p>'
 +'<p><b>Floors 1-10: The House</b> — Your own domain, inexplicably hostile. The dog has sides now.<br>'
 +'<b>Floors 11-20: Lowe &amp; Behold</b> — The hardware store. A labyrinth. You have never left in under 40 minutes.<br>'
 +'<b>Floors 21-30: The Park</b> — Deceptively wholesome. Do not let the geese fool you.<br>'
 +'<b>Floors 31-40: Vastco</b> — The bulk-goods warehouse. Every aisle is a commitment. Every cart is a siege engine.<br>'
 +'<b>Floors 41-50: The Soccer Complex</b> — Six fields. Zero parking. Infinite travel sports parents.<br>'
 +'<b>Floors 51-60: The School</b> — Drop-off was this morning. It\'s still this morning somehow.<br>'
 +'<b>Floors 61-70: The Family Restaurant</b> — Wait is 45 minutes. Kitchen noise is permanent. Bread basket strategy is required.<br>'
 +'<b>Floors 71-80: IDKEA</b> — Ancient Swedish labyrinth. The map helps no one. The meatballs are not the reward.<br>'
 +'<b>Floors 81-90: The Neighborhood</b> — Everyone knows your name and opinions about your lawn.<br>'
 +'<b>Floors 91-100: The HOA Dominion</b> — Final biome. The HOA President awaits. Bring documentation.</p>'
 +'<p>Descend '+MAXDEPTH+' floors. Recover the Remote. Fix the thermostat. Return a hero. (They will ask you to clean the gutters. This is already scheduled.)</p>'
 +'<h2>Controls</h2><p>On the Dad-select screen, <span class="key">[</span> and <span class="key">]</span> cycle your skin tone (the default is a proud suburban orange no flooring dares to wear). <span class="key">Arrows/WASD</span> move (bump to attack). <span class="key">7/9/1/3 or Home/PgUp/End/PgDn</span> move diagonally. <span class="key">Space</span> wait. <span class="key">Click</span> a tile to inspect; click adjacent to move/attack.</p>'
 +'<p><span class="key">I</span> Inventory &middot; <span class="key">K</span> Book of Dadvice &middot; <span class="key">X</span> Scan (radius perception sweep) &middot; <span class="key">T</span> Throw &middot; <span class="key">M</span> Map &middot; <span class="key">H</span> Help &middot; <span class="key">B</span> Bestiary &middot; <span class="key">Q</span> Quit to main menu (run saved) &middot; <span class="key">U</span> Mute/unmute sound &middot; <span class="key">+/=</span> Zoom in &middot; <span class="key">-</span> Zoom out (7 steps: 100%–250%) &middot; <span class="key">Esc</span> close.</p>'
 +'<h2>Mouse-Only Play</h2><p>Every action is reachable with the mouse alone &mdash; no keyboard required. Use the on-screen <b>D-pad</b> to move/wait, and the action-bar buttons under it: <b>SCAN / ZOOM +/&minus; / THROW / PLACE</b> to scan, zoom, throw an item, or place a trap; <b>BAG / DADVICE / MAP / BESTIARY / CODEX / HELP</b> to open each panel; and <b>MENU</b> to save-and-quit. Any open panel is dismissed with the &#10005; <b>Close</b> button (top-right). Click any title, class, difficulty, skin-tone, menu, or Yes/No option directly. To throw or place, press <b>THROW</b> or <b>PLACE</b> (or the Throw/Place button on a bag item), then click the target tile &mdash; a throw travels toward the tile you click, a trap drops on the adjacent tile you click, and <b>CANCEL</b> aborts. Cast Dadisms with the <b>Cast</b> button in the Book of Dadvice. Keyboard shortcuts still work if you prefer them.</p>'
 +'<h2>Sight &amp; Scanning</h2><p>You only see what is in line of sight &mdash; walls and closed doors block your view. <span class="key">Scan (X)</span> sweeps a radius that grows with Perception, marking traps, revealing hidden spaces, and noting items. Inspecting things also grows Perception over time. Inspect a suspicious wall to find <span class="key">hidden spaces</span>.</p>'
 +'<h2>Survival</h2><p>Watch <span class="key">Hunger</span> and <span class="key">Thirst</span> meters &mdash; let either fill and you take damage. Eat food, drink fluids. (The alcoholism-themed "The Thirst" is a separate <i>Learning Experience</i>, not the hydration meter.)</p>'
 +'<h2>Gear</h2><p>Equip a weapon plus armor on <span class="key">head, torso, arms, legs, feet</span>, and up to <span class="key">2 charms</span> (neck/ring/hair). Found gear rolls affixes: <span class="tag t-help">Upgrade</span> helps, <span class="tag t-hinder">Learning Experience</span> hinders, <span class="tag t-nothing">no effect</span> does nothing.</p>'
 +'<h2>Combat &amp; Throwing</h2><p>Damage is rolled randomly up to your potential, reduced by the foe\'s defense. Throw objects (<span class="key">T</span>) to damage foes or to <span class="key">disarm traps</span> from afar (the object may break). Dropped and thrown items stay on the floor.</p>'
 +'<h2>Trap-Crafting</h2><p>Handy classes (<span class="key">DIY, Tactical, Tech</span>) can <span class="key">combine</span> junk into placeable traps, then <span class="key">place</span> them (<span class="key">P</span>, then a direction) on an adjacent tile &mdash; one trap per tile. Pursuing foes that step on your trap spring it. Stack up to 5 of the same trap per inventory slot.</p>'
 +'<h2>Dadisms &amp; Vendors</h2><p>Cast <b>Dadisms</b> from the <b>Book of Dadvice</b> (<span class="key">K</span>) using <b>Patience</b>. <b>Pro Tips</b> grant permanent upgrades. <b>Vendors</b> appear every 10 floors &mdash; spend moolah.</p>'
 +'<h2>Leveling</h2><p>Defeating foes grants XP; every level raises HP + a stat and heals you. Perception grows from inspecting/scanning.</p><p class="dim">Press H or Esc to return.</p>';}
function rarClass(it){return (it&&["weapon","armor","charm"].includes(it.kind)&&it.idd===false)?"Common":((it&&it.rarity)||"Common");}
function affixHTML(g){if(g&&["weapon","armor","charm"].includes(g.kind)&&g.idd===false)return '<span class="tag t-nothing">??? unidentified — equip it or read the Owner&rsquo;s Manual</span>';return (g.affixes||[]).map(a=>{const mods=(a.type==="hinder"&&a.mods)?Object.entries(a.mods).filter(([k])=>["atk","def","per","wis"].includes(k)).map(([k,v])=>(v>0?"+":"")+v+k.toUpperCase()).join(", "):"";return '<span class="tag t-'+a.type+'">'+(a.type==="help"?"Upgrade: ":a.type==="hinder"?"Learning Exp: ":"")+a.name+(mods?" ("+mods+")":"")+"</span>";}).join("");}
function gearStat(g){return [["atk","ATK"],["def","DEF"],["per","PER"],["wis","WIS"],["cap","slots"]].filter(p=>g[p[0]]).map(p=>(g[p[0]]>0?"+":"")+g[p[0]]+" "+p[1]).join(" ");}
function itemMeta(it){if(["weapon","armor","charm"].includes(it.kind)){let reach="";if(it.kind==="weapon"&&it.idd!==false){const r=it.reach||1;reach=' &middot; Reach '+r+' tile'+(r===1?'':'s');}return gearStat(it)+reach+(it.wear?(" ("+it.wear+")"):"")+" "+affixHTML(it);}if(it.kind==="consumable"){if(!consKnown(it))return '<span class="tag t-nothing">??? unidentified — drink it to find out, or use the Owner&rsquo;s Manual / Sticky Note of Identification</span>'+(it.throw?' &middot; throwable':'');const e=[];if(it.heal)e.push("+"+it.heal+"HP");if(it.nourish)e.push("food");if(it.hydrate)e.push("drink");if(it.cures)e.push("cures "+it.cures.join("/"));if(it.throw)e.push("throwable");return e.join(" &middot; ")+" — "+it.desc;}return (it.throw?"throwable &middot; ":"")+(it.placeable?"placeable trap &middot; ":"")+(it.desc||"");}
/* M9 (compact only): item detail is a bottom sheet. _m9Det = sheet open; _m9Slot = worn slot shown (else the selected bag item). */
var _m9Det=false,_m9Slot=null;
const M9_SLOTNAME={weapon:"Weapon",head:"Head",torso:"Torso",arms:"Arms",legs:"Legs",feet:"Feet",charm1:"Charm 1",charm2:"Charm 2"};
function _m9Detail(sel,acts,unid){let inner="";
 if(_m9Slot&&!game.equip[_m9Slot])_m9Slot=null;
 if(_m9Slot){const g=game.equip[_m9Slot];const marked=combineMark&&combineMark.src==="equip"&&combineMark.slot===_m9Slot;
  inner='<span class="m9-dn r-'+rarClass(g)+'">'+itemDisplayName(g)+'</span> <span class="meta">[worn: '+M9_SLOTNAME[_m9Slot]+']</span> '+affixHTML(g)+'<br><span class="meta">'+itemMeta(g)+'</span>'+(g.desc?'<div class="meta" style="margin-top:4px">'+g.desc+'</div>':'')
   +'<div class="invacts"><button type="button" class="cf-btn" data-m9="un">Remove</button><button type="button" class="cf-btn" data-m9="cmb">'+(marked?'Combine (marked)':'Combine')+'</button></div>';}
 else if(sel){inner='<span class="m9-dn r-'+rarClass(sel.it)+'">'+itemDisplayName(sel.it)+'</span>'+(sel.qty>1?' <span class="meta">&times;'+sel.qty+'</span>':'')+(unid?' <span class="meta">(unidentified)</span>':'')+' <span class="meta">['+sel.it.kind+']</span><br><span class="meta">'+itemMeta(sel.it)+'</span>'+acts;}
 else _m9Det=false;
 if(!_m9Det)return '<div class="detail"></div>';
 const m=messages.length?messages[messages.length-1]:null;
 return '<div class="detail m9-open"><div class="m9-dh"><span class="m9-grip"></span><button type="button" class="cf-btn" data-m9="x">&#10005; Close</button></div>'+inner+(m?'<div class="m9-last"><b>Latest:</b> '+esc(m.t)+'</div>':'')+'</div>';}
function _m9Body(){try{document.body.classList.toggle("m9-det",!!(ovInv&&_m9Det&&typeof COMPACT!=="undefined"&&COMPACT));}catch(e){}}
function _m9Pad(){_m9Body();if(typeof COMPACT==="undefined"||!COMPACT){if(oInv.style&&oInv.style.paddingBottom)oInv.style.paddingBottom="";return;}try{const d=oInv.querySelector(".detail.m9-open");oInv.style.paddingBottom=d?(d.offsetHeight+16)+"px":"";oInv.style.scrollPaddingBottom=d?(d.offsetHeight+8)+"px":"";}catch(e){}}
function _m9Act(a){if(a==="x"){_m9Det=false;_m9Slot=null;buildInv();return;}
 if(a==="un"&&_m9Slot){const sl=_m9Slot;unequip(sl);if(!game.equip[sl]){_m9Det=false;_m9Slot=null;}buildInv();syncUI();return;}// cursed gear stays on: keep the sheet open so its "Latest" line explains why
 if(a==="cmb"&&_m9Slot){markCombineEquip(_m9Slot);return;}}
function buildInv(){const SL=[["weapon","Weapon"],["head","Head"],["torso","Torso"],["arms","Arms"],["legs","Legs"],["feet","Feet"],["charm1","Charm 1"],["charm2","Charm 2"]];
 let h='<h1>INVENTORY &amp; EQUIPMENT</h1><div class="slots">';for(const[k,lab]of SL){const g=game.equip[k];const eqMark=(combineMark&&combineMark.src==="equip"&&combineMark.slot===k)?" mark":"";h+='<div class="slot'+eqMark+'" data-slot="'+k+'"><div class="sl">'+lab+'</div>'+(g?('<span class="r-'+rarClass(g)+'">'+g.name+'</span> '+affixHTML(g)+'<br><span class="meta">'+gearStat(g)+((typeof COMPACT!=="undefined"&&COMPACT)?'':' &middot; click to remove &middot; shift-click to combine')+'</span>'):'<span class="meta">— empty —</span>')+'</div>';}
 h+='</div>'+((typeof COMPACT!=="undefined"&&COMPACT)?'<p class="dim m9-tip">Tap an item for its options. Tap a worn slot to remove it or combine it. Slots '+game.inv.length+'/'+invCap()+'</p>':'<p class="dim">arrows select &middot; [E] use/equip &middot; [T] throw &middot; [P] place trap &middot; [C] combine (mark two; shift-click a worn slot to combine it) &middot; [D] drop &middot; click a worn slot to unequip &middot; [Esc] close &nbsp; Slots '+game.inv.length+'/'+invCap()+'</p>');
 h+='<div class="invgrid">';const cap=invCap();for(let i=0;i<cap;i++){const e=game.inv[i];if(e){const it=e.it;h+='<div class="cell k-'+it.kind+(i===invSel?" sel":"")+((combineMark&&combineMark.src==="inv"&&combineMark.e===e)?" mark":"")+'" data-inv="'+i+'"><canvas class="ic" width="32" height="32"></canvas>'+(e.qty>1?'<div class="q">'+e.qty+'</div>':'')+'</div>';}else h+='<div class="cell" data-inv="'+i+'"></div>';}
 h+='</div>';
 {const kr=(game.keyring||[]).slice().sort((a,b)=>(a.floor||0)-(b.floor||0));h+='<div class="keyring"><div class="sl">KEY RING'+(kr.length?'':' — empty')+'</div>';if(kr.length){h+='<div class="keys">';kr.forEach(k=>{const cur=k.floor===game.depth;h+='<span class="keytag'+(cur?' cur':'')+'" title="'+(k.desc||'').replace(/"/g,'&quot;')+'">🔑 '+(k.floor?('Fl '+k.floor):'Mystery')+(cur?' ✓':'')+'</span>';});h+='</div>';}else{h+='<span class="meta">No keys yet. Dads label them in Sharpie; you have nothing to label.</span>';}h+='</div>';}
 const sel=game.inv[invSel];const unid=sel&&["weapon","armor","charm"].includes(sel.it.kind)&&sel.it.idd===false;const consUnid=sel&&sel.it.kind==="consumable"&&!consKnown(sel.it);
 // Mouse-only action strip for the selected bag item — each button fires the SAME invAction() branch as its key (no duplicated logic). Examine logs the item's flavor.
 let _acts='';if(sel){const _it=sel.it;const _useLbl=["weapon","armor","charm"].includes(_it.kind)?"Equip":"Use";const _marked=combineMark&&combineMark.src==="inv"&&combineMark.e===sel;_acts='<div class="invacts" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">'+'<button type="button" class="cf-btn" data-invact="e">'+_useLbl+'</button>'+(_it.throw?'<button type="button" class="cf-btn" data-invact="t">Throw</button>':'')+(_it.placeable?'<button type="button" class="cf-btn" data-invact="p">Place</button>':'')+'<button type="button" class="cf-btn" data-invact="c">'+(_marked?'Combine (marked)':'Combine')+'</button>'+'<button type="button" class="cf-btn" data-invact="d">Drop</button>'+'<button type="button" class="cf-btn" data-invact="x">Examine</button>'+'</div>';}
 if(typeof COMPACT!=="undefined"&&COMPACT)h+=_m9Detail(sel,_acts,unid||consUnid);else h+='<div class="detail">'+(sel?('<span class="r-'+rarClass(sel.it)+'">'+itemDisplayName(sel.it)+'</span>'+((unid||consUnid)?' <span class="meta">(unidentified)</span>':'')+' <span class="meta">['+sel.it.kind+']</span><br><span class="meta">'+itemMeta(sel.it)+'</span>'+_acts):'<span class="dim">Empty slot.</span>')+'</div>';
 oInv.innerHTML=h;_m9Pad();
 oInv.querySelectorAll('.invgrid .cell[data-inv]').forEach(cell=>{const e=game.inv[+cell.dataset.inv];if(!e)return;const cv=cell.querySelector('canvas.ic');if(!cv)return;const cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;const spr=itemIconSprite(e.it);const sc=spr.length===32?1:2;cx.clearRect(0,0,32,32);if(_uiSprImg(cx,spr,32,32))return;for(let y=0;y<spr.length;y++){const row=spr[y];for(let x=0;x<row.length;x++){const col=PAL[row[x]];if(!col)continue;cx.fillStyle=col;cx.fillRect(x*sc,y*sc,sc,sc);}}});}
function shortName(n){return n.length>22?n.slice(0,21)+"…":n;}
function buildDad(){let h='<h1>BOOK OF DADVICE</h1><p class="dim">Dadisms cost Patience ('+game.moxie+'/'+game.maxmoxie+'). arrows select &middot; [ENTER] cast &middot; [Esc] close</p>';const known=DADISMS.filter(d=>game.dadisms.includes(d.id));if(!known.length)h+='<p class="dim">No Dadisms.</p>';known.forEach((d,i)=>{const can=game.moxie>=d.cost;h+='<div class="row'+(i===dadSel?" sel":"")+'" data-dad="'+i+'"><div><span class="nm" style="'+(can?"":"opacity:.5")+'">'+d.name+'</span><div class="meta">'+d.desc+'</div></div><div class="meta">'+d.cost+' Patience'+(can?' <button type="button" class="cf-btn" data-cast="'+i+'">Cast</button>':'')+'</div></div>';});oD.innerHTML=h;}
function buildShop(){const v=game.vendor.def;let h='<h1>'+v.name+'</h1><p class="dim">'+v.greet+'</p><p><b>'+game.gold+' moolah</b> &middot; click an item to buy &middot; [Esc] leave</p>';function stockQty(it){const r=(it.rarity||"Common");if(r==="Mythic"||r==="Legendary"||r==="Epic")return 1;if(r==="Rare")return 2;if(r==="Uncommon")return 3;return 5;}v.stock.forEach((id,i)=>{const it=mkById(id);if(!it)return;const price=shopPrice(it);const qty=stockQty(it);h+='<div class="row" data-shop="'+i+'"><div><span class="nm r-'+(it.rarity||"Common")+'">'+it.name+'</span><div class="meta">'+itemMeta(it)+'</div></div><div class="meta">'+price+'g &middot; <span class="dim">In stock: '+qty+'</span></div></div>';});
 h+='<h1 style="margin-top:14px">SELL ANYTHING</h1><p class="dim">"I\'ll take it off your hands." click an item to sell &middot; he buys everything</p>';
 if(!game.inv.length)h+='<p class="dim">Your pockets are empty. Nothing to sell.</p>';
 game.inv.forEach((e,i)=>{const it=e.it;const sp=sellPrice(it);h+='<div class="row" data-sell="'+i+'"><div><span class="nm r-'+rarClass(it)+'">'+itemDisplayName(it)+(e.qty>1?' &times;'+e.qty:'')+'</span><div class="meta">'+(isCursed(it)?'<span class="tag t-hinder">CURSED — hex-tax ('+sp+'g)</span>':itemMeta(it))+'</div></div><div class="meta l-gold">+'+sp+'g</div></div>';});
 oShop.innerHTML=h;}

/* ===== DAD'S COMPENDIUM (Codex) ===== */
const CODEX_TABS=["Weapons","Armor","Charms","Consumables","Creatures","Bosses","Recipes"];
function buildCodex(){
 /* ---- sprite renderer helper (works for 16x16 and 32x32) ---- */
 function renderSpr(cv,spr){
  if(!spr||!cv)return;
  const cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;
  cx.clearRect(0,0,cv.width,cv.height);
  if(_uiSprImg(cx,spr,cv.width,cv.height))return;
  const s=Math.floor(cv.width/spr.length);
  for(let y=0;y<spr.length;y++){const row=spr[y];for(let x=0;x<row.length;x++){const col=PAL[row[x]];if(!col)continue;cx.fillStyle=col;cx.fillRect(x*s,y*s,s,s);}}
 }
 /* ---- tab header ---- */
 let h='<h1>THE DAD\'S COMPENDIUM</h1>';
 h+='<div class="cdx-tabs">';
 CODEX_TABS.forEach((t,i)=>h+='<button class="cdx-tab'+(i===codexTab?' cdx-tab-sel':'')+'" data-tab="'+i+'">['+((i+1))+'] '+t+'</button>');
 h+='</div><div class="cdx-body">';
 /* ---- content per tab ---- */
 if(codexTab===0){/* Weapons */
  h+='<div class="cdx-grid cdx-grid-item">';
  WEAPONS.forEach(w=>{
   const extra=[];
   if(w.reach&&w.reach>1)extra.push('Reach '+w.reach);
   if(w.throw)extra.push('Throw '+w.throw.dmg+' dmg / '+((w.throw.range||8))+' tiles');
   const rar=w.baseRarity||'Common';
   h+='<div class="cdx-card" data-wpn="'+w.id+'">'
    +'<canvas class="cdx-ic" width="64" height="64" data-spr-wpn="'+w.id+'"></canvas>'
    +'<div class="cdx-nm r-'+rar+'">'+w.name+'</div>'
    +'<div class="cdx-st">ATK '+w.atk+(extra.length?' &bull; '+extra.join(' &bull; '):'')+'</div>'
    +'<div class="cdx-ds">'+w.desc+'</div>'
    +'</div>';
  });
  h+='</div>';
 }else if(codexTab===1){/* Armor */
  h+='<div class="cdx-grid cdx-grid-item">';
  ARMORS.forEach(a=>{
   const stats=[]; if(a.def)stats.push('DEF +'+a.def); if(a.atk)stats.push('ATK +'+a.atk); if(a.per)stats.push('PER +'+a.per); if(a.wis)stats.push('WIS +'+a.wis); if(a.cap)stats.push('Slots +'+a.cap);
   h+='<div class="cdx-card">'
    +'<canvas class="cdx-ic" width="64" height="64" data-spr-item="'+a.id+'"></canvas>'
    +'<div class="cdx-nm">'+a.name+'</div>'
    +'<div class="cdx-st">['+a.slot+'] '+(stats.join(' &bull; ')||'—')+'</div>'
    +'<div class="cdx-ds">'+a.desc+'</div>'
    +'</div>';
  });
  h+='</div>';
 }else if(codexTab===2){/* Charms */
  h+='<div class="cdx-grid cdx-grid-item">';
  CHARMS.forEach(c=>{
   const stats=[]; if(c.def)stats.push('DEF +'+c.def); if(c.atk)stats.push('ATK +'+c.atk); if(c.per)stats.push('PER +'+c.per); if(c.wis)stats.push('WIS +'+c.wis);
   h+='<div class="cdx-card">'
    +'<canvas class="cdx-ic" width="64" height="64" data-spr-item="'+c.id+'"></canvas>'
    +'<div class="cdx-nm">'+c.name+'</div>'
    +'<div class="cdx-st">['+c.wear+'] '+(stats.join(' &bull; ')||'—')+'</div>'
    +'<div class="cdx-ds">'+c.desc+'</div>'
    +'</div>';
  });
  h+='</div>';
 }else if(codexTab===3){/* Consumables */
  /* MOB-07: only consumables identified in this run are listed; the rest are "???" cards. */
  const _kc=(typeof game!=="undefined"&&game&&game.knownConsumables)||[];
  h+='<p class="dim">Identified this run: '+CONSUMABLES.filter(c=>_kc.includes(c.id)).length+' / '+CONSUMABLES.length+'. Forgotten at the start of every run, like the grocery list.</p>';
  h+='<div class="cdx-grid cdx-grid-item">';
  CONSUMABLES.forEach(c=>{
   if(!_kc.includes(c.id)){h+='<div class="cdx-card" style="opacity:.5"><canvas class="cdx-ic" width="64" height="64"></canvas><div class="cdx-nm">??? ? ?</div><div class="cdx-st">Not yet identified this run</div><div class="cdx-ds">Consume one or read the manual. Nobody reads the manual.</div></div>';return;}
   const eff=[];
   if(c.heal)eff.push('+'+c.heal+' HP');
   if(c.nourish)eff.push('Nourish '+c.nourish);
   if(c.hydrate)eff.push('Hydrate '+c.hydrate);
   if(c.moxie)eff.push('+'+c.moxie+' Patience');
   if(c.cures)eff.push('Cures: '+c.cures.join('/'));
   if(c.causes)eff.push('Causes: '+c.causes);
   if(c.alcohol)eff.push('Alcohol');
   if(c.throw)eff.push('Throwable ('+c.throw.dmg+' dmg)');
   h+='<div class="cdx-card">'
    +'<canvas class="cdx-ic" width="64" height="64" data-spr-item="'+c.id+'"></canvas>'
    +'<div class="cdx-nm">'+c.name+'</div>'
    +'<div class="cdx-st">'+(eff.join(' &bull; ')||'No effect')+'</div>'
    +'<div class="cdx-ds">'+c.desc+'</div>'
    +'</div>';
  });
  h+='</div>';
 }else if(codexTab===4){/* Creatures */
  /* MOB-07: matches the Bestiary: only creatures you have ever encountered; the rest are "???" cards. */
  h+='<p class="dim">Logged: '+CREATURES.filter(c=>discovered[c.id]).length+' / '+CREATURES.length+'. Retained across all runs, as in the Bestiary.</p>';
  h+='<div class="beast-grid">';
  CREATURES.forEach(c=>{
   if(!discovered[c.id]){h+='<div class="bcard und"><canvas width="64" height="64"></canvas><div class="bn">??? ? ?</div><div class="bs">Not yet encountered</div><div class="bd">Venture deeper.</div></div>';return;}
   h+='<div class="bcard" data-cid="'+c.id+'">'
    +'<canvas width="64" height="64" data-spr-cr="'+c.id+'"></canvas>'
    +'<div class="bn">'+c.name+'</div>'
    +'<div class="bs">'+c.biome+' &bull; HP '+c.hp+' ATK '+c.atk+' DEF '+c.def+'</div>'
    +'<div class="bd">'+c.flavor+'</div>'
    +'</div>';
  });
  h+='</div>';
 }else if(codexTab===5){/* Bosses */
  /* MOB-07: matches the Bestiary: only bosses you have ever encountered. */
  h+='<p class="dim">Logged: '+BOSSES.filter(b=>discovered[b.id]).length+' / '+BOSSES.length+'. Retained across all runs, as in the Bestiary.</p>';
  h+='<div class="beast-grid">';
  BOSSES.forEach(b=>{
   if(!discovered[b.id]){h+='<div class="bcard und"><canvas width="64" height="64"></canvas><div class="bn">??? ? ?</div><div class="bs">BOSS &bull; Not yet encountered</div><div class="bd">Venture deeper.</div></div>';return;}
   h+='<div class="bcard" data-bid="'+b.id+'">'
    +'<canvas width="64" height="64" data-spr-cr="'+b.id+'"></canvas>'
    +'<div class="bn r-Legendary">'+b.name+' <span class="r-Common">[BOSS &bull; Floor '+b.floor+']</span></div>'
    +'<div class="bs">HP '+b.hp+' ATK '+b.atk+' DEF '+b.def+'</div>'
    +'<div class="bd">'+b.flavor+'</div>'
    +'</div>';
  });
  h+='</div>';
 }else if(codexTab===6){/* Recipes */
  const known=typeof game!=="undefined"&&game&&game.knownRecipes?game.knownRecipes:[];
  h+='<div class="cdx-list">';
  if(!RECIPES||!RECIPES.length){h+='<p class="dim">No recipes defined.</p>';}
  else{RECIPES.forEach(r=>{
   const key=r.a+"+"+r.b;
   const isKnown=known.includes(key)||r.desc.includes("(Grillmaster")||r.classes||r.lock;
   // Basic recipes always shown; class-locked shown w/ class; YallTube recipes hidden until found
   const alwaysVisible=!!(r.lock||r.classes);
   const needsVideo=!isKnown&&!alwaysVisible&&!r.lock&&!r.classes;
   const aName=(typeof CONSUMABLES!=="undefined"?CONSUMABLES.find(c=>c.id===r.a):null)||(typeof OBJECTS!=="undefined"?OBJECTS.find(o=>o.id===r.a):null);
   const bName=(typeof CONSUMABLES!=="undefined"?CONSUMABLES.find(c=>c.id===r.b):null)||(typeof OBJECTS!=="undefined"?OBJECTS.find(o=>o.id===r.b):null);
   const aLabel=aName?aName.name:r.a;const bLabel=bName?bName.name:r.b;
   if(needsVideo){h+='<div class="cdx-recipe locked"><span class="dim">??? + ??? → ???</span><div class="meta">Find a YallTube DIY Video to unlock.</div></div>';}
   else{h+='<div class="cdx-recipe">'
    +'<span class="r-'+(r.lock||r.classes?"Uncommon":"Common")+'">'+aLabel+' + '+bLabel+'</span>'
    +' → <span class="l-gold">'+r.out.name+'</span>'
    +(r.lock?' <span class="meta">['+CLASSES.find(c=>c.id===r.lock).name+' only]</span>':'')
    +(r.classes?' <span class="meta">['+r.classes.map(id=>CLASSES.find(c=>c.id===id).name).join('/')+'  only]</span>':'')
    +'<div class="meta">'+r.desc+'</div></div>';}
  });}
  h+='</div>';
 }
 h+='</div><p class="dim" style="margin-top:8px">1-7 switch tab &bull; J or Esc close &bull; Scroll to browse</p>';
 oCodex.innerHTML=h;
 /* ---- render weapon sprites (32x32) ---- */
 oCodex.querySelectorAll('canvas[data-spr-wpn]').forEach(cv=>{
  const w=WEAPONS.find(x=>x.id===cv.dataset.sprWpn);
  if(w&&w.sprite)renderSpr(cv,w.sprite);
 });
 /* ---- render per-item sprites (armor / charm / consumable) ---- */
 oCodex.querySelectorAll('canvas[data-spr-item]').forEach(cv=>{
  const id=cv.dataset.sprItem;
  const it=ARMORS.find(x=>x.id===id)||CHARMS.find(x=>x.id===id)||CONSUMABLES.find(x=>x.id===id);
  const spr=(it&&it.sprite)?it.sprite:(it?lootSprite(it):null);
  if(spr)renderSpr(cv,spr);
 });
 /* ---- render creature / boss sprites (16x16 at 4x) ---- */
 oCodex.querySelectorAll('canvas[data-spr-cr]').forEach(cv=>{
  const c=CREATURES.concat(BOSSES).find(x=>x.id===cv.dataset.sprCr);
  if(c)renderSpr(cv,c.sprite);
 });
 /* ---- tab click ---- */
 oCodex.querySelectorAll('.cdx-tab').forEach(btn=>{btn.addEventListener('click',()=>{codexTab=+btn.dataset.tab;buildCodex();});});
}
function buildGraveyard(){const entries=loadGraveyard();let h='<h1>THE GRAVEYARD</h1><p class="dim">Every run recorded here. Every dad who tapped out &mdash; or, improbably, succeeded. '+(entries.length?entries.length+' runs on record.':'No runs yet. That changes immediately.')+'</p>';
 if(!entries.length){oGrave.innerHTML=h+'<p class="dim">[G] or [Esc] to return.</p>';return;}
 h+='<div class="grave-list">';
 entries.forEach(function(e){const won=e.outcome==="win";h+='<div class="grave-entry'+(won?" grave-win":"")+'">'+'<div class="grave-hd"><span class="'+(won?"l-grn":"l-red")+'">'+(won?"&#9733; VICTORY":"&#8224; TAPPED OUT")+'</span> &nbsp;<b>'+esc(e.clsName||e.cls)+'</b> &middot; Floor '+esc(String(e.depth))+(won?" &middot; <span class=\"l-grn\">The Remote recovered</span>":"")+'</div>'+'<div class="grave-st">Kills '+e.kills+' &nbsp;&middot;&nbsp; Moolah '+e.moolah+' &nbsp;&middot;&nbsp; Turns '+e.turns+(e.cause?' &nbsp;&middot;&nbsp; <span style="color:#ff8a7a">'+esc(e.cause)+'</span>':'')+'<span class="dim"> &nbsp;&mdash; '+esc(e.date)+'</span></div>'+'</div>';});
 h+='</div><p class="dim" style="margin-top:8px">[G] or [Esc] to return &bull; Stores last 20 runs</p>';
 oGrave.innerHTML=h;}
function buildBest(){if(typeof COMPACT!=="undefined"&&COMPACT&&typeof buildBestCards==="function"){buildBestCards(oB);return;}oB.classList.remove("bc-host");let h='<h1>DISCOVERED CREATURES</h1><p class="dim">Logged: '+Object.keys(discovered).length+' / '+(CREATURES.length+BOSSES.length)+'. Retained across all runs, deaths, victories.</p><div class="beast-grid">';for(const c of CREATURES.concat(BOSSES)){const d=discovered[c.id];const where=c.biome?c.biome:("BOSS &middot; Floor "+c.floor);if(d)h+='<div class="bcard"><canvas width="64" height="64" data-spr="'+c.id+'"></canvas><div class="bn">'+c.name+'</div><div class="bs">'+where+' &middot; seen '+d.count+'&times; &middot; first floor '+d.firstFloor+'</div><div class="bd">'+c.flavor+'</div></div>';else h+='<div class="bcard und"><canvas width="64" height="64"></canvas><div class="bn">??? ? ?</div><div class="bs">Not yet encountered</div><div class="bd">Venture deeper.</div></div>';}h+='</div><p class="dim">Press B or Esc to return.</p>';oB.innerHTML=h;oB.querySelectorAll('canvas[data-spr]').forEach(cv=>{const c=CREATURES.concat(BOSSES).find(x=>x.id===cv.dataset.spr);const cx=cv.getContext('2d');cx.imageSmoothingEnabled=false;if(_uiSprImg(cx,c.sprite,cv.width,cv.height))return;const s=4;for(let y=0;y<c.sprite.length;y++){const row=c.sprite[y];for(let x=0;x<row.length;x++){const col=PAL[row[x]];if(!col)continue;cx.fillStyle=col;cx.fillRect(x*s,y*s,s,s);}}});}
function buildMap(){const cv=document.getElementById("mapcv");const cx=cv.getContext("2d");cx.imageSmoothingEnabled=false;const s=Math.max(4,Math.floor(Math.min(cv.width/MAP_W,cv.height/MAP_H)));cx.fillStyle="#06070b";cx.fillRect(0,0,cv.width,cv.height);
 for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++){if(!game.seen[y][x])continue;let c="#1b263b";if(game.floor.grid[y][x]===1)c="#2e3a59";else if(game.floor.grid[y][x]===2)c="#1a3a6b";const dr=doorAt(x,y);if(dr)c=dr.locked?"#9c2b2b":"#7a5230";cx.fillStyle=c;cx.fillRect(x*s,y*s,s,s);}
 if(game.seen[game.stairs.y][game.stairs.x]){cx.fillStyle="#f4c430";cx.fillRect(game.stairs.x*s,game.stairs.y*s,s,s);}
 if(game.vendor&&game.seen[game.vendor.y][game.vendor.x]){cx.fillStyle="#5fbf4f";cx.fillRect(game.vendor.x*s,game.vendor.y*s,s,s);}
 for(const e of game.enemies)if(game.vis[e.y][e.x]){cx.fillStyle="#e0453a";cx.fillRect(e.x*s,e.y*s,s,s);}
 if(game.healFountains)for(const fn of game.healFountains){if(game.seen[fn.y][fn.x]){cx.fillStyle=fn.charges>0?"#d44c4c":"#5a2020";cx.fillRect(fn.x*s,fn.y*s,s,s);}}
 cx.fillStyle="#7fb0e8";cx.fillRect(game.px*s,game.py*s,s,s);if(game.fountains)for(const fn of game.fountains){if(game.seen[fn.y][fn.x]){cx.fillStyle=fn.charges>0?"#37b0b0":"#1e4040";cx.fillRect(fn.x*s,fn.y*s,s,s);}}}
/* ===== inventory actions ===== */
function invAction(k){const e=game.inv[invSel];const COLS=8;
 if(k==="ArrowUp"){invSel=Math.max(0,invSel-COLS);buildInv();}
 else if(k==="ArrowDown"){invSel=Math.min(game.inv.length-1,invSel+COLS);buildInv();}
 else if(k==="ArrowLeft"){invSel=Math.max(0,invSel-1);buildInv();}
 else if(k==="ArrowRight"){invSel=Math.min(game.inv.length-1,invSel+1);buildInv();}
 else if(k==="e"||k==="E"){if(!e)return;if(["weapon","armor","charm"].includes(e.it.kind)){equip(e);buildInv();syncUI();}else if(e.it.kind==="consumable"){useConsumable(e);if(ovInv){invSel=Math.min(invSel,Math.max(0,game.inv.length-1));buildInv();}syncUI();}else if(e.it.kind==="protip"){closeOverlays();useProtip(e);}else if(e.it.kind==="object"){useObject(e);if(ovInv)buildInv();syncUI();}else log(e.it.name+": "+e.it.desc,"dim");}
 else if(k==="t"||k==="T"){if(e&&e.it.throw){startThrow(e);}else log("Not throwable.","dim");}
 else if(k==="c"||k==="C"){if(!e)return;const ref={src:"inv",e};if(!combineMark)combineMark=ref;else if(sameRef(combineMark,ref))combineMark=null;else{tryCraft(combineMark,ref);combineMark=null;invSel=Math.min(invSel,Math.max(0,game.inv.length-1));syncUI();}buildInv();}
 else if(k==="d"||k==="D"){if(e){dropItem(e);invSel=Math.max(0,Math.min(invSel,game.inv.length-1));buildInv();syncUI();}}
 else if(k==="p"||k==="P"){if(e&&e.it.placeable){startPlace(e);}else log("That item can't be placed. Craft a trap first.","dim");}}
/* ===== input ===== */
document.addEventListener("keydown",(e)=>{const k=e.key;
 if(_m8More&&k==="Escape"){setMoreOpen(false);e.preventDefault();return;}// M8: Esc closes the More drawer first
 if(pendingMenu){if(k==="Escape"||k==="n"||k==="N")resolveMenu(-1);else if(/^[1-9]$/.test(k))resolveMenu(parseInt(k,10)-1);e.preventDefault();return;}
 if(pendingConfirm){if(k==="y"||k==="Y"||k==="Enter")resolveConfirm(true);else if(k==="n"||k==="N"||k==="Escape")resolveConfirm(false);e.preventDefault();return;}
 if(aiming){if(["ArrowUp","w","W"].includes(k))doThrow(0,-1);else if(["ArrowDown","s","S"].includes(k))doThrow(0,1);else if(["ArrowLeft","a","A"].includes(k))doThrow(-1,0);else if(["ArrowRight","d","D"].includes(k))doThrow(1,0);else if(k==="7"||k==="Home")doThrow(-1,-1);else if(k==="9"||k==="PageUp")doThrow(1,-1);else if(k==="1"||k==="End")doThrow(-1,1);else if(k==="3"||k==="PageDown")doThrow(1,1);else if(k==="Escape"){aiming=false;throwRef=null;log("Throw cancelled.","dim");}e.preventDefault();return;}
 if(placing){if(["ArrowUp","w","W"].includes(k))placeTrap(0,-1);else if(["ArrowDown","s","S"].includes(k))placeTrap(0,1);else if(["ArrowLeft","a","A"].includes(k))placeTrap(-1,0);else if(["ArrowRight","d","D"].includes(k))placeTrap(1,0);else if(k==="Escape"){placing=false;placeRef=null;log("Placement cancelled.","dim");}e.preventDefault();return;}
 if(shopOpen){if(k==="Escape"){shopOpen=false;syncOverlays();}e.preventDefault();return;}
 if(k==="h"||k==="H"){ovInstr=!ovInstr;if(ovInstr){closeOverlays();ovInstr=true;buildInstr();}syncOverlays();e.preventDefault();return;}
 if(k==="b"||k==="B"){ovBest=!ovBest;if(ovBest){closeOverlays();ovBest=true;buildBest();}syncOverlays();e.preventDefault();return;}
 if(k==="g"||k==="G"){ovGrave=!ovGrave;if(ovGrave){closeOverlays();ovGrave=true;buildGraveyard();}syncOverlays();e.preventDefault();return;}
 if(k==="j"||k==="J"){ovCodex=!ovCodex;if(ovCodex){closeOverlays();ovCodex=true;buildCodex();}syncOverlays();e.preventDefault();return;}
 if(mode===State.PLAY&&(k==="m"||k==="M")){ovMap=!ovMap;if(ovMap){closeOverlays();ovMap=true;buildMap();}syncOverlays();e.preventDefault();return;}
 if(mode===State.PLAY&&(k==="i"||k==="I")){ovInv=!ovInv;if(ovInv){closeOverlays();ovInv=true;invSel=Math.min(invSel,Math.max(0,game.inv.length-1));buildInv();}syncOverlays();e.preventDefault();return;}
 if(mode===State.PLAY&&(k==="k"||k==="K")){ovDad=!ovDad;if(ovDad){closeOverlays();ovDad=true;dadSel=0;buildDad();}syncOverlays();e.preventDefault();return;}
 if(mode===State.PLAY&&(k==="q"||k==="Q")){quitToMenu();e.preventDefault();return;}
 if(k==="u"||k==="U"){if(typeof sfxToggleMute==="function"){sfxToggleMute();if(typeof syncMuteBtn==="function")syncMuteBtn();if(mode===State.PLAY)log("Sound "+(SFX_MUTED?"muted":"unmuted")+". [U] to toggle.","dim");}e.preventDefault();return;}
 if(k==="Escape"){closeOverlays();if(inspectOn)toggleInspect();return;}
 if(ovInv){invAction(k);e.preventDefault();return;}
 if(ovDad){const kn=DADISMS.filter(d=>game.dadisms.includes(d.id));if(k==="ArrowUp"){dadSel=(dadSel+kn.length-1)%kn.length;buildDad();}else if(k==="ArrowDown"){dadSel=(dadSel+1)%kn.length;buildDad();}else if(k==="Enter"){if(kn[dadSel])castDadism(kn[dadSel].id);}e.preventDefault();return;}
 if(ovCodex){if(/^[1-7]$/.test(k)){codexTab=parseInt(k,10)-1;buildCodex();e.preventDefault();}return;}
 if(ovBest||ovInstr||ovMap)return;
 if(mode===State.PLAY&&(k==="x"||k==="X")){scanArea();e.preventDefault();return;}
 if(mode===State.PLAY&&(k==="p"||k==="P")){quickPlace();e.preventDefault();return;}
 if(mode===State.PLAY&&(k==="t"||k==="T")){const e2=game.inv.find(en=>en.it.throw);if(e2){startThrow(e2);}else log("Nothing throwable. Open Inventory (I) to pick.","dim");e.preventDefault();return;}
 if(inspectKb){if(k==="ArrowUp"||k==="w"||k==="W"){moveInspect(0,-1);}else if(k==="ArrowDown"||k==="s"||k==="S"){moveInspect(0,1);}else if(k==="ArrowLeft"||k==="a"||k==="A"){moveInspect(-1,0);}else if(k==="ArrowRight"||k==="d"||k==="D"){moveInspect(1,0);}e.preventDefault();return;}
 if(mode===State.TITLE){if(k==="Enter"){pendingDaily=false;mode=State.CLASS;syncUI();}else if((k==="c"||k==="C")&&hasSave()){if(!continueRun()){mode=State.CLASS;syncUI();}}else if(k==="d"||k==="D"){pendingDaily=true;mode=State.CLASS;syncUI();}else if(k==="g"||k==="G"){ovGrave=true;closeOverlays();ovGrave=true;buildGraveyard();syncOverlays();}else if((k==="s"||k==="S")&&typeof openSaveBackup==="function"){openSaveBackup();e.preventDefault();}return;}
 if(mode===State.CLASS){if((k==="ArrowLeft"||k==="ArrowRight")&&typeof dadSelectStep==="function"){dadSelectStep(k==="ArrowLeft"?-1:1);return;}if((k===" "||k==="f"||k==="F")&&typeof dadSelectActive==="function"&&dadSelectActive()){dadSelectFlip();return;}if(k==="ArrowUp"||k==="w"||k==="W"){classCursor=(classCursor+CLASSES.length-1)%CLASSES.length;syncUI();}else if(k==="ArrowDown"||k==="s"||k==="S"){classCursor=(classCursor+1)%CLASSES.length;syncUI();}else if(k==="["&&typeof SKIN_SWATCHES!=="undefined"){skinCursor=(skinCursor+SKIN_SWATCHES.length-1)%SKIN_SWATCHES.length;syncUI();}else if(k==="]"&&typeof SKIN_SWATCHES!=="undefined"){skinCursor=(skinCursor+1)%SKIN_SWATCHES.length;syncUI();}else if(k==="Enter"){openClassConfirm(CLASSES[classCursor]);}return;}
 if(mode===State.DIFF){if(k==="ArrowUp"||k==="w"||k==="W"){diffCursor=(diffCursor+DIFFICULTY_MODES.length-1)%DIFFICULTY_MODES.length;syncUI();}else if(k==="ArrowDown"||k==="s"||k==="S"){diffCursor=(diffCursor+1)%DIFFICULTY_MODES.length;syncUI();}else if(k==="Enter"){const _diff=DIFFICULTY_MODES[diffCursor];log(pendingClass.name+" on "+_diff.name+": "+_diff.flavor,"gold");const _dseed=pendingDaily?dailySeedFor(dailyDateStr()):undefined;pendingDaily=false;newRun(pendingClass,_diff,_dseed);}else if(k==="Escape"||k==="b"||k==="B"){mode=State.CLASS;syncUI();}return;}
 if(mode===State.PLAY){if(game)game.clickPath=[];clearMouseInspect();if(k==="ArrowUp"||k==="w"||k==="W"){tryMove(0,-1);e.preventDefault();}else if(k==="ArrowDown"||k==="s"||k==="S"){tryMove(0,1);e.preventDefault();}else if(k==="ArrowLeft"||k==="a"||k==="A"){tryMove(-1,0);e.preventDefault();}else if(k==="ArrowRight"||k==="d"||k==="D"){tryMove(1,0);e.preventDefault();}
 // Diagonal movement: numpad corners (7/9/1/3) or Home/End/PageUp/PageDown
 else if(k==="7"||k==="Home"){tryMove(-1,-1);e.preventDefault();}else if(k==="9"||k==="PageUp"){tryMove(1,-1);e.preventDefault();}else if(k==="1"||k==="End"){tryMove(-1,1);e.preventDefault();}else if(k==="3"||k==="PageDown"){tryMove(1,1);e.preventDefault();}else if(k===" "){tryMove(0,0);e.preventDefault();}
 // Zoom in/out: + or = zooms in, - zooms out
 else if(k==="+"||k==="="){doZoom(1);e.preventDefault();}else if(k==="-"||k==="_"){doZoom(-1);e.preventDefault();}return;}
 if(mode===State.DEAD||mode===State.WIN){if(k==="Enter"){mode=State.TITLE;messages=[];syncUI();}else if(mode===State.WIN&&(k==="a"||k==="A")&&!game.ascentDone&&!game.ascent&&typeof startAscent==="function"){startAscent();}return;}
});

/* ===== mouse (shop buy + slot unequip) ===== */
oShop.addEventListener("click",(ev)=>{
 const sellRow=ev.target.closest("[data-sell]");
 if(sellRow){const idx=+sellRow.dataset.sell;const e=game.inv[idx];if(!e)return;const sp=sellPrice(e.it);openConfirm("Sell "+itemDisplayName(e.it)+" for "+sp+" moolah? ([Y] confirm / [N] cancel)",()=>sellItem(idx));return;}
 const buyRow=ev.target.closest("[data-shop]");if(!buyRow)return;
 const bidx=+buyRow.dataset.shop;const it=mkById(game.vendor.def.stock[bidx]);if(!it)return;const price=shopPrice(it);
 openConfirm("Buy "+it.name+" for "+price+" moolah? ([Y] confirm / [N] cancel)",()=>{if(game.gold<price){log("Not enough moolah. Need "+price+" moolah.","red");syncUI();return;}if(!addItem(it)){syncUI();return;}game.gold-=price;if(it.kind==="consumable")revealConsumable(it.id);log("Purchased: "+it.name+" for "+price+" moolah.","grn");buildShop();syncUI();});
});
oInv.addEventListener("click",(ev)=>{const sl=ev.target.closest("[data-slot]");if(sl){const slot=sl.dataset.slot;if(typeof COMPACT!=="undefined"&&COMPACT){_m9Slot=game.equip[slot]?slot:null;_m9Det=!!_m9Slot;buildInv();return;}if(ev.shiftKey){markCombineEquip(slot);return;}unequip(slot);buildInv();syncUI();}});
function markCombineEquip(slot){if(!game.equip[slot]){log("Nothing worn there to combine.","dim");return;}const ref={src:"equip",slot};if(!combineMark)combineMark=ref;else if(sameRef(combineMark,ref))combineMark=null;else{tryCraft(combineMark,ref);combineMark=null;}buildInv();syncUI();}
/* M13: draw a sprite's PNG art (N21 pipeline) into a UI canvas when one is registered; false = caller draws the ASCII pixels as before */
function _uiSprImg(cx,spr,w,h){if(typeof hasSpriteImage!=="function"||typeof _sprCached!=="function"||!hasSpriteImage(spr))return false;let e=null;try{e=_sprCached(spr,null,null);}catch(err){e=null;}if(!e||!e.img)return false;cx.imageSmoothingEnabled=false;cx.drawImage(e.cv,0,0,w,h);return true;}
