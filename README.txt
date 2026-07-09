CHALK — Gymnastics Session Builder
==================================

WHAT THIS IS
A self-contained lesson/session plan builder that runs in any web browser.
Pick a squad level, choose the Warm-up and apparatus tabs, tick the skills you
want, and it builds a session plan you can Print / save as PDF or copy as text.
Skills that had a diagram in your original documents show it beside them
(512 of the skills have diagrams; click any thumbnail to enlarge).

All the content comes from your own level outline documents.


ALP PATHWAY (MAG)
On any MAG apparatus (Floor, Pommel, Rings, Vault, P-Bars, H-Bar) you can switch
from "Club skills" to "ALP Pathway". This shows the MAG ALP Essential Skills
matrix: skills grouped by family, each with its difficulty (A/B/C) and a target
development score (1-4) across ALP Levels 1-9 (ages 6-7 to 16-17). Set the group's
working level and the list matches their ability - use "± 1 level" or "Full
pathway" to pull in lower (Support) or higher (Stretch) skills for mixed groups.
Ticking a pathway skill adds it to the session plan like any other.


HOW TO RUN IT
1. Keep all the files together in this folder (don't move them apart):
      index.html
      app.js
      data.js
      images/   (folder of skill diagrams)
2. Double-click  index.html  — it opens in your default browser. Done.

You can also drag index.html onto a browser window, or host the folder on any
web server / shared drive and open index.html from there.

NOTE: the first time it opens it needs an internet connection to load the
styling (Tailwind) and fonts. After that it works fine offline. If you want it
to run 100% offline with no internet at all, tell the developer and they can
bundle the styling locally.


WHAT'S EASY TO CHANGE NEXT
- Edit the Warm-up list, or any skill text / coaching points: it all lives in
  data.js (plain text — search for the skill name).
- Add your own diagrams: drop image files into images/ and reference the file
  name in data.js under that skill's "img" list.
- Saving named plans, athlete tracking, etc. are natural next features.


FILES
  index.html   the page shell (styling + fonts)
  app.js        the app (React, bundled — no install needed)
  data.js       all levels, apparatus, skills, coaching points, image links
  images/       361 skill diagrams extracted from your documents
