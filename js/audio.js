/* ===== SCATTERED DAD ADVENTURES — audio.js =====
   WebAudio SFX: all sounds generated procedurally via the Web Audio API.
   No external files required. AudioContext created lazily on first interaction.
   Sounds: sfxKneeCrack / sfxOof / sfxPickup / sfxCraft / sfxUnlock
   Mute:   sfxToggleMute() — state persisted in localStorage ("sda_mute")
   Music:  MOB-78 looping background player (musicUpdate / musicToggle / musicStats), localStorage "sda_music" ("1"/"0", default on).
   MOB-81: volume and vibration settings (sfxVol / musicVol / sfxVibeOn / musicVibeOn), set from the SOUND & MOTION sheet (js/soundmotion.js).
     sda_sfx_vol 0-100 (default 100 = the old loudness), sda_music_vol 0-100 (default 60 = the old 0.32 gain),
     sda_sfx_vibe / sda_music_vibe "1"/"0" (default off; Android only: iPhone browsers have no navigator.vibrate).
     SOUND off now silences sound effects only; MUSIC has its own switch.
   ============================================= */
"use strict";
let _ac = null;
let SFX_MUTED = (typeof localStorage !== "undefined" && localStorage.getItem("sda_mute") === "1");

/* ===== MOB-81: volume + vibration settings ===== */
const SFX_VOL_KEY="sda_sfx_vol",MUSIC_VOL_KEY="sda_music_vol",SFX_VIBE_KEY="sda_sfx_vibe",MUSIC_VIBE_KEY="sda_music_vibe";
const SFX_VOL_DEF=100,MUSIC_VOL_DEF=60,MUSIC_VOL_MAX=0.32*100/MUSIC_VOL_DEF;/* slider 60 = the pre-MOB-81 music gain 0.32 */
function _sndGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function _sndSet(k,v){try{localStorage.setItem(k,String(v));}catch(e){}}
function _sndPct(k,d){const v=parseInt(_sndGet(k),10);return (isFinite(v)&&v>=0&&v<=100)?v:d;}
function sfxVol(){return _sndPct(SFX_VOL_KEY,SFX_VOL_DEF);}
function musicVol(){return _sndPct(MUSIC_VOL_KEY,MUSIC_VOL_DEF);}
function setSfxVol(v){_sndSet(SFX_VOL_KEY,Math.max(0,Math.min(100,Math.round(+v||0))));}
function setMusicVol(v){_sndSet(MUSIC_VOL_KEY,Math.max(0,Math.min(100,Math.round(+v||0))));_muApplyVol();}
function vibeSupported(){try{return typeof navigator!=="undefined"&&typeof navigator.vibrate==="function";}catch(e){return false;}}
function sfxVibeOn(){return _sndGet(SFX_VIBE_KEY)==="1";}
function musicVibeOn(){return _sndGet(MUSIC_VIBE_KEY)==="1";}
function setSfxVibe(on){_sndSet(SFX_VIBE_KEY,on?"1":"0");}
function setMusicVibe(on){_sndSet(MUSIC_VIBE_KEY,on?"1":"0");}
let _vibeLast=0,_vibeCount={sfx:0,music:0};
function _vibe(pat,kind){if(!vibeSupported())return false;const now=Date.now();if(now-_vibeLast<120)return false;_vibeLast=now;try{navigator.vibrate(pat);_vibeCount[kind]=(_vibeCount[kind]||0)+1;return true;}catch(e){return false;}}
/* sound-effect buzz: hits taken ("hit"), level-ups ("level"), a boss coming into view ("boss"). Works with SOUND off too. */
function sfxVibe(what){if(!sfxVibeOn())return false;return _vibe(what==="boss"?[90,60,90,60,160]:what==="level"?[40,50,40,50,120]:35,"sfx");}
/* music buzz: a short double pulse when the music changes (a new biome, a boss theme, a rare track) */
function musicVibe(){if(!musicVibeOn())return false;return _vibe([25,70,25],"music");}
function vibeStats(){return{supported:vibeSupported(),sfx:sfxVibeOn(),music:musicVibeOn(),count:Object.assign({},_vibeCount)};}
/* carry-over: before MOB-81, SOUND off also silenced the music. The first time this build runs for a player who had
   SOUND off, MUSIC is switched off too, so nothing starts playing that was silent before. sda_music_vol marks it done. */
(function(){try{if(typeof localStorage==="undefined")return;if(localStorage.getItem(MUSIC_VOL_KEY)!=null)return;
 if(localStorage.getItem("sda_mute")==="1"&&localStorage.getItem("sda_music")!=="1")localStorage.setItem("sda_music","0");
 localStorage.setItem(MUSIC_VOL_KEY,String(MUSIC_VOL_DEF));}catch(e){}})();

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
  const vol = sfxVol() / 100; if (vol <= 0) return; gain = gain * vol; /* MOB-81 */
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
  const vol = sfxVol() / 100; if (vol <= 0) return; gain = gain * vol; /* MOB-81 */
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
  sfxVibe("hit"); /* MOB-81 */
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
  /* MOB-81: SOUND no longer silences the music (MUSIC has its own switch in the SOUND & MOTION sheet) */
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
const MUSIC_KEY="sda_music",MUSIC_FADE=0.5;
function _muGain(){return MUSIC_VOL_MAX*musicVol()/100;}/* MOB-81: was a fixed 0.32 */
function _muApplyVol(){if(!_muCur||!_ac)return;try{const t=_ac.currentTime;_muCur.g.gain.cancelScheduledValues(t);_muCur.g.gain.setValueAtTime(_muCur.g.gain.value,t);_muCur.g.gain.linearRampToValueAtTime(_muGain(),t+0.08);}catch(e){}}
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
 else if(game.depth%10!==0&&musicRareFloor(game.seed,game.depth)&&B.rare&&B.rare.have)role="rare";/* MOB-80: a rare loop not yet in the project falls back to main */
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
  const lp=_muLoopPts(buf,(_muTrack(k)||{}).len);if(lp){s.loopStart=lp[0];s.loopEnd=lp[1];}
  const t=ac.currentTime;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(_muGain(),t+MUSIC_FADE);s.start(t,lp?lp[0]:0);_muCur={k:k,s:s,g:g};return true;}catch(e){_muBad[k]=1;return false;}}
/* MOB-80: loop exactly len seconds of the loop body. Some browsers keep the MP3 encoder's lead-in (a few ms of near-silence)
   in the decoded buffer and some trim it; skip it if present, so the seam lands where tools_make_loops.js blended it. */
function _muLoopPts(buf,len){try{if(!(len>0))return null;const d=buf.getChannelData(0),sr=buf.sampleRate,lim=Math.min(d.length,Math.floor(sr*0.08));
 let i=0;while(i<lim&&Math.abs(d[i])<1e-4)i++;if(i>=lim)i=0;const a=i/sr,b=a+len;if(b>buf.duration+0.002)return null;return[a,Math.min(b,buf.duration)];}catch(e){return null;}}
function musicUpdate(){
 let k=null;
 try{k=(!_muHidden&&musicOn()&&musicVol()>0)?musicWanted():null;}catch(e){k=null;}/* MOB-81: SOUND off no longer silences music; volume 0 does */
 _muWant=k;
 if(_muCur&&_muCur.k===k)return;
 const t=_muTrack(k);
 if(!k||!t||!t.have||_muBad[k]){_muStop(true);return;}
 if(!_muBuf[k]){_muLoad(k,t);return;}/* keep the old loop until the new one is ready; musicUpdate runs again on load */
 if(!_ac||_ac.state!=="running"){_getAC();return;}/* iOS: waits for the first tap (durable.js unlock) */
 const had=!!_muCur;_muStop(true);if(_muStart(k)&&had)musicVibe();}/* MOB-81: buzz when one loop hands over to another */
function musicStats(){return{on:musicOn(),vol:musicVol(),gain:_muCur?_muCur.g.gain.value:null,want:_muWant,playing:_muCur?_muCur.k:null,loaded:Object.keys(_muBuf),bad:Object.keys(_muBad),hidden:_muHidden,ctx:_ac?_ac.state:null};}
if(typeof document!=="undefined"&&document.addEventListener){
 document.addEventListener("visibilitychange",()=>{_muHidden=document.visibilityState==="hidden";if(_muHidden)_muStop(false);musicUpdate();});
 /* after the first gesture unlocks audio (durable.js), start whatever is waiting */
 ["pointerup","keyup"].forEach(t=>document.addEventListener(t,()=>{if(_muWant&&(!_muCur||_muCur.k!==_muWant))setTimeout(musicUpdate,0);},{passive:true}));
}
