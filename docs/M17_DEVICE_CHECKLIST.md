# M17 Real-Device Checklist (Scattered Dad Adventures)

Created 2026-11-10 by the weekly build run. The emulated device matrix (Chrome device emulation, results in
`docs/MOBILE_PWA_PLAN.md` Progress Log, M17 row) passed. Emulation cannot prove these things on real hardware,
so this list is for KBP to run once on real phones after pushing the M17 files. It takes about 15 minutes per device.

Devices (plan section Phase 5): one recent iPhone (Safari tab AND Home Screen app), one older or low-end Android
(Chrome), one tablet. Write results in `docs/MOBILE NOTES.txt` INBOX, one line each, e.g.
`- Pixel 4a portrait | M17 check 4 | fails: no sound after the first tap`. A line saying "M17 all pass on <device>" is enough
when everything works.

Before starting: open https://drkbpainter.github.io/scattered-dad-adventures/ and check the build. In the browser
address bar add `?nosw` once and reload, then remove it and reload again; this guarantees the newest edition.

| # | Check | How | Pass when |
|---|---|---|---|
| 1 | Install | Android: Install banner or Chrome menu > Install app. iPhone: Share > Add to Home Screen. | Icon on the home screen; opens full-screen with no browser bar. |
| 2 | Safe areas | Play in the installed app in portrait, then landscape. | Nothing hidden under the notch, camera hole, or home bar; buttons fully tappable. |
| 3 | Touch play | Start a run. Tap to walk, swipe to step, hold a tile to inspect, tap WAIT, BAG, SCAN, MORE. | Every action responds on the first tap; no double-tap zoom; no page bounce. |
| 4 | Sound | Mute switch off, volume up. First tap anywhere, then attack something. | Sound effects play (iPhone needs the first tap to unlock audio). |
| 5 | Smoothness | Walk 10 tiles and fight one enemy on the low-end Android. | Movement glides without stutter. If it stutters for a few seconds and then turns smooth while the soft lighting at the screen edge disappears, the new M17 frame-rate governor did its job: say so in the note. |
| 6 | Rotation | Rotate the phone mid-run, then rotate back. | Map re-fits each way; buttons stay on screen; same floor, same spot. |
| 7 | Overlays | Open BAG, DADVICE, MAP, CODEX; scroll each to the bottom; close with X. | Each scrolls to its last line and closes. |
| 8 | App kill | Mid-run, swipe the app away in the app switcher. Reopen, tap Continue. | Same Dad, floor, position, and HP. |
| 9 | Offline | Open the app once online. Turn on airplane mode, kill the app, reopen, start a new run, go down 2 floors. | Game loads with all sprite art and plays normally. |
| 10 | Update banner | After the NEXT push (any later run), open the installed app. | A "new edition" banner appears; tapping Reload keeps the run (Continue resumes it). |
| 11 | Battery | Leave the app open on a floor, untouched, for 5 minutes. | Phone does not get warm; battery drop similar to a static web page. |
| 12 | Protected screens | Title cover, Choose Your Dad deck (swipe, flip, Choose), Bestiary cards (flip; "?" cards do not flip). | Look and work as before. |
| 13 | Share (M18) | Mid-run: MORE > SHARE. Point a second phone's camera at the QR code; tap Copy link; tap Share... (where shown). | Camera opens https://drkbpainter.github.io/scattered-dad-adventures/; Copy says "Link copied"; the phone's share menu opens. Title cover shows v1.0.0. |

Emulated results already covered (no need to repeat unless something looks wrong): layout at 10 device sizes, touch
targets 44 px or more, idle redraws (3 in 3 s), drawFrame cost, rotation, save/resume after page kill, offline run,
service-worker update, save-format compatibility, download size (1.37 MB raw for the whole offline shell).
