#!/usr/bin/env node
/* M11: stamp sw.js with GAME_VERSION + a content hash of every shell file in its ASSETS list.
   Run from the project root after changing ANY cached file (html, js, icons, manifest):
     node tools/tools_sw_stamp.js          rewrites the BUILD line in sw.js
     node tools/tools_sw_stamp.js --check  exits 1 if BUILD is stale or a listed file is missing
   A new BUILD makes browsers install the new service worker and show the update banner. */
const fs=require("fs"),path=require("path"),crypto=require("crypto");
const root=path.resolve(__dirname,"..");
const swPath=path.join(root,"sw.js");
const sw=fs.readFileSync(swPath,"utf8");
const m=sw.match(/const ASSETS=\[([\s\S]*?)\];/);
if(!m){console.error("sw.js: ASSETS list not found");process.exit(2);}
const assets=[...m[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]).filter(a=>a!=="./");
const ver=(fs.readFileSync(path.join(root,"js/config.js"),"utf8").match(/GAME_VERSION="([^"]+)"/)||[])[1];
if(!ver){console.error("GAME_VERSION not found in js/config.js");process.exit(2);}
const h=crypto.createHash("sha256");let missing=0;
for(const a of assets){const p=path.join(root,a);if(!fs.existsSync(p)){console.error("MISSING shell file: "+a);missing++;continue;}
 /* normalize CRLF so a Windows checkout hashes the same as the pushed LF copy */
 let buf=fs.readFileSync(p);if(!/\.(png|jpg|webp|ico)$/i.test(a))buf=Buffer.from(buf.toString("utf8").replace(/\r\n/g,"\n"),"utf8");
 else buf=stripPngMeta(buf);
 h.update(a+"\0");h.update(buf);h.update("\0");}
if(missing)process.exit(1);
const build=ver+"-"+h.digest("hex").slice(0,10);
const cur=(sw.match(/const BUILD="([^"]*)";/)||[])[1];
if(process.argv.includes("--check")){
 if(cur===build){console.log("sw.js BUILD OK: "+build+" ("+assets.length+" files)");process.exit(0);}
 console.error("sw.js BUILD STALE: has "+cur+", files hash to "+build+" -- run node tools/tools_sw_stamp.js");process.exit(1);}
if(cur===build){console.log("sw.js BUILD already current: "+build);process.exit(0);}
const out=sw.replace(/const BUILD="[^"]*";/,'const BUILD="'+build+'";');
fs.writeFileSync(swPath,out);
console.log("sw.js BUILD "+cur+" -> "+build+" ("+assets.length+" files)");
/* PNG: hash only the image chunks, so a metadata-only chunk added on copy (e.g. caBX content credentials) does not change BUILD */
function stripPngMeta(b){
 if(b.length<8||b.readUInt32BE(0)!==0x89504e47)return b;
 const keep=[b.subarray(0,8)];let o=8;
 while(o+8<=b.length){const len=b.readUInt32BE(o),type=b.toString("latin1",o+4,o+8),end=o+12+len;
  if(/^(IHDR|PLTE|IDAT|IEND|tRNS)$/.test(type))keep.push(b.subarray(o,end));o=end;}
 return Buffer.concat(keep);
}
