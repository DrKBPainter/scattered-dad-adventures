/* Scattered Dad Adventures -- service worker (M11).
   Cache-first app shell so a full run works offline (airplane mode).
   The cache name carries GAME_VERSION plus a content hash of every shell file.
   After ANY change to a file in ASSETS, run:  node tools/tools_sw_stamp.js
   (it rewrites the BUILD line below; `--check` exits 1 if BUILD is stale).
   A changed sw.js installs in the background and WAITS; the page shows a
   "New version available" banner and only swaps when the player taps Reload,
   so a run in progress is never switched to new code mid-floor. */
const BUILD="0.11.0-3368b2273e";
const CACHE="sda-shell-"+BUILD;
const ASSETS=[
 "./",
 "index.html",
 "ShatteredDadAdventure.html",
 "manifest.webmanifest",
 "js/config.js",
 "js/sprites.js",
 "js/data.js",
 "js/audio.js",
 "js/game.js",
 "js/render.js",
 "assets/sprites/atlas.js",
 "js/spriteimg.js",
 "js/ui.js",
 "js/dadselect.js",
 "js/titlecover.js",
 "js/bestcards.js",
 "js/input.js",
 "js/durable.js",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/icon-512-maskable.png",
 "icons/apple-touch-icon.png",
 "icons/favicon-32.png"
];
const BASE=new URL("./",self.location).href;
const SHELL=new Set(ASSETS.map(a=>new URL(a,BASE).href));
self.addEventListener("install",ev=>{
 ev.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(a=>new Request(a,{cache:"reload"})))));
 /* no skipWaiting here: the page decides when to swap (update banner) */
});
self.addEventListener("activate",ev=>{
 ev.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.indexOf("sda-shell-")===0&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("message",ev=>{
 const d=ev.data||{};
 if(d.type==="SKIP_WAITING")self.skipWaiting();
 else if(d.type==="GET_BUILD"&&ev.source)ev.source.postMessage({type:"BUILD",build:BUILD,cache:CACHE});
});
function shellKey(url){
 const u=new URL(url);u.search="";u.hash="";
 return u.href;
}
self.addEventListener("fetch",ev=>{
 const req=ev.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(url.pathname.endsWith("/sw.js"))return;
 const key=shellKey(req.url);
 const isNav=req.mode==="navigate";
 if(!SHELL.has(key)&&!isNav)return; /* not part of the shell: plain network */
 ev.respondWith((async()=>{
  const c=await caches.open(CACHE);
  let hit=SHELL.has(key)?await c.match(key):null;
  if(!hit&&isNav){
   try{const net=await fetch(req);if(net&&net.ok)return net;}catch(e){}
   hit=await c.match(new URL("ShatteredDadAdventure.html",BASE).href);
  }
  if(hit)return hit;
  try{
   const net=await fetch(req);
   if(net&&net.ok&&SHELL.has(key))c.put(key,net.clone());
   return net;
  }catch(e){
   return new Response("Offline, and this file was never cached. Connect once and reload.",{status:503,headers:{"Content-Type":"text/plain"}});
  }
 })());
});
