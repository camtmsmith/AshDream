CHALK — Gymnastics Session Builder (V5)
========================================

WHAT'S NEW IN V5 — LIVE CONNECTION TO GYMORGPRO (no export/import)
GymOrgPro now publishes its schedule to a shared Firebase database, and Chalk
can read it directly. In the GymOrgPro panel, click "Connect to GymOrgPro",
pick a roster, and the squad rotations load automatically — no "Export backup"
step. Whenever someone saves a change in GymOrgPro, Chalk updates live (a green
"Live" chip shows when connected). The connection is READ-ONLY: Chalk can never
change a gym's schedule.

Needs internet (it reads the live database). Offline, the old "load a backup
.json" import still works exactly as before — it's now the fallback link under
the Connect button. The live connector lives in chalk-gymorg-live.js; delete
that one file and Chalk reverts cleanly to file-import-only.

Security note: the connection uses the same open ("test mode") database
GymOrgPro ships with, so no login is needed. If GymOrgPro's database rules are
later locked down, keep public READ on /rosters and /rosterIndex (or add
anonymous auth to both apps) so Chalk can still read.

WHAT'S NEW IN V4
A "GymOrgPro" panel that pulls a squad's rotation straight out of a GymOrgPro
schedule, so you don't have to re-type anything GymOrgPro already knows:

  1. In GymOrgPro: Organisation → Export backup, save the .json file.
  2. In Chalk: click the "GymOrgPro" pill (top right) → "Choose backup .json".
  3. Pick a Block and a Squad. Chalk lists every scheduled session for that
     squad, and works out the rotation (which station, for how long, in what
     order) straight from GymOrgPro's rotation grid for that day.
  4. Tap a rotation chip (e.g. "Floor · 15m") to jump straight to that
     apparatus tab, already switched to this squad's mapped level (and, for
     MAG apparatus, its ALP working level).
  5. Click "Prefill this session" to auto-tick skills — either fresh
     suggestions at the squad's current ALP level, or an exact copy of what
     was ticked last time this same slot ran (toggle between the two).
  6. "Next lesson" moves to the squad's next scheduled slot in the block and
     re-applies the same prefill logic, so working through a whole block only
     takes a few taps per session.

The first time you connect a gym's file, Chalk asks you to map each
GymOrgPro squad to a Chalk level and each station to a Chalk apparatus tab
(it guesses sensible defaults from the names first). Those mappings, plus a
history of what was ticked per session, are remembered in this browser via
localStorage — nothing is uploaded anywhere.

Chalk and GymOrgPro are separate files/artifacts with separate storage, so
this is a one-way, file-based hand-off (export from GymOrgPro → import into
Chalk), not a live connection. Re-export and re-load whenever the schedule
changes.

WHAT THIS IS (unchanged from V3)
A self-contained lesson/session plan builder that runs in any web browser.
Pick a squad level, choose the Warm-up and apparatus tabs, tick the skills
you want, and it builds a session plan you can Print / save as PDF or copy
as text. Skills that had a diagram in your original documents show it beside
them; click any thumbnail to enlarge.

ALP PATHWAY (MAG)
On any MAG apparatus (Floor, Pommel, Rings, Vault, P-Bars, H-Bar) you can
switch from "Club skills" to "ALP Pathway": skills grouped by family, each
with a difficulty (A/B/C) and a target development score (1-4) across ALP
Levels 1-9. Set the group's working level and the list matches their
ability — use "± 1 level" or "Full pathway" to pull in lower (Support) or
higher (Stretch) skills for mixed groups.

HOW TO RUN IT
1. Keep all the files together in this folder (don't move them apart):
      index.html
      app.jsx
      data.js
      gymorg-bridge.js
      images/   (folder of skill diagrams)
2. Double-click index.html — it opens in your default browser. Done.

You can also host the folder on any web server / shared drive and open
index.html from there.

NOTE: the app needs an internet connection every time it opens now (V4 loads
React, ReactDOM and Babel from a CDN alongside Tailwind/fonts, so app.jsx can
stay plain, readable JSX with no build step). If you need it to run 100%
offline, download those four scripts once and point the <script> tags at
local copies instead of the CDN URLs in index.html.

WHAT'S EASY TO CHANGE NEXT
- Edit the Warm-up list, skill text, or coaching points: it all lives in
  data.js (plain text — search for the skill name).
- Add your own diagrams: drop image files into images/ and reference the
  file name in data.js under that skill's "img" list.
- Station/level mappings and rotation history live in this browser's
  localStorage (keys prefixed "chalk-gymorg-"); clearing site data resets
  them back to auto-guessed defaults.
- Multi-user sync (so a whole coaching team shares the same mappings and
  prefill history instead of per-browser) is a natural next step if this
  gets hosted inside Claude.ai alongside GymOrgPro's own window.storage use.

FILES
  index.html         the page shell (CDN scripts + styling)
  app.jsx             the app (React, plain JSX — readable, no build step)
  data.js             all levels, apparatus, skills, coaching points, images
  gymorg-bridge.js    turns a GymOrgPro roster (file OR live) into rotations,
                      dated sessions, headers, warm-ups
  chalk-gymorg-live.js  read-only live link to GymOrgPro's Firebase (optional)
  images/             skill diagrams
