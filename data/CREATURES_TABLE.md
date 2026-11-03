# SHATTERED DAD ADVENTURE — CREATURES REFERENCE TABLE

Version: v0.11.0 | Updated: 2026-07-04 | 100-floor structure

---

## How Spawn Chance Works

Creatures are selected **uniformly at random** from the pool matching the current floor's biome (`pickCreature()` in `js/game.js`). Spawn chance = 1 ÷ (creatures in biome pool).

Enemy count per floor: `3 + floor(depth × 0.7) + random(0–2)`

Bosses spawn at every floor that is a multiple of 10. Regular creatures still populate the floor.

---

## Regular Creatures

### The House — Floors 1–10

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| Morning Obligation | 11.1% (1 of 9) | 8 | 2 | 0 | 4 | 1 | Slow. Persistent. Cannot be reasoned with before coffee. |
| The Unread Text | 11.1% (1 of 9) | 4 | 3 | 0 | 3 | 0 | Spawns in groups. Multiplies if ignored. Each one insists it is "just a quick question." |
| Rogue Roomba | 11.1% (1 of 9) | 10 | 3 | 1 | 6 | 2 | Charts a path known only to itself. Has eaten a sock, a phone charger, and the family's sense of security. |
| The Laundry Pile | 11.1% (1 of 9) | 12 | 3 | 1 | 7 | 1 | Has been on the chair since before the current presidency. It is waiting for the right moment. |
| The Permission Slip | 11.1% (1 of 9) | 6 | 4 | 0 | 5 | 0 | Due last Tuesday. It has found you. |
| The Thermostat Phantom | 11.1% (1 of 9) | 14 | 4 | 2 | 9 | 2 | Nobody touched it. Nobody ever touches it. The Phantom is always right. You are always wrong. |
| The Mystery Leftovers | 11.1% (1 of 9) | 18 | 5 | 1 | 12 | 3 | Sealed in a container dated November. Which November is unclear. Do not open it. |
| The Overflowing Diaper of Stench | 11.1% (1 of 9) | 10 | 4 | 0 | 6 | 1 | The ancient enemy. Biological warfare at its purest. Origin: known. Composition: also known. Neither is acceptable. |
| The Unknown Brown Substance | 11.1% (1 of 9) | 6 | 3 | 2 | 5 | 0 | Origin: unknown. Composition: under investigation. The DEF of 2 is because nobody gets close enough to hit it properly. |

*Pool size: 9 — added overflowing_diaper and unknown_substance (2026-06-17)*

---

### Lowe & Behold — Floors 11–20

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| Shopping Cart Ambush | 16.7% (1 of 6) | 14 | 4 | 1 | 8 | 3 | One wheel possessed. Always contains one item nobody placed there. |
| Weekend Warrior | 16.7% (1 of 6) | 16 | 5 | 2 | 10 | 4 | Owns every tool. Has used three. Lumbar Injury III imminent. |
| Self-Checkout Sentinel | 16.7% (1 of 6) | 13 | 4 | 2 | 9 | 3 | "Unexpected item in bagging area." There is no item. There has never been an item. |
| The Unfindable Associate | 16.7% (1 of 6) | 11 | 5 | 1 | 9 | 2 | Always two aisles over. Materializes behind you to ask if you're finding everything okay. You were not. |
| Paint Swatch Swarm | 16.7% (1 of 6) | 6 | 3 | 0 | 5 | 1 | Two hundred shades of off-white. Your spouse will reject all and choose your first suggestion. |
| Aisle 12 Forklift | 16.7% (1 of 6) | 18 | 5 | 3 | 12 | 5 | The pallet it carries contains the thing you came for, marked DO NOT SELL — DISPLAY ONLY. |

*Pool size: 6 (3 stub slots reserved for nightly builds)*

---

### The Park — Floors 21–30

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| The Youth Soccer Coach | 16.7% (1 of 6) | 20 | 6 | 1 | 14 | 3 | Coaching the U8 team for nine seasons. Has never played soccer. Has absolute opinions about positioning. |
| The Off-Leash Dog | 16.7% (1 of 6) | 10 | 5 | 0 | 8 | 1 | Friendly. So friendly. Cannot be redirected. Targets the cleanest clothes. |
| The Jogger (Headphones In) | 16.7% (1 of 6) | 14 | 4 | 0 | 10 | 2 | Cannot hear you. Will not hear you. The collision is simply a consequence of the headphones. |
| The Event Coordinator | 16.7% (1 of 6) | 16 | 5 | 2 | 12 | 5 | The 5K finisher chute is closing. Her vest has seventeen pockets. You are in the wrong place. Always. |
| The Youth Soccer Swarm | 16.7% (1 of 6) | 12 | 5 | 0 | 11 | 4 | Seven-year-olds traveling at full speed in a formation known to physics as "all of them, at the ball, at once." The ball is incidental. Your shins are not. **Special:** pack spawner. |
| The Birthday Party | 16.7% (1 of 6) | 20 | 4 | 2 | 13 | 5 | It has claimed the main pavilion and is expanding. Balloon perimeter. Cake logistics. A bounce house with a line. Somewhere at its center, a five-year-old rules absolutely. |

*Pool size: 6 — added youth_soccer_swarm and birthday_party (N19, 2026-07-03)*

---

### Vastco — Floors 31–40

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| Extended Warranty Wraith | 16.7% (1 of 6) | 20 | 6 | 2 | 14 | 6 | Materializes at checkout. There is no correct answer. There has never been a correct answer. |
| Sale Sign Golem | 16.7% (1 of 6) | 26 | 7 | 4 | 18 | 8 | Constructed entirely of percentages. Each sign contradicts the one beside it. |
| The Sample Station | 16.7% (1 of 6) | 8 | 3 | 0 | 5 | 3 | You came in for paper towels. Statistics show the conversion rate is 100%. |
| The Vastco Flatbed | 16.7% (1 of 6) | 22 | 4 | 5 | 14 | 5 | Not a cart. A vehicle. Twelve feet long. Turn radius: approximately the parking lot. |
| The Membership Card Inspector | 16.7% (1 of 6) | 18 | 5 | 2 | 12 | 4 | Your card is expired. Your card has always been expired. The Inspector considers this your problem. |
| The Spirit of Bulk Savings | 16.7% (1 of 6) | 16 | 6 | 1 | 12 | 8 | The per-unit cost is always better in bulk. You will buy forty-eight of this. You will feel good until the move. |

*Pool size: 6 (3 stubs added this session)*

---

### Soccer Complex — Floors 41–50

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| The Sideline Parent | 16.7% (1 of 6) | 22 | 7 | 1 | 16 | 4 | Has been on the sideline since the U6 years. Has opinions about every substitution, every offside call, and every other parent's parenting. The clipboard is decorative. The volume is not. |
| The Trophy | 16.7% (1 of 6) | 30 | 6 | 4 | 18 | 12 | Has not moved from the display case since 1987. This season it escaped. The engraving reads PARTICIPANT. It does not find this funny. |
| The Waterboy | 16.7% (1 of 6) | 20 | 6 | 0 | 14 | 3 | Has a cooler, a ladle, and a sense of purpose that cannot be redirected. Does not care if you are not thirsty. The orange slices are non-negotiable. Inflicts SOAKED on contact. |
| The Chair Fortress | 16.7% (1 of 6) | 24 | 4 | 3 | 16 | 5 | A perimeter of folding chairs, canopies, and parents who arrived at 6:40 AM. It does not attack so much as it declines to acknowledge your right to exist here. |
| The Stats Dad | 16.7% (1 of 6) | 16 | 6 | 1 | 14 | 6 | Has tracked every touch, pass, and hustle metric for three seasons. His son is nine. The spreadsheet has conditional formatting. |
| The Snack Stand Line | 16.7% (1 of 6) | 20 | 5 | 2 | 15 | 8 | It has not moved in eleven minutes. The menu board shows no prices until you are too deep to retreat. Somewhere ahead, a child is ordering for a family of nine, one item at a time. |

*Pool size: 6 — added chair_fortress, stats_dad, snack_stand_line (N19, 2026-07-03)*

---

### The School — Floors 51–60

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| The Permission Form | 16.7% (1 of 6) | 8 | 8 | 0 | 12 | 0 | Due last Tuesday. Technically still valid in a legal grey area nobody wants to test. The parent signature line has been filled in with a scribble and a prayer. It has found you. It will always find you. |
| The Science Fair Project | 16.7% (1 of 6) | 28 | 8 | 2 | 20 | 5 | Built the night before. The hypothesis was generated at 11:47 PM. The data was collected at 11:52. The graph was drawn in marker. It has achieved consciousness. It is angry about the methodology. |
| The Car Pool Line | 16.7% (1 of 6) | 40 | 7 | 5 | 22 | 2 | Begins forming at 2:45 PM. Has never moved faster than 0.3 miles per hour. The child who needs picking up is in the building. You are in the line. These facts have nothing to do with each other. |
| The Fog Machine | 16.7% (1 of 6) | 14 | 6 | 1 | 15 | 5 | Nobody knows who authorized it. Nobody knows who owns it. It is running at full capacity in a middle-school gymnasium, and it has strong opinions about visibility. |
| The Trophy Case | 16.7% (1 of 6) | 26 | 5 | 4 | 18 | 7 | Regional. Division II. 1987. It pulls at a specific corner of a dad's memory and does not let go. Two full turns are lost to nostalgic review. Minimum. |
| The Welcoming Committee | 16.7% (1 of 6) | 18 | 8 | 1 | 17 | 6 | Two PTA moms who are DELIGHTED to see a dad at the meeting. Their delight is a weapon. There is a sign-up sheet, and it is already moving toward you. |

*Pool size: 6 — added fog_machine, trophy_case, welcoming_committee (N19, 2026-07-03)*

---

### The Family Restaurant — Floors 61–70

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| The Wait | 16.7% (1 of 6) | 35 | 9 | 3 | 20 | 0 | Not a delay. A being. The pager has not buzzed. The pager will never buzz. The name was called thirteen minutes ago while you were parking. The Wait has always been there. |
| The Children's Menu | 16.7% (1 of 6) | 18 | 8 | 0 | 16 | 0 | Twelve options. The child refuses all of them and orders plain pasta. Four noodles will be eaten. The crayons have been eaten. The puzzle on the back has been solved incorrectly and the child is proud of this. |
| The Check | 16.7% (1 of 6) | 30 | 10 | 2 | 22 | 20 | Nobody remembers what they ordered. Nobody has exact change. The gratuity has already been added. Split four ways, it comes out to a number that ends in a moral judgment. |
| The Buzzer | 16.7% (1 of 6) | 16 | 7 | 2 | 17 | 6 | Heavy. Ugly. Flashing red in a pattern that means either "table ready" or "low battery." It has been "about ten minutes" for forty-five minutes. |
| The Invisible Server | 16.7% (1 of 6) | 22 | 6 | 3 | 19 | 7 | Made eye contact once, said "I'll be right back," and entered a dimension unreachable by science. Water refills arrive only for other tables. |
| The Tip Calculation | 16.7% (1 of 6) | 28 | 8 | 2 | 21 | 10 | A number that must be produced under social observation, involving percentages, guilt, the quality of the service, and a pen that does not work. Dad math at its most public. |

*Pool size: 6 — added restaurant_buzzer, invisible_server, tip_calculation (N19, 2026-07-03)*

---

### IDKEA — Floors 71–80

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| The Assembly Instructions | 16.7% (1 of 6) | 25 | 10 | 1 | 20 | 5 | Step 17 makes no sense. Step 17 has never made sense. The English translation omits it entirely and picks up at Step 18 as though nothing happened. The Swedish original describes The Decisive Moment. You are in it. |
| The Missing Dowel | 16.7% (1 of 6) | 15 | 9 | 0 | 18 | 3 | Part 7 of 16. Not in the bag. Not on the floor. Not under the instructions. Not in the bag a second time, even though you checked. The entire structural integrity of the BILVAK bookcase depends on it. The bookcase knows this. |
| The IDKEA Employee | 16.7% (1 of 6) | 45 | 9 | 7 | 25 | 5 | Wearing the yellow vest. Is not sure what department this is. Will find someone who knows. Has been looking since 2019. The someone has not been found. The vest's DEF bonus is not a metaphor. |
| Jugs of Bedazzlement | 16.7% (1 of 6) | 30 | 8 | 3 | 19 | 5 | Display items from the seasonal home accents section. Large. Ornate. Absolutely covered in rhinestones. The label reads: "Tuscany Collection, Decorative Only." They have been placed at eye level. This was a deliberate choice by the merchandising team. |
| The Comfortable Sectional | 16.7% (1 of 6) | 30 | 6 | 5 | 23 | 8 | It is so, so comfortable. Sitting is easier than standing. The price seems reasonable until Dad does the math on "per seat," and by then he is already horizontal. |
| The Plush Animal Avalanche | 16.7% (1 of 6) | 20 | 8 | 1 | 21 | 7 | The display was never stable. One shark was load-bearing. It travels as a wave of soft, smiling casualties, and it knows your kid's birthday is coming up. **Special:** pack spawner. |

*Pool size: 6 — added comfortable_sectional, plush_avalanche (N19, 2026-07-03)*

---

### The Neighborhood — Floors 81–90

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| The Lawnmower (Peak Hours) | 16.7% (1 of 6) | 50 | 11 | 4 | 28 | 6 | Starts at 7:55 AM on Saturday. Quiet hours begin at 8:00 AM. The owner is aware of the ordinance. The owner has always been aware of the ordinance. The new mower is louder than the last one. This was intentional. |
| The Neighborhood Newsletter | 16.7% (1 of 6) | 22 | 10 | 0 | 20 | 2 | Published monthly. Seventeen passive-aggressive items, one recipe nobody asked for, and a lost cat that has been found for six months. The correction is pending editorial review. |
| The Nextdoor Post | 16.7% (1 of 6) | 35 | 12 | 2 | 24 | 3 | Begins: "Does anyone else notice..." By the time you reach the comments, forty-seven neighbors have responded. Three are correct. None are agreeable. The original poster has not returned. |
| The Dog Walker | 16.7% (1 of 6) | 26 | 8 | 1 | 18 | 4 | Phone in one hand. Bag in the other. Technically she has the bag. She is not going to use the bag. She is very aware of where the dog has been. She will not make eye contact. This is the social contract of the neighborhood. **Special:** leaves poop bomb traps (25% per move). |
| The Extended Wave | 16.7% (1 of 6) | 26 | 8 | 3 | 25 | 9 | Friendly. Immovable. A neighbor mid-wave who has entered conversational range and is now delivering a comprehensive update on every household in the subdivision. There is no known exit protocol. |
| The Persistent Entrepreneur | 16.7% (1 of 6) | 18 | 10 | 1 | 24 | 12 | Age eight. Lemonade, one dollar. Will not accept "no." Will not accept "later." Has change for a five and the negotiating posture of a closing attorney. |

*Pool size: 6 — added extended_wave, persistent_entrepreneur (N19, 2026-07-03)*

---

### The HOA Dominion — Floors 91–100

| Name | Spawn Chance | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|
| The Covenant | 16.7% (1 of 6) | 55 | 12 | 9 | 30 | 8 | Forty-seven pages. Signed in 2006. Section 12.4 prohibits what you have done. Section 12.4 has always prohibited what you have done. That owner is gone. The Covenant remains. |
| The Violation Notice | 16.7% (1 of 6) | 20 | 13 | 0 | 26 | 0 | Found on the door at 6:47 AM. Offense: grass length 4.2 inches. Allowable: 4.0 inches. The fine is $175. A photograph has been filed. The photograph is better composed than your family photos. |
| The Annual Meeting | 16.7% (1 of 6) | 60 | 11 | 6 | 32 | 10 | Scheduled since February. The agenda has twenty-three items. Item one has been tabled since 2018. There is no listed end time. There has never been a listed end time. The meeting does not end. The meeting transitions. |
| The Hall Monitor Volunteer | 16.7% (1 of 6) | 26 | 9 | 3 | 27 | 10 | Semi-official. Fully committed. Wears a lanyard that grants no authority and all of the confidence. Would like to know your business here, and whether you signed in. |
| The Motion-Sensor Light | 16.7% (1 of 6) | 20 | 11 | 2 | 28 | 8 | Activates aggressively for raccoons, wind, and moods. For you, it demands continuous, vigorous motion. Stand still to think and it plunges you into darkness, judgmentally. |
| The Lingering Board Member | 16.7% (1 of 6) | 34 | 9 | 5 | 32 | 14 | The meeting ended forty minutes ago. He is still here, mid-conversation, and he has just spotted a fresh audience. Agenda item: you, now. |

*Pool size: 6 — added hall_monitor, motion_sensor_light, lingering_board_member (N19, 2026-07-03)*

---

## Special Creature

| Name | Biome | Floors | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|---|
| Hungry Goldfish (Mrs. Kowalski's Rm. 14) | Water (aquatic) | Any water floor | 8 | 4 | 0 | 5 | 1 | Flushed in 2003. Rediscovered 2009. Flushed again. Found again 2014. Science submitted three papers. The fish did not respond to peer review. The fish is hungry. The fish has always been hungry. |

*Water floors are randomly assigned during run generation. The goldfish does not appear in the regular `pickCreature()` pool.*

---

## Bosses

Bosses spawn at every floor that is a multiple of 10. Regular creatures still populate the floor.

| Name | Floor | HP | ATK | DEF | XP | Gold | Lore |
|---|---|---|---|---|---|---|---|---|
| The Garage (As Entity) | 10 | 60 | 8 | 3 | — | — | Not entered fully since 2019. It has become a biome. Somewhere inside is the emergency release cord. Somewhere inside is everything you have ever lost. |
| The Floor Manager | 20 | 90 | 11 | 4 | — | — | Greets you the moment you look lost. "While we're back here..." Weakness: declaring intent before engagement. |
| The Tournament Director | 30 | 120 | 13 | 5 | 200 | 80 | Runs the brackets. Controls all six fields. Has denied your schedule conflict appeal. Denied your parking appeal. Denied your snack table location appeal. He hears only the bracket. |
| The Black Friday Formation | 40 | 150 | 15 | 6 | 250 | 100 | Not a creature. A collective. A thermodynamic event. It does not have a goal. It has momentum. The TV was the first casualty. |
| The Referee (Final Whistle) | 50 | 180 | 17 | 7 | 300 | 90 | Has already decided. The yellow card was issued before the game began. Immovable. The whistle sounds when it wants to. |
| The PTA President | 60 | 210 | 19 | 8 | 350 | 100 | Has the floor. Has had the floor since 2019. The agenda is laminated since October. You are on the agenda. |
| The Birthday Party (Full Deployment) | 70 | 240 | 21 | 9 | 400 | 80 | Twelve children. One table. No plan. The cake is the wrong cake. There is no correct cake. |
| The Assembly Instructions, Final Form | 80 | 270 | 23 | 10 | 450 | 80 | Step 17. The previous owner of this BILVAK also reached Step 17. He is not spoken of. Step 17 is a reckoning. |
| The Neighborhood Watch Captain | 90 | 300 | 25 | 11 | 500 | 90 | Has been watching. Has always been watching. The binder of documented incidents goes back to 2007. You are in the binder. |
| The HOA President *(FINAL BOSS)* | 100 | 350 | 28 | 12 | 600 | 200 | He wrote the covenants. He has been waiting since 2006 to enforce Section 47: No Heroes. The Remote of Ultimate Authority is behind him. It has always been behind him. |

> **Multi-phase finale (v0.11.0):** Karen Blackwell fights in phases. Phase 1 — The Welcome (base stats). Phase 2 — The Citation (≤66% HP: ATK 28→32, -2 Patience). Phase 3 — "Per My Previous Email" (≤33% HP: ATK 32→36, Patience reduced to 0, unavoidable). On defeat, the Negotiation resolves per class (all 7 classes have unique resolutions; see `data/hoa_finale.txt`). Descending past her without a fight triggers the default resolution: agree to mow the lawn by Saturday.

---

## Vendor Floors

Vendors appear at floors 5, 15, 25, 35, 45, 55, 65, 75, 85, 95.

| Floor | Vendor Name | Flavor |
|---|---|---|
| 5 | The Neighbor Who Happens to Have That | "Oh yeah, I got one of those." He has seventeen. |
| 15 | The Lowe & Behold Returns Desk | "Did you keep your receipt?" Of course you didn't. |
| 25 | The Park Concession Stand | Cash only. Square reader from 2013. Signal weak. Resolve not. |
| 35 | The Vastco Membership Kiosk | "Card, please." You flash a library card. He respects the hustle. |
| 45 | The Soccer Complex Snack Shack | Orange slices. An extraordinary number of Capri Suns. |
| 55 | The School Lost and Found | "If no one claims it by Friday, it's yours." It is Friday. |
| 65 | The Family Restaurant Manager | "I can't do that, but I can do this." A tray of bread appears. |
| 75 | The IDKEA As-Is Section | "No returns. No assembly instructions. No regrets." Lie. |
| 85 | The Neighborhood Garage Sale | Everything's a quarter. The thing you need is $40. |
| 95 | The HOA Emergency Dispensary | "Highly irregular." Everything inside is laminated. Some of it heals. |

---

## Biome Spawn Summary

| Biome | Floors | Creature Count | Spawn Chance per Creature |
|---|---|---|---|
| The House | 1–10 | 7 | 14.3% |
| Lowe & Behold | 11–20 | 6 | 16.7% |
| The Park | 21–30 | 4 | 25.0% — add here after new biomes filled |
| Vastco | 31–40 | 6 | 16.7% |
| Soccer Complex | 41–50 | 3 | 33.3% — PRIORITY for nightly builds |
| The School | 51–60 | 3 | 33.3% — PRIORITY for nightly builds |
| The Family Restaurant | 61–70 | 3 | 33.3% — PRIORITY for nightly builds |
| IDKEA | 71–80 | 3 | 33.3% — PRIORITY for nightly builds |
| The Neighborhood | 81–90 | 3 | 33.3% — PRIORITY for nightly builds |
| The HOA Dominion | 91–100 | 3 | 33.3% — PRIORITY for nightly builds |
| Water (special) | Any | 1 (aquatic only) | N/A |

---

## Stat Reference

| Stat | Description |
|---|---|
| HP | Hit points. At 0: creature defeated. |
| ATK | Base attack damage dealt to the player. |
| DEF | Damage mitigation. Player damage = player ATK - (DEF / 2), min 1. |
| XP | Experience awarded on defeat. |
| Gold | Currency dropped on defeat. Used at vendors. |
| Loot drop | Chance = 0.12 + (XP / 120). Higher-XP creatures drop loot more often. |
