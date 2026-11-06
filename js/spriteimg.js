/* ===== SCATTERED DAD ADVENTURES -- spriteimg.js (N21) =====
   PNG sprite loader. Reads SPRITE_ATLAS (assets/sprites/atlas.js), loads each sheet, cuts every listed
   sprite into its own canvas and hands it to registerSpriteImage() (render.js), which draws it in place of
   the ASCII sprite and bakes skin-tone / cursed variants. Anything that fails stays ASCII.
   ?ascii in the URL turns image sprites off.  spriteImageStats() reports what loaded.
   Depends on: render.js (registerSpriteImage, markDirty), sprites.js, data.js. Not in the harness ORDER.
   ========================================================= */
(function(){
 const st={disabled:false,sheets:0,loaded:0,failed:0,registered:0,rejected:[],unknown:[],done:false};
 window.spriteImageStats=function(){return JSON.parse(JSON.stringify(st));};
 let q=null;try{q=new URLSearchParams(location.search);}catch(e){}
 if(q&&q.has("ascii")){st.disabled=true;st.done=true;return;}
 const A=(typeof SPRITE_ATLAS!=="undefined")?SPRITE_ATLAS:null;
 const sheets=(A&&Array.isArray(A.sheets))?A.sheets.filter(s=>s&&typeof s.src==="string"&&s.sprites&&typeof s.sprites==="object"):[];
 st.sheets=sheets.length;if(!sheets.length||typeof registerSpriteImage!=="function"){st.done=true;return;}
 function resolve(key){let m;
  if((m=/^creature:(.+)$/.exec(key))&&typeof CREATURES!=="undefined"){const c=CREATURES.find(x=>x.id===m[1]);return c?c.sprite:null;}
  if((m=/^boss:(.+)$/.exec(key))&&typeof BOSSES!=="undefined"){const b=BOSSES.find(x=>x.id===m[1]);return b?b.sprite:null;}
  if(/^SPR_[A-Z0-9_]+$/.test(key)){try{const v=(new Function("return typeof "+key+"!=='undefined'?"+key+":null;"))();return Array.isArray(v)?v:null;}catch(e){return null;}}
  return null;}
 function cut(img,r){if(!Array.isArray(r)||r.length!==4)return null;const[x,y,w,h]=r.map(Number);if(!(w>0&&h>0&&x>=0&&y>=0&&x+w<=img.naturalWidth&&y+h<=img.naturalHeight))return null;
  const c=document.createElement("canvas");c.width=w;c.height=h;const cx=c.getContext("2d");if(!cx)return null;cx.imageSmoothingEnabled=false;cx.drawImage(img,x,y,w,h,0,0,w,h);return c;}
 let pending=sheets.length;function fin(){if(--pending<=0){st.done=true;if(typeof markDirty==="function")markDirty();}}
 sheets.forEach(sh=>{const img=new Image();img.decoding="async";
  img.onload=function(){st.loaded++;for(const key of Object.keys(sh.sprites)){const spr=resolve(key);if(!spr){st.unknown.push(key);continue;}const c=cut(img,sh.sprites[key]);if(c&&registerSpriteImage(spr,c))st.registered++;else st.rejected.push(key);}
   if(st.unknown.length||st.rejected.length)console.warn("sprite atlas: "+st.unknown.length+" unknown key(s), "+st.rejected.length+" rejected; those stay ASCII");fin();};
  img.onerror=function(){st.failed++;console.warn("sprite sheet failed to load, using ASCII sprites: "+sh.src);fin();};
  img.src=sh.src;});
})();
