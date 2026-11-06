#!/usr/bin/env node
/* M13: sprite atlas tool (option C art upgrade).
   Reads the ASCII sprites (js/sprites.js + js/data.js), upgrades each one algorithmically
   (1px outline, 3-step highlight/base/shadow ramps from a top-left light), packs one PNG sheet
   per group into assets/sprites/, and writes the index assets/sprites/atlas.js that
   js/spriteimg.js loads. ASCII stays the source of truth and the fallback.

   Run from anywhere (paths are relative to the project root):
     node tools/tools_make_atlas.js                 rebuild the ENABLED groups' sheets + atlas.js
     node tools/tools_make_atlas.js --check         exit 1 if atlas.js / sheets are stale, a key does not
                                                    resolve, a rect is wrong, or a sheet is not in sw.js ASSETS
     node tools/tools_make_atlas.js --preview DIR   write ASCII-vs-upgraded comparison PNGs for EVERY group
                                                    to DIR (for visual review; not shipped)
     node tools/tools_make_atlas.js --list          list groups, their chunk, and sprite counts
   After a rebuild: add any NEW sheet to ASSETS in sw.js, then run node tools/tools_sw_stamp.js.

   Groups follow the plan's chunks, so each later chunk only flips its group into ENABLED
   (and may add per-sprite TUNING): items (M13), heroes (N22), bosses (N23),
   creatures by biome pair (N24-N28). Environment tiles are M14 (not generated here).
   Output is deterministic: same ASCII in -> byte-identical PNG out. */
"use strict";
const fs=require("fs"),path=require("path"),vm=require("vm"),zlib=require("zlib");
const ROOT=path.resolve(__dirname,"..");
const OUT_DIR="assets/sprites";

/* ---- groups switched on in the shipped atlas (edit this list in later chunks) ---- */
const ENABLED=["items","heroes"];

/* ---- per-sprite tuning hooks for later chunks: key -> {outline:false, shade:false} ---- */
const TUNING={};

/* ---------- load the game data in a sandbox (same stubs as _harness.js) ---------- */
function loadGame(){
 const files=["js/config.js","js/sprites.js","js/data.js"];
 let js=files.map(f=>fs.readFileSync(path.join(ROOT,f),"utf8")).join("\n");
 const fc=()=>({getContext:()=>new Proxy({},{get:()=>()=>{}}),style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],width:320,height:240});
 const el=()=>Object.assign(fc(),{textContent:""});
 const sb={localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  document:{getElementById:()=>el(),addEventListener(){},createElement:fc,querySelector:()=>null,querySelectorAll:()=>[],documentElement:{clientWidth:1200,clientHeight:800,style:{}},body:{classList:{add(){},remove(){},toggle(){},contains:()=>false},style:{}}},
  window:{addEventListener(){},innerWidth:1200,innerHeight:800,devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener(){}})},
  navigator:{userAgent:"node"},location:{search:"",protocol:"file:"},
  requestAnimationFrame(){},setTimeout(){},clearTimeout(){},Math,JSON,console,Array,Object,Proxy,Set,Map,WeakMap,globalThis:{}};
 vm.createContext(sb);vm.runInContext(js,sb,{filename:"game-data"});
 const names=[...js.matchAll(/^(?:const|let|var)\s+(SPR_[A-Z0-9_]+)\s*=/gm)].map(m=>m[1]);
 const get=n=>{try{return vm.runInContext("typeof "+n+"!=='undefined'?"+n+":undefined",sb);}catch(e){return undefined;}};
 const SPR={};for(const n of names){const v=get(n);if(Array.isArray(v))SPR[n]=v;}
 const G={};for(const n of["PAL","CREATURES","BOSSES","CLASSES","ALLIES","FAMILY_DOG","WEAPONS","ARMORS","CHARMS","CONSUMABLES","KEYS","OBJECTS"])G[n]=get(n);
 return{SPR,G};
}

/* ---------- group definitions: [{key, spr}] ---------- */
const CREATURE_GROUPS={
 "creatures-house-lowe":{chunk:"N24",biomes:["The House","Lowe & Behold","water"]},
 "creatures-park-vastco":{chunk:"N25",biomes:["The Park","Vastco"]},
 "creatures-soccer-school":{chunk:"N26",biomes:["Soccer Complex","The School"]},
 "creatures-resto-idkea":{chunk:"N27",biomes:["The Family Restaurant","IDKEA"]},
 "creatures-hood-hoa":{chunk:"N28",biomes:["The Neighborhood","The HOA Dominion"]}};
function groupDefs(D){
 const {SPR,G}=D;const byRef=new Map();for(const [n,s] of Object.entries(SPR))if(!byRef.has(s))byRef.set(s,n);
 const out={};
 /* items: every inventory/loot sprite that is a named SPR_* constant */
 {const seen=new Set(),list=[];const add=s=>{const n=s&&byRef.get(s);if(n&&!seen.has(n)){seen.add(n);list.push({key:n,spr:s});}};
  ["SPR_GEAR_W","SPR_GEAR_A","SPR_POTION","SPR_OBJECT","SPR_KEY","SPR_CHARM"].forEach(n=>add(SPR[n]));
  for(const a of["WEAPONS","ARMORS","CHARMS","CONSUMABLES","KEYS","OBJECTS"])for(const it of(G[a]||[]))add(it&&it.sprite);
  out.items={chunk:"M13",list};}
 /* heroes: generic dad + one per class (dadSprite() naming), allies, family dog */
 {const list=[],seen=new Set();const add=n=>{if(SPR[n]&&!seen.has(n)){seen.add(n);list.push({key:n,spr:SPR[n]});}};
  add("SPR_DAD");for(const c of(G.CLASSES||[]))add("SPR_DAD_"+String(c.id).toUpperCase());
  for(const a of(G.ALLIES||[])){const n=byRef.get(a.sprite);if(n)add(n);}
  if(G.FAMILY_DOG){const n=byRef.get(G.FAMILY_DOG.sprite);if(n)add(n);}
  out.heroes={chunk:"N22",list};}
 out.bosses={chunk:"N23",list:(G.BOSSES||[]).filter(b=>Array.isArray(b.sprite)).map(b=>({key:"boss:"+b.id,spr:b.sprite}))};
 for(const [g,d] of Object.entries(CREATURE_GROUPS))
  out[g]={chunk:d.chunk,list:(G.CREATURES||[]).filter(c=>d.biomes.includes(c.biome)&&Array.isArray(c.sprite)).map(c=>({key:"creature:"+c.id,spr:c.sprite}))};
 return out;
}

/* ---------- colour helpers ---------- */
const hex=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h||"");return m?[parseInt(m[1].slice(0,2),16),parseInt(m[1].slice(2,4),16),parseInt(m[1].slice(4,6),16)]:null;};
const lum=c=>0.299*c[0]+0.587*c[1]+0.114*c[2];
const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
/* 3-step ramp: highlight leans warm, shadow leans cool (classic pixel-art hue shift) */
function ramp(c){
 const L=lum(c);
 const hiAmt=L<40?0.16:0.26,shAmt=L<40?0.0:0.30;
 const hi=[clamp(c[0]+(255-c[0])*hiAmt+6),clamp(c[1]+(255-c[1])*hiAmt+3),clamp(c[2]+(255-c[2])*hiAmt-4)];
 const sh=[clamp(c[0]*(1-shAmt)),clamp(c[1]*(1-shAmt)+2),clamp(c[2]*(1-shAmt)+12*(shAmt>0?1:0))];
 return{hi,base:c,sh};
}
const OUTLINE=[14,10,22];

/* ---------- the option C upgrade: one ASCII grid -> RGBA pixels (same size, k=1) ---------- */
function upgrade(spr,PAL,opt){
 opt=opt||{};const H=spr.length,W=H?spr[0].length:0;
 const col=(x,y)=>{if(x<0||y<0||y>=H||x>=W)return null;return hex(PAL[spr[y][x]]);};
 const chr=(x,y)=>(x<0||y<0||y>=H||x>=W)?".":(PAL[spr[y][x]]?spr[y][x]:".");
 const px=new Uint8Array(W*H*4);
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const c=col(x,y);const i=(y*W+x)*4;
  if(c){
   let out=c;
   if(opt.shade!==false){
    const ch=chr(x,y);
    /* exposure: silhouette edges count 1, edges against a different colour region count 0.5 */
    const e=(nx,ny)=>{const n=chr(nx,ny);return n==="."?1:(n!==ch?0.5:0);};
    const s=e(x,y-1)+e(x-1,y)-e(x,y+1)-e(x+1,y);
    const r=ramp(c);
    if(s>=0.75)out=r.hi;else if(s<=-0.75)out=r.sh;
   }
   px[i]=out[0];px[i+1]=out[1];px[i+2]=out[2];px[i+3]=255;
  }else if(opt.outline!==false){
   /* 1px outline in empty cells that touch the silhouette (4-neighbour), unless that edge is already near-black */
   let best=null;
   for(const[dx,dy] of[[0,-1],[-1,0],[1,0],[0,1]]){const n=col(x+dx,y+dy);if(n&&lum(n)>=40&&(!best||lum(n)<lum(best)))best=n;}
   if(best){px[i]=clamp(OUTLINE[0]*0.8+best[0]*0.2);px[i+1]=clamp(OUTLINE[1]*0.8+best[1]*0.2);px[i+2]=clamp(OUTLINE[2]*0.8+best[2]*0.2);px[i+3]=255;}
  }
 }
 return{w:W,h:H,px};
}

/* ---------- tiny deterministic PNG encoder (RGBA8, no metadata) ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type,"latin1"),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(td));return Buffer.concat([len,td,crc]);}
function encodePNG(w,h,rgba){
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
 const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;Buffer.from(rgba.buffer,rgba.byteOffset+y*w*4,w*4).copy(raw,y*(w*4+1)+1);}
 return Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),chunk("IHDR",ihdr),chunk("IDAT",zlib.deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
function pngSize(buf){if(buf.length<24||buf.readUInt32BE(0)!==0x89504e47||buf.toString("latin1",12,16)!=="IHDR")return null;return{w:buf.readUInt32BE(16),h:buf.readUInt32BE(20)};}
/* decode just enough to compare pixels (our own encoder's output, or any 8-bit RGBA non-interlaced PNG) */
function decodeRGBA(buf){
 const sz=pngSize(buf);if(!sz||buf[24]!==8||buf[25]!==6||buf[28]!==0)return null;
 const ids=[];let o=8;while(o+8<=buf.length){const len=buf.readUInt32BE(o),t=buf.toString("latin1",o+4,o+8);if(t==="IDAT")ids.push(buf.subarray(o+8,o+8+len));o+=12+len;}
 const raw=zlib.inflateSync(Buffer.concat(ids)),W=sz.w,H=sz.h,st=W*4,out=new Uint8Array(st*H);
 for(let y=0;y<H;y++){const f=raw[y*(st+1)],r=raw.subarray(y*(st+1)+1,(y+1)*(st+1));
  for(let x=0;x<st;x++){const a=x>=4?out[y*st+x-4]:0,b=y?out[(y-1)*st+x]:0,c=(x>=4&&y)?out[(y-1)*st+x-4]:0;let v=r[x];
   if(f===1)v+=a;else if(f===2)v+=b;else if(f===3)v+=(a+b)>>1;else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);}
   out[y*st+x]=v&255;}}
 return{w:W,h:H,px:out};
}

/* ---------- packing: fixed cells, 16 per row, 1px gap so neighbours never bleed ---------- */
function pack(list,PAL){
 const tiles=list.map(it=>({key:it.key,t:upgrade(it.spr,PAL,TUNING[it.key])}));
 const cw=Math.max(1,...tiles.map(t=>t.t.w)),ch=Math.max(1,...tiles.map(t=>t.t.h)),cols=Math.min(16,Math.max(1,tiles.length)),rows=Math.max(1,Math.ceil(tiles.length/cols));
 const W=cols*(cw+1)-1,H=rows*(ch+1)-1,px=new Uint8Array(W*H*4),rects={};
 tiles.forEach((t,n)=>{const x0=(n%cols)*(cw+1),y0=Math.floor(n/cols)*(ch+1);
  for(let y=0;y<t.t.h;y++)for(let x=0;x<t.t.w;x++){const s=(y*t.t.w+x)*4,d=((y0+y)*W+x0+x)*4;px[d]=t.t.px[s];px[d+1]=t.t.px[s+1];px[d+2]=t.t.px[s+2];px[d+3]=t.t.px[s+3];}
  rects[t.key]=[x0,y0,t.t.w,t.t.h];});
 return{W,H,px,rects};
}

const HEADER=fs.existsSync(path.join(ROOT,OUT_DIR,"atlas.js"))?(fs.readFileSync(path.join(ROOT,OUT_DIR,"atlas.js"),"utf8").match(/^\/\*[\s\S]*?\*\//)||[""])[0]:"";
function atlasJS(sheets){
 let s=(HEADER||"/* Scattered Dad Adventures -- sprite atlas index. Generated by tools/tools_make_atlas.js. */")+"\n";
 s+="/* GENERATED by tools/tools_make_atlas.js (M13) -- do not hand-edit below; change ENABLED/TUNING in the tool and re-run. */\n";
 s+="var SPRITE_ATLAS={version:1,sheets:[";
 s+=sheets.map(sh=>"\n {src:"+JSON.stringify(sh.src)+",group:"+JSON.stringify(sh.group)+",sprites:{"+Object.entries(sh.rects).map(([k,r])=>"\n  "+JSON.stringify(k)+":["+r.join(",")+"]").join(",")+"}}").join(",");
 s+=(sheets.length?"\n":"")+"]};\n";
 return s;
}

function build(D,groups,enabled){
 const sheets=[];
 for(const g of enabled){const d=groups[g];if(!d)throw new Error("unknown group "+g);if(!d.list.length)continue;
  const p=pack(d.list,D.G.PAL);sheets.push({group:g,src:OUT_DIR+"/"+g+".png",file:path.join(ROOT,OUT_DIR,g+".png"),png:encodePNG(p.W,p.H,p.px),rects:p.rects,W:p.W,H:p.H});}
 return{sheets,js:atlasJS(sheets)};
}

/* ---------- main ---------- */
const args=process.argv.slice(2);
const D=loadGame(),groups=groupDefs(D);
if(args.includes("--list")){for(const[g,d] of Object.entries(groups))console.log((ENABLED.includes(g)?"* ":"  ")+g.padEnd(26)+d.chunk.padEnd(5)+d.list.length+" sprites");console.log("(* = enabled in the shipped atlas)");process.exit(0);}

if(args.includes("--preview")){
 const dir=path.resolve(args[args.indexOf("--preview")+1]||"atlas_preview");fs.mkdirSync(dir,{recursive:true});
 const Z=4;
 for(const[g,d] of Object.entries(groups)){if(!d.list.length)continue;
  const cols=8,cw=32*Z*2+12,chh=32*Z+12,rows=Math.ceil(d.list.length/cols),W=cols*cw,H=rows*chh,px=new Uint8Array(W*H*4);
  for(let i=0;i<W*H;i++){const x=i%W,y=Math.floor(i/W),chk=((x>>3)+(y>>3))&1;px[i*4]=px[i*4+1]=px[i*4+2]=chk?52:40;px[i*4+3]=255;}
  d.list.forEach((it,n)=>{const ox=(n%cols)*cw+4,oy=Math.floor(n/cols)*chh+6;
   const asc=upgrade(it.spr,D.G.PAL,{outline:false,shade:false}),up=upgrade(it.spr,D.G.PAL,TUNING[it.key]);
   [[asc,0],[up,32*Z+4]].forEach(([t,dx])=>{for(let y=0;y<t.h*Z;y++)for(let x=0;x<t.w*Z;x++){const s=(Math.floor(y/Z)*t.w+Math.floor(x/Z))*4;if(!t.px[s+3])continue;const d2=((oy+y)*W+ox+dx+x)*4;px[d2]=t.px[s];px[d2+1]=t.px[s+1];px[d2+2]=t.px[s+2];}});});
  fs.writeFileSync(path.join(dir,g+".png"),encodePNG(W,H,px));console.log("preview "+g+": "+d.list.length+" sprites -> "+path.join(dir,g+".png"));}
 process.exit(0);
}

const B=build(D,groups,ENABLED);
if(args.includes("--check")){
 let bad=0;const fail=m=>{console.error("ATLAS: "+m);bad++;};
 const ap=path.join(ROOT,OUT_DIR,"atlas.js");
 const cur=fs.existsSync(ap)?fs.readFileSync(ap,"utf8").replace(/\r\n/g,"\n"):"";
 if(cur!==B.js)fail("assets/sprites/atlas.js is stale -- run node tools/tools_make_atlas.js");
 const sw=fs.existsSync(path.join(ROOT,"sw.js"))?fs.readFileSync(path.join(ROOT,"sw.js"),"utf8"):"";
 for(const sh of B.sheets){
  if(!fs.existsSync(sh.file)){fail("missing sheet "+sh.src);continue;}
  const got=decodeRGBA(fs.readFileSync(sh.file)),want=decodeRGBA(sh.png);
  if(!got||got.w!==want.w||got.h!==want.h||Buffer.compare(Buffer.from(got.px),Buffer.from(want.px))!==0)fail("sheet "+sh.src+" pixels differ from the ASCII source -- run node tools/tools_make_atlas.js");
  if(!sw.includes('"'+sh.src+'"'))fail("sheet "+sh.src+" is not in sw.js ASSETS");
 }
 const n=B.sheets.reduce((a,s)=>a+Object.keys(s.rects).length,0);
 if(bad){console.error(bad+" atlas problem(s)");process.exit(1);}
 console.log("atlas OK: "+B.sheets.length+" sheet(s), "+n+" sprites ("+ENABLED.join(", ")+")");process.exit(0);
}
fs.mkdirSync(path.join(ROOT,OUT_DIR),{recursive:true});
for(const sh of B.sheets){fs.writeFileSync(sh.file,sh.png);console.log("wrote "+sh.src+" "+sh.W+"x"+sh.H+", "+Object.keys(sh.rects).length+" sprites, "+sh.png.length+" bytes");}
fs.writeFileSync(path.join(ROOT,OUT_DIR,"atlas.js"),B.js);
console.log("wrote "+OUT_DIR+"/atlas.js ("+B.sheets.length+" sheet(s)). Add any new sheet to sw.js ASSETS, then run node tools/tools_sw_stamp.js");
