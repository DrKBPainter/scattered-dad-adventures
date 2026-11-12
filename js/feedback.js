/* =======================================================================
   MOB-42: "Send Feedback" sheet (#m42fb).
   Players report a bug or idea through a Google Form KBP owns ("Scattered Dad Adventures - Field Report");
   answers land in the form's response Sheet. The game is a static site, so the button only opens the form
   in a new tab with five "Game details" answers filled in: game version, service-worker build, floor,
   Dad class, and screen size. Nothing else leaves the device (no save data, no name, no email).
   Opened by openFeedback() from: the How To screen, the MORE drawer (FEEDBACK, also on the Tool Belt list),
   the desktop title row and end-of-run screen ([F]). The protected title cover, Dad deck and Bestiary cards
   are not changed. Loaded after share.js; not in the harness ORDER.
   If the form is ever rebuilt, update FEEDBACK_FORM below (viewform URL + the five entry IDs).
   ======================================================================= */
const FEEDBACK_FORM={
 url:"https://docs.google.com/forms/d/e/1FAIpQLScLghnGfzzF8rRU2P0uzRwNJZVQauc0CkXNquhlLGempj5kUw/viewform",
 entries:{version:"entry.1047757947",build:"entry.744535750",floor:"entry.1229318425",cls:"entry.1459329037",screen:"entry.816564332"}
};
var _m42Open=false;// var: syncUI may ask before this file runs
var _m42Build="";
const M42_NOTES=[
 "Sticky note on the monitor: “Dad says if you see something, say something. He means bugs. He also means the gutters.”",
 "Written on the back of a soccer schedule: “Thank you for telling us what broke. Most people just sigh loudly.”",
 "Crayon on a paper placemat: “My dad reads ALL the reviews before he buys anything. Even the 3-star ones.”"];
function _m42Esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
/* Ask the active service worker which build it serves (sw.js answers GET_BUILD). Resolves "" when there is none. */
function _m42AskBuild(){
 return new Promise(res=>{
  try{
   const sw=navigator.serviceWorker;if(!sw||!sw.controller){res("");return;}
   let done=false;const fin=v=>{if(done)return;done=true;try{sw.removeEventListener("message",on);}catch(e){}res(v||"");};
   const on=ev=>{const d=ev&&ev.data;if(d&&d.type==="BUILD")fin(String(d.build||""));};
   sw.addEventListener("message",on);sw.controller.postMessage({type:"GET_BUILD"});setTimeout(()=>fin(""),800);
  }catch(e){res("");}});}
/* The five "Game details" answers. Plain strings; the form shows them as editable short answers. */
function feedbackDetails(){
 const st=typeof State!=="undefined"?State:{};
 const g=(typeof game!=="undefined"&&game)?game:null;
 const inRun=g&&(mode===st.PLAY||mode===st.DEAD||mode===st.WIN);
 let floor="Not in a run";
 if(inRun){floor=String(g.depth)+(g.ascent?" (Ascent)":"")+(g.isDaily?" (Daily)":"");
  if(mode===st.DEAD)floor+=" - run ended";else if(mode===st.WIN)floor+=" - victory";}
 const cls=inRun&&g.cls?String(g.cls.name||g.cls.id||""):"";
 let scr="";
 try{const w=window.innerWidth,h=window.innerHeight,dpr=window.devicePixelRatio||1;
  const standalone=(window.matchMedia&&window.matchMedia("(display-mode: standalone)").matches)||navigator.standalone===true;
  scr=w+"x"+h+" @"+(Math.round(dpr*100)/100)+"x "+(w>=h?"landscape":"portrait")+
   ((typeof COMPACT!=="undefined"&&COMPACT)?", phone layout":", desktop layout")+(standalone?", installed":"");}catch(e){}
 return {version:typeof GAME_VERSION!=="undefined"?GAME_VERSION:"",build:_m42Build||"no service worker",floor:floor,cls:cls,screen:scr};}
function feedbackUrl(d){
 d=d||feedbackDetails();
 const q=["usp=pp_url"];
 for(const k of Object.keys(FEEDBACK_FORM.entries)){if(d[k])q.push(FEEDBACK_FORM.entries[k]+"="+encodeURIComponent(d[k]));}
 return FEEDBACK_FORM.url+"?"+q.join("&");}
function _m42Msg(t,cls){const m=document.getElementById("m42msg");if(m){m.textContent=t||"";m.className="m42-msg"+(cls?" "+cls:"");}}
function _m42Render(){
 const b=document.getElementById("m42body");if(!b)return;
 const d=feedbackDetails();
 const off=typeof navigator!=="undefined"&&navigator.onLine===false;
 b.innerHTML=
  '<p>Found a bug? Got an idea? Did a goose do something it should not? File a Field Report. It is a short form, and a real person reads every one.</p>'+
  '<div class="m42-row"><a class="m42-btn m42-pri" id="m42go" href="'+_m42Esc(feedbackUrl(d))+'" target="_blank" rel="noopener noreferrer">OPEN THE REPORT FORM &#8599;</a></div>'+
  (off?'<p class="warn">You look offline. The form needs an internet connection.</p>':'')+
  '<h2>The game fills in</h2>'+
  '<ul class="m42-list">'+
  '<li>Version: <b>'+_m42Esc(d.version)+'</b></li>'+
  '<li>Build: <b>'+_m42Esc(d.build)+'</b></li>'+
  '<li>Floor: <b>'+_m42Esc(d.floor)+'</b></li>'+
  (d.cls?'<li>Dad: <b>'+_m42Esc(d.cls)+'</b></li>':'')+
  '<li>Screen: <b>'+_m42Esc(d.screen)+'</b></li></ul>'+
  '<p class="dim">That is all. No saves, no name, no email (unless you type one in). The form opens in a new tab; your run waits here.</p>'+
  '<p class="m42-note">'+_m42Esc(M42_NOTES[Date.now()%M42_NOTES.length])+'</p>';
 _m42Msg("");}
function openFeedback(){
 const s=document.getElementById("m42fb");if(!s)return;
 if(typeof setMoreOpen==="function"&&typeof _m8More!=="undefined"&&_m8More)setMoreOpen(false);
 _m42Open=true;_m42Render();s.classList.add("show");
 const c=s.querySelector(".m42-close");if(c)try{c.focus({preventScroll:true});}catch(e){}
 /* the build answer arrives a moment later; refresh the link when it does */
 if(!_m42Build)_m42AskBuild().then(v=>{if(v){_m42Build=v;if(_m42Open)_m42Render();}});}
function closeFeedback(){const s=document.getElementById("m42fb");if(!s)return;_m42Open=false;s.classList.remove("show");try{const f=document.activeElement;if(f&&s.contains(f)&&f.blur)f.blur();}catch(e){}if(typeof markDirty==="function")markDirty();}
(function(){
 const s=document.getElementById("m42fb");
 if(s){
  s.addEventListener("click",ev=>{if(ev.target===s){closeFeedback();return;}
   const b=ev.target.closest("[data-m42]");if(b&&b.dataset.m42==="close"){closeFeedback();return;}
   const a=ev.target.closest("#m42go");if(a){a.href=feedbackUrl();/* newest floor/build at the moment of the tap */
    if(typeof saveRun==="function"&&typeof game!=="undefined"&&game&&mode===State.PLAY)try{saveRun();}catch(e){}
    _m42Msg("Form opened in a new tab. Come back here when you are done; Dad will keep the seat warm.","ok");}});
  s.addEventListener("keydown",ev=>{if(ev.key==="Escape"){closeFeedback();ev.preventDefault();}ev.stopPropagation();});}
 /* While the sheet is open, game keys must not leak to the document handler. */
 document.addEventListener("keydown",ev=>{if(_m42Open&&s&&!s.contains(ev.target)){if(ev.key==="Escape")closeFeedback();ev.stopImmediatePropagation();ev.preventDefault();}},true);
 document.addEventListener("click",ev=>{const b=ev.target.closest&&ev.target.closest("[data-m42open]");if(b){ev.preventDefault();openFeedback();}});
 _m42AskBuild().then(v=>{if(v)_m42Build=v;});
})();
