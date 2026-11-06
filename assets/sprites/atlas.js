/* Scattered Dad Adventures -- sprite atlas index (N21 PNG pipeline).
   Loaded as a plain <script> (works from file:// too, unlike fetch of a .json file).
   EMPTY until M13 generates the upgraded art: with no sheets the game draws the ASCII sprites exactly as before.

   Format (written by the M13 atlas tool; do not hand-edit generated entries):
   var SPRITE_ATLAS={
    version:1,
    sheets:[
     {src:"assets/sprites/<name>.png",          // path relative to the game page
      sprites:{
       "SPR_DAD_GRILL":[x,y,w,h],               // a global SPR_* sprite constant from js/sprites.js
       "creature:<id>":[x,y,w,h],               // CREATURES[].sprite, by id (js/data.js)
       "boss:<id>":[x,y,w,h]                    // BOSSES[].sprite, by id
      }}
    ]};
   Rules: w,h must be the ASCII grid size (normally 32x32) times a whole number k (1-8); other sizes are
   rejected and that sprite stays ASCII. Art must be drawn from the default PAL colors (skin chars f/F in
   PAL's colors): skin tone and the cursed-gear tint are applied at draw time by recoloring the pixels in
   cells whose ASCII char changes color, keeping their shading. Every sheet PNG must also be added to the
   ASSETS list in sw.js (then run node tools/tools_sw_stamp.js) so it works offline. */
var SPRITE_ATLAS={version:1,sheets:[]};
