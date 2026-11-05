/* ===== SCATTERED DAD ADVENTURES -- dadselect.js =====
   Mobile "Choose Your Dad" screen: a swipeable deck of comic-book cards.
   Front = cover art (sprite on a halftone burst) + name + skin-tone picker.
   Back  = vital statistics as pip meters, signature Dadisms, blurb, and a note from the kids.
   Active only on compact layouts (body.m-compact) while mode===State.CLASS; desktop keeps the
   canvas portrait + HUD list. Shares classCursor/skinCursor with the keyboard handlers in ui.js,
   and "Choose" calls openClassConfirm() (ui.js), which shows the backstory with a Continue button.
   Depends on: config.js, sprites.js, data.js, render.js, ui.js. Not loaded by the node harness.
   ================================================== */

/* Cover callouts (starburst) and the encouraging note on each card back. */
const DAD_CARD_COPY={
 grill:   {burst:"MEDIUM-RARE OR BUST!",       note:"Crayon on a napkin: \"your burgers are the best ones.\""},
 diy:     {burst:"NOW 90% COMPLETE!",          note:"Sticky note on the toolbox: \"you can fix anything. love you.\""},
 tech:    {burst:"HAVE YOU TRIED RESTARTING?", note:"Sent from the kid's tablet: \"thx for fixing the wifi ur a genius\""},
 gym:     {burst:"ONE MORE REP!",              note:"Drawn on the protein tub: a stick figure with enormous arms, labeled \"MY DAD.\""},
 tactical:{burst:"NOW LAMINATED!",             note:"Tucked into the binder: \"I always feel safe with you.\" Laminated, obviously."},
 sports:  {burst:"EVERYBODY LISTEN!",          note:"Markered on the cooler lid: \"best coach. best dad. sorry I picked flowers during the game.\""},
 yard:    {burst:"STRIPES ARE A CALLING!",     note:"Chalked on the driveway: \"our yard is the best yard because you're in it.\""}
};
const DAD_CRAFT_LABEL={food:"Food & drink",general:"General junk",tech:"Gadgets & cables",none:"None. Refuses to read instructions."};
const DAD_SHARED_DADISMS={backinmyday:1,dad_sneeze:1};

let _dsEl=null,_dsTrack=null,_dsFlip=-1,_dsShownIdx=-1,_dsSkinDrawn=-1,_dsDrag=null,_dsSwipedAt=0,_dsActive=false;

function _dsSpr(id){if(id==="grill")return SPR_DAD_GRILL;if(id==="diy")return SPR_DAD_DIY;if(id==="tech")return SPR_DAD_TECH;if(id==="gym")return SPR_DAD_GYM;if(id==="tactical")return SPR_DAD_TACTICAL;if(id==="sports")return SPR_DAD_SPORTS;if(id==="yard")return SPR_DAD_YARD;return (typeof SPR_DAD!=="undefined")?SPR_DAD:null;}
function _dsSkin(){if(typeof SKIN_SWATCHES==="undefined")return null;const n=SKIN_SWATCHES.length;return SKIN_SWATCHES[((skinCursor%n)+n)%n];}
function _dsEsc(s){return (typeof esc==="function")?esc(s):String(s);}

/* Draw one Dad sprite into a card's 32x32 canvas (CSS scales it up, pixelated). */
function _dsDrawSprite(cv,id){const cx=cv.getContext("2d");if(!cx)return;cx.clearRect(0,0,cv.width,cv.height);cx.imageSmoothingEnabled=false;const spr=_dsSpr(id);if(!spr)return;const s=_dsSkin();const cmap=s?{'f':s.f,'F':s.F}:null;
 let e=null;try{if(typeof _sprCached==="function")e=_sprCached(spr,null,cmap);}catch(err){e=null;}
 if(e&&e.cv){cx.drawImage(e.cv,0,0);return;}
 if(typeof _sprPx==="function")_sprPx(spr,null,cmap,(c,x,y)=>{cx.fillStyle=c;cx.fillRect(x,y,1,1);});}

function _dsHpMax(){let h=1;CLASSES.forEach(c=>{h=Math.max(h,c.hp);});return h;}
/* Attribute meters: one pip per point, 10 slots, same scale for every Dad and every stat. */
function _dsPips(v){let h='';for(let i=0;i<10;i++)h+='<i class="'+(i<v?'on':'')+'"></i>';return h;}

function _dsCardHTML(c,i){const cfg=(typeof PORTRAIT_CFG!=="undefined"&&PORTRAIT_CFG[c.id])||{top:'#0d1b2a',bot:'#1b263b',accent:'#f4c430'};const copy=DAD_CARD_COPY[c.id]||{burst:"NEW!",note:""};const hpMax=_dsHpMax();
 const stat=(lbl,full,v)=>'<div class="dc-stat"><span class="dc-sl" title="'+full+'">'+lbl+'</span><span class="dc-pips">'+_dsPips(v)+'</span><span class="dc-sv">'+v+'</span></div>';
 const hpRow='<div class="dc-stat"><span class="dc-sl" title="Hit Points">HP</span><span class="dc-hp"><i style="width:'+Math.round(100*c.hp/hpMax)+'%"></i></span><span class="dc-sv">'+c.hp+'</span></div>';
 const moves=(c.dadisms||[]).filter(id=>!DAD_SHARED_DADISMS[id]).map(id=>{const d=(typeof DADISMS!=="undefined")?DADISMS.find(x=>x.id===id):null;return d?'<li><b>'+_dsEsc(d.name)+'</b>'+(d.desc?' <span>'+_dsEsc(d.desc)+'</span>':'')+'</li>':'';}).join('');
 return '<div class="dc-slide" data-ds-slide="'+i+'"><div class="dc-card" style="--dc-top:'+cfg.top+';--dc-bot:'+cfg.bot+';--dc-acc:'+cfg.accent+'"><div class="dc-inner">'
 +'<div class="dc-face dc-front">'
  +'<div class="dc-mast"><span class="dc-pub">DAD COMICS</span><span class="dc-issue">No. '+(i+1)+' &middot; 25&cent;</span></div>'
  +'<div class="dc-art"><canvas class="dc-spr" width="32" height="32" data-ds-spr="'+c.id+'"></canvas><div class="dc-burst"><span>'+_dsEsc(copy.burst)+'</span></div><div class="dc-fliptag">TAP TO FLIP &#8635;</div></div>'
  +'<div class="dc-name">'+_dsEsc(c.name)+'</div>'
  +'<div class="dc-skin"><button type="button" class="dc-sk-btn" data-skin="prev" aria-label="Previous skin tone">&#9664;</button><span class="dc-sk-lbl"><i class="dc-sk-sw"></i><span class="dc-sk-nm"></span></span><button type="button" class="dc-sk-btn" data-skin="next" aria-label="Next skin tone">&#9654;</button></div>'
 +'</div>'
 +'<div class="dc-face dc-back">'
  +'<div class="dc-bhead">'+_dsEsc(c.name)+'<small>VITAL STATISTICS</small></div>'
  +'<div class="dc-bbody">'
   +hpRow+stat("PAT","Patience",c.moxie||0)+stat("STR","Strength",c.str)+stat("DEF","Defense",c.def)+stat("PER","Perception",c.per)+stat("WIS","Wisdom",c.wis)
   +'<div class="dc-row"><b>Crafting:</b> '+_dsEsc(DAD_CRAFT_LABEL[c.craft]||c.craft||"None")+'</div>'
   +(moves?'<div class="dc-row"><b>Signature Dadisms</b><ul class="dc-moves">'+moves+'</ul></div>':'')
   +'<div class="dc-caption">'+_dsEsc(c.blurb||"")+'</div>'
   +(copy.note?'<div class="dc-note">'+_dsEsc(copy.note)+'</div>':'')
  +'</div>'
  +'<div class="dc-fliptag dc-fliptag-b">TAP TO FLIP BACK &#8635;</div>'
 +'</div>'
 +'</div></div></div>';}

function _dsBuild(){if(_dsEl||typeof document==="undefined")return;const el=document.createElement("div");el.id="dadsel";el.setAttribute("aria-label","Choose your Dad");
 let slides='',dots='';CLASSES.forEach((c,i)=>{slides+=_dsCardHTML(c,i);dots+='<button type="button" class="dc-dot" data-ds-dot="'+i+'" aria-label="'+_dsEsc(c.name)+'"></button>';});
 el.innerHTML='<div class="ds-head"><b>CHOOSE YOUR DAD</b><span class="ds-daily">DAILY CHALLENGE</span><span class="ds-hint">swipe for more Dads &middot; tap a card to flip it</span></div>'
  +'<div class="ds-view"><div class="ds-track">'+slides+'</div></div>'
  +'<div class="ds-side"><div class="ds-dots">'+dots+'</div><div class="ds-btns"><button type="button" class="ds-back" data-ds="back">&#9664; Back</button><button type="button" class="ds-go" data-ds="go">Choose</button></div></div>';
 document.body.appendChild(el);_dsEl=el;_dsTrack=el.querySelector(".ds-track");
 const view=el.querySelector(".ds-view");
 view.addEventListener("pointerdown",_dsDown);view.addEventListener("pointermove",_dsMove);view.addEventListener("pointerup",_dsUp);view.addEventListener("pointercancel",_dsCancel);
 el.addEventListener("click",_dsClick);
 try{window.addEventListener("resize",()=>{if(_dsActive)_dsSize();});}catch(e){}}

/* Size cards to the space between the header and the pinned buttons (5:7 trading-card ratio). */
function _dsSize(){if(!_dsEl)return;const v=_dsEl.querySelector(".ds-view");const w=v.clientWidth,h=v.clientHeight;if(!w||!h)return;let cw=Math.min(w-28,520,Math.round(h*5/7)),ch=Math.min(h-8,Math.round(cw*8/5));if(ch>h-8){ch=h-8;cw=Math.round(ch*5/7);}cw=Math.max(150,cw);ch=Math.max(210,ch);
 _dsEl.style.setProperty("--dc-w",cw+"px");_dsEl.style.setProperty("--dc-h",ch+"px");_dsEl.style.setProperty("--dc-fs",Math.max(9,Math.min(20,cw/24)).toFixed(1)+"px");}

function _dsPlace(anim,dx){if(!_dsTrack)return;_dsTrack.style.transition=anim?"transform .28s cubic-bezier(.2,.8,.25,1)":"none";_dsTrack.style.transform="translate3d(calc("+(-classCursor*100)+"% + "+(dx||0)+"px),0,0)";}

function _dsGo(i){const n=CLASSES.length;i=((i%n)+n)%n;if(i===classCursor){_dsPlace(true,0);return;}classCursor=i;_dsFlip=-1;if(typeof syncUI==="function")syncUI();}
function dadSelectStep(d){_dsGo(classCursor+d);}
function dadSelectFlip(){_dsFlip=(_dsFlip===classCursor)?-1:classCursor;syncDadSelect();}
function dadSelectActive(){return _dsActive;}

function _dsDown(ev){if(ev.button!==undefined&&ev.button!==0)return;if(ev.target.closest("button"))return;_dsDrag={id:ev.pointerId,x:ev.clientX,y:ev.clientY,t:Date.now(),dx:0,on:false,card:!!ev.target.closest(".dc-slide[data-ds-slide='"+classCursor+"'] .dc-card")};}
function _dsMove(ev){const d=_dsDrag;if(!d||ev.pointerId!==d.id)return;const dx=ev.clientX-d.x,dy=ev.clientY-d.y;
 if(!d.on){if(Math.abs(dx)>10&&Math.abs(dx)>Math.abs(dy)*1.2){d.on=true;try{ev.currentTarget.setPointerCapture(ev.pointerId);}catch(e){}}else return;}
 const n=CLASSES.length;let rx=dx;if((classCursor===0&&dx>0)||(classCursor===n-1&&dx<0))rx=dx*0.3;d.dx=rx;_dsPlace(false,rx);ev.preventDefault();}
function _dsUp(ev){const d=_dsDrag;if(!d||ev.pointerId!==d.id)return;_dsDrag=null;const dx=ev.clientX-d.x,dy=ev.clientY-d.y;
 if(d.on){_dsSwipedAt=Date.now();const v=Math.abs(dx)/Math.max(1,Date.now()-d.t);const w=(_dsEl&&_dsEl.querySelector(".ds-view").clientWidth)||300;const n=CLASSES.length;
  if((dx<-w*0.18||(dx<-24&&v>0.45))&&classCursor<n-1)_dsGo(classCursor+1);else if((dx>w*0.18||(dx>24&&v>0.45))&&classCursor>0)_dsGo(classCursor-1);else _dsPlace(true,0);return;}
 if(Math.abs(dx)<10&&Math.abs(dy)<10&&d.card)dadSelectFlip();}
function _dsCancel(ev){if(_dsDrag&&ev.pointerId===_dsDrag.id){_dsDrag=null;_dsPlace(true,0);}}

function _dsClick(ev){const b=ev.target.closest("button");if(!b)return;
 if(b.dataset.skin&&typeof SKIN_SWATCHES!=="undefined"){const n=SKIN_SWATCHES.length;skinCursor=(skinCursor+(b.dataset.skin==="prev"?n-1:1))%n;if(typeof syncUI==="function")syncUI();return;}
 if(b.dataset.dsDot!==undefined){_dsGo(+b.dataset.dsDot);return;}
 if(b.dataset.ds==="go"){if(typeof openClassConfirm==="function")openClassConfirm(CLASSES[classCursor]);return;}
 if(b.dataset.ds==="back"){pendingDaily=false;mode=State.TITLE;if(typeof syncUI==="function")syncUI();return;}}

/* Called at the end of syncUI(): shows/hides the deck and reflects classCursor / skinCursor / flip. */
function syncDadSelect(){if(typeof document==="undefined"||!document.body)return;
 const want=(mode===State.CLASS)&&(typeof COMPACT!=="undefined"&&COMPACT);
 if(!want){if(_dsActive){_dsActive=false;document.body.classList.remove("m-dadsel");}return;}
 _dsBuild();if(!_dsEl)return;const first=!_dsActive;
 if(first){_dsActive=true;document.body.classList.add("m-dadsel");_dsFlip=-1;_dsSize();}
 if(_dsSkinDrawn!==skinCursor||first){_dsSkinDrawn=skinCursor;_dsEl.querySelectorAll("canvas[data-ds-spr]").forEach(cv=>_dsDrawSprite(cv,cv.dataset.dsSpr));const s=_dsSkin();_dsEl.querySelectorAll(".dc-sk-sw").forEach(e=>{e.style.background=s?s.f:"#e8863a";});_dsEl.querySelectorAll(".dc-sk-nm").forEach(e=>{e.textContent=s?s.name:"";});}
 _dsEl.querySelectorAll(".dc-slide").forEach(sl=>{const i=+sl.dataset.dsSlide;sl.classList.toggle("cur",i===classCursor);sl.querySelector(".dc-card").classList.toggle("flipped",i===_dsFlip);sl.setAttribute("aria-hidden",i===classCursor?"false":"true");});
 _dsEl.querySelectorAll(".dc-dot").forEach(d=>d.classList.toggle("on",+d.dataset.dsDot===classCursor));
 const go=_dsEl.querySelector(".ds-go");if(go)go.textContent="Choose "+CLASSES[classCursor].name.replace(/^The /,"");
 _dsEl.classList.toggle("daily",!!pendingDaily);
 if(!_dsDrag||!_dsDrag.on)_dsPlace(!first&&_dsShownIdx!==classCursor,0);_dsShownIdx=classCursor;}
