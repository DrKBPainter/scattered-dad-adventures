/* ===== SCATTERED DAD ADVENTURES — game.js =====
   Core engine: state, mapgen, stats, combat, movement, items,
   survival, traps, XP, shop, save/load.
   Depends on: sprites.js, data.js
   ============================================= */

/* ===== bestiary ===== */
function loadBestiary(){try{return JSON.parse(localStorage.getItem(BESTIARY_KEY))||{};}catch(e){return {};}}
function saveBestiary(b){try{localStorage.setItem(BESTIARY_KEY,JSON.stringify(b));}catch(e){}}
/* MOB-07: lifetime record of gear ever held, like the Bestiary. localStorage sda_codex_v1 = {"weapon:<id>":1,"armor:<id>":1,"charm:<id>":1}. Read fresh each time so a Save Backup restore needs no reload. */
var CODEX_KEY="sda_codex_v1",_codexMem=null;
function loadCodexSeen(){try{const o=JSON.parse(localStorage.getItem(CODEX_KEY));if(o&&typeof o==="object"&&!Array.isArray(o))return o;}catch(e){}return _codexMem||{};}
function codexSeenKey(kind,id){return kind+":"+id;}
function noteGearSeen(it){if(!it||!it.id||(it.kind!=="weapon"&&it.kind!=="armor"&&it.kind!=="charm"))return;const k=codexSeenKey(it.kind,it.id);const o=loadCodexSeen();if(o[k])return;o[k]=1;_codexMem=o;try{localStorage.setItem(CODEX_KEY,JSON.stringify(o));}catch(e){}}
let discovered=loadBestiary();
function discover(t,floor){if(!discovered[t.id]){discovered[t.id]={count:0,firstFloor:floor};log("NEW CREATURE LOGGED: "+t.name,"gold");}discovered[t.id].count++;saveBestiary(discovered);}
/* ===== state ===== */
const State={TITLE:0,CLASS:1,PLAY:2,DEAD:3,WIN:4,DIFF:5};
let game=null,mode=State.TITLE,classCursor=0,skinCursor=0,diffCursor=1,pendingClass=null,pendingDaily=false,messages=[],deathReport=null;
let stationaryScanCount=0;
function log(t,c,fromScan){messages.push({t,c:c||"ink",fromScan:!!fromScan});if(messages.length>6)messages.shift();}
function clearScanMessages(){messages=messages.filter(m=>!m.fromScan);stationaryScanCount=0;}
let ovInstr=false,ovInv=false,ovDad=false,ovBest=false,ovMap=false,ovCodex=false,ovGrave=false,codexTab=0,shopOpen=false;
let pendingConfirm=null,pendingMenu=null,inspectOn=false,inspectKb=false,insX=0,insY=0,throwRef=null,aiming=false,placing=false,placeRef=null;
let invSel=0,dadSel=0,shopSel=0,combineMark=null,camX=0,camY=0,uidc=1;const uid=()=>uidc++;
/* ===== rng + mapgen ===== */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
/* ===== N17: seeded daily challenge ===== */
function dailyDateStr(d){d=d||new Date();return d.getUTCFullYear()+"-"+String(d.getUTCMonth()+1).padStart(2,"0")+"-"+String(d.getUTCDate()).padStart(2,"0");}
function hashSeed(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function dailySeedFor(dateStr){return hashSeed("SDA_DAILY_"+dateStr)%1000000000;}
function loadDaily(){try{return JSON.parse(localStorage.getItem(DAILY_KEY))||{};}catch(e){return {};}}
function saveDailyRecord(dateStr,entry){try{const d=loadDaily();d[dateStr]=entry;localStorage.setItem(DAILY_KEY,JSON.stringify(d));}catch(e){}}
function todaysDailyRecord(){return loadDaily()[dailyDateStr()]||null;}
function recordDailyResult(outcome){
 if(!game||!game.isDaily)return;
 const date=game.dailyDate||dailyDateStr();
 const prev=loadDaily()[date];
 const better=!prev||(outcome==="win"&&prev.outcome!=="win")||(game.depth>(prev.depth||0));
 const attempts=(prev?prev.attempts:0)+1;
 saveDailyRecord(date,{date,outcome:better?outcome:prev.outcome,cls:better?game.cls.id:prev.cls,clsName:better?game.cls.name:prev.clsName,depth:better?game.depth:prev.depth,kills:better?(game.kills||0):prev.kills,turns:better?(game.turn||0):prev.turns,attempts});
}
function genFloor(depth,seed){const rng=mulberry32(seed+depth*7919);const grid=[];for(let y=0;y<MAP_H;y++)grid.push(new Array(MAP_W).fill(1));
 const rooms=[];const target=6+Math.floor(rng()*4);let tries=0;
 while(rooms.length<target&&tries<200){tries++;const w=4+Math.floor(rng()*6),h=4+Math.floor(rng()*5),x=1+Math.floor(rng()*(MAP_W-w-2)),y=1+Math.floor(rng()*(MAP_H-h-2));let ov=false;for(const o of rooms){if(x<o.x+o.w+1&&x+w+1>o.x&&y<o.y+o.h+1&&y+h+1>o.y){ov=true;break;}}if(ov)continue;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)grid[yy][xx]=0;rooms.push({x,y,w,h,cx:Math.floor(x+w/2),cy:Math.floor(y+h/2)});}
 for(let i=1;i<rooms.length;i++){const a=rooms[i-1],b=rooms[i];let x=a.cx,y=a.cy;while(x!==b.cx){grid[y][x]=0;x+=x<b.cx?1:-1;}while(y!==b.cy){grid[y][x]=0;y+=y<b.cy?1:-1;}}
 // doors on 1-wide corridor tiles
 const doors=[],cand=[],inRm=(x,y)=>rooms.some(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
 const roomIdxAt=(x,y)=>rooms.findIndex(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);
 // count corridor openings around a room's perimeter -> number of entry points
 /* MOB-22: true when none of the 4 tiles diagonally outside the room's corners is floor (movement allows diagonal steps, so an open corner is a second way in) */
 const _cornersSealed=(r)=>[[r.x-1,r.y-1],[r.x+r.w,r.y-1],[r.x-1,r.y+r.h],[r.x+r.w,r.y+r.h]].every(([cx,cy])=>!grid[cy]||grid[cy][cx]!==0);
 const roomEntries=(r)=>{let n=0;for(let xx=r.x;xx<r.x+r.w;xx++){if(grid[r.y-1]&&grid[r.y-1][xx]===0)n++;if(grid[r.y+r.h]&&grid[r.y+r.h][xx]===0)n++;}for(let yy=r.y;yy<r.y+r.h;yy++){if(grid[yy][r.x-1]===0)n++;if(grid[yy][r.x+r.w]===0)n++;}return n;};
 for(let y=1;y<MAP_H-1;y++)for(let x=1;x<MAP_W-1;x++){if(grid[y][x]!==0)continue;const N=grid[y-1][x]===1,Sd=grid[y+1][x]===1,E=grid[y][x+1]===1,W=grid[y][x-1]===1;const hz=N&&Sd&&!E&&!W,vt=E&&W&&!N&&!Sd;if(!hz&&!vt)continue;if(inRm(x,y))continue;const re=hz?(inRm(x+1,y)||inRm(x-1,y)):(inRm(x,y+1)||inRm(x,y-1));if(!re)continue;const ri=hz?(inRm(x+1,y)?roomIdxAt(x+1,y):roomIdxAt(x-1,y)):(inRm(x,y+1)?roomIdxAt(x,y+1):roomIdxAt(x,y-1));cand.push({x,y,hz,ri});}
 // room-entry + back-to-back filtered pick (no door within 2 tiles in same corridor)
 for(let i=0;i<cand.length&&doors.length<4;i++){const c=cand[i];if(rng()>=0.5)continue;const near=doors.some(d=>c.hz?(d.y===c.y&&Math.abs(d.x-c.x)<=2):(d.x===c.x&&Math.abs(d.y-c.y)<=2));if(!near)doors.push({x:c.x,y:c.y,locked:false,open:false,ri:c.ri});}
 // locked doors may only seal a room with exactly ONE entry point (a dead-end leaf room)
 let hasLock=false,hasHiddenLock=false,_hiddenLockEntry=null;if(doors.length&&rng()<0.45){const lockable=doors.filter(d=>d.ri>=0&&roomEntries(rooms[d.ri])===1);/* MOB-21: never lock the room you arrive in (start room; stairs room in an Ascent) or a door within 5 tiles of the arrival stairs; same RNG calls as before */const _lai=(typeof game!=="undefined"&&game&&game.ascent)?rooms.length-1:0,_lra=rooms[_lai];const lockOk=lockable.filter(d=>d.ri!==_lai&&Math.max(Math.abs(d.x-_lra.cx),Math.abs(d.y-_lra.cy))>5&&_cornersSealed(rooms[d.ri]));/* MOB-22: a room whose outside corner is open floor can be entered diagonally past the door, so it is never locked (the lockable list, and so the RNG calls, are unchanged) */if(lockable.length){const _hid=rng()<0.5;if(lockOk.length){const ld=lockOk[lockOk.length-1];ld.locked=true;hasLock=true;if(_hid){// convert to hidden locked door: seal tile back to wall, stage for secrets (declared below)
  grid[ld.y][ld.x]=1;_hiddenLockEntry={x:ld.x,y:ld.y,hiddenLock:true,ri:ld.ri};doors.splice(doors.indexOf(ld),1);hasHiddenLock=true;}}}}
 /* MOB-54: every room is open (corridors meet it with no door) or closed (its only ways in are doors, one or more). A room the door pick above chose is closed when every floor tile in the 1-tile ring around it (corners too: diagonal steps are allowed) can hold a door (a side tile with wall on both sides along the room's edge); each of those tiles then gets a door (at most 4 per room, so a room that every corridor runs through stays open). Otherwise the room stays open and its doors are removed. Locked doors always stay. No RNG calls and no grid change, so the rest of the floor is the same as before. Hidden doors and hidden rooms are exempt. */
 {const _rg=(r)=>{const t=[];for(let xx=r.x-1;xx<=r.x+r.w;xx++){t.push([xx,r.y-1]);t.push([xx,r.y+r.h]);}for(let yy=r.y;yy<r.y+r.h;yy++){t.push([r.x-1,yy]);t.push([r.x+r.w,yy]);}return t;};
  const _fl=(x,y)=>!!grid[y]&&grid[y][x]===0;
  const _dk=(r,x,y)=>{if((x===r.x-1||x===r.x+r.w)&&y>=r.y&&y<r.y+r.h)return !_fl(x,y-1)&&!_fl(x,y+1);if((y===r.y-1||y===r.y+r.h)&&x>=r.x&&x<r.x+r.w)return !_fl(x-1,y)&&!_fl(x+1,y);return false;};
  const _cl=new Array(rooms.length).fill(false),_want=new Set(doors.filter(d=>d.ri>=0).map(d=>d.ri));if(_hiddenLockEntry&&_hiddenLockEntry.ri>=0)_want.add(_hiddenLockEntry.ri);
  for(const ri of _want){const r=rooms[ri];if(!r)continue;const op=_rg(r).filter(([x,y])=>_fl(x,y));if(op.length<=4&&op.every(([x,y])=>_dk(r,x,y)))_cl[ri]=true;}
  const _out=[],_has=(x,y)=>_out.some(d=>d.x===x&&d.y===y);
  for(const d of doors){if((d.locked||(d.ri>=0&&_cl[d.ri]))&&!_has(d.x,d.y))_out.push(d);}
  for(let ri=0;ri<rooms.length;ri++){if(!_cl[ri])continue;for(const[x,y]of _rg(rooms[ri]))if(_fl(x,y)&&!_has(x,y))_out.push({x,y,locked:false,open:false,ri});}
  doors.length=0;for(const d of _out)doors.push(d);for(let ri=0;ri<rooms.length;ri++)rooms[ri].closed=_cl[ri];}
 // secret wall caches: a wall tile orthogonally adjacent to a room interior
 const secrets=_hiddenLockEntry?[_hiddenLockEntry]:[];let st=0;
 while(secrets.length<(1+Math.floor(rng()*2))&&st<300){st++;const r=rooms[Math.floor(rng()*rooms.length)];const sx=r.x+Math.floor(rng()*r.w),sy=r.y+Math.floor(rng()*r.h);const wx=sx+(rng()<0.5?(rng()<0.5?-r.w:r.w):0),wy=sy;const cxs=Math.max(1,Math.min(MAP_W-2,sx+(Math.floor(rng()*3)-1))),cys=Math.max(1,Math.min(MAP_H-2,sy));}
 // simpler: pick wall tiles bordering a room
 let s2=0;while(secrets.length<(1+Math.floor(rng()*2))&&s2<400){s2++;const x=2+Math.floor(rng()*(MAP_W-4)),y=2+Math.floor(rng()*(MAP_H-4));if(grid[y][x]!==1)continue;const nb=[[0,1],[0,-1],[1,0],[-1,0]].filter(d=>grid[y+d[1]][x+d[0]]===0).length;if(nb===1&&!secrets.some(s=>s.x===x&&s.y===y))secrets.push({x,y});}
 // Hidden rooms: a small fully-sealed chamber abutting a normal room, reachable ONLY through a single
 // secret-door wall tile. The chamber floor is carved here (deterministic), but the door stays a wall
 // (registered in `secrets` with room:true) until the player scans and finds it. Contents placed in buildFloor().
 const hiddenRooms=[];let hr=0;const hidTarget=rng()<0.75?1:2;
 while(hiddenRooms.length<hidTarget&&hr<160){hr++;
  const base=rooms[Math.floor(rng()*rooms.length)];if(!base)break;
  const hw=3+Math.floor(rng()*2),hh=3+Math.floor(rng()*2);
  if(base.w<hw||base.h<hh)continue;
  const side=Math.floor(rng()*4);let rx,ry,doorX,doorY;
  if(side===0){rx=base.x+base.w+1;ry=base.y+Math.floor(rng()*(base.h-hh+1));doorX=base.x+base.w;doorY=ry+Math.floor(hh/2);}
  else if(side===1){rx=base.x-1-hw;ry=base.y+Math.floor(rng()*(base.h-hh+1));doorX=base.x-1;doorY=ry+Math.floor(hh/2);}
  else if(side===2){ry=base.y+base.h+1;rx=base.x+Math.floor(rng()*(base.w-hw+1));doorY=base.y+base.h;doorX=rx+Math.floor(hw/2);}
  else{ry=base.y-1-hh;rx=base.x+Math.floor(rng()*(base.w-hw+1));doorY=base.y-1;doorX=rx+Math.floor(hw/2);}
  if(rx<1||ry<1||rx+hw>MAP_W-1||ry+hh>MAP_H-1)continue;
  // The chamber + its 1-tile wall ring (which contains the future door) must currently be solid wall.
  let clear=true;for(let yy=ry-1;yy<=ry+hh&&clear;yy++)for(let xx=rx-1;xx<=rx+hw;xx++){const row=grid[yy];if(!row||row[xx]===undefined||row[xx]!==1){clear=false;break;}}
  if(!clear)continue;
  if(secrets.some(s=>s.x===doorX&&s.y===doorY))continue;
  for(let yy=ry;yy<ry+hh;yy++)for(let xx=rx;xx<rx+hw;xx++)grid[yy][xx]=0;
  secrets.push({x:doorX,y:doorY,room:true});
  hiddenRooms.push({x:rx,y:ry,w:hw,h:hh,cx:Math.floor(rx+hw/2),cy:Math.floor(ry+hh/2),doorX,doorY});}
 /* MOB-22: a secret tile that, once found, would open a way into the locked room from outside (a wall tile beside the room's corner, reached from a corridor) is dropped from the list. Its tile simply stays a wall. Runs after every RNG call, so the rest of the floor is unchanged. */
 if(hasLock){const _lk=_hiddenLockEntry||doors.find(d=>d.locked);const _vr=_lk&&rooms[_lk.ri];if(_vr){const _inR=(r,x,y)=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;const _vh=hiddenRooms.filter(h=>[[0,1],[0,-1],[1,0],[-1,0]].some(([a,b])=>_inR(_vr,h.doorX+a,h.doorY+b)));/* hidden chambers opening off the locked room count as part of it */const _inV=(x,y)=>_inR(_vr,x,y)||_vh.some(h=>_inR(h,x,y));
  for(let i=secrets.length-1;i>=0;i--){const z=secrets[i];if(z.hiddenLock)continue;let nearV=false,outside=false;for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){if(!a&&!b)continue;const x=z.x+a,y=z.y+b;if(!grid[y]||grid[y][x]!==0)continue;if(_inV(x,y))nearV=true;else outside=true;}if(nearV&&outside)secrets.splice(i,1);}}}
 return {grid,rooms,rng,doors,secrets,hasLock,hasHiddenLock,hiddenRooms};}
/* ===== effective stats ===== */
const SLOTS=["weapon","head","torso","arms","legs","feet","charm1","charm2"];
function eqList(){return SLOTS.map(s=>game.equip[s]).filter(Boolean);}
function gearSum(stat){let s=0;for(const g of eqList()){if(g[stat])s+=g[stat];for(const a of(g.affixes||[]))if(a.mods&&a.mods[stat])s+=a.mods[stat];}return s;}
function itemStat(it,stat){if(!it)return 0;let s=it[stat]||0;for(const a of(it.affixes||[]))if(a.mods&&a.mods[stat])s+=a.mods[stat];return s;}
function hasFlag(f){for(const g of eqList())for(const a of(g.affixes||[]))if(a.flag===f)return true;return false;}
function hasStatus(id){return !!game.statuses[id];}
function effAtk(){const _th=game.statuses&&game.statuses.thirst,_dep=_th?_th.depend||0:0;return Math.max(1,game.str+gearSum("atk")+(hasStatus("atkup")?3:0)+(hasStatus("back")?-2:0)+(hasStatus("hangry")?-1:0)+(_dep>=6?-2:_dep>=3?-1:0));}
function effDef(){const _th=game.statuses&&game.statuses.thirst;return Math.max(0,game.def+gearSum("def")+(hasStatus("guard")?2:0)+(hasStatus("soaked")?-1:0)+(hasStatus("defbuff")?2:0)+(_th&&_th.withdrawing?-1:0));}
const SCAN_FULL_PER=14;
function effPer(){const _th=game.statuses&&game.statuses.thirst,_dep=_th?_th.depend||0:0;return Math.max(0,game.per+gearSum("per")+(_th?_dep>=6?-4:_dep>=3?-3:-2:0)+(hasStatus("hangover")?-1:0));}
function effWis(){return Math.max(0,game.wis+gearSum("wis"));}
function invCap(){return 10+gearSum("cap")+Math.floor((game&&game.level?game.level:0)/5);}
/* MOB-64: The Thirst wears off after this many alcohol-free turns (counted in s.dry, kept in the run save with the status;
   old saves start at 0). A drink or a new exposure resets the count; the Family Intervention Binder stays the faster cure. */
function thirstNeed(s){return 100;}/* MOB-64 (KBP 2026-11-18): flat 100 alcohol-free turns */
function fumbleChance(){let c=0;const th=game.statuses.thirst;if(th){const _dep=th.depend||0,_st=_dep>=6?3:_dep>=3?2:0,_thr=_st===3?4:_st===2?5:6,_fc=_st===3?.25:_st===2?.20:.18;if(th.craving>=_thr)c=_fc+(!th.withdrawing&&(th.dry||0)>=Math.ceil(thirstNeed(th)/2)?.05:0);/* MOB-64: worse in the second half */}if(hasStatus("jitters"))c=Math.max(c,.10);if(hasStatus("hangover"))c=Math.max(c,.10);return c;}
function tryFumble(v){if(Math.random()<fumbleChance()){log("The shakes! You fumble "+v+".","red");endTurn();return true;}return false;}
function roll(max){return 1+Math.floor(Math.random()*Math.max(1,max));}
/* ===== item makers ===== */
function rarityFromAffixes(af){if(af.some(a=>a.id==="grillblessed"))return "Epic";const h=af.filter(a=>a.type==="help").length;return h>=2?"Rare":h===1?"Uncommon":"Common";}
/* MOB-52 (2026-11-20): mods only land on gear they fit. gearTags(tpl,kind) = hand-set GEAR_TAGS (js/data.js) plus
   kind-based tags (weapon: workgear + grip; armor/charm: worn; work/dishwashing gloves: grip; powered:true: powered).
   affixFits(a,tags): a mod with no fit list (and no old req) fits anything; otherwise it needs one of its fit tags.
   The roll itself is unchanged (same rng calls); only the pool it picks from is filtered. Saved gear keeps its mods. */
function gearTags(tpl,kind){const t=new Set();if(!tpl)return t;const L=(typeof GEAR_TAGS!=="undefined"&&GEAR_TAGS[tpl.id])||[];for(const x of L)t.add(x);
 if(tpl.powered)t.add("powered");if(kind==="weapon"){t.add("workgear");t.add("grip");}else if(kind==="armor"||kind==="charm")t.add("worn");
 if(typeof GEAR_GRIP_IDS!=="undefined"&&GEAR_GRIP_IDS.includes(tpl.id))t.add("grip");return t;}
function affixFits(a,tags){const need=a.fit||(a.req?[a.req]:null);return !need||need.some(x=>tags.has(x));}
function mkGear(tpl,kind,rng,clean){rng=rng||Math.random;const g={uid:uid(),kind,id:tpl.id,name:tpl.name,desc:tpl.desc,affixes:[]};for(const k of["atk","def","per","wis","cap","slot","wear","reach","throw","sprite","kneeRelief","critPct","blindOnHit","breakOnRemove"])if(tpl[k]!==undefined)g[k]=tpl[k];if(!clean){const n=rng()<0.45?1:(rng()<0.6?2:0);const _tg=gearTags(tpl,kind);const pool=AFFIXES.filter(a=>affixFits(a,_tg));for(let i=0;i<n&&pool.length;i++)g.affixes.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);
  // Armor is cursed 25% less often: each rolled Learning-Experience (hinder) affix on armor has a 25% chance to be dropped.
  if(kind==="armor"&&g.affixes.length)g.affixes=g.affixes.filter(a=>a.type!=="hinder"||rng()>=0.25);}g.rarity=tpl.baseRarity||rarityFromAffixes(g.affixes);g.idd=!!clean;return g;}
function mkConsumable(id){return Object.assign({kind:"consumable"},CONSUMABLES.find(x=>x.id===id));}
function mkObject(id){return Object.assign({kind:"object"},OBJECTS.find(x=>x.id===id));}
function keyBiomeFor(f){return f<=10?"House":f<=20?"Lowe & Behold":f<=30?"Park":f<=40?"Vastco":f<=50?"Soccer Complex":f<=60?"School":f<=70?"Family Restaurant":f<=80?"IDKEA":f<=90?"Neighborhood":"HOA";}
const KEY_TAPE=["FL %d — DO NOT LOSE","#%d, the one. probably.","FLOOR %d (i think)","%d — works, mostly","FL %d, the GOOD lock","DOOR %d. trust me"];
function keyTape(f){return KEY_TAPE[(f*7+3)%KEY_TAPE.length].split("%d").join(f);}
function mkKey(floor){const k=Object.assign({kind:"key"},KEYS[0]);if(floor){k.floor=floor;k.name=keyBiomeFor(floor)+" Key (Floor "+floor+")";k.tape=keyTape(floor);k.desc="Sharpied onto a strip of masking tape: \""+keyTape(floor)+"\". Opens a locked door on Floor "+floor+". Judges you for the other ninety-nine.";}return k;}
function mkProtip(id){return Object.assign({kind:"protip"},PROTIPS.find(x=>x.id===id));}
function mkById(id){let t;if(t=WEAPONS.find(x=>x.id===id))return mkGear(t,"weapon",Math.random,false);if(t=ARMORS.find(x=>x.id===id))return mkGear(t,"armor",Math.random,false);if(t=CHARMS.find(x=>x.id===id))return mkGear(t,"charm",Math.random,false);if(CONSUMABLES.find(x=>x.id===id))return mkConsumable(id);if(OBJECTS.find(x=>x.id===id))return mkObject(id);if(PROTIPS.find(x=>x.id===id))return mkProtip(id);if(id==="key")return mkKey();return null;}
/* ===== unidentified consumables: effect hidden until consumed or identified (#blind-ID) ===== */
const CONS_ALIASES=["Fizzing Blue Liquid","Suspicious Off-Brand Can","Unlabeled Foil Packet","Cloudy Mystery Drink","Generic Beige Bar","Vaguely Medicinal Tablet","Warm Unmarked Bottle","Crinkly Gas-Station Pouch","Dubious Energy Substance","Sticky Wrapped Thing","Faded-Label Sachet","Room-Temperature Capsule","Ominously Quiet Can","Off-Color Sports Fluid","Expired-Looking Snack","Generic Brown Jug"];
function consHash(id){let h=0;for(let i=0;i<id.length;i++)h=(h*31+id.charCodeAt(i))>>>0;return h;}
function consAlias(id){return CONS_ALIASES[consHash(id)%CONS_ALIASES.length];}
function consKnown(it){return !it||it.kind!=="consumable"||((typeof game!=="undefined"&&game&&game.knownConsumables)||[]).includes(it.id);}
function revealConsumable(id){if(typeof game==="undefined"||!game||!id)return;if(!game.knownConsumables)game.knownConsumables=[];if(!game.knownConsumables.includes(id))game.knownConsumables.push(id);}
function itemDisplayName(it){return (it&&it.kind==="consumable"&&!consKnown(it))?consAlias(it.id):(it?it.name:"");}
// MOB-38: equippable items show where they go, e.g. "Spatula (weapon)", "Fleece Vest (torso)". Display only; saved names unchanged.
function itemSlotLabel(it){if(!it)return "";if(it.kind==="weapon")return "weapon";if(it.kind==="charm")return "charm";if(it.kind==="armor")return it.slot||"";return "";}
function itemSlotSuffix(it){const s=itemSlotLabel(it);return s?" ["+s+"]":"";}/* MOB-38 (KBP 2026-11-10): slot in brackets, e.g. "Spatula [weapon]" */
function itemNameSlot(it){return itemDisplayName(it)+itemSlotSuffix(it);}
/* ===== run / floor ===== */
function newRun(cls,diff,dailySeed){_shopSold={};/* MOB-72 */const isDaily=typeof dailySeed==="number";const seed=isDaily?dailySeed:(Math.random()*1e9)|0;diff=diff||(typeof DIFFICULTY_MODES!=="undefined"?DIFFICULTY_MODES[1]:null);
 // Daily Challenge: every dad who plays today gets the identical dungeon. Route all
 // run-setup randomness (not just floor layout) through the same seeded RNG so nothing varies.
 const _rr=isDaily?mulberry32(seed+424242):null;const rnd=isDaily?()=>_rr():Math.random;
 game={cls,seed,isDaily,dailyDate:isDaily?dailyDateStr():null,depth:1,hp:cls.hp,maxhp:cls.hp,str:cls.str,def:cls.def,per:cls.per,wis:cls.wis,moxie:cls.moxie,maxmoxie:cls.moxie,level:1,xp:0,xpNext:12,gold:20,diff:diff||null,
  equip:{weapon:null,head:null,torso:null,arms:null,legs:null,feet:null,charm1:null,charm2:null},inv:[],dadisms:[],statuses:{},
  hunger:0,hydra:cls.startHydra||0,hydraSlow:0,hungerCap:100,hydraCap:100,drunkStack:0,kneeChance:0.05,backChance:0.05,inspectPts:0,inspectedKeys:{},moxTick:0,globalReveal:false,
  px:0,py:0,enemies:[],loot:[],traps:[],doors:[],secrets:[],fountains:[],healFountains:[],waterFloors:[],fountainFloors:[],healFountainFloors:[],vendor:null,stairs:{x:0,y:0},stairsUp:null,floorCache:{},ledger:{},floor:null,seen:null,vis:null,fx:[],turn:0,clickPath:[],ascent:false,ascentDone:false,sfLastTurn:-20,kills:0,consumed:0,talentPicks:0,talents:[],foodLuck:0,lightStep:false,foodEaten:0,drinksTaken:0,moolahEarned:0,itemsFound:0};
 game.skin=(typeof skinCursor==="number"&&typeof SKIN_SWATCHES!=="undefined")?((skinCursor%SKIN_SWATCHES.length)+SKIN_SWATCHES.length)%SKIN_SWATCHES.length:0;
 game.dadisms=DADISMS.filter(d=>d.classes.includes(cls.id)).map(d=>d.id);
 game.ally=null;game.allyOrder=null;game.allyMet=[];game.knownRecipes=[];game.triedPairs=[];game.returning=[];game.knownConsumables=[];game.keyring=[];game.biomesSeen=[];game.comedyFloors=[];game.comedyShown=[];
 // Pre-compute which floors have water tiles and which have fountains for this run
 const _dl=Array.from({length:MAXDEPTH},(_,i)=>i+1);
 for(let _i=_dl.length-1;_i>0;_i--){const _j=Math.floor(rnd()*(_i+1));[_dl[_i],_dl[_j]]=[_dl[_j],_dl[_i]];}
 const _wf=new Set(_dl.slice(0,5));_dl.slice(5).forEach(d=>{if(rnd()<0.15)_wf.add(d);});game.waterFloors=Array.from(_wf);
 const _ff=new Set();[[1,10],[11,20],[21,40],[41,60],[61,80],[81,100]].forEach(([a,b])=>{const r=Array.from({length:b-a+1},(_,i)=>a+i);_ff.add(r[Math.floor(rnd()*r.length)]);});
 const _rf=_dl.filter(d=>!_ff.has(d));if(_rf.length)_ff.add(_rf[Math.floor(rnd()*_rf.length)]);game.fountainFloors=Array.from(_ff);
 // Healing fountains: up to 3, at least 10 floors apart
 game.healFountainFloors=[];{let _hf=2+Math.floor(rnd()*5);while(game.healFountainFloors.length<8&&_hf<=MAXDEPTH){game.healFountainFloors.push(_hf);_hf+=10+Math.floor(rnd()*3);}}
 const w=mkGear(WEAPONS[cls.id==="gym"?4:0],"weapon",rnd,true);addItem(w);equip(w,true);
 const torso=mkGear(ARMORS.find(a=>a.id==="fleece"),"armor",rnd,true);addItem(torso);equip(torso,true);
 addItem(mkConsumable("casserole"));addItem(mkConsumable("casserole"));addItem(mkConsumable("water"));addItem(mkObject("ducttape"));
 if(cls.id==="gym"){addItem(mkConsumable("water"));addItem(mkConsumable("water"));}
 // Grillmaster & Tactical Dad march on a full stomach: extra food rations
 if(cls.id==="grill"||cls.id==="tactical"){addItem(mkConsumable("casserole"));addItem(mkConsumable("granola"));addItem(mkConsumable("jerky"));}
 // Dad knows what he packed: starting rations begin identified.
 ["casserole","water","granola","jerky"].forEach(revealConsumable);
 deathReport=null;buildFloor();messages=[];log(isDaily?"Floor 1. Today's Daily Challenge dungeon awaits — every dad faces this same house. "+kbTxt("Press H for help.","For help: MORE, then MANUAL."):"Floor 1. The house is warming up. "+kbTxt("Press H for help.","For help: MORE, then MANUAL."),"gold");mode=State.PLAY;showBiomeClip();saveRun();syncUI();}
/* ===== graveyard (N12) ===== */
function loadGraveyard(){try{return JSON.parse(localStorage.getItem(GRAVEYARD_KEY))||[];}catch(e){return [];}}
function saveGraveyardEntry(entry){try{const g=loadGraveyard();g.unshift(entry);if(g.length>20)g.length=20;localStorage.setItem(GRAVEYARD_KEY,JSON.stringify(g));}catch(e){}}
function isVendorFloor(d){return !!VENDORS[d];}
function buildFloor(){game.floorTurns=0;game._kh=null;/* MOB-22 *//* MOB-30 */if(game.ally&&!game.ally.following)game.ally=null;/* MOB-13: an unrecruited companion stays on the floor where you met them (was carried to the next floor at stale coordinates, often inside a wall) */const _cache=game.floorCache&&game.floorCache[game.depth];if(_cache){_restoreFloorFromCache(_cache,false);return;}const f=genFloor(game.depth,game.seed);game.floor=f;game.doors=f.doors;game.secrets=f.secrets;game.openedSecrets=[];game.globalReveal=false;game.fx=[];game.vendor=null;
 game.seen=[];game.vis=[];for(let y=0;y<MAP_H;y++){game.seen.push(new Array(MAP_W).fill(false));game.vis.push(new Array(MAP_W).fill(false));}
 game.px=f.rooms[0].cx;game.py=f.rooms[0].cy;const last=f.rooms[f.rooms.length-1];game.stairs={x:last.cx,y:last.cy};game.stairsUp=(game.depth>1||game.ascent)?{x:f.rooms[0].cx,y:f.rooms[0].cy}:null;if(game.ascent){game.px=last.cx;game.py=last.cy;}if(game.ally&&game.ally.following){game.ally.x=game.px;game.ally.y=game.py;}
 game.enemies=[];game.loot=[];game.traps=[];game.fountains=[];game.healFountains=[];
 const vend=isVendorFloor(game.depth);
 if(vend){const v=VENDORS[game.depth];let r=f.rooms[Math.floor(f.rooms.length/2)]||last;if(onStairs(r.cx,r.cy)&&f.rooms.length>1)r=f.rooms.find(rm=>!onStairs(rm.cx,rm.cy))||r;let def=v;if(v.pool){const arr=v.pool.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(f.rng()*(i+1));const t=arr[i];arr[i]=arr[j];arr[j]=t;}def=Object.assign({},v,{stock:(v.fixed||[]).concat(arr.slice(0,v.pick||8))});}game.vendor={x:r.cx,y:r.cy,def:def};log("A vendor's stall stands here: "+def.name+".","gold");}
 {const bMatch=BOSSES.find(b=>b.floor===game.depth);if(bMatch){const br=f.rooms[f.rooms.length-1]||f.rooms[0];game.enemies.push(mkEnemy(bMatch,br.cx,br.cy-1,true));log("A presence fills the floor: "+bMatch.name+"."+((!game.ascent&&game.depth%10===0)?" The stairs down stay shut until it falls.":""),"red");/* MOB-50 */}}
 if(!vend){const _dcm=(game.diff&&game.diff.cntMul)||1;const cnt=Math.max(1,Math.round((3+Math.floor(game.depth*0.7)+Math.floor(f.rng()*3))*_dcm));for(let i=0;i<cnt;i++){const r=f.rooms[1+Math.floor(f.rng()*(f.rooms.length-1))];if(!r)continue;const ex=r.x+1+Math.floor(f.rng()*(r.w-2)),ey=r.y+1+Math.floor(f.rng()*(r.h-2));if((ex===game.px&&ey===game.py)||onStairs(ex,ey))continue;game.enemies.push(mkEnemy(pickCreature(game.depth,f.rng),ex,ey,false));}}
 const lc=3+Math.floor(f.rng()*3);for(let i=0;i<lc;i++){const r=f.rooms[Math.floor(f.rng()*f.rooms.length)];const lx=r.x+1+Math.floor(f.rng()*(r.w-2)),ly=r.y+1+Math.floor(f.rng()*(r.h-2));if(!onStairs(lx,ly))game.loot.push({x:lx,y:ly,item:pickLoot(f.rng,game.depth)});}
 if(f.hasLock){const _kp=_keySpot(f);const _kh=_keyHolderSpawn(f,_kp,vend);/* MOB-22 */if(!_kh)game.loot.push({x:_kp.x,y:_kp.y,item:mkKey(game.depth)});if(_kh){log(f.hasHiddenLock?"There is a locked door on this floor, hidden behind a wall. "+_kh.spawnMsg:"There is a locked door on this floor. "+_kh.spawnMsg,"blu");}else if(f.hasHiddenLock){log("There is a locked door on this floor — hidden behind a wall. Someone was extremely committed to this. The key is somewhere on this floor, as far from the stairs as possible. Naturally.","blu");}else{log("There is a locked door on this floor. The key is out there somewhere — labeled, knowing you, and nowhere near where you would look first.","blu");}}
 // N16: Vault bonus loot — 3 guaranteed items inside the locked dead-end room
 if(f.hasLock){let _vri=-1;if(f.hasHiddenLock){const _hs=game.secrets.find(s=>s.hiddenLock);if(_hs)_vri=_hs.ri;}else{const _ld=game.doors.find(d=>d.locked);if(_ld&&_ld.ri>=0)_vri=_ld.ri;}if(_vri>=0&&f.rooms[_vri]){const _vr=f.rooms[_vri];for(let i=0;i<3;i++){const lx=_vr.x+1+Math.floor(f.rng()*Math.max(1,_vr.w-2)),ly=_vr.y+1+Math.floor(f.rng()*Math.max(1,_vr.h-2));if(!onStairs(lx,ly))game.loot.push({x:lx,y:ly,item:pickLoot(f.rng,game.depth)});}}}
 // Hidden-room contents: extra loot (always) and a possible lurking guardian, sealed behind the secret door.
 if(f.hiddenRooms&&f.hiddenRooms.length){for(const hrm of f.hiddenRooms){const ln=1+Math.floor(f.rng()*2);for(let i=0;i<ln;i++){const lx=hrm.x+Math.floor(f.rng()*hrm.w),ly=hrm.y+Math.floor(f.rng()*hrm.h);game.loot.push({x:lx,y:ly,item:pickLoot(f.rng,game.depth)});}
  if(f.rng()<0.6){const cdef=pickCreature(game.depth,f.rng);if(cdef){let ex,ey,tt=0;do{ex=hrm.x+Math.floor(f.rng()*hrm.w);ey=hrm.y+Math.floor(f.rng()*hrm.h);tt++;}while(tt<12&&game.enemies.some(en=>en.x===ex&&en.y===ey));game.enemies.push(mkEnemy(cdef,ex,ey,false));}}}}
 if(!vend){const tc=2+Math.floor(f.rng()*3);for(let i=0;i<tc;i++){const r=f.rooms[Math.floor(f.rng()*f.rooms.length)];const td=TRAPS_DEF[Math.floor(f.rng()*TRAPS_DEF.length)];const tx=r.x+1+Math.floor(f.rng()*(r.w-2)),ty=r.y+1+Math.floor(f.rng()*(r.h-2));if(!onStairs(tx,ty))game.traps.push({x:tx,y:ty,def:td,sprung:false,known:false});}}
 // Water floor: flood one room with water tiles (grid=2), spawn goldfish
 if(game.waterFloors&&game.waterFloors.includes(game.depth)){
  const wr=f.rooms[1+Math.floor(f.rng()*(f.rooms.length-1))];
  if(wr){for(let wy=wr.y;wy<wr.y+wr.h;wy++)for(let wx=wr.x;wx<wr.x+wr.w;wx++)if(f.grid[wy][wx]===0)f.grid[wy][wx]=2;
   const gfDef=CREATURES.find(c=>c.id==="mrs_kowalski_fish");
   if(gfDef){const gcnt=1+Math.floor(f.rng()*2);
    for(let gi=0;gi<gcnt;gi++){const gx=wr.x+1+Math.floor(f.rng()*(wr.w-2)),gy=wr.y+1+Math.floor(f.rng()*(wr.h-2));if(f.grid[gy]&&f.grid[gy][gx]===2)game.enemies.push(mkEnemy(gfDef,gx,gy,false));}
    log("The water moves. Mrs. Kowalski's fish has found you.","blu");}}}
 // Fountain floor: place a working fountain in a random room
 if(game.fountainFloors&&game.fountainFloors.includes(game.depth)){
  const froom=f.rooms[Math.floor(f.rng()*f.rooms.length)];
  if(froom){const fsx=froom.cx,fsy=froom.cy;if(f.grid[fsy]&&f.grid[fsy][fsx]===0&&!onStairs(fsx,fsy)){game.fountains.push({x:fsx,y:fsy,charges:5});log("A water fountain stands here. Working, apparently. Miracle of miracles.","blu");}}}
 // Healing fountain floor: place The Cooler of Restoration in a room
 if(game.healFountainFloors&&game.healFountainFloors.includes(game.depth)){
  let hroom=null;for(let _t=0;_t<20&&!hroom;_t++){const r=f.rooms[Math.floor(f.rng()*f.rooms.length)];if(!r)continue;if(r.cx===game.px&&r.cy===game.py)continue;if(onStairs(r.cx,r.cy))continue;if(game.fountains.some(fn=>fn.x===r.cx&&fn.y===r.cy))continue;if(f.grid[r.cy]&&f.grid[r.cy][r.cx]===0)hroom=r;}
  if(hroom){game.healFountains.push({x:hroom.cx,y:hroom.cy,charges:3});log("Someone left a cooler here. The liquid inside is red and faintly humming. The Cooler of Restoration.","grn");}}
 // Family Dog: 20% chance per floor
 if(!vend&&!game.enemies.some(en=>en.def&&en.def.id==="family_dog")&&Math.random()<0.20){let dr=f.rooms[Math.floor(f.rng()*f.rooms.length)],_dtries=0;while(onStairs(dr.cx,dr.cy)&&_dtries<10){dr=f.rooms[Math.floor(f.rng()*f.rooms.length)];_dtries++;}if(!onStairs(dr.cx,dr.cy)){const dogE=mkEnemy(FAMILY_DOG,dr.cx,dr.cy,false);dogE.isDog=true;game.enemies.push(dogE);log("Something large and friendly can be heard nearby.","dim");}}
 // Ally encounter: 15% chance per floor if no active ally
 if(!game.ally&&typeof ALLIES!=="undefined"){const avail=ALLIES.filter(a=>!(game.allyMet||[]).includes(a.id));if(avail.length&&Math.random()<0.15){const adef=avail[Math.floor(Math.random()*avail.length)];let ar=_allyRoom(f);if(!ar){ar=f.rooms[1]||f.rooms[0];if(onStairs(ar.cx,ar.cy))ar=f.rooms.find(rm=>!onStairs(rm.cx,rm.cy))||ar;}game.ally={defId:adef.id,hp:adef.hp,maxhp:adef.maxhp,x:ar.cx,y:ar.cy,following:false,questDone:!adef.quest,questOffered:false};game._huntRef=null;log("A friendly presence is somewhere on this floor.","gold");
  // Recruit side quest: place the fetch item, or spawn an oversized hunt target, elsewhere on this floor.
  if(adef.quest){
   if(adef.quest.type==="fetch"){
    const qr=f.rooms[Math.min(f.rooms.length-1,2+Math.floor(f.rng()*Math.max(1,f.rooms.length-2)))]||f.rooms[f.rooms.length-1];
    if(qr){const qx=qr.x+1+Math.floor(f.rng()*Math.max(1,qr.w-2)),qy=qr.y+1+Math.floor(f.rng()*Math.max(1,qr.h-2));
     if(!onStairs(qx,qy)){const qtpl=adef.quest.itemKind==="charm"?CHARMS.find(c=>c.id===adef.quest.itemId):null;
      const qit=qtpl?mkGear(qtpl,"charm",f.rng,true):mkConsumable(adef.quest.itemId);
      qit.questFor=adef.id;game.loot.push({x:qx,y:qy,item:qit});}}
   }else if(adef.quest.type==="hunt"){
    const hr=f.rooms[f.rooms.length-1]||f.rooms[0];
    if(hr){const hx=hr.x+1+Math.floor(f.rng()*Math.max(1,hr.w-2)),hy=hr.y+1+Math.floor(f.rng()*Math.max(1,hr.h-2));
     if(!onStairs(hx,hy)&&!(hx===game.px&&hy===game.py)){const cdef=pickCreature(game.depth,f.rng);
      if(cdef){const qe=mkEnemy(cdef,hx,hy,false);qe.hp=Math.round(qe.hp*1.6);qe.maxhp=qe.hp;qe.scaledAtk=Math.round((qe.scaledAtk||cdef.atk)*1.3);qe.isQuestElite=true;qe.questFor=adef.id;game.enemies.push(qe);game._huntRef=qe;log("Something bigger than usual is stalking this floor.","red");}}}
    if(!game._huntRef)_spawnHuntElite(adef,Math.random);/* MOB-58: the first spot was the stairs or Dad's tile */
   }
  }}}
 _placeFridgeNote(f);/* M16 */
 _settlePlacements();computeVis();}
/* M16: an encouragement note from the kids ("Fridge Drawing") turns up on some floors. Own seeded stream (mulberry32 of seed + depth), so the
   floor RNG, and therefore every other placement on the floor, is unchanged. Picked up automatically: logs the note and restores a little Patience. */
const FRIDGE_NOTE_CHANCE=0.2;
function _placeFridgeNote(f){if(!game||!f||!f.rooms||f.rooms.length<2||typeof FRIDGE_NOTES==="undefined"||!FRIDGE_NOTES.length)return;if(isVendorFloor(game.depth)||game.depth%10===0)return;
 const r=mulberry32(((game.seed>>>0)^0x0F21D6E5)+game.depth*7919+(game.ascent?101:0));if(r()>=FRIDGE_NOTE_CHANCE)return;
 const idx=Math.floor(r()*FRIDGE_NOTES.length),rm=f.rooms[1+Math.floor(r()*(f.rooms.length-1))];if(!rm)return;
 const busy=(x,y)=>onStairs(x,y)||(x===game.px&&y===game.py)||game.loot.some(l=>l.x===x&&l.y===y)||game.enemies.some(e=>e.x===x&&e.y===y)||(game.traps||[]).some(t=>t.x===x&&t.y===y)||(game.vendor&&game.vendor.x===x&&game.vendor.y===y)||(game.ally&&game.ally.x===x&&game.ally.y===y)||!!doorAt(x,y);
 const cand=[];for(let y=rm.y;y<rm.y+rm.h;y++)for(let x=rm.x;x<rm.x+rm.w;x++){if(f.grid[y]&&f.grid[y][x]===0&&!busy(x,y))cand.push({x,y});}if(!cand.length)return;
 const c=cand[Math.floor(r()*cand.length)];game.loot.push({x:c.x,y:c.y,item:{kind:"note",name:"Fridge Drawing",note:idx}});}
function readFridgeNote(it){const n=(typeof FRIDGE_NOTES!=="undefined"&&FRIDGE_NOTES.length)?FRIDGE_NOTES[(it&&it.note|0)%FRIDGE_NOTES.length]:null;if(!n)return;
 log("A FRIDGE DRAWING, held on with a magnet shaped like a pineapple: "+n.pic,"gold");log("\u201C"+n.text+"\u201D \u2014 "+n.from,"blu");
 const h=Math.min(3,game.maxhp-game.hp);if(h>0){game.hp+=h;log("He stands a little taller. +"+h+" HP.","grn");}else log("He was already fine. He is now finer.","grn");game.notesFound=(game.notesFound||0)+1;}
/* MOB-30 (KBP 2026-11-10): comedy-break encounters (COMEDY_ENCOUNTERS in js/data.js). No game effect and no turn cost. How often they appear is
   rolled once per run from the run seed (1 floor in 10 to 1 in 3). The per-floor roll and the pick use their own mulberry32 streams, so floor
   generation, seeded runs and Daily runs are unchanged. Never on boss floors, never with a creature in view, at most one per floor, no repeats in a
   run; shown 4-15 turns after arriving, once Dad has stopped walking and no other card is open. Saved: comedyFloors, comedyShown (missing = none). */
var COMEDY_RATE_MIN=0.1,COMEDY_RATE_MAX=1/3;
function comedyRate(){if(!game)return 0;return COMEDY_RATE_MIN+mulberry32(((game.seed>>>0)^0x7A11C0DE)>>>0)()*(COMEDY_RATE_MAX-COMEDY_RATE_MIN);}
function _comedyKey(){return (game.ascent?"a":"")+game.depth;}
function comedyPlan(){if(!game||typeof COMEDY_ENCOUNTERS==="undefined"||game.depth%10===0)return null;
 const r=mulberry32((((game.seed>>>0)^0x0C0FFEE5)+game.depth*15485863+(game.ascent?7:0))>>>0);if(r()>=comedyRate())return null;return {at:4+Math.floor(r()*12),pick:r()};}
function comedyTick(){if(!game||mode!==State.PLAY||typeof openMenu!=="function"||typeof COMEDY_ENCOUNTERS==="undefined")return false;
 game.floorTurns=(game.floorTurns|0)+1;if(!game.comedyFloors)game.comedyFloors=[];if(!game.comedyShown)game.comedyShown=[];
 const k=_comedyKey();if(game.comedyFloors.indexOf(k)>=0)return false;const p=comedyPlan();if(!p||game.floorTurns<p.at)return false;
 if(pendingMenu||pendingConfirm||aiming||placing||ovInstr||ovInv||ovDad||ovBest||ovMap||ovCodex||ovGrave||shopOpen||(game.clickPath&&game.clickPath.length))return false;
 if(game.enemies.some(e=>e&&e.hp>0&&!e.isDog&&game.vis&&game.vis[e.y]&&game.vis[e.y][e.x]))return false;
 const bid=keyBiomeFor(game.depth),b=COMEDY_ENCOUNTERS[bid];game.comedyFloors.push(k);if(!b||!b.lines||!b.lines.length)return false;
 const left=[];for(let i=0;i<b.lines.length;i++)if(game.comedyShown.indexOf(bid+":"+i)<0)left.push(i);if(!left.length)return false;
 const i=left[Math.min(left.length-1,Math.floor(p.pick*left.length))];game.comedyShown.push(bid+":"+i);
 openMenu('<span class="l-gold">'+b.name+' &middot; A BRIEF INTERLUDE</span><br>'+b.lines[i],[{label:"Carry on.",fn:function(){}}]);return true;}
/* MOB-13 safety net: anything that ends up on a wall tile (or off the map) is moved to the nearest open floor tile. Consumes no RNG, so seeded floors are unchanged. */
function _openFloorNear(x,y,taken){const gr=game.floor.grid;for(let r=1;r<Math.max(MAP_W,MAP_H);r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)continue;if(gr[ny][nx]!==0)continue;if(doorAt(nx,ny))continue;if(onStairs(nx,ny))continue;if(taken&&taken(nx,ny))continue;return {x:nx,y:ny};}}return null;}
/* MOB-21: the floor key goes in a room away from both stairs and from the locked door (was always one tile from the arrival stairs). Own hash RNG, so the floor's other placements are unchanged. */
function _keySpot(f){const R=f.rooms,ld=game.doors.find(d=>d.locked)||(game.secrets||[]).find(z=>z.hiddenLock);const vri=ld?ld.ri:-1;const ch=(x1,y1,x2,y2)=>Math.max(Math.abs(x1-x2),Math.abs(y1-y2));const st=[game.stairs,game.stairsUp,{x:game.px,y:game.py},{x:R[0].cx,y:R[0].cy}].filter(Boolean);
 const score=r=>{let m=99;for(const p of st)m=Math.min(m,ch(r.cx,r.cy,p.x,p.y));if(ld)m=Math.min(m,ch(r.cx,r.cy,ld.x,ld.y));return m;};
 const cand=[];for(let i=1;i<R.length-1;i++)if(i!==vri)cand.push(R[i]);
 if(!cand.length){const r=R[0];let kx=r.cx,ky=r.cy+1<r.y+r.h?r.cy+1:r.cy;if(onStairs(kx,ky)){ky=r.cy-1>=r.y?r.cy-1:r.cy;if(onStairs(kx,ky))kx=r.cx+1<r.x+r.w?r.cx+1:r.cx;}return {x:kx,y:ky};}
 let far=cand.filter(r=>score(r)>=8);if(!far.length){const best=Math.max(...cand.map(score));far=cand.filter(r=>score(r)===best);}
 const h=mulberry32((game.seed|0)+game.depth*104729+17)();const r=far[Math.floor(h*far.length)];
 const ok=(x,y)=>f.grid[y]&&f.grid[y][x]===0&&!onStairs(x,y)&&!doorAt(x,y)&&!game.loot.some(l=>l.x===x&&l.y===y);
 for(let rad=0;rad<4;rad++)for(let dy=-rad;dy<=rad;dy++)for(let dx=-rad;dx<=rad;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rad)continue;const x=r.cx+dx,y=r.cy+dy;if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h&&ok(x,y))return {x,y};}
 return {x:r.cx,y:r.cy};}
/* MOB-22: on about 2 in 5 floors with a locked door (not merchant floors) the key is carried by the biome's key holder
   (KEY_HOLDERS in data.js): one of the biome's own creatures, named, with double HP and XP and 1.3x attack, standing where the
   key would have been. Own hash RNG, so the floor's other placements are unchanged. keyHolderSweep() (start and end of
   endTurn) drops the key where the holder was last seen once it is gone by any means. game._kh is transient (reset by
   buildFloor), so a floor left and revisited, or a Continue, finds its holder again by uid. */
function _keyHolderSpawn(f,kp,vend){if(vend||typeof KEY_HOLDERS==="undefined")return null;const h=mulberry32(hashSeed("SDA_KEYHOLDER_"+(game.seed|0)+"_"+game.depth+(game.ascent?"_A":"")))();if(h>=0.4)return null;
 const b=KEY_HOLDERS[pickBiomeName(game.depth)];const base=b&&CREATURES.find(c=>c.id===b.base);if(!base)return null;
 let x=kp.x,y=kp.y;const busy=(xx,yy)=>!(f.grid[yy]&&f.grid[yy][xx]===0)||onStairs(xx,yy)||doorAt(xx,yy)||(xx===game.px&&yy===game.py)||game.enemies.some(e=>e.x===xx&&e.y===yy)||(game.vendor&&game.vendor.x===xx&&game.vendor.y===yy);
 if(busy(x,y)){let p=null;for(let rad=1;rad<4&&!p;rad++)for(let dy=-rad;dy<=rad&&!p;dy++)for(let dx=-rad;dx<=rad&&!p;dx++)if(!busy(x+dx,y+dy))p={x:x+dx,y:y+dy};if(!p)return null;x=p.x;y=p.y;}
 const def=Object.assign({},base,{name:b.name,flavor:b.flavor,defeatMsg:b.defeatMsg,xp:base.xp*2,gold:(base.gold||0)*2+5});const e=mkEnemy(def,x,y,false);e.hp=Math.round(e.hp*2);e.maxhp=e.hp;e.scaledAtk=Math.round((e.scaledAtk||base.atk)*1.3);e.keyHolder=true;game.enemies.push(e);game._kh={uid:e.uid,floor:game.depth,x,y};return b;}
function pickBiomeName(d){return d<=10?"The House":d<=20?"Lowe & Behold":d<=30?"The Park":d<=40?"Vastco":d<=50?"Soccer Complex":d<=60?"The School":d<=70?"The Family Restaurant":d<=80?"IDKEA":d<=90?"The Neighborhood":"The HOA Dominion";}
function keyHolderSweep(){if(!game||!game.enemies)return;let k=game._kh;if(k&&k.floor!==game.depth)k=game._kh=null;
 if(!k){const e=game.enemies.find(z=>z.keyHolder&&!z.keyDropped&&z.hp>0);if(e)game._kh={uid:e.uid,floor:game.depth,x:e.x,y:e.y};return;}
 const e=game.enemies.find(z=>z.uid===k.uid);if(e&&e.hp>0){k.x=e.x;k.y=e.y;return;}
 if(e)e.keyDropped=true;game._kh=null;let x=k.x,y=k.y;if(!(game.floor.grid[y]&&game.floor.grid[y][x]!==1)){const p=_openFloorNear(x,y);if(p){x=p.x;y=p.y;}}
 game.loot.push({x,y,item:mkKey(game.depth)});log("The key hits the floor with the small, bright sound of a problem changing hands.","gold");}
/* MOB-20: an unrecruited companion waits in a proper room: not the start, stairs, locked or flooded room, at least 5x5, on a tile with open floor all around. Falls back to the old spot. No RNG. */
function _allyRoom(f){const R=f.rooms,ld=game.doors.find(d=>d.locked)||(game.secrets||[]).find(z=>z.hiddenLock);const vri=ld?ld.ri:-1;const gr=f.grid;
 const open9=(x,y)=>{for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){if(!gr[y+b]||gr[y+b][x+a]!==0)return false;}return !doorAt(x,y)&&!onStairs(x,y)&&!(x===game.px&&y===game.py)&&!(game.vendor&&game.vendor.x===x&&game.vendor.y===y);};
 const good=[];for(let i=1;i<R.length-1;i++){const r=R[i];if(i===vri||r.w<5||r.h<5)continue;if(open9(r.cx,r.cy))good.push(r);}
 if(good.length)return good[0];for(let i=1;i<R.length-1;i++){if(i!==vri&&open9(R[i].cx,R[i].cy))return R[i];}return null;}
function _settlePlacements(){if(!game||!game.floor)return;const gr=game.floor.grid;const bad=(x,y)=>!(gr[y]&&gr[y][x]!==undefined)||gr[y][x]===1;
 if(bad(game.px,game.py)){const p=_openFloorNear(game.px,game.py);if(p){game.px=p.x;game.py=p.y;}}
 const occ=(x,y)=>(x===game.px&&y===game.py)||game.enemies.some(e=>e.x===x&&e.y===y);
 for(const e of game.enemies){if(bad(e.x,e.y)){const p=_openFloorNear(e.x,e.y,occ);if(p){e.x=p.x;e.y=p.y;}}}
 for(const l of game.loot){if(bad(l.x,l.y)){const p=_openFloorNear(l.x,l.y);if(p){l.x=p.x;l.y=p.y;}}}
 if(game.ally){if(game.ally.following){game.ally.x=game.px;game.ally.y=game.py;}else if(bad(game.ally.x,game.ally.y)){const p=_openFloorNear(game.ally.x,game.ally.y,occ);if(p){game.ally.x=p.x;game.ally.y=p.y;}}}}
function pickCreature(depth,rng){const bio=depth<=10?"The House":depth<=20?"Lowe & Behold":depth<=30?"The Park":depth<=40?"Vastco":depth<=50?"Soccer Complex":depth<=60?"The School":depth<=70?"The Family Restaurant":depth<=80?"IDKEA":depth<=90?"The Neighborhood":"The HOA Dominion";const pool=CREATURES.filter(c=>c.biome===bio);const src=pool.length?pool:CREATURES;return src[Math.floor(rng()*src.length)];}
function mkEnemy(t,x,y,boss){const _d=(typeof game!=="undefined"&&game&&game.diff&&!boss)?game.diff:null;let _hp=_d?Math.max(1,Math.round(t.hp*_d.hpMul)):t.hp;let _atk=_d?Math.max(1,Math.round(t.atk*_d.atkMul)):t.atk;if(typeof game!=="undefined"&&game&&game.ascent){_hp=Math.max(1,Math.round(_hp*1.5));_atk=Math.max(1,Math.round(_atk*1.3));}return {def:t,x,y,hp:_hp,maxhp:_hp,scaledAtk:_atk,isBoss:!!boss,shownHP:false,uid:uid(),stun:0,root:0,blind:0};}
/* MOB-16: floor loot favors weaker gear early. Each template is ranked by strength within its list (0 = weakest,
   1 = strongest); its weight is (1 - rank*(1-d))^3 with d = how deep the floor is (0 on floor 1, 1 on floor 100),
   never below LOOT_TIER_MIN. Floor 1: the strongest pieces are very rare; floor 100: every piece is about even.
   Still one random draw per pick, so seeded and Daily floors stay repeatable. Vendor stock is unchanged. */
var LOOT_TIER_EXP=3,LOOT_TIER_MIN=0.02,_gearRankCache={};
function gearScore(t,kind){return kind==="weapon"?(t.atk||0)+(t.reqLevel||0)*0.5:(t.def||0)+(t.atk||0)+(t.per||0)+(t.wis||0)+(t.cap||0)*0.5;}
function _gearRanks(list,kind){const c=_gearRankCache[kind];if(c&&c.list===list&&c.n===list.length)return c.r;const sc=list.map(t=>gearScore(t,kind));
 const r=sc.map(s=>{let lo=0,eq=0;for(const o of sc){if(o<s)lo++;else if(o===s)eq++;}return list.length>1?(lo+(eq-1)/2)/(list.length-1):0;});_gearRankCache[kind]={list:list,n:list.length,r:r};return r;}
function gearWeights(list,kind,depth){const r=_gearRanks(list,kind),d=Math.max(0,Math.min(1,((depth|0)-1)/Math.max(1,MAXDEPTH-1)));return r.map(x=>Math.max(LOOT_TIER_MIN,Math.pow(1-x*(1-d),LOOT_TIER_EXP)));}
function pickGearTpl(list,kind,depth,u){const w=gearWeights(list,kind,depth);let tot=0;for(const v of w)tot+=v;let a=u*tot;for(let i=0;i<list.length;i++){a-=w[i];if(a<0)return list[i];}return list[list.length-1];}
function pickLoot(rng,depth){const r=rng();
 if(r<0.22){return mkGear(pickGearTpl(WEAPONS,"weapon",depth,rng()),"weapon",rng,false);}
 if(r<0.46){return mkGear(pickGearTpl(ARMORS,"armor",depth,rng()),"armor",rng,false);}
 if(r<0.56){return mkGear(pickGearTpl(CHARMS,"charm",depth,rng()),"charm",rng,false);}
 if(r<0.78){return mkConsumable(CONSUMABLES[Math.floor(rng()*CONSUMABLES.length)].id);}
 if(r<0.88){return mkObject(OBJECTS[Math.floor(rng()*OBJECTS.length)].id);}
 if(r<0.93){return mkProtip(PROTIPS[Math.floor(rng()*PROTIPS.length)].id);}
 return {kind:"gold",amount:5+Math.floor(rng()*depth*5),name:"a fistful of Moolah"};}
/* ===== FOV ===== */
function doorAt(x,y){return game.doors.find(d=>d.x===x&&d.y===y);}
function opaque(x,y){if(x<0||y<0||x>=MAP_W||y>=MAP_H)return true;if(game.floor.grid[y][x]===1)return true;const d=doorAt(x,y);return d&&!d.open;}
function losClear(x0,y0,x1,y1){let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy,x=x0,y=y0;
 while(true){if(x===x1&&y===y1)return true;const e2=2*err;if(e2>-dy){err-=dy;x+=sx;}if(e2<dx){err+=dx;y+=sy;}if(x===x1&&y===y1)return true;if(opaque(x,y))return false;}}
function computeVis(){for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)game.vis[y][x]=false;
 const R=Math.max(4,Math.min(8,4+Math.floor(effPer()/3)));game.vis[game.py][game.px]=true;game.seen[game.py][game.px]=true;
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R)continue;const x=game.px+dx,y=game.py+dy;if(x<0||y<0||x>=MAP_W||y>=MAP_H)continue;if(losClear(game.px,game.py,x,y)){game.vis[y][x]=true;game.seen[y][x]=true;}}_doorPeek();ledgerNote();}
/* MOB-66: an open door next to Dad (any of the 8 neighbours) always shows the tiles straight through it, so opening a door from
   the side reveals the tile right in front of it on the far side (a corner wall used to block that line of sight). No RNG. */
function _doorPeek(){if(!game||!game.doors||!game.floor)return;const G=game.floor.grid,W=(x,y)=>x<0||y<0||x>=MAP_W||y>=MAP_H||G[y][x]===1;
 for(const d of game.doors){if(!d.open||Math.max(Math.abs(d.x-game.px),Math.abs(d.y-game.py))!==1)continue;let t;
  if(W(d.x-1,d.y)&&W(d.x+1,d.y))t=[[d.x,d.y-1],[d.x,d.y+1]];else if(W(d.x,d.y-1)&&W(d.x,d.y+1))t=[[d.x-1,d.y],[d.x+1,d.y]];else t=[[2*d.x-game.px,2*d.y-game.py]];
  t.push([d.x,d.y]);for(const[x,y]of t){if(W(x,y))continue;game.vis[y][x]=true;game.seen[y][x]=true;}}}
/* MOB-49: FLOOR LEDGER. Records, per floor, the notable things Dad has actually SEEN (in view): water fountain (sips left),
   Cooler of Restoration, merchant, companion, locked door (and whether it is open now), key, boss (beaten or not).
   Kept in game.ledger {depth:{...}} and saved in the run save as the optional field 'ledger' (old sda_save_v4 saves load with {}). No DOM. */
function ledgerNote(){if(!game||!game.vis||!game.depth)return;if(!game.ledger||typeof game.ledger!=="object")game.ledger={};const d=game.depth,L=game.ledger[d]||(game.ledger[d]={v:1}),V=(x,y)=>!!(game.vis[y]&&game.vis[y][x]);
 (game.fountains||[]).forEach(f=>{if(V(f.x,f.y))L.w=Math.max(0,f.charges|0);});
 (game.healFountains||[]).forEach(f=>{if(V(f.x,f.y))L.h=Math.max(0,f.charges|0);});
 if(game.vendor&&game.vendor.def&&V(game.vendor.x,game.vendor.y))L.m=game.vendor.def.name||"A merchant";
 if(game.ally&&typeof ALLIES!=="undefined"){const ad=ALLIES.find(a=>a.id===game.ally.defId);if(ad&&(game.ally.following?(L.a&&L.a.n===ad.name):V(game.ally.x,game.ally.y))){L.a={n:ad.name,j:game.ally.following?1:0};}}
 (game.doors||[]).forEach(dr=>{if(!V(dr.x,dr.y))return;if(dr.locked)L.l=1;});
 if((game.doors||[]).length&&L.l===1&&!(game.doors||[]).some(dr=>dr.locked))L.l=2;
 (game.loot||[]).forEach(o=>{if(o.item&&o.item.kind==="key"&&V(o.x,o.y))L.k=1;});
 (game.enemies||[]).forEach(e=>{if(e.isBoss&&e.def&&V(e.x,e.y)&&!L.b)L.b={n:e.def.name,x:0};});
 if(L.b&&!L.b.x&&!(game.enemies||[]).some(e=>e.isBoss&&e.hp>0))L.b.x=1;}
const LEDGER_BIOMES=["The House","Lowe & Behold","The Park","Vastco","Soccer Complex","The School","The Family Restaurant","IDKEA","The Neighborhood","The HOA Dominion"];
/* ===== inventory ===== */
function stackable(it){return it.kind==="consumable"||it.kind==="object"||it.kind==="key"||it.kind==="protip";}
function maxStack(it){if(it.societyItem)return 9;if(it.placeable)return 5;if(it.throw)return 9;if(it.kind==="consumable")return 5;return Infinity;}
function addItem(it){noteGearSeen(it);/* MOB-07 */if(it.kind==="gold"){game.gold+=it.amount;return true;}if(it.kind==="key"){if(!game.keyring)game.keyring=[];if(it.floor&&game.keyring.some(k=>k.floor===it.floor))return true;game.keyring.push(it);return true;}if(stackable(it)){const ms=maxStack(it);const e=game.inv.find(e=>e.it.kind===it.kind&&e.it.id===it.id&&e.qty<ms);if(e){e.qty++;return true;}}if(game.inv.length>=invCap()){log("Inventory full ("+invCap()+" slots). Drop something.","red");return false;}game.inv.push({it,qty:1});return true;}
function removeEntry(e,n){n=n||1;e.qty-=n;if(e.qty<=0){const i=game.inv.indexOf(e);if(i>=0)game.inv.splice(i,1);}}
function equip(itOrE,silent,slotPick){const it=itOrE.it?itOrE.it:itOrE;let slot;if(it.kind==="weapon")slot="weapon";else if(it.kind==="armor")slot=it.slot;else if(it.kind==="charm"){
  if(slotPick==="charm1"||slotPick==="charm2")slot=slotPick;
  else if(game.equip.charm1&&game.equip.charm2&&!silent){/* MOB-71: both charm slots full: ask which one to swap out */const _it=it;
   openMenu("Both charm slots are taken. Swap out which charm for the "+it.name+"?",["charm1","charm2"].map((k,n)=>({label:"Charm slot "+(n+1)+": "+game.equip[k].name+(isCursed(game.equip[k])?" (cursed)":""),fn:function(){equip(_it,false,k);if(typeof ovInv!=="undefined"&&ovInv&&typeof buildInv==="function")buildInv();syncUI();}})));return;}
  else slot=!game.equip.charm1?"charm1":(!game.equip.charm2?"charm2":"charm1");}else return;
 if(it.reqLevel&&game.level<it.reqLevel&&!silent){const bonus=(game.cls&&game.cls.id==="tactical"&&it.reqLevel>1)?1:0;if(game.level<it.reqLevel-bonus){log("Requires Level "+it.reqLevel+(bonus?" (Tactical: "+( it.reqLevel-bonus)+")":"")+" to wield "+it.name+". (You are Level "+game.level+".)","red");return;}}
 if(isCursed(game.equip[slot])){log("The "+game.equip[slot].name+" refuses to budge — the curse won't let you swap it out. (Remove the curse first.)","red");return;}
 const wasIdd=it.idd;it.idd=true;const old=game.equip[slot];game.equip[slot]=it;const e=game.inv.find(e=>e.it===it);if(e)removeEntry(e,1);if(old)_m71KeepOld(old);if(!silent){const _q=(typeof EQUIP_MSGS!=="undefined"&&EQUIP_MSGS[it.id])?(" "+EQUIP_MSGS[it.id]):"";log("Equipped "+it.name+(it.kind==="charm"?(" ("+(it.wear||"charm")+")"):"")+"."+_q,"grn");}if(!silent&&!wasIdd&&(it.affixes||[]).length)log("As you put it on, you can tell what it is by the way that it is.","blu");}
/* MOB-71: the piece taken off goes in the bag; if the swap shrank the bag (a charm or shorts that gave extra slots), it lands at Dad's feet instead of vanishing */
function _m71KeepOld(old){if(game.inv.length<invCap()){addItem(old);return true;}let dx=game.px,dy=game.py;if(onStairs(dx,dy)){for(const[ox,oy]of[[0,1],[1,0],[0,-1],[-1,0]]){const nx=dx+ox,ny=dy+oy;if(nx>=0&&ny>=0&&nx<MAP_W&&ny<MAP_H&&game.floor.grid[ny][nx]===0&&!onStairs(nx,ny)){dx=nx;dy=ny;break;}}}
 noteGearSeen(old);game.loot.push({x:dx,y:dy,item:old});log("No room in the bag for the "+old.name+", so it goes on the floor at your feet. He will remember it is there. He will not remember it is there.","gold");return false;}
function isCursed(it){return !!(it&&["weapon","armor","charm"].includes(it.kind)&&!it.uncursed&&(it.affixes||[]).some(a=>a.type==="hinder"));}
function uncurseAll(){let n=0;for(const k of SLOTS){const g=game.equip[k];if(g&&!g.uncursed&&(g.affixes||[]).some(a=>a.type==="hinder")){g.affixes=g.affixes.filter(a=>a.type!=="hinder");g.rarity=rarityFromAffixes(g.affixes);g.uncursed=true;n++;}}if(n)log("The Original Receipt glows with retail authority. "+n+" curse(s) lifted — the gear releases its grip with an audible, sulking sigh.","gold");else log("No active curses on your equipped gear. The receipt was, for once, unnecessary. You keep it anyway. Obviously.","dim");}
function uncurseSelected(e){
  const targets=[];
  for(const k of SLOTS){const g=game.equip[k];if(g&&!g.uncursed&&(g.affixes||[]).some(a=>a.type==="hinder")){const _g=g,_k=k;targets.push({label:g.name+" ["+_k+" — equipped]",fn:function(){_g.affixes=_g.affixes.filter(a=>a.type!=="hinder");_g.rarity=rarityFromAffixes(_g.affixes);_g.uncursed=true;log(_g.name+" freed of its curse. The hindering enchantment evaporates with a small, resentful sound.","gold");removeEntry(e,1);endTurn();}});}}
  for(const inv of game.inv){const it=inv.it;if(["weapon","armor","charm"].includes(it.kind)&&!it.uncursed&&(it.affixes||[]).some(a=>a.type==="hinder")){const _it=it,_inv=inv;targets.push({label:it.name+" [in bag]",fn:function(){_it.affixes=_it.affixes.filter(a=>a.type!=="hinder");_it.rarity=rarityFromAffixes(_it.affixes);_it.uncursed=true;log(_it.name+" freed of its curse. The hindering enchantment evaporates with a small, resentful sound.","gold");removeEntry(e,1);endTurn();}});}}
  closeOverlays();
  if(!targets.length){log("No cursed items found. The receipt was, for once, unnecessary. You keep it anyway. Obviously.","dim");removeEntry(e,1);endTurn();return;}
  if(targets.length===1){targets[0].fn();return;}
  openMenu("REMOVE CURSE — select an item:",targets);
}
function unequip(slot){const old=game.equip[slot];if(!old)return;if(isCursed(old)){log("The "+old.name+" will NOT come off. The curse insists you keep wearing it. (Remove the curse first.)","red");return;}
 if(old.breakOnRemove){/* MOB-40 T1-18 */game.equip[slot]=null;log("He cuts the zip ties. The "+old.name+" come off in pieces.","dim");log("I guess they can be removed once...","dim");return;}
 // If this item grants extra inventory slots (cap), check capacity AFTER those slots go away with it —
 // otherwise the item can vanish into an over-full bag the instant it's removed.
 const capAfter=invCap()-itemStat(old,"cap");
 if(game.inv.length>=capAfter){log("Your pockets are full, so you decide not to take it off.","red");return;}
 game.equip[slot]=null;addItem(old);log("Unequipped "+old.name+".","dim");}
function hasKey(floor){floor=floor||game.depth;return (game.keyring||[]).some(k=>!k.floor||k.floor===floor);}
function keyFor(floor){floor=floor||game.depth;const kr=game.keyring||[];return kr.find(k=>k.floor===floor)||kr.find(k=>!k.floor)||null;}
function consumeKey(floor){floor=floor||game.depth;const kr=game.keyring||[];let i=kr.findIndex(k=>k.floor===floor);if(i<0)i=kr.findIndex(k=>!k.floor);if(i>=0)kr.splice(i,1);}
function onStairs(x,y){return !!(game.stairs&&game.stairs.x===x&&game.stairs.y===y)||(game.stairsUp&&game.stairsUp.x===x&&game.stairsUp.y===y);}
function dropItem(e){const it=e.it;let dx=game.px,dy=game.py;if(onStairs(dx,dy)){for(const[ox,oy]of[[0,1],[1,0],[0,-1],[-1,0]]){const nx=dx+ox,ny=dy+oy;if(nx>=0&&ny>=0&&nx<MAP_W&&ny<MAP_H&&game.floor.grid[ny][nx]===0&&!onStairs(nx,ny)){dx=nx;dy=ny;break;}}}game.loot.push({x:dx,y:dy,item:it});log("Dropped "+it.name+". It will stay put.","dim");removeEntry(e,1);}
function useConsumable(e){const it=e.it;let did=false;
 if(!consKnown(it)){revealConsumable(it.id);log("You try the "+consAlias(it.id)+". It turns out to be "+it.name+".","blu");}
 if(it.heal){game.hp=Math.min(game.maxhp,game.hp+it.heal);log("You consume "+it.name+". +"+it.heal+" HP.","grn");did=true;}
 if(it.nourish){game.hunger=Math.max(0,game.hunger-it.nourish);game.drunkStack=0;game.foodEaten=(game.foodEaten||0)+1;log("Hunger eased.","blu");did=true;}
 if(it.hydrate){game.hydra=Math.max(0,game.hydra-it.hydrate);game.drunkStack=0;game.drinksTaken=(game.drinksTaken||0)+1;log("Thirst quenched (hydration).","blu");did=true;}
 if(it.moxie){game.moxie=Math.min(game.maxmoxie,game.moxie+it.moxie);log("+"+it.moxie+" Patience.","blu");did=true;}
 if(it.cures){for(const c of it.cures)if(game.statuses[c]){delete game.statuses[c];log(STATUSES[c].name+" cured.","grn");}did=true;}
 /* MOB-69: a Warm Water Bottle puts out Burning; Gas Station Coffee cures Chilled and Frozen Solid; any healing item stops Bleeding */
 if(it.id==="water"&&game.statuses.burn){delete game.statuses.burn;log("You pour the Warm Water Bottle over yourself. The fire is out. It was body temperature anyway.","grn");did=true;}
 if(it.id==="coffee"&&(game.statuses.chill||game.statuses.frozensolid)){delete game.statuses.chill;delete game.statuses.frozensolid;log("Gas station coffee. Your core temperature returns. So does your heart rate, twice.","grn");did=true;}
 if(it.heal&&game.statuses.bleed){delete game.statuses.bleed;log("The bleeding stops. You did not need a bandage. You used one anyway.","grn");}
 if(it.relieve&&game.statuses[it.relieve]){game.statuses[it.relieve].craving=0;log("The Thirst is eased... for now.","dim");}
 if(it.alcohol){const th=game.statuses.thirst;if(th){if(th.withdrawing){th.withdrawing=false;th.withdrawTurns=0;log("The Intervention Binder tried. The cold one won. Withdrawal: failed.","red");}th.craving=0;th.dry=0;/* MOB-64 */th.suppressTurns=15;th.depend=(th.depend||0)+1;log("The Thirst quiets. 15 turns of peace. It is already calculating your next mistake.","red");}}
 if(it.whiskey){game.drunkStack=(game.drunkStack||0)+1;applyStatus("atkup",8);applyStatus("guard",8);if(game.drunkStack>=3){applyStatus("drunk",20);game.drunkStack=0;log("The room invites new interpretations. The floor offers a few of its own.","red");log("DAD DRUNK: you are now Dad Drunk. Your feet have filed for independence and your steps no longer answer to you.","red");}else{log("Fire in the belly. ATK & DEF up.","grn");}did=true;}
 if(["ibuprofen","acetaminophen","glucosamine"].includes(it.id)){game.kneeChance=0.05;game.backChance=0.05;log("Joints quiet, inflammation managed. The body's odds reset — for now.","blu");did=true;}
 if(it.saltdry){applyStatus("saltdry",it.saltdry);log("Salt-cured and regretting nothing. Your mouth declares a drought.","dim");did=true;}
 if(it.reaction){applyStatus("reaction",it.reaction);log("The label told me not to do this.","red");did=true;}
 if(it.causes){applyStatus(it.causes,it.causes==="thirst"?9999:(it.causesTurns||14));log("...you've come down with "+STATUSES[it.causes].name+".","red");did=true;}
 if(it.defBuff){applyStatus("defbuff",10);log("Pain managed. DEF increased for 10 turns.","blu");did=true;}
 if(it.invincible){applyStatus("invincible",it.invincible);log("MAXIMUM DAD RELIEF. Briefly immune to damage. He has never felt better.","gold");did=true;}
 if(it.withdrawcure){const _wth=game.statuses.thirst;if(!_wth){log("No active Thirst. The Binder appreciates the forward planning.","dim");}else{_wth.withdrawing=true;_wth.withdrawTurns=0;_wth.craving=Math.max(0,(_wth.craving||0)-6);log("Your family staged an intervention. The binder is laminated. Page 12 has a note from your kid.","grn");log("WITHDRAWAL STARTED. Avoid all alcohol for 15 turns. DEF -1. Craving will fall. This is winnable.","red");}did=true;}
 if(!did)log("Nothing happens. Classic.","dim");
 game.consumed=(game.consumed||0)+1;
 removeEntry(e,1);endTurn();}
function useProtip(e){const p=e.it.perm||{};if(p.per)game.per+=p.per;if(p.str)game.str+=p.str;if(p.maxhp){game.maxhp+=p.maxhp;game.hp+=p.maxhp;}if(p.maxmoxie){game.maxmoxie+=p.maxmoxie;game.moxie+=p.maxmoxie;}if(p.hydraslow)game.hydraSlow+=p.hydraslow;log("PRO TIP internalized: "+e.it.name+".","gold");const _bfts=[];if(p.per)_bfts.push("+"+ p.per+" Perception");if(p.str)_bfts.push("+"+p.str+" ATK");if(p.maxhp)_bfts.push("+"+p.maxhp+" max HP");if(p.maxmoxie)_bfts.push("+"+p.maxmoxie+" max Patience");if(p.hydraslow)_bfts.push("thirst fills more slowly");if(_bfts.length)log("Benefits applied: "+_bfts.join(", ")+".","grn");removeEntry(e,1);endTurn();}
/* MOB-84: hand a known healing consumable to the companion (standing on any of the 8 tiles next to Dad). It heals the companion by the
   item's heal value and stops its bleeding; costs a turn, like eating it yourself. Unidentified consumables are not offered (Dad does not know they heal). */
var M84_LINES=["{n} eats it standing up, like a professional.","{n} says thanks with their mouth full. Manners can wait.","{n} looks at the label, decides not to ask, and eats it.","Sharing your snacks. The kids would be proud of you. They would also want some."];
function allyCanTakeHeal(it){return !!(it&&it.kind==="consumable"&&it.heal>0&&consKnown(it)&&game.ally&&game.ally.following&&game.ally.hp>0);}
function giveToAlly(e){const A=game.ally;if(!e||!allyCanTakeHeal(e.it)){log("Nobody here has any use for that.","dim");syncUI();return false;}
 const nm=allyName();
 if(Math.max(Math.abs(A.x-game.px),Math.abs(A.y-game.py))>1){log(nm+" is too far away to hand it over. Dad does not throw food. He has standards, and also aim. Get next to them first.","dim");syncUI();return false;}
 if(A.hp>=A.maxhp&&!(A.dBleed>0)){log(nm+" is already at full health and politely declines the "+e.it.name+". Save it for later.","dim");syncUI();return false;}
 const before=A.hp;A.hp=Math.min(A.maxhp,A.hp+e.it.heal);
 log("You hand "+nm+" the "+e.it.name+". +"+(A.hp-before)+" HP ("+A.hp+"/"+A.maxhp+"). "+M84_LINES[(game.turn||0)%M84_LINES.length].replace("{n}",nm),"grn");
 if(A.dBleed>0){A.dBleed=0;A.dBleedN=0;log(nm+"'s bleeding stops.","grn");}
 removeEntry(e,1);endTurn();return true;}
/* ===== MOB-60: companion kit and carry bag =====
   A following companion can wear one weapon plus head, torso, legs and feet armor (no charms) and carries a small bag sized by the companion
   (ALLIES[].carry: Little Timmy 2, most adults 4, Officer Doug 6). Worn gear adds its ATK/DEF (affixes included) to the companion's own.
   Cursed gear sticks to the companion too. Handing things over or taking them back costs no turn and needs the companion on one of the 8
   tiles next to Dad. When the companion falls, everything worn or carried drops on its tile. Saved in game.ally.kit / game.ally.bag
   (older saves load with an empty kit and bag). Opened by tapping or clicking the companion, the COMPANION button, or O. */
var ALLY_KIT_SLOTS=["weapon","head","torso","legs","feet"];
var M60_SLOT_NAMES={weapon:"Weapon",head:"Head",torso:"Torso",legs:"Legs",feet:"Feet"};
var M60_GIVE_LINES=["{n} takes it without asking what it is. Trust is a beautiful thing.","{n} accepts it with both hands, like a casserole dish.","{n} tucks it away somewhere. You will not see where. You never do.","{n} nods. The handoff is clean. Somewhere a youth coach would be proud."];
var M60_WEAR_LINES=["{n} puts it on. It is not their size. They make it work.","{n} wears it with the confidence of someone who did not read the tag.","{n} suits up. You feel a small, unexpected surge of pride. You raised a team player, or at least met one."];
function allyDefOf(){return (game&&game.ally&&typeof ALLIES!=="undefined")?(ALLIES.find(a=>a.id===game.ally.defId)||null):null;}
function allyKit(){const A=game&&game.ally;if(!A)return {};if(!A.kit||typeof A.kit!=="object"||Array.isArray(A.kit))A.kit={};return A.kit;}
function allyBag(){const A=game&&game.ally;if(!A)return [];if(!Array.isArray(A.bag))A.bag=[];return A.bag;}
function allyBagCap(d){d=d||allyDefOf();return d&&d.carry>0?d.carry:4;}
function allyGearSum(stat){const k=(game&&game.ally&&game.ally.kit)||{};let s=0;for(const sl of ALLY_KIT_SLOTS)if(k[sl])s+=itemStat(k[sl],stat);return s;}
function allyAtk(d){return Math.max(1,((d&&d.atk)||0)+allyGearSum("atk"));}
function allyDefStat(d){return Math.max(0,((d&&d.def)||0)+allyGearSum("def"));}
function allyKitSlot(it){if(!it)return null;if(it.kind==="weapon")return "weapon";if(it.kind==="armor"&&ALLY_KIT_SLOTS.indexOf(it.slot)>=0)return it.slot;return null;}
function allyNear(){const A=game&&game.ally;return !!(A&&A.following&&A.hp>0&&Math.max(Math.abs(A.x-game.px),Math.abs(A.y-game.py))<=1);}
function _m60Copy(it){return JSON.parse(JSON.stringify(it));}
// Put one item in the companion's bag (stacks like Dad's bag); false when the bag is full.
function _m60Stow(it){const B=allyBag();if(stackable(it)){const ms=maxStack(it);const b=B.find(b=>b.it.kind===it.kind&&b.it.id===it.id&&b.qty<ms);if(b){b.qty++;return true;}}if(B.length>=allyBagCap())return false;B.push({it:it,qty:1});return true;}
// Hand one of Dad's bag entries to the companion: wearable gear goes on (the piece it replaces goes to the companion's bag, else Dad's bag, else the floor); anything else goes in the companion's bag.
function allyGive(e){const A=game.ally,d=allyDefOf();if(!A||!A.following||!d||!e||game.inv.indexOf(e)<0)return false;const nm=d.name,it=e.it,sl=allyKitSlot(it);
 if(!allyNear()){log(nm+" is too far away. Hand-offs happen at arm's length. Get next to them first.","dim");syncUI();return false;}
 if(sl){const K=allyKit(),old=K[sl];
  if(old&&isCursed(old)){log("The "+old.name+" will not come off "+nm+". It is cursed, and it has decided this is home now. Find a receipt.","red");syncUI();return false;}
  removeEntry(e,1);K[sl]=it;noteGearSeen(it);
  log("You hand "+nm+" the "+it.name+". "+M60_WEAR_LINES[(game.turn||0)%M60_WEAR_LINES.length].replace("{n}",nm)+" ("+nm+": ATK "+allyAtk(d)+", DEF "+allyDefStat(d)+")","grn");
  if(isCursed(it))log("The "+it.name+" tightens its grip on "+nm+". It is cursed. They are being very brave about it.","red");
  if(old){if(_m60Stow(old))log(nm+" keeps the "+old.name+" in their bag.","dim");else{log(nm+" hands the "+old.name+" back to you.","dim");_m71KeepOld(old);}}
 }else{const one=(e.qty>1)?_m60Copy(it):it;
  if(!_m60Stow(one)){log(nm+"'s hands are full ("+allyBagCap(d)+" of "+allyBagCap(d)+"). Take something back first.","dim");syncUI();return false;}
  removeEntry(e,1);log("You hand "+nm+" the "+it.name+". "+M60_GIVE_LINES[(game.turn||0)%M60_GIVE_LINES.length].replace("{n}",nm),"grn");}
 saveRun();syncUI();return true;}
// Take back a worn piece ({slot}) or a whole bag stack ({bag:index}) into Dad's bag.
function allyTake(ref){const A=game.ally,d=allyDefOf();if(!A||!A.following||!d||!ref)return false;const nm=d.name;
 if(!allyNear()){log(nm+" is too far away to hand anything back. Get next to them first.","dim");syncUI();return false;}
 if(ref.slot){const K=allyKit(),it=K[ref.slot];if(!it)return false;
  if(isCursed(it)){log("The "+it.name+" refuses to come off "+nm+". It is cursed. "+nm+" says it is fine. It is not fine.","red");syncUI();return false;}
  if(game.inv.length>=invCap()){log("Inventory full ("+invCap()+" slots). Make room before taking the "+it.name+" back.","red");syncUI();return false;}
  delete K[ref.slot];addItem(it);log(nm+" hands back the "+it.name+". ("+nm+": ATK "+allyAtk(d)+", DEF "+allyDefStat(d)+")","grn");}
 else{const B=allyBag(),b=B[ref.bag];if(!b)return false;let got=0;
  while(b.qty>0){const one=(b.qty>1)?_m60Copy(b.it):b.it;if(!addItem(one))break;b.qty--;got++;}
  if(b.qty<=0)B.splice(ref.bag,1);
  if(!got){syncUI();return false;}
  log(nm+" hands back the "+b.it.name+(got>1?" (x"+got+")":"")+".","grn");}
 saveRun();syncUI();return true;}
// The companion falls: defeat line, then everything worn or carried lands on its tile (the tile beside it if that is a staircase).
function allyFall(def){const A=game.ally;const nm=def?def.name:"Your companion";log(def&&def.defeatMsg?def.defeatMsg:(nm+" has been defeated. They did what they could."),"red");
 const drops=[];if(A){const K=A.kit||{};for(const sl of ALLY_KIT_SLOTS)if(K[sl])drops.push(K[sl]);for(const b of (Array.isArray(A.bag)?A.bag:[]))for(let i=0;i<(b.qty||1);i++)drops.push(i?_m60Copy(b.it):b.it);}
 if(A&&drops.length){let dx=A.x,dy=A.y;if(onStairs(dx,dy)){for(const[ox,oy]of[[0,1],[1,0],[0,-1],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=dx+ox,ny=dy+oy;if(nx>=0&&ny>=0&&nx<MAP_W&&ny<MAP_H&&game.floor.grid[ny][nx]===0&&!onStairs(nx,ny)){dx=nx;dy=ny;break;}}}
  for(const it of drops)game.loot.push({x:dx,y:dy,item:it});
  log("Everything "+nm+" had on them ends up on the floor where they fell: "+drops.length+" item"+(drops.length===1?"":"s")+". Nobody in this family packs light.","gold");}
 game.ally=null;game.allyOrder=null;}
// The companion card (comic card like ATTRIBUTES): stats with gear bonus in [brackets], stance, worn gear, bag; orders and hand-offs below. No turn.
function openAllyCard(){if(!game||!game.ally||!game.ally.following)return _m60StanceList();const A=game.ally,d=allyDefOf();if(!d)return;
 const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");const K=allyKit(),B=allyBag(),cap=allyBagCap(d),near=allyNear(),cur=allyStance();
 const val=(k,b,e)=>(typeof _atcVal==="function"?_atcVal(k,b,e):(k+" = "+e));
 const row=(h,t)=>'<div class="atc-row">'+h+'<div class="atc-t">'+t+'</div></div>';
 const worn=ALLY_KIT_SLOTS.map(sl=>'<div>'+M60_SLOT_NAMES[sl]+': '+(K[sl]?'<b>'+esc(itemNameSlot?K[sl].name:K[sl].name)+'</b>'+(isCursed(K[sl])&&K[sl].idd?' <span class="l-red">(cursed)</span>':''):'<span class="dim">nothing</span>')+'</div>').join("");
 const bag=B.length?B.map(b=>'<div>'+esc(b.it.name)+(b.qty>1?' x'+b.qty:'')+'</div>').join(""):'<div class="dim">Empty.</div>';
 const html='<div class="atc m60card"><div class="atc-mast"><span>COMPANION</span><span class="atc-who">'+esc(d.name)+'</span></div>'
  +'<div class="atc-body"><div class="atc-sub">Orders, gear and the bag. Changing orders or handing things over costs no turn. Gear bonuses are in [brackets].</div>'
  +row('<span class="atc-eq">HP = '+Math.max(0,A.hp)+' / '+A.maxhp+'</span>','When this hits zero, they head home and leave everything they had on the floor.')
  +row(val('ATK',d.atk,allyAtk(d)),'Their swing, plus any weapon you gave them.')
  +row(val('DEF',d.def,allyDefStat(d)),'Every hit they take is cut by their DEF.')
  +row('<span class="atc-eq">STANCE = '+allyStanceLabel()+'</span>',(function(t){return t.charAt(0).toUpperCase()+t.slice(1);})((ALLY_STANCES.find(s=>s[0]===cur)||ALLY_STANCES[1])[2])+'.')
  +'<div class="atc-row"><span class="atc-eq">WEARING</span><div class="atc-t m60list">'+worn+'</div></div>'
  +'<div class="atc-row"><span class="atc-eq">BAG = '+B.length+' / '+cap+'</span><div class="atc-t m60list">'+bag+'</div></div>'
  +(near?'':'<div class="atc-sub">Stand next to '+esc(d.name)+' to hand things over or take them back.</div>')
  +'<div class="atc-flav">'+esc(d.flavor)+'</div></div></div>';
 const opts=ALLY_STANCES.map(s=>({label:"Stance: <b>"+s[1].toUpperCase()+"</b>"+(s[0]===cur?" (current)":""),fn:function(){setAllyStance(s[0]);}}));
 if(near){opts.push({label:"Give them something...",fn:_m60GiveList});
  if(B.length||ALLY_KIT_SLOTS.some(sl=>K[sl]))opts.push({label:"Take something back...",fn:_m60TakeList});}
 openMenu(html,opts);}
function _m60GiveList(){const d=allyDefOf();if(!d||!allyNear())return openAllyCard();const A=game.ally,opts=[];
 for(const e of game.inv){const it=e.it,sl=allyKitSlot(it);const nmq=itemNameSlot(it)+(e.qty>1?" x"+e.qty:"");
  if(allyCanTakeHeal(it)&&(A.hp<A.maxhp||A.dBleed>0))opts.push({label:"Feed: "+nmq+" <span class=\"dim\">(+"+it.heal+" HP now, takes a turn)</span>",fn:function(){giveToAlly(e);}});
  opts.push({label:(sl?"Wear: ":"Carry: ")+nmq+(sl&&allyKit()[sl]?' <span class="dim">(swaps out the '+allyKit()[sl].name+')</span>':''),fn:function(){allyGive(e);openAllyCard();}});}
 if(!opts.length){log("Your bag is empty. There is nothing to give but encouragement. You give that. It is received.","dim");syncUI();return openAllyCard();}
 opts.push({label:"Back",fn:openAllyCard});
 openMenu("Give "+d.name+" what? <span class=\"dim\">(their bag: "+allyBag().length+" / "+allyBagCap(d)+")</span>",opts);}
function _m60TakeList(){const d=allyDefOf();if(!d||!allyNear())return openAllyCard();const K=allyKit(),B=allyBag(),opts=[];
 for(const sl of ALLY_KIT_SLOTS)if(K[sl]){const _s=sl;opts.push({label:M60_SLOT_NAMES[sl]+": "+K[sl].name,fn:function(){allyTake({slot:_s});openAllyCard();}});}
 B.forEach((b,i)=>{opts.push({label:"Bag: "+b.it.name+(b.qty>1?" x"+b.qty:""),fn:function(){allyTake({bag:i});openAllyCard();}});});
 if(!opts.length)return openAllyCard();
 opts.push({label:"Back",fn:openAllyCard});
 openMenu("Take what back from "+d.name+"?",opts);}
/* ===== survival + statuses ===== */
function survivalTick(){const hr=(game.cls.hungerRate||0.5)*0.5,hy=Math.max(0.05,((game.cls.hydraRate||0.7)*0.5)-(game.hydraSlow||0)*0.5);
 const hcap=game.hungerCap||100,dcap=game.hydraCap||100;
 /* MOB-35: a continued run used to have no hunger/hydra values (NaN meters: drawn full, never hurt, food did nothing). */
 if(!Number.isFinite(game.hunger))game.hunger=0;if(!Number.isFinite(game.hydra))game.hydra=0;
 game.hunger=Math.min(hcap,game.hunger+hr);game.hydra=Math.min(dcap,game.hydra+hy);
 const hwarn=hcap*0.7,dwarn=dcap*0.7;const _surv4=game.turn%4===0;/* MOB-63: an empty stomach or a dry throat costs 1 HP every 4th turn, not every turn */
 if(game.hunger>=hwarn&&game.hunger-hr<hwarn)log("You're getting hungry.","dim");
 if(game.hydra>=dwarn&&game.hydra-hy<dwarn)log("You're getting thirsty (need a drink).","dim");
 if(game.hunger>=hcap&&_surv4){game.hp=Math.max(0,game.hp-1);log("Starving! -1 HP. Eat something.","red");}
 if(game.hydra>=dcap&&_surv4){game.hp=Math.max(0,game.hp-1);log("Parched! -1 HP. Drink something.","red");}
 if(game.hp<=0)die(game.hunger>=hcap?"starvation, in a fully stocked dungeon, having never once stopped for a proper lunch":"dehydration, in a building that absolutely had a water fountain somewhere",game.hunger>=hcap?"hunger":"thirst");}
function applyStatus(id,turns){if(!STATUSES[id])return false;if(id==="soaked"){if(typeof dtResistCount==="function"&&dtResistCount("soaked")>=1){log("The Emergency Rain Poncho does the one thing it was born to do. You stay dry.","dim");return false;}if(game.statuses.burn){delete game.statuses.burn;log("The water puts you out. You are no longer on fire, technically or otherwise.","blu");}}/* MOB-69 */if(id==="thirst"){if(game.statuses.thirst){game.statuses.thirst.depend=(game.statuses.thirst.depend||0)+1;game.statuses.thirst.dry=0;/* MOB-64 */return;}game.statuses.thirst={turns:9999,craving:0,depend:0};return true;}game.statuses[id]={turns};return true;}
function tickStatuses(){game.moxTick++;if(game.moxTick%4===0)game.moxie=Math.min(game.maxmoxie,game.moxie+1);
 for(const id of Object.keys(game.statuses)){const s=game.statuses[id];if(id==="regen")game.hp=Math.min(game.maxhp,game.hp+2);if(id==="hangover")game.hp=Math.max(1,game.hp-1);if(id==="reaction"){game.hydra=Math.min((game.hydraCap||100),game.hydra+18);game.hp=Math.max(1,game.hp-1);log("The Reaction continues. Hydration: evacuating. Dignity: gone.","red");}if(id==="saltdry")game.hydra=Math.min((game.hydraCap||100),game.hydra+6);if(id==="zap")continue;/* MOB-69: spent by lost turns (dtDadBlocked), not by the clock */if((id==="burn"||id==="bleed")&&!hasStatus("invincible")){const _dd=id==="burn"?(s.dmg||0):Math.max(0,(s.n||1)-(s.red||0));if(_dd>0){game.hp-=_dd;log(id==="burn"?"You are still On Fire, Technically. -"+_dd+" HP.":"Paper Cut, Spiritually"+((s.n||1)>1?" x"+s.n:"")+": -"+_dd+" HP. A healing item would stop it.","red");if(game.hp<=0){die(id==="burn"?"a small, technically-accurate fire he said he had under control":"a paper cut he refused to put a bandage on, out of principle","status");return;}}}if(id==="thirst"){if(s.withdrawing){s.withdrawTurns=(s.withdrawTurns||0)+1;s.craving=Math.max(0,(s.craving||0)-1);if(s.withdrawTurns===7)log("Halfway through withdrawal. The shakes: manageable. Barely.","dim");if(s.withdrawTurns>=15){delete game.statuses.thirst;log("THE THIRST HAS BEEN DEFEATED. Clean. For the first time in a long time.","gold");log("\"I never stopped believing in you.\" — Page 12.","grn");}continue;}/* MOB-64 */s.dry=(s.dry||0)+1;{const _need=thirstNeed(s);if(s.dry===Math.ceil(_need/2))log("The Thirst is at its worst. Your hands have opinions. This is, statistically, the part right before it gets easier.","red");if(s.dry>=_need){delete game.statuses.thirst;log("THE THIRST HAS WANDERED OFF. "+s.dry+" turns without a drink. It did not leave a note.","gold");log("Not every dad would have made it this far. You did.","grn");continue;}}if(s.suppressTurns>0){s.suppressTurns--;continue;}const _dep=s.depend||0,_stage=_dep>=6?3:_dep>=3?2:_dep>=1?1:0;if(!s.stageLogged)s.stageLogged=0;if(_stage>s.stageLogged){s.stageLogged=_stage;if(_stage===1)log("The Thirst notices your routine. It has started adjusting its schedule.","red");if(_stage===2)log("STAGE 2: The Thirst has filed as a dependent. It wants tax credit.","red");if(_stage===3)log("STAGE 3: The Thirst IS your primary personality trait now. The Thirst says hi.","red");}s.craving++;if(_stage>=2&&game.turn%2===0)s.craving++;if(_stage>=3&&game.turn%3===0)s.craving++;if(s.craving===6)log("The Thirst sets in. Your hands aren't steady.","red");if(s.craving===10&&_stage>=2)log("The Thirst is yelling. It has strong opinions about your schedule.","red");if(s.craving===15&&_stage>=3)log("The Thirst has become your primary motivation. He barely notices anymore.","red");continue;}if(s.turns!==9999){s.turns--;if(s.turns<=0){log(STATUSES[id].name+" wore off.","dim");delete game.statuses[id];dtShakeOff(id,s);/* MOB-69 */}}}}
/* ===== traps ===== */
function trapDetected(t){return t.known||t.def.detect<=effPer();}
function springTrap(t){t.sprung=true;const d=t.def;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:16,color:d.fxColor||"#e0453a"});addFX({kind:"pulse",cx:t.x,cy:t.y,r:3,t:0,life:12});if(d.dmg){game.hp-=d.dmg;log("TRAP! "+d.name+". -"+d.dmg+" HP.","red");}else log("TRAP! "+d.name+".","red");if(d.status){applyStatus(d.status,d.status==="thirst"?9999:(d.status==="nap"?4:12));log("You have: "+STATUSES[d.status].name+".","red");}if(d.dtype&&game.hp>0)dtApplyDad(d.dtype,"The "+d.name);/* MOB-69 */if(game.hp<=0&&mode===State.PLAY)die("a "+d.name+" — a trap he had, in fairness, every opportunity to scan for","trap");}
/* ===== combat (roll-based) ===== */
function attack(e){if(typeof dadAnimAttack==="function")dadAnimAttack(e.x-game.px,e.y-game.py);/* N29 attack frame (visual only) */if(tryFumble("your attack"))return true;let dmg=Math.max(1,roll(effAtk())-Math.floor(e.def.def/2));{const _w=game.equip&&game.equip.weapon;if(_w&&_w.critPct&&Math.random()*100<_w.critPct){dmg*=2;log("CRITICAL! The "+_w.name+" finds the exact spot. Double damage.","gold");}}/* MOB-40 */if(e.justCameThruDoor){dmg=Math.max(2,Math.floor(dmg*1.5));e.justCameThruDoor=false;log("SURPRISE! It came through the door. You were the door's plan all along. Bonus damage.","gold");}e.hp-=dmg;discover(e.def,game.depth);e.shownHP=true;addFX({kind:"blast",cells:[{x:e.x,y:e.y}],t:0,life:7,color:"#ffffff"});log("You hit "+e.def.name+" for "+dmg+".","ink");{const _wt=dtWeaponType();if(_wt&&e.hp>0&&Math.random()<dtWeaponProc()){if(_wt==="soaked")applyTo(e,"soaked");else dtApplyUnit(e,_wt);}}/* MOB-69 */if(e.hp<=0){game.kills=(game.kills||0)+1;const _g=e.def.gold||0;game.gold+=_g;game.moolahEarned=(game.moolahEarned||0)+_g;log(e.def.name+" defeated. +"+e.def.xp+" XP"+(_g>0?", +"+_g+" moolah":""),"gold");{const _dm=e.def.defeatMsg||(typeof DEFEAT_FLAVOR!=="undefined"?DEFEAT_FLAVOR[Math.floor(Math.random()*DEFEAT_FLAVOR.length)]:"");if(_dm)log(_dm,"dim");}gainXP(e.def.xp);tryCompleteHuntQuest(e);game.enemies=game.enemies.filter(x=>x!==e);if(e.isBoss)log("The way down is clear.","gold");const dc=0.12+(e.def.xp/120);if(Math.random()<dc){let dr;const _fl=Math.min(0.75,0.35+(game.foodLuck||0));if(Math.random()<_fl){const FD=["water","gatorade","pedialyte","sportsdrink","applejuice","casserole","granola","jerky","coldpizza","proteinbar"];dr=mkConsumable(FD[Math.floor(Math.random()*FD.length)]);}else{dr=pickLoot(Math.random,game.depth);}game.loot.push({x:e.x,y:e.y,item:dr});log(e.def.name+" dropped: "+dr.name+".","gold");}}return false;}
function canStep(x,y){if(x<0||y<0||x>=MAP_W||y>=MAP_H)return false;if(game.floor.grid[y][x]===1)return false;const d=doorAt(x,y);if(d&&!d.open)return false;if(x===game.px&&y===game.py)return false;if(game.enemies.some(e=>e.x===x&&e.y===y))return false;if(game.vendor&&game.vendor.x===x&&game.vendor.y===y)return false;if(game.fountains&&game.fountains.some(f=>f.x===x&&f.y===y))return false;if(game.healFountains&&game.healFountains.some(f=>f.x===x&&f.y===y))return false;return true;}
function canMoveEnemy(e,x,y){if(!canStep(x,y))return false;if(game.ally&&game.ally.following&&game.ally.x===x&&game.ally.y===y)return false;const tile=game.floor.grid[y]&&game.floor.grid[y][x];if(e.def.aquatic&&tile!==2)return false;if(!e.def.aquatic&&tile===2)return false;return true;}
/* MOB-86: creatures try to surround Dad. Each turn every approaching creature (nearest first) claims a free tile of the 8 around Dad: the one it
   can reach in the fewest steps, with a penalty for tiles next to ones already taken or claimed, so the pack spreads around him. It then takes
   one step along a short path to that tile (around the others) instead of straight at Dad. If no tile is free or reachable, it falls back to
   the old straight approach. No random rolls (Seeded/Daily floors unchanged). */
var M86_RING=[[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]],M86_CROWD=3,M86_MAXSTEPS=14;
/* Steps from e to each tile within M86_MAXSTEPS (4-way, through tiles the creature may enter). Returns {d:Map key->steps, p:Map key->prev key}. */
function _m86Bfs(e){const d=new Map(),p=new Map(),k0=e.x+","+e.y;d.set(k0,0);const q=[[e.x,e.y]];
 for(let h=0;h<q.length;h++){const[cx,cy]=q[h],ck=cx+","+cy,cd=d.get(ck);if(cd>=M86_MAXSTEPS)continue;
  for(const[dx,dy]of[[0,-1],[1,0],[0,1],[-1,0]]){const nx=cx+dx,ny=cy+dy,nk=nx+","+ny;if(d.has(nk)||!canMoveEnemy(e,nx,ny))continue;d.set(nk,cd+1);p.set(nk,ck);q.push([nx,ny]);}}
 return {d,p};}
function _m86Ring(){const c=new Set(),asg=new Map(),px=game.px,py=game.py;
 for(const e of game.enemies){if(e.isDog||e.hp<=0)continue;if(Math.max(Math.abs(e.x-px),Math.abs(e.y-py))===1)c.add(e.x+","+e.y);}
 const md=e=>Math.abs(e.x-px)+Math.abs(e.y-py);
 const go=game.enemies.filter(e=>!e.isDog&&e.hp>0&&!(e.def&&e.def.isDogWalker)&&!c.has(e.x+","+e.y)&&md(e)<=7&&!(e.root>0)&&!(e.stun>0)).sort((a,b)=>md(a)-md(b));/* nearest creatures pick first */
 for(const e of go){const B=_m86Bfs(e);let best=null,bs=1e9;
  for(const[dx,dy]of M86_RING){const tx=px+dx,ty=py+dy,k=tx+","+ty;if(c.has(k)||!B.d.has(k))continue;
   let crowd=0;for(const q of c){const i=q.indexOf(","),cx=+q.slice(0,i),cy=+q.slice(i+1);if(Math.max(Math.abs(cx-tx),Math.abs(cy-ty))===1)crowd++;}
   const sc=B.d.get(k)+M86_CROWD*crowd;if(sc<bs){bs=sc;best=k;}}
  if(best){c.add(best);asg.set(e,best);}}
 return {claimed:c,assign:asg};}
function _m86Step(e,R){const t=R.assign.get(e);if(!t)return false;const B=_m86Bfs(e);if(!B.d.has(t))return false;
 let k=t;while(B.p.has(k)&&B.p.get(k)!==e.x+","+e.y)k=B.p.get(k);if(!B.p.has(k))return false;
 const i=k.indexOf(","),nx=+k.slice(0,i),ny=+k.slice(i+1);if(!canMoveEnemy(e,nx,ny))return false;e.x=nx;e.y=ny;return true;}
function enemyTurn(){const _m86=_m86Ring();for(const e of game.enemies){if(e.isDog)continue;if(e.hp<=0||!game.enemies.includes(e))continue;{const _dt=dtTickUnit(e,false);if(_dt)continue;}/* MOB-69 */
  // Dog Walker: moves and leaves poop bombs
  if(e.def&&e.def.isDogWalker){
    if(e.stun>0){e.stun--;continue;}
    const dist=Math.abs(e.x-game.px)+Math.abs(e.y-game.py);
    if(Math.max(Math.abs(e.x-game.px),Math.abs(e.y-game.py))===1){/* MOB-65: diagonal too */e.hitDad=true;/* MOB-28 */if(hasStatus("invincible")){continue;}const dmg=Math.max(1,roll(e.scaledAtk||e.def.atk)-Math.floor(effDef()/2));game.hp-=dmg;if(typeof sfxOof==="function")sfxOof();log(e.def.name+" hits you for "+dmg+".","red");if(game.hp<=0){die(e.def.name+", who he insists he was about to defeat",e.isBoss?"boss":"creature");return;}}
    else if(dist<=7&&e.root<=0){
      const ox=e.x,oy=e.y;
      const sx=e.x+Math.sign(game.px-e.x),sy=e.y+Math.sign(game.py-e.y);
      if(canMoveEnemy(e,sx,e.y))e.x=sx;else if(canMoveEnemy(e,e.x,sy))e.y=sy;
      if(e.x!==ox||e.y!==oy){const _dd=doorAt(e.x,e.y);e.justCameThruDoor=!!(_dd&&_dd.open);}
      if((e.x!==ox||e.y!==oy)&&Math.random()<0.25&&!game.traps.some(t=>t.x===ox&&t.y===oy&&!t.sprung)){
        const pd=TRAPS_DEF.find(t=>t.id==="poop_bomb");
        if(pd){game.traps.push({x:ox,y:oy,def:pd,sprung:false,known:false});log("The Dog Walker has left something behind. Watch your step.","dim");}
      }
    }else if(e.root>0)e.root--;
    const _pt=game.traps.find(t=>!t.sprung&&t.fromPlayer&&t.x===e.x&&t.y===e.y);if(_pt)springTrapOn(e,_pt);
    continue;
  }
  if(e.stun>0){e.stun--;continue;}const dist=Math.abs(e.x-game.px)+Math.abs(e.y-game.py);
  if(Math.max(Math.abs(e.x-game.px),Math.abs(e.y-game.py))===1){/* MOB-65: any of the 8 tiles around Dad */e.hitDad=true;/* MOB-28 */if(hasStatus("invincible")){log(e.def.name+" cannot touch you. Maximum Dad Relief is in effect.","gold");continue;}if(e.blind>0){e.blind--;if(Math.random()<0.6){log(e.def.name+" swings wildly and misses.","dim");continue;}}const _ct=dtCreatureType(e);/* MOB-69: psychic hits ignore armor DEF */const dmg=Math.max(1,roll(e.scaledAtk||e.def.atk)-Math.floor((_ct==="psychic"?Math.max(0,effDef()-gearSum("def")):effDef())/2));game.hp-=dmg;if(typeof sfxOof==="function")sfxOof();log(e.def.name+" hits you for "+dmg+"."+(_ct==="psychic"?" It went straight past the armor and into the feelings.":""),"red");if(game.hp<=0){die(e.def.name+", who he insists he was about to defeat",e.isBoss?"boss":"creature");return;}if(_ct&&Math.random()<DT_PROC_CREATURE){dtApplyDad(_ct,e.def.name);if(mode!==State.PLAY)return;}blindOnHitCheck(e);}
  else if(dist<=7&&e.root<=0){const _ox=e.x,_oy=e.y;if(!_m86Step(e,_m86)/* MOB-86 */){const sx=e.x+Math.sign(game.px-e.x),sy=e.y+Math.sign(game.py-e.y);if(canMoveEnemy(e,sx,e.y))e.x=sx;else if(canMoveEnemy(e,e.x,sy))e.y=sy;}if(e.x!==_ox||e.y!==_oy){const _dd=doorAt(e.x,e.y);e.justCameThruDoor=!!(_dd&&_dd.open);}}else if(e.root>0)e.root--;
  const _pt=game.traps.find(t=>!t.sprung&&t.fromPlayer&&t.x===e.x&&t.y===e.y);if(_pt)springTrapOn(e,_pt);}}
/* ===== BFS click-to-move pathfinding ===== */
/* MOB-02: a door does not swing shut on a creature, a companion, a vendor or an item lying in the doorway. */
function _doorOccupied(d){return game.enemies.some(e=>e.x===d.x&&e.y===d.y)||game.loot.some(l=>l.x===d.x&&l.y===d.y)||!!(game.ally&&game.ally.x===d.x&&game.ally.y===d.y)||!!(game.vendor&&game.vendor.x===d.x&&game.vendor.y===d.y);}
/* MOB-17: auto-walk routes around known, unsprung traps (the tapped tile itself is allowed); if that leaves no route, the old path is used. */
function _knownTrapAt(x,y){return game.traps.some(t=>t.known&&!t.sprung&&t.x===x&&t.y===y);}
/* MOB-67: doorsOk lets auto-travel route through closed, unlocked doors (continueClickPath opens them on the way). */
function bfsPath(x0,y0,x1,y1,doorsOk){if(game.traps&&game.traps.some(t=>t.known&&!t.sprung)){const p=_bfsPath(x0,y0,x1,y1,true,doorsOk);if(p)return p;}return _bfsPath(x0,y0,x1,y1,false,doorsOk);}
function _bfsPath(x0,y0,x1,y1,avoid,doorsOk){
 if(x0===x1&&y0===y1)return [];
 const dist=[];for(let y=0;y<MAP_H;y++)dist.push(new Array(MAP_W).fill(-1));
 dist[y0][x0]=0;const q=[[x0,y0]];
 while(q.length){const[cx,cy]=q.shift();if(cx===x1&&cy===y1)break;
  for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=cx+dx,ny=cy+dy;
   if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H||dist[ny][nx]>=0)continue;
   if(game.floor.grid[ny][nx]===1)continue;
   const d=doorAt(nx,ny);if(d&&!d.open&&!(doorsOk&&!d.locked))continue;/* MOB-28: a companion may route through closed, unlocked doors */
   if(avoid&&!(nx===x1&&ny===y1)&&_knownTrapAt(nx,ny))continue;
   dist[ny][nx]=dist[cy][cx]+1;q.push([nx,ny]);}}
 if(dist[y1][x1]<0)return null;
 const path=[];let cx=x1,cy=y1;
 while(cx!==x0||cy!==y0){for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=cx+dx,ny=cy+dy;
  if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)continue;
  if(dist[ny][nx]===dist[cy][cx]-1){path.unshift([cx-nx,cy-ny]);cx=nx;cy=ny;break;}}}
 return path;}
/* MOB-01: shortest path to a floor tile orthogonally next to closed door d (null if none reachable). */
function pathToDoor(d){let best=null;for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=d.x+dx,ny=d.y+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H||game.floor.grid[ny][nx]===1)continue;const od=doorAt(nx,ny);if(od&&!od.open)continue;const p=bfsPath(game.px,game.py,nx,ny,true);if(p&&(!best||p.length<best.length))best=p;}return best;}
/* MOB-05: shortest path to an open tile next to wall (wx,wy), any of its 8 neighbors (null if none reachable). */
function pathToWall(wx,wy){let best=null;for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]]){const nx=wx+dx,ny=wy+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H||game.floor.grid[ny][nx]===1)continue;const od=doorAt(nx,ny);if(od&&!od.open)continue;const p=bfsPath(game.px,game.py,nx,ny,true);if(p&&p.length&&(!best||p.length<best.length))best=p;}return best;}
/* MOB-01: the walk ended without a halt next to the tapped door: offer the door menu. */
function _doorArrive(){const cd=game.clickDoor;game.clickDoor=null;if(!cd||mode!==State.PLAY||pendingConfirm||pendingMenu)return;const d=doorAt(cd.x,cd.y);if(!d||d.open)return;if(Math.abs(d.x-game.px)+Math.abs(d.y-game.py)!==1)return;openDoorMenu(d);}
function continueClickPath(){
 if(!game||!game.clickPath||!game.clickPath.length)return;
 if(mode!==State.PLAY||pendingConfirm||pendingMenu)return;
 if(ovInv||ovDad||ovBest||ovInstr||aiming||placing||shopOpen)return;
 const[dx,dy]=game.clickPath[0];
 const lastHp=game.hp;
 const badBefore=badStatusCount();
 const _inView=e=>!!(game.vis&&game.vis[e.y]&&game.vis[e.y][e.x]);const seenBefore=game.enemies.filter(_inView);
 const _ad=doorAt(game.px+dx,game.py+dy);/* MOB-67: a closed, unlocked door on the route is opened (1 turn, as by hand) and the walk goes on */
 if(_ad&&!_ad.open&&!_ad.locked&&Math.abs(dx)+Math.abs(dy)===1){if(napBlocked())return;doorOpen(_ad,"You open the door without breaking stride. Mostly. (1 turn)");}
 else{game.clickPath.shift();tryMove(dx,dy);}
 // M7: auto-travel also halts when an enemy that was not visible before this step comes into view.
 if(game&&game.clickPath&&game.clickPath.length&&mode===State.PLAY&&game.hp>=lastHp&&badStatusCount()<=badBefore&&game.enemies.some(e=>_inView(e)&&!seenBefore.includes(e))){log("Auto-travel halted. Something has entered the field of view. He stops, squints, and assumes a ready stance.","dim");game.clickPath=[];game.clickDoor=null;return;}
 // Auto-travel halts the moment anything goes wrong: HP loss OR any new negative status
 // (traps, thirst, the knee, the back, blindness — the universe's full catalogue of interruptions).
 if(game&&(game.hp<lastHp||badStatusCount()>badBefore)){if(game.clickPath.length)log("Auto-travel halted. Something went wrong, as it does. He proceeds on foot, alert and mildly betrayed.","dim");game.clickPath=[];game.clickDoor=null;}
 if(game&&game.clickDoor&&!game.clickPath.length&&mode===State.PLAY)_doorArrive();}
function badStatusCount(){if(!game||!game.statuses)return 0;let n=0;for(const id in game.statuses){if(game.statuses[id]&&STATUSES[id]&&STATUSES[id].bad)n++;}return n;}
/* ===== movement ===== */
function napBlocked(){if(hasStatus("backlock")){log("Your back has locked up. You cannot move. You wait for it to pass, as you always do.","dim");endTurn();return true;}if(hasStatus("nap")){log("You are one with the recliner. Cannot act.","dim");endTurn();return true;}if(hasStatus("coma")&&Math.random()<0.5){log("Free samples cloud your mind. Turn lost.","dim");endTurn();return true;}if(dtDadBlocked())return true;/* MOB-69 */return false;}
/* ===== inherent Dad-body pain: knee (on movement) + back (on bending to pick up) ===== */
function hasKneeRelief(){return eqList().some(g=>g&&g.kneeRelief);}
// Pain odds grow PER FLOOR ONLY. Deeper into the suburbs, the body deteriorates further.
// No per-step escalation, no reset on each twinge — the floor sets the toll. Meds (line ~162) can still buy relief for the current floor.
function painChanceForFloor(depth){return Math.min(0.95,0.05+0.012*((depth||1)-1));}
function updatePainChances(){const c=painChanceForFloor(game.depth);game.kneeChance=c;game.backChance=c;}
var KNEE_BUCKLE_GAP=20;
function kneePainTick(){
 if(hasKneeRelief())return; // Knee Sleeves spare the knees their cracks and their toll
 if(Math.random()<0.10){log("*knee crack* (Dad Noise)","dim");if(typeof sfxKneeCrack==="function")sfxKneeCrack();}
 // MOB-33: at most one buckle per KNEE_BUCKLE_GAP turns unless The Knee status is active. The roll is always made so seeded/Daily floors keep the same random sequence; _kneeLast is not saved (Continue resets it).
 if(Math.random()<(game.kneeChance||0.05)&&(hasStatus("knee")||!(game._kneeLast>=0)||game.turn-game._kneeLast>=KNEE_BUCKLE_GAP)){game._kneeLast=game.turn;game.hp=Math.max(0,game.hp-1);log("The knee buckles. -1 HP. It comes when it comes.","red");if(game.hp<=0){die("a knee that finally filed for early retirement, mid-step, on a floor that did nothing to deserve the blame","knee");return;}}}
function backPainTick(){
 if(Math.random()<(game.backChance||0.05)){game.hp=Math.max(0,game.hp-1);log("Your back goes out as you straighten up. -1 HP. Of course it's now.","red");if(game.hp<=0){die("a back that gave out while bending down to pick up something that, in hindsight, was not worth it","back");return;}
  if(Math.random()<0.10){applyStatus("backlock",3);log("It SEIZES. You are paralyzed for 3 turns. You do not call for help. A man does not.","red");}}}
function waitTurn(){if(mode!==State.PLAY||pendingConfirm)return;if(game.statuses.zap){dtDadBlocked();return;}/* MOB-69 */log("You wait. The dread accumulates.","dim");endTurn();}
// Pick up a specific loot-array entry by index. Split out of tryMove so a tile piled with
// multiple items can offer a choice menu instead of silently grabbing whatever is first in the array.
function pickupLootAt(idx){const l=game.loot[idx];if(!l)return;if(l.item.kind==="note"){game.loot.splice(idx,1);readFridgeNote(l.item);if(typeof sfxPickup==="function")sfxPickup();syncUI();return;}/* M16 */if(l.item.kind==="gold"){game.gold+=l.item.amount;game.moolahEarned=(game.moolahEarned||0)+l.item.amount;log("Picked up "+l.item.amount+" moolah.","gold");game.loot.splice(idx,1);syncUI();return;}openConfirm("Pick up "+itemNameSlot(l.item)+"?",()=>{if(addItem(l.item)){log("Picked up "+itemNameSlot(l.item)+".","grn");if(typeof sfxPickup==="function")sfxPickup();game.itemsFound=(game.itemsFound||0)+1;tryCompleteFetchQuest(l.item);game.loot.splice(idx,1);backPainTick();}syncUI();});}
function tryMove(dx,dy){if(mode!==State.PLAY||pendingConfirm)return;if(napBlocked())return;if(hasStatus("drunk")&&Math.random()<0.30){const rd=[[0,-1],[0,1],[-1,0],[1,0]][Math.floor(Math.random()*4)];dx=rd[0];dy=rd[1];log("Your feet navigate independently.","red");}clearScanMessages();const nx=game.px+dx,ny=game.py+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)return;if(game.floor.grid[ny][nx]===1)return;
 const d=doorAt(nx,ny);if(d&&!d.open){openDoorMenu(d);return;}
 if(game.vendor&&game.vendor.x===nx&&game.vendor.y===ny){/* MOB-53: ask first */openConfirm("Trade with your neighbor?",()=>{openShop();},{title:game.vendor.def.name,yes:"Yes",no:"No"});return;}
 const fn=game.fountains&&game.fountains.find(f=>f.x===nx&&f.y===ny);if(fn){/* MOB-25: ask before drinking; an empty fountain just says so */if(fn.charges>0)openConfirm("Drink from the water fountain? It has "+fn.charges+" sip"+(fn.charges===1?"":"s")+" left. It has waited years for someone to ask.",()=>{useFountain(fn);syncUI();},{yes:"Drink",no:"Not now"});else useFountain(fn);return;}
 const hf=game.healFountains&&game.healFountains.find(f=>f.x===nx&&f.y===ny);if(hf){useHealFountain(hf);return;}
 const e=game.enemies.find(e=>e.x===nx&&e.y===ny);if(e){if(e.isDog){dogEncounter(e);return;}if(attack(e))return;endTurn();return;}
 // Reach weapon: check enemies further in the pressed direction
 {const wr=weaponReach();if(wr>1){
  for(let r=2;r<=wr;r++){
   const rx=game.px+dx*r,ry=game.py+dy*r;
   if(rx<0||ry<0||rx>=MAP_W||ry>=MAP_H)break;
   if(game.floor.grid[ry][rx]===1)break;
   if(r>2){const mx=game.px+dx*(r-1),my=game.py+dy*(r-1);
    if(game.floor.grid[my][mx]===1)break;
    const md=doorAt(mx,my);if(md&&!md.open)break;
    if(game.enemies.some(z=>z.x===mx&&z.y===my))break;}
   const re=game.enemies.find(z=>z.x===rx&&z.y===ry);
   if(re){if(re.isDog){dogEncounter(re);return;}
    const wn=game.equip&&game.equip.weapon?game.equip.weapon.name:"Your weapon";
    log(wn+" strikes at range "+r+"!","gold");
    if(attack(re))return;endTurn();return;}
  }
 }}
 // Check for unrecruited ally
 if(game.ally&&!game.ally.following&&game.ally.x===nx&&game.ally.y===ny){allyEncounter();return;}
 if(hasStatus("frozensolid")){/* MOB-69 */game.clickPath=[];game.clickDoor=null;const _ft=game.statuses.frozensolid.turns;log("Dad is Frozen Solid ("+_ft+" turn"+(_ft===1?"":"s")+" left). The feet are a sculpture now. Swinging is still allowed.","blu");endTurn();return;}
 if(hasStatus("rooted")){/* MOB-70: Frozen (Update Installing) holds Dad in place; attacks above still work */game.clickPath=[];game.clickDoor=null;const _rt=game.statuses.rooted.turns;log("Dad is Frozen. The update is still installing"+(_rt>0?" ("+_rt+" turn"+(_rt===1?"":"s")+" left)":"")+". The feet do not respond. There is no skip button. There is never a skip button.","dim");endTurn();return;}
 if(tryFumble("your footing"))return;
 game.px=nx;game.py=ny;kneePainTick();if(game.hp<=0)return;
 if(game.floor.grid[ny][nx]===2){applyStatus("soaked",3);log("You wade into the water. Socks: ruined.","blu");}
 const lMatches=[];for(let _i=0;_i<game.loot.length;_i++)if(game.loot[_i].x===nx&&game.loot[_i].y===ny)lMatches.push(_i);
 if(lMatches.length>1){openMenu("Several things are piled here. Grab which one?",lMatches.map(_i=>({label:itemNameSlot(game.loot[_i].item)+(game.loot[_i].item.kind==="gold"?" ("+game.loot[_i].item.amount+"g)":""),fn:function(){pickupLootAt(_i);}})));}
 else if(lMatches.length===1)pickupLootAt(lMatches[0]);
 // Traps ALWAYS trigger when stepped on — visible or not — unless the Light Step talent spares you.
 const ti=game.traps.findIndex(t=>t.x===nx&&t.y===ny&&!t.sprung);if(ti>=0){const t=game.traps[ti];if(game.lightStep)log("You step clean over the "+t.def.name+" without breaking stride. Light Step earns its keep.","dim");else springTrap(t);}
 const _stairsAsk=()=>{if(nx===game.stairs.x&&ny===game.stairs.y){const _bb=bossBarsStairs();/* MOB-50 */if(_bb)log("The stairs down will not budge while "+_bb.def.name+" still stands. Some doors only open after a hard conversation.","red");else openConfirm("Descend to Floor "+(game.depth+1)+"?",doDescend);}if(game.stairsUp&&nx===game.stairsUp.x&&ny===game.stairsUp.y)openConfirm(game.ascent&&game.depth===1?"Push open the basement door and carry the Remote home?":"Ascend to Floor "+(game.depth-1)+"?",doAscend);};
 /* MOB-56: something lying on the stairs is offered first; the stairs question follows once that is answered (ui.js _m56Then) */
 if(onStairs(nx,ny)&&(pendingConfirm||pendingMenu))(pendingConfirm||pendingMenu).then=_stairsAsk;else _stairsAsk();
 computeVis();studfindCheck();endTurn();}
/* ===== studfinder passive detection ===== */
function studfindCheck(){
 if(!game||!game.equip)return;
 const hasSF=SLOTS.some(s=>{const g=game.equip[s];return g&&(g.id==="studfinder_charm"||g.id==="studfinder");});
 if(!hasSF)return;
 const R=7;let found=false;
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){
  if(dx*dx+dy*dy>R*R)continue;
  const x=game.px+dx,y=game.py+dy;if(x<0||y<0||x>=MAP_W||y>=MAP_H)continue;
  const t=game.traps.find(t=>t.x===x&&t.y===y&&!t.sprung&&!t.known);if(t){found=true;break;}
  if(game.secrets&&game.secrets.some(s=>s.x===x&&s.y===y)){found=true;break;}}
 if(found&&game.turn-(game.sfLastTurn||-20)>=8){game.sfLastTurn=game.turn;log("The Studfinder of Prophecy hums. Something concealed is nearby — structural or otherwise.","gold");}}
function closeDoor(d){d.open=false;log("You push the door shut. It creaks with quiet indignation. (1 turn)","dim");computeVis();endTurn();}
function endTurn(){returnTick();/* MOB-40 */huntQuestSweep();/* MOB-58 */keyHolderSweep();/* MOB-22 */game.turn++;tickStatuses();survivalTick();if(mode===State.PLAY)enemyTurn();if(mode===State.PLAY)allyTurn();if(mode===State.PLAY){let doorsChanged=false;for(const d of game.doors){if(d.open){const onDoor=(game.px===d.x&&game.py===d.y)||(game.ally&&game.ally.following&&game.ally.x===d.x&&game.ally.y===d.y);if(onDoor){d.playerWasOn=true;}else if(_doorOccupied(d)){/* MOB-02: something is standing (or lying) in the doorway; the door waits */}else{const turnsSinceOpen=game.turn-(d.openTurn||game.turn);if(d.playerWasOn||turnsSinceOpen>=3){d.open=false;d.playerWasOn=false;doorsChanged=true;}}}}if(doorsChanged)computeVis();}if(mode===State.PLAY)keyHolderSweep();/* MOB-22: a holder felled by the companion, a trap or the dog drops the key the same turn */if(mode===State.PLAY)hoaFinaleTick();if(mode===State.PLAY)saveRun();if(mode===State.PLAY&&game.clickPath&&game.clickPath.length)setTimeout(continueClickPath,120);if(mode===State.PLAY)offerTalentIfReady();if(mode===State.PLAY&&comedyTick())saveRun();/* MOB-30 */syncUI();}
/* ===== throwing (+ trap disarm, persistent landing) ===== */
/* MOB-11: STR sets how far Dad can throw (2 + STR/2 tiles), capped by the item's own range (default 8).
   throwLine(): the tiles a throw passes over toward a target tile (or a straight direction), cut at that range;
   over=true when the chosen tile is beyond it. Geometry only: walls, doors and enemies stop the throw in doThrow / the aim preview. */
var THROW_OVERREACH=["Your arm files a formal objection. The {item} lands {n} tiles away, which is where it was always going to land.","You throw like it is still senior year. Your shoulder reminds you it is not. The {item} drops after {n} tiles.","Somewhere, your old gym teacher sighs. The {item} makes it {n} tiles.","You put your whole back into it. Your back would like that noted. {n} tiles, and not one more.","The {item} travels {n} tiles, then gives up, much like that gym membership.","Ambition: the far wall. Reality: {n} tiles. The gap between them is called middle age.","You wind up like a pro. The {item} lands like a dad. {n} tiles.","A noise escapes you that is not quite a grunt. The {item} covers {n} tiles. Respectable. Technically."];
function throwArm(){return 2+Math.floor(Math.max(0,game.str||0)/2);}
function throwRange(it){const ir=(it&&it.throw&&it.throw.range)||8;return Math.max(1,Math.min(ir,throwArm()));}
function throwLine(it,dx,dy,tx,ty){const rg=throwRange(it);let ddx=dx*rg,ddy=dy*rg;if(tx!==undefined&&ty!==undefined&&tx!==null&&ty!==null&&(tx!==game.px||ty!==game.py)){ddx=tx-game.px;ddy=ty-game.py;}
 const n=Math.max(Math.abs(ddx),Math.abs(ddy));if(n===0)return {cells:[],over:false,range:rg};const steps=Math.min(n,rg),cells=[];
 for(let i=1;i<=steps;i++)cells.push({x:game.px+Math.round(ddx*i/n),y:game.py+Math.round(ddy*i/n)});return {cells:cells,over:n>rg,range:rg};}
function startThrow(e){if(!e.it.throw){log(e.it.name+" isn't meant for throwing.","dim");return;}throwRef=e;aiming=true;closeOverlays();log("Throw "+e.it.name+" — up to "+throwRange(e.it)+" tiles. Pick a target.","blu");}
function doThrow(dx,dy,tx,ty){aiming=false;const it=throwRef.it;const _tl=throwLine(it,dx,dy,tx,ty);let x=game.px,y=game.py;const path=[];let hitE=null,hitT=null;
 for(const _c of _tl.cells){x=_c.x;y=_c.y;if(x<0||y<0||x>=MAP_W||y>=MAP_H||game.floor.grid[y][x]===1)break;const dr=doorAt(x,y);if(dr&&!dr.open)break;path.push({x,y});const en=game.enemies.find(e=>e.x===x&&e.y===y);if(en){hitE=en;break;}const tr=game.traps.find(t=>t.x===x&&t.y===y&&!t.sprung);if(tr){hitT=tr;break;}}
 addFX({kind:"proj",cells:path.slice(),i:0,life:path.length*2+2,spr:lootSprite(it)});
 let landed=null;
 if(hitE){const _hits=it.throw.hits||1;const dmg=(it.throw.dmg||3)*_hits;hitE.hp-=dmg;hitE.shownHP=true;discover(hitE.def,game.depth);log("You hurl "+itemDisplayName(it)+" at "+hitE.def.name+". "+(_hits>1?("It hits "+_hits+" times. "+dmg+" dmg total!"):(dmg+" dmg!")),"gold");if(it.throw.status){applyTo(hitE,it.throw.status);}if(it.throw.keep&&!it.throw.returns)landed={x:hitE.x,y:hitE.y};/* MOB-40 */if(hitE.hp<=0){game.kills=(game.kills||0)+1;const _g=hitE.def.gold||0;game.gold+=_g;game.moolahEarned=(game.moolahEarned||0)+_g;log(hitE.def.name+" defeated by airborne object. +"+hitE.def.xp+" XP"+(_g>0?", +"+_g+" moolah":""),"gold");gainXP(hitE.def.xp);game.enemies=game.enemies.filter(z=>z!==hitE);}}
 else if(hitT){const chance=0.55+effPer()*0.04;if(Math.random()<chance){hitT.sprung=true;log("Direct hit! You disarm the "+hitT.def.name+" from a safe distance.","gold");if(Math.random()<0.5){log(it.name+" is destroyed in the process.","dim");}else landed={x:hitT.x,y:hitT.y};}else{log("You miss the "+hitT.def.name+". It's still armed.","red");landed={x:hitT.x,y:hitT.y};}}
 else if(_tl.over&&path.length===_tl.cells.length&&path.length){log(THROW_OVERREACH[Math.floor(Math.random()*THROW_OVERREACH.length)].replace("{item}",itemDisplayName(it)).replace("{n}",String(path.length)),"blu");landed=path[path.length-1];}
 else{log("You throw "+itemDisplayName(it)+". It clatters to the floor.","dim");if(path.length)landed=path[path.length-1];}
 if(it.throw.returns){if(!game.returning)game.returning=[];game.returning.push({it:it,t:it.throw.returns});log("The "+it.name+" is on its way. It will be back in "+it.throw.returns+" turns. It always comes back.","blu");landed=null;}/* MOB-40 T1-03 */
 if(landed)game.loot.push({x:landed.x,y:landed.y,item:it});
 removeEntry(throwRef,1);throwRef=null;endTurn();}
function applyTo(e,st){if(st==="soaked"){if(!dtApplyUnit(e,"soaked"))return;/* MOB-69: immune creatures stay dry */e.blind=Math.max(e.blind,1);log(e.def.name+" is soaked and sputtering.","blu");}else if(st==="root"){e.root=Math.max(e.root||0,2);log(e.def.name+" is tangled up and cannot move.","blu");}else if(DMG_TYPES[st])dtApplyUnit(e,st);else e[st]=(e[st]||0)+2;}
/* ===== MOB-69 Run A: damage types (burning, shocked, chilled, bleeding, soaked, psychic) =====
   Creatures and the companion keep flat counters on themselves (dBurn, dBleed/dBleedN, dChill/dChillN/dChillAlt, dDoubt,
   dWet; companion also dZap, dFrozen); creature Shocked = stun and Frozen Solid = root (existing counters). Creatures are
   rebuilt from the seed or the floor cache, so they need no save change; Dad's effects live in game.statuses; the
   companion's counters are optional fields in the ally entry of the run save (old sda_save_v4 saves load with none). */
var DT_PROC_WEAPON=0.25,DT_PROC_POWERED=0.30,DT_PROC_CREATURE=0.20,DT_DOUBT_CHANCE=0.25;
var DT_SHAKE_LINES=["You walked it off. The kids saw. They will tell people.","It wore off. You never once asked for directions to the first-aid kit. Growth, of a kind.","Shaken off. Somewhere, a framed photo of you on a fridge looks a little prouder."];
function dtWeaponType(){const w=game.equip&&game.equip.weapon;return w&&typeof WEAPON_DTYPE!=="undefined"?(WEAPON_DTYPE[w.id]||null):null;}
function dtWeaponProc(){const w=game.equip&&game.equip.weapon;if(!w)return 0;const t=WEAPONS.find(x=>x.id===w.id);return t&&t.powered?DT_PROC_POWERED:DT_PROC_WEAPON;}
function dtCreatureType(e){return e&&e.def&&typeof CREATURE_DTYPE!=="undefined"?(CREATURE_DTYPE[e.def.id]||null):null;}
function dtResistCount(type){if(typeof ARMOR_RESIST==="undefined")return 0;let n=0;for(const it of eqList())if(it&&it.kind==="armor"&&ARMOR_RESIST[it.id]&&ARMOR_RESIST[it.id].indexOf(type)>=0)n++;return n;}
function dtSeen(u){return !!(game.vis&&game.vis[u.y]&&game.vis[u.y][u.x]);}
function dtHalf(n){return Math.max(1,Math.floor(n/2));}
/* Dad takes a damage type. src = what did it (for the log). Returns true if it landed. */
function dtApplyDad(type,src){const T=DMG_TYPES[type];if(!T)return false;const rc=dtResistCount(type);
 if(type==="soaked"){if(game.statuses.soaked||!applyStatus("soaked",T.turns))return false;log("You are Soaked. "+(src?"Courtesy of "+src+". ":"")+"Dignity: damp.","blu");return true;}
 if(rc>=2){log("Your gear shrugs off the "+T.name.toLowerCase()+". Two pieces of "+T.name+" protection: the one time over-preparing paid off.","dim");return false;}
 const half=rc===1;
 if(type==="burn"){if(hasStatus("soaked")){log("Something tries to set you on fire. You are too damp to commit. Soaked has its uses.","blu");return false;}
  const tr=half?dtHalf(T.turns):T.turns,dm=Math.max(0,T.dmg-(half?1:0));if(game.statuses.chill||game.statuses.frozensolid){delete game.statuses.chill;delete game.statuses.frozensolid;log("The fire thaws you out. Technically a win.","dim");}
  game.statuses.burn={turns:tr,dmg:dm,len:tr};log("You are On Fire, Technically. "+(src?src+" saw to it. ":"")+tr+" turn"+(tr===1?"":"s")+". The apron people were right."+(half?" (Your gear takes the edge off.)":""),"red");return true;}
 if(type==="zap"){const wet=hasStatus("soaked");let n=wet?2:1;if(half)n=dtHalf(n);const cur=game.statuses.zap;game.statuses.zap={turns:9999,skip:Math.max(n,cur?cur.skip||0:0),len:n};
  if(wet){const ex=half?1:2;if(!hasStatus("invincible")){game.hp-=ex;}log("STATIC DISCHARGE. You were Soaked, which electricity regards as an invitation. -"+ex+" HP, and you lose "+n+" turn"+(n===1?"":"s")+".","red");}
  else log("STATIC DISCHARGE. "+(src?src+" ":"Something ")+"has given you a jolt. Your next turn is spent recalibrating.","red");
  if(game.hp<=0)die((src||"a static shock")+", which he is still describing as 'barely a tingle'","status");return true;}
 if(type==="chill"){if(game.statuses.burn){delete game.statuses.burn;log("A cold front meets the fire. They cancel out. You are, for once, room temperature.","dim");return false;}
  const cur=game.statuses.chill,cnt=(cur?cur.n||1:0)+1;if(cnt>=3){delete game.statuses.chill;game.statuses.frozensolid={turns:2,len:2};game.clickPath=[];log("FROZEN SOLID. Third chill in a row. Your feet are now a regional landmark. 2 turns. You can still swing.","blu");return true;}
  const tr=half?dtHalf(T.turns):T.turns;game.statuses.chill={turns:tr,n:cnt,alt:false,len:tr};log("You get the Cold Shoulder. "+(src?src+" did that. ":"")+"You act every other turn for "+tr+" turn"+(tr===1?"":"s")+"."+(cnt===2?" One more and you freeze solid.":""),"blu");return true;}
 if(type==="bleed"){const cur=game.statuses.bleed,n=Math.min(T.max,(cur?cur.n||1:0)+1),tr=half?dtHalf(T.turns):T.turns;game.statuses.bleed={turns:tr,n:n,red:half?1:0,len:tr};log("Paper Cut, Spiritually"+(n>1?" x"+n:"")+". "+(src?src+" opened a small, administrative wound. ":"")+"Any healing item will stop it.","red");return true;}
 if(type==="psychic"){let tr=T.turns-Math.max(0,effWis()-3);if(half)tr=Math.floor(tr/2);if(tr<=0){log((src||"Something")+" sends a pointed reminder. You read it, decide it can wait, and close the tab. Wisdom wins.","dim");return false;}
  game.statuses.doubt={turns:tr,len:tr};log("PER MY PREVIOUS EMAIL. "+(src?src+" has gotten into your head. ":"")+"For "+tr+" turn"+(tr===1?"":"s")+" you may stop to second-guess yourself. A Dadism would clear it.","red");return true;}
 return false;}
/* A creature (or the companion, opt.ally) takes a damage type. */
function dtApplyUnit(u,type,opt){opt=opt||{};const T=DMG_TYPES[type];const D=opt.def||u.def;if(!T||!u||!D)return false;const id=D.id,nm=D.name,seen=opt.ally||dtSeen(u);
 const L=(t,c)=>{if(seen&&!opt.quiet)log(t,c||"gold");};
 if(!opt.ally&&typeof CREATURE_IMMUNE!=="undefined"&&CREATURE_IMMUNE[id]&&CREATURE_IMMUNE[id].indexOf(type)>=0){L(nm+" is unbothered by "+T.name.toLowerCase()+". It has seen worse.","dim");return false;}
 let mult=(!opt.ally&&typeof CREATURE_WEAK!=="undefined"&&CREATURE_WEAK[id]&&CREATURE_WEAK[id].indexOf(type)>=0)?2:1;
 const dur=n=>{let d=n*mult;if(u.isBoss)d=dtHalf(d);return d;};
 if(mult>1)L(nm+" is especially vulnerable to "+T.name.toLowerCase()+". Double the trouble.","gold");
 if(type==="soaked"){u.dWet=Math.max(u.dWet||0,dur(T.turns));if(u.dBurn>0){u.dBurn=0;L(nm+" is no longer on fire. The water has filed its report.","dim");}if(!opt.quiet&&opt.ally)L(nm+" is soaked.","blu");return true;}
 if(type==="burn"){if(u.dWet>0){L(nm+" is too wet to catch fire.","dim");return false;}u.dBurn=dur(T.turns);u.dChill=0;u.dChillN=0;L(nm+" is On Fire, Technically.","gold");return true;}
 if(type==="zap"){const wet=u.dWet>0,n=dur(wet?2:1);if(opt.ally)u.dZap=Math.max(u.dZap||0,n);else u.stun=Math.max(u.stun||0,n);if(wet){u.hp-=2;u.shownHP=true;L(nm+" was Soaked. Electricity noticed. +2 damage and "+n+" lost turn"+(n===1?"":"s")+".","gold");}else L(nm+" gets a Static Discharge and loses "+(n===1?"a turn":n+" turns")+".","gold");if(u.hp<=0&&!opt.ally)dtKill(u,"static");return true;}
 if(type==="chill"){if(u.dBurn>0){u.dBurn=0;L("The cold puts out "+nm+". Nobody wins.","dim");return false;}u.dChillN=(u.dChillN||0)+1;if(u.dChillN>=3){u.dChill=0;u.dChillN=0;const f=dur(2);if(opt.ally)u.dFrozen=Math.max(u.dFrozen||0,f);else u.root=Math.max(u.root||0,f);L(nm+" is FROZEN SOLID. It can still swing, but it is going nowhere.","blu");return true;}u.dChill=dur(T.turns);L(nm+" gets the Cold Shoulder and slows down.","blu");return true;}
 if(type==="bleed"){u.dBleedN=Math.min(T.max,(u.dBleedN||0)+1);u.dBleed=dur(T.turns);L(nm+" has a Paper Cut, Spiritually"+(u.dBleedN>1?" x"+u.dBleedN:"")+".","gold");return true;}
 if(type==="psychic"){u.dDoubt=dur(T.turns);L(nm+" starts second-guessing itself.","gold");return true;}
 return false;}
/* A creature finished off by a damage-type effect: same rewards as a trap kill. */
function dtKill(e,how){if(!game.enemies.includes(e))return;game.kills=(game.kills||0)+1;const _g=e.def.gold||0;game.gold+=_g;game.moolahEarned=(game.moolahEarned||0)+_g;if(dtSeen(e))log(e.def.name+" is finished off by "+(how==="burn"?"the fire":how==="bleed"?"a thousand small cuts":how==="static"?"the static":"its own lingering problems")+". +"+e.def.xp+" XP"+(_g>0?", +"+_g+" moolah":""),"gold");gainXP(e.def.xp);tryCompleteHuntQuest(e);game.enemies=game.enemies.filter(x=>x!==e);if(e.isBoss)log("The way down is clear.","gold");}
/* Start of a creature's / the companion's turn: per-turn damage, then whether it loses the turn. Returns "dead", "skip" or null. */
function dtTickUnit(u,ally,D){D=D||u.def;const nm=D?D.name:"It",seen=ally||dtSeen(u);let hurt=0,how=null;
 if(u.dWet>0)u.dWet--;
 if(u.dBurn>0){u.dBurn--;hurt+=DMG_TYPES.burn.dmg;how="burn";}
 if(u.dBleed>0){u.dBleed--;hurt+=DMG_TYPES.bleed.dmg*(u.dBleedN||1);how=how||"bleed";if(u.dBleed<=0)u.dBleedN=0;}
 if(hurt>0){u.hp-=hurt;u.shownHP=true;if(seen)log(nm+(how==="burn"?" burns":" bleeds a little")+" for "+hurt+".","dim");if(u.hp<=0){if(!ally)dtKill(u,how);return "dead";}}
 if(ally&&u.dZap>0){u.dZap--;if(seen)log(nm+" is still recalibrating after the shock.","dim");return "skip";}
 if(u.dChill>0){u.dChill--;u.dChillAlt=!u.dChillAlt;if(u.dChill<=0)u.dChillN=0;if(u.dChillAlt){if(seen)log(nm+" is too cold to do much this turn.","dim");return "skip";}}
 if(u.dDoubt>0){u.dDoubt--;if(Math.random()<DT_DOUBT_CHANCE){if(seen)log(nm+" stops to reconsider everything. Turn lost.","dim");return "skip";}}
 return null;}
/* Dad's turn-losing effects (called from napBlocked). */
function dtDadBlocked(){const z=game.statuses.zap;if(z){z.skip=(z.skip||1)-1;if(z.skip<=0)delete game.statuses.zap;log("Static Discharge: you spend this turn recalibrating. Hair: permanently opinionated.","dim");endTurn();return true;}
 const c=game.statuses.chill;if(c){c.alt=!c.alt;if(c.alt){log("Cold Shoulder: your joints decline this turn. They will reconsider next turn.","blu");endTurn();return true;}}
 if(hasStatus("doubt")&&Math.random()<DT_DOUBT_CHANCE){log("Per My Previous Email: you stop to reread something you said in 2019. Turn lost.","dim");endTurn();return true;}
 return false;}
function dtShakeOff(id,s){if(!s||(s.len||0)<3||["burn","chill","bleed","doubt","frozensolid"].indexOf(id)<0)return;if(game._dtCheer===game.depth)return;game._dtCheer=game.depth;log(DT_SHAKE_LINES[Math.floor(Math.random()*DT_SHAKE_LINES.length)],"grn");}
/* ===== crafting ===== */
/* combine-reference helpers — a combinable thing is either an inventory entry
   ({src:"inv",e}) or a worn item in an equipment slot ({src:"equip",slot}). */
function refItem(r){return !r?null:(r.src==="equip"?game.equip[r.slot]:(r.e?r.e.it:null));}
function refConsume(r){if(r.src==="equip"){const it=game.equip[r.slot];game.equip[r.slot]=null;return it;}removeEntry(r.e,1);return r.e?r.e.it:null;}
function sameRef(a,b){if(!a||!b)return false;if(a.src!==b.src)return false;return a.src==="equip"?a.slot===b.slot:a.e===b.e;}
/* MOB-57 (2026-11-15): a craft never loses its result. If a worn ingredient freed the slot the result fits, it goes straight on
   (so crafted Cargo Shorts keep their pockets); otherwise it goes in the bag, and if the bag is full it lands at Dad's feet. */
function _craftSlotFor(it){if(!it)return null;if(it.kind==="weapon")return["weapon"];if(it.kind==="armor")return it.slot?[it.slot]:null;if(it.kind==="charm")return["charm1","charm2"];return null;}
function _craftWear(it,freed){const sl=_craftSlotFor(it);if(!sl||!freed||!freed.length)return false;const s=sl.find(k=>freed.includes(k)&&!game.equip[k]);if(!s)return false;
 if(it.kind==="charm"){game.equip[s]=it;it.idd=true;}else equip(it,true);if(game.equip[s]!==it)return false;
 log("You put the "+it.name+" straight on, before anyone can ask what it is.","grn");return true;}
function _craftKeep(it){if(addItem(it))return true;let dx=game.px,dy=game.py;if(onStairs(dx,dy)){for(const[ox,oy]of[[0,1],[1,0],[0,-1],[-1,0]]){const nx=dx+ox,ny=dy+oy;if(nx>=0&&ny>=0&&nx<MAP_W&&ny<MAP_H&&game.floor.grid[ny][nx]===0&&!onStairs(nx,ny)){dx=nx;dy=ny;break;}}}
 game.loot.push({x:dx,y:dy,item:it});log("No room in the bag, so the "+it.name+" goes on the floor at your feet. It is fine. Floors are a kind of shelf.","gold");return false;}
/* MOB-90 (2026-11-23): three attempts in a row to combine items that do not combine (no other action between them) always
   blow up: 10% of max HP (at least 1), never below 1 HP. Transient (not saved). Any other tryCraft outcome resets the count;
   any action that spends a turn (game.turn changes) does too. */
var _m90Duds=0,_m90Turn=-1,_m90G=null;
function _m90Blowup(){const dmg=Math.max(1,Math.round((game.maxhp||1)*0.10));const real=Math.min(dmg,Math.max(0,game.hp-1));game.hp-=real;
 if(typeof sfxOof==="function")sfxOof();if(game.fx)game.fx.push({kind:"blast",cells:[{x:game.px,y:game.py}],t:0,life:10,color:"#ff9a3c"});
 log("Well, the third time was not the charm.","red");log("The pile goes off with a sound usually reserved for garage projects. -"+real+" HP.","red");_m90Duds=0;}
function tryCraft(refA,refB){
 const _m90Prev=(_m90G===game&&_m90Turn===game.turn)?_m90Duds:0;_m90Duds=0;
 if(refA&&refA.it&&!refA.src)refA={src:"inv",e:refA};/* back-compat: raw inv entry */
 if(refB&&refB.it&&!refB.src)refB={src:"inv",e:refB};
 const itA=refItem(refA),itB=refItem(refB);
 if(!itA||!itB){log("There is nothing there to combine.","dim");return;}
 // Sticky Note of Identification: combine it onto WHICHEVER item you choose to identify that one.
 {const noteRef=(itA&&itA.identifySingle)?refA:((itB&&itB.identifySingle)?refB:null);
  const tgtRef=noteRef?(noteRef===refA?refB:refA):null;
  if(noteRef&&tgtRef){const tgt=refItem(tgtRef);
   if(!tgt){log("There is nothing there to identify.","dim");return;}
   if(tgt.identifySingle){log("Two sticky notes. They identify each other. Nothing is learned.","dim");return;}
   if(tgt.kind==="consumable"){if(consKnown(tgt)){log("That one's no mystery. The Sticky Note stays unused.","dim");return;}const alias=consAlias(tgt.id);revealConsumable(tgt.id);log("You stick the note to the "+alias+". It is, the label now confirms, "+tgt.name+".","gold");}
   else if(["weapon","armor","charm"].includes(tgt.kind)){if(tgt.idd){log("Already identified. The note has nothing to reveal.","dim");return;}tgt.idd=true;log("You stick the note to: "+tgt.name+". Revealed: "+((tgt.affixes||[]).length?tgt.affixes.map(a=>a.name).join(", "):"completely unmodified. Anticlimactic.")+".","gold");}
   else{log("The Sticky Note only identifies gear and consumables.","dim");return;}
   refConsume(noteRef);combineMark=null;if(typeof ovInv!=="undefined"&&ovInv)buildInv();syncUI();endTurn();return;}}
 if((refA.src==="equip"&&isCursed(itA))||(refB.src==="equip"&&isCursed(itB))){log("You cannot pry a cursed item off to combine it. The curse has opinions. (Remove the curse first.)","red");return;}
 const a=craftId(itA),b=craftId(itB);const rec=RECIPES.find(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a));
 if(!rec){/* MOB-40 S3: pairs that make nothing are remembered (never shown); a repeat attempt gets teased. No items are used. */const _pk=[a,b].sort().join("+");if(!game.triedPairs)game.triedPairs=[];
  _m90Duds=_m90Prev+1;_m90Turn=game.turn;_m90G=game;/* MOB-90 */
  if(_m90Duds>=3){if(!game.triedPairs.includes(_pk))game.triedPairs.push(_pk);_m90Blowup();combineMark=null;syncUI();return;}
  if(game.triedPairs.includes(_pk))log(CRAFT_TEASE[Math.floor(Math.random()*CRAFT_TEASE.length)],"dim");else{game.triedPairs.push(_pk);log("Those two do not combine. He tried. The garage saw.","dim");}
  combineMark=null;return;}
 if(rec.tier===2&&!craftKnown(rec)){log("You have not seen the video. You are not doing this without the video.","dim");combineMark=null;return;}/* MOB-40 S1 */if(rec.lock&&game.cls.id!==rec.lock){log("Only "+CLASSES.find(c=>c.id===rec.lock).name+" can make that.","red");return;}if(rec.classes&&!rec.classes.includes(game.cls.id)){log("Only the handy sorts (DIY, Tactical, Tech) can rig that.","red");return;}let base=0.7;if(rec.bonus&&game.cls.id===rec.bonus)base=0.95;if(game.cls.craft!=="none"&&!rec.lock)base+=0.05;const wasEquipped=(refA.src==="equip"||refB.src==="equip");const _freed=[refA,refB].filter(r=>r.src==="equip").map(r=>r.slot);/* MOB-57 */refConsume(refA);refConsume(refB);if(wasEquipped)log("You strip a worn piece off to feed it into the project. Bold.","dim");if(Math.random()>base){log("The craft fails. A Learning Experience.","red");_craftKeep(mkObject("ducttape"));craftLearn(rec);/* MOB-40: the failure still teaches the recipe */combineMark=null;return;}const o=rec.out;let made;if(["weapon","armor","charm"].includes(o.kind))made=mkGear(o,o.kind,Math.random,true);else if(o.kind==="consumable")made=Object.assign({kind:"consumable"},o);else made=Object.assign({kind:"object"},o);made.crafted=true;/* MOB-40 F2 */if(!_craftWear(made,_freed))_craftKeep(made);if(typeof sfxCraft==="function")sfxCraft();log("CRAFTED: "+o.name+"!","gold");
 // Crafting a previously-undiscovered recipe records it in the Compendium.
 craftLearn(rec);
 combineMark=null;}
/* ===== MOB-40 (2026-11-17): expanded crafting helpers ===== */
/* Recipe id of an item: crafted results carry their own ids; saves from before MOB-40 hold a Reinforced Plunger / Taped-Up Rake under the base id. */
function craftId(it){if(!it)return null;if(it.id==="plunger"&&/Reinforced Plunger/.test(it.name||""))return "plunger_reinforced";if(it.id==="rake"&&/Taped-Up Rake/.test(it.name||""))return "rake_taped";return it.id;}
function craftKnown(rec){return (game.knownRecipes||[]).includes(rec.a+"+"+rec.b);}
function craftLearn(rec){const _rk=rec.a+"+"+rec.b;if(!game.knownRecipes)game.knownRecipes=[];if(!game.knownRecipes.includes(_rk)){game.knownRecipes.push(_rk);log("Recipe learned — now recorded in the "+kbTxt("Compendium [J].","Codex (MORE, then CODEX)."),"blu");}}
function craftTags(it){const id=craftId(it),t=[];for(const k in CRAFT_TAGS)if(CRAFT_TAGS[k].includes(id))t.push(k);if(it.kind==="armor"&&it.slot)t.push("GARMENT:"+it.slot);if(it.kind==="charm")t.push("POCKET");return t;}
function _craftTagsById(id){for(const L of[ARMORS,CHARMS]){const f=L.find(x=>x.id===id);if(f)return craftTags(Object.assign({kind:L===ARMORS?"armor":"charm"},f));}const r=RECIPES.find(x=>x.out&&x.out.id===id);if(r&&(r.out.kind==="armor"||r.out.kind==="charm"))return craftTags(r.out);return craftTags({id});}
/* Tag pairs that some recipe usable right now joins (tier 2 only once its video is known). */
function craftTagPairs(){const P=new Set();for(const r of RECIPES){if(r.tier===2&&!craftKnown(r))continue;const ta=_craftTagsById(r.a),tb=_craftTagsById(r.b);for(const x of ta)for(const y of tb){P.add(x+"|"+y);P.add(y+"|"+x);}}return P;}
/* MOB-40 S2: two items "might combine" when their tags pair up like a usable recipe's do; a tier 2 pair stays hidden until its video. */
function craftPairOK(itA,itB,P){if(!itA||!itB||itA===itB)return false;const a=craftId(itA),b=craftId(itB);const r=RECIPES.find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));if(r&&r.tier===2&&!craftKnown(r))return false;if(r)return true;P=P||craftTagPairs();const ta=craftTags(itA),tb=craftTags(itB);for(const x of ta)for(const y of tb)if(P.has(x+"|"+y))return true;return false;}
/* Carried or worn items that might combine with it (names, for the BAG hint and the MOB-41 picker). */
function craftPartners(it){const P=craftTagPairs(),out=[];for(const e of game.inv){if(e.it!==it&&craftPairOK(it,e.it,P))out.push(e.it);}for(const k in game.equip){const g=game.equip[k];if(g&&g!==it&&craftPairOK(it,g,P))out.push(g);}return out;}
function craftName(id){for(const L of[WEAPONS,ARMORS,CHARMS,CONSUMABLES,OBJECTS]){const f=L.find(x=>x.id===id);if(f)return f.name;}const r=RECIPES.find(x=>x.out&&x.out.id===id);return r?r.out.name:id;}
/* MOB-40 T1-03: thrown items that come back on their own. */
function returnTick(){if(!game.returning||!game.returning.length)return;const keep=[];for(const r of game.returning){r.t--;if(r.t>0){keep.push(r);continue;}if(addItem(r.it))log("The "+r.it.name+" comes back. Return address included. It is in your bag.","gold");else{game.loot.push({x:game.px,y:game.py,item:r.it});log("The "+r.it.name+" comes back and lands at your feet. The bag is full. It does not judge.","gold");}}game.returning=keep;}
/* MOB-40 T2-12: worn gear with blindOnHit (percent) can blind a creature that hits Dad, for 3 turns. */
function blindOnHitCheck(e){for(const g of eqList()){if(g&&g.blindOnHit&&Math.random()*100<g.blindOnHit&&e.hp>0){e.blind=Math.max(e.blind||0,3);log("The "+g.name+" catches the light. "+e.def.name+" is blinded.","gold");return;}}}
/* ===== dadisms ===== */
function adjEnemies(){return game.enemies.filter(e=>Math.abs(e.x-game.px)+Math.abs(e.y-game.py)===1);}
/* MOB-44 (2026-11-13): on compact (phone) layouts in-game text names buttons, never keys. kbTxt(desktop,phone). */
function kbTxt(d,p){return (typeof COMPACT!=="undefined"&&COMPACT)?p:d;}
function weaponReach(){return(game.equip&&game.equip.weapon&&game.equip.weapon.reach)||1;}
/* MOB-08 (2026-11-16, reach rule A): a reach weapon strikes any visible enemy within its reach in any direction
   (Chebyshev distance, so diagonals count like the straight lines), when the straight line to it is clear: walls,
   closed doors, the vendor, fountains and other enemies in between block. Used by the phone target box (ui.js
   tgtTargets/tgtAttack) and by desktop click attacks (input.js canvasTap). Pressing a direction keeps its old rule. */
function reachLineClear(tx,ty){const x0=game.px,y0=game.py,ax=tx-x0,ay=ty-y0,n=Math.max(Math.abs(ax),Math.abs(ay));
 for(let i=1;i<n;i++){const x=x0+Math.sign(ax)*Math.round(Math.abs(ax)*i/n),y=y0+Math.sign(ay)*Math.round(Math.abs(ay)*i/n);
  if(x<0||y<0||x>=MAP_W||y>=MAP_H||game.floor.grid[y][x]===1)return false;
  const d=doorAt(x,y);if(d&&!d.open)return false;
  if(game.vendor&&game.vendor.x===x&&game.vendor.y===y)return false;
  if(game.fountains&&game.fountains.some(f=>f.x===x&&f.y===y))return false;
  if(game.healFountains&&game.healFountains.some(f=>f.x===x&&f.y===y))return false;
  if(game.enemies.some(z=>z.x===x&&z.y===y))return false;}
 return true;}
function reachDist(e){return Math.max(Math.abs(e.x-game.px),Math.abs(e.y-game.py));}
function inReach(e){if(!game||!e||e.isDog||!game.floor)return false;const r=reachDist(e);if(r<1||r>weaponReach())return false;
 if(!(game.vis&&game.vis[e.y]&&game.vis[e.y][e.x]))return false;return r===1||reachLineClear(e.x,e.y);}
/* Strike enemy e if it is in reach. Returns true when the attempt was handled (a turn may have passed). Adjacent and
   straight-line targets go through tryMove (same step as pressing that direction); others strike directly. */
function reachStrike(e){if(mode!==State.PLAY||pendingConfirm||!inReach(e))return false;
 const ax=e.x-game.px,ay=e.y-game.py,r=reachDist(e);
 if(r===1||ax===0||ay===0||Math.abs(ax)===Math.abs(ay)){tryMove(Math.sign(ax),Math.sign(ay));return true;}
 if(napBlocked())return true;clearScanMessages();
 const wn=game.equip&&game.equip.weapon?game.equip.weapon.name:"Your weapon";
 log(wn+" strikes at range "+r+"!","gold");
 if(attack(e))return true;endTurn();return true;}
function castDadism(id){const d=DADISMS.find(x=>x.id===id);if(!d)return;if(game.moxie<d.cost){log("Not enough Patience for "+d.name+".","red");return;}game.moxie-=d.cost;if(game.statuses.doubt){delete game.statuses.doubt;log("You say the Dadism out loud. The email loses its grip. Per My Previous Email: cleared.","grn");}/* MOB-69 */
 if(d.kind==="dmg"){const t=adjEnemies()[0];if(!t){log("Nothing close enough.","dim");game.moxie+=d.cost;return;}const dm=d.power+Math.floor(effWis()/2);t.hp-=dm;t.shownHP=true;discover(t.def,game.depth);addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:10,color:"#f0a040"});log(d.name+"! "+t.def.name+" takes "+dm+".","gold");if(t.hp<=0){gainXP(t.def.xp);game.gold+=t.def.gold;game.enemies=game.enemies.filter(x=>x!==t);}}
 else if(d.kind==="heal"){game.hp=Math.min(game.maxhp,game.hp+d.power);addFX({kind:"blast",cells:[{x:game.px,y:game.py}],t:0,life:10,color:"#5fbf4f"});log(d.name+". +"+d.power+" HP.","grn");}
 else if(d.kind==="buff"){applyStatus(d.status,d.turns);log(d.name+" — "+STATUSES[d.status].name+".","blu");}
 else if(d.kind==="stun"){const t=adjEnemies()[0];if(!t){log("No target.","dim");game.moxie+=d.cost;return;}t.stun=d.turns;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:10,color:"#7fb0e8"});log(d.name+". "+t.def.name+" freezes.","blu");}
 else if(d.kind==="rootall"){for(const e of game.enemies)e.root=d.turns;log(d.name+". Everything pauses to update.","blu");}
 else if(d.kind==="blind"){for(const e of adjEnemies()){e.blind=d.turns;addFX({kind:"blast",cells:[{x:e.x,y:e.y}],t:0,life:8,color:"#ffffff"});}log(d.name+". Spots everywhere.","blu");}
 else if(d.kind==="scan"){for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)game.seen[y][x]=true;game.globalReveal=true;log(d.name+". The whole floor, and every threat, revealed.","gold");}
 else if(d.kind==="aoe"){const cells=[];let n=0;for(const e of game.enemies)if(Math.abs(e.x-game.px)+Math.abs(e.y-game.py)<=3){e.hp-=d.power;e.shownHP=true;discover(e.def,game.depth);cells.push({x:e.x,y:e.y});n++;}game.enemies=game.enemies.filter(e=>e.hp>0);addFX({kind:"blast",cells:ringCells(game.px,game.py,3),t:0,life:12,color:"#b06fd0"});log(d.name+" hits "+n+" foe(s) for "+d.power+". Effects increase yearly.","gold");}
 else if(d.kind==="random"){const r=Math.random();if(r<0.60){
  // 60% — positive effects pool (randomized)
  const posRoll=Math.random();
  const t=adjEnemies()[0];
  if(posRoll<0.25&&t){t.hp-=12;t.shownHP=true;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:10,color:"#f0c040"});log("Improvised Solution! A controlled blast: 12 damage to "+t.def.name+".","gold");if(t.hp<=0){gainXP(t.def.xp);game.gold+=t.def.gold;game.enemies=game.enemies.filter(x=>x!==t);}}
  else if(posRoll<0.45){game.hp=Math.min(game.maxhp,game.hp+8);addFX({kind:"blast",cells:[{x:game.px,y:game.py}],t:0,life:8,color:"#5fbf4f"});log("Improvised field dressing! +8 HP. You would not recommend this to a physician.","grn");}
  else if(posRoll<0.60){applyStatus("guard",4);log("Improvised shield! DEF +2 for 4 turns. It's held together with duct tape. The duct tape is doing great.","blu");}
  else if(posRoll<0.73){game.moxie=Math.min(game.maxmoxie,game.moxie+4);log("Improvised confidence boost! +4 Patience. Sometimes you just need to commit to the bit.","blu");}
  else if(posRoll<0.85&&t){t.stun=3;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:8,color:"#7fb0e8"});log("Improvised stun! "+t.def.name+" is confused for 3 turns. It worked exactly as intended, which was not intentional.","gold");}
  else{for(const e of game.enemies)if(Math.abs(e.x-game.px)+Math.abs(e.y-game.py)<=2){e.hp-=6;e.shownHP=true;}game.enemies=game.enemies.filter(e=>e.hp>0);addFX({kind:"blast",cells:ringCells(game.px,game.py,2),t:0,life:10,color:"#f09030"});log("Improvised area effect! Something explodes outward (6 dmg, radius 2). You did not plan this. It worked anyway.","gold");}
 }else if(r<0.95){
  // 35% — negative effects pool
  const negRoll=Math.random();
  if(negRoll<0.40){game.hp=Math.max(1,game.hp-4);log("It gets WORSE. -4 HP. The improvisation improvised back.","red");}
  else if(negRoll<0.65){applyStatus("hangry",3);log("Side effect: sudden onset irritability. ATK -1 for 3 turns. You're hungry now. Where did that come from.","red");}
  else if(negRoll<0.85){if(game.hunger<(game.hungerCap||100)-20)game.hunger=Math.min((game.hungerCap||100),game.hunger+20);log("Backfire: the solution consumed all your snacks somehow. Hunger up significantly.","red");}
  else{const slots=SLOTS.filter(s=>game.equip[s]);if(slots.length){const rs=slots[Math.floor(Math.random()*slots.length)];log("The improvisation attempts to improve your "+rs+" slot. Your "+rs+" slot does not improve. The "+rs+" slot is, if anything, worse now.","red");}else{game.hp=Math.max(1,game.hp-3);log("Improvised chaos: -3 HP. No equipment to punish. You'll do.","red");}}
 }else{
  // 5% — weird neutral/structural
  const weirdRoll=Math.random();
  if(weirdRoll<0.5){game.maxhp+=4;game.hp=game.maxhp;log("Somehow STRUCTURAL. +4 max HP. This should not have happened. Dad Science.","gold");}
  else{game.per++;log("The improvisation reveals a gap in the wall you'd never noticed. +1 PER permanently. You cannot replicate this.","gold");}
 }}
 else if(d.kind==="knockback"){const t=adjEnemies()[0];if(!t){log("Nothing adjacent to send flying.","dim");game.moxie+=d.cost;return;}const bx=Math.sign(t.x-game.px),by=Math.sign(t.y-game.py);let tx=t.x,ty=t.y,steps=0;while(steps<(d.power||3)){const nx=tx+bx,ny=ty+by;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H||game.floor.grid[ny][nx]===1||game.enemies.some(z=>z!==t&&z.x===nx&&z.y===ny))break;tx=nx;ty=ny;steps++;}t.x=tx;t.y=ty;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:10,color:"#c0c040"});log(d.name+"! "+t.def.name+" stumbles backward "+steps+" tile(s).","gold");}
 closeOverlays();endTurn();}
function ringCells(cx,cy,r){const a=[];for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(dx*dx+dy*dy<=r*r)a.push({x:cx+dx,y:cy+dy});return a;}
function gainDadism(id){if(!id)return false;const d=DADISMS.find(x=>x.id===id);if(!d)return false;if(game.dadisms.includes(id)){log("You already know: "+d.name+". The scroll nods, impressed.","dim");return false;}game.dadisms.push(id);log("DADISM LEARNED: "+d.name+"! Added to the Book of Dadvice.","gold");if(ovDad&&typeof buildDad==="function")buildDad();syncUI();return true;}
/* ===== Family Dog encounter ===== */
function dogEncounter(e){
 const r=Math.random();
 const foods=["casserole","granola","jerky","meatball"];
 if(r<1/3){
  const foodId=foods[Math.floor(Math.random()*foods.length)];
  game.loot.push({x:e.x,y:e.y,item:mkConsumable(foodId)});
  log("The dog drops food at your feet. You elect not to ask where it came from. Good dog. Probably.","grn");
 }else if(r<2/3){
  const food=game.inv.find(en=>en.it.kind==="consumable"&&en.it.nourish);
  if(food){const nm=food.it.name;removeEntry(food,1);log("The dog steals your "+nm+" with catastrophic precision and does not look even slightly sorry.","red");}
  else{log("The dog sniffs your inventory, finds nothing edible, and judges you quietly for this.","dim");}
 }else{
  log("The dog licks your face once, solemnly, with great conviction. Nothing else happens. You feel strangely okay.","blu");
 }
 const nearby=game.enemies.filter(en=>en!==e&&Math.abs(en.x-e.x)+Math.abs(en.y-e.y)<=6);
 if(nearby.length){const tgt=nearby[Math.floor(Math.random()*nearby.length)];log("The dog chases the "+tgt.def.name+" with enormous enthusiasm. It will not be seen again on this floor.","gold");game.enemies=game.enemies.filter(x=>x!==tgt);}
 game.enemies=game.enemies.filter(x=>x!==e);
 log("The dog departs. Its alignment remains Chaotic Neutral.","dim");
 endTurn();}

/* ===== Ally recruit + follow + combat ===== */
function allyEncounter(){
 if(!game.ally)return;
 const def=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;
 if(!def)return;
 // Recruit side quest gate: must be completed before they'll follow.
 if(def.quest&&!game.ally.questDone){
  huntQuestSweep();/* MOB-58 */
  if(!game.ally.questDone){
  if(!game.ally.questOffered){game.ally.questOffered=true;log(def.name+": "+def.intro,"gold");log(def.name+": \""+def.quest.text+"\"","gold");}
  else{log(def.name+" is still waiting on you. \""+def.quest.text+"\"","dim");}
  if(def.quest.type==="hunt"){let el=_huntLive(def.id);const fresh=!el;if(!el)el=_spawnHuntElite(def,Math.random);
   if(el)log(def.name+(fresh?" squints into the distance. \"It moved. Big one, off to the ":" nods. \"Big one. Off to the ")+_huntDir(game.ally.x,game.ally.y,el.x,el.y)+". You'll know it when it hits you.\"","gold");}
  endTurn();return;}}
 if(!game.allyMet.includes(def.id))game.allyMet.push(def.id);
 game.ally.following=true;
 if(!game.ally.questOffered)log(def.name+": "+def.intro,"gold");
 if(def.quest)log(def.name+": \""+(def.quest.doneText||"Alright. Let's go.")+"\"","gold");
 log(def.name+" joins you. ATK "+def.atk+" DEF "+def.def+" HP "+def.hp+".","grn");
 endTurn();}
// Fetch-quest completion check — called when the player picks up a floor item.
function tryCompleteFetchQuest(item){
 if(!item||!item.questFor||!game.ally||game.ally.following||game.ally.questDone)return;
 if(game.ally.defId!==item.questFor)return;
 const def=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===item.questFor):null;
 if(!def||!def.quest||def.quest.type!=="fetch")return;
 game.ally.questDone=true;
 log(def.name+": \"That's the one — nice work.\"","gold");}
/* MOB-58 (2026-11-15): the hunt target can go missing (the first spot was the stairs, the app was closed and the floor rebuilt on
   Continue, the family dog chased it off, or a Dadism or the companion finished it). huntQuestSweep() (start of endTurn and of
   allyEncounter) completes the quest when the tracked target died by any means; allyEncounter puts a new target on the floor
   when none is alive and says which way it is. game._huntRef is transient (not saved). No seeded RNG is used. */
function _huntLive(id){return game.enemies.find(e=>e.isQuestElite&&e.questFor===id&&e.hp>0)||null;}
function _spawnHuntElite(adef,rng){const f=game.floor;if(!f||!f.rooms||!f.rooms.length)return null;rng=rng||Math.random;
 const busy=(x,y)=>onStairs(x,y)||(x===game.px&&y===game.py)||game.enemies.some(e=>e.x===x&&e.y===y)||(game.ally&&game.ally.x===x&&game.ally.y===y)||!(f.grid[y]&&f.grid[y][x]===0)||(typeof doorAt==="function"&&doorAt(x,y));
 const rooms=f.rooms.slice().reverse();
 for(let t=0;t<60;t++){const r=rooms[t%rooms.length];if(!r)continue;const x=r.x+1+Math.floor(rng()*Math.max(1,r.w-2)),y=r.y+1+Math.floor(rng()*Math.max(1,r.h-2));
  if(busy(x,y))continue;if(Math.max(Math.abs(x-game.px),Math.abs(y-game.py))<4&&t<40)continue;
  const cdef=pickCreature(game.depth,rng);if(!cdef)return null;const qe=mkEnemy(cdef,x,y,false);qe.hp=Math.round(qe.hp*1.6);qe.maxhp=qe.hp;qe.scaledAtk=Math.round((qe.scaledAtk||cdef.atk)*1.3);qe.isQuestElite=true;qe.questFor=adef.id;game.enemies.push(qe);game._huntRef=qe;return qe;}
 return null;}
function _huntDir(fx,fy,tx,ty){const dx=tx-fx,dy=ty-fy;if(!dx&&!dy)return"right here";const a=(Math.atan2(dy,dx)*180/Math.PI+360+22.5)%360;return["east","southeast","south","southwest","west","northwest","north","northeast"][Math.floor(a/45)];}
function huntQuestSweep(){if(!game||!game.ally||game.ally.following||game.ally.questDone)return;const def=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;if(!def||!def.quest||def.quest.type!=="hunt")return;
 const el=_huntLive(def.id);if(el){game._huntRef=el;return;}const r=game._huntRef;if(r&&r.hp<=0&&r.questFor===def.id)tryCompleteHuntQuest(r);game._huntRef=null;}
// Hunt-quest completion check — called when a quest-tagged elite creature is defeated.
function tryCompleteHuntQuest(e){
 if(!e||!e.isQuestElite||!e.questFor||!game.ally||game.ally.following||game.ally.questDone)return;
 if(game.ally.defId!==e.questFor)return;
 const def=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===e.questFor):null;
 if(!def||!def.quest||def.quest.type!=="hunt")return;
 game.ally.questDone=true;
 log(def.name+": \"That's the one I meant. Nicely done.\"","gold");}

const ALLY_LEASH=3;
function allyName(){const def=typeof ALLIES!=="undefined"&&game.ally?ALLIES.find(a=>a.id===game.ally.defId):null;return def?def.name:"Your companion";}
// Issue a tactical order to the active ally. Does NOT cost the player a turn.
function orderAlly(x,y){
 if(!game.ally||!game.ally.following){log("No companion to direct right now.","dim");return false;}
 if(!(game.vis&&game.vis[y]&&game.vis[y][x])){log("You can't signal your companion to a place you can't see.","dim");return false;}
 const en=game.enemies.find(e=>e.x===x&&e.y===y&&!e.isDog);
 if(en){game.allyOrder={type:"attack",target:en};log(allyName()+": \"On it.\" — ordered to engage the "+en.def.name+".","grn");syncUI();return true;}
 const grid=game.floor&&game.floor.grid;const walkable=grid&&grid[y]&&grid[y][x]!==1&&grid[y][x]!==undefined&&!(doorAt(x,y)&&!doorAt(x,y).open);
 if(walkable||(x===game.px&&y===game.py)){game.allyOrder={type:"move",x,y};log(allyName()+": \"Heading there.\" — ordered to hold that position.","grn");syncUI();return true;}
 log("Your companion stares at the wall you just pointed at. Nothing happens.","dim");return false;}
function allyStepToward(tx,ty){
 const A=game.ally;const dx=Math.sign(tx-A.x),dy=Math.sign(ty-A.y);
 const adx=Math.abs(tx-A.x),ady=Math.abs(ty-A.y);
 const steps=adx>=ady?[[dx,0],[0,dy]]:[[0,dy],[dx,0]];
 for(const [mx,my] of steps){if(mx===0&&my===0)continue;const nx=A.x+mx,ny=A.y+my;if(canStep(nx,ny)){A.x=nx;A.y=ny;return true;}}
 return false;}
function allyHit(def,t){if(typeof allyAnimAttack==="function"&&game.ally)allyAnimAttack(t.x-game.ally.x,t.y-game.ally.y);/* MOB-61 attack lunge (visual only) */
 const dmg=Math.max(1,allyAtk(def)-Math.floor(t.def.def/3));/* MOB-60: base ATK + worn gear */t.hp-=dmg;t.shownHP=true;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:6,color:"#37b0b0"});log(def.name+" hits "+t.def.name+" for "+dmg+".","dim");if(def.dtype&&t.hp>0&&Math.random()<DT_PROC_CREATURE)dtApplyUnit(t,def.dtype);/* MOB-69 (no companion has a type yet) */
 if(t.hp<=0){log(t.def.name+" defeated by "+def.name+".","gold");gainXP(Math.floor(t.def.xp/2));game.gold+=Math.floor(t.def.gold/2);tryCompleteHuntQuest(t);game.enemies=game.enemies.filter(x=>x!==t);if(game.allyOrder&&game.allyOrder.type==="attack"&&game.allyOrder.target===t)game.allyOrder=null;}}
function allySufferAdjacent(def){
 const A=game.ally;const hits=game.enemies.filter(en=>!en.isDog&&Math.abs(en.x-A.x)+Math.abs(en.y-A.y)===1);
 for(const h of hits){const dmg=Math.max(0,(h.scaledAtk||h.def.atk)-allyDefStat(def));/* MOB-60: base DEF + worn gear */if(dmg>0){A.hp-=dmg;const _ct=dtCreatureType(h);if(_ct&&A.hp>0&&Math.random()<DT_PROC_CREATURE)dtApplyUnit(A,_ct,{ally:true,def:def});}}/* MOB-69 */
 if(A.hp<=0){allyFall(def);/* MOB-60: logs the defeat and drops the kit + bag */}}
function allyTurn(){
 if(!game.ally||!game.ally.following)return;
 const def=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;
 if(!def)return;
 const A=game.ally;
 // Little Timmy asks the questions every dad knows. You do not have to answer.
 if(def.id==="little_timmy"&&typeof TIMMY_QUESTIONS!=="undefined"&&Math.random()<0.12){log("Little Timmy: \""+TIMMY_QUESTIONS[Math.floor(Math.random()*TIMMY_QUESTIONS.length)]+"\"","dim");}
 {const _dt=dtTickUnit(A,true,def);/* MOB-69 */if(_dt==="dead"){allyFall(def);/* MOB-60 */return;}if(_dt==="skip"){allySufferAdjacent(def);return;}if(A.dFrozen>0){A.dFrozen--;const _fa=allyStance()!=="passive"?game.enemies.find(en=>!en.isDog&&Math.abs(en.x-A.x)+Math.abs(en.y-A.y)===1):null;log(def.name+" is Frozen Solid and stays put.","dim");if(_fa)allyHit(def,_fa);else allySufferAdjacent(def);return;}}
 allyAbilityTick(def);/* MOB-28 */
 // Validate any active order
 let order=game.allyOrder;
 if(order){
  if(order.type==="attack"){if(!order.target||!game.enemies.includes(order.target)||order.target.hp<=0){game.allyOrder=null;order=null;}}
  else if(order.type==="move"){if(A.x===order.x&&A.y===order.y){game.allyOrder=null;order=null;log(def.name+" holds the position you indicated.","dim");}}
 }
 // 1) Attack order — chase the named target, ignore the leash
 if(order&&order.type==="attack"){const t=order.target;if(Math.abs(t.x-A.x)+Math.abs(t.y-A.y)===1){allyHit(def,t);return;}allyStepToward(t.x,t.y);allySufferAdjacent(def);return;}
 // 2) Move order — walk to the spot, ignore the leash
 if(order&&order.type==="move"){allyStepToward(order.x,order.y);allySufferAdjacent(def);return;}
 // 3) MOB-28: stance AI. Aggressive: anything Dad can see (within ALLY_AGGRO_RANGE) or anything close to the companion. Neutral: only a creature that has attacked Dad. Passive: never attacks, keeps clear of creatures.
 const st=allyStance();
 if(st==="passive"){if(!allyKeepClear())allyCatchUp();allySufferAdjacent(def);return;}
 const foes=allyFoes(st);
 const adj=foes.find(en=>Math.abs(en.x-A.x)+Math.abs(en.y-A.y)===1);
 if(adj){allyHit(def,adj);return;}
 const tgt=foes.sort((a,b)=>(Math.abs(a.x-A.x)+Math.abs(a.y-A.y))-(Math.abs(b.x-A.x)+Math.abs(b.y-A.y)))[0];
 if(tgt){allyStepToward(tgt.x,tgt.y);allySufferAdjacent(def);return;}
 allyCatchUp();
 allySufferAdjacent(def);}
/* ===== MOB-28: companion stance, door following, abilities ===== */
const ALLY_AGGRO_RANGE=6,ALLY_PASSIVE_GAP=2,ALLY_ABILITY_GAP=[20,30];
const ALLY_STANCES=[["aggressive","Aggressive","attacks anything you can see, or anything that gets close"],["neutral","Neutral","only fights a creature that attacks you"],["passive","Passive","stays back and keeps out of fights"]];
const ALLY_STANCE_LINES={aggressive:'{name}: "Say no more." Stance: Aggressive. Anything you can see is now a personal matter.',neutral:'{name}: "I\'ve got your back." Stance: Neutral. They fight whatever fights you.',passive:'{name}: "I\'ll be over here. Supportively." Stance: Passive. They stay out of the fight.'};
// New companions and companions from older saves start Neutral.
function allyStance(){const s=game&&game.ally&&game.ally.stance;return s==="aggressive"||s==="passive"?s:"neutral";}
function allyStanceLabel(){const s=allyStance();return (ALLY_STANCES.find(x=>x[0]===s)||ALLY_STANCES[1])[1];}
function allyFoes(st){const A=game.ally;return game.enemies.filter(en=>{if(en.isDog||en.hp<=0)return false;const md=Math.abs(en.x-A.x)+Math.abs(en.y-A.y);
 if(st==="aggressive"){const seen=!!(game.vis&&game.vis[en.y]&&game.vis[en.y][en.x]);return (seen&&md<=ALLY_AGGRO_RANGE)||Math.max(Math.abs(en.x-A.x),Math.abs(en.y-A.y))<=2;}
 return !!en.hitDad&&md<=ALLY_AGGRO_RANGE;});}
// Passive: when a creature is within ALLY_PASSIVE_GAP tiles, step to the free neighbouring tile farthest from creatures (ties: closer to Dad); true = it handled its turn.
function allyKeepClear(){const A=game.ally;const foes=game.enemies.filter(en=>!en.isDog&&en.hp>0);if(!foes.length)return false;
 const gap=(x,y)=>Math.min.apply(null,foes.map(en=>Math.max(Math.abs(en.x-x),Math.abs(en.y-y))));
 const cur=gap(A.x,A.y);if(cur>ALLY_PASSIVE_GAP)return false;
 let best=null,bg=cur,bd=Infinity;for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=A.x+dx,ny=A.y+dy;if(!canStep(nx,ny))continue;const g=gap(nx,ny),dd=Math.max(Math.abs(nx-game.px),Math.abs(ny-game.py));if(g>bg||(g===bg&&g>cur&&dd<bd)){best=[nx,ny];bg=g;bd=dd;}}
 if(best){A.x=best[0];A.y=best[1];}return true;}
// Path for a following companion: like bfsPath, but closed unlocked doors count as passable (it opens them on the way).
function _allyPath(x0,y0,x1,y1){if(game.traps&&game.traps.some(t=>t.known&&!t.sprung)){const p=_bfsPath(x0,y0,x1,y1,true,true);if(p)return p;}return _bfsPath(x0,y0,x1,y1,false,true);}
function _allyOpenDoor(d){d.open=true;d.openTurn=game.turn;d.playerWasOn=false;computeVis();if(game.vis&&game.vis[d.y]&&game.vis[d.y][d.x])log(allyName()+" opens the door to keep up. Nobody in this family has ever closed a door behind them.","dim");}
// Each companion's own helpful ability, tried roughly every 20-30 turns while following (free action; waits until it would actually help).
function allyAbilityTick(def){const A=game.ally,ab=def.ability;if(!A||!ab)return;
 if(!(A.abCd>=0))A.abCd=12;if(A.abCd>0){A.abCd--;return;}
 const inView=en=>!en.isDog&&en.hp>0&&!!(game.vis&&game.vis[en.y]&&game.vis[en.y][en.x]);let used=false;
 if(ab.kind==="heal"){if(game.hp<game.maxhp*0.7){const n=Math.max(1,Math.round(game.maxhp*ab.pct));game.hp=Math.min(game.maxhp,game.hp+n);log(ab.text.replace("{n}",n),"grn");used=true;}}
 else if(ab.kind==="snack"){if(Number.isFinite(game.hunger)&&game.hunger>=(game.hungerCap||100)*0.4){game.hunger=Math.max(0,game.hunger-ab.amount);log(ab.text,"grn");used=true;}}
 else if(ab.kind==="status"){if(game.enemies.some(inView)&&!hasStatus(ab.status)){applyStatus(ab.status,ab.turns);log(ab.text,"grn");used=true;}}
 else if(ab.kind==="stun"){const t=game.enemies.filter(en=>inView(en)&&!en.isBoss).sort((a,b)=>(Math.abs(a.x-game.px)+Math.abs(a.y-game.py))-(Math.abs(b.x-game.px)+Math.abs(b.y-game.py)))[0];if(t){t.stun=Math.max(t.stun||0,ab.turns);log(ab.text.replace("{foe}",t.def.name),"grn");used=true;}}
 if(used)A.abCd=ALLY_ABILITY_GAP[0]+Math.floor(Math.random()*(ALLY_ABILITY_GAP[1]-ALLY_ABILITY_GAP[0]+1));}
// Stance chooser: MORE > COMPANION on phones, the COMPANION button or the O key on desktop. Costs no turn.
// MOB-60: those now open the companion card (stance, gear, bag); the plain stance list stays as _m60StanceList.
function openStanceMenu(){if(typeof openAllyCard==="function"&&game&&game.ally&&game.ally.following){openAllyCard();return;}_m60StanceList();}
function _m60StanceList(){if(!game||!game.ally||!game.ally.following){log("No companion to brief right now. You give the pep talk to yourself. It goes fine.","dim");syncUI();return;}
 const cur=allyStance();
 openMenu("COMPANION STANCE &mdash; "+allyName()+'<br><span class="dim">Now: '+allyStanceLabel()+". Changing it costs no turn.</span>",ALLY_STANCES.map(s=>({label:"<b>"+s[1].toUpperCase()+"</b> &mdash; "+s[2]+(s[0]===cur?" (current)":""),fn:function(){setAllyStance(s[0]);}})));}
function setAllyStance(s){if(!game||!game.ally||!game.ally.following)return;game.ally.stance=(s==="aggressive"||s==="passive")?s:"neutral";log(ALLY_STANCE_LINES[allyStance()].replace("{name}",allyName()),"grn");saveRun();syncUI();}
/* MOB-10: when not fighting, the companion stays within ALLY_LEASH tiles (8-way count) of Dad: farther than that, it follows the walkable path
   (not a straight line into a wall) and jogs up to 2 tiles a turn until it is back in range. In range but more than ALLY_LEASH walking steps away
   (the other side of a wall), it takes one step along the path so it does not get left behind the next time Dad moves. */
function allyCatchUp(){const A=game.ally;const far=()=>Math.max(Math.abs(A.x-game.px),Math.abs(A.y-game.py));
 const step=()=>{const p=_allyPath(A.x,A.y,game.px,game.py);const s=p&&p[0];if(s&&p.length>1){const nx=A.x+s[0],ny=A.y+s[1],d=doorAt(nx,ny);if(d&&!d.open&&!d.locked){_allyOpenDoor(d);return true;}/* MOB-28 */if(canStep(nx,ny)){A.x=nx;A.y=ny;return true;}}return allyStepToward(game.px,game.py);};
 if(far()<=ALLY_LEASH){const p=bfsPath(A.x,A.y,game.px,game.py);if(p?p.length>ALLY_LEASH:(Math.abs(A.x-game.px)+Math.abs(A.y-game.py)>ALLY_LEASH||!!_allyPath(A.x,A.y,game.px,game.py)))step();return;}/* MOB-28: a closed door between them in range: keep coming */
 for(let i=0;i<2&&far()>ALLY_LEASH;i++){if(!step())break;}}


/* ===== FX ===== */
function addFX(f){game.fx.push(f);}
/* ===== leveling ===== */
function gainXP(n){game.xp+=n;while(game.xp>=game.xpNext){game.xp-=game.xpNext;levelUp();}}
function levelUp(){if(typeof sfxVibe==="function")sfxVibe("level");/* MOB-81 */game.level++;game.xpNext=Math.floor(game.xpNext*1.4)+4;game.maxhp+=6+game.level;game.hp=game.maxhp;const pool=["str","def","wis"];const s=pool[Math.floor(Math.random()*pool.length)];game[s]++;game.maxmoxie++;game.moxie=game.maxmoxie;game.hungerCap=Math.min(250,(game.hungerCap||100)+2);game.hydraCap=Math.min(250,(game.hydraCap||100)+2);log("LEVEL UP! Lv"+game.level+". +HP, +"+s.toUpperCase()+". Stamina growing.","gold");if(game.level%5===0)log("MILESTONE! Level "+game.level+". A Dad Talent unlocks. Inventory expanded. He carries more than anyone should. He is, somehow, more prepared.","gold");else log("Level "+game.level+". Stats up. Talents unlock every 5 levels.","dim");if(game.level%5===0){game.talentPicks=(game.talentPicks||0)+1;offerTalentIfReady();}}
/* ===== talents (N10) — pick 1 of 3 on level-up ===== */
function talentTierMult(level){const tier=Math.floor(level/5);return Math.max(1,Math.ceil(tier/2));}function applyTalent(t){if(!t)return;const e=t.eff||{};const tm=talentTierMult(game.level);
 if(e.str)game.str+=e.str*tm;
 if(e.def)game.def+=e.def*tm;
 if(e.per)game.per+=e.per*tm;
 if(e.wis)game.wis+=e.wis*tm;
 if(e.maxhp){const mhp=e.maxhp*tm;game.maxhp+=mhp;game.hp=Math.min(game.maxhp,game.hp+mhp);}
 if(e.maxmoxie){const mm=e.maxmoxie*tm;game.maxmoxie+=mm;game.moxie=Math.min(game.maxmoxie,game.moxie+mm);}
 if(e.hydraSlow)game.hydraSlow=(game.hydraSlow||0)+e.hydraSlow*tm;
 if(e.hungerCap)game.hungerCap=Math.min(300,(game.hungerCap||100)+e.hungerCap*tm);
 if(e.hydraCap)game.hydraCap=Math.min(300,(game.hydraCap||100)+e.hydraCap*tm);
 if(e.kneeMul)game.kneeChance=Math.round((game.kneeChance||0.05)*e.kneeMul*1000)/1000;
 if(e.backMul)game.backChance=Math.round((game.backChance||0.05)*e.backMul*1000)/1000;
 if(e.foodLuck)game.foodLuck=Math.min(0.40,(game.foodLuck||0)+e.foodLuck);
 if(e.lightStep)game.lightStep=true;
 game.talents=game.talents||[];game.talents.push(t.id);
 const tierLabel=talentTierMult(game.level)>1?" (Tier "+talentTierMult(game.level)+" — enhanced effect)":"";log("DAD TALENT acquired: "+t.name+tierLabel+". "+t.desc,"gold");}
function offerTalentIfReady(){
 if(pendingMenu||pendingConfirm)return;
 if(!game||!game.talentPicks||game.talentPicks<=0)return;
 const pool=TALENTS.slice();for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const tmp=pool[i];pool[i]=pool[j];pool[j]=tmp;}
 const pick=pool.slice(0,3);
 openMenu("LEVEL "+game.level+" &mdash; Pick a Dad Talent (1 of 3):",pick.map(function(t){return {label:"<b>"+t.name+"</b> &mdash; "+t.desc,fn:function(){game.talentPicks=Math.max(0,(game.talentPicks||1)-1);applyTalent(t);saveRun();syncUI();offerTalentIfReady();}};}));}
function growPerception(key){if(game.inspectedKeys[key])return;game.inspectedKeys[key]=1;game.inspectPts++;if(game.inspectPts%INSPECT_PER_GROWTH===0){game.per++;log("Your Perception sharpens. (+1 PER)","gold");}}
/* ===== scan (radius inspect) + secret reveal ===== */
/* ===== scan + secret reveal ===== */
const SCAN_OBSESS=[
 "You have now scanned this exact spot five times. Something in you snaps. You slap the side of your own head to reset the mental register. It does not reset. -1 HP.",
 "Sixth scan. Same radius. Same results. Same dust. You thump your temple in frustration. The temple does not appreciate this. -1 HP.",
 "You scan again. The scan scans back, silently judging. You palm-strike your own forehead in self-correction. This was not corrective. -1 HP.",
 "At some point — possibly scan number four, possibly earlier — you lost the thread. You are now scanning for the scan. You headbutt nothing slightly. -1 HP.",
 "The area remains unchanged. You have changed, however — slightly stupider for the effort. A reflexive self-correction slap to the cranium confirms this. -1 HP.",
 "Seven scans. You have now mapped every mote of dust in this radius with scientific rigor. You smack yourself once, firmly, for wasting everyone’s time including your own. -1 HP.",
];
function revealSecretAt(x,y){const i=game.secrets.findIndex(s=>s.x===x&&s.y===y);if(i<0)return false;const sec=game.secrets[i];game.floor.grid[y][x]=0;game.secrets.splice(i,1);if(!game.openedSecrets)game.openedSecrets=[];game.openedSecrets.push({x,y});
 if(sec.hiddenLock){game.doors.push({x,y,locked:true,open:false,ri:sec.ri||0});computeVis();log("The scan finds a seam in the wall — and behind it, a locked door. Whoever hid it was committed to secrecy. The key you're carrying is starting to make a lot more sense.","gold");return true;}
 if(sec.room){computeVis();log("A hidden door grinds inward. Behind it: an entire room, walled off and unaccounted for by every contractor who ever cut a corner here. Whatever waits inside has had all the time in the world.","gold");return true;}
 game.loot.push({x,y,item:pickLoot(game.floor.rng,game.depth)});let guarded=false;if(game.floor.rng()<0.4&&!game.enemies.some(e=>e.x===x&&e.y===y)){const cdef=pickCreature(game.depth,game.floor.rng);if(cdef){game.enemies.push(mkEnemy(cdef,x,y,false));guarded=true;}}computeVis();log(guarded?"A loose panel! You uncover a hidden space — and something has been nesting in it, perched on the loot like it owns the place.":"A loose panel! You uncover a hidden space with something inside.","gold");return true;}
function scanArea(){if(napBlocked())return;stationaryScanCount++;if(stationaryScanCount>5){const obsessMsg=SCAN_OBSESS[Math.min(stationaryScanCount-6,SCAN_OBSESS.length-1)];game.hp=Math.max(1,game.hp-1);log(obsessMsg,"red");}/* MOB-09: radius 1 + floor(PER/2), max 7; PER 14+ also scans every tile currently in view. */const _sp=effPer(),_sFull=_sp>=SCAN_FULL_PER,_sRc=Math.min(7,1+Math.floor(_sp/2));let R=_sRc;if(_sFull){for(let y=0;y<MAP_H;y++)for(let x=0;x<MAP_W;x++)if(game.vis[y][x])R=Math.max(R,Math.ceil(Math.hypot(x-game.px,y-game.py)));}addFX({kind:"pulse",cx:game.px,cy:game.py,r:R,t:0,life:R*2+6});let found=0;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=game.px+dx,y=game.py+dy;if(x<0||y<0||x>=MAP_W||y>=MAP_H)continue;if(dx*dx+dy*dy>_sRc*_sRc&&!(_sFull&&game.vis[y][x]))continue;const t=game.traps.find(t=>t.x===x&&t.y===y&&!t.sprung);if(t&&!t.known&&trapDetected(t)){t.known=true;found++;}if(game.floor.grid[y][x]===1){const s=game.secrets.find(s=>s.x===x&&s.y===y);if(s&&revealSecretAt(x,y))found++;}}if(found){log("Scan reveals "+found+" thing(s). Perception: "+effPer()+".","blu",true);if(typeof SCAN_HIT!=="undefined")log(SCAN_HIT[Math.floor(Math.random()*SCAN_HIT.length)],"dim",true);}else{log((_sFull?"Scan covers everything in view":"Scan radius "+R)+". Nothing new. Perception: "+effPer()+".","dim",true);if(typeof SCAN_MISS!=="undefined")log(SCAN_MISS[Math.floor(Math.random()*SCAN_MISS.length)],"dim",true);}endTurn();}
/* ===== floor transitions ===== */
function _cacheCurrentFloor(){return{enemies:game.enemies.map(e=>Object.assign({},e)),loot:game.loot.slice(),traps:game.traps.map(t=>Object.assign({},t)),doors:game.doors.map(d=>Object.assign({},d)),secrets:game.secrets.slice(),openedSecrets:(game.openedSecrets||[]).slice(),fountains:game.fountains.map(f=>Object.assign({},f)),healFountains:game.healFountains.map(f=>Object.assign({},f)),vendor:game.vendor?Object.assign({},game.vendor):null,seen:game.seen.map(r=>r.slice()),stairsDown:{x:game.stairs.x,y:game.stairs.y},stairsUp:game.stairsUp?{x:game.stairsUp.x,y:game.stairsUp.y}:null};}
function _restoreFloorFromCache(cache,fromBelow){if(game.ally&&!game.ally.following)game.ally=null;const f=genFloor(game.depth,game.seed);game.floor=f;game.doors=cache.doors;game.secrets=cache.secrets;game.openedSecrets=cache.openedSecrets||[];game.openedSecrets.forEach(p=>{if(f.grid[p.y]&&f.grid[p.y][p.x]!==undefined)f.grid[p.y][p.x]=0;});/* MOB-21: floors cached before the lock rule changed keep their own doors and hidden locks */(game.doors||[]).forEach(d=>{if(f.grid[d.y]&&f.grid[d.y][d.x]===1)f.grid[d.y][d.x]=0;});(game.secrets||[]).forEach(z=>{if(z.hiddenLock&&f.grid[z.y]&&f.grid[z.y][z.x]===0)f.grid[z.y][z.x]=1;});game.globalReveal=false;game.fx=[];game.vendor=cache.vendor;game.seen=cache.seen;game.vis=[];for(let y=0;y<MAP_H;y++)game.vis.push(new Array(MAP_W).fill(false));game.enemies=cache.enemies;game.loot=cache.loot;game.traps=cache.traps;game.fountains=cache.fountains;game.healFountains=cache.healFountains;game.stairs=cache.stairsDown;game.stairsUp=cache.stairsUp;game.px=fromBelow?cache.stairsDown.x:(cache.stairsUp?cache.stairsUp.x:f.rooms[0].cx);game.py=fromBelow?cache.stairsDown.y:(cache.stairsUp?cache.stairsUp.y:f.rooms[0].cy);if(game.ally&&game.ally.following){game.ally.x=game.px;game.ally.y=game.py;}_settlePlacements();game._kh=null;keyHolderSweep();/* MOB-22: track a cached floor's key holder from the moment you arrive */computeVis();}
function doAscend(){if(game.depth<=1){if(game.ascent){ascentWin();return;}log("Floor 1. There is nowhere above. The sky is out there. It remains indifferent.","dim");return;}game.floorCache[game.depth]=_cacheCurrentFloor();game.depth--;updatePainChances();log("You climb back up to Floor "+game.depth+". The structural issues are familiar.","gold");game.moxie=Math.min(game.maxmoxie,game.moxie+1);const _ac=game.floorCache[game.depth];if(!_ac){log("The floor above has been forgotten. Regenerating from memory.","dim");buildFloor();saveRun();syncUI();return;}_restoreFloorFromCache(_ac,true);saveRun();syncUI();}
/* ===== biome transition story clips (N21) ===== */
// Which biomes a run has, by floor depth, already visited (used to backfill old saves).
function biomesSeenUpTo(depth){const seen=[];for(let f=1;f<=(depth||1);f++){const b=keyBiomeFor(f);if(!seen.includes(b))seen.push(b);}return seen;}
// Show a brief, class-flavored intro the FIRST time the dad reaches each biome in a run.
// Reuses the mouse-dismissable openMenu modal (single "Onward" option; Esc also dismisses).
function showBiomeClip(){
 if(!game||typeof STORY_CLIPS==="undefined")return;
 const bid=keyBiomeFor(game.depth);
 if(!game.biomesSeen)game.biomesSeen=[];
 if(game.biomesSeen.includes(bid))return;
 game.biomesSeen.push(bid);
 const clip=STORY_CLIPS[bid];if(!clip||typeof openMenu!=="function")return;
 const clsId=game.cls&&game.cls.id;
 const tag=(typeof CLASS_CLIP_TAGS!=="undefined"&&clsId&&CLASS_CLIP_TAGS[clsId])?CLASS_CLIP_TAGS[clsId]:"";
 const _m16h=(typeof m16ClipHead==="function")?m16ClipHead(bid,clip):null;/* M16 biome title card (null = old title line) */
 const body=(_m16h?_m16h:(clip.title?('<span class="l-gold">'+clip.title+'</span><br>'):''))+(tag?('<i>'+tag+'</i><br><br>'):'')+clip.intro;
 /* MOB-18: the biome objective follows on its own short card (so the story card keeps its old size and its button stays on screen);
    on floor 1 a third card gives the floor-1 objective, separate from the class backstory shown at Choose. */
 const f1=(game.depth===1&&!game.ascent&&typeof FLOOR1_OBJECTIVE!=="undefined")?FLOOR1_OBJECTIVE:null;
 const ob=clip.objective?('<span class="l-gold">'+(clip.title?clip.title+' &middot; ':'')+'OBJECTIVE</span><br>'+clip.objective):'';
 const f1c=f1?('<span class="l-gold">'+f1.title+'</span><br>'+f1.text+(f1.note?('<br><br><i>'+f1.note+'</i>'):'')):'';
 const showF1=function(){if(f1c&&typeof openMenu==="function")openMenu(f1c,[{label:"Understood. Mostly.",fn:function(){}}]);};
 openMenu(body,[{label:"Onward, then.",fn:function(){if(ob&&typeof openMenu==="function")openMenu(ob,[{label:f1c?"Fine. What about today?":"Understood. Mostly.",fn:showF1}]);else showF1();}}]);
}
/* MOB-50: the biome boss (floors 10, 20 ... 100) bars the stairs down until it is defeated. Stepping or waiting on the stairs is the only way a player reaches doDescend. Descent only: the Ascent and the mid-biome bosses (floors 15, 25) are unchanged. No RNG. */
function bossBarsStairs(){if(typeof game==="undefined"||!game||game.ascent||game.depth%10!==0)return null;return (game.enemies||[]).find(e=>e.isBoss&&e.hp>0)||null;}
function doDescend(){if(game.ascent&&game.depth>=MAXDEPTH){log("The stairs down end in poured concrete. The Remote hums against your hip. Home is up.","dim");return;}game.floorCache[game.depth]=_cacheCurrentFloor();game.depth++;if(game.depth>MAXDEPTH){win();return;}updatePainChances();log("You descend to Floor "+game.depth+".","gold");const _fb=(typeof FLOORBLURBS!=="undefined")&&FLOORBLURBS[game.depth];if(_fb)log(_fb,"blu");game.moxie=Math.min(game.maxmoxie,game.moxie+2);buildFloor();showBiomeClip();saveRun();syncUI();}
function die(cause,kind){mode=State.DEAD;
 if(game&&game.pickingLock){game.pickingLock=false;cause="the lock — specifically, while picking it. He expired mid-tension-wrench, one pin from glory, technically felled by "+(cause||"the sheer passage of time")+". The door remained locked. The door won.";}
 // No 'death' — a Dad simply, shamefully, quits trying. Headline is specific to how he 'tapped out.'
 const HEAD={
  creature:"You did not die. You 'tapped out.' A creature you were absolutely about to beat got a lucky one in, and you have decided, for the record, that you let it.",
  boss:"You didn't lose. You executed a 'strategic withdrawal' from a boss fight you were, in your own telling, basically winning.",
  thirst:"You didn't fall — you got 'a little lightheaded' from declining to drink water, in a dungeon, like a man waving off the cups at a 5K.",
  hunger:"You didn't collapse — you 'ran out of gas,' having carried snacks the entire way and eaten precisely none of them.",
  trap:"You weren't beaten by a trap. You 'didn't see it' — which is somehow worse, given that scanning for exactly this is a button you own.",
  knee:"You did not go down in battle. Your knee 'just went,' the way it always threatens to, and this time it committed to the bit.",
  back:"You're not defeated. Your back 'locked up' bending over, and you are now flat on a dungeon floor loudly insisting you are fine.",
  status:"You were not beaten. You 'let it run its course,' as you advise everyone to do, and it ran the whole course."
 };
 const k=game.kills||0,c=game.consumed||0,m=game.moolahEarned||0,fe=game.foodEaten||0,dt=game.drinksTaken||0,itf=game.itemsFound||0;
 deathReport=[
  {c:"red",t:HEAD[kind]||"You didn't die. You 'quit while you were ahead' — a phrase doing a truly heroic amount of work right now."},
  {c:"gold",t:"— THE FINAL TALLY (Floor "+game.depth+") —"},
  {c:"ink",t:"Creatures vanquished: "+k+" "+(k===0?"(a pacifist to the last; the suburbs respected nothing about it)":k===1?"(one. It counted. It always counts.)":k>=40?"(an absolute menace; the HOA will not miss them)":"(each one, you maintain, started it)")+"."},
  {c:"ink",t:"Moolah acquired: "+m+" "+(m===0?"(not one coin; a monk's run, involuntarily)":m>=400?"(rich, briefly; dead, permanently)":"(earned, spent, hoarded — all of it academic now)")+"."},
  {c:"ink",t:"Food eaten: "+fe+" · Drinks taken: "+dt+" "+((fe+dt)===0?"(you packed provisions and touched none of them, which is its own tragedy)":"(the body was a temple; you operated it like a gas-station microwave)")+"."},
  {c:"ink",t:"Items discovered: "+itf+" "+(itf===0?"(you took nothing and somehow leave with less)":"(picked up, appraised, and now bequeathed to the floor)")+". Total things consumed: "+c+"."},
  {c:"red",t:"Cause of the, ahem, 'tactical pause': "+(cause||"causes the coroner has politely declined to itemize")+"."}
 ];
 saveGraveyardEntry({outcome:"dead",cls:game.cls.id,clsName:game.cls.name,depth:game.depth,kills:game.kills||0,moolah:game.moolahEarned||0,turns:game.turn||0,cause:cause||"",date:new Date().toLocaleDateString()});recordDailyResult("dead");clearRun();syncUI();}
function win(){mode=State.WIN;if(!game.hoaDone){game.hoaDone=true;const R=(typeof HOA_RESOLUTIONS!=="undefined")?HOA_RESOLUTIONS.default:null;if(R)for(const t of R)log(t,"gold");}log("THE REMOTE IS YOURS. Thermostat: 72. From upstairs: \"Daaad? Since you're up...?\"","gold");saveGraveyardEntry({outcome:"win",cls:game.cls.id,clsName:game.cls.name,depth:game.depth,kills:game.kills||0,moolah:game.moolahEarned||0,turns:game.turn||0,cause:"",date:new Date().toLocaleDateString()});recordDailyResult("win");clearRun();syncUI();}
function startAscent(){if(game.ascent)return;game.ascent=true;game.ascentDone=false;mode=State.PLAY;game.depth=MAXDEPTH;game.floorCache={};game.ledger={};game.seed=((game.seed^0x5ADDAD)+1337)>>>0;log("You turn around. One hundred floors of suburbia stand between you and the thermostat, and every single one of them has heard about the Remote.","gold");log("Taped to the stairwell wall, in crayon: \"GO DAD GO. bring snacks.\"","grn");updatePainChances();game.moxie=game.maxmoxie;buildFloor();saveRun();syncUI();}
function ascentWin(){mode=State.WIN;game.ascentDone=true;log("DAYLIGHT. You emerge holding the Remote aloft. The lawn needs mowing. It can wait. Nothing waits like a dad can.","gold");saveGraveyardEntry({outcome:"win",cls:game.cls.id,clsName:game.cls.name,depth:game.depth,kills:game.kills||0,moolah:game.moolahEarned||0,turns:game.turn||0,cause:"Ascent complete",date:new Date().toLocaleDateString()});clearRun();syncUI();}
/* ===== save / load ===== */
/* ===== N20: HOA finale — multi-phase final boss + class resolutions ===== */
function hoaFinaleTick(){
 if(typeof HOA_PHASES==="undefined"||!game)return;
 const e=game.enemies&&game.enemies.find(x=>x.def&&x.def.id==="hoa_president");
 if(e){
  game.hoaSeen=true;
  if(e.hoaPhase===undefined){e.hoaPhase=1;e.hoaBaseAtk=e.scaledAtk||e.def.atk;for(const t of HOA_PHASES[0].lines)log(t,"red");}
  const pct=e.hp/e.maxhp;
  for(let i=1;i<HOA_PHASES.length;i++){const P=HOA_PHASES[i];
   if(e.hoaPhase<i+1&&pct<=P.at){e.hoaPhase=i+1;
    e.scaledAtk=(e.hoaBaseAtk||e.def.atk)+HOA_PHASES.slice(1,i+1).reduce((a,p)=>a+(p.atkBonus||0),0);
    if(P.patienceCost)game.moxie=Math.max(0,game.moxie-P.patienceCost);
    if(P.patienceZero)game.moxie=0;
    for(const t of P.lines)log(t,"red");}}
 }else if(game.hoaSeen&&!game.hoaDone){
  game.hoaDone=true;game.hoaSeen=false;
  const R=(typeof HOA_RESOLUTIONS!=="undefined")?(HOA_RESOLUTIONS[game.cls.id]||HOA_RESOLUTIONS.default):null;
  if(R)for(const t of R)log(t,"gold");
 }
}
function saveRun(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({clsId:game.cls.id,skin:game.skin||0,seed:game.seed,isDaily:!!game.isDaily,ascent:!!game.ascent,ascentDone:!!game.ascentDone,dailyDate:game.dailyDate||null,depth:game.depth,diffId:game.diff?game.diff.id:"weekend_warrior",hp:game.hp,maxhp:game.maxhp,str:game.str,def:game.def,per:game.per,wis:game.wis,moxie:game.moxie,maxmoxie:game.maxmoxie,level:game.level,xp:game.xp,xpNext:game.xpNext,gold:game.gold,equip:game.equip,inv:game.inv,dadisms:game.dadisms,statuses:game.statuses,inspectPts:game.inspectPts,hydraSlow:game.hydraSlow,kneeChance:game.kneeChance,backChance:game.backChance,px:game.px,py:game.py,ally:game.ally?{defId:game.ally.defId,hp:game.ally.hp,maxhp:game.ally.maxhp,x:game.ally.x,y:game.ally.y,following:!!game.ally.following,questDone:!!game.ally.questDone,questOffered:!!game.ally.questOffered,stance:allyStance(),dBurn:game.ally.dBurn||0,dWet:game.ally.dWet||0,dZap:game.ally.dZap||0,dChill:game.ally.dChill||0,dChillN:game.ally.dChillN||0,dChillAlt:!!game.ally.dChillAlt,dFrozen:game.ally.dFrozen||0,dBleed:game.ally.dBleed||0,dBleedN:game.ally.dBleedN||0,dDoubt:game.ally.dDoubt||0/* MOB-69 */,kit:game.ally.kit||{},bag:game.ally.bag||[]/* MOB-60 */}:null,allyMet:game.allyMet||[],biomesSeen:game.biomesSeen||[],knownRecipes:game.knownRecipes||[],triedPairs:game.triedPairs||[],returning:game.returning||[],knownConsumables:game.knownConsumables||[],keyring:game.keyring||[],floorCache:game.floorCache||{},ledger:game.ledger||{},kills:game.kills||0,consumed:game.consumed||0,talentPicks:game.talentPicks||0,talents:game.talents||[],foodLuck:game.foodLuck||0,lightStep:!!game.lightStep,foodEaten:game.foodEaten||0,drinksTaken:game.drinksTaken||0,moolahEarned:game.moolahEarned||0,itemsFound:game.itemsFound||0,notesFound:game.notesFound||0,comedyFloors:game.comedyFloors||[],comedyShown:game.comedyShown||[],hoaSeen:!!game.hoaSeen,hoaDone:!!game.hoaDone}));}catch(e){}}
function clearRun(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
function hasSave(){try{return !!localStorage.getItem(SAVE_KEY);}catch(e){return false;}}
function continueRun(){let s;try{s=JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){return false;}if(!s)return false;
 const cls=CLASSES.find(c=>c.id===s.clsId)||CLASSES[0];
 game={cls,skin:(typeof s.skin==="number"?s.skin:0),seed:s.seed,isDaily:!!s.isDaily,ascent:!!s.ascent,ascentDone:!!s.ascentDone,dailyDate:s.dailyDate||null,diff:(typeof DIFFICULTY_MODES!=="undefined"?DIFFICULTY_MODES.find(d=>d.id===(s.diffId||"weekend_warrior")):null)||null,depth:s.depth,hp:s.hp,maxhp:s.maxhp,str:s.str,def:s.def,per:s.per,wis:s.wis,moxie:s.moxie,maxmoxie:s.maxmoxie,level:s.level,xp:s.xp,xpNext:s.xpNext,gold:s.gold,equip:s.equip||{weapon:null,head:null,torso:null,arms:null,legs:null,feet:null,charm1:null,charm2:null},inv:s.inv||[],dadisms:s.dadisms||[],statuses:s.statuses||{},inspectPts:s.inspectPts||0,inspectedKeys:{},moxTick:0,hydraSlow:s.hydraSlow||0,kneeChance:s.kneeChance||0.05,backChance:s.backChance||0.05,hunger:0,hydra:cls.startHydra||0,hungerCap:100,hydraCap:100,globalReveal:false,drunkStack:0,px:s.px,py:s.py,enemies:[],loot:[],traps:[],doors:[],secrets:[],fountains:[],healFountains:[],waterFloors:[],fountainFloors:[],healFountainFloors:[],vendor:null,stairs:{x:0,y:0},stairsUp:null,floorCache:s.floorCache||{},ledger:(s.ledger&&typeof s.ledger==="object")?s.ledger:{},floor:null,seen:null,vis:null,fx:[],turn:0,kills:s.kills||0,consumed:s.consumed||0,foodLuck:s.foodLuck||0,lightStep:!!s.lightStep,foodEaten:s.foodEaten||0,drinksTaken:s.drinksTaken||0,moolahEarned:s.moolahEarned||0,itemsFound:s.itemsFound||0,notesFound:s.notesFound||0,comedyFloors:Array.isArray(s.comedyFloors)?s.comedyFloors:[],comedyShown:Array.isArray(s.comedyShown)?s.comedyShown:[],hoaSeen:!!s.hoaSeen,hoaDone:!!s.hoaDone};
 buildFloor();game.px=s.px;game.py=s.py;{const _d54=doorAt(game.px,game.py);if(_d54)_d54.open=true;}/* MOB-54: a save made before the door rule changed can put Dad where a door now stands; that door starts open */
 if(s.ally){game.ally=s.ally;if(game.ally.following){game.ally.x=s.px;game.ally.y=s.py;}}
 game.allyOrder=null;
 game.allyMet=s.allyMet||[];game.knownRecipes=s.knownRecipes||[];game.triedPairs=s.triedPairs||[];game.returning=s.returning||[];game.knownConsumables=s.knownConsumables||[];game.keyring=s.keyring||[];game.talentPicks=s.talentPicks||0;game.talents=s.talents||[];game.biomesSeen=s.biomesSeen||biomesSeenUpTo(game.depth);_settlePlacements();computeVis();messages=[];log("Run resumed. Floor "+game.depth+".","gold");mode=State.PLAY;syncUI();return true;}
/* ===== vendor / shop ===== */
// Worth of a gear item's stats (incl. affixes). Better stats -> higher value; curses (negative mods) drag it down.
function gearWorth(it){let v=0;const W={atk:3,def:3,per:2,wis:2,cap:4,reach:2};for(const k in W)if(it[k])v+=it[k]*W[k];for(const a of(it.affixes||[]))if(a.mods)for(const k in W)if(a.mods[k])v+=a.mods[k]*W[k];if(it.throw)v+=2;return v;}
function shopPrice(it){if(it.societyItem&&it.sellValue)return it.sellValue;
 if(it.kind==="consumable")return Math.max(4,8+Math.floor(game.depth*1.5)+(it.heal||0)+Math.floor(((it.nourish||0)+(it.hydrate||0))/6)+(it.cures?6:0)+(it.moxie||0)*2);
 if(it.kind==="key"||it.kind==="protip")return 10+Math.floor(game.depth*2);
 if(it.kind==="weapon")return Math.max(6,15+Math.floor(game.depth*2)+gearWorth(it));
 if(it.kind==="armor")return Math.max(6,12+Math.floor(game.depth*2)+gearWorth(it));
 if(it.kind==="charm")return Math.max(6,10+Math.floor(game.depth*1.5)+gearWorth(it));
 return 8+Math.floor(game.depth);}
// Sell value: identified gear is worth more than unidentified; upgraded > plain > cursed.
function sellPrice(it){if(it.societyItem&&it.sellValue)return it.sellValue;let p=shopPrice(it)*0.5;
 if(["weapon","armor","charm"].includes(it.kind)){
  if(it.idd===false)p=shopPrice(Object.assign({},it,{affixes:[]}))*0.5*0.55; // MOB-53: a mystery item is priced as the plain base item (hidden upgrades/curses do not move the price), and fetches less at the desk
  else{const hasHelp=(it.affixes||[]).some(a=>a.type==="help");const cursed=(it.affixes||[]).some(a=>a.type==="hinder")&&!it.uncursed;if(cursed)p*=0.15;else if(hasHelp)p*=1.3;}
 }
 return Math.max(1,Math.floor(p));}
function sellItem(idx){const e=game.inv[idx];if(!e)return;const it=e.it;const sp=sellPrice(it);const nm=itemDisplayName(it);const _m53u=["weapon","armor","charm"].includes(it.kind)&&it.idd===false;game.gold+=sp;removeEntry(e,1);log("Sold "+nm+" for "+sp+" moolah. The vendor will resell it at a markup. That is the way of things.","grn");if(_m53u)log(_m53Reveal(it),"gold");buildShop();syncUI();}
/* MOB-53 (KBP 2026-11-13): unidentified gear stays unidentified to both of you until the sale is done; then he holds it up to the light */
function _m53Reveal(it){const af=it.affixes||[];if(!af.length)return "He holds the "+it.name+" up to the light. Completely unmodified. He looks relieved. You both move on.";const cur=af.some(a=>a.type==="hinder")&&!it.uncursed;const help=af.some(a=>a.type==="help");const names=af.map(a=>a.name).join(", ");
 if(cur)return "He holds the "+it.name+" up to the light: "+names+". It was cursed. He looks delighted. You decide not to ask what he does with these.";
 if(help)return "He holds the "+it.name+" up to the light: "+names+". He whistles. You do the math on what you just let go for "+sellPrice(Object.assign({},it,{idd:false}))+" moolah. Some lessons cost money.";
 return "He holds the "+it.name+" up to the light: "+names+". He shrugs. You shrug. A fair deal, technically.";}
function openShop(){shopOpen=true;try{_m53Tab=0;}catch(e){}buildShop();syncOverlays();}
/* MOB-72: vendor stock runs out. Counts are per run, per floor and per stock row, kept in memory (not in the save) */
var _shopSold={};
function shopStockQty(it){const r=(it.rarity||"Common");if(r==="Mythic"||r==="Legendary"||r==="Epic")return 1;if(r==="Rare")return 2;if(r==="Uncommon")return 3;return 5;}
function _shopKey(i){return (game.seed||0)+":"+(game.ascent?"a":"d")+":"+game.depth+":"+i;}
function shopLeft(i,it){return Math.max(0,shopStockQty(it)-(_shopSold[_shopKey(i)]||0));}
function shopNoteSold(i){const k=_shopKey(i);_shopSold[k]=(_shopSold[k]||0)+1;}
/* ===== fountain ===== */
function useFountain(fn){if(fn.charges<=0){log("The fountain is empty. It gave all it had.","dim");return;}fn.charges--;game.hydra=Math.max(0,game.hydra-40);game.hunger=Math.max(0,game.hunger-10);log("You drink from the fountain. Hydration: restored. Dignity: intact.","blu");if(fn.charges===0)log("The fountain sputters and goes dry.","dim");endTurn();}
/* ===== healing fountain (The Cooler of Restoration) ===== */
function useHealFountain(fn){if(fn.charges<=0){log("The cooler holds only warm backwash now. You decline.","dim");return;}fn.charges--;const amt=Math.floor(game.maxhp*0.4)+8;game.hp=Math.min(game.maxhp,game.hp+amt);addFX({kind:"blast",cells:[{x:fn.x,y:fn.y},{x:game.px,y:game.py}],t:0,life:12,color:"#5fbf4f"});log("You drink the humming red liquid. +"+amt+" HP. Probably fine. Tastes like 2012.","grn");if(fn.charges===0)log("The Cooler of Restoration is spent. It did what it could.","dim");endTurn();}
/* ===== identify (Owner's Manual) ===== */
function identifyAll(){let n=0;for(const e of game.inv){const it=e.it;if(["weapon","armor","charm"].includes(it.kind)&&!it.idd){it.idd=true;n++;}if(it.kind==="consumable"&&!consKnown(it)){revealConsumable(it.id);n++;}}for(const k of SLOTS){const g=game.equip[k];if(g)g.idd=true;}if(n)log("You read the manual. "+n+" item(s) revealed for what they truly are. Some you wish you hadn't asked.","gold");else log("You read the manual cover to cover. Nothing here was a mystery. You feel learned anyway.","dim");}
function useObject(e){const it=e.it;
 if(it.identify){closeOverlays();identifyAll();removeEntry(e,1);endTurn();return;}
 if(it.uncurse){uncurseSelected(e);return;}
 if(it.identifySingle){closeOverlays();identifySingleItem(e);return;}
 if(it.revealRecipe){closeOverlays();revealRecipe(e);return;}
 if(it.attrBoost){closeOverlays();applyAttrBoost(it.attrBoost,e);return;}
 if(it.learnDadism){closeOverlays();const learnable=DADISMS.filter(d=>d.learnable&&!game.dadisms.includes(d.id));if(!learnable.length){log("You already know every Dadism on this scroll. The scroll folds itself back, impressed.","dim");return;}const ld=learnable[Math.floor(Math.random()*learnable.length)];if(gainDadism(ld.id)){removeEntry(e,1);endTurn();}return;}
 if(it.societyItem){log("You examine "+it.name+". I guess someone might find this useful. (Sell at a vendor for "+it.sellValue+"g.)","dim");return;}
 log(it.name+": "+it.desc,"dim");}
/* ===== Sticky Note / YallTube / AttrBoost helpers ===== */
function identifySingleItem(e){
 const target=game.inv.find(en=>en!==e&&((["weapon","armor","charm"].includes(en.it.kind)&&!en.it.idd)||(en.it.kind==="consumable"&&!consKnown(en.it))));
 if(!target){log("Nothing in inventory needs identifying. (Everything you carry is already known.)","dim");return;}
 if(target.it.kind==="consumable"){const alias=consAlias(target.it.id);revealConsumable(target.it.id);log("You apply the Sticky Note to the "+alias+". It is, the label now confirms, "+target.it.name+".","gold");}
 else{target.it.idd=true;log("You apply the Sticky Note to: "+target.it.name+". The truth is revealed: "+((target.it.affixes||[]).length?"it has "+(target.it.affixes.map(a=>a.name).join(", "))+".":"it's completely unmodified. Disappointing."),"gold");}
 removeEntry(e,1);if(ovInv)buildInv();syncUI();endTurn();}
function revealRecipe(e){
 const known=game.knownRecipes||[];
 let unknown=RECIPES.filter(r=>!known.includes(r.a+"+"+r.b));
 if(!unknown.length){log("You watch the YallTube video. You already know all those recipes. The comments remain disabled.","dim");removeEntry(e,1);endTurn();return;}
 /* MOB-40 S5: 75% of videos involve something he is carrying or wearing; after that, tier 2 half the time once one of its crafted ingredients has been made. */
 {const held=new Set();for(const en of game.inv)if(en!==e)held.add(craftId(en.it));for(const k in game.equip)if(game.equip[k])held.add(craftId(game.equip[k]));
  const withHeld=unknown.filter(r=>held.has(r.a)||held.has(r.b));if(withHeld.length&&Math.random()<0.75)unknown=withHeld;
  const made=new Set(RECIPES.filter(r=>known.includes(r.a+"+"+r.b)).map(r=>r.out.id));const t2=unknown.filter(r=>r.tier===2&&(made.has(r.a)||made.has(r.b)));if(t2.length&&Math.random()<0.5)unknown=t2;}
 const r=unknown[Math.floor(Math.random()*unknown.length)];
 if(!game.knownRecipes)game.knownRecipes=[];
 game.knownRecipes.push(r.a+"+"+r.b);
 log("YallTube reveals: "+r.desc+" Now shown in the "+kbTxt("Compendium [J].","Codex (MORE, then CODEX)."),"gold");
 removeEntry(e,1);endTurn();}
function applyAttrBoost(boost,e){
 if(boost.stat==="str"){game.str+=boost.amount;log("PERMANENT ATK +"+boost.amount+"! The gains are real.","gold");}
 else if(boost.stat==="def"){game.def+=boost.amount;log("PERMANENT DEF +"+boost.amount+"! Structural integrity improved.","gold");}
 else if(boost.stat==="per"){game.per+=boost.amount;log("PERMANENT PER +"+boost.amount+"! His powers of observation deepen.","gold");}
 else if(boost.stat==="wis"){game.wis+=boost.amount;log("PERMANENT WIS +"+boost.amount+"! Dadism power improved.","gold");}
 removeEntry(e.it?game.inv.find(x=>x===e):game.inv.find(x=>x.it===e.it),1);endTurn();}
/* ===== interactable doors (#28/#30) ===== */
function doorOpen(d,msg){d.open=true;d.openTurn=game.turn;d.playerWasOn=false;log(msg||"You open the door. (1 turn)","dim");computeVis();endTurn();}
// Lockpicking (DIY class). Turn cost scales inversely with experience: green dads fumble for many
// turns, veterans breeze it. A picked door is opened but NOT unlocked — it may seal itself again.
function pickLock(d){if(game.pickingLock)return;
 const skill=(game.level||1)+Math.floor(effPer()/2);
 const turns=Math.max(1,7-Math.floor(skill/3));
 game.pickingLock=true;
 log("You kneel and work the lock. Estimated time: "+turns+" turn(s). Your knees register a formal complaint.","dim");
 let done=0;
 const step=function(){
  if(mode!==State.PLAY){game.pickingLock=false;return;}
  done++;
  endTurn(); // a turn passes: enemies close in, hunger and thirst tick, the universe gets a vote
  if(mode!==State.PLAY){game.pickingLock=false;return;} // died or left mid-pick; die() supplies the joke
  if(done>=turns){game.pickingLock=false;d.open=true;d.openTurn=game.turn;d.playerWasOn=false;log("The lock yields. Picked, not unlocked — it is still very much a lock, and may seal itself again the moment you look away. For now, though: victory.","gold");computeVis();syncUI();return;}
  log("...still picking ("+done+"/"+turns+"). The tension wrench holds. Barely.","dim");
  setTimeout(step,140);
 };
 step();}
function doorOptions(d){const o=[];
 if(!d.locked)o.push({label:"Open it",fn:()=>doorOpen(d)});
 if(d.locked&&hasKey())o.push({label:"Use the key",fn:()=>{consumeKey();if(typeof sfxUnlock==="function")sfxUnlock();d.locked=false;doorOpen(d,"You unlock it with the Mysterious Key. It stays unlocked now — permanently. It was this one after all.");}});
 if(d.locked&&game.cls.id==="diy")o.push({label:"Pick the lock",fn:()=>pickLock(d)});
 if(game.cls.id==="gym")o.push({label:"Kick it down",fn:()=>kickDoor(d)});
 o.push({label:"Do nothing",fn:()=>{}});
 return o;}
function openDoorMenu(d){const opts=doorOptions(d);
 if(d.locked&&opts.length<=1){log("That door is locked. No key, no lock-picking, no kicking it in. You'll need another way.","red");return;}
 openMenu(d.locked?"A locked door blocks the way. What's the play?":"A door. What's the play?",opts);}
/* ===== placeable traps (#24) — craft, carry (max 5/stack), place 1 per tile ===== */
function springTrapOn(e,t){t.sprung=true;const d=t.def;const dmg=d.dmg||4;e.hp-=dmg;e.shownHP=true;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:10,color:"#e0453a"});log("Your "+d.name+" springs on "+e.def.name+"! "+dmg+" dmg.","gold");if(d.status==="nap"||d.status==="coma")e.stun=Math.max(e.stun||0,2);else if(d.status)e.root=Math.max(e.root||0,2);if(d.dtype&&e.hp>0)dtApplyUnit(e,d.dtype);/* MOB-69 */if(e.hp<=0&&game.enemies.includes(e)){const _g=e.def.gold||0;game.gold+=_g;game.moolahEarned=(game.moolahEarned||0)+_g;log(e.def.name+" is undone by your craftsmanship. +"+e.def.xp+" XP"+(_g>0?", +"+_g+" moolah":""),"gold");gainXP(e.def.xp);game.enemies=game.enemies.filter(x=>x!==e);}}
function startPlace(e){if(!e||!e.it.placeable){log("That can't be placed.","dim");return;}placeRef=e;placing=true;closeOverlays();log("Place "+e.it.name+kbTxt(" — press a direction (Esc cancels)."," — tap a tile next to you, then PLACE (CANCEL backs out)."),"blu");}
function quickPlace(){const e=game.inv.find(en=>en.it.placeable);if(!e){log("No traps to place. Craft one first (DIY/Tactical/Tech).","dim");return;}startPlace(e);}
function quickThrow(){const list=game.inv.filter(en=>en.it.throw);if(!list.length){log("Nothing throwable in the bag. Find or craft something aerodynamic.","dim");return;}/* MOB-11: pick what to throw first */
 openMenu("THROW &mdash; pick the projectile.<br><span class=\"dim\">Your arm: "+throwArm()+" tiles (STR "+game.str+").</span>",list.map(function(en){return {label:itemDisplayName(en.it)+(en.qty>1?" x"+en.qty:"")+" &mdash; "+(en.it.throw.dmg||3)+" dmg, "+throwRange(en.it)+" tiles",fn:function(){startThrow(en);syncUI();}};}));}
function placeTrap(dx,dy){placing=false;const e=placeRef;placeRef=null;if(!e||!e.it.placeable||!game.inv.includes(e)){log("Nothing to place.","dim");return;}const tx=game.px+dx,ty=game.py+dy;if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H||game.floor.grid[ty][tx]===1){log("Can't place a trap there.","dim");return;}if(game.traps.some(t=>t.x===tx&&t.y===ty&&!t.sprung)){log("Something's already there.","dim");return;}removeEntry(e,1);const td=TRAPS_DEF.find(t=>t.id===e.it.trapId)||TRAPS_DEF[0];game.traps.push({def:td,x:tx,y:ty,sprung:false,known:true});log("You carefully place the "+e.it.name+". Dad craftsmanship, deployed.","blu");computeVis();}
/* ===== inspect mode ===== */
const elInspect=document.getElementById("inspectbox");
function updateInspectBox(){if(!inspectOn){elInspect.classList.remove("show");return;}const r=inspectAt(insX,insY);if(r){elInspect.classList.add("show");elInspect.innerHTML='<div class="it">'+r.t+'</div><div>'+r.b+'</div>';}else{elInspect.classList.remove("show");}}
function showInspect(x,y){inspectOn=true;insX=x;insY=y;updateInspectBox();}
function toggleInspect(){inspectOn=!inspectOn;inspectKb=inspectOn;if(!inspectOn){elInspect.classList.remove("show");}else{insX=game.px;insY=game.py;showInspect(insX,insY);inspectKb=true;log("Inspect on— arrow keys to navigate, Esc to close.","dim");}}
function moveInspect(dx,dy){const nx=insX+dx,ny=insY+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)return;insX=nx;insY=ny;showInspect(insX,insY);}
function clearMouseInspect(){if(!inspectKb&&inspectOn){inspectOn=false;elInspect.classList.remove("show");}}
