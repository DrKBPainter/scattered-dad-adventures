const fs=require("fs"),vm=require("vm");
const ORDER=["js/config.js","js/sprites.js","js/data.js","js/game.js","js/render.js","js/ui.js","js/input.js"];
for(const f of ORDER){if(!fs.existsSync(f)){console.log("MISSING FILE: "+f);process.exit(1);}}
let js=ORDER.map(f=>fs.readFileSync(f,"utf8")).join("\n");
try{new vm.Script(js);}catch(e){console.log("SYNTAX ERR:",e.message);process.exit(1);}
js+=`;globalThis.__T={State,CLASSES,CREATURES,BOSSES,PAL,MAP_W,MAP_H,SPR:{a:SPR_FLOOR,b:SPR_WALL,c:SPR_STAIRS,d:SPR_DAD,e:SPR_GEAR_W,f:SPR_GEAR_A,g:SPR_POTION,h:SPR_OBJECT,i:SPR_TRAP,j:SPR_DOOR,k:SPR_DOOR_L,l:SPR_KEY,m:SPR_CHARM,n:SPR_VENDOR,o:SPR_FRIDGE_NOTE},newRun,tryMove,doDescend,getG:()=>game,getMode:()=>mode,setMode:m=>{mode=m;},setHP:h=>{game.maxhp=h;game.hp=h;},setPos:(x,y)=>{game.px=x;game.py=y;},getPend:()=>pendingConfirm,clearPend:()=>{pendingConfirm=null;},resolve:resolveConfirm,hasKey:()=>hasKey(),opaque,computeVis};`;
const store={};const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k];}};
function fc(){return{getContext:()=>new Proxy({},{get:()=>()=>{}}),style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],width:320,height:240};}
const el=()=>({classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],style:{},set innerHTML(v){},textContent:"",getContext:()=>new Proxy({},{get:()=>()=>{}}),width:320,height:240});
const sb={localStorage,document:{getElementById:id=>id==="screen"||id==="mapcv"?fc():el(),addEventListener:()=>{},createElement:fc},window:{addEventListener:()=>{},innerWidth:1200,innerHeight:800},requestAnimationFrame:()=>{},Math,JSON,console,Array,Object,Proxy,globalThis:{}};
vm.createContext(sb);vm.runInContext(js,sb);const T=sb.globalThis.__T;let F=0;
const PK=new Set(Object.keys(T.PAL));
function cs(n,s){if(s.length!==32){console.log("SPR",n,"rows",s.length);F++;}for(const r of s){if(r.length!==32){console.log("SPR",n,"col",r.length,"(expected 32)");F++;}for(const c of r)if(!PK.has(c)){console.log("SPR",n,"char",JSON.stringify(c));F++;}}}
Object.entries(T.SPR).forEach(([n,s])=>cs(n,s));for(const c of T.CREATURES.concat(T.BOSSES))cs(c.id,c.sprite);
/* M13 atlas check: every key in assets/sprites/atlas.js resolves to a real sprite (SPR_* / creature id / boss id), rects are grid x k and inside an existing sheet */
if(fs.existsSync("assets/sprites/atlas.js")){let AN=0;try{vm.runInContext(fs.readFileSync("assets/sprites/atlas.js","utf8")+";globalThis.__A=SPRITE_ATLAS;",sb);}catch(e){console.log("ATLAS parse error:",e.message);F++;}
 const A=sb.globalThis.__A;if(A&&Array.isArray(A.sheets))for(const sh of A.sheets){if(!fs.existsSync(sh.src)){console.log("ATLAS missing sheet",sh.src);F++;continue;}const b=fs.readFileSync(sh.src),SW=b.readUInt32BE(16),SH=b.readUInt32BE(20);
  for(const[k,r]of Object.entries(sh.sprites||{})){let spr=null,m;
   /* M14 environment tiles: key format, slug in TILE_BIOMES (or "all"), exact TILE x TILE rect inside the sheet */
   if((m=/^tile:([a-z]+):([a-z]+):([a-z0-9]+)$/.exec(k))){const B=vm.runInContext("typeof TILE_BIOMES!=='undefined'?TILE_BIOMES:[]",sb);if(!(m[1]==="all"||B.includes(m[1]))){console.log("ATLAS unknown tile biome",k);F++;continue;}if(!(r.length===4&&r[2]===32&&r[3]===32&&r[0]>=0&&r[1]>=0&&r[0]+32<=SW&&r[1]+32<=SH)){console.log("ATLAS bad tile rect",k,JSON.stringify(r));F++;continue;}AN++;continue;}
   if((m=/^creature:(.+)$/.exec(k))){const c=T.CREATURES.find(x=>x.id===m[1]);spr=c&&c.sprite;}else if((m=/^boss:(.+)$/.exec(k))){const c=T.BOSSES.find(x=>x.id===m[1]);spr=c&&c.sprite;}else if(/^SPR_[A-Z0-9_]+$/.test(k)){try{spr=vm.runInContext("typeof "+k+"!=='undefined'?"+k+":null",sb);}catch(e){spr=null;}}
   if(!Array.isArray(spr)){console.log("ATLAS unknown key",k);F++;continue;}const kk=r[2]/spr[0].length;
   if(!(r.length===4&&kk>=1&&kk<=8&&kk===Math.floor(kk)&&r[3]===spr.length*kk&&r[0]>=0&&r[1]>=0&&r[0]+r[2]<=SW&&r[1]+r[3]<=SH)){console.log("ATLAS bad rect",k,JSON.stringify(r));F++;continue;}AN++;}}
 if(process.argv[2]===undefined||process.argv[2]==="atlas")console.log("atlas: "+AN+" sprite key(s) OK");}
if(process.argv[2]==="atlas")process.exit(F?1:0);
let g;
function bfsTo(tx,ty){
 const gr=g.floor.grid,vd=g.vendor,lockedSet=new Set(g.doors.filter(d=>d.locked).map(d=>d.x+","+d.y));
 const key=(x,y)=>x+","+y,q=[[g.px,g.py]],pv={},sn={[key(g.px,g.py)]:1};
 while(q.length){const[cx,cy]=q.shift();if(cx===tx&&cy===ty){let c=key(cx,cy),p=[];while(pv[c]){p.push(c);c=pv[c];}if(!p.length)return null;const f=p[p.length-1].split(",").map(Number);return[f[0]-g.px,f[1]-g.py];}
 for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=T.MAP_W||ny>=T.MAP_H)continue;if(gr[ny][nx]===1)continue;
  if(!T.hasKey()&&lockedSet.has(key(nx,ny)))continue;
  if(vd&&vd.x===nx&&vd.y===ny)continue;const kk=key(nx,ny);if(sn[kk])continue;sn[kk]=1;pv[kk]=key(cx,cy);q.push([nx,ny]);}}return null;}
function forceDescend(){
 T.clearPend();g=T.getG();g.statuses={};T.setHP(99999);
 const sx=g.stairs.x,sy=g.stairs.y;T.setPos(sx,sy);g=T.getG();
 g.enemies=g.enemies.filter(e=>!(e.x===sx&&e.y===sy));
 T.tryMove(0,0);if(T.getPend())T.resolve(true);
 g=T.getG();if(g.px===sx&&g.py===sy&&T.getMode()===T.State.PLAY){T.clearPend();T.doDescend();}g=T.getG();}
let wins=0;
for(let r=0;r<T.CLASSES.length;r++){T.newRun(T.CLASSES[r]);g=T.getG();let stuck=0,noMove=0,lp=-1;
 for(let i=0;i<50000&&T.getMode()===T.State.PLAY;i++){
  T.setHP(99999);g=T.getG();g.hunger=0;g.hydra=0;g.statuses={};
  if(T.getPend()){T.resolve(true);g=T.getG();continue;}
  if(T.getMode()===T.State.DEAD){T.setMode(T.State.PLAY);T.setHP(99999);}
  let tgt=[g.stairs.x,g.stairs.y];
  if(g.doors.some(d=>d.locked)&&!T.hasKey()){const kl=g.loot.find(l=>l.item&&l.item.kind==="key");if(kl)tgt=[kl.x,kl.y];}
  const s=bfsTo(tgt[0],tgt[1]);const px=g.px,py=g.py;
  if(noMove>80||!s){forceDescend();noMove=0;}
  else{T.tryMove(s[0],s[1]);}
  if(T.getPend()){T.resolve(true);}
  g=T.getG();
  if(g.px===px&&g.py===py)noMove++;else noMove=0;
  if(g.px===px&&g.py===py&&g.depth===lp)stuck++;else stuck=0;lp=g.depth;
  if(stuck>300){console.log("STUCK",T.CLASSES[r].id,"depth",g.depth);F++;break;}}
 if(T.getMode()===T.State.WIN)wins++;else if(stuck<=300){console.log("class",T.CLASSES[r].id,"ended depth",g.depth,"mode",T.getMode());F++;}}
console.log(F?(F+" FAILURE(S)"):"ALL DIAGNOSTICS PASS (clears "+wins+"/"+T.CLASSES.length+", sprites+FOV OK)");
process.exit(F?1:0);
