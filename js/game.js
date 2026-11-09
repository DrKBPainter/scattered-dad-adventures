/* ===== SCATTERED DAD ADVENTURES — game.js =====
   Core engine: state, mapgen, stats, combat, movement, items,
   survival, traps, XP, shop, save/load.
   Depends on: sprites.js, data.js
   ============================================= */

/* ===== bestiary ===== */
function loadBestiary(){try{return JSON.parse(localStorage.getItem(BESTIARY_KEY))||{};}catch(e){return {};}}
function saveBestiary(b){try{localStorage.setItem(BESTIARY_KEY,JSON.stringify(b));}catch(e){}}
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
 const roomEntries=(r)=>{let n=0;for(let xx=r.x;xx<r.x+r.w;xx++){if(grid[r.y-1]&&grid[r.y-1][xx]===0)n++;if(grid[r.y+r.h]&&grid[r.y+r.h][xx]===0)n++;}for(let yy=r.y;yy<r.y+r.h;yy++){if(grid[yy][r.x-1]===0)n++;if(grid[yy][r.x+r.w]===0)n++;}return n;};
 for(let y=1;y<MAP_H-1;y++)for(let x=1;x<MAP_W-1;x++){if(grid[y][x]!==0)continue;const N=grid[y-1][x]===1,Sd=grid[y+1][x]===1,E=grid[y][x+1]===1,W=grid[y][x-1]===1;const hz=N&&Sd&&!E&&!W,vt=E&&W&&!N&&!Sd;if(!hz&&!vt)continue;if(inRm(x,y))continue;const re=hz?(inRm(x+1,y)||inRm(x-1,y)):(inRm(x,y+1)||inRm(x,y-1));if(!re)continue;const ri=hz?(inRm(x+1,y)?roomIdxAt(x+1,y):roomIdxAt(x-1,y)):(inRm(x,y+1)?roomIdxAt(x,y+1):roomIdxAt(x,y-1));cand.push({x,y,hz,ri});}
 // room-entry + back-to-back filtered pick (no door within 2 tiles in same corridor)
 for(let i=0;i<cand.length&&doors.length<4;i++){const c=cand[i];if(rng()>=0.5)continue;const near=doors.some(d=>c.hz?(d.y===c.y&&Math.abs(d.x-c.x)<=2):(d.x===c.x&&Math.abs(d.y-c.y)<=2));if(!near)doors.push({x:c.x,y:c.y,locked:false,open:false,ri:c.ri});}
 // locked doors may only seal a room with exactly ONE entry point (a dead-end leaf room)
 let hasLock=false,hasHiddenLock=false,_hiddenLockEntry=null;if(doors.length&&rng()<0.45){const lockable=doors.filter(d=>d.ri>=0&&roomEntries(rooms[d.ri])===1);if(lockable.length){const ld=lockable[lockable.length-1];ld.locked=true;hasLock=true;if(rng()<0.5){// convert to hidden locked door: seal tile back to wall, stage for secrets (declared below)
  grid[ld.y][ld.x]=1;_hiddenLockEntry={x:ld.x,y:ld.y,hiddenLock:true,ri:ld.ri};doors.splice(doors.indexOf(ld),1);hasHiddenLock=true;}}}
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
function fumbleChance(){let c=0;const th=game.statuses.thirst;if(th){const _dep=th.depend||0,_st=_dep>=6?3:_dep>=3?2:0,_thr=_st===3?4:_st===2?5:6,_fc=_st===3?.25:_st===2?.20:.18;if(th.craving>=_thr)c=_fc;}if(hasStatus("jitters"))c=Math.max(c,.10);if(hasStatus("hangover"))c=Math.max(c,.10);return c;}
function tryFumble(v){if(Math.random()<fumbleChance()){log("The shakes! You fumble "+v+".","red");endTurn();return true;}return false;}
function roll(max){return 1+Math.floor(Math.random()*Math.max(1,max));}
/* ===== item makers ===== */
function rarityFromAffixes(af){if(af.some(a=>a.id==="grillblessed"))return "Epic";const h=af.filter(a=>a.type==="help").length;return h>=2?"Rare":h===1?"Uncommon":"Common";}
function mkGear(tpl,kind,rng,clean){rng=rng||Math.random;const g={uid:uid(),kind,id:tpl.id,name:tpl.name,desc:tpl.desc,affixes:[]};for(const k of["atk","def","per","wis","cap","slot","wear","reach","throw","sprite"])if(tpl[k]!==undefined)g[k]=tpl[k];if(!clean){const n=rng()<0.45?1:(rng()<0.6?2:0);const pool=AFFIXES.filter(a=>!a.req||tpl[a.req]);for(let i=0;i<n&&pool.length;i++)g.affixes.push(pool.splice(Math.floor(rng()*pool.length),1)[0]);
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
/* ===== run / floor ===== */
function newRun(cls,diff,dailySeed){const isDaily=typeof dailySeed==="number";const seed=isDaily?dailySeed:(Math.random()*1e9)|0;diff=diff||(typeof DIFFICULTY_MODES!=="undefined"?DIFFICULTY_MODES[1]:null);
 // Daily Challenge: every dad who plays today gets the identical dungeon. Route all
 // run-setup randomness (not just floor layout) through the same seeded RNG so nothing varies.
 const _rr=isDaily?mulberry32(seed+424242):null;const rnd=isDaily?()=>_rr():Math.random;
 game={cls,seed,isDaily,dailyDate:isDaily?dailyDateStr():null,depth:1,hp:cls.hp,maxhp:cls.hp,str:cls.str,def:cls.def,per:cls.per,wis:cls.wis,moxie:cls.moxie,maxmoxie:cls.moxie,level:1,xp:0,xpNext:12,gold:20,diff:diff||null,
  equip:{weapon:null,head:null,torso:null,arms:null,legs:null,feet:null,charm1:null,charm2:null},inv:[],dadisms:[],statuses:{},
  hunger:0,hydra:cls.startHydra||0,hydraSlow:0,hungerCap:100,hydraCap:100,drunkStack:0,kneeChance:0.05,backChance:0.05,inspectPts:0,inspectedKeys:{},moxTick:0,globalReveal:false,
  px:0,py:0,enemies:[],loot:[],traps:[],doors:[],secrets:[],fountains:[],healFountains:[],waterFloors:[],fountainFloors:[],healFountainFloors:[],vendor:null,stairs:{x:0,y:0},stairsUp:null,floorCache:{},floor:null,seen:null,vis:null,fx:[],turn:0,clickPath:[],ascent:false,ascentDone:false,sfLastTurn:-20,kills:0,consumed:0,talentPicks:0,talents:[],foodLuck:0,lightStep:false,foodEaten:0,drinksTaken:0,moolahEarned:0,itemsFound:0};
 game.skin=(typeof skinCursor==="number"&&typeof SKIN_SWATCHES!=="undefined")?((skinCursor%SKIN_SWATCHES.length)+SKIN_SWATCHES.length)%SKIN_SWATCHES.length:0;
 game.dadisms=DADISMS.filter(d=>d.classes.includes(cls.id)).map(d=>d.id);
 game.ally=null;game.allyOrder=null;game.allyMet=[];game.knownRecipes=[];game.knownConsumables=[];game.keyring=[];game.biomesSeen=[];
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
 deathReport=null;buildFloor();messages=[];log(isDaily?"Floor 1. Today's Daily Challenge dungeon awaits — every dad faces this same house. Press H for help.":"Floor 1. The house is warming up. Press H for help.","gold");mode=State.PLAY;showBiomeClip();saveRun();syncUI();}
/* ===== graveyard (N12) ===== */
function loadGraveyard(){try{return JSON.parse(localStorage.getItem(GRAVEYARD_KEY))||[];}catch(e){return [];}}
function saveGraveyardEntry(entry){try{const g=loadGraveyard();g.unshift(entry);if(g.length>20)g.length=20;localStorage.setItem(GRAVEYARD_KEY,JSON.stringify(g));}catch(e){}}
function isVendorFloor(d){return !!VENDORS[d];}
function buildFloor(){if(game.ally&&!game.ally.following)game.ally=null;/* MOB-13: an unrecruited companion stays on the floor where you met them (was carried to the next floor at stale coordinates, often inside a wall) */const _cache=game.floorCache&&game.floorCache[game.depth];if(_cache){_restoreFloorFromCache(_cache,false);return;}const f=genFloor(game.depth,game.seed);game.floor=f;game.doors=f.doors;game.secrets=f.secrets;game.openedSecrets=[];game.globalReveal=false;game.fx=[];game.vendor=null;
 game.seen=[];game.vis=[];for(let y=0;y<MAP_H;y++){game.seen.push(new Array(MAP_W).fill(false));game.vis.push(new Array(MAP_W).fill(false));}
 game.px=f.rooms[0].cx;game.py=f.rooms[0].cy;const last=f.rooms[f.rooms.length-1];game.stairs={x:last.cx,y:last.cy};game.stairsUp=(game.depth>1||game.ascent)?{x:f.rooms[0].cx,y:f.rooms[0].cy}:null;if(game.ascent){game.px=last.cx;game.py=last.cy;}if(game.ally&&game.ally.following){game.ally.x=game.px;game.ally.y=game.py;}
 game.enemies=[];game.loot=[];game.traps=[];game.fountains=[];game.healFountains=[];
 const vend=isVendorFloor(game.depth);
 if(vend){const v=VENDORS[game.depth];let r=f.rooms[Math.floor(f.rooms.length/2)]||last;if(onStairs(r.cx,r.cy)&&f.rooms.length>1)r=f.rooms.find(rm=>!onStairs(rm.cx,rm.cy))||r;let def=v;if(v.pool){const arr=v.pool.slice();for(let i=arr.length-1;i>0;i--){const j=Math.floor(f.rng()*(i+1));const t=arr[i];arr[i]=arr[j];arr[j]=t;}def=Object.assign({},v,{stock:(v.fixed||[]).concat(arr.slice(0,v.pick||8))});}game.vendor={x:r.cx,y:r.cy,def:def};log("A vendor's stall stands here: "+def.name+".","gold");}
 {const bMatch=BOSSES.find(b=>b.floor===game.depth);if(bMatch){const br=f.rooms[f.rooms.length-1]||f.rooms[0];game.enemies.push(mkEnemy(bMatch,br.cx,br.cy-1,true));log("A presence fills the floor: "+bMatch.name+".","red");}}
 if(!vend){const _dcm=(game.diff&&game.diff.cntMul)||1;const cnt=Math.max(1,Math.round((3+Math.floor(game.depth*0.7)+Math.floor(f.rng()*3))*_dcm));for(let i=0;i<cnt;i++){const r=f.rooms[1+Math.floor(f.rng()*(f.rooms.length-1))];if(!r)continue;const ex=r.x+1+Math.floor(f.rng()*(r.w-2)),ey=r.y+1+Math.floor(f.rng()*(r.h-2));if((ex===game.px&&ey===game.py)||onStairs(ex,ey))continue;game.enemies.push(mkEnemy(pickCreature(game.depth,f.rng),ex,ey,false));}}
 const lc=3+Math.floor(f.rng()*3);for(let i=0;i<lc;i++){const r=f.rooms[Math.floor(f.rng()*f.rooms.length)];const lx=r.x+1+Math.floor(f.rng()*(r.w-2)),ly=r.y+1+Math.floor(f.rng()*(r.h-2));if(!onStairs(lx,ly))game.loot.push({x:lx,y:ly,item:pickLoot(f.rng,game.depth)});}
 if(f.hasLock){const r=f.rooms[0];let kx=r.cx,ky=r.cy+1<r.y+r.h?r.cy+1:r.cy;if(onStairs(kx,ky)){ky=r.cy-1>=r.y?r.cy-1:r.cy;if(onStairs(kx,ky))kx=r.cx+1<r.x+r.w?r.cx+1:r.cx;}game.loot.push({x:kx,y:ky,item:mkKey(game.depth)});if(f.hasHiddenLock){log("There is a locked door on this floor — hidden behind a wall. Someone was extremely committed to this. A key must be nearby.","blu");}else{log("There is a locked door on this floor. A key must be nearby — labeled, knowing you.","blu");}}
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
 if(!game.ally&&typeof ALLIES!=="undefined"){const avail=ALLIES.filter(a=>!(game.allyMet||[]).includes(a.id));if(avail.length&&Math.random()<0.15){const adef=avail[Math.floor(Math.random()*avail.length)];let ar=f.rooms[1]||f.rooms[0];if(onStairs(ar.cx,ar.cy))ar=f.rooms.find(rm=>!onStairs(rm.cx,rm.cy))||ar;game.ally={defId:adef.id,hp:adef.hp,maxhp:adef.maxhp,x:ar.cx,y:ar.cy,following:false,questDone:!adef.quest,questOffered:false};log("A friendly presence is somewhere on this floor.","gold");
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
      if(cdef){const qe=mkEnemy(cdef,hx,hy,false);qe.hp=Math.round(qe.hp*1.6);qe.maxhp=qe.hp;qe.scaledAtk=Math.round((qe.scaledAtk||cdef.atk)*1.3);qe.isQuestElite=true;qe.questFor=adef.id;game.enemies.push(qe);log("Something bigger than usual is stalking this floor.","red");}}}
   }
  }}}
 _settlePlacements();computeVis();}
/* MOB-13 safety net: anything that ends up on a wall tile (or off the map) is moved to the nearest open floor tile. Consumes no RNG, so seeded floors are unchanged. */
function _openFloorNear(x,y,taken){const gr=game.floor.grid;for(let r=1;r<Math.max(MAP_W,MAP_H);r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)continue;if(gr[ny][nx]!==0)continue;if(doorAt(nx,ny))continue;if(onStairs(nx,ny))continue;if(taken&&taken(nx,ny))continue;return {x:nx,y:ny};}}return null;}
function _settlePlacements(){if(!game||!game.floor)return;const gr=game.floor.grid;const bad=(x,y)=>!(gr[y]&&gr[y][x]!==undefined)||gr[y][x]===1;
 if(bad(game.px,game.py)){const p=_openFloorNear(game.px,game.py);if(p){game.px=p.x;game.py=p.y;}}
 const occ=(x,y)=>(x===game.px&&y===game.py)||game.enemies.some(e=>e.x===x&&e.y===y);
 for(const e of game.enemies){if(bad(e.x,e.y)){const p=_openFloorNear(e.x,e.y,occ);if(p){e.x=p.x;e.y=p.y;}}}
 for(const l of game.loot){if(bad(l.x,l.y)){const p=_openFloorNear(l.x,l.y);if(p){l.x=p.x;l.y=p.y;}}}
 if(game.ally){if(game.ally.following){game.ally.x=game.px;game.ally.y=game.py;}else if(bad(game.ally.x,game.ally.y)){const p=_openFloorNear(game.ally.x,game.ally.y,occ);if(p){game.ally.x=p.x;game.ally.y=p.y;}}}}
function pickCreature(depth,rng){const bio=depth<=10?"The House":depth<=20?"Lowe & Behold":depth<=30?"The Park":depth<=40?"Vastco":depth<=50?"Soccer Complex":depth<=60?"The School":depth<=70?"The Family Restaurant":depth<=80?"IDKEA":depth<=90?"The Neighborhood":"The HOA Dominion";const pool=CREATURES.filter(c=>c.biome===bio);const src=pool.length?pool:CREATURES;return src[Math.floor(rng()*src.length)];}
function mkEnemy(t,x,y,boss){const _d=(typeof game!=="undefined"&&game&&game.diff&&!boss)?game.diff:null;let _hp=_d?Math.max(1,Math.round(t.hp*_d.hpMul)):t.hp;let _atk=_d?Math.max(1,Math.round(t.atk*_d.atkMul)):t.atk;if(typeof game!=="undefined"&&game&&game.ascent){_hp=Math.max(1,Math.round(_hp*1.5));_atk=Math.max(1,Math.round(_atk*1.3));}return {def:t,x,y,hp:_hp,maxhp:_hp,scaledAtk:_atk,isBoss:!!boss,shownHP:false,uid:uid(),stun:0,root:0,blind:0};}
function pickLoot(rng,depth){const r=rng();
 if(r<0.22){return mkGear(WEAPONS[Math.floor(rng()*WEAPONS.length)],"weapon",rng,false);}
 if(r<0.46){return mkGear(ARMORS[Math.floor(rng()*ARMORS.length)],"armor",rng,false);}
 if(r<0.56){return mkGear(CHARMS[Math.floor(rng()*CHARMS.length)],"charm",rng,false);}
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
 for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){if(dx*dx+dy*dy>R*R)continue;const x=game.px+dx,y=game.py+dy;if(x<0||y<0||x>=MAP_W||y>=MAP_H)continue;if(losClear(game.px,game.py,x,y)){game.vis[y][x]=true;game.seen[y][x]=true;}}}
/* ===== inventory ===== */
function stackable(it){return it.kind==="consumable"||it.kind==="object"||it.kind==="key"||it.kind==="protip";}
function maxStack(it){if(it.societyItem)return 9;if(it.placeable)return 5;if(it.throw)return 9;if(it.kind==="consumable")return 5;return Infinity;}
function addItem(it){if(it.kind==="gold"){game.gold+=it.amount;return true;}if(it.kind==="key"){if(!game.keyring)game.keyring=[];if(it.floor&&game.keyring.some(k=>k.floor===it.floor))return true;game.keyring.push(it);return true;}if(stackable(it)){const ms=maxStack(it);const e=game.inv.find(e=>e.it.kind===it.kind&&e.it.id===it.id&&e.qty<ms);if(e){e.qty++;return true;}}if(game.inv.length>=invCap()){log("Inventory full ("+invCap()+" slots). Drop something.","red");return false;}game.inv.push({it,qty:1});return true;}
function removeEntry(e,n){n=n||1;e.qty-=n;if(e.qty<=0){const i=game.inv.indexOf(e);if(i>=0)game.inv.splice(i,1);}}
function equip(itOrE,silent){const it=itOrE.it?itOrE.it:itOrE;let slot;if(it.kind==="weapon")slot="weapon";else if(it.kind==="armor")slot=it.slot;else if(it.kind==="charm"){slot=!game.equip.charm1?"charm1":(!game.equip.charm2?"charm2":"charm1");}else return;
 if(it.reqLevel&&game.level<it.reqLevel&&!silent){const bonus=(game.cls&&game.cls.id==="tactical"&&it.reqLevel>1)?1:0;if(game.level<it.reqLevel-bonus){log("Requires Level "+it.reqLevel+(bonus?" (Tactical: "+( it.reqLevel-bonus)+")":"")+" to wield "+it.name+". (You are Level "+game.level+".)","red");return;}}
 if(isCursed(game.equip[slot])){log("The "+game.equip[slot].name+" refuses to budge — the curse won't let you swap it out. (Remove the curse first.)","red");return;}
 const wasIdd=it.idd;it.idd=true;const old=game.equip[slot];game.equip[slot]=it;const e=game.inv.find(e=>e.it===it);if(e)removeEntry(e,1);if(old)addItem(old);if(!silent){const _q=(typeof EQUIP_MSGS!=="undefined"&&EQUIP_MSGS[it.id])?(" "+EQUIP_MSGS[it.id]):"";log("Equipped "+it.name+(it.kind==="charm"?(" ("+(it.wear||"charm")+")"):"")+"."+_q,"grn");}if(!silent&&!wasIdd&&(it.affixes||[]).length)log("As you put it on, you can tell what it is by the way that it is.","blu");}
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
 if(it.relieve&&game.statuses[it.relieve]){game.statuses[it.relieve].craving=0;log("The Thirst is eased... for now.","dim");}
 if(it.alcohol){const th=game.statuses.thirst;if(th){if(th.withdrawing){th.withdrawing=false;th.withdrawTurns=0;log("The Intervention Binder tried. The cold one won. Withdrawal: failed.","red");}th.craving=0;th.suppressTurns=15;th.depend=(th.depend||0)+1;log("The Thirst quiets. 15 turns of peace. It is already calculating your next mistake.","red");}}
 if(it.whiskey){game.drunkStack=(game.drunkStack||0)+1;applyStatus("atkup",8);applyStatus("guard",8);if(game.drunkStack>=3){applyStatus("drunk",20);game.drunkStack=0;log("The room invites new interpretations. The floor offers a few of its own.","red");log("DAD DRUNK: you are now Dad Drunk. Your feet have filed for independence and your steps no longer answer to you.","red");}else{log("Fire in the belly. ATK & DEF up.","grn");}did=true;}
 if(["ibuprofen","acetaminophen","glucosamine"].includes(it.id)){game.kneeChance=0.05;game.backChance=0.05;log("Joints quiet, inflammation managed. The body's odds reset — for now.","blu");did=true;}
 if(it.saltdry){applyStatus("saltdry",it.saltdry);log("Salt-cured and regretting nothing. Your mouth declares a drought.","dim");did=true;}
 if(it.reaction){applyStatus("reaction",it.reaction);log("The label told me not to do this.","red");did=true;}
 if(it.causes){applyStatus(it.causes,it.causes==="thirst"?9999:14);log("...you've come down with "+STATUSES[it.causes].name+".","red");did=true;}
 if(it.defBuff){applyStatus("defbuff",10);log("Pain managed. DEF increased for 10 turns.","blu");did=true;}
 if(it.invincible){applyStatus("invincible",it.invincible);log("MAXIMUM DAD RELIEF. Briefly immune to damage. He has never felt better.","gold");did=true;}
 if(it.withdrawcure){const _wth=game.statuses.thirst;if(!_wth){log("No active Thirst. The Binder appreciates the forward planning.","dim");}else{_wth.withdrawing=true;_wth.withdrawTurns=0;_wth.craving=Math.max(0,(_wth.craving||0)-6);log("Your family staged an intervention. The binder is laminated. Page 12 has a note from your kid.","grn");log("WITHDRAWAL STARTED. Avoid all alcohol for 15 turns. DEF -1. Craving will fall. This is winnable.","red");}did=true;}
 if(!did)log("Nothing happens. Classic.","dim");
 game.consumed=(game.consumed||0)+1;
 removeEntry(e,1);endTurn();}
function useProtip(e){const p=e.it.perm||{};if(p.per)game.per+=p.per;if(p.str)game.str+=p.str;if(p.maxhp){game.maxhp+=p.maxhp;game.hp+=p.maxhp;}if(p.maxmoxie){game.maxmoxie+=p.maxmoxie;game.moxie+=p.maxmoxie;}if(p.hydraslow)game.hydraSlow+=p.hydraslow;log("PRO TIP internalized: "+e.it.name+".","gold");const _bfts=[];if(p.per)_bfts.push("+"+ p.per+" Perception");if(p.str)_bfts.push("+"+p.str+" ATK");if(p.maxhp)_bfts.push("+"+p.maxhp+" max HP");if(p.maxmoxie)_bfts.push("+"+p.maxmoxie+" max Patience");if(p.hydraslow)_bfts.push("thirst fills more slowly");if(_bfts.length)log("Benefits applied: "+_bfts.join(", ")+".","grn");removeEntry(e,1);endTurn();}
/* ===== survival + statuses ===== */
function survivalTick(){const hr=(game.cls.hungerRate||0.5)*0.5,hy=Math.max(0.05,((game.cls.hydraRate||0.7)*0.5)-game.hydraSlow*0.5);
 const hcap=game.hungerCap||100,dcap=game.hydraCap||100;
 game.hunger=Math.min(hcap,game.hunger+hr);game.hydra=Math.min(dcap,game.hydra+hy);
 const hwarn=hcap*0.7,dwarn=dcap*0.7;
 if(game.hunger>=hwarn&&game.hunger-hr<hwarn)log("You're getting hungry.","dim");
 if(game.hydra>=dwarn&&game.hydra-hy<dwarn)log("You're getting thirsty (need a drink).","dim");
 if(game.hunger>=hcap){game.hp=Math.max(0,game.hp-1);log("Starving! -1 HP. Eat something.","red");}
 if(game.hydra>=dcap){game.hp=Math.max(0,game.hp-1);log("Parched! -1 HP. Drink something.","red");}
 if(game.hp<=0)die(game.hunger>=hcap?"starvation, in a fully stocked dungeon, having never once stopped for a proper lunch":"dehydration, in a building that absolutely had a water fountain somewhere",game.hunger>=hcap?"hunger":"thirst");}
function applyStatus(id,turns){if(!STATUSES[id])return;if(id==="thirst"){if(game.statuses.thirst){game.statuses.thirst.depend=(game.statuses.thirst.depend||0)+1;return;}game.statuses.thirst={turns:9999,craving:0,depend:0};return;}game.statuses[id]={turns};}
function tickStatuses(){game.moxTick++;if(game.moxTick%4===0)game.moxie=Math.min(game.maxmoxie,game.moxie+1);
 for(const id of Object.keys(game.statuses)){const s=game.statuses[id];if(id==="regen")game.hp=Math.min(game.maxhp,game.hp+2);if(id==="hangover")game.hp=Math.max(1,game.hp-1);if(id==="reaction"){game.hydra=Math.min((game.hydraCap||100),game.hydra+18);game.hp=Math.max(1,game.hp-1);log("The Reaction continues. Hydration: evacuating. Dignity: gone.","red");}if(id==="saltdry")game.hydra=Math.min((game.hydraCap||100),game.hydra+6);if(id==="thirst"){if(s.withdrawing){s.withdrawTurns=(s.withdrawTurns||0)+1;s.craving=Math.max(0,(s.craving||0)-1);if(s.withdrawTurns===7)log("Halfway through withdrawal. The shakes: manageable. Barely.","dim");if(s.withdrawTurns>=15){delete game.statuses.thirst;log("THE THIRST HAS BEEN DEFEATED. Clean. For the first time in a long time.","gold");log("\"I never stopped believing in you.\" — Page 12.","grn");}continue;}if(s.suppressTurns>0){s.suppressTurns--;continue;}const _dep=s.depend||0,_stage=_dep>=6?3:_dep>=3?2:_dep>=1?1:0;if(!s.stageLogged)s.stageLogged=0;if(_stage>s.stageLogged){s.stageLogged=_stage;if(_stage===1)log("The Thirst notices your routine. It has started adjusting its schedule.","red");if(_stage===2)log("STAGE 2: The Thirst has filed as a dependent. It wants tax credit.","red");if(_stage===3)log("STAGE 3: The Thirst IS your primary personality trait now. The Thirst says hi.","red");}s.craving++;if(_stage>=2&&game.turn%2===0)s.craving++;if(_stage>=3&&game.turn%3===0)s.craving++;if(s.craving===6)log("The Thirst sets in. Your hands aren't steady.","red");if(s.craving===10&&_stage>=2)log("The Thirst is yelling. It has strong opinions about your schedule.","red");if(s.craving===15&&_stage>=3)log("The Thirst has become your primary motivation. He barely notices anymore.","red");continue;}if(s.turns!==9999){s.turns--;if(s.turns<=0){log(STATUSES[id].name+" wore off.","dim");delete game.statuses[id];}}}}
/* ===== traps ===== */
function trapDetected(t){return t.known||t.def.detect<=effPer();}
function springTrap(t){t.sprung=true;const d=t.def;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:16,color:d.fxColor||"#e0453a"});addFX({kind:"pulse",cx:t.x,cy:t.y,r:3,t:0,life:12});if(d.dmg){game.hp-=d.dmg;log("TRAP! "+d.name+". -"+d.dmg+" HP.","red");}else log("TRAP! "+d.name+".","red");if(d.status){applyStatus(d.status,d.status==="thirst"?9999:(d.status==="nap"?4:12));log("You have: "+STATUSES[d.status].name+".","red");}if(game.hp<=0)die("a "+d.name+" — a trap he had, in fairness, every opportunity to scan for","trap");}
/* ===== combat (roll-based) ===== */
function attack(e){if(tryFumble("your attack"))return true;let dmg=Math.max(1,roll(effAtk())-Math.floor(e.def.def/2));if(e.justCameThruDoor){dmg=Math.max(2,Math.floor(dmg*1.5));e.justCameThruDoor=false;log("SURPRISE! It came through the door. You were the door's plan all along. Bonus damage.","gold");}e.hp-=dmg;discover(e.def,game.depth);e.shownHP=true;addFX({kind:"blast",cells:[{x:e.x,y:e.y}],t:0,life:7,color:"#ffffff"});log("You hit "+e.def.name+" for "+dmg+".","ink");if(e.hp<=0){game.kills=(game.kills||0)+1;const _g=e.def.gold||0;game.gold+=_g;game.moolahEarned=(game.moolahEarned||0)+_g;log(e.def.name+" defeated. +"+e.def.xp+" XP"+(_g>0?", +"+_g+" moolah":""),"gold");{const _dm=e.def.defeatMsg||(typeof DEFEAT_FLAVOR!=="undefined"?DEFEAT_FLAVOR[Math.floor(Math.random()*DEFEAT_FLAVOR.length)]:"");if(_dm)log(_dm,"dim");}gainXP(e.def.xp);tryCompleteHuntQuest(e);game.enemies=game.enemies.filter(x=>x!==e);if(e.isBoss)log("The way down is clear.","gold");const dc=0.12+(e.def.xp/120);if(Math.random()<dc){let dr;const _fl=Math.min(0.75,0.35+(game.foodLuck||0));if(Math.random()<_fl){const FD=["water","gatorade","pedialyte","sportsdrink","applejuice","casserole","granola","jerky","coldpizza","proteinbar"];dr=mkConsumable(FD[Math.floor(Math.random()*FD.length)]);}else{dr=pickLoot(Math.random,game.depth);}game.loot.push({x:e.x,y:e.y,item:dr});log(e.def.name+" dropped: "+dr.name+".","gold");}}return false;}
function canStep(x,y){if(x<0||y<0||x>=MAP_W||y>=MAP_H)return false;if(game.floor.grid[y][x]===1)return false;const d=doorAt(x,y);if(d&&!d.open)return false;if(x===game.px&&y===game.py)return false;if(game.enemies.some(e=>e.x===x&&e.y===y))return false;if(game.vendor&&game.vendor.x===x&&game.vendor.y===y)return false;if(game.fountains&&game.fountains.some(f=>f.x===x&&f.y===y))return false;if(game.healFountains&&game.healFountains.some(f=>f.x===x&&f.y===y))return false;return true;}
function canMoveEnemy(e,x,y){if(!canStep(x,y))return false;if(game.ally&&game.ally.following&&game.ally.x===x&&game.ally.y===y)return false;const tile=game.floor.grid[y]&&game.floor.grid[y][x];if(e.def.aquatic&&tile!==2)return false;if(!e.def.aquatic&&tile===2)return false;return true;}
function enemyTurn(){for(const e of game.enemies){if(e.isDog)continue;
  // Dog Walker: moves and leaves poop bombs
  if(e.def&&e.def.isDogWalker){
    if(e.stun>0){e.stun--;continue;}
    const dist=Math.abs(e.x-game.px)+Math.abs(e.y-game.py);
    if(dist===1){if(hasStatus("invincible")){continue;}const dmg=Math.max(1,roll(e.scaledAtk||e.def.atk)-Math.floor(effDef()/2));game.hp-=dmg;if(typeof sfxOof==="function")sfxOof();log(e.def.name+" hits you for "+dmg+".","red");if(game.hp<=0){die(e.def.name+", who he insists he was about to defeat",e.isBoss?"boss":"creature");return;}}
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
  if(dist===1){if(hasStatus("invincible")){log(e.def.name+" cannot touch you. Maximum Dad Relief is in effect.","gold");continue;}if(e.blind>0){e.blind--;if(Math.random()<0.6){log(e.def.name+" swings wildly and misses.","dim");continue;}}const dmg=Math.max(1,roll(e.scaledAtk||e.def.atk)-Math.floor(effDef()/2));game.hp-=dmg;if(typeof sfxOof==="function")sfxOof();log(e.def.name+" hits you for "+dmg+".","red");if(game.hp<=0){die(e.def.name+", who he insists he was about to defeat",e.isBoss?"boss":"creature");return;}}
  else if(dist<=7&&e.root<=0){const _ox=e.x,_oy=e.y;const sx=e.x+Math.sign(game.px-e.x),sy=e.y+Math.sign(game.py-e.y);if(canMoveEnemy(e,sx,e.y))e.x=sx;else if(canMoveEnemy(e,e.x,sy))e.y=sy;if(e.x!==_ox||e.y!==_oy){const _dd=doorAt(e.x,e.y);e.justCameThruDoor=!!(_dd&&_dd.open);}}else if(e.root>0)e.root--;
  const _pt=game.traps.find(t=>!t.sprung&&t.fromPlayer&&t.x===e.x&&t.y===e.y);if(_pt)springTrapOn(e,_pt);}}
/* ===== BFS click-to-move pathfinding ===== */
/* MOB-02: a door does not swing shut on a creature, a companion, a vendor or an item lying in the doorway. */
function _doorOccupied(d){return game.enemies.some(e=>e.x===d.x&&e.y===d.y)||game.loot.some(l=>l.x===d.x&&l.y===d.y)||!!(game.ally&&game.ally.x===d.x&&game.ally.y===d.y)||!!(game.vendor&&game.vendor.x===d.x&&game.vendor.y===d.y);}
/* MOB-17: auto-walk routes around known, unsprung traps (the tapped tile itself is allowed); if that leaves no route, the old path is used. */
function _knownTrapAt(x,y){return game.traps.some(t=>t.known&&!t.sprung&&t.x===x&&t.y===y);}
function bfsPath(x0,y0,x1,y1){if(game.traps&&game.traps.some(t=>t.known&&!t.sprung)){const p=_bfsPath(x0,y0,x1,y1,true);if(p)return p;}return _bfsPath(x0,y0,x1,y1,false);}
function _bfsPath(x0,y0,x1,y1,avoid){
 if(x0===x1&&y0===y1)return [];
 const dist=[];for(let y=0;y<MAP_H;y++)dist.push(new Array(MAP_W).fill(-1));
 dist[y0][x0]=0;const q=[[x0,y0]];
 while(q.length){const[cx,cy]=q.shift();if(cx===x1&&cy===y1)break;
  for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=cx+dx,ny=cy+dy;
   if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H||dist[ny][nx]>=0)continue;
   if(game.floor.grid[ny][nx]===1)continue;
   const d=doorAt(nx,ny);if(d&&!d.open)continue;
   if(avoid&&!(nx===x1&&ny===y1)&&_knownTrapAt(nx,ny))continue;
   dist[ny][nx]=dist[cy][cx]+1;q.push([nx,ny]);}}
 if(dist[y1][x1]<0)return null;
 const path=[];let cx=x1,cy=y1;
 while(cx!==x0||cy!==y0){for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=cx+dx,ny=cy+dy;
  if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)continue;
  if(dist[ny][nx]===dist[cy][cx]-1){path.unshift([cx-nx,cy-ny]);cx=nx;cy=ny;break;}}}
 return path;}
/* MOB-01: shortest path to a floor tile orthogonally next to closed door d (null if none reachable). */
function pathToDoor(d){let best=null;for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=d.x+dx,ny=d.y+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H||game.floor.grid[ny][nx]===1)continue;const od=doorAt(nx,ny);if(od&&!od.open)continue;const p=bfsPath(game.px,game.py,nx,ny);if(p&&(!best||p.length<best.length))best=p;}return best;}
/* MOB-05: shortest path to an open tile next to wall (wx,wy), any of its 8 neighbors (null if none reachable). */
function pathToWall(wx,wy){let best=null;for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]]){const nx=wx+dx,ny=wy+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H||game.floor.grid[ny][nx]===1)continue;const od=doorAt(nx,ny);if(od&&!od.open)continue;const p=bfsPath(game.px,game.py,nx,ny);if(p&&p.length&&(!best||p.length<best.length))best=p;}return best;}
/* MOB-01: the walk ended without a halt next to the tapped door: offer the door menu. */
function _doorArrive(){const cd=game.clickDoor;game.clickDoor=null;if(!cd||mode!==State.PLAY||pendingConfirm||pendingMenu)return;const d=doorAt(cd.x,cd.y);if(!d||d.open)return;if(Math.abs(d.x-game.px)+Math.abs(d.y-game.py)!==1)return;openDoorMenu(d);}
function continueClickPath(){
 if(!game||!game.clickPath||!game.clickPath.length)return;
 if(mode!==State.PLAY||pendingConfirm||pendingMenu)return;
 if(ovInv||ovDad||ovBest||ovInstr||aiming||placing||shopOpen)return;
 const[dx,dy]=game.clickPath.shift();
 const lastHp=game.hp;
 const badBefore=badStatusCount();
 const _inView=e=>!!(game.vis&&game.vis[e.y]&&game.vis[e.y][e.x]);const seenBefore=game.enemies.filter(_inView);
 tryMove(dx,dy);
 // M7: auto-travel also halts when an enemy that was not visible before this step comes into view.
 if(game&&game.clickPath&&game.clickPath.length&&mode===State.PLAY&&game.hp>=lastHp&&badStatusCount()<=badBefore&&game.enemies.some(e=>_inView(e)&&!seenBefore.includes(e))){log("Auto-travel halted. Something has entered the field of view. He stops, squints, and assumes a ready stance.","dim");game.clickPath=[];game.clickDoor=null;return;}
 // Auto-travel halts the moment anything goes wrong: HP loss OR any new negative status
 // (traps, thirst, the knee, the back, blindness — the universe's full catalogue of interruptions).
 if(game&&(game.hp<lastHp||badStatusCount()>badBefore)){if(game.clickPath.length)log("Auto-travel halted. Something went wrong, as it does. He proceeds on foot, alert and mildly betrayed.","dim");game.clickPath=[];game.clickDoor=null;}
 if(game&&game.clickDoor&&!game.clickPath.length&&mode===State.PLAY)_doorArrive();}
function badStatusCount(){if(!game||!game.statuses)return 0;let n=0;for(const id in game.statuses){if(game.statuses[id]&&STATUSES[id]&&STATUSES[id].bad)n++;}return n;}
/* ===== movement ===== */
function napBlocked(){if(hasStatus("backlock")){log("Your back has locked up. You cannot move. You wait for it to pass, as you always do.","dim");endTurn();return true;}if(hasStatus("nap")){log("You are one with the recliner. Cannot act.","dim");endTurn();return true;}if(hasStatus("coma")&&Math.random()<0.5){log("Free samples cloud your mind. Turn lost.","dim");endTurn();return true;}return false;}
/* ===== inherent Dad-body pain: knee (on movement) + back (on bending to pick up) ===== */
function hasKneeRelief(){return eqList().some(g=>g&&g.kneeRelief);}
// Pain odds grow PER FLOOR ONLY. Deeper into the suburbs, the body deteriorates further.
// No per-step escalation, no reset on each twinge — the floor sets the toll. Meds (line ~162) can still buy relief for the current floor.
function painChanceForFloor(depth){return Math.min(0.95,0.05+0.012*((depth||1)-1));}
function updatePainChances(){const c=painChanceForFloor(game.depth);game.kneeChance=c;game.backChance=c;}
function kneePainTick(){
 if(hasKneeRelief())return; // Knee Sleeves spare the knees their cracks and their toll
 if(Math.random()<0.10){log("*knee crack* (Dad Noise)","dim");if(typeof sfxKneeCrack==="function")sfxKneeCrack();}
 if(Math.random()<(game.kneeChance||0.05)){game.hp=Math.max(0,game.hp-1);log("The knee buckles. -1 HP. It comes when it comes.","red");if(game.hp<=0){die("a knee that finally filed for early retirement, mid-step, on a floor that did nothing to deserve the blame","knee");return;}}}
function backPainTick(){
 if(Math.random()<(game.backChance||0.05)){game.hp=Math.max(0,game.hp-1);log("Your back goes out as you straighten up. -1 HP. Of course it's now.","red");if(game.hp<=0){die("a back that gave out while bending down to pick up something that, in hindsight, was not worth it","back");return;}
  if(Math.random()<0.10){applyStatus("backlock",3);log("It SEIZES. You are paralyzed for 3 turns. You do not call for help. A man does not.","red");}}}
function waitTurn(){if(mode!==State.PLAY||pendingConfirm)return;log("You wait. The dread accumulates.","dim");endTurn();}
// Pick up a specific loot-array entry by index. Split out of tryMove so a tile piled with
// multiple items can offer a choice menu instead of silently grabbing whatever is first in the array.
function pickupLootAt(idx){const l=game.loot[idx];if(!l)return;if(l.item.kind==="gold"){game.gold+=l.item.amount;game.moolahEarned=(game.moolahEarned||0)+l.item.amount;log("Picked up "+l.item.amount+" moolah.","gold");game.loot.splice(idx,1);syncUI();return;}openConfirm("Pick up "+itemDisplayName(l.item)+"?",()=>{if(addItem(l.item)){log("Picked up "+itemDisplayName(l.item)+".","grn");if(typeof sfxPickup==="function")sfxPickup();game.itemsFound=(game.itemsFound||0)+1;tryCompleteFetchQuest(l.item);game.loot.splice(idx,1);backPainTick();}syncUI();});}
function tryMove(dx,dy){if(mode!==State.PLAY||pendingConfirm)return;if(napBlocked())return;if(hasStatus("drunk")&&Math.random()<0.30){const rd=[[0,-1],[0,1],[-1,0],[1,0]][Math.floor(Math.random()*4)];dx=rd[0];dy=rd[1];log("Your feet navigate independently.","red");}clearScanMessages();const nx=game.px+dx,ny=game.py+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)return;if(game.floor.grid[ny][nx]===1)return;
 const d=doorAt(nx,ny);if(d&&!d.open){openDoorMenu(d);return;}
 if(game.vendor&&game.vendor.x===nx&&game.vendor.y===ny){openShop();return;}
 const fn=game.fountains&&game.fountains.find(f=>f.x===nx&&f.y===ny);if(fn){useFountain(fn);return;}
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
 if(tryFumble("your footing"))return;
 game.px=nx;game.py=ny;kneePainTick();if(game.hp<=0)return;
 if(game.floor.grid[ny][nx]===2){applyStatus("soaked",3);log("You wade into the water. Socks: ruined.","blu");}
 const lMatches=[];for(let _i=0;_i<game.loot.length;_i++)if(game.loot[_i].x===nx&&game.loot[_i].y===ny)lMatches.push(_i);
 if(lMatches.length>1){openMenu("Several things are piled here. Grab which one?",lMatches.map(_i=>({label:itemDisplayName(game.loot[_i].item)+(game.loot[_i].item.kind==="gold"?" ("+game.loot[_i].item.amount+"g)":""),fn:function(){pickupLootAt(_i);}})));}
 else if(lMatches.length===1)pickupLootAt(lMatches[0]);
 // Traps ALWAYS trigger when stepped on — visible or not — unless the Light Step talent spares you.
 const ti=game.traps.findIndex(t=>t.x===nx&&t.y===ny&&!t.sprung);if(ti>=0){const t=game.traps[ti];if(game.lightStep)log("You step clean over the "+t.def.name+" without breaking stride. Light Step earns its keep.","dim");else springTrap(t);}
 if(nx===game.stairs.x&&ny===game.stairs.y)openConfirm("Descend to Floor "+(game.depth+1)+"?",doDescend);if(game.stairsUp&&nx===game.stairsUp.x&&ny===game.stairsUp.y)openConfirm(game.ascent&&game.depth===1?"Push open the basement door and carry the Remote home?":"Ascend to Floor "+(game.depth-1)+"?",doAscend);
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
function endTurn(){game.turn++;tickStatuses();survivalTick();if(mode===State.PLAY)enemyTurn();if(mode===State.PLAY)allyTurn();if(mode===State.PLAY){let doorsChanged=false;for(const d of game.doors){if(d.open){const onDoor=(game.px===d.x&&game.py===d.y)||(game.ally&&game.ally.following&&game.ally.x===d.x&&game.ally.y===d.y);if(onDoor){d.playerWasOn=true;}else if(_doorOccupied(d)){/* MOB-02: something is standing (or lying) in the doorway; the door waits */}else{const turnsSinceOpen=game.turn-(d.openTurn||game.turn);if(d.playerWasOn||turnsSinceOpen>=3){d.open=false;d.playerWasOn=false;doorsChanged=true;}}}}if(doorsChanged)computeVis();}if(mode===State.PLAY)hoaFinaleTick();if(mode===State.PLAY)saveRun();if(mode===State.PLAY&&game.clickPath&&game.clickPath.length)setTimeout(continueClickPath,120);if(mode===State.PLAY)offerTalentIfReady();syncUI();}
/* ===== throwing (+ trap disarm, persistent landing) ===== */
function startThrow(e){if(!e.it.throw){log(e.it.name+" isn't meant for throwing.","dim");return;}throwRef=e;aiming=true;closeOverlays();log("Throw "+e.it.name+" — press a direction.","blu");}
function doThrow(dx,dy){aiming=false;const it=throwRef.it;let x=game.px,y=game.py;const path=[];let hitE=null,hitT=null;
 for(let i=0;i<(it.throw.range||8);i++){x+=dx;y+=dy;if(x<0||y<0||x>=MAP_W||y>=MAP_H||game.floor.grid[y][x]===1)break;const dr=doorAt(x,y);if(dr&&!dr.open)break;path.push({x,y});const en=game.enemies.find(e=>e.x===x&&e.y===y);if(en){hitE=en;break;}const tr=game.traps.find(t=>t.x===x&&t.y===y&&!t.sprung);if(tr){hitT=tr;break;}}
 addFX({kind:"proj",cells:path.slice(),i:0,life:path.length*2+2,spr:lootSprite(it)});
 let landed=null;
 if(hitE){const dmg=(it.throw.dmg||3);hitE.hp-=dmg;hitE.shownHP=true;discover(hitE.def,game.depth);log("You hurl "+itemDisplayName(it)+" at "+hitE.def.name+". "+dmg+" dmg!","gold");if(it.throw.status){applyTo(hitE,it.throw.status);}if(hitE.hp<=0){game.kills=(game.kills||0)+1;const _g=hitE.def.gold||0;game.gold+=_g;game.moolahEarned=(game.moolahEarned||0)+_g;log(hitE.def.name+" defeated by airborne object. +"+hitE.def.xp+" XP"+(_g>0?", +"+_g+" moolah":""),"gold");gainXP(hitE.def.xp);game.enemies=game.enemies.filter(z=>z!==hitE);}}
 else if(hitT){const chance=0.55+effPer()*0.04;if(Math.random()<chance){hitT.sprung=true;log("Direct hit! You disarm the "+hitT.def.name+" from a safe distance.","gold");if(Math.random()<0.5){log(it.name+" is destroyed in the process.","dim");}else landed={x:hitT.x,y:hitT.y};}else{log("You miss the "+hitT.def.name+". It's still armed.","red");landed={x:hitT.x,y:hitT.y};}}
 else{log("You throw "+itemDisplayName(it)+". It clatters to the floor.","dim");if(path.length)landed=path[path.length-1];}
 if(landed)game.loot.push({x:landed.x,y:landed.y,item:it});
 removeEntry(throwRef,1);throwRef=null;endTurn();}
function applyTo(e,st){if(st==="soaked"){e.blind=Math.max(e.blind,1);log(e.def.name+" is soaked and sputtering.","blu");}else e[st]=(e[st]||0)+2;}
/* ===== crafting ===== */
/* combine-reference helpers — a combinable thing is either an inventory entry
   ({src:"inv",e}) or a worn item in an equipment slot ({src:"equip",slot}). */
function refItem(r){return !r?null:(r.src==="equip"?game.equip[r.slot]:(r.e?r.e.it:null));}
function refConsume(r){if(r.src==="equip"){const it=game.equip[r.slot];game.equip[r.slot]=null;return it;}removeEntry(r.e,1);return r.e?r.e.it:null;}
function sameRef(a,b){if(!a||!b)return false;if(a.src!==b.src)return false;return a.src==="equip"?a.slot===b.slot:a.e===b.e;}
function tryCraft(refA,refB){
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
 const a=itA.id,b=itB.id;const rec=RECIPES.find(r=>(r.a===a&&r.b===b)||(r.a===b&&r.b===a));if(!rec){log("Those two do not combine. (Yet.)","dim");return;}if(rec.lock&&game.cls.id!==rec.lock){log("Only "+CLASSES.find(c=>c.id===rec.lock).name+" can make that.","red");return;}if(rec.classes&&!rec.classes.includes(game.cls.id)){log("Only the handy sorts (DIY, Tactical, Tech) can rig that.","red");return;}let base=0.7;if(rec.bonus&&game.cls.id===rec.bonus)base=0.95;if(game.cls.craft!=="none"&&!rec.lock)base+=0.05;const wasEquipped=(refA.src==="equip"||refB.src==="equip");refConsume(refA);refConsume(refB);if(wasEquipped)log("You strip a worn piece off to feed it into the project. Bold.","dim");if(Math.random()>base){log("The craft fails. A Learning Experience.","red");addItem(mkObject("ducttape"));combineMark=null;return;}const o=rec.out;let made;if(["weapon","armor","charm"].includes(o.kind))made=mkGear(o,o.kind,Math.random,true);else if(o.kind==="consumable")made=Object.assign({kind:"consumable"},o);else made=Object.assign({kind:"object"},o);addItem(made);if(typeof sfxCraft==="function")sfxCraft();log("CRAFTED: "+o.name+"!","gold");
 // Crafting a previously-undiscovered recipe records it in the Compendium.
 {const _rk=rec.a+"+"+rec.b;if(!game.knownRecipes)game.knownRecipes=[];if(!game.knownRecipes.includes(_rk)){game.knownRecipes.push(_rk);log("Recipe learned — now recorded in the Compendium [J].","blu");}}
 combineMark=null;}
/* ===== dadisms ===== */
function adjEnemies(){return game.enemies.filter(e=>Math.abs(e.x-game.px)+Math.abs(e.y-game.py)===1);}
function weaponReach(){return(game.equip&&game.equip.weapon&&game.equip.weapon.reach)||1;}
function castDadism(id){const d=DADISMS.find(x=>x.id===id);if(!d)return;if(game.moxie<d.cost){log("Not enough Patience for "+d.name+".","red");return;}game.moxie-=d.cost;
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
  if(!game.ally.questOffered){game.ally.questOffered=true;log(def.name+": "+def.intro,"gold");log(def.name+": \""+def.quest.text+"\"","gold");}
  else{log(def.name+" is still waiting on you. \""+def.quest.text+"\"","dim");}
  endTurn();return;}
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
function allyHit(def,t){
 const dmg=Math.max(1,def.atk-Math.floor(t.def.def/3));t.hp-=dmg;t.shownHP=true;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:6,color:"#37b0b0"});log(def.name+" hits "+t.def.name+" for "+dmg+".","dim");
 if(t.hp<=0){log(t.def.name+" defeated by "+def.name+".","gold");gainXP(Math.floor(t.def.xp/2));game.gold+=Math.floor(t.def.gold/2);tryCompleteHuntQuest(t);game.enemies=game.enemies.filter(x=>x!==t);if(game.allyOrder&&game.allyOrder.type==="attack"&&game.allyOrder.target===t)game.allyOrder=null;}}
function allySufferAdjacent(def){
 const A=game.ally;const hits=game.enemies.filter(en=>!en.isDog&&Math.abs(en.x-A.x)+Math.abs(en.y-A.y)===1);
 for(const h of hits){const dmg=Math.max(0,(h.scaledAtk||h.def.atk)-def.def);if(dmg>0){A.hp-=dmg;}}
 if(A.hp<=0){const _defMsg=def.defeatMsg?def.defeatMsg:(def.name+" has been defeated. They did what they could.");log(_defMsg,"red");game.ally=null;game.allyOrder=null;}}
function allyTurn(){
 if(!game.ally||!game.ally.following)return;
 const def=typeof ALLIES!=="undefined"?ALLIES.find(a=>a.id===game.ally.defId):null;
 if(!def)return;
 const A=game.ally;
 // Little Timmy asks the questions every dad knows. You do not have to answer.
 if(def.id==="little_timmy"&&typeof TIMMY_QUESTIONS!=="undefined"&&Math.random()<0.12){log("Little Timmy: \""+TIMMY_QUESTIONS[Math.floor(Math.random()*TIMMY_QUESTIONS.length)]+"\"","dim");}
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
 // 3) Default leash AI — engage only within ALLY_LEASH tiles of the player, otherwise stay close
 const adj=game.enemies.find(en=>Math.abs(en.x-A.x)+Math.abs(en.y-A.y)===1&&!en.isDog);
 if(adj){allyHit(def,adj);return;}
 const tgt=game.enemies.filter(en=>!en.isDog&&(Math.abs(en.x-game.px)+Math.abs(en.y-game.py))<=ALLY_LEASH).sort((a,b)=>(Math.abs(a.x-A.x)+Math.abs(a.y-A.y))-(Math.abs(b.x-A.x)+Math.abs(b.y-A.y)))[0];
 if(tgt){allyStepToward(tgt.x,tgt.y);allySufferAdjacent(def);return;}
 allyCatchUp();
 allySufferAdjacent(def);}
/* MOB-10: when not fighting, the companion stays within ALLY_LEASH tiles (8-way count) of Dad: farther than that, it follows the walkable path
   (not a straight line into a wall) and jogs up to 2 tiles a turn until it is back in range. In range but more than ALLY_LEASH walking steps away
   (the other side of a wall), it takes one step along the path so it does not get left behind the next time Dad moves. */
function allyCatchUp(){const A=game.ally;const far=()=>Math.max(Math.abs(A.x-game.px),Math.abs(A.y-game.py));
 const step=()=>{const p=bfsPath(A.x,A.y,game.px,game.py);const s=p&&p[0];if(s&&p.length>1&&canStep(A.x+s[0],A.y+s[1])){A.x+=s[0];A.y+=s[1];return true;}return allyStepToward(game.px,game.py);};
 if(far()<=ALLY_LEASH){const p=bfsPath(A.x,A.y,game.px,game.py);if(p?p.length>ALLY_LEASH:Math.abs(A.x-game.px)+Math.abs(A.y-game.py)>ALLY_LEASH)step();return;}
 for(let i=0;i<2&&far()>ALLY_LEASH;i++){if(!step())break;}}


/* ===== FX ===== */
function addFX(f){game.fx.push(f);}
/* ===== leveling ===== */
function gainXP(n){game.xp+=n;while(game.xp>=game.xpNext){game.xp-=game.xpNext;levelUp();}}
function levelUp(){game.level++;game.xpNext=Math.floor(game.xpNext*1.4)+4;game.maxhp+=6+game.level;game.hp=game.maxhp;const pool=["str","def","wis"];const s=pool[Math.floor(Math.random()*pool.length)];game[s]++;game.maxmoxie++;game.moxie=game.maxmoxie;game.hungerCap=Math.min(250,(game.hungerCap||100)+2);game.hydraCap=Math.min(250,(game.hydraCap||100)+2);log("LEVEL UP! Lv"+game.level+". +HP, +"+s.toUpperCase()+". Stamina growing.","gold");if(game.level%5===0)log("MILESTONE! Level "+game.level+". A Dad Talent unlocks. Inventory expanded. He carries more than anyone should. He is, somehow, more prepared.","gold");else log("Level "+game.level+". Stats up. Talents unlock every 5 levels.","dim");if(game.level%5===0){game.talentPicks=(game.talentPicks||0)+1;offerTalentIfReady();}}
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
function _restoreFloorFromCache(cache,fromBelow){if(game.ally&&!game.ally.following)game.ally=null;const f=genFloor(game.depth,game.seed);game.floor=f;game.doors=cache.doors;game.secrets=cache.secrets;game.openedSecrets=cache.openedSecrets||[];game.openedSecrets.forEach(p=>{if(f.grid[p.y]&&f.grid[p.y][p.x]!==undefined)f.grid[p.y][p.x]=0;});game.globalReveal=false;game.fx=[];game.vendor=cache.vendor;game.seen=cache.seen;game.vis=[];for(let y=0;y<MAP_H;y++)game.vis.push(new Array(MAP_W).fill(false));game.enemies=cache.enemies;game.loot=cache.loot;game.traps=cache.traps;game.fountains=cache.fountains;game.healFountains=cache.healFountains;game.stairs=cache.stairsDown;game.stairsUp=cache.stairsUp;game.px=fromBelow?cache.stairsDown.x:(cache.stairsUp?cache.stairsUp.x:f.rooms[0].cx);game.py=fromBelow?cache.stairsDown.y:(cache.stairsUp?cache.stairsUp.y:f.rooms[0].cy);if(game.ally&&game.ally.following){game.ally.x=game.px;game.ally.y=game.py;}_settlePlacements();computeVis();}
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
 const body=(clip.title?('<span class="l-gold">'+clip.title+'</span><br>'):'')+(tag?('<i>'+tag+'</i><br><br>'):'')+clip.intro;
 openMenu(body,[{label:"Onward, then.",fn:function(){}}]);
}
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
  back:"You're not defeated. Your back 'locked up' bending over, and you are now flat on a dungeon floor loudly insisting you are fine."
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
function startAscent(){if(game.ascent)return;game.ascent=true;game.ascentDone=false;mode=State.PLAY;game.depth=MAXDEPTH;game.floorCache={};game.seed=((game.seed^0x5ADDAD)+1337)>>>0;log("You turn around. One hundred floors of suburbia stand between you and the thermostat, and every single one of them has heard about the Remote.","gold");log("Taped to the stairwell wall, in crayon: \"GO DAD GO. bring snacks.\"","grn");updatePainChances();game.moxie=game.maxmoxie;buildFloor();saveRun();syncUI();}
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
function saveRun(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({clsId:game.cls.id,skin:game.skin||0,seed:game.seed,isDaily:!!game.isDaily,ascent:!!game.ascent,ascentDone:!!game.ascentDone,dailyDate:game.dailyDate||null,depth:game.depth,diffId:game.diff?game.diff.id:"weekend_warrior",hp:game.hp,maxhp:game.maxhp,str:game.str,def:game.def,per:game.per,wis:game.wis,moxie:game.moxie,maxmoxie:game.maxmoxie,level:game.level,xp:game.xp,xpNext:game.xpNext,gold:game.gold,equip:game.equip,inv:game.inv,dadisms:game.dadisms,statuses:game.statuses,inspectPts:game.inspectPts,hydraSlow:game.hydraSlow,kneeChance:game.kneeChance,backChance:game.backChance,px:game.px,py:game.py,ally:game.ally?{defId:game.ally.defId,hp:game.ally.hp,maxhp:game.ally.maxhp,x:game.ally.x,y:game.ally.y,following:!!game.ally.following,questDone:!!game.ally.questDone,questOffered:!!game.ally.questOffered}:null,allyMet:game.allyMet||[],biomesSeen:game.biomesSeen||[],knownRecipes:game.knownRecipes||[],knownConsumables:game.knownConsumables||[],keyring:game.keyring||[],floorCache:game.floorCache||{},kills:game.kills||0,consumed:game.consumed||0,talentPicks:game.talentPicks||0,talents:game.talents||[],foodLuck:game.foodLuck||0,lightStep:!!game.lightStep,foodEaten:game.foodEaten||0,drinksTaken:game.drinksTaken||0,moolahEarned:game.moolahEarned||0,itemsFound:game.itemsFound||0,hoaSeen:!!game.hoaSeen,hoaDone:!!game.hoaDone}));}catch(e){}}
function clearRun(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
function hasSave(){try{return !!localStorage.getItem(SAVE_KEY);}catch(e){return false;}}
function continueRun(){let s;try{s=JSON.parse(localStorage.getItem(SAVE_KEY));}catch(e){return false;}if(!s)return false;
 const cls=CLASSES.find(c=>c.id===s.clsId)||CLASSES[0];
 game={cls,skin:(typeof s.skin==="number"?s.skin:0),seed:s.seed,isDaily:!!s.isDaily,ascent:!!s.ascent,ascentDone:!!s.ascentDone,dailyDate:s.dailyDate||null,diff:(typeof DIFFICULTY_MODES!=="undefined"?DIFFICULTY_MODES.find(d=>d.id===(s.diffId||"weekend_warrior")):null)||null,depth:s.depth,hp:s.hp,maxhp:s.maxhp,str:s.str,def:s.def,per:s.per,wis:s.wis,moxie:s.moxie,maxmoxie:s.maxmoxie,level:s.level,xp:s.xp,xpNext:s.xpNext,gold:s.gold,equip:s.equip||{weapon:null,head:null,torso:null,arms:null,legs:null,feet:null,charm1:null,charm2:null},inv:s.inv||[],dadisms:s.dadisms||[],statuses:s.statuses||{},inspectPts:s.inspectPts||0,inspectedKeys:{},moxTick:0,hydraSlow:s.hydraSlow||0,kneeChance:s.kneeChance||0.05,backChance:s.backChance||0.05,hungerCap:100,hydraCap:100,globalReveal:false,drunkStack:0,px:s.px,py:s.py,enemies:[],loot:[],traps:[],doors:[],secrets:[],fountains:[],healFountains:[],waterFloors:[],fountainFloors:[],healFountainFloors:[],vendor:null,stairs:{x:0,y:0},stairsUp:null,floorCache:s.floorCache||{},floor:null,seen:null,vis:null,fx:[],turn:0,kills:s.kills||0,consumed:s.consumed||0,foodLuck:s.foodLuck||0,lightStep:!!s.lightStep,foodEaten:s.foodEaten||0,drinksTaken:s.drinksTaken||0,moolahEarned:s.moolahEarned||0,itemsFound:s.itemsFound||0,hoaSeen:!!s.hoaSeen,hoaDone:!!s.hoaDone};
 buildFloor();game.px=s.px;game.py=s.py;
 if(s.ally){game.ally=s.ally;if(game.ally.following){game.ally.x=s.px;game.ally.y=s.py;}}
 game.allyOrder=null;
 game.allyMet=s.allyMet||[];game.knownRecipes=s.knownRecipes||[];game.knownConsumables=s.knownConsumables||[];game.keyring=s.keyring||[];game.talentPicks=s.talentPicks||0;game.talents=s.talents||[];game.biomesSeen=s.biomesSeen||biomesSeenUpTo(game.depth);_settlePlacements();computeVis();messages=[];log("Run resumed. Floor "+game.depth+".","gold");mode=State.PLAY;syncUI();return true;}
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
  if(it.idd===false)p*=0.55; // a mystery item fetches less at the desk
  else{const hasHelp=(it.affixes||[]).some(a=>a.type==="help");const cursed=(it.affixes||[]).some(a=>a.type==="hinder")&&!it.uncursed;if(cursed)p*=0.15;else if(hasHelp)p*=1.3;}
 }
 return Math.max(1,Math.floor(p));}
function sellItem(idx){const e=game.inv[idx];if(!e)return;const it=e.it;const sp=sellPrice(it);const nm=itemDisplayName(it);game.gold+=sp;removeEntry(e,1);log("Sold "+nm+" for "+sp+" moolah. The vendor will resell it at a markup. That is the way of things.","grn");buildShop();syncUI();}
function openShop(){shopOpen=true;buildShop();syncOverlays();}
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
 const unknown=RECIPES.filter(r=>!known.includes(r.a+"+"+r.b));
 if(!unknown.length){log("You watch the YallTube video. You already know all those recipes. The comments remain disabled.","dim");removeEntry(e,1);endTurn();return;}
 const r=unknown[Math.floor(Math.random()*unknown.length)];
 if(!game.knownRecipes)game.knownRecipes=[];
 game.knownRecipes.push(r.a+"+"+r.b);
 log("YallTube reveals: "+r.desc+" Now shown in the Compendium [J].","gold");
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
function springTrapOn(e,t){t.sprung=true;const d=t.def;const dmg=d.dmg||4;e.hp-=dmg;e.shownHP=true;addFX({kind:"blast",cells:[{x:t.x,y:t.y}],t:0,life:10,color:"#e0453a"});log("Your "+d.name+" springs on "+e.def.name+"! "+dmg+" dmg.","gold");if(d.status==="nap"||d.status==="coma")e.stun=Math.max(e.stun||0,2);else if(d.status)e.root=Math.max(e.root||0,2);if(e.hp<=0){const _g=e.def.gold||0;game.gold+=_g;game.moolahEarned=(game.moolahEarned||0)+_g;log(e.def.name+" is undone by your craftsmanship. +"+e.def.xp+" XP"+(_g>0?", +"+_g+" moolah":""),"gold");gainXP(e.def.xp);game.enemies=game.enemies.filter(x=>x!==e);}}
function startPlace(e){if(!e||!e.it.placeable){log("That can't be placed.","dim");return;}placeRef=e;placing=true;closeOverlays();log("Place "+e.it.name+" — press a direction (Esc cancels).","blu");}
function quickPlace(){const e=game.inv.find(en=>en.it.placeable);if(!e){log("No traps to place. Craft one first (DIY/Tactical/Tech).","dim");return;}startPlace(e);}
function quickThrow(){const e=game.inv.find(en=>en.it.throw);if(!e){log("Nothing throwable in the bag. Find or craft something aerodynamic.","dim");return;}startThrow(e);}
function placeTrap(dx,dy){placing=false;const e=placeRef;placeRef=null;if(!e||!e.it.placeable||!game.inv.includes(e)){log("Nothing to place.","dim");return;}const tx=game.px+dx,ty=game.py+dy;if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H||game.floor.grid[ty][tx]===1){log("Can't place a trap there.","dim");return;}if(game.traps.some(t=>t.x===tx&&t.y===ty&&!t.sprung)){log("Something's already there.","dim");return;}removeEntry(e,1);const td=TRAPS_DEF.find(t=>t.id===e.it.trapId)||TRAPS_DEF[0];game.traps.push({def:td,x:tx,y:ty,sprung:false,known:true});log("You carefully place the "+e.it.name+". Dad craftsmanship, deployed.","blu");computeVis();}
/* ===== inspect mode ===== */
const elInspect=document.getElementById("inspectbox");
function updateInspectBox(){if(!inspectOn){elInspect.classList.remove("show");return;}const r=inspectAt(insX,insY);if(r){elInspect.classList.add("show");elInspect.innerHTML='<div class="it">'+r.t+'</div><div>'+r.b+'</div>';}else{elInspect.classList.remove("show");}}
function showInspect(x,y){inspectOn=true;insX=x;insY=y;updateInspectBox();}
function toggleInspect(){inspectOn=!inspectOn;inspectKb=inspectOn;if(!inspectOn){elInspect.classList.remove("show");}else{insX=game.px;insY=game.py;showInspect(insX,insY);inspectKb=true;log("Inspect on— arrow keys to navigate, Esc to close.","dim");}}
function moveInspect(dx,dy){const nx=insX+dx,ny=insY+dy;if(nx<0||ny<0||nx>=MAP_W||ny>=MAP_H)return;insX=nx;insY=ny;showInspect(insX,insY);}
function clearMouseInspect(){if(!inspectKb&&inspectOn){inspectOn=false;elInspect.classList.remove("show");}}
