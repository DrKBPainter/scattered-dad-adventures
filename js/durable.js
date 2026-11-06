/* ===== SCATTERED DAD ADVENTURES — durable.js (M12: install + save durability) =====
   Loaded after input.js. Browser-only (not in the harness ORDER).
   - Install: captures `beforeinstallprompt` (Android/desktop Chrome/Edge) and offers an Install
     banner on the title screen; iOS Safari (not yet on the Home Screen) gets one-time
     "Add to Home Screen" instructions. The banner is its own fixed element: the protected
     title cover / Dad deck / Bestiary cards are not touched.
   - navigator.storage.persist() once a run starts (and after install / from the backup sheet).
   - Saves the run on visibilitychange(hidden) / pagehide / freeze (phones kill background tabs).
   - Save Backup sheet (#m12save): export every sda_ save key as a copyable code or a .txt file,
     import from a pasted code or a file. Code = "SDA1G:" + base64(gzip(JSON)) when the browser
     has CompressionStream, else "SDA1:" + base64(JSON). Both are accepted on import.
   - Unlocks WebAudio on the first tap/click/key (iOS starts the AudioContext suspended).
   Hooks: syncDurable() from syncUI (ui.js); openSaveBackup() from the desktop title row [S],
   How To, and the MORE drawer (BACKUP). ======================================================= */
"use strict";
const M12_KEYS=[SAVE_KEY,BESTIARY_KEY,GRAVEYARD_KEY,DAILY_KEY,"sda_mute","sda_dpad"];
const M12_SNOOZE_KEY="sda_install_snooze",M12_IOS_KEY="sda_a2hs_seen";
let _m12SaveOpen=false,_m12Pending=null;
let _m12Prompt=null,_m12Installed=false,_m12Persist=null,_m12PersistAsked=false,_m12BarHidden=false,_m12IosShown=false;

function _m12Standalone(){try{return (window.matchMedia&&matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;}catch(e){return false;}}
function _m12IsIOS(){const ua=navigator.userAgent||"";return /iPhone|iPad|iPod/.test(ua)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);}
function _m12IsIOSSafari(){const ua=navigator.userAgent||"";return _m12IsIOS()&&/Safari/.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua);}
function _m12Get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function _m12Set(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function _m12Esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function _m12InRun(){return typeof mode!=="undefined"&&mode===State.PLAY&&typeof game!=="undefined"&&!!game;}

/* ---------- storage persistence ---------- */
function m12AskPersist(){
 if(!navigator.storage||!navigator.storage.persist)return Promise.resolve(null);
 return navigator.storage.persisted().then(p=>{if(p)return true;_m12PersistAsked=true;return navigator.storage.persist();})
  .then(r=>{_m12Persist=r;return r;}).catch(()=>null);}
if(navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>{_m12Persist=p;}).catch(()=>{});

/* ---------- save when the OS backgrounds or kills the page ---------- */
function _m12SaveNow(){try{if(_m12InRun()&&typeof saveRun==="function")saveRun();}catch(e){}}
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")_m12SaveNow();});
window.addEventListener("pagehide",_m12SaveNow);
document.addEventListener("freeze",_m12SaveNow);

/* ---------- WebAudio unlock (iOS: context must be started inside a user gesture) ---------- */
function _m12Unlock(){
 if(typeof _getAC!=="function")return;
 const ac=_getAC();if(!ac)return;
 if(!_m12Unlock.done){try{const b=ac.createBuffer(1,1,22050),s=ac.createBufferSource();s.buffer=b;s.connect(ac.destination);s.start(0);_m12Unlock.done=true;}catch(e){}}
}
["pointerdown","touchend","keydown","click"].forEach(t=>document.addEventListener(t,()=>{
 if(!_m12Unlock.done||(typeof _ac!=="undefined"&&_ac&&_ac.state!=="running"))_m12Unlock();},{capture:true,passive:true}));

/* ---------- install prompt ---------- */
window.addEventListener("beforeinstallprompt",ev=>{ev.preventDefault();_m12Prompt=ev;syncDurable();});
window.addEventListener("appinstalled",()=>{_m12Installed=true;_m12Prompt=null;m12AskPersist();syncDurable();});
function _m12Snoozed(){const t=+(_m12Get(M12_SNOOZE_KEY)||0);return t&&Date.now()<t;}
function m12Install(){
 if(_m12Prompt){const p=_m12Prompt;_m12Prompt=null;p.prompt();
  (p.userChoice||Promise.resolve({})).then(c=>{if(c&&c.outcome==="accepted"){_m12Installed=true;m12AskPersist();}else _m12Set(M12_SNOOZE_KEY,String(Date.now()+3*864e5));syncDurable();if(_m12SaveOpen)_m12Render();});return;}
 if(_m12IsIOS()&&!_m12Standalone())m12ShowIOS(true);}
function m12ShowIOS(force){
 const s=document.getElementById("m12ios");if(!s)return;
 if(!force&&(_m12Get(M12_IOS_KEY)==="1"||_m12IosShown))return;
 _m12IosShown=true;s.classList.add("show");}
function _m12CloseIOS(){const s=document.getElementById("m12ios");if(s)s.classList.remove("show");_m12Set(M12_IOS_KEY,"1");syncDurable();}

/* Called from syncUI(): show the Install banner / iOS instructions only on the title screen. */
function syncDurable(){
 const bar=document.getElementById("m12inst");if(!bar)return;
 const onTitle=typeof mode!=="undefined"&&mode===State.TITLE;
 const sw=document.getElementById("swup"),swOn=sw&&sw.classList.contains("show");
 const iosNeed=_m12IsIOSSafari()&&!_m12Standalone();
 const can=!!_m12Prompt&&!_m12Installed&&!_m12Standalone();
 const show=onTitle&&!_m12BarHidden&&!swOn&&!_m12SaveOpen&&((can&&!_m12Snoozed())||(iosNeed&&_m12Get(M12_IOS_KEY)==="1"&&!_m12Snoozed()));
 bar.classList.toggle("show",show);
 if(show){const b=document.getElementById("m12instGo");if(b)b.textContent=can?"Install":"How";}
 if(onTitle&&iosNeed&&_m12Get(M12_IOS_KEY)!=="1")m12ShowIOS(false);
 if(typeof mode!=="undefined"&&mode===State.PLAY&&!_m12PersistAsked&&_m12Persist===false)m12AskPersist();
}

/* ---------- export / import ---------- */
function _m12B64(bytes){let s="";for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s);}
function _m12Unb64(t){const s=atob(t),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
async function _m12Pipe(bytes,stream){const r=new Response(new Blob([bytes]).stream().pipeThrough(stream));return new Uint8Array(await r.arrayBuffer());}
function _m12Snapshot(){const keys={};for(const k of M12_KEYS){const v=_m12Get(k);if(v!=null)keys[k]=v;}return {app:"scattered-dad-adventures",v:1,game:typeof GAME_VERSION!=="undefined"?GAME_VERSION:"",at:new Date().toISOString(),keys};}
async function m12ExportCode(){
 if(_m12InRun())_m12SaveNow();
 const raw=new TextEncoder().encode(JSON.stringify(_m12Snapshot()));
 if(typeof CompressionStream==="function"){try{return "SDA1G:"+_m12B64(await _m12Pipe(raw,new CompressionStream("gzip")));}catch(e){}}
 return "SDA1:"+_m12B64(raw);}
async function m12DecodeCode(code){
 code=String(code||"").replace(/\s+/g,"");
 let bytes;
 if(code.indexOf("SDA1G:")===0){if(typeof DecompressionStream!=="function")throw new Error("This browser cannot open compressed codes. Try the file on another browser.");bytes=await _m12Pipe(_m12Unb64(code.slice(6)),new DecompressionStream("gzip"));}
 else if(code.indexOf("SDA1:")===0)bytes=_m12Unb64(code.slice(5));
 else throw new Error("That is not a Scattered Dad save code. It should start with SDA1.");
 const o=JSON.parse(new TextDecoder().decode(bytes));
 if(!o||o.app!=="scattered-dad-adventures"||!o.keys||typeof o.keys!=="object")throw new Error("The code opened, but it is not a save backup.");
 for(const k of Object.keys(o.keys)){if(M12_KEYS.indexOf(k)<0){delete o.keys[k];continue;}if(typeof o.keys[k]!=="string")throw new Error("The backup is damaged ("+k+").");}
 const chk=(k,t)=>{if(o.keys[k]==null)return;const v=JSON.parse(o.keys[k]);if(t==="arr"?!Array.isArray(v):(typeof v!=="object"||!v))throw new Error("The backup is damaged ("+k+").");};
 chk(SAVE_KEY,"obj");chk(BESTIARY_KEY,"obj");chk(GRAVEYARD_KEY,"arr");chk(DAILY_KEY,"obj");
 if(o.keys[SAVE_KEY]){const s=JSON.parse(o.keys[SAVE_KEY]);if(!s.clsId||typeof s.depth!=="number")throw new Error("The saved run in this backup is damaged.");}
 return o;}
function m12Summary(o){
 const k=o.keys,out=[];
 try{if(k[SAVE_KEY]){const s=JSON.parse(k[SAVE_KEY]);const c=(typeof CLASSES!=="undefined"&&CLASSES.find(x=>x.id===s.clsId))||null;out.push("a run on Floor "+s.depth+(c?" as "+c.name:""));}}catch(e){}
 try{if(k[BESTIARY_KEY])out.push(Object.keys(JSON.parse(k[BESTIARY_KEY])).length+" creatures discovered");}catch(e){}
 try{if(k[GRAVEYARD_KEY]){const n=JSON.parse(k[GRAVEYARD_KEY]).length;out.push(n+" grave"+(n===1?"":"s"));}}catch(e){}
 return out.length?out.join(", "):"settings only";}
function m12Apply(o){for(const k of Object.keys(o.keys))_m12Set(k,o.keys[k]);
 try{if(typeof SFX_MUTED!=="undefined"&&o.keys.sda_mute!=null)SFX_MUTED=o.keys.sda_mute==="1";if(typeof syncMuteBtn==="function")syncMuteBtn();}catch(e){}
 try{if(typeof discovered!=="undefined"&&typeof loadBestiary==="function"){const b=loadBestiary();for(const x of Object.keys(discovered))delete discovered[x];Object.assign(discovered,b);}}catch(e){}}

/* ---------- the Save Backup sheet ---------- */
function _m12Msg(t,c){const m=document.getElementById("m12msg");if(m){m.textContent=t||"";m.className="m12-msg"+(c?" "+c:"");}}
function _m12Render(){
 const p=document.getElementById("m12body");if(!p)return;
 const inRun=_m12InRun(),standalone=_m12Standalone();
 const per=_m12Persist===true?'<b class="ok">Protected</b> (the browser has promised not to tidy it away)':(_m12Persist===false?'<b class="warn">Not guaranteed</b> &mdash; the browser may clear it if space runs low or after a long absence':'Unknown on this browser');
 let inst="";
 if(standalone||_m12Installed)inst='<p class="m12-ok">Installed on this device. The garage door is open even without Wi-Fi.</p>';
 else if(_m12Prompt)inst='<p>Install the game for offline play and safer saves.</p><button type="button" class="m12-btn m12-pri" data-m12="install">Install the game</button>';
 else if(_m12IsIOS())inst='<p>On iPhone or iPad, saves are safest once the game is on your Home Screen.</p><button type="button" class="m12-btn" data-m12="ios">How to add it to the Home Screen</button>';
 else inst='<p class="dim">Your browser can install the game from its menu (look for &ldquo;Install&rdquo; or &ldquo;Add to Home Screen&rdquo;).</p>';
 p.innerHTML=
  '<section><h2>1. Make a backup</h2><p>Your run, Bestiary, Graveyard and Daily records, packed into one code. Keep it somewhere a toddler cannot reach.</p>'+
  '<div class="m12-row"><button type="button" class="m12-btn m12-pri" data-m12="copy">Copy backup code</button><button type="button" class="m12-btn" data-m12="file">Save as file</button></div>'+
  '<textarea id="m12out" readonly rows="3" aria-label="Backup code" placeholder="Your backup code appears here."></textarea></section>'+
  '<section><h2>2. Restore a backup</h2>'+(inRun?'<p class="warn">Restoring is done from the main menu, so this run is not overwritten mid-floor. Use SAVE &amp; MENU first.</p>':
  '<p>Paste a code, or open a backup file. This replaces the saves on this device.</p><textarea id="m12in" rows="3" aria-label="Paste a backup code" placeholder="Paste a code starting with SDA1"></textarea>'+
  '<div class="m12-row"><button type="button" class="m12-btn m12-pri" data-m12="load">Restore from code</button><label class="m12-btn m12-file">Open a file<input type="file" id="m12fileIn" accept=".txt,.json,text/plain"></label></div>')+'</section>'+
  '<section><h2>3. Keep it safe</h2><p>Storage on this device: '+per+'.</p>'+(_m12Persist===false?'<button type="button" class="m12-btn" data-m12="persist">Ask the browser to keep it</button>':'')+inst+'</section>'+
  '<p class="m12-note">'+_m12Note()+'</p>';
 _m12Msg("");}
const M12_NOTES=["A note on the fridge: “You always find our stuff. Even the remote. — the kids”","Taped inside the toolbox: “Backing things up is what good dads do. You are a good dad.”","Crayon on an index card: “DAD = BEST SAVER OF THINGS”","Sticky note from the kids: “We believe in you. Also we lost the charger.”"];
function _m12Note(){return _m12Esc(M12_NOTES[Date.now()%M12_NOTES.length]);}
function openSaveBackup(){
 const s=document.getElementById("m12save");if(!s)return;
 if(typeof setMoreOpen==="function"&&typeof _m8More!=="undefined"&&_m8More)setMoreOpen(false);
 _m12SaveOpen=true;_m12Pending=null;_m12Render();s.classList.add("show");document.body.classList.add("m12-open");syncDurable();
 const c=s.querySelector(".m12-close");if(c)try{c.focus({preventScroll:true});}catch(e){}}
function closeSaveBackup(){const s=document.getElementById("m12save");if(!s)return;_m12SaveOpen=false;_m12Pending=null;s.classList.remove("show");document.body.classList.remove("m12-open");syncDurable();if(typeof markDirty==="function")markDirty();}
function _m12Today(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
async function _m12Do(a){
 try{
  if(a==="close"){closeSaveBackup();return;}
  if(a==="copy"){const code=await m12ExportCode();const o=document.getElementById("m12out");o.value=code;let ok=false;
   try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(code);ok=true;}}catch(e){}
   if(!ok){try{o.focus();o.select();ok=document.execCommand&&document.execCommand("copy");}catch(e){}}
   _m12Msg(ok?"Copied ("+code.length.toLocaleString()+" characters). Paste it into a note, an email to yourself, or the family group text.":"Select the code above and copy it.",ok?"ok":"");return;}
  if(a==="file"){const code=await m12ExportCode();document.getElementById("m12out").value=code;
   const url=URL.createObjectURL(new Blob([code+"\n"],{type:"text/plain"}));const l=document.createElement("a");l.href=url;l.download="scattered-dad-save-"+_m12Today()+".txt";document.body.appendChild(l);l.click();setTimeout(()=>{URL.revokeObjectURL(url);l.remove();},1000);
   _m12Msg("Backup file saved to your downloads.","ok");return;}
  if(a==="load"){const t=(document.getElementById("m12in")||{}).value||"";if(!t.trim()){_m12Msg("Paste a backup code first.","warn");return;}await _m12Stage(t);return;}
  if(a==="yes"){if(!_m12Pending)return;if(_m12InRun()){_m12Msg("Return to the main menu first.","warn");return;}const o=_m12Pending;_m12Pending=null;m12Apply(o);if(typeof syncUI==="function")syncUI();_m12Render();_m12Msg("Backup restored: "+m12Summary(o)+". The garage has been reorganized exactly as you left it.","ok");return;}
  if(a==="no"){_m12Pending=null;_m12Render();_m12Msg("Restore cancelled. Nothing was changed.");return;}
  if(a==="persist"){await m12AskPersist();_m12Render();_m12Msg(_m12Persist?"The browser agreed to keep your saves.":"The browser declined for now. Installing the game usually changes its mind.",_m12Persist?"ok":"warn");return;}
  if(a==="install"){m12Install();return;}
  if(a==="ios"){m12ShowIOS(true);return;}
 }catch(e){_m12Msg((e&&e.message)||"Something went wrong.","warn");}}
async function _m12Stage(text){
 const o=await m12DecodeCode(text);_m12Pending=o;
 const box=document.getElementById("m12msg");_m12Msg("");
 if(box)box.innerHTML='<span class="warn">Restore '+_m12Esc(m12Summary(o))+(o.at?' (backed up '+_m12Esc(String(o.at).slice(0,10))+')':'')+'? This replaces the saves on this device.</span><span class="m12-row"><button type="button" class="m12-btn m12-pri" data-m12="yes">Restore it</button><button type="button" class="m12-btn" data-m12="no">Cancel</button></span>';}
(function(){
 const s=document.getElementById("m12save");
 if(s){
  s.addEventListener("click",ev=>{if(ev.target===s){closeSaveBackup();return;}const b=ev.target.closest("[data-m12]");if(b)_m12Do(b.dataset.m12);});
  s.addEventListener("keydown",ev=>{if(ev.key==="Escape"){closeSaveBackup();ev.preventDefault();}ev.stopPropagation();});
  s.addEventListener("change",ev=>{if(ev.target&&ev.target.id==="m12fileIn"&&ev.target.files&&ev.target.files[0]){const f=ev.target.files[0];ev.target.value="";
   if(f.size>8e6){_m12Msg("That file is far too large to be a save.","warn");return;}
   f.text().then(t=>_m12Stage(t)).catch(e=>_m12Msg((e&&e.message)||"Could not read that file.","warn"));}});}
 /* While the sheet is open, game keys must not leak to the document handler. */
 document.addEventListener("keydown",ev=>{if(_m12SaveOpen&&!s.contains(ev.target)){if(ev.key==="Escape")closeSaveBackup();ev.stopImmediatePropagation();ev.preventDefault();}},true);
 const bar=document.getElementById("m12inst");
 if(bar)bar.addEventListener("click",ev=>{const b=ev.target.closest("[data-m12i]");if(!b)return;
  if(b.dataset.m12i==="go")m12Install();
  else if(b.dataset.m12i==="later"){_m12BarHidden=true;_m12Set(M12_SNOOZE_KEY,String(Date.now()+3*864e5));syncDurable();}});
 const ios=document.getElementById("m12ios");
 if(ios)ios.addEventListener("click",ev=>{if(ev.target===ios||ev.target.closest("[data-m12ios]"))_m12CloseIOS();});
 if(ios)ios.addEventListener("keydown",ev=>{if(ev.key==="Escape")_m12CloseIOS();});
 document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-m12open]");if(b){ev.preventDefault();openSaveBackup();}});
 syncDurable();
})();
