/* M18 release: writes the "share the game" QR code shown by the Share sheet (js/share.js).
   Pure Node (zlib only), deterministic, no dependencies. QR Model 2, byte mode, error correction M, versions 1-10.
     node tools/tools_make_qr.js          -> writes assets/ui/qr-share.png for SHARE_URL
     node tools/tools_make_qr.js --check  -> exits 1 if the PNG is missing or its pixels differ from what this script would make
     node tools/tools_make_qr.js --print  -> prints the module grid as text (debugging)
   SHARE_URL must match SDA_SHARE_URL in js/share.js (the check also verifies that).
   Image: 1 module = K px, 4-module quiet zone, dark ink on a warm white "paper". */
const fs=require("fs"),path=require("path"),zlib=require("zlib");
const ROOT=path.join(__dirname,"..");
const SHARE_URL="https://drkbpainter.github.io/scattered-dad-adventures/";
const OUT="assets/ui/qr-share.png",K=6,QUIET=4,INK=[26,22,18,255],PAPER=[255,250,240,255];

/* ---- QR encoder (byte mode, ECC level M) ---- */
const ECC_PER_BLOCK=[-1,10,16,26,18,24,16,18,22,22,26];   /* level M, versions 1-10 */
const NUM_BLOCKS   =[-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
function rawModules(v){let r=(16*v+128)*v+64;if(v>=2){const n=Math.floor(v/7)+2;r-=(25*n-10)*n-55;if(v>=7)r-=36;}return r;}
function dataCodewords(v){return Math.floor(rawModules(v)/8)-ECC_PER_BLOCK[v]*NUM_BLOCKS[v];}
function alignPos(v){if(v===1)return[];const n=Math.floor(v/7)+2,size=v*4+17,step=Math.ceil((v*4+4)/(n*2-2))*2,r=[6];for(let p=size-7;r.length<n;p-=step)r.splice(1,0,p);return r;}
function gfMul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=((y>>>i)&1)*x;}return z&255;}
function rsDivisor(deg){const r=new Array(deg).fill(0);r[deg-1]=1;let root=1;for(let i=0;i<deg;i++){for(let j=0;j<deg;j++){r[j]=gfMul(r[j],root);if(j+1<deg)r[j]^=r[j+1];}root=gfMul(root,2);}return r;}
function rsRemainder(data,div){const r=new Array(div.length).fill(0);for(const b of data){const f=b^r.shift();r.push(0);div.forEach((c,i)=>r[i]^=gfMul(c,f));}return r;}
function encode(text){
 const bytes=[...Buffer.from(text,"utf8")];let v=1;
 for(;v<=10;v++){const cc=v<10?8:16;if(4+cc+bytes.length*8<=dataCodewords(v)*8)break;}
 if(v>10)throw new Error("text too long for versions 1-10 at level M");
 const bits=[];const put=(val,n)=>{for(let i=n-1;i>=0;i--)bits.push((val>>>i)&1);};
 put(4,4);put(bytes.length,v<10?8:16);bytes.forEach(b=>put(b,8));
 const cap=dataCodewords(v)*8;put(0,Math.min(4,cap-bits.length));while(bits.length%8)bits.push(0);
 for(let p=0xec;bits.length<cap;p^=0xec^0x11)put(p,8);
 const data=[];for(let i=0;i<bits.length;i+=8)data.push(parseInt(bits.slice(i,i+8).join(""),2));
 /* split into blocks, add ECC, interleave */
 const nb=NUM_BLOCKS[v],ecl=ECC_PER_BLOCK[v],raw=Math.floor(rawModules(v)/8),nShort=nb-raw%nb,shortLen=Math.floor(raw/nb),div=rsDivisor(ecl),blocks=[];
 for(let i=0,k=0;i<nb;i++){const dat=data.slice(k,k+shortLen-ecl+(i<nShort?0:1));k+=dat.length;const ecc=rsRemainder(dat,div);if(i<nShort)dat.push(0);blocks.push(dat.concat(ecc));}
 const cw=[];for(let i=0;i<blocks[0].length;i++)blocks.forEach((b,j)=>{if(i!==shortLen-ecl||j>=nShort)cw.push(b[i]);});
 /* function patterns */
 const size=v*4+17,M=[],F=[];for(let y=0;y<size;y++){M.push(new Array(size).fill(0));F.push(new Array(size).fill(0));}
 const setF=(x,y,d)=>{M[y][x]=d?1:0;F[y][x]=1;};
 for(let i=0;i<size;i++){setF(6,i,i%2===0);setF(i,6,i%2===0);}
 for(const[cx,cy]of[[3,3],[size-4,3],[3,size-4]])for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=size||y>=size)continue;const d=Math.max(Math.abs(dx),Math.abs(dy));setF(x,y,d!==2&&d!==4);}
 const ap=alignPos(v),na=ap.length;
 for(let i=0;i<na;i++)for(let j=0;j<na;j++){if((i===0&&j===0)||(i===0&&j===na-1)||(i===na-1&&j===0))continue;
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)setF(ap[i]+dx,ap[j]+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);}
 const drawFormat=mask=>{const d=(0<<3)|mask;let r=d;for(let i=0;i<10;i++)r=(r<<1)^((r>>>9)*0x537);const b=((d<<10)|r)^0x5412,g=i=>(b>>>i)&1;
  for(let i=0;i<=5;i++)setF(8,i,g(i));setF(8,7,g(6));setF(8,8,g(7));setF(7,8,g(8));for(let i=9;i<15;i++)setF(14-i,8,g(i));
  for(let i=0;i<8;i++)setF(size-1-i,8,g(i));for(let i=8;i<15;i++)setF(8,size-15+i,g(i));setF(8,size-8,1);};
 drawFormat(0);
 if(v>=7){let r=v;for(let i=0;i<12;i++)r=(r<<1)^((r>>>11)*0x1f25);const b=(v<<12)|r;for(let i=0;i<18;i++){const bit=(b>>>i)&1,a=size-11+i%3,c=Math.floor(i/3);setF(a,c,bit);setF(c,a,bit);}}
 /* data placement (zigzag) */
 let i=0;for(let right=size-1;right>=1;right-=2){if(right===6)right=5;for(let vert=0;vert<size;vert++)for(let j=0;j<2;j++){const x=right-j,up=((right+1)&2)===0,y=up?size-1-vert:vert;
  if(!F[y][x]&&i<cw.length*8){M[y][x]=(cw[i>>>3]>>>(7-(i&7)))&1;i++;}}}
 /* masks: pick the lowest penalty */
 const MASK=[(x,y)=>(x+y)%2===0,(x,y)=>y%2===0,(x,y)=>x%3===0,(x,y)=>(x+y)%3===0,(x,y)=>(Math.floor(x/3)+Math.floor(y/2))%2===0,(x,y)=>x*y%2+x*y%3===0,(x,y)=>(x*y%2+x*y%3)%2===0,(x,y)=>((x+y)%2+x*y%3)%2===0];
 const apply=m=>{for(let y=0;y<size;y++)for(let x=0;x<size;x++)if(!F[y][x]&&MASK[m](x,y))M[y][x]^=1;};
 let best=-1,bestP=Infinity;for(let m=0;m<8;m++){apply(m);drawFormat(m);const p=penalty(M,size);if(p<bestP){bestP=p;best=m;}apply(m);}
 apply(best);drawFormat(best);return{version:v,mask:best,size,M};}
function penalty(M,size){let p=0;const line=g=>{let s=0;for(let a=0;a<size;a++){let run=1;for(let b=1;b<=size;b++){if(b<size&&g(a,b)===g(a,b-1))run++;else{if(run>=5)s+=3+run-5;run=1;}}
  const row=[0,0,0,0];for(let b=0;b<size;b++)row.push(g(a,b));row.push(0,0,0,0);const str=row.join("");let k=-1;while((k=str.indexOf("10111010000",k+1))>=0)s+=40;k=-1;while((k=str.indexOf("00001011101",k+1))>=0)s+=40;}return s;};
 p+=line((a,b)=>M[a][b])+line((a,b)=>M[b][a]);
 let dark=0;for(let y=0;y<size;y++)for(let x=0;x<size;x++){dark+=M[y][x];if(x<size-1&&y<size-1){const c=M[y][x];if(c===M[y][x+1]&&c===M[y+1][x]&&c===M[y+1][x+1])p+=3;}}
 p+=10*Math.floor(Math.abs(dark*100/(size*size)-50)/5);return p;}

/* ---- PNG (same writer/decoder as tools_make_ui.js) ---- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(b){let c=0xffffffff;for(const x of b)c=CRC[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(t,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length);const td=Buffer.concat([Buffer.from(t,"ascii"),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc32(td));return Buffer.concat([l,td,c]);}
function png({w,h,px}){const raw=Buffer.alloc((w*4+1)*h);for(let y=0;y<h;y++){raw[y*(w*4+1)]=0;px.copy(raw,y*(w*4+1)+1,y*w*4,(y+1)*w*4);}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;ih[10]=0;ih[11]=0;ih[12]=0;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk("IHDR",ih),chunk("IDAT",zlib.deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);}
function decode(buf){let o=8,w=0,h=0;const id=[];while(o<buf.length){const l=buf.readUInt32BE(o),t=buf.toString("ascii",o+4,o+8),d=buf.slice(o+8,o+8+l);if(t==="IHDR"){w=d.readUInt32BE(0);h=d.readUInt32BE(4);}else if(t==="IDAT")id.push(d);o+=12+l;}
 const raw=zlib.inflateSync(Buffer.concat(id)),bpp=4,st=w*4,out=Buffer.alloc(st*h);
 for(let y=0;y<h;y++){const f=raw[y*(st+1)],row=raw.slice(y*(st+1)+1,(y+1)*(st+1));for(let x=0;x<st;x++){const a=x>=bpp?out[y*st+x-bpp]:0,b=y?out[(y-1)*st+x]:0,c=(x>=bpp&&y)?out[(y-1)*st+x-bpp]:0;let v=row[x];
  if(f===1)v+=a;else if(f===2)v+=b;else if(f===3)v+=(a+b)>>1;else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);}out[y*st+x]=v&255;}}
 return{w,h,px:out};}
function image(q){const n=(q.size+QUIET*2)*K,px=Buffer.alloc(n*n*4);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const mx=Math.floor(x/K)-QUIET,my=Math.floor(y/K)-QUIET;const d=mx>=0&&my>=0&&mx<q.size&&my<q.size&&q.M[my][mx];const c=d?INK:PAPER;const o=(y*n+x)*4;px[o]=c[0];px[o+1]=c[1];px[o+2]=c[2];px[o+3]=c[3];}
 return{w:n,h:n,px};}

const q=encode(SHARE_URL),img=image(q),file=path.join(ROOT,OUT);
if(process.argv.includes("--print")){console.log(q.M.map(r=>r.map(c=>c?"##":"  ").join("")).join("\n"));}
if(process.argv.includes("--check")){let bad=0;
 if(!fs.existsSync(file)){console.log("missing "+OUT);bad++;}
 else{const d=decode(fs.readFileSync(file));if(d.w!==img.w||d.h!==img.h||!d.px.equals(img.px)){console.log("stale "+OUT);bad++;}}
 const js=path.join(ROOT,"js/share.js");if(fs.existsSync(js)){const m=fs.readFileSync(js,"utf8").match(/SDA_SHARE_URL="([^"]+)"/);if(!m||m[1]!==SHARE_URL){console.log("js/share.js SDA_SHARE_URL does not match SHARE_URL");bad++;}}
 console.log(bad?bad+" problem(s)":"qr OK: "+OUT+" v"+q.version+"-M mask "+q.mask+" ("+img.w+"x"+img.h+") -> "+SHARE_URL);process.exit(bad?1:0);}
fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,png(img));
console.log("wrote "+OUT+" "+img.w+"x"+img.h+" (QR v"+q.version+"-M, mask "+q.mask+") -> "+SHARE_URL);
