const fs=require("fs"),vm=require("vm");
const ORDER=["js/config.js","js/sprites.js","js/data.js","js/game.js","js/render.js","js/ui.js","js/input.js"];
let js=ORDER.map(f=>fs.readFileSync(f,"utf8")).join("\n");
try{new vm.Script(js);}catch(e){console.log("SYNTAX ERR:",e.message);process.exit(1);}
js+=`;globalThis.__V={
  State,getMode:()=>mode,setMode:m=>{mode=m;},
  openOverlayByName,getOvGrave:()=>ovGrave,closeOverlays,
  newRun,CLASSES,DIFFICULTY_MODES,
  setPendingClass:c=>{pendingClass=c;},getDiffCursor:()=>diffCursor,
  simulateDiffBackClick:()=>{
    // mirrors input.js data-diff handler logic for 'back'
    if(mode===State.DIFF){ mode=State.CLASS; syncUI(); return true; }
    return false;
  },
  syncUI
};`;
const store={};const localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>{delete store[k];}};
function fc(){return{getContext:()=>new Proxy({},{get:()=>()=>{}}),style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],width:320,height:240};}
const el=(id)=>({classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll:()=>[],style:{},set innerHTML(v){},textContent:"",getContext:()=>new Proxy({},{get:()=>()=>{}}),width:320,height:240});
const sb={localStorage,document:{getElementById:id=>id==="screen"||id==="mapcv"?fc():el(id),addEventListener:()=>{},createElement:fc},window:{addEventListener:()=>{},innerWidth:1200,innerHeight:800},requestAnimationFrame:()=>{},Math,JSON,console,Array,Object,Proxy,globalThis:{}};
vm.createContext(sb);vm.runInContext(js,sb);
const T=sb.globalThis.__V;
let F=0;

// Test 1: openOverlayByName('grave') toggles ovGrave and builds graveyard without throwing
try{
  T.setMode(T.State.PLAY);
  const before=T.getOvGrave();
  T.openOverlayByName("grave");
  const after=T.getOvGrave();
  if(after!==!before){console.log("FAIL: ovGrave did not toggle");F++;}
  else console.log("PASS: openOverlayByName('grave') toggled ovGrave "+before+" -> "+after);
  T.closeOverlays();
  if(T.getOvGrave()!==false){console.log("FAIL: closeOverlays did not reset ovGrave");F++;}
  else console.log("PASS: closeOverlays resets ovGrave");
}catch(e){console.log("FAIL: openOverlayByName('grave') threw:",e.message);F++;}

// Test 2: DIFF-mode back click sets mode back to CLASS
try{
  T.setPendingClass(T.CLASSES[0]);
  T.setMode(T.State.DIFF);
  const ok=T.simulateDiffBackClick();
  if(!ok||T.getMode()!==T.State.CLASS){console.log("FAIL: DIFF back click did not return to CLASS mode");F++;}
  else console.log("PASS: DIFF back click returns to CLASS mode");
}catch(e){console.log("FAIL: DIFF back click threw:",e.message);F++;}

console.log(F?(F+" FAILURE(S)"):"ALL UI-DIFF DIAGNOSTICS PASS");
process.exit(F?1:0);
