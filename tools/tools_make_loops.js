#!/usr/bin/env node
/* MOB-80 (Music 3 of 3, from MOB-51): cut a short seamless loop from each source track.
   Run from the project root (needs ffmpeg + ffprobe on PATH):
     node tools/tools_make_loops.js                 cut every loop listed in SRC below
     node tools/tools_make_loops.js house:main      cut one (or several) loops
     node tools/tools_make_loops.js --check         confirm every MUSIC entry with have:true in js/data.js
                                                    has its file, within the size limits; exits 1 if not
   Options: --src <dir> (default assets/music/source), --sec <n> target loop length (default 24).
   Method: decode mono 32 kHz; estimate the beat from the onset envelope (autocorrelation, 60-140 BPM, so a fast tune counts in half time and a loop still holds whole bars);
   loop length = a whole number of 4-beat bars near the target; loop start = the onset (after the intro)
   whose surroundings best match the point one loop later; the last CROSS seconds after the loop end are
   blended (equal power) into the first CROSS seconds, so the end flows into the start; loudness evened
   out (RMS target, peak cap); encoded mono MP3 40 kbps. Prints one line per loop with the seam check
   (RMS ratio across the seam in the encoded file) and writes the exact loop lengths, which go in the
   MUSIC table as len (js/audio.js uses len for loopStart/loopEnd).
   assets/music/source/ holds the raw downloads and is not pushed; only assets/music/<slug>-<role>.mp3 ship. */
"use strict";
const fs=require("fs"),path=require("path"),cp=require("child_process"),vm=require("vm");
const root=path.resolve(__dirname,"..");
const SR=32000,HOP=512,CROSS=0.35,KBPS=40,MAX_BYTES=200*1024,MAX_TOTAL=4.6*1024*1024;
/* slug:role -> source file name in --src (titles and roles: js/data.js MUSIC, from the MOB-47 list) */
const SRC={
 "house:main":"Monkeys Spinning Monkeys.mp3","house:boss":"Fluffing a Duck.mp3","house:rare":"Carefree.mp3",
 "lowe:main":"Sneaky Snitch.mp3","lowe:boss":"Scheming Weasel faster.mp3","lowe:rare":"Investigations.mp3",
 "park:main":"Wallpaper.mp3","park:boss":"Poofy Reel.mp3","park:rare":"Bushwick Tarantella Loop.mp3",
 "vastco:main":"Local Forecast - Elevator.mp3","vastco:boss":"Lobby Time.mp3","vastco:rare":"Hustle.mp3",
 "soccer:main":"Pixelland.mp3","soccer:boss":"Itty Bitty 8 Bit.mp3","soccer:rare":"Run Amok.mp3",
 "school:main":"Quirky Dog.mp3","school:boss":"Spy Glass.mp3","school:rare":"Thinking Music.mp3",
 "resto:main":"Bossa Antigua.mp3","resto:boss":"Life of Riley.mp3","resto:rare":"Easy Lemon 60 second.mp3",
 "idkea:main":"Fuzzball Parade.mp3","idkea:boss":"Hidden Agenda.mp3","idkea:rare":"Sneaky Adventure.mp3",
 "hood:main":"Merry Go.mp3","hood:boss":"Daily Beetle.mp3","hood:rare":"Breaktime.mp3",
 "hoa:main":"Volatile Reaction.mp3","hoa:boss":"Five Armies.mp3","hoa:rare":"Heroic Age.mp3"
};
const args=process.argv.slice(2);
function opt(n,d){const i=args.indexOf(n);return i>=0&&args[i+1]?args[i+1]:d;}
const srcDir=path.resolve(root,opt("--src","assets/music/source")),target=+opt("--sec","24");
const outDir=path.join(root,"assets","music");

/* reads only the MUSIC table out of js/data.js (the rest of data.js needs sprites.js loaded first) */
function loadMusic(){const code=fs.readFileSync(path.join(root,"js/data.js"),"utf8");const m=code.match(/const MUSIC=\{[\s\S]*?\n\};/);if(!m)return null;
 const ctx={};vm.createContext(ctx);vm.runInContext(m[0].replace(/^const MUSIC=/,"this.__M=")+"\n",ctx);return ctx.__M;}

if(args.includes("--check")){
 const M=loadMusic();if(!M){console.error("MUSIC table not found in js/data.js");process.exit(2);}
 let bad=0,total=0,n=0;
 for(const slug of Object.keys(M))for(const role of ["main","boss","rare"]){const t=M[slug][role];if(!t||!t.have)continue;n++;
  const p=path.join(root,t.file);if(!fs.existsSync(p)){console.error("MISSING "+slug+":"+role+" "+t.file);bad++;continue;}
  const b=fs.statSync(p).size;total+=b;if(b>MAX_BYTES){console.error("TOO BIG "+t.file+" "+b+" bytes (limit "+MAX_BYTES+")");bad++;}
  if(!(t.len>0)){console.error("NO len "+slug+":"+role);bad++;}}
 if(total>MAX_TOTAL){console.error("TOTAL "+total+" bytes over "+MAX_TOTAL);bad++;}
 if(bad)process.exit(1);
 console.log("music loops OK: "+n+" files, "+(total/1024).toFixed(0)+" KB total");process.exit(0);}

function decode(file){const r=cp.spawnSync("ffmpeg",["-v","error","-i",file,"-ac","1","-ar",String(SR),"-f","f32le","-"],{maxBuffer:1<<30});
 if(r.status!==0)throw new Error("ffmpeg decode failed: "+file+" "+(r.stderr||""));
 const b=r.stdout;return new Float32Array(b.buffer,b.byteOffset,b.length>>2).slice();}
function envelope(x){const n=Math.floor(x.length/HOP),e=new Float32Array(n);
 for(let i=0;i<n;i++){let s=0;for(let j=i*HOP,k=j+HOP;j<k;j++)s+=x[j]*x[j];e[i]=Math.log(1e-9+s/HOP);}
 const o=new Float32Array(n);for(let i=1;i<n;i++)o[i]=Math.max(0,e[i]-e[i-1]);return{e,o};}
function beatPeriod(o){const fps=SR/HOP;let best=0,bl=0;
 const lo=Math.ceil(fps*60/140),hi=Math.floor(fps*60/60);
 for(let L=lo;L<=hi;L++){let s=0;for(let i=L;i<o.length;i++)s+=o[i]*o[i-L];s/=(o.length-L);if(s>best){best=s;bl=L;}}
 /* refine to sub-frame with a parabola */
 const f=L=>{let s=0;for(let i=L;i<o.length;i++)s+=o[i]*o[i-L];return s/(o.length-L);};
 const a=f(bl-1),b=f(bl),c=f(bl+1),d=(a-2*b+c)?0.5*(a-c)/(a-2*b+c):0;return(bl+d)/fps;}
function corr(a,ai,b,bi,n){let s=0,sa=0,sb=0;for(let i=0;i<n;i++){const x=a[ai+i],y=b[bi+i];s+=x*y;sa+=x*x;sb+=y*y;}return s/Math.sqrt(sa*sb+1e-12);}
function cut(key){
 const src=path.join(srcDir,SRC[key]);if(!fs.existsSync(src))return{key,skip:"source missing: "+SRC[key]};
 const x=decode(src),dur=x.length/SR,{e,o}=envelope(x),beat=beatPeriod(o),bar=4*beat;
 let bars=Math.max(1,Math.round(target/bar));
 const fps=SR/HOP,win=Math.round(1.5*fps);
 const fit=b=>b*bar+CROSS+1<=dur*0.98;while(bars>1&&!fit(bars))bars--;
 const L=bars*bar,Ln=Math.round(L*SR),Lf=L*fps;
 /* candidates: onset frames between 10% in (skip the intro) and the last start that still fits */
 const s0=Math.max(win,Math.floor(Math.min(dur*0.10,8)*fps)),s1=Math.floor((dur-L-CROSS-0.5)*fps)-win;
 let best=-2,bs=s0;
 for(let i=Math.max(s0,1);i<=Math.max(s0,s1);i++){
  if(!(o[i]>=o[i-1]&&o[i]>=o[i+1]))continue;
  const j=Math.round(i+Lf);if(j+win>=o.length)break;
  const sc=corr(o,i-win,o,j-win,2*win)+0.5*corr(e,i-win,e,j-win,2*win)-0.05*Math.abs(e[i]-e[j]);
  if(sc>best){best=sc;bs=i;}}
 const start=Math.max(0,Math.round(bs*HOP-0.01*SR)),Xn=Math.round(CROSS*SR);
 const y=new Float32Array(Ln);for(let i=0;i<Ln;i++)y[i]=x[start+i];
 for(let i=0;i<Xn;i++){const t=(i+0.5)/Xn,fi=Math.sin(t*Math.PI/2),fo=Math.cos(t*Math.PI/2);y[i]=x[start+i]*fi+x[start+Ln+i]*fo;}
 /* loudness: RMS to about -17 dBFS, peak cap 0.93 */
 let ss=0,pk=0;for(let i=0;i<Ln;i++){ss+=y[i]*y[i];pk=Math.max(pk,Math.abs(y[i]));}
 const rms=Math.sqrt(ss/Ln),g=Math.min(0.141/(rms||1),0.93/(pk||1));for(let i=0;i<Ln;i++)y[i]*=g;
 const [slug,role]=key.split(":"),out=path.join(outDir,slug+"-"+role+".mp3");
 const enc=cp.spawnSync("ffmpeg",["-v","error","-y","-f","f32le","-ar",String(SR),"-ac","1","-i","-","-c:a","libmp3lame","-b:a",KBPS+"k","-map_metadata","-1",
  "-metadata","title="+path.basename(SRC[key],".mp3")+" (game loop)","-metadata","artist=Kevin MacLeod (incompetech.com)","-metadata","copyright=CC BY 4.0",out],
  {input:Buffer.from(y.buffer),maxBuffer:1<<28});
 if(enc.status!==0)throw new Error("ffmpeg encode failed: "+out+" "+enc.stderr);
 /* seam check on the encoded file: RMS of the last and first 60 ms of the loop body */
 const z=decode(out);let lead=0;const lim=Math.min(z.length,Math.round(0.1*SR));while(lead<lim&&Math.abs(z[lead])<1e-4)lead++;if(lead>=lim)lead=0;
 const w=Math.round(0.06*SR),endI=Math.min(z.length,lead+Ln);const r=(a,b)=>{let s=0;for(let i=a;i<b;i++)s+=z[i]*z[i];return Math.sqrt(s/Math.max(1,b-a));};
 const rEnd=r(endI-w,endI),rBeg=r(lead,lead+w),seam=rBeg>0&&rEnd>0?Math.max(rBeg/rEnd,rEnd/rBeg):99;
 return{key,src:SRC[key],bpm:+(60/beat).toFixed(1),bars,len:+(Ln/SR).toFixed(4),start:+(start/SR).toFixed(2),score:+best.toFixed(3),
  bytes:fs.statSync(out).size,leadMs:+(lead/SR*1000).toFixed(1),seamRatio:+seam.toFixed(2),file:"assets/music/"+slug+"-"+role+".mp3"};}

const keys=args.filter(a=>/^[a-z]+:(main|boss|rare)$/.test(a));const todo=keys.length?keys:Object.keys(SRC);
fs.mkdirSync(outDir,{recursive:true});const res=[];
for(const k of todo){try{const r=cut(k);res.push(r);console.log(JSON.stringify(r));}catch(err){console.error(k+": "+err.message);process.exitCode=1;}}
const made=res.filter(r=>!r.skip);
console.log("made "+made.length+" loops, "+(made.reduce((a,r)=>a+r.bytes,0)/1024).toFixed(0)+" KB; skipped "+res.filter(r=>r.skip).length);
