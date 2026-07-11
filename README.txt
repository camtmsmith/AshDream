CHALK — Gymnastics Session Builder (V4)
========================================

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

NOTE: React, ReactDOM and the app itself are now bundled into a single local
file (app.js), so the page loads and runs by just double-clicking index.html
with no internet and no build step at open time. The ONLY things still coming
from a CDN are the Tailwind styling engine and the web fonts. That means:

  - Online  : full styling, exactly as designed.
  - Offline : the app still opens and works, but looks plain (system font,
              no Tailwind layout polish) until you're back online.

Earlier V4 loaded React + Babel from a CDN and transformed app.jsx in the
browser. That silently failed when opened via file:// (browsers block the
cross-origin fetch Babel uses to read app.jsx), which is why the page came up
blank. Bundling to app.js removes that fetch entirely and fixes it.

If you want it 100% offline including styling, download Tailwind and the font
CSS once and point the two remaining CDN <script>/@import lines in index.html
at local copies.

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
  index.html         the page shell (loads data.js, gymorg-bridge.js, app.js)
  app.js              the built app bundle (React + ReactDOM + app in one file)
                      — this is what the page actually runs. LOAD-BEARING.
  app.jsx             the app SOURCE (readable JSX). Edit this, then rebuild
                      app.js from it (see REBUILDING below). Not loaded directly.
  data.js             all levels, apparatus, skills, coaching points, images
  gymorg-bridge.js    parses a GymOrgPro backup export into rotations
  images/             skill diagrams

REBUILDING app.js AFTER EDITING app.jsx
app.js is generated from app.jsx with esbuild (React bundled in). To rebuild:

  1. Install Node.js (https://nodejs.org).
  2. In a terminal, in this folder:
       npm install esbuild react@18 react-dom@18
  3. Create entry.jsx containing these 3 lines, then the whole of app.jsx:
       import React from "react";
       import * as ReactDOMClient from "react-dom/client";
       const ReactDOM = ReactDOMClient;
     (i.e. paste app.jsx's contents underneath those three lines)
  4. Build:
       npx esbuild entry.jsx --bundle --minify --format=iife \
         --target=es2018 --define:process.env.NODE_ENV='"production"' \
         --outfile=app.js
  5. Reload index.html.

If you never edit app.jsx, you never need any of this — the app just runs.
