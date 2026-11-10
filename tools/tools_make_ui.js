/* M16 UI skin: writes the 9-slice panel frames used by the CSS skin (border-image) in ShatteredDadAdventure.html.
   Pure Node (zlib only), deterministic, no dependencies.
     node tools/tools_make_ui.js          -> writes assets/ui/frame-panel.png, assets/ui/frame-gold.png
     node tools/tools_make_ui.js --check  -> exits 1 if a written frame's pixels differ from what this script would make
   Each frame is 9x9 art pixels drawn at 2x (18x18 PNG). CSS: border-image-slice 8, border-width 8px, no fill (the panel keeps
   its own background, clipped to the padding box). Layers from the outside in: black outline (corners cut), bevel highlight
   (top/left) / shadow (bottom/right), base colour with a rivet in each corner, dark inner line. The centre is transparent. */
const fs=require("fs"),path=require("path"),zlib=require("zlib");
const ROOT=path.join(__dirname,"..");
const FRAMES={
 "frame-panel":{hi:"#5d6a88",base:"#3a4358",lo:"#232838",inner:"#11131a",rivet:"#8a92a6"},
 "frame-gold": {hi:"#ffe58a",base:"#f4c430",lo:"#a8801a",inner:"#3a2c06",rivet:"#fff6d0"}};
const ART=9,K=2;
function hex(c){return[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16),255];}
function framePixels(f){const n=ART*K,px=Buffer.alloc(n*n*4);
 for(let y=0;y<ART;y++)for(let x=0;x<ART;x++){const d=Math.min(x,y,ART-1-x,ART-1-y);let c=null;
  const corner=(x===0||x===ART-1)&&(y===0||y===ART-1);
  if(d===0)c=corner?null:"#000000";
  else if(d===1){const tl=(y===1&&x<ART-1)||(x===1&&y<ART-1);c=tl?f.hi:f.lo;if((x===1||x===ART-2)&&(y===1||y===ART-2)&&!(x===1&&y===1))c=(x===ART-2&&y===ART-2)?f.lo:f.base;}
  else if(d===2)c=((x===2||x===ART-3)&&(y===2||y===ART-3))?f.rivet:f.base;
  else if(d===3)c=f.inner;
  if(!c)continue;const v=hex(c);
  for(let j=0;j<K;j++)for(let i=0;i<K;i++){const o=((y*K+j)*n+(x*K+i))*4;px[o]=v[0];px[o+1]=v[1];px[o+2]=v[2];px[o+3]=v[3];}}
 return{w:n,h:n,px};}
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(const x of b)c=CRC[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(t,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t,"ascii"),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([l,td,c]);}
function png({w,h,px}){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;px.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;ih[10]=0;ih[11]=0;ih[12]=0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),chunk("IDAT",zlib.deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);}
/* decode only what we write (8-bit RGBA, filter 0) plus any filter type, ignoring ancillary chunks (e.g. metadata added on copy) */
function decode(buf){let o=8,w=0,h=0;const id=[];while(o<buf.length){const l=buf.readUInt32BE(o),t=buf.toString("ascii",o+4,o+8),d=buf.slice(o+8,o+8+l);if(t==="IHDR"){w=d.readUInt32BE(0);h=d.readUInt32BE(4);}else if(t==="IDAT")id.push(d);o+=12+l;}
 const raw=zlib.inflateSync(Buffer.concat(id)),bpp=4,st=w*4,out=Buffer.alloc(st*h);
 for(let y=0;y<h;y++){const f=raw[y*(st+1)],row=raw.slice(y*(st+1)+1,(y+1)*(st+1));for(let x=0;x<st;x++){const a=x>=bpp?out[y*st+x-bpp]:0,b=y?out[(y-1)*st+x]:0,c=(x>=bpp&&y)?out[(y-1)*st+x-bpp]:0;let v=row[x];
  if(f===1)v+=a;else if(f===2)v+=b;else if(f===3)v+=(a+b)>>1;else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);}out[y*st+x]=v&255;}}
 return{w,h,px:out};}
const check=process.argv.includes("--check");let bad=0;
fs.mkdirSync(path.join(ROOT,"assets/ui"),{recursive:true});
for(const[name,f]of Object.entries(FRAMES)){const img=framePixels(f),file=path.join(ROOT,"assets/ui",name+".png");
 if(check){if(!fs.existsSync(file)){console.log("missing "+name+".png");bad++;continue;}const d=decode(fs.readFileSync(file));if(d.w!==img.w||d.h!==img.h||!d.px.equals(img.px)){console.log("stale "+name+".png");bad++;}}
 else{fs.writeFileSync(file,png(img));console.log("wrote assets/ui/"+name+".png "+img.w+"x"+img.h);}}
if(check){console.log(bad?bad+" frame(s) stale":"ui frames OK");process.exit(bad?1:0);}
