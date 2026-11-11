/* ===== SCATTERED DAD ADVENTURES -- data.js =====
   All static game data: creatures, bosses, classes, items.
   This is the primary file for nightly build content additions.
   NIGHTLY BUILD INSERTION POINTS marked below.
   Depends on: nothing
   ============================================= */

/* ===== creature & boss data (reused art) ===== */
const DEFEAT_FLAVOR = [
  "He stands over the wreckage and nods once. This is enough.",
  "Victory achieved. The details are unclear. The outcome is not.",
  "He will tell no one about this. No one would understand.",
  "He exhales slowly. He has been holding that breath since Tuesday.",
  "Not his best performance. Definitely his best performance.",
  "He straightens his shirt. He is fine. He is completely fine.",
  "Another problem solved through confident persistence and partial understanding.",
  "He makes a mental note to mention this casually at some point in the future."
];

const CREATURES = [
  {
    id:"morning_obligation", defeatMsg:"He acknowledges its defeat. Tomorrow it will return. This has been understood by both parties for decades.", name:"Morning Obligation", biome:"The House",
    hp:8, atk:2, def:0, xp:4, gold:1, speed:1,
    sprite:SPR_C_MORNING_OBLIGATION,
    flavor:"Slow. Persistent. It does not chase you so much as it is simply always there. Cannot be reasoned with before coffee."
  },
  {
    id:"unread_text", defeatMsg:"Thirty-seven messages go unanswered. He feels nothing but relief.", name:"The Unread Text", biome:"The House",
    hp:4, atk:3, def:0, xp:3, gold:0, speed:1, pack:true,
    sprite:SPR_C_UNREAD_TEXT,
    flavor:"Spawns in groups. Multiplies if ignored. Each one insists it is 'just a quick question.' None of them are."
  },
  {
    id:"rogue_roomba", defeatMsg:"It will charge itself. It will be back. He cannot prevent this. He has made peace with it.", name:"Rogue Robo-Vac", biome:"The House",
    hp:10, atk:3, def:1, xp:6, gold:2, speed:1,
    sprite:SPR_C_ROGUE_ROOMBA,
    flavor:"Charts a path known only to itself. Has eaten a sock, a phone charger, and the family's sense of security. Bumps your ankles at 3 AM."
  },
  {
    id:"shopping_cart", defeatMsg:"He guides it back to the corral with the quiet dignity of a man who has always returned his carts.", name:"Shopping Cart Ambush", biome:"Lowe & Behold",
    hp:14, atk:4, def:1, xp:8, gold:3, speed:1,
    sprite:SPR_C_SHOPPING_CART,
    flavor:"One wheel possessed. Veers left under all circumstances. Always contains one item nobody placed there."
  },
  {
    id:"weekend_warrior", defeatMsg:"The project remains unfinished. This is, he realizes, also true of his own project. He does not dwell on this.", name:"Weekend Warrior", biome:"Lowe & Behold",
    hp:16, atk:5, def:2, xp:10, gold:4, speed:1,
    sprite:SPR_C_WEEKEND_WARRIOR,
    flavor:"Owns every tool. Has used three. Will explain the project to you whether or not you ask. Lumbar Injury III imminent."
  },
  {
    id:"warranty_wraith", defeatMsg:"He did not need the warranty. He has never needed the warranty. The warranty is never needed until it is.", name:"Extended Warranty Wraith", biome:"Vastco",
    hp:20, atk:6, def:2, xp:14, gold:6, speed:1,
    sprite:SPR_C_WARRANTY_WRAITH,
    flavor:"Materializes at checkout. Asks if you would like to protect your purchase. There is no correct answer. There has never been a correct answer."
  },
  {
    id:"sale_sign_golem", defeatMsg:"He calculates the savings. He does not need what he saved on. He feels good about this anyway.", name:"Sale Sign Golem", biome:"Vastco",
    hp:26, atk:7, def:4, xp:18, gold:8, speed:1,
    sprite:SPR_C_SALE_SIGN_GOLEM,
    flavor:"Constructed entirely of percentages. Each sign contradicts the one beside it. The real price is a closely guarded secret."
  },
  /* --- N1: The House additions --- */
  {
    id:"laundry_pile", defeatMsg:"He moves it to a different chair. This counts.", name:"The Laundry Pile", biome:"The House",
    hp:12, atk:3, def:1, xp:7, gold:1, speed:1,
    sprite:SPR_C_LAUNDRY_PILE,
    flavor:"Has been on the chair since before the current presidency. It knows every secret the family has whispered near it. It is waiting for the right moment."
  },
  {
    id:"permission_slip", defeatMsg:"He signs it, dates it wrong, and submits it with confidence. Close enough is a form of victory.", name:"The Permission Slip", biome:"The House",
    hp:6, atk:4, def:0, xp:5, gold:0, speed:2, pack:true,
    sprite:SPR_C_PERMISSION_SLIP,
    flavor:"Due last Tuesday. Technically still valid. The consequences of not returning it remain implied but severe. It has found you."
  },
  {
    id:"thermostat_phantom", defeatMsg:"He sets it to 68. It will be 74 by morning. He will not find out until morning.", name:"The Thermostat Phantom", biome:"The House",
    hp:14, atk:4, def:2, xp:9, gold:2, speed:1,
    sprite:SPR_C_THERMOSTAT_PHANTOM,
    flavor:"Nobody touched it. Nobody ever touches it. Yet the temperature is always wrong. The Phantom is always right. You are always wrong."
  },
  {
    id:"mystery_leftovers", defeatMsg:"He does not open it. This is the correct decision. He will never know what it was. This is also correct.", name:"The Mystery Leftovers", biome:"The House",
    hp:18, atk:5, def:1, xp:12, gold:3, speed:1,
    sprite:SPR_C_MYSTERY_LEFTOVERS,
    flavor:"Sealed in a container dated November. Which November is unclear. Do not open it. Do not make eye contact. Whatever is inside has been evolving."
  },
  /* --- Baby Chaos additions (The House) --- */
  {
    id:"overflowing_diaper", defeatMsg:"Vanquished. He has won, but at a cost that cannot be articulated to anyone who wasn't there.", name:"The Overflowing Diaper of Stench",
    biome:"The House",
    hp:10, atk:4, def:0, xp:6, gold:1, speed:1,
    sprite:SPR_C_OVERFLOWING_DIAPER,
    flavor:"The ancient enemy. Biological warfare at its purest. The smell precedes it by two rooms and lingers for three. It has never been changed. It cannot be changed. It will not be changed. It approaches with the unhurried confidence of an entity that knows its own power."
  },
  {
    id:"unknown_substance", defeatMsg:"He declares it chocolate. This resolves nothing. He feels better.", name:"The Unknown Brown Substance",
    biome:"The House",
    hp:6, atk:3, def:2, xp:5, gold:0, speed:1,
    sprite:SPR_C_UNKNOWN_SUBSTANCE,
    flavor:"Origin: unknown. Composition: under investigation. Timeline: unclear. The question 'is that chocolate?' has been asked and not answered for six consecutive days. Do not investigate. Do not acknowledge. The investigation would not go well for anyone."
  },
  {
    id:"mrs_kowalski_fish", defeatMsg:"He regards the goldfish with something approaching respect. It has outlasted two presidencies. It has earned this loss.", name:"Hungry Goldfish (Mrs. Kowalski's Rm. 14)", biome:"water", aquatic:true,
    hp:8, atk:4, def:0, xp:5, gold:1, speed:1,
    sprite:SPR_C_GOLDFISH,
    flavor:"Flushed down the classroom toilet in 2003 by a child who shall not be named (it was Tyler). Rediscovered in 2009. Flushed again. Found again in 2014. Science submitted three papers. The fish did not respond to peer review. The fish is not interested in your conclusions. The fish is hungry. The fish has always been hungry. The fish will outlast the school, the teacher, the district, and Tyler, who still feels bad about it."
  },
  /* --- N2: Lowe & Behold additions --- */
  {
    id:"selfcheckout_sentinel", defeatMsg:"Unexpected item in victory area. He presses continue. He is approved.", name:"Self-Checkout Sentinel", biome:"Lowe & Behold",
    hp:13, atk:4, def:2, xp:9, gold:3, speed:1,
    sprite:SPR_C_SELFCHECKOUT,
    flavor:"Four open lanes. All closed. This one is open, and it has chosen you. 'Unexpected item in bagging area.' There is no item. There has never been an item. It is waiting for an associate who will never come."
  },
  {
    id:"unfindable_associate", defeatMsg:"Found at last. They did not make eye contact. This was mutual and correct.", name:"The Unfindable Associate", biome:"Lowe & Behold",
    hp:11, atk:5, def:1, xp:9, gold:2, speed:1,
    sprite:SPR_C_UNFINDABLE_ASSOCIATE,
    flavor:"Always two aisles over. Always helping someone else. The moment you stop looking, it materializes behind you to ask if you're finding everything okay. You were not. You are not. You never will be."
  },
  {
    id:"paint_swatch_swarm", defeatMsg:"He sweeps them into the waste bin. His spouse will choose Accessible Beige. This was always going to happen.", name:"Paint Swatch Swarm", biome:"Lowe & Behold",
    hp:6, atk:3, def:0, xp:5, gold:1, speed:1, pack:true,
    sprite:SPR_C_PAINT_SWATCHES,
    flavor:"Two hundred shades of off-white, each with a name like 'Accessible Beige' and 'Agreeable Gray.' They drift. They multiply. Your spouse will reject all of them and choose the first one you suggested."
  },
  {
    id:"aisle12_forklift", defeatMsg:"The pallet remains. He does not take the display item. He is not that kind of man. He nearly is.", name:"Aisle 12 Forklift", biome:"Lowe & Behold",
    hp:18, atk:5, def:3, xp:12, gold:5, speed:1,
    sprite:SPR_C_FORKLIFT,
    flavor:"Beeps when it reverses. Beeps when it advances. Beeps, you suspect, for the sheer joy of beeping. The pallet it carries contains the thing you came for, marked DO NOT SELL -- DISPLAY ONLY."
  },
  /* --- N3: Vastco additions --- */
  {
    id:"vastco_sample_station", defeatMsg:"He has eaten eleven samples and purchased nothing in the sample category. He considers this discipline.", name:"The Sample Station", biome:"Vastco",
    hp:8, atk:3, def:0, xp:5, gold:3, speed:1, pack:true,
    sprite:SPR_C_SAMPLE_STATION,
    flavor:"Appears at the end of every aisle. You came in for paper towels. You will now taste seventeen varieties of cheese and purchase a $40 air fryer. Statistics show the conversion rate is 100%. There are no statistics. There are only more samples."
  },
  {
    id:"vastco_flatbed", defeatMsg:"He returns the flatbed to the corral with immense personal satisfaction. Nobody was watching. This does not diminish it.", name:"The Vastco Flatbed", biome:"Vastco",
    hp:22, atk:4, def:5, xp:14, gold:5, speed:1,
    sprite:SPR_C_VASTCO_FLATBED,
    flavor:"Not a cart. A vehicle. Twelve feet long, carrying thirty boxes of paper towels and one confused dad who picked it up because all the regular carts were gone. Turns radius: approximately the parking lot."
  },
  {
    id:"vastco_membership", defeatMsg:"His card is expired, renewed, and expired again. He is through. He is not sure how.", name:"The Membership Card Inspector", biome:"Vastco",
    hp:18, atk:5, def:2, xp:12, gold:4, speed:1,
    sprite:SPR_C_MEMBERSHIP_INSPECTOR,
    flavor:"Stands at the entrance. Stands at the exit. Your card is expired. Your card has always been expired. You do not have a card. You have never had a card. Without a card you cannot enter. Without entering you cannot buy a card. The Inspector is aware of this paradox and considers it your problem."
  },
  {
    id:"vastco_bulk_spirit", defeatMsg:"He has bought forty-eight of something he will not finish. He feels this was the right call.", name:"The Spirit of Bulk Savings", biome:"Vastco",
    hp:16, atk:6, def:1, xp:12, gold:8, speed:2,
    sprite:SPR_C_BULK_SPIRIT,
    flavor:"Manifests as a certainty. The per-unit cost is better in bulk. The per-unit cost is always better in bulk. You will need this eventually. You will never need forty-eight of this. You will buy forty-eight of this. You will feel good about it until the move."
  },
  /* --- N3: The Park additions --- */
  {
    id:"park_soccer_coach", defeatMsg:"He nods respectfully at the fallen coach. Both men know the U8 season was going to be rough regardless.", name:"The Youth Soccer Coach", biome:"The Park",
    hp:20, atk:6, def:1, xp:14, gold:3, speed:1,
    sprite:SPR_C_SOCCER_COACH,
    flavor:"Has been coaching the U8 team for nine seasons. Has never played soccer. Has absolute opinions about positioning. Carries a clipboard, a whistle, and a blood pressure reading that his doctor would prefer not to know about."
  },
  {
    id:"park_offleash_dog", defeatMsg:"The dog looks at him. He looks at the dog. They have reached an understanding that neither can explain.", name:"The Off-Leash Dog", biome:"The Park",
    hp:10, atk:5, def:0, xp:8, gold:1, speed:2, pack:true,
    sprite:SPR_C_DOG_OFFLEASH,
    flavor:"Friendly. So friendly. Incredibly friendly. Cannot be redirected. Cannot be called back. Its owner is somewhere behind you shouting a name and the dog will not respond to that name because it never has. Targets the cleanest clothes."
  },
  {
    id:"park_headphone_jogger", defeatMsg:"The jogger passes him twice more at full speed, apologizing sincerely each time. He stops counting.", name:"The Jogger (Headphones In)", biome:"The Park",
    hp:14, atk:4, def:0, xp:10, gold:2, speed:2,
    sprite:SPR_C_JOGGER,
    flavor:"Cannot hear you. Will not hear you. Moving at a speed that suggests urgency but no particular destination. Will make eye contact at the last possible moment, apologize with genuine sincerity, and continue at the same speed in the same direction. The collision is simply a consequence of the headphones."
  },
  {
    id:"park_event_coordinator", defeatMsg:"She will be back next weekend for the 5K. She is already planning the 5K.", name:"The Event Coordinator", biome:"The Park",
    hp:16, atk:5, def:2, xp:12, gold:5, speed:1,
    sprite:SPR_C_EVENT_COORDINATOR,
    flavor:"The 5K finisher chute is closing in three minutes and she needs everyone to move back. She has a radio. She has a floor plan. She has opinions about your parking. Her vest has seventeen pockets and a lanyard and a look that suggests she has been awake since 4:30 AM and will remain awake until the bounce house deflates. You are standing in the wrong place. You are always standing in the wrong place."
  },

  /* ================================================================
     SOCCER COMPLEX (floors 41-50)
     >>> NIGHTLY BUILD INSERTION POINT: SOCCER_COMPLEX <<<
     Target pool size: 6-8 creatures. Current: 3.
     ================================================================ */
  {
    id:"sideline_parent", defeatMsg:"He says nothing. He looks at the scoreboard. He looks at the sideline parent. He says nothing.", name:"The Sideline Parent", biome:"Soccer Complex",
    hp:22, atk:7, def:1, xp:16, gold:4, speed:1,
    sprite:SPR_C_SIDELINE_PARENT,
    flavor:"Has been on the sideline since the U6 years. Has opinions about every substitution, every offside call, and every other parent's parenting. The clipboard is decorative. The volume is not."
  },
  {
    id:"the_trophy", defeatMsg:"He picks it up. It says PARTICIPANT. He sets it back down. Both parties accept this outcome.", name:"The Trophy", biome:"Soccer Complex",
    hp:30, atk:6, def:4, xp:18, gold:12, speed:1,
    sprite:SPR_C_TROPHY,
    flavor:"Has not moved from the display case since 1987. This season it escaped. Nobody is taking responsibility. The engraving reads 'PARTICIPANT.' It does not find this funny."
  },
  {
    id:"the_waterboy", defeatMsg:"He takes the orange slices. You always take the orange slices. The orange slices are not optional.", name:"The Waterboy", biome:"Soccer Complex",
    hp:20, atk:6, def:0, xp:14, gold:3, speed:1,
    sprite:SPR_C_WATERBOY,
    flavor:"Has a cooler, a ladle, and a sense of purpose that cannot be redirected. Does not care if you are not thirsty. The orange slices are non-negotiable. Inflicts SOAKED on contact."
  },

  /* ================================================================
     THE SCHOOL (floors 51-60)
     >>> NIGHTLY BUILD INSERTION POINT: THE_SCHOOL <<<
     Target pool size: 6-8 creatures. Current: 3.
     ================================================================ */
  {
    id:"permission_form", defeatMsg:"He signs it with a confidence that suggests he read it. He did not read it. He has never read one.", name:"The Permission Form", biome:"The School",
    hp:8, atk:8, def:0, xp:12, gold:0, speed:1,
    sprite:SPR_C_PERMISSION_FORM,
    flavor:"Due last Tuesday. Technically still valid in a legal grey area nobody wants to test. The parent signature line has been filled in with a scribble and a prayer. It has found you. It will always find you."
  },
  {
    id:"science_fair_project", defeatMsg:"He is proud of the methodology. The methodology was his idea. He added the graph at midnight. He stands by the graph.", name:"The Science Fair Project", biome:"The School",
    hp:28, atk:8, def:2, xp:20, gold:5, speed:1,
    sprite:SPR_C_SCIENCE_FAIR,
    flavor:"Built the night before. The hypothesis was generated at 11:47 PM. The data was collected at 11:52. The graph was drawn in marker. It has achieved consciousness. It is angry about the methodology."
  },
  {
    id:"car_pool_line", defeatMsg:"He has advanced one car length. He has been here since 2:45. He will be back Thursday.", name:"The Car Pool Line", biome:"The School",
    hp:40, atk:7, def:5, xp:22, gold:2, speed:1,
    sprite:SPR_C_CARPOOL_LINE,
    flavor:"Begins forming at 2:45 PM. Has never moved faster than 0.3 miles per hour. The child who needs picking up is in the building. You are in the line. These facts have nothing to do with each other."
  },

  /* ================================================================
     THE FAMILY RESTAURANT (floors 61-70)
     >>> NIGHTLY BUILD INSERTION POINT: FAMILY_RESTAURANT <<<
     Target pool size: 6-8 creatures. Current: 3.
     ================================================================ */
  {
    id:"the_wait", defeatMsg:"The pager has finally buzzed. The table it assigns is next to the kitchen. He takes it without complaint. This is who he is.", name:"The Wait", biome:"The Family Restaurant",
    hp:35, atk:9, def:3, xp:20, gold:0, speed:1,
    sprite:SPR_C_THE_WAIT,
    flavor:"Not a delay. A being. The pager has not buzzed. The pager will never buzz. The name was called thirteen minutes ago while you were parking. You were not there. The Wait has always been there."
  },
  {
    id:"childrens_menu", defeatMsg:"Four noodles eaten. He calls this a win. Any parent would call this a win. This is a win.", name:"The Children's Menu", biome:"The Family Restaurant",
    hp:18, atk:8, def:0, xp:16, gold:0, speed:1,
    sprite:SPR_C_CHILDRENS_MENU,
    flavor:"Twelve options. The child refuses all of them and orders plain pasta. Four noodles will be eaten. The crayons have been eaten. The puzzle on the back has been solved incorrectly and the child is proud of this."
  },
  {
    id:"the_check", defeatMsg:"He pays it. He tips twenty percent. He does the math wrong. He tips twenty-two percent. He does not correct this.", name:"The Check", biome:"The Family Restaurant",
    hp:30, atk:10, def:2, xp:22, gold:20, speed:1,
    sprite:SPR_C_THE_CHECK,
    flavor:"Nobody remembers what they ordered. Nobody has exact change. The gratuity has already been added. Split four ways, it comes out to a number that ends in a moral judgment."
  },

  /* ================================================================
     IDKEA (floors 71-80)
     >>> NIGHTLY BUILD INSERTION POINT: IDKEA <<<
     Target pool size: 6-8 creatures. Current: 3.
     ================================================================ */
  {
    id:"assembly_instructions", defeatMsg:"Step 17 is completed. He does not know how. He does not look at what he built. He cannot look at Step 17 again.", name:"The Assembly Instructions", biome:"IDKEA",
    hp:25, atk:10, def:1, xp:20, gold:5, speed:1,
    sprite:SPR_C_ASSEMBLY_INSTRUCTIONS,
    flavor:"Step 17 makes no sense. Step 17 has never made sense. The English translation omits it entirely and picks up at Step 18 as though nothing happened. The Swedish original describes 'The Decisive Moment.' You are in it."
  },
  {
    id:"missing_dowel", defeatMsg:"Found under the couch cushion. It was never in the bag. It was always under the couch cushion.", name:"The Missing Dowel", biome:"IDKEA",
    hp:15, atk:9, def:0, xp:18, gold:3, speed:1,
    sprite:SPR_C_MISSING_DOWEL,
    flavor:"Part 7 of 16. Not in the bag. Not on the floor. Not under the instructions. Not in the bag a second time, even though you checked. The entire structural integrity of the BILVAK bookcase depends on it. The bookcase knows this."
  },
  {
    id:"idkea_employee", defeatMsg:"The employee was found. They were not in the correct department. This was never going to change.", name:"The IDKEA Employee", biome:"IDKEA",
    hp:45, atk:9, def:7, xp:25, gold:5, speed:1,
    sprite:SPR_C_IDKEA_EMPLOYEE,
    flavor:"Wearing the yellow vest. Is not sure what department this is. Will find someone who knows. Has been looking since 2019. The someone has not been found. The vest's DEF bonus is not a metaphor."
  },
  {
    id:"jugs_of_bedazzlement", defeatMsg:"He leaves them where they are. They are display only. He respects this.", name:"Jugs of Bedazzlement", biome:"IDKEA",
    hp:30, atk:8, def:3, xp:19, gold:5, speed:1,
    sprite:SPR_C_JUGS_OF_BEDAZZLEMENT,
    flavor:"Display items from the seasonal home accents section. Large. Ornate. Absolutely covered in rhinestones. The label reads: 'Tuscany Collection, Decorative Only.' They have been placed at eye level. This was a deliberate choice by the merchandising team."
  },

  /* ================================================================
     THE NEIGHBORHOOD (floors 81-90)
     >>> NIGHTLY BUILD INSERTION POINT: THE_NEIGHBORHOOD <<<
     Target pool size: 6-8 creatures. Current: 3.
     ================================================================ */
  {
    id:"lawnmower_peak", defeatMsg:"Quiet hours began four minutes ago. He made it. He made it with four minutes to spare.", name:"The Lawnmower (Peak Hours)", biome:"The Neighborhood",
    hp:50, atk:11, def:4, xp:28, gold:6, speed:1,
    sprite:SPR_C_LAWNMOWER,
    flavor:"Starts at 7:55 AM on Saturday. Quiet hours begin at 8:00 AM. The owner is aware of the ordinance. The owner has always been aware of the ordinance. The new mower is louder than the last one. This was intentional."
  },
  {
    id:"neighborhood_newsletter", defeatMsg:"He reads the correction notice. It is also incorrect. He does not submit a correction to the correction.", name:"The Neighborhood Newsletter", biome:"The Neighborhood",
    hp:22, atk:10, def:0, xp:20, gold:2, speed:1,
    sprite:SPR_C_NEIGHBORHOOD_NEWSLETTER,
    flavor:"Published monthly. Seventeen passive-aggressive items, one recipe nobody asked for, and a lost cat that has been found for six months. The correction is pending editorial review."
  },
  {
    id:"nextdoor_post", defeatMsg:"He closes the tab. He opens the tab again. He closes it for good. He opens it one more time. He closes it.", name:"The Neighbor-Net Post", biome:"The Neighborhood",
    hp:35, atk:12, def:2, xp:24, gold:3, speed:1,
    sprite:SPR_C_NEXTDOOR_POST,
    flavor:"Begins: 'Does anyone else notice...' By the time you reach the comments, forty-seven neighbors have responded. Three are correct. None are agreeable. The original poster has not returned."
  },
  {
    id:"dog_walker", defeatMsg:"She does not make eye contact. He does not make eye contact. The neighborhood contract holds.", name:"The Dog Walker", biome:"The Neighborhood",
    hp:26, atk:8, def:1, xp:18, gold:4, speed:1,
    sprite:SPR_C_DOG_WALKER,
    isDogWalker:true,
    flavor:"Phone in one hand. Bag in the other. Technically she has the bag. She is not going to use the bag. She is very aware of where the dog has been. She will not make eye contact. This is the social contract of the neighborhood and it has held for decades."
  },

  /* ================================================================
     THE HOA DOMINION (floors 91-100)
     >>> NIGHTLY BUILD INSERTION POINT: HOA_DOMINION <<<
     Target pool size: 6-8 creatures. Current: 3.
     ================================================================ */
  {
    id:"the_covenant", defeatMsg:"Section 12.4 has been satisfied. Section 14.8 is now pending. He will hear about this.", name:"The Covenant", biome:"The HOA Dominion",
    hp:55, atk:12, def:9, xp:30, gold:8, speed:1,
    sprite:SPR_C_THE_COVENANT,
    flavor:"Forty-seven pages. Signed in 2006. Section 12.4 prohibits what you have done. Section 12.4 has always prohibited what you have done. That owner is gone. The Covenant remains."
  },
  {
    id:"violation_notice", defeatMsg:"Fine paid. The grass is now 3.9 inches. He bought a ruler for this. He keeps the ruler.", name:"The Violation Notice", biome:"The HOA Dominion",
    hp:20, atk:13, def:0, xp:26, gold:0, speed:1,
    sprite:SPR_C_VIOLATION_NOTICE,
    flavor:"Found on the door at 6:47 AM. Yellow. Official. Offense: grass length 4.2 inches. Allowable: 4.0 inches. The difference is 0.2 inches. The fine is $175. A photograph has been filed. The photograph is better composed than your family photos."
  },
  {
    id:"annual_meeting", defeatMsg:"Item one has been tabled again. He voted. The vote was not counted. He voted again. He left.", name:"The Annual Meeting", biome:"The HOA Dominion",
    hp:60, atk:11, def:6, xp:32, gold:10, speed:1,
    sprite:SPR_C_ANNUAL_MEETING,
    flavor:"Scheduled since February. The agenda has twenty-three items. Item one has been tabled since 2018. There is no listed end time. There has never been a listed end time. The meeting does not end. The meeting transitions."
  },

  /* ===== N19: full 10-biome rosters (LEVEL_DESIGN.md) ===== */
  {
    id:"chair_fortress", defeatMsg:"The fortress yields a single folding chair's width of passage. Nobody makes eye contact. This is as close to victory as the sideline allows.", name:"The Chair Fortress", biome:"Soccer Complex",
    hp:24, atk:4, def:3, xp:16, gold:5, speed:1,
    sprite:SPR_C_CHAIR_FORTRESS,
    flavor:"A perimeter of folding chairs, canopies, and parents who arrived at 6:40 AM. It does not attack so much as it declines to acknowledge your right to exist here."
  },
  {
    id:"stats_dad", defeatMsg:"He retreats to update the spreadsheet. Your encounter has been logged as an 'unforced error.' His, not yours. It is always someone else's.", name:"The Stats Dad", biome:"Soccer Complex",
    hp:16, atk:6, def:1, xp:14, gold:6, speed:1,
    sprite:SPR_C_STATS_DAD,
    flavor:"Has tracked every touch, pass, and hustle metric for three seasons. His son is nine. The spreadsheet has conditional formatting."
  },
  {
    id:"snack_stand_line", defeatMsg:"You reach the front. They are out of everything except a sports drink flavor called 'Glacier Situation.' You buy two.", name:"The Snack Stand Line", biome:"Soccer Complex",
    hp:20, atk:5, def:2, xp:15, gold:8, speed:1,
    sprite:SPR_C_SNACK_STAND_LINE,
    flavor:"It has not moved in eleven minutes. The menu board shows no prices until you are too deep to retreat. Somewhere ahead, a child is ordering for a family of nine, one item at a time."
  },
  {
    id:"fog_machine", defeatMsg:"The fog disperses to reveal a gymnasium that was, if anything, better with the fog.", name:"The Fog Machine", biome:"The School",
    hp:14, atk:6, def:1, xp:15, gold:5, speed:1,
    sprite:SPR_C_FOG_MACHINE,
    flavor:"Nobody knows who authorized it. Nobody knows who owns it. It is running at full capacity in a middle-school gymnasium, and it has strong opinions about visibility."
  },
  {
    id:"trophy_case", defeatMsg:"You tear yourself away. Somewhere in that case is a name you almost recognize, and it is safer not to check.", name:"The Trophy Case", biome:"The School",
    hp:26, atk:5, def:4, xp:18, gold:7, speed:1,
    sprite:SPR_C_TROPHY_CASE,
    flavor:"Regional. Division II. 1987. It pulls at a specific corner of a dad's memory and does not let go. Two full turns are lost to nostalgic review. Minimum."
  },
  {
    id:"welcoming_committee", defeatMsg:"You escape uncommitted. Your name, however, has been written down 'just in case.' It is always 'just in case.'", name:"The Welcoming Committee", biome:"The School",
    hp:18, atk:8, def:1, xp:17, gold:6, speed:1,
    sprite:SPR_C_WELCOMING_COMMITTEE,
    flavor:"Two PTA moms who are DELIGHTED to see a dad at the meeting. Their delight is a weapon. There is a sign-up sheet, and it is already moving toward you."
  },
  {
    id:"restaurant_buzzer", defeatMsg:"It buzzes. Your table is ready. It is next to the kitchen door and one leg is shorter than the others, but it is yours.", name:"The Buzzer", biome:"The Family Restaurant",
    hp:16, atk:7, def:2, xp:17, gold:6, speed:1,
    sprite:SPR_C_RESTAURANT_BUZZER,
    flavor:"Heavy. Ugly. Flashing red in a pattern that means either 'table ready' or 'low battery.' It has been 'about ten minutes' for forty-five minutes."
  },
  {
    id:"invisible_server", defeatMsg:"They reappear, radiant, unhurried. 'Sorry about the wait!' The apology is sincere. The wait was still forty minutes.", name:"The Invisible Server", biome:"The Family Restaurant",
    hp:22, atk:6, def:3, xp:19, gold:7, speed:1,
    sprite:SPR_C_INVISIBLE_SERVER,
    flavor:"Made eye contact once, said 'I'll be right back,' and entered a dimension unreachable by science. Water refills arrive only for other tables."
  },
  {
    id:"tip_calculation", defeatMsg:"You land on a number, second-guess it twice, and commit. It is, by every measure, slightly wrong. So is everyone else's.", name:"The Tip Calculation", biome:"The Family Restaurant",
    hp:28, atk:8, def:2, xp:21, gold:10, speed:1,
    sprite:SPR_C_TIP_CALCULATION,
    flavor:"A number that must be produced under social observation, involving percentages, guilt, the quality of the service, and a pen that does not work. Dad math at its most public."
  },
  {
    id:"comfortable_sectional", defeatMsg:"You rise from the sectional through sheer force of obligation. Part of you remains seated. Part of you always will.", name:"The Comfortable Sectional", biome:"IDKEA",
    hp:30, atk:6, def:5, xp:23, gold:8, speed:1,
    sprite:SPR_C_COMFORTABLE_SECTIONAL,
    flavor:"It is so, so comfortable. Sitting is easier than standing. The price seems reasonable until Dad does the math on 'per seat,' and by then he is already horizontal."
  },
  {
    id:"plush_avalanche", defeatMsg:"The plush settle into a new, equally unstable configuration. You leave holding one shark. You do not remember picking it up.", name:"The Plush Animal Avalanche", biome:"IDKEA",
    hp:20, atk:8, def:1, xp:21, gold:7, speed:1, pack:true,
    sprite:SPR_C_PLUSH_AVALANCHE,
    flavor:"The display was never stable. One shark was load-bearing. It travels as a wave of soft, smiling casualties, and it knows your kid's birthday is coming up."
  },
  {
    id:"extended_wave", defeatMsg:"'Anyway—' you say, for the fourth time, and this time the spell breaks. You part warmly. Twenty minutes are gone forever.", name:"The Extended Wave", biome:"The Neighborhood",
    hp:26, atk:8, def:3, xp:25, gold:9, speed:1,
    sprite:SPR_C_EXTENDED_WAVE,
    flavor:"Friendly. Immovable. A neighbor mid-wave who has entered conversational range and is now delivering a comprehensive update on every household in the subdivision. There is no known exit protocol."
  },
  {
    id:"persistent_entrepreneur", defeatMsg:"You buy the lemonade. All of it. It is warm and mostly sugar and somehow the best thing you have had all week. Business concludes with a firm nod.", name:"The Persistent Entrepreneur", biome:"The Neighborhood",
    hp:18, atk:10, def:1, xp:24, gold:12, speed:1,
    sprite:SPR_C_PERSISTENT_ENTREPRENEUR,
    flavor:"Age eight. Lemonade, one dollar. Will not accept 'no.' Will not accept 'later.' Has change for a five and the negotiating posture of a closing attorney."
  },
  {
    id:"hall_monitor", defeatMsg:"You produce a signature — anyone's, really — and are waved through. The lanyard notes your passage for the record. There is always a record.", name:"The Hall Monitor Volunteer", biome:"The HOA Dominion",
    hp:26, atk:9, def:3, xp:27, gold:10, speed:1,
    sprite:SPR_C_HALL_MONITOR,
    flavor:"Semi-official. Fully committed. Wears a lanyard that grants no authority and all of the confidence. Would like to know your business here, and whether you signed in."
  },
  {
    id:"motion_sensor_light", defeatMsg:"You move beyond its cone of concern. Behind you it clicks off with the smugness of a device that believes it has, once again, kept the neighborhood safe.", name:"The Motion-Sensor Light", biome:"The HOA Dominion",
    hp:20, atk:11, def:2, xp:28, gold:8, speed:1,
    sprite:SPR_C_MOTION_SENSOR_LIGHT,
    flavor:"Activates aggressively for raccoons, wind, and moods. For you, it demands continuous, vigorous motion. Stand still to think and it plunges you into darkness, judgmentally."
  },
  {
    id:"lingering_board_member", defeatMsg:"'We should really get going,' he agrees, not going. You leave first. It is the only way. It has always been the only way.", name:"The Lingering Board Member", biome:"The HOA Dominion",
    hp:34, atk:9, def:5, xp:32, gold:14, speed:1,
    sprite:SPR_C_LINGERING_BOARD_MEMBER,
    flavor:"The meeting ended forty minutes ago. He is still here, mid-conversation, and he has just spotted a fresh audience. Agenda item: you, now."
  },
  {
    id:"youth_soccer_swarm", defeatMsg:"The swarm redirects toward a juice-box resupply point. You were never the objective. There was never an objective.", name:"The Youth Soccer Swarm", biome:"The Park",
    hp:12, atk:5, def:0, xp:11, gold:4, speed:1, pack:true,
    sprite:SPR_C_YOUTH_SOCCER_SWARM,
    flavor:"Seven-year-olds traveling at full speed in a formation known to physics as 'all of them, at the ball, at once.' The ball is incidental. Your shins are not."
  },
  {
    id:"birthday_party", defeatMsg:"You are handed a slice of cake on a napkin. You did not RSVP. Attendance, it turns out, was never optional.", name:"The Birthday Party", biome:"The Park",
    hp:20, atk:4, def:2, xp:13, gold:5, speed:1,
    sprite:SPR_C_BIRTHDAY_PARTY,
    flavor:"It has claimed the main pavilion and is expanding. Balloon perimeter. Cake logistics. A bounce house with a line. Somewhere at its center, a five-year-old rules absolutely."
  }
];

/* ===== THE FAMILY DOG (special encounter, not in regular spawn pool) ===== */
const FAMILY_DOG = {
  id:"family_dog", name:"Family Dog of Chaotic Neutral Alignment",
  hp:20, atk:0, def:0, xp:0, gold:0, speed:1,
  sprite:SPR_FAMILY_DOG,
  flavor:"Chaotic Neutral. Has been on the couch since 2018. Has opinions but no means to express them. Will drop food on you, steal your lunch, or lick your face with equal and arbitrary enthusiasm, chosen by the universe at random. Has already knocked something over today. That was a different incident. That incident has not been fully investigated."
};


/* ================================================================
   4. BOSS DATA
   >>> NIGHTLY BUILD INSERTION POINT: BOSSES <<<
   Bosses appear on floors that are multiples of 10 (one per biome).
   Floors: 10,20,30,40,50,60,70,80,90,100
   ================================================================ */
const BOSSES = [
  {
    id:"garage_entity", defeatMsg:"He enters the Garage. It does not feel like victory so much as the beginning of a much larger project.", name:"The Garage (As Entity)", floor:10,
    hp:60, atk:8, def:3, xp:60, gold:30, speed:1,
    sprite:SPR_B_GARAGE,
    flavor:"Not entered fully since 2019. It has become a biome. Somewhere inside is the emergency release cord. Somewhere inside is everything you have ever lost."
  },
  {
    id:"asst_manager", defeatMsg:"The clipboard is still laminated. He does not touch the clipboard.", name:"The Assistant Manager of Lumber", floor:15,
    hp:75, atk:10, def:3, xp:80, gold:45, speed:1,
    sprite:SPR_B_ASST_MANAGER,
    flavor:"Controls aisles 12 through 17. Has been assistant manager for eleven years. Was passed over for manager in 2018. Is aware. The clipboard is laminated. The clipboard has always been laminated. He has not been asked if you need help. He is going to ask anyway."
  },
  {
    id:"floor_manager", defeatMsg:"He bought screws. He bought additional items while in the area. He bought more things. He left quickly.", name:"The Floor Manager", floor:20,
    hp:90, atk:11, def:4, xp:100, gold:60, speed:1,
    sprite:SPR_B_FLOOR_MANAGER,
    flavor:"Greets you the moment you look lost. Offers help you cannot refuse and do not want. 'While we're back here...' Attack: Upsell Cascade. Weakness: saying 'I'm just getting screws' before engagement."
  },
  {
    id:"permit_inspector", defeatMsg:"The form is complete. He used his own pen. He came prepared. This is the first time in his life he came prepared.", name:"The Permit Inspector", floor:25,
    hp:105, atk:12, def:4, xp:130, gold:55, speed:1,
    sprite:SPR_B_PERMIT_INSPECTOR,
    flavor:"You do not have a permit for this. He has checked. The park requires a permit for groups of three or more. You are a group. He has the form. He has always had the form. The form has twelve pages. You will need a pen. He does not lend pens."
  },
  {
    id:"tournament_director", defeatMsg:"The bracket holds. Field six is secured. He does not celebrate near the bracket.", name:"The Tournament Director", floor:30,
    hp:120, atk:13, def:5, xp:200, gold:80, speed:1,
    sprite:SPR_B_TOURNAMENT_DIRECTOR,
    flavor:"Runs the brackets. Controls all six fields. Has denied your schedule conflict appeal. Denied your parking appeal. Denied your snack table location appeal. Has a walkie-talkie on each hip. Both are squawking. He hears only the bracket."
  },
  {
    id:"black_friday_formation", defeatMsg:"He got the TV. He does not remember why he wanted the TV. He has the TV.", name:"The Black Friday Formation", floor:40,
    hp:150, atk:15, def:6, xp:250, gold:100, speed:1,
    sprite:SPR_B_BLACK_FRIDAY,
    flavor:"Not a creature. A collective. A thermodynamic event. The doors opened at 5:00 AM and the Formation has not stopped moving since. It does not have a goal. It has momentum. The TV was the first casualty. You are the latest."
  },
  {
    id:"referee_final_whistle", defeatMsg:"The yellow card stands on his record. He has accepted this. He will not accept this.", name:"The Referee (Final Whistle)", floor:50,
    hp:180, atk:17, def:7, xp:300, gold:90, speed:1,
    sprite:SPR_B_REFEREE,
    flavor:"Has already decided. The yellow card was issued before the game began. Immovable. The rule he is citing exists. The rule has always existed. You have always been in violation of it. The whistle sounds when it wants to."
  },
  {
    id:"pta_president", defeatMsg:"The motion is tabled. He seconded it himself. He did not know he was doing that when he did it.", name:"The PTA President", floor:60,
    hp:210, atk:19, def:8, xp:350, gold:100, speed:1,
    sprite:SPR_B_PTA_PRESIDENT,
    flavor:"Has the floor. Has had the floor since 2019. Has a motion. The motion will be seconded by her. She will second it herself if necessary. The agenda is laminated. The agenda has been laminated since October. You are on the agenda."
  },
  {
    id:"birthday_party_deployment", defeatMsg:"The cake was wrong. The kids ate it anyway. Someone cried. It was fine. It was actually fine.", name:"The Birthday Party (Full Deployment)", floor:70,
    hp:240, atk:21, def:9, xp:400, gold:80, speed:1,
    sprite:SPR_B_BIRTHDAY_PARTY,
    flavor:"Twelve children. One table. No plan. The party started eleven minutes ago and someone has already cried. Someone who is not one of the twelve children has also cried. The cake is the wrong cake. There is no correct cake."
  },
  {
    id:"assembly_instructions_final", defeatMsg:"Step 17. Complete. He does not examine what he built too closely. The BILVAK stands. This is what matters.", name:"The Assembly Instructions, Final Form", floor:80,
    hp:270, atk:23, def:10, xp:450, gold:80, speed:1,
    sprite:SPR_B_ASSEMBLY_FINAL,
    flavor:"Step 17. You are here. The instructions have been waiting. The previous owner of this BILVAK also reached Step 17. He is not spoken of. Step 17 is not a step. Step 17 is a reckoning."
  },
  {
    id:"neighborhood_watch_captain", defeatMsg:"The binder has been updated. He is still in the binder. He will always be in the binder. He has made peace with the binder.", name:"The Neighborhood Watch Captain", floor:90,
    hp:300, atk:25, def:11, xp:500, gold:90, speed:1,
    sprite:SPR_B_NEIGHBORHOOD_WATCH,
    flavor:"Has been watching. Has always been watching. The flashlight was purchased for this purpose. The notebook was purchased for this purpose. The binder of documented incidents goes back to 2007. You are in the binder. You have always been in the binder."
  },
  {
    id:"hoa_president", defeatMsg:"He retrieves the Remote. It is warm. It has always been warm. He does not ask why.", name:"The HOA President", floor:100,
    hp:350, atk:28, def:12, xp:600, gold:200, speed:1,
    sprite:SPR_B_HOA_PRESIDENT,
    flavor:"He has been here since the development was built. He was here before the development was built. He approved the development. He wrote the covenants. He has been waiting for someone to reach Floor 100 since 2006 so he could enforce Section 47: No Heroes. You are the first. The Remote of Ultimate Authority is behind him. It has always been behind him."
  }
];

/* ===== ALLIES (found or activated during run; one active at a time) ===== */
const ALLIES = [
  {
    id:"chad", name:"Chad From Next Door",
    ability:{kind:"status",status:"atkup",turns:8,name:"Bro Hype",text:'Chad: "Bro. BRO. You\'ve got this." It should not work. It works. Pumped Up: +3 ATK for 8 turns.'},
    hp:24, maxhp:24, atk:5, def:2,
    sprite:SPR_A_CHAD,
    intro:'"Sup. Need help? I\'m not doing anything." He was clearly doing something. He abandons it without explanation.',
    flavor:"Teenager. Swings hard. Takes hits philosophically. Occasionally says 'bro' during combat. This is unexpectedly encouraging.",
    defeatMsg:'Chad goes down mid-swing and stares at the ceiling. \'Bro,\' he says, philosophically, and then he\'s gone. You think he\'ll be okay. You\'re not totally sure.',
    quest:{type:"fetch",itemKind:"consumable",itemId:"beercan",summary:"find a beer",
      text:"Bro. I'll absolutely fight for you. But like — is there a beer around here somewhere? That's basically a blood oath at that point.",
      doneText:"Bro. You get it. Let's go ruin some drywall."}
  },
  {
    id:"karen_s", name:"Sharon (Next Door)",
    ability:{kind:"snack",amount:30,name:"Casserole Delivery",text:'Sharon produces a foil-covered casserole from somewhere on her person. "You need to eat." You eat it standing up. Hunger -30.'},
    hp:20, maxhp:20, atk:4, def:3,
    sprite:SPR_A_KAREN,
    intro:'"I heard something going on over here." She appears with a casserole and what appears to be a socket wrench. The casserole is for later. The wrench is for now.',
    flavor:"Sharon from next door. She has raised three teenagers and attended every PTA meeting for eleven years. She is exactly as effective in combat as this implies.",
    defeatMsg:'Sharon steadies herself, pats your arm once, says \'I\'m going to go check on the casserole\' — and that\'s that. The casserole was never at risk. You feel this was always the plan.',
    quest:{type:"fetch",itemKind:"charm",itemId:"readers",summary:"find her readers",
      text:"I can't see a single thing without my readers and I am NOT fighting blind at my age. I set them down around here somewhere. Find them.",
      doneText:"Oh, thank heavens. Now I can see what I'm hitting. Let's go."}
  },
  {
    id:"uncle_ron", name:"Uncle Ron (From Florida)",
    ability:{kind:"status",status:"guard",turns:8,name:"Florida Stance",text:'Uncle Ron steps half in front of you. "In Florida we call this a Tuesday." Guard Stance: +2 DEF for 8 turns.'},
    hp:36, maxhp:36, atk:6, def:5,
    sprite:SPR_A_UNCLE_RON,
    intro:'"I was in the area." He was in Florida. He drove sixteen hours. He does not explain this and you do not ask.',
    flavor:"Built like a retired linebacker and operates accordingly. Hits extremely hard. Complains continuously but not about the fighting, which he seems to find restorative.",
    defeatMsg:'Uncle Ron takes a knee, holds up one hand, and says \'I gotta head back.\' He drove sixteen hours to be here for four floors. He seems satisfied. He always was going to drive back.',
    quest:{type:"hunt",summary:"defeat the oversized threat",
      text:"I don't just fall in behind any fella who asks. Something bigger than usual is skulking around this floor. You handle that, I'll know you're serious.",
      doneText:"Now THAT'S what I'm talking about. Sixteen-hour drive, well spent. Let's move."}
  },
  {
    id:"little_timmy", name:"Little Timmy (Your Kid)",
    ability:{kind:"heal",pct:0.2,name:"Unscheduled Hug",text:'Little Timmy hugs your leg mid-dungeon. "You\'re the best dad." +{n} HP. Science cannot explain it. Science was not invited.'},
    hp:14, maxhp:14, atk:3, def:1,
    sprite:SPR_A_LITTLE_TIMMY,
    intro:'"Dad, I want to help." He is eight. You take a moment. The moment passes. You accept the help.',
    flavor:"Recklessly brave in ways that imply a philosophical difference about risk. Surprisingly effective. Low center of gravity means he spots floor hazards before you do. You're going to have a talk about all of this after.",
    defeatMsg:'Timmy sits down abruptly, looks up at you, and says \'I\'m tired, Dad.\' There is a note in his voice — not defeat, just eight-year-old truth. \'You\'ve got this though.\' He believes this completely. It helps more than it should.',
    quest:{type:"fetch",itemKind:"consumable",itemId:"applejuice",summary:"find Timmy's juice box",
      text:"Dad, I WILL help. But I'm not doing it thirsty. I think I left my juice box around here somewhere.",
      doneText:"Got it! Okay. NOW I'm ready. This is the best day of my life probably."}
  },
  {
    id:"officer_doug", name:"Officer Doug (Off-Duty)",
    ability:{kind:"stun",turns:2,name:"Off-Duty Presence",text:'Officer Doug clears his throat. The {foe} stops to reconsider its choices. Stunned for 2 turns.'},
    hp:32, maxhp:32, atk:8, def:4,
    sprite:SPR_A_OFFICER_DOUG,
    intro:'"Just passing through." The badge on his belt says otherwise. He does not address the badge.',
    flavor:"Massive. Technically off-duty. Has a presence that causes enemies to briefly reconsider their choices before proceeding anyway. Hits decisively. Files nothing.",
    defeatMsg:'Doug straightens up slowly, adjusts his badge, says \'I should get back to my route\' — and walks off in a direction that does not exist. He was, technically, off-duty the entire time. He will not file a report. He never does.',
    quest:{type:"hunt",summary:"defeat the elite threat",
      text:"I'm off-duty. That means I get to pick my calls. There's something on this floor bigger than the usual nuisance. Put it down and I'm yours.",
      doneText:"Textbook. Didn't even need to file paperwork on that one. Let's go."}
  }
];


/* ===== VENDORS (keyed by floor depth; appear every 10 floors) ===== */
const VENDORS={
  5:{name:"The Neighbor Who Happens to Have That",greet:"\"Oh yeah, I got one of those.\" He has seventeen. He will lend you one.",stock:["water","gatorade","key","brick","pt_legs","steeltoe","manual","dadism_scroll"]},
 15:{name:"The Lowe & Behold Returns Desk",greet:"\"Did you keep your receipt?\" Of course you didn't. He'll deal.",stock:["water","gatorade","pedialyte","casserole","key","steeltoe","pt_measure","pt_legs","brick","manual","receipt","goopgone"]},
 25:{name:"The Park Concession Stand",greet:"\"We're cash only.\" You have a card. He produces a card reader from 2013. The signal is weak but his resolve is not.",stock:["water","gatorade","casserole","key","pt_grip","pt_patience","manual","dadism_scroll"]},
 30:{name:"The Estate Sale of a Man Who Had Everything",greet:"\"Everything must go.\" The man is not present. The man, it is implied, has moved on to a place with less garage. His charms and his hard-won wisdom remain, priced to clear.",fixed:["water","key"],pick:7,pool:["toothpick","dogtags","signet","earbuds","lucky_coin","fortunecookie","keychain","fishing_lure","name_badge","suspenders","fistbump_band","measure_twice","lift_legs","count_ten","stay_hydrated","warm_up","read_room","firm_handshake","pace_yourself"]},
 35:{name:"The Vastco Membership Kiosk",greet:"\"Card, please.\" You flash a library card. He respects the hustle.",stock:["casserole","gatorade","rehab","key","chestpad","pt_patience","pt_grip","propane","receipt","dadism_scroll"]},
 45:{name:"The Soccer Complex Snack Shack",greet:"\"We have orange slices.\" You need ammunition. He has orange slices and a truly extraordinary number of juice pouches.",stock:["water","gatorade","pedialyte","casserole","key","pt_legs","brick","manual","dadism_scroll"]},
 55:{name:"The School Lost and Found",greet:"\"If no one claims it by Friday, it's yours.\" It is Friday. Everything in here was left in 2018. Some of it is useful.",stock:["key","brick","pt_measure","steeltoe","casserole","rehab","manual","receipt","dadism_scroll"]},
 60:{name:"The Conference Center Vendor Hall",greet:"\"Free pens.\" There are no free pens. There is, however, a folding table of genuinely useful equipment and a man in a lanyard who has not eaten since the keynote. His stock changes by the hour; nobody knows who restocks it.",fixed:["water","gatorade","key"],pick:8,pool:["casserole","pedialyte","rehab","brick","steeltoe","chestpad","propane","manual","receipt","goopgone","dadism_scroll","pt_grip","pt_legs","pt_measure","pt_patience","lanyard","visor","watchband"]},
 65:{name:"The Family Restaurant Manager",greet:"\"I can't do that, but I can do this.\" What he can do is unclear but the tray of bread he produces is undeniably real.",stock:["water","casserole","gatorade","pedialyte","key","pt_grip","pt_patience","manual","dadism_scroll"]},
 75:{name:"The IDKEA As-Is Section",greet:"\"No returns. No assembly instructions. No regrets.\" This last part is a lie.",stock:["key","brick","chestpad","steeltoe","pt_measure","pt_legs","propane","rehab","receipt","goopgone","dadism_scroll"]},
 85:{name:"The Neighborhood Garage Sale",greet:"\"Everything's a quarter.\" The item you need most is labeled $40. He will not negotiate. He has never negotiated. He will negotiate.",stock:["water","gatorade","key","brick","casserole","pt_patience","steeltoe","pt_grip","manual","dadism_scroll"]},
 95:{name:"The HOA Emergency Dispensary",greet:"\"This is highly irregular.\" He opens a filing cabinet. Everything inside is laminated. Some of it heals. All of it is permitted under Section 22(b).",stock:["rehab","casserole","gatorade","pedialyte","chestpad","pt_measure","pt_legs","propane","key","manual","receipt","goopgone","dadism_scroll"]}
};

/* ===== CLASSES ===== */
const CLASSES=[
 {id:"grill",name:"The Grillmaster",hp:30,str:6,def:2,per:3,wis:4,moxie:6,craft:"food",
  dadisms:["char","standmeat","backinmyday","dad_sneeze"],
  blurb:"Controls fire, meat, and conversations nobody asked for. Sweating over a grill burns water fast.",
  backstory:"They said the Remote was lost. They said the thermostat could not be reclaimed. They said it over by the cooler, and The Grillmaster heard every word through the open patio door. He set down his tongs — the good ones, the ones with the bottle opener built in — and announced to a backyard of unbothered relatives that he would be descending into the suburbs themselves. Nobody looked up. He took this as a blessing. Medium-rare, he reminded them, waits for no man."},
 {id:"diy",name:"The DIY Dad",hp:32,str:5,def:3,per:3,wis:3,moxie:5,craft:"general",
  dadisms:["improv","goodenough","backinmyday","dad_sneeze"],
  blurb:"Weaponized confidence. Best at combining junk into worse junk. Steady metabolism, steady work.",
  backstory:"The DIY Dad watched a single video. It was eleven minutes long. He watched four of those minutes. This, he decided, was sufficient. The Remote of Ultimate Authority was, structurally speaking, just a project — and projects were his to start, expand catastrophically, and eventually abandon at ninety percent completion. He kissed his family goodbye, grabbed a roll of duct tape 'just in case,' and strode toward the basement stairs with the radiant, doomed optimism of a man who has never once read an instruction to its end."},
 {id:"tech",name:"The Tech Dad",hp:26,str:4,def:2,per:5,wis:5,moxie:7,craft:"tech",
  dadisms:["reboot","firmware","backinmyday","dad_sneeze"],
  blurb:"Forgets to eat. Forgets to drink. Has survived on forgotten granola bars and spite since 2014.",
  backstory:"The Tech Dad had, in fact, automated the thermostat years ago. He had an app. He had three apps. He had a spreadsheet documenting the apps. None of it survived the firmware update that took the Remote with it. Now the house ran at 81 degrees and his family looked to him with a faith he found both touching and statistically unearned. 'I'll just SSH into it,' he said, to a house with no SSH and no it. He grabbed a charging cable of indeterminate compatibility and descended, muttering about backups he had always meant to make."},
 {id:"gym",name:"The Gym Dad",hp:40,str:8,def:3,per:1,wis:1,moxie:4,craft:"none",
  dadisms:["onemore","preworkout","backinmyday","guard","dad_sneeze"],
  blurb:"Needs protein every 90 seconds. Already dehydrated. Has been since 2009.",
  backstory:"The Gym Dad did not fully understand what the Remote did. He understood that it was lost, that retrieving it was hard, and that hard things were his entire personality. He chalked his hands. There was no reason to chalk his hands. He chalked them anyway. 'I'll carry it out myself,' he said, flexing at a problem that could not be flexed at. He had brought a gallon jug of water and forgotten, completely, that food was also a thing the body required. He hit the stairs at a dead sprint. He would feel this tomorrow. He would feel everything tomorrow."},
 {id:"tactical",name:"The Tactical Dad",hp:30,str:6,def:4,per:5,wis:3,moxie:6,craft:"general",
  dadisms:["dadscan","flashlight","backinmyday","guard","dad_sneeze"],
  blurb:"Has packed snacks. Did not pack enough water. The plan did not account for this.",
  backstory:"The Tactical Dad had a plan. The plan had a binder. The binder had a laminated cover, tabs, and a contingency section he was extremely proud of. What the plan did not have was enough water, because the water section was on a page he had moved 'somewhere safe.' He performed a final gear check, announced it aloud to nobody, and double-checked a flashlight he had checked four times. The Remote, he had determined, was a logistics problem. Everything was a logistics problem. He descended at a measured pace, already slightly behind on hydration and entirely unaware of it."},
 {id:"sports",name:"The Sports Dad",hp:32,str:6,def:3,per:5,wis:3,moxie:6,craft:"food",
  dadisms:["sideline_yell","orange_slices","backinmyday","dad_sneeze"],
  blurb:"Coaches from the sideline at a volume the league has formally discussed. Reads the field, misreads the room. Tailgate logistics: flawless.",
  backstory:"The Sports Dad treated the loss of the Remote as he treated everything: as a game that could still be won if everybody would just LISTEN. He had a strategy. He had a louder strategy in reserve. He had a folding chair, a cooler, and opinions about officiating that no quest had requested. 'We got this,' he bellowed at a hallway, 'we just gotta want it more.' The hallway, like the under-tens he coached on Saturdays, did not appear to want it more. Undeterred, he laced up and descended, calling an audible at a staircase that had not asked for one."},
 {id:"yard",name:"The Yard Dad",hp:34,str:7,def:3,per:4,wis:2,moxie:5,craft:"general",
  dadisms:["mow_down","sprinkler","backinmyday","dad_sneeze"],
  blurb:"At war with the lawn, the weeds, and the neighbor's slightly greener grass. Diagonal stripes are not a choice. They are a calling.",
  backstory:"The Yard Dad was edging the walkway when the news reached him, and he did not stop edging, because the line was nearly perfect and a man does not abandon a nearly perfect line. The Remote was gone; the thermostat sat at 81; somewhere below, the suburbs themselves had swallowed it. He considered the depths the way he considered the neighbor's suspiciously greener lawn — as a personal affront requiring correction. He shut off the trimmer. Silence fell over the cul-de-sac. 'Fine,' he said, to the grass, to the weeds, to the abyss. He went in still wearing the gloves."}
];

/* ===== AFFIXES (silly buffs: help / hinder / nothing) ===== */
const AFFIXES=[
 {id:"confident",name:"of Misplaced Confidence",type:"help",mods:{atk:1},desc:"+1 ATK. It is not earned, but it counts."},
 {id:"ergo",name:"Ergonomic",type:"help",mods:{atk:1},desc:"+1 ATK. The grip says so on the sticker."},
 {id:"reinforced",name:"Reinforced w/ Duct Tape",type:"help",mods:{def:2},desc:"+2 DEF. Holds the universe together."},
 {id:"warranty",name:"Extended Warranty",type:"help",mods:{def:1},desc:"+1 DEF. For once in your life."},
 {id:"preowned",name:"Pre-Owned",type:"help",mods:{atk:1,def:1},desc:"+1 ATK, +1 DEF. Someone else's problem, now yours to enjoy."},
 {id:"recalled",name:"Recalled",type:"hinder",mods:{atk:-1},desc:"-1 ATK. The lawsuit is still pending."},
 {id:"batteries",name:"Batteries Not Included",type:"hinder",req:"powered",mods:{atk:-1},desc:"-1 ATK. You knew. You bought it anyway."},
 {id:"assembly",name:"Assembly Required",type:"hinder",mods:{def:-1},desc:"-1 DEF. Three pieces are left over. Probably unimportant."},
 {id:"stripped",name:"Stripped Screw",type:"hinder",mods:{def:-1},desc:"-1 DEF. Stripped. Eternal."},
 {id:"dented",name:"Dented",type:"hinder",mods:{atk:-1,def:-1},desc:"-1 ATK, -1 DEF. It was like this when you found it."},
 {id:"cursed",name:"of the HOA",type:"hinder",mods:{atk:-2},desc:"-2 ATK. Technically violates several covenants."},
 {id:"counterfeit",name:"Counterfeit",type:"hinder",mods:{atk:-2,def:-1},desc:"-2 ATK, -1 DEF. Not from the manufacturer. You knew this in the parking lot."},
 {id:"expired",name:"Expired (Best Before 2019)",type:"hinder",mods:{def:-2},desc:"-2 DEF. It is not 2019. It has never been 2019 since 2019."},
 {id:"flickering",name:"Flickering",type:"hinder",req:"powered",mods:{per:-1,def:-1},desc:"-1 PER, -1 DEF. Unstable. Unreliable. The description said 'vibrant.'"},
 {id:"wrongsize",name:"Wrong Size (Close Enough)",type:"hinder",mods:{atk:-1,per:-1},desc:"-1 ATK, -1 PER. You told yourself it would be fine. It is not fine."},
 {id:"stripped2",name:"Stripped Beyond Salvation",type:"hinder",mods:{atk:-1,def:-2},desc:"-1 ATK, -2 DEF. The screw was a warning. You did not heed the warning."},
 {id:"warrantyvoid",name:"Warranty Voided",type:"hinder",req:"powered",mods:{atk:-1,wis:-1},desc:"-1 ATK, -1 Dadism power. You opened the casing. That was the end of the warranty and also of a small piece of your dignity."},
 {id:"fine",name:"Fine, I Guess",type:"nothing",mods:{},desc:"Does nothing. Perfectly adequate. A metaphor."},
 {id:"reviewed",name:"4-Star Rated",type:"nothing",mods:{},desc:"One reviewer called it 'adequate.' They were right."},
 {id:"generic",name:"Store Brand",type:"nothing",mods:{},desc:"Same thing as the name brand. He insists otherwise."},
 {id:"contractor",name:"Contractor Grade",type:"help",mods:{atk:1,def:1},desc:"+1 ATK, +1 DEF. Costs forty percent more for reasons no one can articulate. Worth it, allegedly."},
 {id:"newinbox",name:"New In Box",type:"help",mods:{def:1,per:1},desc:"+1 DEF, +1 PER. Still has the twist-ties. He will keep the box. He will keep all the boxes."},
 {id:"asseenontv",name:"As Seen On TV",type:"help",mods:{atk:2},desc:"+2 ATK. But wait — there is no second one, the shipping consumed the savings, and it works exactly as advertised, which is alarming."},
 {id:"clearance",name:"Final Clearance",type:"hinder",mods:{def:-1,per:-1},desc:"-1 DEF, -1 PER. All sales final. The endcap claimed it. He could not resist the endcap."},
 {id:"openbox",name:"Open Box (Some Wear)",type:"hinder",mods:{atk:-1},desc:"-1 ATK. Someone returned it for a reason they did not write down. The reason reveals itself in combat."},
 {id:"asis",name:"Sold As-Is",type:"nothing",mods:{},desc:"Does nothing, but with finality. No returns, no refunds, no opinions. A purchase and a philosophy."}
];

/* ===== WEAPONS ===== */
const WEAPONS=[
 {id:"spatula",name:"Spatula",atk:4,sprite:SPR_WPN_SPATULA,desc:"Standard issue. Heavy-duty. Has flipped ten thousand burgers and one regret."},
 {id:"plunger",name:"Plunger",atk:5,sprite:SPR_WPN_PLUNGER,desc:"The hero Dad always needed. The hero he never acknowledged."},
 {id:"rake",name:"Leaf Rake",atk:4,sprite:SPR_WPN_RAKE,desc:"Technically seasonal. Violence is not."},
 {id:"caulkgun",name:"Caulk Gun",atk:5,sprite:SPR_WPN_CAULKGUN,desc:"Point at enemy. Express opinions firmly."},
 {id:"blowtorch",powered:true,name:"Mini Blowtorch",atk:7,sprite:SPR_WPN_BLOWTORCH,reqLevel:3,desc:"For the creme brulee. And now this."},
 {id:"broomhandle",name:"Broom Handle",atk:4,sprite:SPR_WPN_BROOMHANDLE,desc:"The broom part is gone. The handle remains. The handle is enough."},
 {id:"flamespat",powered:true,name:"The Flame Spatula",atk:9,sprite:SPR_WPN_FLAMESPAT,reqLevel:5,desc:"OSHA has questions. The burgers do not."},
 {id:"brick",name:"Half a Brick",atk:5,sprite:SPR_WPN_BRICK,throw:{dmg:6},desc:"Found in the yard. Origin unknown. Purposes: many."},
 // --- Standard additions (drops 11–17) ---
 {reqLevel:3,id:"leafblower",powered:true,name:"The Leafblight Devastator",atk:6,reach:2,sprite:SPR_WPN_LEAFBLOWER,desc:"An ancient wind-cannon said to strip entire kingdoms of loose paperwork and decorative mulch. Wielded annually during the Season of Fallen Oaks."},
 {id:"tapemeasure",name:"Grondar's Measure of Reckoning",atk:4,reach:3,sprite:SPR_WPN_TAPEMEASURE,throw:{dmg:5,range:3},desc:"A cursed tape measure that extends infinitely until reality itself is found to be 'just a quarter-inch off.'"},
 {id:"ratchet",name:"The Socketweaver's Doomchain",atk:6,reach:1,sprite:SPR_WPN_RATCHET,reqLevel:4,throw:{dmg:7,range:5},desc:"A legendary ratchet capable of summoning exactly the socket size you don't have. Entire civilizations have collapsed searching for the missing 10mm."},
 {id:"pressurewand",powered:true,name:"The Pressure Wand of Aquatic Judgment",atk:5,reach:3,sprite:SPR_WPN_PRESSUREWAND,throw:{dmg:4,range:4},desc:"A hydrokinetic staff that reveals the true color of all surfaces and accidentally strips paint from neighboring dimensions."},
 {id:"orbital_sander",powered:true,name:"Orbital Sander of Reckoning",atk:6,sprite:SPR_WPN_RATCHET,reqLevel:4,desc:"Spins at 12,000 RPM. Intended for drywall. The enemy counts as drywall now."},
 {id:"extensioncord",name:"The Extension Cord of Endless Horizons",atk:4,reach:4,sprite:SPR_WPN_EXTENSIONCORD,throw:{dmg:3,range:6},desc:"A serpentine cable-beast stretching across battlefields, driveways, and occasionally international borders."},
 {reqLevel:5,id:"ladder",name:"The Ladder of Ascendant Peril",atk:8,reach:2,sprite:SPR_WPN_LADDER,desc:"A towering relic whose wielders gain temporary flight, followed by immediate wisdom regarding gravity."},
 // --- Legendary weapons (rare drops; baseRarity forces Legendary tier) ---
 {reqLevel:5,id:"orbitaledger",name:"The Orbital Edger of Property-Line Wars",atk:10,reach:2,baseRarity:"Legendary",sprite:SPR_WPN_ORBITALEDGER,throw:{dmg:8,range:4},desc:"Said to carve trenches so precise they have started blood feuds lasting generations."},
 {reqLevel:6,id:"hexhammer",name:"The Hexhammer of Weekend Intentions",atk:11,reach:1,baseRarity:"Legendary",sprite:SPR_WPN_HEXHAMMER,throw:{dmg:9,range:3},desc:"Every strike repairs one thing and reveals three new projects."},
 {reqLevel:8,id:"ptoreaper",powered:true,name:"The Great PTO Reaper",atk:14,reach:1,baseRarity:"Legendary",sprite:SPR_WPN_PTOREAPER,desc:"A chainsaw of mythic power whose roar awakens ancient spirits and prompts neighbors to inspect trees they weren't worried about five minutes earlier."},
 {reqLevel:10,id:"justincase",name:"The Justin Case Bucket of Miscellaneous Screws",atk:4,reach:1,baseRarity:"Legendary",sprite:SPR_WPN_JUSTINCASE,throw:{dmg:10,range:7},desc:"Contains every fastener required to save the realm except the one currently needed."},
 // ── NIGHTLY ADDITIONS N5 (2026-06-18) ──
 {id:"shopvac",powered:true,name:"The Shop-Vac of Infinite Suction",atk:6,reach:2,sprite:SPR_WPN_LEAFBLOWER,throw:{dmg:5,range:3},desc:"A roaring drum-beast that inhales sawdust, loose screws, and the occasional sock. Filter status: unknown for years."},
 {id:"pizzacutter",name:"The Pizza Cutter of a Thousand Slices",atk:5,sprite:SPR_WPN_RATCHET,desc:"A wheeled blade forged for Friday nights. Cuts crust, cardboard, and ambition in perfectly uneven portions."},
 {id:"snowshovel",name:"The Snow Shovel of Seasonal Vengeance",atk:6,reach:2,sprite:SPR_WPN_RAKE,desc:"Lives in the garage eleven months a year, dreaming of the twelfth. The driveway remembers. So does his back."},
 {reqLevel:4,id:"tikitorch",powered:true,name:"The Backyard Tiki Torch of Ambient Menace",atk:7,reach:2,sprite:SPR_WPN_BLOWTORCH,desc:"Citronella-scented and faintly threatening. Keeps mosquitoes, raccoons, and party guests at a respectful distance."},
 {id:"gardenhose",name:"The Garden Hose of Unspooling Doom",atk:4,reach:4,sprite:SPR_WPN_EXTENSIONCORD,throw:{dmg:3,range:5},desc:"A serpent that kinks at the precise moment of maximum need. Never rewinds correctly. Vengeance comes in PSI."},
 {reqLevel:5,id:"crowbar",name:"The Pry Bar of Last Resort",atk:8,reach:1,sprite:SPR_WPN_HEXHAMMER,throw:{dmg:7,range:3},desc:"When persuasion fails and the WD-40 is empty, the realm turns to leverage. Leverage does not negotiate."}
];

/* ===== ARMOR (slots: head/torso/arms/legs/feet) ===== */
const ARMORS=[
 {id:"hardhat",name:"Construction Hard Hat",slot:"head",def:2,desc:"Borrowed from a job site in 2003.",sprite:SPR_A_HARDHAT},
 {id:"baseballcap",name:"Dad Cap",slot:"head",per:1,desc:"Faded logo. High perception bonus from years of suspicious squinting.",sprite:SPR_A_DADCAP},
 {id:"chestpad",name:"Chest Pad (Catcher's)",slot:"torso",def:3,desc:"From youth baseball. Still fits. Barely.",sprite:SPR_A_CHESTPAD},
 {id:"fleece",name:"Fleece Vest",slot:"torso",def:1,wis:1,desc:"+1 DEF, +1 Dadism power. Multiple pockets. One function.",sprite:SPR_A_FLEECE},
 {id:"glovework",name:"Work Gloves",slot:"arms",def:1,atk:1,desc:"Grip improved. Knuckles protected. Confidence irrelevant.",sprite:SPR_A_WORKGLOVES},
 {id:"pt_measure",name:"Tape Measure (Belt Clip)",slot:"arms",per:1,desc:"+1 PER. Always visible. Never used correctly.",sprite:SPR_A_TAPEMEASURE},
 {id:"pt_legs",name:"Cargo Shorts",slot:"legs",cap:2,desc:"+2 inventory slots. Standard issue Dad equipment.",sprite:SPR_A_CARGOSHORTS},
 {id:"pt_patience",name:"Khaki Dad Pants",slot:"legs",wis:1,desc:"+1 Dadism power. Pleated. Ironed. Non-negotiable.",sprite:SPR_A_KHAKIPANTS},
 {id:"pt_grip",name:"Tube Socks (Pulled Up)",slot:"feet",def:1,desc:"+1 DEF. They come up to the knee. He is aware.",sprite:SPR_A_TUBESOCKS},
 {id:"steelboot",name:"Steel-Toe Boots",slot:"feet",def:2,atk:1,desc:"+2 DEF, +1 ATK. Safety certified. Impact tested on a Wednesday.",sprite:SPR_A_STEELBOOTS},
 {id:"steeltoe",name:"Steel-Toe Boot (The Single One)",slot:"feet",def:1,atk:2,desc:"+1 DEF, +2 ATK. OSHA approved. OSHA impressed. The other one is somewhere in the garage. It is footwear; it has always been footwear.",sprite:SPR_A_STEELBOOTS}
,
 // ── NIGHTLY ADDITIONS (2026-06-18) ──
 {id:"sunglasses",name:"Wraparound Sunglasses",slot:"head",per:2,desc:"+2 PER. He can see everything. He is judging everything. SPF: unlimited.",sprite:SPR_A_DADCAP},
 {id:"earprotection",name:"Hearing Protection Muffs",slot:"head",def:1,wis:1,desc:"Blocks sound. Deepens wisdom through selective deafness.",sprite:SPR_A_HARDHAT},
 {id:"bandana",name:"Dad Bandana (Forehead)",slot:"head",atk:1,desc:"+1 ATK. He means business. The business is unclear.",sprite:SPR_A_DADCAP},
 {id:"highvis",name:"High-Vis Safety Vest",slot:"torso",def:2,per:1,desc:"Seen from space. Enemies see him coming and somehow still lose.",sprite:SPR_A_CHESTPAD},
 {id:"denimshirt",name:"Denim Shirt (Buttoned Wrong)",slot:"torso",def:2,wis:1,desc:"+DEF, +WIS. The top button is incorrect. He knows. He stays the course.",sprite:SPR_A_FLEECE},
 {id:"windbreaker",name:"Windbreaker (Circa 2001)",slot:"torso",def:1,per:1,desc:"Makes a sound with every movement. Enemies hear him approach. Somehow still effective.",sprite:SPR_A_FLEECE},
 {id:"apron",name:"Grilling Apron",slot:"torso",def:2,atk:1,desc:"+DEF, +ATK. 'Kiss the Cook.' Nobody is kissing the cook. He presses on.",sprite:SPR_A_CHESTPAD},
 {id:"kneebrace",name:"Knee Brace (Right Knee)",slot:"legs",def:2,desc:"+2 DEF. Braced. Reinforced. The right knee will outlast the man who wears it. The left knee is on its own.",sprite:SPR_A_CARGOSHORTS},
 {id:"sweatpants",name:"Elastic-Waist Sweatpants",slot:"legs",cap:1,wis:1,desc:"+1 slot, +1 Dadism power. Comfort is a tactical advantage.",sprite:SPR_A_KHAKIPANTS},
 {id:"jeans",name:"Relaxed-Fit Jeans",slot:"legs",def:1,cap:1,desc:"Relaxed fit. Dad approved. Structurally sound at exactly one wash temperature.",sprite:SPR_A_CARGOSHORTS},
 {id:"sandals",name:"Sandals with Socks",slot:"feet",wis:1,per:1,desc:"Maximum comfort. Minimum dignity. He has made his peace.",sprite:SPR_A_TUBESOCKS},
 {id:"flipflops",name:"Garage Flip-Flops",slot:"feet",def:0,per:1,desc:"+1 PER. Slaps on every surface. The sound announces him. His enemies prepare. Somehow still.",sprite:SPR_A_TUBESOCKS},
 {id:"worklaces",name:"Work Boots (Broken-In)",slot:"feet",def:3,desc:"+3 DEF. 20 years of wear. Resoled twice. His sons will inherit them.",sprite:SPR_A_STEELBOOTS},
 {id:"rubbergloves",name:"Rubber Dishwashing Gloves",slot:"arms",def:2,desc:"+2 DEF. Waterproof. Designed for dishes. Repurposed for combat.",sprite:SPR_A_WORKGLOVES},
 {id:"utility_belt",name:"Utility Belt (Dad-Configured)",slot:"arms",cap:2,per:1,desc:"+2 slots, +1 PER. Contains one of everything needed for almost any situation. Weight: heroic.",sprite:SPR_A_TAPEMEASURE},
 // ── NIGHTLY ADDITIONS (2026-06-18 PM) ──
 {id:"knee_sleeves",name:"Compression Knee Sleeves",slot:"legs",def:1,kneeRelief:true,desc:"+1 DEF. While worn, the knees do not crack and do not buckle. He bought them for 'working out.' He wears them on stairs.",sprite:SPR_A_CARGOSHORTS},
 {id:"safety_glasses",name:"Safety Glasses (Scratched)",slot:"head",per:1,desc:"+1 PER. Mandatory eye protection. Worn on the forehead 90% of the time. \"You can't hear boobies.\" Wise advice from countless dads before.",sprite:SPR_A_DADCAP},
 // ── NIGHTLY ADDITIONS N5 (2026-06-18) ──
 {id:"beanie",name:"Winter Beanie (Worn Indoors)",slot:"head",def:1,wis:1,desc:"+1 DEF, +1 Dadism power. The thermostat is at 64. He has made his choice. The beanie is the consequence and the comfort.",sprite:SPR_A_HARDHAT},
 {id:"flannel",name:"Lumberjack Flannel (Unbuttoned)",slot:"torso",def:2,atk:1,desc:"+2 DEF, +1 ATK. He has never felled a tree. The flannel does not know this. The flannel believes in him.",sprite:SPR_A_FLEECE},
 {id:"elbowpads",name:"Elbow Pads (Just In Case)",slot:"arms",def:2,desc:"+2 DEF. Purchased for a hobby that never started. Deployed for a war that never ended.",sprite:SPR_A_WORKGLOVES},
 {id:"overalls",name:"Painter's Overalls (Three Projects Old)",slot:"legs",def:1,cap:1,desc:"+1 DEF, +1 slot. Every stain is a memory. Every pocket holds a forgotten brush. Structurally: mostly dried paint.",sprite:SPR_A_CARGOSHORTS},
 {id:"crocs",name:"Crocs (Sport Mode Engaged)",slot:"feet",def:1,per:1,desc:"+1 DEF, +1 PER. The strap is back. He means business. The ventilation is a tactical liability he accepts.",sprite:SPR_A_TUBESOCKS},
 {id:"poncho",name:"Emergency Rain Poncho (From the Glovebox)",slot:"torso",def:1,per:1,desc:"+1 DEF, +1 PER. Folded since the 2018 game that got rained out. Smells of the glovebox. Deploys with a defiant crinkle.",sprite:SPR_A_CHESTPAD}
];

/* ===== CHARMS (worn neck/ring/hair; max 2) ===== */
const CHARMS=[
 {id:"lanyard",name:"Membership Lanyard",wear:"neck",per:1,desc:"+1 PER. Worn on the neck. Opens doors and resentment.",sprite:SPR_C_LANYARD},
 {id:"weddingring",name:"Wedding Ring",wear:"ring",wis:1,desc:"+1 Dadism power. A ring. A reminder. A power source.",sprite:SPR_C_WEDDINGRING},
 {id:"classring",name:"Class Ring",wear:"ring",atk:1,desc:"+1 ATK. Go Wildcats. (1987)",sprite:SPR_C_CLASSRING},
 {id:"readers",name:"Reading Glasses on a Chain",wear:"neck",per:1,wis:1,desc:"On your face. ON YOUR FACE.",sprite:SPR_C_READERS},
 {id:"pencil",name:"Lucky Pencil Behind the Ear",wear:"hair",per:1,desc:"Half-chewed, all business.",sprite:SPR_C_PENCIL},
 {id:"visor",name:"Foam Trucker Visor",wear:"hair",def:1,desc:"Mesh back, maximum airflow.",sprite:SPR_C_VISOR},
 {id:"studfinder_charm",name:"The Studfinder of Prophecy",wear:"neck",per:1,desc:"+1 PER. Vibrates when hidden things are nearby — traps, secrets, structural dishonesty. Feared by drywall demons. Do not confuse with the weapon.",sprite:SPR_C_STUDFINDER}
,
 // ── NIGHTLY ADDITIONS (2026-06-18) ──
 {id:"watchband",name:"Digital Watch (Still Has Time)",wear:"ring",atk:1,wis:1,desc:"+1 ATK, +1 WIS. Set in 2009. Still correct twice daily. He never reset it for daylight savings. He is at peace with this.",sprite:SPR_C_WATCHBAND},
 {id:"keychain",name:"Keychain (45 Keys)",wear:"ring",per:1,cap:1,desc:"+1 PER, +1 slot. He knows what four of them go to. Possibly five. The rest are load-bearing.",sprite:SPR_C_KEYCHAIN},
 {id:"fortunecookie",name:"Fortune Cookie (Unread)",wear:"hair",wis:2,desc:"+2 Dadism power. Carried since the restaurant in 2019. He will read it when the moment is right.",sprite:SPR_C_FORTUNECOOKIE},
 {id:"lucky_coin",name:"Lucky Penny (Heads Up)",wear:"ring",def:1,atk:1,desc:"+1 DEF, +1 ATK. Found in a 2014 parking lot. Never spent. A good omen. The statistics support this.",sprite:SPR_C_LUCKYCOIN},
 {id:"suspenders",name:"Clip-On Suspenders",wear:"neck",def:2,desc:"+2 DEF. Structural redundancy. Belt AND suspenders. Only one is necessary. He uses both. He will not apologize.",sprite:SPR_C_SUSPENDERS},
 {id:"fistbump_band",name:"Motivational Wristband",wear:"ring",wis:1,atk:1,desc:"+1 ATK, +1 Dadism power. Says 'PUSH HARDER' in all caps. He agrees with this sentiment.",sprite:SPR_C_FISTBUMP},
 {id:"fishing_lure",name:"Lucky Fishing Lure",wear:"hair",per:2,desc:"+2 PER. Attached to the hat band. Has never caught a fish. The intent has always been there.",sprite:SPR_C_FISHINGLURE},
 {id:"name_badge",name:"Expired Conference Badge",wear:"neck",wis:1,per:1,desc:"+1 WIS, +1 PER. From TechConnect 2017. He still knows someone there. Probably.",sprite:SPR_C_NAMEBADGE},
 // ── NIGHTLY ADDITIONS N5 (2026-06-18) ──
 {id:"toothpick",name:"Ever-Present Toothpick",wear:"hair",atk:1,per:1,desc:"+1 ATK, +1 PER. Migrates from corner to corner of the mouth. Sees all. Says little. Has been the same toothpick for a concerning duration.",sprite:SPR_C_PENCIL},
 {id:"dogtags",name:"Old Dog Tags (Not Military)",wear:"neck",def:1,wis:1,desc:"+1 DEF, +1 Dadism power. From a 5K in 2011. He kept them. They confer no rank. They confer resolve.",sprite:SPR_C_LANYARD},
 {id:"signet",name:"Bottle-Opener Ring",wear:"ring",atk:1,def:1,desc:"+1 ATK, +1 DEF. Solves exactly one problem, perfectly, forever. The most reliable tool he owns.",sprite:SPR_C_CLASSRING},
 {id:"earbuds",name:"One Working Earbud",wear:"neck",wis:1,per:1,desc:"+1 WIS, +1 PER. The left one died in 2020. The right one carries the entire podcast. He hears half the world and judges all of it.",sprite:SPR_C_READERS}
];

/* ===== CONSUMABLES (incl. healing, throwables, cures, alcohol) ===== */
const CONSUMABLES=[
 {id:"casserole",name:"Leftover Casserole",heal:12,nourish:40,desc:"Unidentifiable. Restorative. A whole meal.",sprite:SPR_Q_CASSEROLE},
 {id:"granola",name:"Sad Granola Bar",heal:6,nourish:25,desc:"From the bottom of a bag.",sprite:SPR_Q_GRANOLA},
 {id:"jerky",name:"Mystery Jerky",heal:8,nourish:22,saltdry:3,desc:"So salty it dries you out for a few turns. Not The Thirst — just thirst.",sprite:SPR_Q_JERKY},
 {id:"meatball",name:"Lukewarm Meatball",heal:4,nourish:15,throw:{dmg:4},desc:"Eat it or throw it.",sprite:SPR_Q_MEATBALL},
 {id:"coffee",name:"Gas Station Coffee",heal:4,hydrate:10,moxie:3,causes:"jitters",desc:"+Patience. Heart: optional.",sprite:SPR_Q_COFFEE},
 {id:"gatorade",name:"Blue Electrolyte Drink",heal:5,hydrate:45,cures:["hangry","hangover"],desc:"Replaces electrolytes and regret.",sprite:SPR_Q_GATORADE},
 {id:"water",name:"Warm Water Bottle",hydrate:55,desc:"Found in the car. Body temperature. Hydrating.",sprite:SPR_Q_WATER},
 {id:"pedialyte",name:"Kids' Electrolyte Solution",heal:4,hydrate:40,cures:["hangover"],desc:"Cures hangover, eases The Thirst.",sprite:SPR_Q_PEDIALYTE},
 {id:"energy",name:"Off-Brand Energy Drink",hydrate:10,moxie:6,causes:"jitters",desc:"+Patience (ironically).",sprite:SPR_Q_ENERGY},
 {id:"lightbeer",name:"Light Beer",heal:3,hydrate:12,moxie:1,alcohol:true,desc:"Eases The Thirst now, deepens it later.",sprite:SPR_Q_LIGHTBEER},
 {id:"beercan",name:"Warm Beer Can",heal:2,hydrate:8,alcohol:true,throw:{dmg:5,status:"soaked"},desc:"Drink it or hurl it.",sprite:SPR_Q_BEERCAN},
 {id:"flask",name:"Pocket Flask of Whiskey",heal:2,moxie:1,alcohol:true,throw:{dmg:3},desc:"+ATK +DEF temporarily. Best enjoyed responsibly, alongside food and water.",sprite:SPR_Q_FLASK},
 {id:"rehab",name:"Laminated Rehab Pamphlet",cures:["thirst"],desc:"The only true cure for The Thirst.",sprite:SPR_Q_PAMPHLET},
 {id:"binder",name:"Family Intervention Binder",withdrawcure:true,baseRarity:"Legendary",desc:"Prepared with love and mild desperation by his family. Contains a schedule, a phone list, and one handwritten note from his kid (page 12). Starts withdrawal: avoid alcohol for 15 turns, then The Thirst is permanently cured.",sprite:SPR_Q_BINDER},
 {id:"ibuprofen",name:"Ibuprofen (Family Size)",heal:3,cures:["knee","back"],desc:"+3 HP. Cures Dad-body ailments.",sprite:SPR_Q_IBUPROFEN}
,
 // ── NIGHTLY ADDITIONS (2026-06-18) ──
 {id:"acetaminophen",name:"Acetaminophen (Store Brand)",defBuff:10,desc:"+2 DEF for 10 turns. Read the label: do not combine with alcohol. (Nobody reads the label.)",sprite:SPR_Q_IBUPROFEN},
 {id:"hotdog",name:"Gas Station Hot Dog",heal:10,nourish:35,causes:"thirst",desc:"On the roller since yesterday. Structurally confident.",sprite:SPR_Q_MEATBALL},
 {id:"proteinbar",name:"Chalky Protein Bar",heal:4,nourish:30,desc:"Flavor: 'Vanilla.' Contains neither.",sprite:SPR_Q_GRANOLA},
 {id:"sportsdrink",name:"Red Sports Drink",heal:3,hydrate:50,cures:["hangry"],desc:"Neon red. The lab report is outstanding.",sprite:SPR_Q_GATORADE},
 {id:"kombucha",name:"Experimental Kombucha",heal:6,hydrate:30,moxie:2,cures:["hangover"],desc:"+Patience. 14-day fermentation. 40% chance this one is fine.",sprite:SPR_Q_WATER},
 {id:"coldpizza",name:"Cold Pizza (Breakfast)",heal:14,nourish:45,desc:"A complete meal. A lifestyle. A statement.",sprite:SPR_Q_CASSEROLE},
 {id:"dinnermints",name:"Restaurant Mints (Handful)",heal:1,nourish:5,moxie:1,desc:"From the bowl by the door. Free. Technically.",sprite:SPR_Q_GRANOLA},
 {id:"glucosamine",name:"Glucosamine Chondroitin",cures:["knee","back"],desc:"Taken daily since 2019. Results: the jury remains out. The knees remain problematic.",sprite:SPR_Q_IBUPROFEN},
 {id:"antacid",name:"Chalky Antacid Tablet",heal:4,cures:["hangry"],desc:"Fruit-flavored. Chalky. Works instantly and publicly.",sprite:SPR_Q_IBUPROFEN},
 {id:"applejuice",name:"Juice Pouch (Apple)",heal:2,hydrate:35,nourish:10,desc:"The straw takes 4 attempts. Every time.",sprite:SPR_Q_PEDIALYTE},
 {id:"fruitcup",name:"Fruit Cup (Syrup-Packed)",heal:6,nourish:20,hydrate:15,desc:"The fruit is optional. The syrup is the point.",sprite:SPR_Q_CASSEROLE},
 // ── NIGHTLY ADDITIONS (2026-06-21) N6 ──
 {id:"banana",name:"Lone Banana (Slightly Bruised)",heal:5,nourish:18,cures:["knee"],desc:"Potassium. The official fruit of the man who is fine. The bruise is where the flavor lives.",sprite:SPR_Q_GRANOLA},
 {id:"hose_water",name:"Garden Hose Water",hydrate:48,desc:"Warm, rubbery, faintly metallic. The way water was meant to be taken. Free, and it builds character.",sprite:SPR_Q_WATER},
 {id:"tums_roll",name:"Roll of Antacids (Pocket Lint Included)",heal:3,cures:["hangry","saltdry"],desc:"Chalk in three flavors, all of them chalk. Found in every coat he owns.",sprite:SPR_Q_IBUPROFEN},
 {id:"icyhot",name:"Tube of Menthol Heat Rub",cures:["back","knee"],desc:"Cures The Back and The Knee at once. The aroma announces you to a room before you enter it.",sprite:SPR_Q_IBUPROFEN},
 {id:"epsom",name:"Epsom Salt Soak (Travel Packet)",heal:8,cures:["back"],desc:"+8 HP. A grown man's bath bomb. He earned this and he will tell you why.",sprite:SPR_Q_PEDIALYTE},
 {id:"coconut_water",name:"Coconut Water (Impulse Buy)",heal:4,hydrate:42,cures:["hangover"],desc:"He read it was good for you. He did not enjoy it. He finished it on principle.",sprite:SPR_Q_GATORADE},
 {id:"ginger_ale",name:"Flat Ginger Ale",heal:5,hydrate:20,cures:["hangry","hangover"],desc:"The household cure for the flu, a bad mood, and existential dread. Carbonation: a memory.",sprite:SPR_Q_PEDIALYTE},
 {id:"crockpot",name:"All-Day Slow Cooker Stew",heal:20,nourish:55,desc:"In since 6 a.m. He told everyone about it. Repeatedly. It was, in fact, worth it.",sprite:SPR_Q_CASSEROLE}
];

/* ===== KEYS ===== */
const KEYS=[{id:"key",name:"Mysterious Key",desc:"A key. For a door. Somewhere on this floor. Hopefully this one."}];

/* ===== OBJECTS / crafting materials & throwables ===== */
const OBJECTS=[
 {id:"ducttape",name:"Half Roll of Duct Tape",desc:"For when it moves and shouldn't. Repairs anything, temporarily permanent."},
 {id:"screws",name:"Mystery Screws x14",desc:"For a project that no longer exists."},
 {id:"plywood",name:"Scrap Plywood",desc:"Structurally optimistic."},
 {id:"ziptie",name:"Bag of Zip Ties",desc:"The dad adhesive of last resort."},
 {id:"wd40",name:"Can of WG-40 Spray Lube",desc:"For when it doesn't move and should."},
 {id:"hdmi",name:"Tangled HDMI Cables",desc:"At least one works. Nobody knows which."},
 {id:"battery",name:"9-Volt Battery",desc:"Tested by tongue. Verdict: yes."},
 {id:"propane",name:"Half-Full Propane Tank",desc:"Or is it half-empty. He has opinions."},
 {id:"aabattery",name:"Loose AA Battery",throw:{dmg:3},desc:"Throwable (3 dmg). The TV remote misses it."},
 {id:"manual",name:"The Owner's Manual",identify:true,desc:"You actually read it. All gear in inventory and equipped is immediately identified. Nobody does this voluntarily."},
 {id:"receipt",name:"The Original Receipt",uncurse:true,desc:"Proof of purchase, wielded against the supernatural. Removes all hindering enchantments from equipped gear. The item sighs in resignation."},
 {id:"goopgone",name:"Goop-Gone (Curse Remover)",uncurse:true,desc:"Industrial-strength enchantment solvent. Dissolves hindering affixes on contact. Also removes grease from ceramic tile. The directions warned against this use."}
,
 // ── NIGHTLY ADDITIONS (2026-06-18) ──
 {id:"sticky_note",name:"Sticky Note of Identification",identifySingle:true,desc:"A yellow sticky note with an arrow on it. Applied to any unidentified gear to immediately reveal its true nature. Did not come with the gear. Nothing comes with the gear."},
 {id:"yanktube",name:"YallTube DIY Video",revealRecipe:true,desc:"A printout of a four-minute video titled 'How To Do That One Thing.' Reveals one crafting recipe permanently. Comments are disabled. Correctly."},
 {id:"soy_masculinity",name:"The Book of REAL Men",societyItem:true,sellValue:18,desc:"A thick paperback about how a man should stand, walk, and feel emotions incorrectly. No mechanical effect. I guess someone might find this useful."},
 {id:"sigma_grindset",name:"The Sigma Grindset (Audiobook)",societyItem:true,sellValue:14,desc:"7 CDs. Covers 'winning' and 'not losing.' Mutually exclusive with reading. No mechanical effect. I guess someone might find this useful."},
 {id:"submissive_journal",name:"Mindfulness Journal for Gentle Men",societyItem:true,sellValue:16,desc:"Prompts include 'What did I apologize for today?' No mechanical effect. I guess someone might find this useful."},
 {id:"alpha_powder",name:"ALPHA MASS SUPPLEMENT",societyItem:true,sellValue:20,desc:"97% maltodextrin. Comes with a poster of a man who also takes this. No mechanical effect. I guess someone might find this useful."},
 {id:"vulnerability_badge",name:"'I Feel Things' Button",societyItem:true,sellValue:12,desc:"Enamel pin. He does feel things. Mostly his back. No mechanical effect. I guess someone might find this useful."},
 {id:"gym_pass",name:"Free Gym Trial Membership (30 Days)",attrBoost:{stat:"str",amount:2},desc:"ATTR BOOST: +2 permanent ATK. The 30 days is real. The gains are permanent. The membership is not renewed."},
 {id:"roman_history",name:"A History of Rome (Unabridged)",attrBoost:{stat:"wis",amount:1},desc:"ATTR BOOST: +1 permanent Dadism power. 847 pages. He read 400. That was enough. He has opinions now."},
 {id:"crossword_book",name:"Crossword Book (Pen, Not Pencil)",attrBoost:{stat:"per",amount:1},desc:"ATTR BOOST: +1 permanent PER. Ink only. No erasing. He commits to his guesses. Several of them are wrong. He knows."},
 {id:"toolbox_full",name:"Complete Toolbox (Labeled)",attrBoost:{stat:"def",amount:2},desc:"ATTR BOOST: +2 permanent DEF. Every tool in its place. All labeled. He knows exactly where the 10mm socket is. He is not sharing this information."},
 // ── NIGHTLY ADDITIONS (2026-06-21) N6 throwables ──
 {id:"bowling_ball",name:"Garage Bowling Ball (One Of A Pair)",throw:{dmg:8},desc:"Throwable (8 dmg). Its twin is lost forever. This one carries the grief, and the momentum."},
 {id:"horseshoe",name:"Rusted Horseshoe",throw:{dmg:6},desc:"Throwable (6 dmg). Lucky for you. Considerably less so for whatever it lands on."},
 {id:"frozen_burger",name:"Frozen Burger Patty (Single)",throw:{dmg:5,status:"soaked"},desc:"Throwable (5 dmg). A discus of regret. Thaws on impact, mostly onto the target."},
 {id:"golf_ball",name:"Range Bucket Golf Ball",throw:{dmg:4,range:7},desc:"Throwable (4 dmg, long range). He has a whole bucket of these. Nobody knows why. He knows why."}
,
 // ── NIGHTLY ADDITIONS (2026-06-22) N7 ──
 {id:"dadism_scroll",name:"Wrinkled Dadism Scroll",learnDadism:true,desc:"A laminated printout discovered in a coat pocket, dated 1998. Teaches a random Dadism you don't already know. He made seventeen copies. Each is slightly different. He does not know which one this is."}
];

/* ===== STATUS EFFECTS ===== */
const STATUSES={
 regen:{icon:"REGEN",name:"Regen",bad:false,desc:"Regenerating HP each turn. Everything is under control."},
 atkup:{icon:"PUMP",name:"Pumped Up",bad:false,desc:"+3 ATK. He is locked in."},
 guard:{icon:"GUARD",name:"Guard Stance",bad:false,desc:"+2 DEF. He saw this coming."},
 jitters:{icon:"JITTRS",name:"The Jitters",bad:true,desc:"Caffeine overload. Random movement occasionally."},
 thirst:{icon:"THIRST",name:"The Thirst",bad:true,desc:"Escalating dependency: Stage 1 (depend 1-2) slows cravings; Stage 2 (3-5) -1 STR, -3 PER, faster cravings; Stage 3 (6+) -2 STR, -4 PER, craving threshold drops. Cure: Family Intervention Binder."},
 hangry:{icon:"HANGRY",name:"Hangry",bad:true,desc:"Unfed too long. ATK reduced. Dignity: wavering."},
 hangover:{icon:"HNGOVR",name:"Hangover",bad:true,desc:"The morning after. PER and WIS both suffer."},
 soaked:{icon:"SOAKED",name:"Soaked",bad:true,desc:"Wet. DEF reduced. Dignity: soaked."},
 defbuff:{icon:"PAINMG",name:"Pain Managed",bad:false,desc:"+2 DEF. The acetaminophen is working. Probably."},
 invincible:{icon:"INVINC",name:"Maximum Dad Relief",bad:false,desc:"Briefly immune to damage. He has never felt better. The dosage was not approved."},
 knee:{icon:"KNEE",name:"The Knee",bad:true,desc:"It acts up. Movement costs extra."},
 back:{icon:"BACK",name:"The Back",bad:true,desc:"Goes out at the worst time. Always."},
 dad_drunk:{icon:"DRUNK",name:"Dad Drunk",bad:true,desc:"+2 ATK, -2 PER. You are fine. You are not fine."},
 blind:{icon:"BLIND",name:"Blinded",bad:true,desc:"Cannot see adjacent enemies. The flashlight did this."},
 rooted:{icon:"FROZEN",name:"Frozen (Update Installing)",bad:true,desc:"Cannot move. Mandatory. No skip option."},
 backlock:{icon:"BACKLK",name:"Back Locked",bad:true,desc:"It went out. Movement is, for the moment, not on the table."},
 reaction:{icon:"REACTN",name:"The Reaction",bad:true,desc:"Acetaminophen met alcohol. The body is responding. Rapidly. Find a bathroom and some water."},
 saltdry:{icon:"SALT",name:"Salt Mouth",bad:true,desc:"That jerky was aggressively salty. You dehydrate faster for a few turns. Worth it."}
};

/* ===== TRAPS ===== */
const TRAPS_DEF=[
 {id:"hoa_notice",sprite:SPR_TRAP_HOA,name:"HOA Violation Notice",detect:2,dmg:0,status:"hangry",desc:"Psychic damage only. But it lingers."},
 {id:"lego",sprite:SPR_TRAP_LEGO,name:"Scattered Building Bricks",detect:3,dmg:4,status:"knee",desc:"The ancient enemy of bare feet and peace of mind."},
 {id:"wires",sprite:SPR_TRAP_WIRES,name:"Tangle of Extension Cords",detect:2,dmg:3,desc:"Trip hazard. The surge protector is somewhere in there."},
 {id:"wet_floor",sprite:SPR_TRAP_WET,name:"Unmarked Wet Floor",detect:3,dmg:2,status:"soaked",desc:"No sign. Of course there's no sign."},
 {id:"recall_notice",sprite:SPR_TRAP_RECALL,name:"Product Recall Notice",detect:1,dmg:0,status:"jitters",desc:"The thing you use every day. Always has been recalled."},
 {id:"popup_ad",sprite:SPR_TRAP_POPUP,name:"Unskippable Ad",detect:1,dmg:0,status:"rooted",desc:"Fifteen seconds. Cannot be dismissed. Will not be dismissed."},
 {id:"brown_substance_trap",sprite:SPR_TRAP_BROWN,name:"Unknown Brown Substance (Floor)",detect:1,dmg:2,status:"soaked",desc:"The floor is wet. In a way that implies a specific kind of source. You know. We both know. Step around it next time."},
 {id:"poop_bomb",sprite:SPR_TRAP_POOP,name:"Dog Walker Special",detect:2,dmg:3,status:"soaked",desc:"The dog has been here. The evidence is comprehensive, fragrant, and centered exactly where you needed to step. The walker has already rounded the corner and cannot hear you."}
];

/* ===== DADISMS (Book of Dadvice) ===== */
const DADISMS=[
 {id:"char",name:"Char It",classes:["grill"],cost:3,kind:"dmg",power:9,desc:"Scorch an adjacent foe for big fire damage."},
 {id:"standmeat",name:"Stand Near the Meat",classes:["grill"],cost:2,kind:"buff",status:"regen",turns:6,desc:"Everything is under control. Regenerate HP for a while."},
 {id:"improv",name:"Improvised Solution",classes:["diy"],cost:2,kind:"random",desc:"60% great, 35% worse, 5% structural. Outcome unknown."},
 {id:"goodenough",name:"Good Enough",classes:["diy"],cost:2,kind:"heal",power:10,desc:"Patch yourself up. +10 HP. Close enough."},
 {id:"reboot",name:"Turn It Off and On Again",classes:["tech"],cost:3,kind:"stun",turns:3,desc:"Stun an adjacent foe. Works on everything but printers."},
 {id:"firmware",name:"Mandatory Firmware Update",classes:["tech"],cost:5,kind:"rootall",turns:2,desc:"All enemies pause for an update they did not request."},
 {id:"onemore",name:"One More Rep",classes:["gym"],cost:3,kind:"buff",status:"atkup",turns:5,desc:"+3 ATK. Health is a mindset."},
 {id:"preworkout",name:"Scoop of Pre-Workout",classes:["gym"],cost:2,kind:"heal",power:8,desc:"+8 HP and a tingling face."},
 {id:"dadscan",name:"Dad Scan",classes:["tactical"],cost:3,kind:"scan",desc:"Reveal the whole floor and every foe's health."},
 {id:"flashlight",name:"Tactical Flashlight",classes:["tactical"],cost:2,kind:"blind",turns:2,desc:"Blind adjacent foes. And yourself a little."},
 {id:"backinmyday",name:"Back In My Day",classes:["grill","diy","tech","gym","tactical","sports","yard"],cost:2,kind:"aoe",power:4,desc:"Nostalgia damage to all nearby. Effects increase yearly."},
 {id:"guard",name:"Assume Tactical Stance",classes:["tactical","gym"],cost:2,kind:"buff",status:"guard",turns:5,desc:"+2 DEF. You saw this coming."},
 {id:"sideline_yell",name:"Sideline Tirade",classes:["sports"],cost:3,kind:"stun",turns:3,desc:"Question the officiating at a volume that stuns an adjacent foe. The call does not change. They never do."},
 {id:"orange_slices",name:"Halftime Orange Slices",classes:["sports"],cost:2,kind:"buff",status:"regen",turns:6,desc:"Citrus, quartered, distributed at the half. Regenerate HP for a while."},
 {id:"mow_down",name:"Mow It Down",classes:["yard"],cost:3,kind:"dmg",power:10,desc:"The mower meets an adjacent foe. Two-cycle justice. Bag sold separately."},
 {id:"sprinkler",name:"Activate The Sprinklers",classes:["yard"],cost:4,kind:"rootall",turns:2,desc:"The in-ground system engages on schedule. Everything nearby stops to get out of water it did not expect."}

,
 // ── NIGHTLY ADDITIONS (2026-06-22) N7 ──
 {id:"dad_sneeze",name:"The Dad Sneeze",classes:["grill","diy","tech","gym","tactical","sports","yard"],cost:2,kind:"knockback",power:3,desc:"An involuntary, full-body detonation that launches an adjacent foe backward. No warning. No apology. No encore. Bless you."},
 // Learnable dadisms — acquired via dadism scrolls; not assigned at class start
 {id:"the_nod",name:"The Nod",learnable:true,classes:[],cost:2,kind:"buff",status:"guard",turns:4,desc:"+2 DEF. A single downward head movement communicating respect, acknowledgment, and quiet authority. No words. They were not needed."},
 {id:"walk_it_off",name:"Walk It Off",learnable:true,classes:[],cost:3,kind:"heal",power:12,desc:"+12 HP. He has been walking it off since 1987. It has never once not eventually worked."},
 {id:"disappointed_look",name:"The Disappointed Look",learnable:true,classes:[],cost:3,kind:"stun",turns:3,desc:"A look that has silenced rooms, ended arguments, and once stopped a ceiling fan mid-spin. Stuns an adjacent foe for 3 turns."},
 {id:"the_handshake",name:"Firm Handshake",learnable:true,classes:[],cost:3,kind:"dmg",power:8,desc:"He learned it from his father. His father learned it from his. The lineage delivers 8 damage and expects eye contact."},
 {id:"watched_video",name:"I Watched A Video",learnable:true,classes:[],cost:2,kind:"random",desc:"He watched a video. A whole one. It may or may not apply. Outcome: unpredictable. Confidence: maximum."},
 {id:"fix_it_later",name:"I'll Fix It Later",learnable:true,classes:[],cost:1,kind:"heal",power:6,desc:"+6 HP. A temporary measure. He is aware it is temporary. This awareness has not changed the approach."},
 {id:"dad_joke_power",name:"Dad Joke (Deployed)",learnable:true,classes:[],cost:4,kind:"aoe",power:5,desc:"He tells it. The whole floor hears it. The groan travels 3 tiles and deals 5 damage to all nearby enemies. The joke was poor. The damage is real."},
 {id:"its_fine",name:"It's Fine",learnable:true,classes:[],cost:2,kind:"buff",status:"regen",turns:5,desc:"Everything is fine. He is regenerating HP. This is fine. It is all fine. The situation is fine and he is fine."},
 {id:"count_heads",name:"Count Heads",learnable:true,classes:[],cost:3,kind:"scan",desc:"He counts. Then counts again. Then counts the exits, the threats, and the ceiling tiles. Everything on this floor: revealed."},
 {id:"found_shortcut",name:"Found A Shortcut",learnable:true,classes:[],cost:4,kind:"rootall",turns:2,desc:"This is not a shortcut. It has never been a shortcut. The announcement of it has confused all nearby enemies for 2 turns while they process the claim."}

];

/* ===== RECIPES (combine two items) ===== */
const RECIPES=[
 {a:"ducttape",b:"plunger",out:{kind:"weapon",id:"plunger",name:"Reinforced Plunger",atk:7,desc:"Duct tape makes it a weapon of consequence."},desc:"Duct Tape + Plunger."},
 {a:"ducttape",b:"rake",out:{kind:"weapon",id:"rake",name:"Taped-Up Rake",atk:6,desc:"It holds. Barely. Enough."},desc:"Duct Tape + Rake."},
 {a:"propane",b:"spatula",out:{kind:"weapon",id:"flamespat",name:"The Flame Spatula",atk:9,desc:"OSHA has questions. The burgers do not."},lock:"grill",desc:"Propane + Spatula (Grillmaster only)."},
 {a:"meatball",b:"propane",out:{kind:"consumable",id:"charball",name:"Charred Mega-Meatball",heal:18,throw:{dmg:9},desc:"+18 HP or a 9-dmg projectile of glory."},bonus:"grill",desc:"Meatball + Propane."},
 {a:"coffee",b:"energy",out:{kind:"consumable",id:"supercoffee",name:"Double-Fisted Coffee",heal:6,moxie:8,hydrate:15,causes:"jitters",desc:"+6 HP, +8 Patience. Heart rate: academic."},desc:"Coffee + Energy Drink."},
 {a:"gatorade",b:"pedialyte",out:{kind:"consumable",id:"daderade",name:"Daderade",heal:8,hydrate:60,cures:["hangry","hangover","thirst"],desc:"Maximum electrolytes. The science is real."},desc:"Gatorade + Pedialyte."},
 {a:"ziptie",b:"battery",out:{kind:"object",id:"zapbundle",name:"Zip-Tied Battery Bundle",throw:{dmg:7},desc:"Throwable (7 dmg). 100% safe. 0% warranty."},desc:"Zip Ties + Battery."},
 {a:"wd40",b:"blowtorch",out:{kind:"weapon",id:"flamespray",name:"WD-40 Torch",atk:8,throw:{dmg:5},desc:"Not intended for this. Definitely for this."},desc:"WD-40 + Blowtorch."}
,
 // ── NIGHTLY ADDITIONS (2026-06-18) ──
 {a:"acetaminophen",b:"ibuprofen",out:{kind:"consumable",id:"dadrelief",name:"Maximum Dad Relief Protocol",defBuff:8,invincible:8,heal:5,desc:"+5 HP. DEF +8 for 8 turns. Briefly immune to regret. The directions said not to combine these. He combined them."},desc:"Acetaminophen + Ibuprofen (do not take on an empty stomach)."},
 {a:"ziptie",b:"hdmi",out:{kind:"object",id:"hdmi_flail",name:"Tangled HDMI Flail",throw:{dmg:9,range:6},desc:"Throwable (9 dmg). The cable works now that it has been weaponized."},desc:"Zip Ties + HDMI Cable."},
 {a:"ducttape",b:"aabattery",out:{kind:"consumable",id:"taped_torch",name:"Improvised Flashlight",heal:0,moxie:4,desc:"+4 Patience. Actually works. He is unreasonably proud of this.",nourish:0},desc:"Duct Tape + AA Battery."},
 {a:"coffee",b:"gatorade",out:{kind:"consumable",id:"dadboost",name:"The Dad Boost",heal:8,hydrate:30,moxie:5,causes:"jitters",desc:"+8HP, +5 Patience, hydrate 30. Also: The Jitters. You cannot have everything."},desc:"Coffee + Blue Gatorade."},
 {a:"propane",b:"wd40",out:{kind:"object",id:"flamethrower_rig",name:"The Regrettable Flamethrower Rig",throw:{dmg:12,range:7},desc:"Throwable (12 dmg). Warranty: absolutely void. OSHA: unaware.",classes:["diy","tactical"]},classes:["diy","tactical"],desc:"Propane + WD-40 (DIY / Tactical only)."},
 {a:"screws",b:"plywood",out:{kind:"object",id:"barricade",name:"Plywood Barricade",placeable:true,trapId:"barricade",desc:"Placeable. Blocks a tile. Enemies must go around. Structurally questionable. Tactically sound."},classes:["diy","tactical","tech"],desc:"Screws + Plywood (Handy classes only)."}
,
 // -- NIGHTLY ADDITIONS (2026-06-18 PM) -- Acetaminophen + Alcohol: a mild reaction of sorts --
 {a:"acetaminophen",b:"flask",out:{kind:"consumable",id:"badreaction",name:"Unlabeled Fizzing Concoction",reaction:5,desc:"It fizzed when it shouldn't have. The label told me not to do this."},desc:"Acetaminophen + Whiskey."},
 {a:"acetaminophen",b:"lightbeer",out:{kind:"consumable",id:"badreaction",name:"Unlabeled Fizzing Concoction",reaction:5,desc:"It fizzed when it shouldn't have. The label told me not to do this."},desc:"Acetaminophen + Light Beer."},
 {a:"acetaminophen",b:"beercan",out:{kind:"consumable",id:"badreaction",name:"Unlabeled Fizzing Concoction",reaction:5,desc:"It fizzed when it shouldn't have. The label told me not to do this."},desc:"Acetaminophen + Warm Beer."},
 // ── NIGHTLY ADDITIONS (2026-06-21) N6 recipes ──
 {a:"ducttape",b:"horseshoe",out:{kind:"weapon",id:"luckymace",name:"Duct-Taped Horseshoe Mace",atk:7,desc:"Luck, taped to a handle. The handle is also tape. It connects with authority."},desc:"Duct Tape + Horseshoe."},
 {a:"coffee",b:"proteinbar",out:{kind:"consumable",id:"prefuel",name:"Pre-Run Fuel",heal:6,moxie:6,nourish:25,causes:"jitters",desc:"+6 HP, +6 Patience. The breakfast of men who say they will 'just do a quick loop.'"},desc:"Coffee + Protein Bar."},
 {a:"wd40",b:"horseshoe",out:{kind:"object",id:"slick_shoe",name:"Lubricated Throwing Shoe",throw:{dmg:9,range:6},desc:"Throwable (9 dmg, long range). Frictionless. Flies further than physics strictly permits."},desc:"WD-40 + Horseshoe."},
 {a:"propane",b:"frozen_burger",out:{kind:"consumable",id:"grillburger",name:"Properly Grilled Burger",heal:22,nourish:50,desc:"+22 HP. Cooked to a temperature he refuses to disclose. It is perfect. It is always perfect."},bonus:"grill",desc:"Propane + Frozen Burger Patty."},
 {a:"propane",b:"golf_ball",out:{kind:"object",id:"flaming_drive",name:"Flaming Tee Shot",throw:{dmg:11,range:7},desc:"Throwable (11 dmg, long range). A golf ball, but on fire, and somehow personally offended. Fore."},lock:"grill",desc:"Propane + Golf Ball (Grillmaster only)."},
 {a:"screws",b:"bowling_ball",out:{kind:"object",id:"spiked_ball",name:"Screw-Studded Bowling Ball",throw:{dmg:13},desc:"Throwable (13 dmg). Fourteen mystery screws, finally employed. The project was always this."},classes:["diy","tactical"],desc:"Screws + Bowling Ball (DIY / Tactical only)."},
 // ── NIGHTLY ADDITIONS (2026-07-03) — Armor Fusion Program: two garments enter, one garment leaves ──
 {a:"knee_sleeves",b:"pt_legs",out:{kind:"armor",id:"cargo_compression",name:"Tactical Compression Cargo System",slot:"legs",def:2,cap:2,kneeRelief:true,baseRarity:"Rare",sprite:SPR_A_CARGOSHORTS,desc:"+2 DEF, +2 slots, knees fully insured. The sleeves go under the shorts. He will explain the layering system to anyone who slows down."},desc:"Compression Knee Sleeves + Cargo Shorts."},
 {a:"baseballcap",b:"sunglasses",out:{kind:"armor",id:"umpire_stack",name:"The Umpire Stare (Full Assembly)",slot:"head",per:3,wis:1,baseRarity:"Rare",sprite:SPR_A_DADCAP,desc:"+3 PER, +1 WIS. Cap over wraparounds. He can now disagree with a call from 200 feet, silently, in a way everyone feels."},desc:"Dad Cap + Wraparound Sunglasses."},
 {a:"pt_grip",b:"sandals",out:{kind:"armor",id:"socks_sandals_final",name:"Socks and Sandals: Final Form",slot:"feet",def:2,wis:1,per:1,baseRarity:"Epic",sprite:SPR_A_TUBESOCKS,desc:"+2 DEF, +1 WIS, +1 PER. The fusion society feared. Comfort so complete it deflects blows and fashion criticism alike."},desc:"Tube Socks + Sandals. The prophecy fulfills itself."},
 {a:"glovework",b:"rubbergloves",out:{kind:"armor",id:"double_gloves",name:"The Double-Glove Guarantee",slot:"arms",def:3,atk:1,baseRarity:"Rare",sprite:SPR_A_WORKGLOVES,desc:"+3 DEF, +1 ATK. Rubber under leather. Waterproof, gripproof, excuse-proof. 'Two is one and one is none,' he says, incorrectly attributing it."},desc:"Work Gloves + Rubber Dishwashing Gloves."},
 {a:"fleece",b:"highvis",out:{kind:"armor",id:"highvis_fleece",name:"High-Vis Fleece of Managed Expectations",slot:"torso",def:3,wis:1,per:1,baseRarity:"Rare",sprite:SPR_A_FLEECE,desc:"+3 DEF, +1 WIS, +1 PER. Visible from space, insulated to 40 degrees, pockets fully redundant. Business casual for the apocalypse."},desc:"Fleece Vest + High-Vis Safety Vest."},
 {a:"hardhat",b:"earprotection",out:{kind:"armor",id:"osha_helm",name:"Full Compliance Helm",slot:"head",def:3,wis:1,baseRarity:"Rare",sprite:SPR_A_HARDHAT,desc:"+3 DEF, +1 WIS. Head protected. Ears protected. Opinions unprotected and flowing freely, since he can no longer hear the responses."},desc:"Hard Hat + Hearing Protection Muffs."},
 {a:"flannel",b:"apron",out:{kind:"armor",id:"grillfather_vest",name:"Vestments of the Grillfather",slot:"torso",def:4,atk:2,baseRarity:"Epic",sprite:SPR_A_CHESTPAD,desc:"+4 DEF, +2 ATK. Flannel beneath apron: the sacred layering. Someday, and that day may come at the cookout, it will ask a favor of you."},desc:"Lumberjack Flannel + Grilling Apron."},
 {a:"kneebrace",b:"sweatpants",out:{kind:"armor",id:"ortho_sweats",name:"Orthopedic Leisure Command Trousers",slot:"legs",def:2,cap:1,wis:1,baseRarity:"Rare",sprite:SPR_A_KHAKIPANTS,desc:"+2 DEF, +1 slot, +1 WIS. The brace goes over the sweatpants. Medically inadvisable. Spiritually correct."},desc:"Knee Brace + Elastic-Waist Sweatpants."},
 {a:"steelboot",b:"steeltoe",out:{kind:"armor",id:"reunited_boots",name:"The Reunited Pair",slot:"feet",def:3,atk:2,baseRarity:"Epic",sprite:SPR_A_STEELBOOTS,desc:"+3 DEF, +2 ATK. The single boot has found its family. Somewhere in the garage, a shelf grieves. The set is complete. Nothing else in his life is."},desc:"Steel-Toe Boots + The Single One. It was in the garage. It was always in the garage."},
 {a:"utility_belt",b:"pt_measure",out:{kind:"armor",id:"prep_belt",name:"The Belt of Infinite Preparedness",slot:"arms",cap:3,per:2,baseRarity:"Rare",sprite:SPR_A_TAPEMEASURE,desc:"+3 slots, +2 PER. Every clip occupied. Every scenario considered. Sits below the waistline at an angle physics has agreed not to discuss."},desc:"Utility Belt + Tape Measure (Belt Clip)."},
 {a:"windbreaker",b:"beanie",out:{kind:"armor",id:"thermo_hood",name:"The 64-Degree Doctrine Hood",slot:"head",def:2,wis:1,per:1,baseRarity:"Rare",sprite:SPR_A_HARDHAT,desc:"+2 DEF, +1 WIS, +1 PER. A beanie reinforced with windbreaker lining. The thermostat stays at 64. This is the compromise. He is thriving. Ask him."},desc:"Windbreaker + Winter Beanie. The thermostat is non-negotiable."}
];

/* ===== PRO TIPS (permanent upgrades) ===== */
const PROTIPS=[
 {id:"measure_twice",name:"Pro Tip: Measure Twice",perm:{per:1},desc:"+1 Perception, permanently. You'll actually remember this one."},
 {id:"lift_legs",name:"Pro Tip: Lift With Your Legs",perm:{maxhp:6},desc:"+6 max HP, permanently."},
 {id:"count_ten",name:"Pro Tip: Count To Ten",perm:{maxmoxie:3},desc:"+3 max Patience, permanently."},
 {id:"stay_hydrated",name:"Pro Tip: Stay Hydrated",perm:{hydraslow:1},desc:"You get thirsty more slowly. Forever."},
 // ── NIGHTLY ADDITIONS (2026-06-21) N6 ──
 {id:"warm_up",name:"Pro Tip: Always Stretch First",perm:{maxhp:5,str:1},desc:"+5 max HP and +1 ATK, permanently. He does not stretch. But he tells you to, firmly."},
 {id:"read_room",name:"Pro Tip: Read The Room",perm:{per:1},desc:"+1 Perception, permanently. A skill he advises constantly and demonstrates never."},
 {id:"firm_handshake",name:"Pro Tip: Firm Handshake",perm:{str:1},desc:"+1 ATK, permanently. Eye contact included at no additional charge."},
 {id:"pace_yourself",name:"Pro Tip: Pace Yourself",perm:{maxmoxie:2,hydraslow:1},desc:"+2 max Patience and slower thirst, permanently. The marathon, not the sprint. He says this from a couch."},
];

/* ===== TALENTS (N10) — pick 1 of 3 on level-up. eff keys applied in applyTalent(). ===== */
const TALENTS=[
 {id:"dad_strength",name:"Dad Strength",eff:{str:2},desc:"+2 ATK. Decades of stuck jar lids have prepared him for open warfare."},
 {id:"thick_skin",name:"Thick Skin",eff:{def:2},desc:"+2 DEF. Unsolicited feedback now bounces off entirely. He didn't even flinch."},
 {id:"fine_print",name:"Reads the Fine Print",eff:{per:2},desc:"+2 Perception. The warranty, the trap, the suspicious wall — nothing escapes the reading glasses."},
 {id:"grandpa_wisdom",name:"Back-In-My-Day Wisdom",eff:{wis:2},desc:"+2 WIS. The stories were load-bearing the whole time."},
 {id:"second_wind",name:"Second Wind",eff:{maxhp:14},desc:"+14 max HP, fully topped off. He found another gear. It was in the garage, behind the gear."},
 {id:"deep_breaths",name:"Deep Cleansing Breaths",eff:{maxmoxie:4},desc:"+4 max Patience. Four counts in, four counts out. It is not working. It is almost certainly working."},
 {id:"suspicious_knees",name:"Suspiciously Good Knees",eff:{kneeMul:0.5},desc:"Knee pain chance halved. The knees have no explanation. He has stopped asking. Some gifts you simply accept."},
 {id:"lifts_legs",name:"Lifts With the Legs",eff:{backMul:0.5},desc:"Back pain chance halved. He heard this advice at 22 and ignored it for decades. It is, regrettably, correct."},
 {id:"camel_mode",name:"Camel Mode",eff:{hydraSlow:0.3,hydraCap:40},desc:"Thirst fills more slowly and the threshold is higher. Years of forgetting water bottles have forged this man into something the desert would respect."},
 {id:"snack_logistics",name:"Snack Logistics",eff:{hungerCap:50,foodLuck:0.10},desc:"Hunger fills more slowly; food finds you more often. The cargo shorts were load-bearing the whole time. There was a system. There has always been a system."},
 {id:"note_from_kid",name:"Note From Your Kid",eff:{maxhp:8,maxmoxie:4,lightStep:true},desc:"+8 max HP, +4 max Patience. You step lighter through the dungeon. The note was in his back pocket since Tuesday. He does not cry. He does not."}
];

/* ===== DIFFICULTY MODES (N13) ===== */
/* hpMul/atkMul applied to non-boss enemies; cntMul scales spawn count. Bosses are exempt — they are already a lot. */
const DIFFICULTY_MODES=[
 {id:"lawn_chair",    name:"Lawn Chair",     blurb:"The suburbs at their most cooperative. Enemies are forgiving. The HOA still isn't.",  flavor:"You brought a folding chair and a cooler. The adventure will pace itself. The back pain will not.",        hpMul:0.75,atkMul:0.80,cntMul:0.75},
 {id:"weekend_warrior",name:"Weekend Warrior",blurb:"Standard suburban adventure. Two days off. One objective. No excuses.",              flavor:"The descent is what it is. The neighbors are what they are. Everything is fine. It is fine.",              hpMul:1.00,atkMul:1.00,cntMul:1.00},
 {id:"hoa_approved",  name:"HOA Approved",   blurb:"The neighbors are watching. They have concerns. They have filed those concerns in triplicate.", flavor:"A certified letter arrived this morning. It was about you. The descent will be less forgiving than the letter.", hpMul:1.25,atkMul:1.20,cntMul:1.25},
 {id:"dad_mode",      name:"Dad Mode",       blurb:"Everything is a test. The HOA voted unanimously. You are the problem.",              flavor:"The remote controls everything. Everything controls you. The thermostat laughs. Quietly. Smugly.",           hpMul:1.60,atkMul:1.40,cntMul:1.50}
];

/* ===== FLOORBLURBS — per-floor narrative blurb shown on descend (tone: LEVEL_DESIGN.md) ===== */
const FLOORBLURBS={
 1:"The campaign begins with coffee and rising dread. The Remote is gone. The house is warming up.",
 2:"The hallway: every item left by every family member who is not home. The correct jacket is under all of it.",
 3:"Dad opened the door to the garage. He now deeply regrets opening the door to the garage.",
 4:"The garage depths. The emergency release cord is seventeen feet away. It might as well be in another country.",
 5:"The car is free. But the house must be secured first. This will take five minutes. It will not take five minutes.",
 6:"Dad is upstairs. He came up here for something. The reason has been lost to the stairs.",
 7:"The attic contains the answer to a question nobody remembers asking.",
 8:"The master bedroom. Everything Dad needs is in this room. None of it is where it should be.",
 9:"The car is out, the journey could begin. The neighbor has emerged.",
 10:"It was never just a room. It was a final exam. The Garage has awakened.",
 11:"The hardware store parking lot. There are no spots. There are never spots. Dad will find one.",
 12:"The cart return zone. The carts are not where they should be. One has escaped.",
 13:"The contractors have established dominion over the north lot. Their morning is going better than Dad's.",
 14:"The entrance gauntlet: a seasonal display, a donation bin, a flyer man, and a former coworker.",
 15:"The lumber aisle. Dad needs screws. The screws are near the lumber. The lumber is everywhere.",
 16:"The fastener aisle. There are 847 types of screw. Dad needs one. The system requires a degree.",
 17:"Appliance parts. The dryer needs a part. The aisle assumes Dad knows his model number.",
 18:"The tool display. Dad has all the tools. Dad is now holding a drill that feels different from his drill.",
 19:"Self-checkout. Dad has found the part. Now he must survive the purchase.",
 20:"He appeared from nowhere. He knows where everything is. The Floor Manager will upsell Dad into a better version.",
 21:"The park entrance. Parking is worse than the hardware store. The 5K is finishing. Dad is in the chute.",
 22:"The cleats were left 'by the goalpost.' There are twelve goalposts.",
 23:"The equipment shed: lost items, broken nets, a lost-and-found nobody has checked since March.",
 24:"The dog show has taken over Field 5. Dad must cross it.",
 25:"The farmers market. Dad does not need anything here. He will spend forty-seven dollars.",
 26:"The produce section. The tomatoes are the same tomatoes as the grocery store. They cost more. Dad buys six.",
 27:"The craft vendor corridor. Dad has no interest in any of it. Dad is now holding a wind chime.",
 28:"The food truck gauntlet. Dad is hungry. Two trucks have forty-minute waits. The rest he does not understand.",
 29:"The birthday party for a child named Brayden or Cayden or possibly Hayden has escaped its zone.",
 30:"She has been here since 5 AM. She has a radio, a floor plan, and opinions about Dad's parking.",
 31:"Vastco. Dad cannot find his membership card. This is not a store you enter on goodwill.",
 32:"The parking lot perimeter. No spots near the entrance. Dad will park far and walk. This is fine. Relatively.",
 33:"The Vastco cart is not a cart. It is a commercial vehicle. It handles like a barge.",
 34:"The sample corridor. Movement drops to thirty percent. The cheese is very good.",
 35:"Paper goods. Enough paper towels to last until the kids graduate college. This is the rational choice.",
 36:"The food section. The rotisserie chicken. Also the giant muffins. These were not on the list.",
 37:"Electronics. Dad does not need electronics. Dad is now standing in front of a 75-inch television.",
 38:"Clothing. Dad's fleece is fine. Dad now has two new fleeces.",
 39:"The checkout line. Six lanes, fourteen carts each. Self-checkout is fifteen items. Dad has thirty-one.",
 40:"She controls the desk, the returns, and the renewals. The Membership Desk Guardian controls Dad.",
 41:"The soccer complex. Twenty-four fields. The bracket is in font size 8. The QR code is in the group chat.",
 42:"Dad was told his son is on Field 7B. Fields 1 through 6 are visible. Field 7 is conceptual.",
 43:"The snack stand is a beacon. The prices are audacious. Dad buys everything.",
 44:"The team is here. Dad's son needs his shin guards. The shin guards are in the car. The car is now far away.",
 45:"The sideline claim. The good spots are taken. The good-spot parents have been here since 10 AM.",
 46:"Dad has opinions. Dad is expressing opinions. The coach can hear Dad.",
 47:"Halftime is eight minutes. Dad must secure orange slices, water, and which quarter it actually is.",
 48:"The sports dad convention. Their own civilization, their own language, their own opinions about refs.",
 49:"The referee has made a call. The referee was correct. Dad does not know this.",
 50:"She has been here since 6 AM. She controls the bracket, the fields, and Dad's afternoon.",
 51:"Jefferson Middle School. On a Saturday. The school is not supposed to be open. The school is open.",
 52:"The main hallway. The lockers are the same. Something is fundamentally different and Dad cannot name it.",
 53:"The gymnasium: a team meeting, a cheer practice, a robotics demo, and a fog machine that should not be here.",
 54:"The locker room corridor. Dad is not supposed to be here. Dad is here. It smells like 1987.",
 55:"The east wing. Dad took a wrong turn. There are signs for the PTA meeting. He does not process this in time.",
 56:"The PTA meeting. It is about the spring fundraiser. Dad is nodding. Dad is learning.",
 57:"Dad is now helping plan the spring fundraiser. This was not the plan.",
 58:"The principal has stopped by to thank everyone. The principal also has a few items for the agenda.",
 59:"Dad's son is done. Dad must exit the PTA meeting. There is, however, one more thing.",
 60:"She knows every parent's name, their kids' names, and what they said they'd do last year and didn't.",
 61:"The family restaurant lot. Same physics as the hardware store. Different clientele. Same chaos.",
 62:"The host stand has a list. The wait is forty-five minutes. The host says it could be sooner. The host is optimistic.",
 63:"The lobby has three chairs and seventeen people. The TVs are playing sports. Not the right sport.",
 64:"The buzzer activates at twenty-seven minutes. Ahead of schedule. Dad is suspicious.",
 65:"The menu negotiation. Nine burgers. Dad's son cannot choose among nine burgers.",
 66:"The order relay. Everyone is ready except the person who just decided to change their order.",
 67:"Food arrives in the wrong sequence. Half is here. Half is 'coming right out.'",
 68:"The food is finished. Dad would like the check. The check has not arrived. The server is nowhere.",
 69:"The check has arrived. Something on it is wrong.",
 70:"Dad is trying to leave. The lobby is now standing-room-only. The Hostess controls all movement.",
 71:"IDKEA. Nobody arrives on purpose. Everyone arrives eventually. The escalator takes carts. This is a warning.",
 72:"The living room showroom. Dad is sitting on a sectional. The sectional is very comfortable.",
 73:"The bedroom section. The pillows are four dollars each. Dad now has four pillows in the cart.",
 74:"The kitchen section. Dad's kitchen could look like this. It would require replacing the entire kitchen.",
 75:"The children's section. Dad's kids are grown. Dad is looking at a small tent.",
 76:"The self-serve warehouse. The air is different here. Time moves differently. Row 14 is between Row 12 and Row 17.",
 77:"Flat pack retrieval. The shelf weighs more than Dad expected. The cart steers worse than the Vastco barge.",
 78:"The meatball cafe is mandatory. It is not technically mandatory. It is mandatory.",
 79:"Checkout. The flat pack does not fit on the conveyor. Dad must hand-key the barcode. There are seven barcodes.",
 80:"The shelf is home. The instructions are fourteen pages. Page 8 cannot be interpreted by existing technology.",
 81:"Dad's car is back in the driveway. A citation notice is on the mailbox. It is about the length of the grass.",
 82:"A child has built a lemonade stand in front of Dad's driveway. Dad has no cash. This requires diplomacy.",
 83:"The HOA event has let out. Every attendee is driving through the neighborhood at once. None of them yield.",
 84:"The neighbor across the street is waving. This is friendly. This will take twenty-five minutes.",
 85:"The cul-de-sac. The center of the neighborhood universe. Dad circles it slowly, assessing.",
 86:"The backyard. The sprinkler ran. Or it didn't. The Remote controls the sprinkler. Dad does not have the Remote.",
 87:"Three violation notices in the neighborhood today. Dad has one. The solidarity discussion has begun.",
 88:"Dad walks the dog. The dog walks Dad. The dog has an agenda.",
 89:"Dad is preparing the final run to the Community Center. The neighbor has noticed he is going somewhere.",
 90:"He is watering his already-perfect lawn at 8:20 PM on a Saturday, because he saw Dad's car in the driveway.",
 91:"The Community Center lot. The meeting ended two hours ago. The HOA President does not leave when it ends.",
 92:"The lobby: a bulletin board, the by-laws laminated to fourteen pages, and a sign-in sheet.",
 93:"The multipurpose room smells like coffee made at 6 PM. The screen still shows Slide 7 of Community Values.",
 94:"The kitchen was cleaned with the thoroughness of someone who cleans when frustrated. They are still here.",
 95:"The records hallway. A portrait of the President hangs here. The HOA budget paid for it.",
 96:"The records room: every violation and grudge since 1987, organized with frightening precision.",
 97:"The board room is empty. The Remote is not here. The agenda is partially erased.",
 98:"The President has a private office. A nameplate, a file cabinet, a small refrigerator with a labeled lunch.",
 99:"Full circle. The lobby. Karen Blackwell is here. The Remote is clipped to her clipboard.",
100:"Karen Blackwell. President since 2019. Unopposed. She has the Remote, the citation, and a binder."
};


/* ===== N20: THE HOA FINALE — multi-phase final boss, floor 100 =====
   Karen Blackwell. President since 2019. Unopposed.
   Phase transitions are HP-driven, applied by hoaFinaleTick() in game.js. */
const HOA_PHASES=[
 {at:1.00,name:"The Welcome",
  lines:["PHASE 1 — THE WELCOME. Karen Blackwell greets you warmly and asks you to sit. The sitting is not optional. The chairs are the hard folding kind.",
   "REGULATORY OVERVIEW: she recites relevant HOA code sections from memory. It cannot be interrupted. It has never been interrupted."]},
 {at:0.66,name:"The Citation",atkBonus:4,patienceCost:2,
  lines:["PHASE 2 — THE CITATION. She produces your file. It is thick. The 2022 holiday-light duration violation is in there. February 4th is in there. The trash can incident of 2020 is in there.",
   "DOCUMENTED HISTORY: each citation is read aloud. -2 Patience. There are more citations."]},
 {at:0.33,name:"Per My Previous Email",atkBonus:4,patienceZero:true,
  lines:["PHASE 3 — 'PER MY PREVIOUS EMAIL.' She produces a printed email chain. It began in 2021. It has timestamps. It has read receipts. You received these emails. You did not read these emails.",
   "Unavoidable psychic damage. Your Patience drops to 0. She has been right, procedurally, about everything."]}
];
/* Class-specific resolutions, logged when the HOA President falls (LEVEL_DESIGN.md, Floor 100).
   No victory is complete: each one comes with a new obligation. */
const HOA_RESOLUTIONS={
 grill:["THE NEGOTIATION. Karen has needed a grill master for the Annual Community Picnic for three consecutive summers. The last volunteer burned the hot dogs. The summer before that, there were no hot dogs. You offer competence. This is leverage.",
  "The Remote is returned. You are now the HOA's Official Community Grill Master. This is a victory. It is also a binding commitment. The picnic is in six weeks."],
 diy:["THE NEGOTIATION. You hear it before she can open the binder: the east-hallway faucet, dripping since March. The vendor quoted $340. You say you can fix it. You believe this completely.",
  "The Remote is returned. You are added to the community maintenance contact list. You will receive calls."],
 tech:["THE NEGOTIATION. You produce the archive: every HOA email since 2021, tagged and searchable. By-laws Section 11, Paragraph 4b requires Form HC-7 for confiscated property, with a witness signature. She checks the filing cabinet. There is no HC-7.",
  "The confiscation is procedurally void. The Remote is returned with visible frustration. She makes a note to update the policy. Winning on pure documentation is deeply satisfying in a way nobody else will ever understand."],
 gym:["THE NEGOTIATION. You mention your evening protein shake — not as a tactic, but because it is true and you are thinking about it. She asks what kind. You explain whey versus casein. You explain the anabolic window. She takes a sip of the BCAAs. She asks what BCAAs are. You explain.",
  "The Remote is returned during a conversational pause. You have agreed to teach a Saturday morning class called 'Dad Fit.' She has already blocked the time. You do not know that you charmed her. You will never know."],
 tactical:["THE NEGOTIATION. Dad Scan registered it on entry: the AV policy (east wall, last updated 2019), Section 11 open on her desk, and no Property Confiscation Form anywhere in the visible filing system. You prepared for this on the drive over. Possibly years ago.",
  "No form. No witness. No chain of custody. She releases the Remote and makes a note. Part of the note is about whether you should be on the board. She does not act on that part. Not yet."],
 sports:["THE NEGOTIATION. You activate Back In My Day — reflexively. Block parties. Fence disputes settled with a handshake and a casserole. The story grows more impressive with each sentence, as the passive dictates. Somewhere in it is her own childhood. She does not say this.",
  "Her expression changes by approximately 4%. The Remote is returned with a comment about 'community spirit.' You do not understand what happened. It worked."],
 yard:["THE NEGOTIATION. The citation was measured on a Thursday. It rained Tuesday and Wednesday. Your weather log holds 30 days of rainfall data. Your satellite imagery has been ready since 2023. You have been waiting for a reason. The grass was compliant, adjusted for the 48-hour precipitation window.",
  "The data is correct. The citation is downgraded to a courtesy notice. The measurement protocol now includes a precipitation variance clause. Your lawn has been vindicated by satellite. This is a good feeling."],
 default:["THE NEGOTIATION. She is not unreasonable. She has had long Saturdays too. Agree to mow the lawn by next Saturday — a condition you would have agreed to anyway — and it is over.",
  "The Remote is returned. 'Same time next month,' she calls after you. 'Board meeting's the third Thursday.'"]
};


/* ===== biome transition story clips (N21) =====
   Shown ONCE per run, the first time the dad reaches each biome. A short class-flavored
   tag line (why THIS dad presses on) precedes a biome intro (why he descends here).
   Reuses the mouse-dismissable option-menu modal via showBiomeClip() in game.js.
   Keys MUST match keyBiomeFor(): House, Lowe & Behold, Park, Vastco, Soccer Complex,
   School, Family Restaurant, IDKEA, Neighborhood, HOA. NOT part of tools_export_data.js. */
const CLASS_CLIP_TAGS={
 grill:"The Grillmaster tightens his apron. Wherever there is a thermostat, there is, by extension, a grill that will need defending.",
 diy:"Mr. Fix-It cracks his knuckles. Every problem down here is, at its heart, a problem he can make significantly worse with the correct power tool.",
 tech:"The Tech Dad confirms his phone is at 100%. It is at 34%. He proceeds anyway, silently narrating the whole ordeal as a podcast no one will hear.",
 gym:"The Gym Dad has decided the entire dungeon is leg day. The dungeon was not consulted and would have objected.",
 tactical:"The Tactical Dad has a plan. The plan has contingencies. The contingencies have contingencies. He has packed for all of them and can lift roughly none of it.",
 sports:"The Sports Dad claps twice, hard, at no one. 'Alright. ALRIGHT. Let's GO.' There is no team. There has never been a team. He claps again.",
 yard:"The Yard Dad studies the ground with professional disappointment. Even a hundred floors down, he notes, the edging could be crisper."
};
/* MOB-18 (2026-11-09 KBP "just each biome"): every STORY_CLIPS entry has an objective (shown under its intro), and floor 1 gets
   its own objective card after the House clip, separate from the class backstory shown when you choose your Dad. */
const FLOOR1_OBJECTIVE={title:"FLOOR 1 &middot; TODAY'S OBJECTIVE",text:"Find the basement stairs before anyone notices he is up and asks him to do something. Eat nothing from the back of the fridge. Do not open the family group text.",note:"On the fridge, in crayon: \"GOOD LUK DAD. YOU ARE THE BEST AT FINDING STUF.\" He folds it into his wallet."};
/* M16: encouragement notes from the kids ("Fridge Drawing" floor pickups, game.js _placeFridgeNote). pic = what the crayon drawing shows. */
const FRIDGE_NOTES=[
 {pic:"a stick-figure Dad, three times the size of the house, holding a spatula like a sword.",text:"You are the strongest dad. Even stronger than the lawnmower.",from:"the kids"},
 {pic:"a man in cargo shorts standing on a mountain of mulch. A sun with sunglasses gives a thumbs up.",text:"Thank you for fixing my bike. It is the fastest bike now. I love you.",from:"your youngest"},
 {pic:"the family car, every window full of faces, one of them clearly asleep.",text:"Best road trip ever. Even the part where we got lost. ESPECIALLY that part.",from:"the kids"},
 {pic:"a grill emitting a heroic column of smoke. Underneath, in careful capitals: DAD.",text:"You make the best burgers in the whole world and maybe space.",from:"the middle one"},
 {pic:"a soccer field. On the sideline, one very large figure is labeled LOUDEST.",text:"Thanks for coming to every game. I can always hear you. Every. Single. Time.",from:"your goalie"},
 {pic:"a dad asleep in a recliner, with ZZZ drawn so large it leaves the page.",text:"You work really hard. You are allowed to nap. We will guard the remote.",from:"the kids"},
 {pic:"a lightbulb, a ladder, and a man on the ladder who has visibly forgotten why.",text:"You can fix anything. You told us so. We believe you.",from:"the twins"},
 {pic:"a dad and a kid holding hands. The dad is drawn wearing a cape.",text:"Thank you for teaching me to ride without training wheels. You let go at the right time.",from:"your oldest"},
 {pic:"a thermostat with an angry face. A small heart is drawn next to Dad.",text:"We will not touch the thermostat. Probably. We love you anyway.",from:"the kids"},
 {pic:"a hardware store the size of a city, and a tiny dad inside, smiling.",text:"Thanks for taking me with you. I like the aisle with the bolts best too.",from:"your helper"},
 {pic:"a pancake stack taller than the refrigerator, crowned with a single blueberry.",text:"Saturday pancakes are the best part of the week. You are the second best part. Kidding. You are the first.",from:"the kids"},
 {pic:"a backyard tent under a sky with forty-one stars, each one numbered.",text:"Camping in the yard counts. It was the best trip ever.",from:"both of us"},
 {pic:"a dad lifting a car over his head. The car is labeled MOM'S CAR.",text:"You are a good dad. Mom said so too. She meant it.",from:"the kids"},
 {pic:"a portrait of Dad. It has seven fingers on one hand and is clearly drawn with love.",text:"Whatever is down there, you can do it. Come home for dinner.",from:"everyone"}
];
const STORY_CLIPS={
 "House":{title:"FLOORS 1-10 &middot; THE HOUSE",intro:"It began, as these things do, with the Remote of Ultimate Authority going missing and the thermostat locking at 81 degrees. The basement stairs are longer than he remembers. They keep going. He descends, because a man does not simply live at 81 degrees.",objective:"Reach the basement stairs on every floor, get past whatever has been living in the Garage since 2019 (Floor 10), and pick up the Remote's trail. The thermostat is not to be touched. He will touch the thermostat."},
 "Lowe & Behold":{title:"FLOORS 11-20 &middot; LOWE &amp; BEHOLD",intro:"The house, it turns out, was only the foyer. Beneath it sprawls Lowe &amp; Behold, the great hardware labyrinth, where he once came for a single washer and left, four hours later, the owner of a table saw. The Remote's trail runs straight through the plumbing aisle. Naturally.",objective:"Cross ten floors of aisles without once being asked if he needs help, and get past the Floor Manager on Floor 20. He needs one washer. He knows exactly which one. He does not."},
 "Park":{title:"FLOORS 21-30 &middot; THE PARK",intro:"Past the hardware store the concrete yields to mulch and the deceptive wholesomeness of The Park. The geese are watching him. The geese have always been watching him. Somewhere beyond the splash pad the Remote waits, and so, patiently, do the geese.",objective:"Outlast the geese, the splash pad and the Tournament Director on Floor 30. Drink water. Every fountain out here has an opinion about pressure, and every opinion is low."},
 "Vastco":{title:"FLOORS 31-40 &middot; VASTCO",intro:"The descent opens into Vastco, warehouse of infinite aisle and finite parking, where everything is sold in quantities intended for a fallout shelter. He is here only for the Remote, he tells himself. He will leave with a forty-pound tub of pretzels he has no memory of choosing.",objective:"Find the way through the Black Friday Formation on Floor 40 while carrying no more than he can lift. He will lift more than he can carry. He will carry it anyway."},
 "Soccer Complex":{title:"FLOORS 41-50 &middot; THE SOCCER COMPLEX",intro:"Next, the Soccer Complex: six fields, zero shade, and a travel-sports bureaucracy that has outlasted several governments. The Remote is on Field 4, which appears on no map and is, per rumor, reachable only during the 8 a.m. bracket.",objective:"Reach Field 4 and the Referee's Final Whistle on Floor 50. Bring a folding chair, sunscreen, and the inner peace required to be corrected by a stranger's grandmother."},
 "School":{title:"FLOORS 51-60 &middot; THE SCHOOL",intro:"He arrives at The School, where it is somehow still drop-off and has been drop-off for what feels like a geologic age. The halls smell of floor wax and low-grade panic. The Remote is in the Lost &amp; Found, guarded by a single laminated sign.",objective:"Get down the hallways to the PTA President on Floor 60 without volunteering for anything. He will volunteer for three things, one of them a bake sale."},
 "Family Restaurant":{title:"FLOORS 61-70 &middot; THE FAMILY RESTAURANT",intro:"The stairs deliver him to The Family Restaurant. The wait is forty-five minutes. It has been forty-five minutes for as long as anyone can remember. Past the bottomless bread basket and the eternally buzzing pager, the Remote sits at a booth that will not be ready shortly.",objective:"Be seated. Survive the Birthday Party, in Full Deployment, on Floor 70. Do not fill up on bread. He fills up on bread."},
 "IDKEA":{title:"FLOORS 71-80 &middot; IDKEA",intro:"Then IDKEA, ancient labyrinth of flat-pack and enforced one-way traffic. The map helps no one. The meatballs are a trap and also excellent. The Remote is in Aisle 12, Bin 34, which he will locate at approximately the same instant his marriage is tested.",objective:"Follow the arrows to the Assembly Instructions, Final Form, on Floor 80. Every piece is accounted for. One piece is not. It is always the one holding everything together."},
 "Neighborhood":{title:"FLOORS 81-90 &middot; THE NEIGHBORHOOD",intro:"He surfaces into The Neighborhood, where every window holds an opinion about his gutters and every driveway is a small diplomatic incident. The Remote changed hands at a block party to which he was not, technically, invited. He strides in like he owns the cul-de-sac. He does not.",objective:"Walk the cul-de-sac to the Neighborhood Watch Captain on Floor 90, and keep the edging crisp along the way. Every window is watching. Wave anyway."},
 "HOA":{title:"FLOORS 91-100 &middot; THE HOA DOMINION",intro:"At last, the HOA Dominion: the final descent, where the bylaws are load-bearing and the President rules by laminated decree. The Remote of Ultimate Authority rests atop a throne of unapproved-paint-color complaints. He has brought documentation. It will not be enough. It never is.",objective:"Reach the HOA President on Floor 100, present the documentation, and take back the Remote of Ultimate Authority. Then, somehow, go home."}
};
