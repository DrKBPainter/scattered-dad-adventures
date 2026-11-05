/* ===== SCATTERED DAD ADVENTURES -- bestcards.js =====
   Mobile Bestiary: every creature and boss as a mini comic card (same look as the Dad-select deck).
   Discovered: front = issue number, biome tag, sprite on a halftone burst in the biome's colors, name banner;
   tap flips to the back = stat boxes, times seen, first floor, flavor text.
   Undiscovered: a dark "?" card stamped NOT YET ENCOUNTERED; it does not flip and reveals nothing.
   Used by buildBest() (ui.js) on compact layouts only; desktop keeps the original list.
   Depends on: sprites.js, data.js, render.js (_sprCached/_sprPx), ui.js (esc, oB). Not in the harness.
   ===================================================== */

const BEST_BIOME_CFG={
 "The House":            {top:'#2a1a10',bot:'#4a2c18',acc:'#d97a2b',tag:'THE HOUSE'},
 "Lowe & Behold":        {top:'#0a1a2e',bot:'#14304e',acc:'#5fa8e0',tag:'LOWE & BEHOLD'},
 "The Park":             {top:'#08200a',bot:'#164a18',acc:'#5fbf4f',tag:'THE PARK'},
 "Vastco":               {top:'#1e0a0a',bot:'#401414',acc:'#e0453a',tag:'VASTCO'},
 "Soccer Complex":       {top:'#062a10',bot:'#0e4a1e',acc:'#9be88a',tag:'SOCCER COMPLEX'},
 "The School":           {top:'#2a2008',bot:'#4a3810',acc:'#f4c430',tag:'THE SCHOOL'},
 "The Family Restaurant":{top:'#2a0e16',bot:'#4a1a28',acc:'#ff6f9c',tag:'FAMILY RESTAURANT'},
 "IDKEA":                {top:'#0a1640',bot:'#1a2a6a',acc:'#f4c430',tag:'IDKEA'},
 "The Neighborhood":     {top:'#10200e',bot:'#24401c',acc:'#b0d060',tag:'THE NEIGHBORHOOD'},
 "The HOA Dominion":     {top:'#1a0a2a',bot:'#341650',acc:'#b06fd0',tag:'HOA DOMINION'},
 "water":                {top:'#04182a',bot:'#0a3050',acc:'#37b0b0',tag:'AQUATIC'}
};
const BEST_BIOME_ORDER=["The House","Lowe & Behold","The Park","Vastco","Soccer Complex","The School","The Family Restaurant","IDKEA","The Neighborhood","The HOA Dominion"];

function _bcCfg(c){if(c.biome)return BEST_BIOME_CFG[c.biome]||BEST_BIOME_CFG["The House"];const b=BEST_BIOME_ORDER[Math.min(BEST_BIOME_ORDER.length-1,Math.max(0,Math.ceil((c.floor||1)/10)-1))];return BEST_BIOME_CFG[b];}
function _bcEsc(s){return (typeof esc==="function")?esc(s):String(s);}
function _bcDraw(cv,spr){const cx=cv.getContext("2d");if(!cx||!spr)return;cx.imageSmoothingEnabled=false;let e=null;try{if(typeof _sprCached==="function")e=_sprCached(spr,null,null);}catch(err){e=null;}
 if(e&&e.cv){cx.drawImage(e.cv,0,0);return;}if(typeof _sprPx==="function")_sprPx(spr,null,null,(col,x,y)=>{cx.fillStyle=col;cx.fillRect(x,y,1,1);});}

function buildBestCards(host){const all=CREATURES.concat(BOSSES);const n=Object.keys(discovered).length;
 let h='<h1 class="bc-h1">BESTIARY</h1><div class="bc-prog"><span style="width:'+Math.round(100*n/all.length)+'%"></span></div><p class="dim bc-sub">Logged '+n+' / '+all.length+' &middot; kept across every run &middot; tap a card to flip it</p><div class="bc-grid">';
 all.forEach((c,i)=>{const d=discovered[c.id];const boss=!c.biome;const cfg=_bcCfg(c);const no='No. '+(i+1);
  if(!d){h+='<div class="bc-card bc-und"><div class="bc-face bc-front"><div class="bc-mast"><span>'+no+'</span><span>'+(boss?'BOSS':'???')+'</span></div><div class="bc-art"><span class="bc-q">?</span><span class="bc-stamp">NOT YET<br>ENCOUNTERED</span></div><div class="bc-name">? ? ?</div></div></div>';return;}
  const w=c.sprite&&c.sprite[0]?c.sprite[0].length:32,ht=c.sprite?c.sprite.length:32;
  const where=boss?('FLOOR '+c.floor):cfg.tag;
  const stat=(l,v)=>'<div class="bc-st"><b>'+v+'</b><span>'+l+'</span></div>';
  h+='<div class="bc-card'+(boss?' bc-boss':'')+'" data-bc="'+i+'" style="--dc-top:'+cfg.top+';--dc-bot:'+cfg.bot+';--dc-acc:'+cfg.acc+'"><div class="bc-inner">'
   +'<div class="bc-face bc-front"><div class="bc-mast"><span>'+no+'</span><span class="bc-where">'+where+'</span></div>'
    +'<div class="bc-art"><canvas class="bc-spr" width="'+w+'" height="'+ht+'" data-bcspr="'+i+'"></canvas>'+(boss?'<div class="bc-burst"><span>BOSS!</span></div>':'')+'</div>'
    +'<div class="bc-name">'+_bcEsc(c.name)+'</div></div>'
   +'<div class="bc-face bc-back"><div class="bc-bhead">'+_bcEsc(c.name)+'</div><div class="bc-bbody">'
    +'<div class="bc-stats">'+stat('HP',c.hp)+stat('ATK',c.atk)+stat('DEF',c.def)+stat('XP',c.xp)+'</div>'
    +'<div class="bc-seen">Seen <b>'+d.count+'&times;</b> &middot; first on floor <b>'+d.firstFloor+'</b>'+(c.pack?' &middot; travels in packs':'')+'</div>'
    +'<div class="bc-flav">'+_bcEsc(c.flavor||'')+'</div></div></div>'
  +'</div></div>';});
 h+='</div>';host.innerHTML=h;host.classList.add("bc-host");
 host.querySelectorAll("canvas[data-bcspr]").forEach(cv=>_bcDraw(cv,all[+cv.dataset.bcspr].sprite));
 if(!host._bcWired){host._bcWired=true;host.addEventListener("click",ev=>{if(!host.classList.contains("bc-host"))return;const card=ev.target.closest(".bc-card[data-bc]");if(card)card.classList.toggle("flipped");});}}
