/* =======================================================================
   M18 release: "Share the Game" sheet (#m18share).
   - QR code for the public site (assets/ui/qr-share.png, made by tools/tools_make_qr.js; SDA_SHARE_URL must match its SHARE_URL)
   - the link, a Copy button, and the phone's own Share menu where the browser has one (navigator.share)
   Opened by openShare() from: desktop title row [Q], the end-of-run screen [Q], the How To screen, and the MORE drawer (SHARE).
   The protected title cover, Dad deck and Bestiary cards are not changed. Loaded after durable.js; not in the harness ORDER.
   ======================================================================= */
const SDA_SHARE_URL="https://drkbpainter.github.io/scattered-dad-adventures/";
var _m18Open=false;// var: syncUI may ask before this file runs
const M18_NOTES=[
 "Written on a napkin from the Family Restaurant: “Dad, you made it look easy. It was not easy. — your biggest fan”",
 "Magnet on the fridge: “WORLD'S OKAYEST DAD” has been crossed out. Someone wrote “BEST” over it in marker.",
 "Folded note in the glovebox: “Thanks for always driving. And for the snacks. Mostly the snacks.”",
 "Crayon on the back of a receipt: “My dad can fix anything. Except the printer. Nobody can fix the printer.”"];
function _m18Esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function _m18Msg(t,cls){const m=document.getElementById("m18msg");if(m){m.textContent=t||"";m.className="m18-msg"+(cls?" "+cls:"");}}
function _m18Render(){
 const b=document.getElementById("m18body");if(!b)return;
 const canShare=typeof navigator!=="undefined"&&typeof navigator.share==="function";
 const ver=typeof GAME_VERSION!=="undefined"?GAME_VERSION:"";
 b.innerHTML=
  '<p>Every adventure needs a second dad. Point a phone camera at the code, or send the link.</p>'+
  '<div class="m18-qr"><img src="assets/ui/qr-share.png" width="246" height="246" alt="QR code for '+_m18Esc(SDA_SHARE_URL)+'"></div>'+
  '<input id="m18url" type="text" readonly value="'+_m18Esc(SDA_SHARE_URL)+'" aria-label="Game link">'+
  '<div class="m18-row"><button type="button" class="m18-btn m18-pri" data-m18="copy">Copy link</button>'+
  (canShare?'<button type="button" class="m18-btn" data-m18="share">Share&hellip;</button>':'')+'</div>'+
  '<p class="dim">Plays in the browser on phones, tablets and computers. No app store, no account, no assembly required (some assembly required).</p>'+
  '<p class="m18-note">'+_m18Esc(M18_NOTES[Date.now()%M18_NOTES.length])+'</p>'+
  '<p class="dim m18-ver">Scattered Dad Adventures v'+_m18Esc(ver)+'</p>';
 _m18Msg("");}
function openShare(){
 const s=document.getElementById("m18share");if(!s)return;
 if(typeof setMoreOpen==="function"&&typeof _m8More!=="undefined"&&_m8More)setMoreOpen(false);
 _m18Open=true;_m18Render();s.classList.add("show");
 const c=s.querySelector(".m18-close");if(c)try{c.focus({preventScroll:true});}catch(e){}}
function closeShare(){const s=document.getElementById("m18share");if(!s)return;_m18Open=false;s.classList.remove("show");try{const f=document.activeElement;if(f&&s.contains(f)&&f.blur)f.blur();}catch(e){}/* focus must leave the hidden sheet, or its keydown guard would swallow game keys */if(typeof markDirty==="function")markDirty();}
async function _m18Do(a){
 try{
  if(a==="close"){closeShare();return;}
  if(a==="copy"){let ok=false;
   try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(SDA_SHARE_URL);ok=true;}}catch(e){}
   if(!ok){try{const i=document.getElementById("m18url");i.focus();i.select();ok=document.execCommand&&document.execCommand("copy");}catch(e){}}
   _m18Msg(ok?"Link copied. Paste it into the family group text, between the photo of the dog and the question about Thanksgiving.":"Select the link above and copy it.",ok?"ok":"");return;}
  if(a==="share"){try{await navigator.share({title:"Scattered Dad Adventures",text:"A dad descends 100 floors of suburban chaos to recover the Remote. Bring snacks.",url:SDA_SHARE_URL});_m18Msg("Shared. Word of mouth: the oldest marketing department.","ok");}
   catch(e){if(!e||e.name!=="AbortError")_m18Msg("The Share menu did not open. Copy the link instead.","warn");}return;}
 }catch(e){_m18Msg((e&&e.message)||"Something went wrong.","warn");}}
(function(){
 const s=document.getElementById("m18share");
 if(s){
  s.addEventListener("click",ev=>{if(ev.target===s){closeShare();return;}const b=ev.target.closest("[data-m18]");if(b)_m18Do(b.dataset.m18);});
  s.addEventListener("keydown",ev=>{if(ev.key==="Escape"){closeShare();ev.preventDefault();}ev.stopPropagation();});}
 /* While the sheet is open, game keys must not leak to the document handler. */
 document.addEventListener("keydown",ev=>{if(_m18Open&&s&&!s.contains(ev.target)){if(ev.key==="Escape")closeShare();ev.stopImmediatePropagation();ev.preventDefault();}},true);
 document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-m18open]");if(b){ev.preventDefault();openShare();}});
})();
