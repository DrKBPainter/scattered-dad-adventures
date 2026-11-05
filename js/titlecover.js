/* ===== SCATTERED DAD ADVENTURES -- titlecover.js =====
   Mobile title screen (Concept A, "The Cover"): one full-screen comic cover with a random Dad,
   then New Adventure / Continue / Daily Challenge / How To / Bestiary / Graveyard buttons.
   Active only on compact layouts (body.m-compact) while mode===State.TITLE; desktop keeps the
   canvas + HUD menu. Buttons call doTitleAction() (input.js), the same path as the HUD rows.
   Reuses the comic card styles from the Dad-select deck (.dc-face, .dc-mast, .dc-burst, ...).
   Depends on: config.js, sprites.js, data.js, game.js, render.js, ui.js, dadselect.js. Not in the harness.
   ===================================================== */

const TITLE_BURSTS=["THE REMOTE IS MISSING!","THERMOSTAT AT 81!","100 FLOORS OF SUBURBIA!","NOW WITH MORE HOA!","BATTERIES NOT INCLUDED!"];
const TITLE_CAPTIONS=[
 "The thermostat reads 81. Somebody has to go down there.",
 "The Remote is gone. The suburbs swallowed it. Dinner is at six.",
 "One Dad. One hundred floors. Zero instructions read."
];
let _tcEl=null,_tcActive=false,_tcCls=null;

function _tcMonthDay(iso){const M=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];const m=/^(\d+)-(\d+)-(\d+)$/.exec(iso||"");return m?M[+m[2]-1]+" "+(+m[3]):iso;}
function _tcSaveInfo(){try{if(typeof hasSave!=="function"||!hasSave())return null;const s=JSON.parse(localStorage.getItem(SAVE_KEY)||"null");if(!s)return {txt:"Saved run"};const c=CLASSES.find(x=>x.id===s.clsId);return {txt:"Floor "+(s.depth||1)+" · "+(c?c.name.replace(/^The /,""):"Dad")+(s.ascent?" · Ascent":"")+(s.isDaily?" · Daily":"")};}catch(e){return {txt:"Saved run"};}}
function _tcDailyInfo(){let d="",st="not tried yet";try{d=_tcMonthDay(dailyDateStr());const r=todaysDailyRecord();if(r)st=(r.outcome==="win"?"WON":"best: Floor "+r.depth);}catch(e){}return d+" · "+st;}

function _tcBuild(){if(_tcEl||typeof document==="undefined")return;const el=document.createElement("div");el.id="titlecov";
 el.innerHTML='<div class="dc-face dc-front tc-cover"><div class="dc-mast"><span class="dc-pub">DAD COMICS</span><span class="dc-issue tc-ver"></span></div>'
  +'<div class="dc-art"><canvas class="dc-spr tc-spr" width="32" height="32"></canvas><div class="dc-burst tc-burst"><span></span></div></div>'
  +'<div class="tc-title"><em>SCATTERED</em>DAD ADVENTURES</div>'
  +'<div class="tc-cap"></div></div>'
  +'<div class="tc-menu"><button type="button" class="tc-btn tc-new" data-tc="new">&#9654; New Adventure</button>'
  +'<div class="tc-row"><button type="button" class="tc-btn tc-cont" data-tc="continue">Continue<small class="tc-cont-s"></small></button>'
  +'<button type="button" class="tc-btn tc-daily" data-tc="daily">Daily Challenge<small class="tc-daily-s"></small></button></div>'
  +'<div class="tc-row"><button type="button" class="tc-chip" data-tc="help"><b>How To</b>play</button><button type="button" class="tc-chip" data-tc="best"><b>Bestiary</b><span class="tc-best-s"></span></button><button type="button" class="tc-chip" data-tc="grave"><b>Graveyard</b><span class="tc-grave-s"></span></button></div></div>';
 document.body.appendChild(el);_tcEl=el;
 el.addEventListener("click",ev=>{const b=ev.target.closest("[data-tc]");if(!b||mode!==State.TITLE)return;if(typeof doTitleAction==="function")doTitleAction(b.dataset.tc);});}

/* New cover each time the title screen opens: random Dad (current skin), burst and caption. */
function _tcReroll(){_tcCls=CLASSES[Math.floor(Math.random()*CLASSES.length)];const cfg=(typeof PORTRAIT_CFG!=="undefined"&&PORTRAIT_CFG[_tcCls.id])||{top:'#2a0d00',bot:'#6a2200',accent:'#d97a2b'};
 const cov=_tcEl.querySelector(".tc-cover");cov.style.setProperty("--dc-top",cfg.top);cov.style.setProperty("--dc-bot",cfg.bot);cov.style.setProperty("--dc-acc",cfg.accent);
 if(typeof _dsDrawSprite==="function")_dsDrawSprite(_tcEl.querySelector(".tc-spr"),_tcCls.id);
 _tcEl.querySelector(".tc-burst span").textContent=TITLE_BURSTS[Math.floor(Math.random()*TITLE_BURSTS.length)];
 _tcEl.querySelector(".tc-cap").textContent=TITLE_CAPTIONS[Math.floor(Math.random()*TITLE_CAPTIONS.length)];}

/* Called at the end of syncUI(). */
function syncTitleCover(){if(typeof document==="undefined"||!document.body)return;
 const want=(mode===State.TITLE)&&(typeof COMPACT!=="undefined"&&COMPACT);
 if(!want){if(_tcActive){_tcActive=false;document.body.classList.remove("m-titlecov");}return;}
 _tcBuild();if(!_tcEl)return;if(!_tcActive){_tcActive=true;document.body.classList.add("m-titlecov");_tcReroll();}
 _tcEl.querySelector(".tc-ver").textContent="No. 1 · 25¢ · v"+GAME_VERSION;
 const sv=_tcSaveInfo();const cont=_tcEl.querySelector(".tc-cont");cont.style.display=sv?"":"none";_tcEl.querySelector(".tc-cont-s").textContent=sv?sv.txt:"";
 _tcEl.querySelector(".tc-row").classList.toggle("tc-solo",!sv);
 _tcEl.querySelector(".tc-daily-s").textContent=_tcDailyInfo();
 let n=0,tot=0,g=0;try{n=Object.keys(discovered).length;tot=CREATURES.length+BOSSES.length;g=loadGraveyard().length;}catch(e){}
 _tcEl.querySelector(".tc-best-s").textContent=n+" / "+tot;_tcEl.querySelector(".tc-grave-s").textContent=g+(g===1?" dad":" dads");}
