# Scattered Dad Adventures -- Release Notes

## v1.0.0 "The Mobile Edition" (M18, built 2026-11-10)

Play: https://drkbpainter.github.io/scattered-dad-adventures/ (phone, tablet, or computer; no app store).

What is in it (Mobile PWA plan M1-M18, docs/MOBILE_PWA_PLAN.md):

- Portrait-first phone layout: dynamic viewport (9x13 tiles on phones), compact HUD, 5-button action bar + MORE drawer, full-screen sheets.
- Touch play: tap to walk or attack, swipe to step, hold to inspect, tap status chips for details.
- Installable web app: Home Screen icon, works offline, "new edition" banner on updates, Save Backup codes/files.
- Art: every hero, boss, creature, item and floor tile upgraded from the ASCII sprites (outline + shading), with ASCII as fallback (`?ascii`).
- Motion: walk/attack frames, glides, hit flash, damage numbers, soft lighting (MOTION toggle; reduced-motion respected).
- UI skin: pixel font, panel frames, rarity borders, biome title cards, Fridge Drawings from the kids.
- Mobile comic screens: title cover, Choose Your Dad deck, Bestiary cards.
- NEW in v1.0.0: Share the Game (QR code + link) from the desktop title [Q], the end-of-run screen [Q], How To, and MORE > SHARE.

Unchanged: the save format (`sda_save_v4`); saves from v0.11.0 load as before. Desktop keyboard play is unchanged.

Known open items: see docs/MOBILE NOTES.txt (open MOB items) and bugs/BUG_LOG.md (BUG-016: desktop action bar below the fold on common laptop windows).

### Tagging (KBP, after the real-device checklist in docs/M17_DEVICE_CHECKLIST.md passes)

    git tag -a v1.0-mobile -m "Scattered Dad Adventures v1.0.0, the mobile edition"
    git push origin v1.0-mobile

Optional: on GitHub, Releases > Draft a new release > choose tag v1.0-mobile and paste this section.
