/* =======================================================================
   MOB-81: "Sound & Motion" sheet (#m81snd) -- one button for sound effects, music and motion.
   - SOUND EFFECTS: on/off (sda_mute), volume 0-100 (sda_sfx_vol), vibration on/off (sda_sfx_vibe)
   - MUSIC: on/off (sda_music), volume 0-100 (sda_music_vol), vibration on/off (sda_music_vibe)
   - MOTION: on/off (sda_motion; screen shake, sliding, damage numbers, walk frames)
   Vibration rows appear only where the browser can vibrate (Android; iPhone browsers cannot).
   Opened by openSoundSheet() from the SOUND & MOTION button (desktop action bar, the MORE drawer, a Tool Belt slot)
   and the [V] key. The keys [U] (sound) and [L] (music) still toggle directly.
   Settings live in js/audio.js and js/render.js; this file is only the sheet. Loaded after feedback.js; not in the harness ORDER.
   ======================================================================= */
var _m81Open=false;// var: syncUI may ask before this file runs
const M81_NOTES=[
 "Sticky note on the stereo: “Dad, the volume knob goes LEFT too. Love, everyone.”",
 "Written on the back of a utility bill: “You hum when you cook. We like it. Don't tell anyone we said that.”",
 "Crayon, slightly smudged: “My dad can hear a dripping faucet from three rooms away. He is a superhero.”",
 "Note taped to the thermostat: “Thank you for working so hard for us. (Do not touch this.)”"];
function _m81Esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function _m81Sw(id,on,label){return '<button type="button" class="m81-sw'+(on?' m81-on':'')+'" data-m81="'+id+'" role="switch" aria-checked="'+(on?'true':'false')+'">'+_m81Esc(label)+'<span>'+(on?'ON':'OFF')+'</span></button>';}
function _m81Vol(id,v,label){return '<label class="m81-vol"><span class="m81-vl">'+_m81Esc(label)+'</span><input type="range" min="0" max="100" step="5" value="'+v+'" data-m81vol="'+id+'" aria-label="'+_m81Esc(label)+'"><b class="m81-vv" id="m81v-'+id+'">'+v+'</b></label>';}
function _m81Render(){
 const b=document.getElementById("m81body");if(!b)return;
 const sfxOn=!(typeof SFX_MUTED!=="undefined"&&SFX_MUTED);
 const muOn=typeof musicOn==="function"?musicOn():true;
 const moOn=typeof juiceMotion==="function"?juiceMotion():true;
 const vib=typeof vibeSupported==="function"&&vibeSupported();
 const sv=typeof sfxVol==="function"?sfxVol():100,mv=typeof musicVol==="function"?musicVol():60;
 b.innerHTML=
  '<section class="m81-sec"><h2>SOUND EFFECTS</h2><p class="dim">Knee cracks, oofs, pickups and the rest of the soundtrack of fatherhood.</p>'+
   _m81Sw("sfx",sfxOn,"Sound effects")+_m81Vol("sfx",sv,"Volume")+
   (vib?_m81Sw("sfxvibe",typeof sfxVibeOn==="function"&&sfxVibeOn(),"Vibrate on hits, level-ups and bosses"):'')+'</section>'+
  '<section class="m81-sec"><h2>MUSIC</h2><p class="dim">A tiny orchestra that follows Dad from biome to biome.</p>'+
   _m81Sw("music",muOn,"Music")+_m81Vol("music",mv,"Volume")+
   (vib?_m81Sw("musicvibe",typeof musicVibeOn==="function"&&musicVibeOn(),"Vibrate when the music changes"):'')+'</section>'+
  '<section class="m81-sec"><h2>MOTION</h2><p class="dim">Screen shake, sliding, damage numbers and Dad&rsquo;s walking legs.</p>'+
   _m81Sw("motion",moOn,"Motion effects")+'</section>'+
  (vib?'':'<p class="dim m81-small">This browser cannot vibrate (iPhones never do), so the vibration switches are hidden.</p>')+
  '<p class="m81-note">'+_m81Esc(M81_NOTES[Date.now()%M81_NOTES.length])+'</p>';}
function openSoundSheet(){
 const s=document.getElementById("m81snd");if(!s)return;
 if(typeof setMoreOpen==="function"&&typeof _m8More!=="undefined"&&_m8More)setMoreOpen(false);
 _m81Open=true;_m81Render();s.classList.add("show");
 const c=s.querySelector(".m81-close");if(c)try{c.focus({preventScroll:true});}catch(e){}}
function closeSoundSheet(){const s=document.getElementById("m81snd");if(!s)return;_m81Open=false;s.classList.remove("show");try{const f=document.activeElement;if(f&&s.contains(f)&&f.blur)f.blur();}catch(e){}if(typeof markDirty==="function")markDirty();}
function _m81Log(t){try{if(typeof mode!=="undefined"&&typeof State!=="undefined"&&mode===State.PLAY&&typeof log==="function"){log(t,"dim");if(typeof syncUI==="function")syncUI();}}catch(e){}}
function _m81Do(a){
 if(a==="close"){closeSoundSheet();return;}
 if(a==="sfx"){if(typeof sfxToggleMute==="function")sfxToggleMute();if(typeof syncMuteBtn==="function")syncMuteBtn();
  _m81Log(SFX_MUTED?"Sound effects off. The knees still crack. You just will not hear it.":"Sound effects on. Every oof is now a matter of public record.");
  if(!SFX_MUTED&&typeof sfxPickup==="function")sfxPickup();}
 else if(a==="music"){if(typeof musicToggle==="function"){const on=musicToggle();_m81Log(on?"Music on. Somewhere, a tiny orchestra resumes its vigil.":"Music off. The tiny orchestra packs up without complaint.");}}
 else if(a==="motion"){if(typeof toggleJuiceMotion==="function"){const on=toggleJuiceMotion();_m81Log(on?"Motion effects on. The world resumes its theatrics.":"Motion effects off. The world holds still, as you have always asked it to.");}}
 else if(a==="sfxvibe"){if(typeof setSfxVibe==="function"){const on=!sfxVibeOn();setSfxVibe(on);if(on&&typeof sfxVibe==="function")sfxVibe("hit");}}
 else if(a==="musicvibe"){if(typeof setMusicVibe==="function"){const on=!musicVibeOn();setMusicVibe(on);if(on&&typeof _vibe==="function")_vibe([25,70,25],"music");}}
 _m81Render();}
function _m81VolInput(el,commit){const id=el.dataset.m81vol,v=Math.max(0,Math.min(100,Math.round(+el.value||0)));
 const o=document.getElementById("m81v-"+id);if(o)o.textContent=String(v);
 if(id==="sfx"){if(typeof setSfxVol==="function")setSfxVol(v);if(commit&&typeof sfxPickup==="function")sfxPickup();/* a sample at the new volume */}
 else if(id==="music"){if(typeof setMusicVol==="function")setMusicVol(v);if(typeof musicUpdate==="function")musicUpdate();}}
(function(){
 const s=document.getElementById("m81snd");
 if(s){
  s.addEventListener("click",ev=>{if(ev.target===s){closeSoundSheet();return;}const b=ev.target.closest("[data-m81]");if(b)_m81Do(b.dataset.m81);});
  s.addEventListener("input",ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.m81vol)_m81VolInput(t,false);});
  s.addEventListener("change",ev=>{const t=ev.target;if(t&&t.dataset&&t.dataset.m81vol)_m81VolInput(t,true);});
  s.addEventListener("keydown",ev=>{if(ev.key==="Escape"){closeSoundSheet();ev.preventDefault();}ev.stopPropagation();});}
 /* While the sheet is open, game keys must not leak to the document handler. [V] opens it during a run. */
 document.addEventListener("keydown",ev=>{
  if(_m81Open&&s&&!s.contains(ev.target)){if(ev.key==="Escape")closeSoundSheet();ev.stopImmediatePropagation();ev.preventDefault();return;}
  if(!_m81Open&&(ev.key==="v"||ev.key==="V")&&!ev.ctrlKey&&!ev.metaKey&&!ev.altKey&&typeof mode!=="undefined"&&typeof State!=="undefined"&&mode===State.PLAY){
   const t=ev.target;if(t&&(t.tagName==="INPUT"||t.tagName==="TEXTAREA"))return;
   if(typeof pendingConfirm!=="undefined"&&pendingConfirm)return;if(typeof pendingMenu!=="undefined"&&pendingMenu)return;
   ev.stopImmediatePropagation();ev.preventDefault();openSoundSheet();}},true);
})();
