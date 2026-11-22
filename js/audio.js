/* ===== SCATTERED DAD ADVENTURES — audio.js =====
   WebAudio SFX: all sounds generated procedurally via the Web Audio API.
   No external files required. AudioContext created lazily on first interaction.
   Sounds: sfxKneeCrack / sfxOof / sfxPickup / sfxCraft / sfxUnlock
   Mute:   sfxToggleMute() — state persisted in localStorage ("sda_mute")
   Music:  MOB-78 looping background player (musicUpdate / musicToggle / musicStats), localStorage "sda_music" ("1"/"0", default on).
   ============================================= */
"use strict";
let _ac = null;
let SFX_MUTED = (typeof localStorage !== "undefined" && localStorage.getItem("sda_mute") === "1");

function _getAC() {
  if (!_ac) {
    try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
  }
  if (_ac && _ac.state === "suspended") { try { _ac.resume(); } catch(e) {} }
  return _ac;
}

/* oscillator tone: type, start-freq, end-freq (or null), duration, peak-gain */
function _osc(type, freq, freqEnd, dur, gain) {
  if (SFX_MUTED) return;
  const ac = _getAC(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = type;
  o.frequency.setValueAtTime(freq, ac.currentTime);
  if (freqEnd != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), ac.currentTime + dur);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  o.start(ac.currentTime); o.stop(ac.currentTime + dur + 0.02);
}

/* short burst of bandpass-filtered white noise */
function _noise(dur, gain, bpFreq) {
  if (SFX_MUTED) return;
  const ac = _getAC(); if (!ac) return;
  const n = Math.ceil(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, n, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource(), filt = ac.createBiquadFilter(), g = ac.createGain();
  filt.type = "bandpass"; filt.frequency.value = bpFreq || 300; filt.Q.value = 1.2;
  src.buffer = buf; src.connect(filt); filt.connect(g); g.connect(ac.destination);
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  src.start(ac.currentTime); src.stop(ac.currentTime + dur + 0.02);
}

/* ===== PUBLIC SFX API ===== */

/* Knee crack: percussive pop + low thud — the sound of a man betrayed by his own skeleton */
function sfxKneeCrack() {
  _noise(0.05, 0.45, 260);
  _osc("sine", 95, 38, 0.10, 0.13);
}

/* "Oof": descending grunt — the universal language of a dad who just took a hit */
function sfxOof() {
  _osc("sine", 230, 85, 0.18, 0.26);
  _osc("triangle", 155, 65, 0.14, 0.13);
}

/* Pickup chime: quick ascending blip — success, however small */
function sfxPickup() {
  _osc("sine", 660, 990, 0.10, 0.19);
}

/* Craft success: two-tone click — the sound of a man who knows what he is doing (he does not) */
function sfxCraft() {
  if (SFX_MUTED) return;
  _getAC(); // ensure context is live before setTimeout
  _osc("square", 330, 495, 0.07, 0.16);
  setTimeout(function() { _osc("sine", 880, 1320, 0.13, 0.19); }, 75);
}

/* Unlock: mechanical click + rising tone — a door yields to inevitability */
function sfxUnlock() {
  _noise(0.04, 0.32, 420);
  setTimeout(function() { _osc("sine", 440, 660, 0.15, 0.21); }, 45);
}

/* Mute toggle — bound to [U] in input.js */
function sfxToggleMute() {
  SFX_MUTED = !SFX_MUTED;
  if (typeof localStorage !== "undefined") localStorage.setItem("sda_mute", SFX_MUTED ? "1" : "0");
  if (typeof musicUpdate === "function") musicUpdate(); /* MOB-78: SOUND off silences the music too */
}

/* ===== MOB-78: BACKGROUND MUSIC (Music 1 of 3, from MOB-51) =====
   One looping track at a time, chosen from the MUSIC table in js/data.js by musicWanted():
   the biome's boss loop while its main boss (floors 10, 20 ... 100) is alive, else the rare loop on about
   1 floor in 10, else the main loop. The rare roll is its own mulberry32 stream on (run seed, floor), so the floor
   RNG, Seeded and Daily runs are unchanged, and the same floor always rolls the same way.
   Plays only during a run (PLAY), with MUSIC on and SOUND not muted, while the page is visible.
   WebAudio buffer loop (gapless), about 0.5 s fades on a switch. Files with have:false are never requested,
   and a file that fails to load or decode is skipped quietly (remembered as bad for this page load).
   musicUpdate() is called from syncUI (js/ui.js); it is cheap when nothing changes. */
const MUSIC_KEY="sda_music",MUSIC_FADE=0.5,MUSIC_VOL=0.32;
let _muCur=null,_muBuf={},_muLoading={},_muBad={},_muWant=null,_muHidden=false;
function musicOn(){let v=null;try{v=localStorage.getItem(MUSIC_KEY);}catch(e){}return v!=="0";}
function musicSetOn(on){try{localStorage.setItem(MUSIC_KEY,on?"1":"0");}catch(e){}syncMusicBtn();musicUpdate();}
function musicToggle(){const on=!musicOn();musicSetOn(on);return on;}
function syncMusicBtn(){try{if(typeof document==="undefined"||!document.querySelectorAll)return;const on=musicOn();document.querySelectorAll('[data-act="music"]').forEach(b=>{b.textContent=on?"MUSIC":"MUSIC ✕";b.title=(on?"Turn off":"Turn on")+" background music (L)";});}catch(e){}}
function _muSlug(depth){const B=(typeof TILE_BIOMES!=="undefined")?TILE_BIOMES:["house","lowe","park","vastco","soccer","school","resto","idkea","hood","hoa"];return B[Math.max(0,Math.min(B.length-1,Math.floor((Math.max(1,depth)-1)/10)))];}
function musicRareFloor(seed,depth){if(typeof mulberry32!=="function")return false;const r=mulberry32(((seed|0)^0x6D75)+depth*104729)();return r<(typeof MUSIC_RARE_CHANCE!=="undefined"?MUSIC_RARE_CHANCE:0.1);}
/* the track key ("house:main" ...) the current state asks for, or null for silence */
function musicWanted(){
 if(typeof MUSIC==="undefined"||typeof game==="undefined"||!game||typeof mode==="undefined"||typeof State==="undefined"||mode!==State.PLAY)return null;
 const slug=_muSlug(game.depth||1),B=MUSIC[slug];if(!B)return null;
 let role="main";
 if(game.depth%10===0&&(game.enemies||[]).some(e=>e.isBoss&&e.hp>0))role="boss";
 else if(game.depth%10!==0&&musicRareFloor(game.seed,game.depth))role="rare";
 return slug+":"+role;}
function _muTrack(k){if(!k||typeof MUSIC==="undefined")return null;const p=k.split(":"),B=MUSIC[p[0]];return B&&B[p[1]]||null;}
function _muLoad(k,t){
 if(_muBuf[k]||_muLoading[k]||_muBad[k])return;
 const ac=_getAC();if(!ac||typeof fetch!=="function"){_muBad[k]=1;return;}
 _muLoading[k]=1;
 fetch(t.file).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();})
  .then(ab=>new Promise((ok,no)=>{try{const p=ac.decodeAudioData(ab,ok,no);if(p&&p.then)p.then(ok,no);}catch(e){no(e);}}))
  .then(buf=>{_muBuf[k]=buf;delete _muLoading[k];musicUpdate();})
  .catch(()=>{_muBad[k]=1;delete _muLoading[k];});}
function _muStop(fade){if(!_muCur)return;const c=_muCur;_muCur=null;
 try{const ac=_ac,t=ac.currentTime;c.g.gain.cancelScheduledValues(t);c.g.gain.setValueAtTime(c.g.gain.value,t);c.g.gain.linearRampToValueAtTime(0,t+(fade?MUSIC_FADE:0.02));c.s.stop(t+(fade?MUSIC_FADE:0.02)+0.05);}catch(e){try{c.s.stop();}catch(e2){}}}
function _muStart(k){const ac=_getAC();if(!ac||ac.state!=="running")return false;const buf=_muBuf[k];if(!buf)return false;
 try{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=buf;s.loop=true;s.connect(g);g.connect(ac.destination);
  const t=ac.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(MUSIC_VOL,t+MUSIC_FADE);s.start(t);_muCur={k:k,s:s,g:g};return true;}catch(e){_muBad[k]=1;return false;}}
function musicUpdate(){
 let k=null;
 try{k=(!_muHidden&&musicOn()&&!SFX_MUTED)?musicWanted():null;}catch(e){k=null;}
 _muWant=k;
 if(_muCur&&_muCur.k===k)return;
 const t=_muTrack(k);
 if(!k||!t||!t.have||_muBad[k]){_muStop(true);return;}
 if(!_muBuf[k]){_muLoad(k,t);return;}/* keep the old loop until the new one is ready; musicUpdate runs again on load */
 if(!_ac||_ac.state!=="running"){_getAC();return;}/* iOS: waits for the first tap (durable.js unlock) */
 _muStop(true);_muStart(k);}
function musicStats(){return{on:musicOn(),want:_muWant,playing:_muCur?_muCur.k:null,loaded:Object.keys(_muBuf),bad:Object.keys(_muBad),hidden:_muHidden,ctx:_ac?_ac.state:null};}
if(typeof document!=="undefined"&&document.addEventListener){
 document.addEventListener("visibilitychange",()=>{_muHidden=document.visibilityState==="hidden";if(_muHidden)_muStop(false);musicUpdate();});
 /* after the first gesture unlocks audio (durable.js), start whatever is waiting */
 ["pointerup","keyup"].forEach(t=>document.addEventListener(t,()=>{if(_muWant&&(!_muCur||_muCur.k!==_muWant))setTimeout(musicUpdate,0);},{passive:true}));
}
