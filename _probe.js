const fs=require("fs"),vm=require("vm");
const ORDER=["js/config.js","js/sprites.js","js/data.js","js/game.js","js/render.js","js/ui.js","js/input.js"];
let js=ORDER.map(f=>fs.readFileSync(f,"utf8")).join("\n");
js+=`;globalThis.__T={State,CLASSES,MAP_W,MAP_H,newRun,tryMove,doDescend,getG:()=>game,getMode:()=>mode,setMode:m=>{mode=m;},setHP:h=>{game.maxhp=h;game.hp=h;},setPos:(x,y)=>{game.px=x;game.py=y;},getPend:()=>pendingConfirm,clearPend:()=>{pendingConfirm=null;},resolve:resolveConfirm,hasKey:()=>hasKey()};`;
const store={};const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k];}};
function fc(){return{getContext:()=>new Proxy({},{get:()=>()=>{}}),style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],width:320,height:240};}
const el=()=>({classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],style:{},set innerHTML(v){},textContent:"",getContext:()=>new Proxy({},{get:()=>()=>{}}),width:320,height:240});
const sb={localStorage,document:{getElementById:id=>id==="screen"||id==="mapcv"?fc():el(),addEventListener:()=>{},createElement:fc},window:{addEventListener:()=>{},innerWidth:1200,innerHeight:800},requestAnimationFrame:()=>{},Math,JSON,console,Array,Object,Proxy,globalThis:{}};
vm.createContext(sb);vm.runInContext(js,sb);const T=sb.globalThis.__T;
let g;
function bfsTo(tx,ty){const gr=g.floor.grid,vd=g.vendor,lockedSet=new Set(g.doors.filter(d=>d.locked).map(d=>d.x+","+d.y));const key=(x,y)=>x+","+y,q=[[g.px,g.py]],pv={},sn={[key(g.px,g.py)]:1};while(q.length){const[cx,cy]=q.shift();if(cx===tx&&cy===ty){let c=key(cx,cy),p=[];while(pv[c]){p.push(c);c=pv[c];}if(!p.length)return null;const f=p[p.length-1].split(",").map(Number);return[f[0]-g.px,f[1]-g.py];}for(const[dx,dy]of[[0,-1],[0,1],[-1,0],[1,0]]){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=T.MAP_W||ny>=T.MAP_H)continue;if(gr[ny][nx]===1)continue;if(!T.hasKey()&&lockedSet.has(key(nx,ny)))continue;if(vd&&vd.x===nx&&vd.y===ny)continue;const kk=key(nx,ny);if(sn[kk])continue;sn[kk]=1;pv[kk]=key(cx,cy);q.push([nx,ny]);}}return null;}
function forceDescend(){T.clearPend();g=T.getG();g.statuses={};T.setHP(99999);const sx=g.stairs.x,sy=g.stairs.y;T.setPos(sx,sy);g=T.getG();g.enemies=g.enemies.filter(e=>!(e.x===sx&&e.y===sy));T.tryMove(0,0);if(T.getPend())T.resolve(true);g=T.getG();if(g.px===sx&&g.py===sy&&T.getMode()===T.State.PLAY){T.clearPend();T.doDescend();}g=T.getG();}
const t0=Date.now();
T.newRun(T.CLASSES[0]);g=T.getG();let stuck=0,noMove=0,lp=-1;
for(let i=0;i<50000&&T.getMode()===T.State.PLAY;i++){
 T.setHP(99999);g=T.getG();g.hunger=0;g.hydra=0;g.statuses={};
 if(T.getPend()){T.resolve(true);g=T.getG();continue;}
 if(T.getMode()===T.State.DEAD){T.setMode(T.State.PLAY);T.setHP(99999);}
 let tgt=[g.stairs.x,g.stairs.y];
 if(g.doors.some(d=>d.locked)&&!T.hasKey()){const kl=g.loot.find(l=>l.item&&l.item.kind==="key");if(kl)tgt=[kl.x,kl.y];}
 const s=bfsTo(tgt[0],tgt[1]);const px=g.px,py=g.py;
 if(noMove>80||!s){forceDescend();noMove=0;}else{T.tryMove(s[0],s[1]);}
 if(T.getPend()){T.resolve(true);}g=T.getG();
 if(g.px===px&&g.py===py)noMove++;else noMove=0;
 if(g.px===px&&g.py===py&&g.depth===lp)stuck++;else stuck=0;lp=g.depth;
 if(i%1000===0)console.error("it="+i+" depth="+g.depth+" noMove="+noMove+" stuck="+stuck+" mode="+T.getMode()+" "+((Date.now()-t0)/1000).toFixed(1)+"s");
 if(stuck>300){console.error("STUCK depth",g.depth);break;}}
console.error("FINAL depth="+g.depth+" mode="+T.getMode()+" "+((Date.now()-t0)/1000).toFixed(1)+"s (WIN="+T.State.WIN+")");
