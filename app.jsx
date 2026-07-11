// ============================================================================
// CHALK — Gymnastics Session Builder (V4)
// Adds a GymOrgPro import/rotation panel on top of every V3 feature:
// warm-up + apparatus skill picking, ALP pathway view, session-plan sidebar,
// print/PDF, copy-as-text, and the mobile drawer.
// Written as plain JSX, transpiled in-browser by Babel standalone — no build
// step, so it stays a "keep the folder together, double-click index.html" app.
// ============================================================================
const { useState, useEffect, useMemo, useRef } = React;

const CHALK_DATA = window.CHALK_DATA;
const CHALK_WARMUP = window.CHALK_WARMUP;
const CHALK_ALP = window.CHALK_ALP || { cols: [], apparatus: {} };
const GB = window.GymOrgBridge;
const imgSrc = (f) => "images/" + f;

const NAVY = "#211a4d";
const INK = "#1b1930";
const APP_COLORS = {
  "Warm-up": "#d97706", Floor: "#059669", Vault: "#0284c7", Bars: "#7c3aed",
  Beam: "#db2777", "Pommel Horse": "#ea580c", Rings: "#dc2626",
  "Parallel Bars": "#0d9488", "Horizontal Bar": "#2563eb",
};
const SCORE_STYLE = {
  1: { bg: "#dbeafe", fg: "#1e3a8a", label: "Intro" },
  2: { bg: "#93c5fd", fg: "#0b2f66", label: "Developing" },
  3: { bg: "#3b82f6", fg: "#ffffff", label: "Advanced" },
  4: { bg: "#1d4ed8", fg: "#ffffff", label: "Comp" },
};
const STREAM_LABELS = {
  Foundational: "Foundational (Preschool)", "Pre-Levels": "Pre-Levels",
  WAG: "Women's Artistic", MAG: "Men's Artistic",
};
const ALL_LEVELS = Object.keys(CHALK_DATA);

// ---------------------------------------------------------------- icons ----
function Icon({ path, size = 18, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {path}
    </svg>
  );
}
const IconCheck = (p) => <Icon {...p} path={<path d="M20 6 9 17l-5-5" />} />;
const IconChevronLeft = (p) => <Icon {...p} path={<path d="m15 18-6-6 6-6" />} />;
const IconChevronRight = (p) => <Icon {...p} path={<path d="m9 18 6-6-6-6" />} />;
const IconSearch = (p) => <Icon {...p} path={<><path d="m21 21-4.34-4.34" /><circle cx="11" cy="11" r="8" /></>} />;
const IconPrinter = (p) => <Icon {...p} path={<><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" /><rect x="6" y="14" width="12" height="8" rx="1" /></>} />;
const IconCopy = (p) => <Icon {...p} path={<><rect x="8" y="8" width="14" height="14" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>} />;
const IconTrash = (p) => <Icon {...p} path={<><path d="M10 11v6" /><path d="M14 11v6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>} />;
const IconX = (p) => <Icon {...p} path={<><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>} />;
const IconImage = (p) => <Icon {...p} path={<><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>} />;
const IconLayers = (p) => <Icon {...p} path={<><path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z" /><path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12" /><path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17" /></>} />;
const IconTarget = (p) => <Icon {...p} path={<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>} />;
const IconClipboard = (p) => <Icon {...p} path={<><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></>} />;
const IconDumbbell = (p) => <Icon {...p} path={<><path d="M17.596 12.768a2 2 0 1 0 2.829-2.829l-1.768-1.767a2 2 0 0 0 2.828-2.829l-2.828-2.828a2 2 0 0 0-2.829 2.828l-1.767-1.768a2 2 0 1 0-2.829 2.829z" /><path d="m2.5 21.5 1.4-1.4" /><path d="m20.1 3.9 1.4-1.4" /><path d="M5.343 21.485a2 2 0 1 0 2.829-2.828l1.767 1.768a2 2 0 1 0 2.829-2.829l-6.364-6.364a2 2 0 1 0-2.829 2.829l1.768 1.767a2 2 0 0 0-2.828 2.829z" /><path d="m9.6 14.4 4.8-4.8" /></>} />;
const IconUpload = (p) => <Icon {...p} path={<><path d="M12 3v12" /><path d="m17 8-5-5-5 5" /><path d="M5 21h14" /></>} />;
const IconRefresh = (p) => <Icon {...p} path={<><path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 4v6h-6" /></>} />;
const IconUsers = (p) => <Icon {...p} path={<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>} />;
const IconCalendar = (p) => <Icon {...p} path={<><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>} />;

// -------------------------------------------------------------- storage ----
const LS = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore quota errors */ }
  },
};

// -------------------------------------------------- GymOrgPro name maps ----
const STATION_SYNONYMS = {
  floor: "Floor", floorexercise: "Floor",
  vault: "Vault",
  bars: "Bars", unevenbars: "Bars", ubars: "Bars",
  beam: "Beam", balancebeam: "Beam",
  pommelhorse: "Pommel Horse", pommel: "Pommel Horse", sidehorse: "Pommel Horse",
  rings: "Rings", stillrings: "Rings",
  parallelbars: "Parallel Bars", pbars: "Parallel Bars",
  horizontalbar: "Horizontal Bar", highbar: "Horizontal Bar", hbar: "Horizontal Bar",
};
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z]/g, "");

function allChalkApparatus() {
  const set = new Set();
  Object.values(CHALK_DATA).forEach((lvl) => Object.keys(lvl.apparatus).forEach((a) => set.add(a)));
  return Array.from(set);
}
function guessApparatus(stationName, candidates) {
  const n = norm(stationName);
  if (STATION_SYNONYMS[n] && candidates.includes(STATION_SYNONYMS[n])) return STATION_SYNONYMS[n];
  const hit = candidates.find((c) => norm(c) === n || n.includes(norm(c)) || norm(c).includes(n));
  return hit || "";
}
function guessLevel(squadName, levelKeys) {
  const n = norm(squadName);
  return levelKeys.find((l) => norm(l) === n) || "";
}

// ============================================================================
function ChalkApp() {
  const [level, setLevel] = useState(ALL_LEVELS[0]);
  const [tab, setTab] = useState("Warm-up");
  const [selected, setSelected] = useState({});
  const [focus, setFocus] = useState("");
  const [duration, setDuration] = useState("60");
  const [search, setSearch] = useState("");
  const [openCues, setOpenCues] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [mode, setMode] = useState("club"); // club | alp
  const [alpIdx, setAlpIdx] = useState(3);
  const [alpFilter, setAlpFilter] = useState("range");
  const [gymorgOpen, setGymorgOpen] = useState(false);

  // ---------------- GymOrgPro import state ----------------
  const [gymorg, setGymorg] = useState(null); // parsed backup {gymName,squads,stations,blocks}
  const [gBlockId, setGBlockId] = useState("");
  const [gSquadId, setGSquadId] = useState("");
  const [gSessionIdx, setGSessionIdx] = useState(0); // index into sessionsForSquad list
  const [gWeek, setGWeek] = useState("week1");
  const [squadMap, setSquadMap] = useState(() => LS.get("chalk-gymorg-squadmap", {}));
  const [stationMap, setStationMap] = useState(() => LS.get("chalk-gymorg-stationmap", {}));
  const [alpMap, setAlpMap] = useState(() => LS.get("chalk-gymorg-alpmap", {}));
  const [prefillMode, setPrefillMode] = useState("fresh"); // fresh | last
  const [gymorgError, setGymorgError] = useState("");
  const fileInputRef = useRef(null);

  const apparatusHasAlp = !!CHALK_ALP.apparatus[tab];
  useEffect(() => { if (!apparatusHasAlp && mode === "alp") setMode("club"); }, [tab]);

  const apparatusList = useMemo(() => Object.keys(CHALK_DATA[level].apparatus), [level]);
  const tabList = useMemo(() => ["Warm-up", ...apparatusList], [apparatusList]);
  useEffect(() => { if (!tabList.includes(tab)) setTab("Warm-up"); }, [level]);

  const sections = useMemo(() => {
    const raw = tab === "Warm-up"
      ? Object.entries(CHALK_WARMUP).map(([group, skills]) => ({ group, skills }))
      : (CHALK_DATA[level].apparatus[tab] || []);
    return raw.map((sec, gi) => ({ ...sec, _gi: gi, skills: sec.skills.map((sk, si) => ({ ...sk, _si: si })) }));
  }, [level, tab]);

  const searchTerm = search.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!searchTerm) return sections;
    return sections
      .map((sec) => ({ ...sec, skills: sec.skills.filter((sk) => sk.name.toLowerCase().includes(searchTerm) || (sk.cues || []).some((c) => c.toLowerCase().includes(searchTerm))) }))
      .filter((sec) => sec.skills.length);
  }, [sections, searchTerm]);

  const skillKey = (lvl, sectionName, gi, si) => `${lvl}::${sectionName}::${gi}::${si}`;
  const color = APP_COLORS[tab] || NAVY;

  function toggleSkill(sectionName, gi, si, group, skill) {
    const key = skillKey(level, sectionName, gi, si);
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = { level, section: sectionName, group: group.group, name: skill.name, cues: skill.cues || [], img: skill.img || [], color: APP_COLORS[sectionName] || NAVY };
      return next;
    });
  }
  function toggleAlpSkill(sectionName, idx, entry, levelLabel) {
    const key = `ALP::${sectionName}::${idx}`;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else {
        const cues = [`Family: ${entry.f}`, `Difficulty: ${entry.d || "—"}`, `Pathway skill (${levelLabel})`];
        next[key] = { level, section: sectionName, group: entry.f, name: entry.s, cues, img: [], color: APP_COLORS[sectionName] || NAVY, alp: true };
      }
      return next;
    });
  }

  const selectedList = Object.entries(selected);
  const bySection = useMemo(() => {
    const map = {};
    selectedList.forEach(([id, v]) => { (map[v.section] = map[v.section] || []).push({ id, ...v }); });
    return map;
  }, [selected]);
  const orderedSections = useMemo(() => ["Warm-up", ...apparatusList].filter((s) => bySection[s]), [apparatusList, bySection]);

  function clearAll() {
    if (confirm("Clear all selected skills from this session?")) setSelected({});
  }
  function planText() {
    let out = `GYMNASTICS SESSION PLAN\n${level}` + (focus ? `  —  Focus: ${focus}` : "") + `\nDuration: ${duration} min\n`;
    orderedSections.forEach((sec) => {
      out += `\n${sec.toUpperCase()}\n`;
      bySection[sec].forEach((sk) => {
        out += `  • ${sk.name}` + (sk.group && sk.group !== "General" ? `  [${sk.group}]` : "") + `\n`;
        (sk.cues || []).forEach((c) => { out += `      - ${c}\n`; });
      });
    });
    return out;
  }
  function copyPlan() { navigator.clipboard?.writeText(planText()); }
  function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }

  function printPlan() {
    const win = window.open("", "_blank");
    if (!win) return;
    const mins = parseInt(duration) || 0;
    const stations = orderedSections.filter((s) => s !== "Warm-up");
    const hasWarm = orderedSections.includes("Warm-up");
    const warmMins = hasWarm ? 15 : 0;
    const coolMins = mins > 25 ? 5 : 0;
    const perStation = stations.length ? Math.max(1, Math.round((mins - warmMins - coolMins) / stations.length)) : 0;
    const warmRows = hasWarm ? bySection["Warm-up"] : [];
    let warmHtml = "";
    for (let i = 0; i < warmRows.length; i += 3) {
      const cells = [0, 1, 2].map((o) => {
        const it = warmRows[i + o];
        return it
          ? `<td class="wt">${esc(it.name)}${it.group && it.group !== "General" ? `<span class="sub">${esc(it.group)}</span>` : ""}</td><td class="wm"></td>`
          : `<td class="wt"></td><td class="wm"></td>`;
      }).join("");
      warmHtml += `<tr>${cells}</tr>`;
    }
    const warmBlock = hasWarm
      ? `<div class="bar">Warm-up &amp; Preparation${focus ? ` &nbsp;–&nbsp; Focus: ${esc(focus)}` : ""} &nbsp;–&nbsp; ${warmMins} mins</div><table class="warm"><tbody>${warmHtml}</tbody></table>`
      : "";
    const circuitsHtml = stations.map((sec, i) => {
      const c = APP_COLORS[sec] || NAVY;
      const rows = bySection[sec].map((sk) => `
        <tr>
          <td class="eq">${esc(sec)}</td>
          <td class="sk"><div class="skrow">${sk.img && sk.img.length ? `<img class="thumb" src="${imgSrc(sk.img[0])}"/>` : ""}<span class="skname">${esc(sk.name)}${sk.group && sk.group !== "General" ? `<span class="sub">${esc(sk.group)}</span>` : ""}</span></div></td>
          <td class="kcp">${(sk.cues || []).length ? `<ul>${sk.cues.map((c2) => `<li>${esc(c2)}</li>`).join("")}</ul>` : ""}</td>
          <td class="safe"></td>
        </tr>`).join("");
      return `<div class="bar" style="background:${c}">Circuit ${i + 1} &nbsp;–&nbsp; ${esc(sec)} &nbsp;–&nbsp; ${perStation} mins</div>
        <table class="circ"><thead><tr><th class="eq">Equipment</th><th class="sk">Skill</th><th class="kcp">KCP</th><th class="safe">Safety</th></tr></thead><tbody>${rows}</tbody></table>`;
    }).join("");
    const coolBlock = coolMins
      ? `<div class="bar">Warm Down &nbsp;–&nbsp; complete at last station &nbsp;–&nbsp; ${coolMins} mins</div><table class="warm"><tbody><tr><td class="wt" colspan="6" style="font-style:italic;color:#555">Gymnasts stand on line. Coach dismisses gymnasts.</td></tr></tbody></table>`
      : "";
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(level)} — Lesson Plan</title>
      <style>
        @page{size:A4;margin:12mm}
        *{box-sizing:border-box} body{font-family:'Barlow Semi Condensed',Arial,sans-serif;color:#1b1930;margin:0}
        .hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2.5px solid ${NAVY};padding-bottom:6px;margin-bottom:12px}
        .hd h1{font-size:22px;margin:0;letter-spacing:.4px} .hd .club{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:2px}
        .hd .meta{font-family:Arial,sans-serif;font-size:11px;color:#555;text-align:right;line-height:1.5}
        .bar{background:#C2D69B;font-weight:700;font-size:13px;padding:5px 9px;margin-top:11px;color:#26331a;border:1px solid #a9c07c;letter-spacing:.3px}
        .bar[style]{color:#fff;border:none}
        table{width:100%;border-collapse:collapse;table-layout:fixed}
        .circ th{background:#BFBFBF;color:#222;font-size:11px;text-transform:uppercase;letter-spacing:.6px;text-align:left;padding:3px 8px;border:1px solid #9a9a9a}
        .circ td{border:1px solid #c9c9c9;padding:5px 8px;vertical-align:top;font-family:Arial,sans-serif}
        .circ .eq{width:15%;font-size:11px;color:#444} .circ .sk{width:34%} .circ .kcp{width:36%} .circ .safe{width:15%;background:#fbfbfb}
        .skrow{display:flex;gap:7px;align-items:flex-start}
        .thumb{width:38px;height:38px;object-fit:contain;flex:0 0 auto;border:1px solid #e2e2ea;border-radius:4px;background:#fff}
        .skname{font-size:12.5px;font-weight:600;line-height:1.25;font-family:Arial,sans-serif}
        .sub{display:block;font-size:9.5px;font-weight:400;color:#8a8a8a;letter-spacing:.2px}
        .kcp ul{margin:0;padding-left:14px} .kcp li{font-size:10.5px;color:#444;margin:1px 0}
        .warm{margin-top:0} .warm td{border:1px solid #c9c9c9;padding:5px 8px;font-family:Arial,sans-serif;font-size:11.5px;vertical-align:top}
        .warm .wt{width:24%;font-weight:600} .warm .wm{width:9%;background:#f6f6f2}
        .foot{margin-top:12px;font-family:Arial,sans-serif;font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:5px}
        tr,table,.bar{break-inside:avoid}
      </style></head><body>
      <div class="hd"><div><div class="club">Gymnastics Lesson Plan</div><h1>${esc(level)}</h1></div>
        <div class="meta">Duration: <b>${esc(duration)} min</b><br>Skills: ${selectedList.length}<br>Date: __________  Coach: __________</div></div>
      ${warmBlock}${circuitsHtml || "<p style='font-family:Arial;color:#888'>No apparatus skills selected yet.</p>"}${coolBlock}
      <div class="foot">KCP = Key Coaching Points &nbsp;·&nbsp; Key: Coach position</div>
      <script>window.onload=()=>{setTimeout(()=>window.print(),450)}<\/script></body></html>`);
    win.document.close();
  }

  const streamGroups = useMemo(() => {
    const g = {};
    ALL_LEVELS.forEach((l) => { (g[CHALK_DATA[l].stream] = g[CHALK_DATA[l].stream] || []).push(l); });
    return g;
  }, []);

  // ==================================================================
  // GymOrgPro import + rotation logic
  // ==================================================================
  function handleFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = GB.parseBackup(reader.result);
        setGymorg(parsed);
        setGymorgError("");
        const firstBlock = parsed.blocks[0];
        setGBlockId(firstBlock ? firstBlock.id : "");
        setGSquadId(parsed.squads[0] ? parsed.squads[0].id : "");
        setGSessionIdx(0);
        // Seed sensible auto-guessed defaults for anything not already mapped.
        const candidates = allChalkApparatus();
        const nextStationMap = { ...stationMap };
        parsed.stations.forEach((s) => { if (!nextStationMap[s.id]) nextStationMap[s.id] = guessApparatus(s.name, candidates); });
        setStationMap(nextStationMap); LS.set("chalk-gymorg-stationmap", nextStationMap);
        const nextSquadMap = { ...squadMap };
        parsed.squads.forEach((s) => { if (!nextSquadMap[s.id]) nextSquadMap[s.id] = guessLevel(s.name, ALL_LEVELS); });
        setSquadMap(nextSquadMap); LS.set("chalk-gymorg-squadmap", nextSquadMap);
      } catch (err) {
        setGymorgError(err.message || "Couldn't read that file.");
      }
    };
    reader.readAsText(file);
  }

  const gBlock = useMemo(() => gymorg && gymorg.blocks.find((b) => b.id === gBlockId), [gymorg, gBlockId]);
  const gSquad = useMemo(() => gymorg && gymorg.squads.find((s) => s.id === gSquadId), [gymorg, gSquadId]);
  const gSessions = useMemo(() => (gBlock && gSquadId) ? GB.sessionsForSquad(gBlock, gSquadId) : [], [gBlock, gSquadId]);
  const gCurrent = gSessions[gSessionIdx] || null;
  const gRotation = useMemo(() => (gBlock && gSquadId && gCurrent) ? GB.rotationForSession(gBlock, gSquadId, gCurrent.weekday, gCurrent.session) : null, [gBlock, gSquadId, gCurrent]);
  const gLegs = gRotation ? (gWeek === "week2" ? gRotation.week2 : gRotation.week1) : [];
  const weeksDiffer = gRotation && JSON.stringify(gRotation.week1) !== JSON.stringify(gRotation.week2);

  const gMappedLevel = gSquad ? (squadMap[gSquad.id] || "") : "";
  const gAlpIdx = gSquad ? (alpMap[gSquad.id] != null ? alpMap[gSquad.id] : 3) : 3;
  const gKey = (gBlock && gSquadId && gCurrent) ? GB.sessionKey(gBlock.id, gSquadId, gCurrent.weekday, gCurrent.session.id) + "::" + gWeek : null;

  function historySkillsFor(key) { return LS.get("chalk-gymorg-history", {})[key] || {}; }
  function saveHistorySkillsFor(key, sectionsInRotation) {
    if (!key) return;
    const snapshot = {};
    Object.entries(selected).forEach(([k, v]) => { if (sectionsInRotation.includes(v.section) && v.level === level) snapshot[k] = v; });
    const all = LS.get("chalk-gymorg-history", {});
    all[key] = snapshot;
    LS.set("chalk-gymorg-history", all);
  }

  // Auto-save the rotation's ticked skills as "last time" whenever they change.
  useEffect(() => {
    if (!gKey || !gLegs.length) return;
    const secs = gLegs.map((l) => stationMap[l.stationId]).filter(Boolean);
    const t = setTimeout(() => saveHistorySkillsFor(gKey, secs), 400);
    return () => clearTimeout(t);
  }, [selected, gKey]);

  function jumpToLeg(stationId) {
    const appName = stationMap[stationId];
    if (!appName || !gMappedLevel) return;
    setLevel(gMappedLevel);
    setTab(appName);
    if (CHALK_ALP.apparatus[appName]) { setMode("alp"); setAlpIdx(gAlpIdx); setAlpFilter("range"); }
    else setMode("club");
  }

  function applyPrefillToRotation() {
    if (!gLegs.length || !gMappedLevel) return;
    const secs = gLegs.map((l) => stationMap[l.stationId]).filter(Boolean);
    if (prefillMode === "last" && gKey) {
      const stored = historySkillsFor(gKey);
      if (Object.keys(stored).length) {
        setSelected((prev) => ({ ...prev, ...stored }));
        return;
      }
    }
    // Fresh suggestion: for ALP-capable apparatus, auto-tick the squad's
    // current-level pathway skills; club-only apparatus just gets filtered to.
    setSelected((prev) => {
      const next = { ...prev };
      secs.forEach((sectionName) => {
        const entries = CHALK_ALP.apparatus[sectionName];
        if (!entries) return;
        entries.forEach((entry, idx) => {
          if (entry.t && entry.t[gAlpIdx] != null) {
            const key = `ALP::${sectionName}::${idx}`;
            if (!next[key]) {
              const cues = [`Family: ${entry.f}`, `Difficulty: ${entry.d || "—"}`, `Pathway skill (auto-suggested)`];
              next[key] = { level: gMappedLevel, section: sectionName, group: entry.f, name: entry.s, cues, img: [], color: APP_COLORS[sectionName] || NAVY, alp: true };
            }
          }
        });
      });
      return next;
    });
  }

  function goToSession(idx) {
    setGSessionIdx(idx);
    setGWeek("week1");
  }
  function nextLesson() { if (gSessions.length) goToSession((gSessionIdx + 1) % gSessions.length); }
  function prevLesson() { if (gSessions.length) goToSession((gSessionIdx - 1 + gSessions.length) % gSessions.length); }

  const sidebarProps = { level, focus, duration, orderedSections, bySection, selectedList, copyPlan, printPlan, clearAll, setSelected, setLightbox };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: INK }} className="min-h-screen bg-slate-100">
      <header style={{ background: NAVY }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,.12)" }}><IconDumbbell size={20} /></div>
          <div>
            <div className="disp text-xl font-bold tracking-wide leading-none">CHALK</div>
            <div className="text-[11px] uppercase tracking-[2px] text-indigo-200">Session Builder</div>
          </div>
          <button onClick={() => setGymorgOpen((o) => !o)}
            className="ml-auto disp text-sm font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5"
            style={gymorgOpen ? { background: "#fff", color: NAVY, borderColor: "#fff" } : { background: "rgba(255,255,255,.1)", borderColor: "rgba(255,255,255,.3)", color: "#fff" }}>
            <IconLayers size={14} /> GymOrgPro {gymorg ? "· connected" : ""}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-5 grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="min-w-0">
          {gymorgOpen && (
            <GymOrgPanel
              gymorg={gymorg} gymorgError={gymorgError} fileInputRef={fileInputRef} handleFile={handleFile}
              gBlockId={gBlockId} setGBlockId={setGBlockId} gSquadId={gSquadId} setGSquadId={setGSquadId}
              gSessions={gSessions} gSessionIdx={gSessionIdx} goToSession={goToSession}
              gWeek={gWeek} setGWeek={setGWeek} weeksDiffer={weeksDiffer}
              gLegs={gLegs} stationMap={stationMap} setStationMap={setStationMap}
              gSquad={gSquad} squadMap={squadMap} setSquadMap={setSquadMap}
              alpMap={alpMap} setAlpMap={setAlpMap} gAlpIdx={gAlpIdx}
              prefillMode={prefillMode} setPrefillMode={setPrefillMode}
              jumpToLeg={jumpToLeg} applyPrefillToRotation={applyPrefillToRotation}
              nextLesson={nextLesson} prevLesson={prevLesson}
              activeTab={tab} setFocus={setFocus} setDuration={setDuration}
            />
          )}

          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Squad level</span>
                <select value={level} onChange={(e) => setLevel(e.target.value)} className="disp text-lg font-semibold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 min-w-[190px]">
                  {Object.entries(streamGroups).map(([stream, levels]) => (
                    <optgroup key={stream} label={STREAM_LABELS[stream] || stream}>
                      {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Session focus (optional)</span>
                <input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. handstand shape, safe landings" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </label>
              <label className="flex flex-col gap-1 w-24">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Mins</span>
                <input value={duration} onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {tabList.map((y) => {
              const active = y === tab; const c = APP_COLORS[y] || NAVY; const n = (bySection[y] || []).length;
              return (
                <button key={y} onClick={() => { setTab(y); setSearch(""); }}
                  className="disp text-sm font-semibold px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5"
                  style={active ? { background: c, borderColor: c, color: "#fff" } : { background: "#fff", borderColor: "#e2e8f0", color: "#334155" }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: active ? "#fff" : c }} />
                  {y}
                  {n > 0 && <span className="text-[11px] rounded-full px-1.5 leading-4" style={active ? { background: "rgba(255,255,255,.25)" } : { background: c, color: "#fff" }}>{n}</span>}
                </button>
              );
            })}
          </div>

          {apparatusHasAlp && (
            <div className="flex items-center gap-1 mb-3 bg-white border border-slate-200 rounded-lg p-1 w-max">
              {[["club", "Club skills"], ["alp", "ALP Pathway"]].map(([y, label]) => (
                <button key={y} onClick={() => setMode(y)} className="disp text-sm font-semibold px-3 py-1 rounded-md flex items-center gap-1.5"
                  style={mode === y ? { background: color, color: "#fff" } : { color: "#475569" }}>
                  {y === "alp" ? <IconLayers size={14} /> : <IconDumbbell size={14} />} {label}
                </button>
              ))}
            </div>
          )}

          {mode === "alp" && apparatusHasAlp ? (
            <AlpView app={tab} color={color} alpIdx={alpIdx} setAlpIdx={setAlpIdx} alpFilter={alpFilter} setAlpFilter={setAlpFilter} selected={selected} toggleAlp={toggleAlpSkill} level={level} />
          ) : (
            <>
              <div className="relative mb-3">
                <IconSearch size={16} className="absolute left-3 top-2.5 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab.toLowerCase()} skills & coaching points…`} className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm" />
              </div>
              <div className="space-y-4 pb-24 lg:pb-4">
                {filteredSections.length === 0 && (
                  <div className="text-sm text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl p-6 text-center">No skills match &ldquo;{search}&rdquo;. Try another word or clear the search.</div>
                )}
                {filteredSections.map((sec, secIdx) => (
                  <div key={sec.group + secIdx}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-1.5 h-4 rounded" style={{ background: color }} />
                      <h3 className="disp text-[15px] font-bold uppercase tracking-wide text-slate-700">{sec.group}</h3>
                      <span className="text-[11px] text-slate-400">{sec.skills.length}</span>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                      {sec.skills.map((sk) => {
                        const key = skillKey(level, tab, sec._gi, sk._si);
                        const isSel = !!selected[key];
                        const open = !!openCues[key];
                        return (
                          <div key={key} className="px-3 py-2.5">
                            <div className="flex items-start gap-3">
                              <button onClick={() => toggleSkill(tab, sec._gi, sk._si, sec, sk)} aria-pressed={isSel}
                                className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors"
                                style={isSel ? { background: color, borderColor: color } : { borderColor: "#cbd5e1" }}>
                                {isSel && <IconCheck size={14} color="#fff" strokeWidth={3} />}
                              </button>
                              {sk.img && sk.img.length > 0 && (
                                <button onClick={() => setLightbox({ imgs: sk.img, name: sk.name })} className="shrink-0 w-12 h-12 rounded-md border border-slate-200 bg-white overflow-hidden flex items-center justify-center hover:border-slate-400" title="View diagram">
                                  <img src={imgSrc(sk.img[0])} alt="" className="max-w-full max-h-full object-contain" />
                                </button>
                              )}
                              <div className="min-w-0 flex-1">
                                <button onClick={() => toggleSkill(tab, sec._gi, sk._si, sec, sk)} className="text-left text-sm text-slate-800 leading-snug block w-full">{sk.name}</button>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {(sk.cues || []).length > 0 && (
                                    <button onClick={() => setOpenCues((p) => ({ ...p, [key]: !p[key] }))} className="text-[11px] font-medium inline-flex items-center gap-0.5" style={{ color }}>
                                      <IconChevronRight size={12} className={open ? "rotate-90 transition-transform" : "transition-transform"} /> {sk.cues.length} coaching {sk.cues.length === 1 ? "point" : "points"}
                                    </button>
                                  )}
                                  {sk.img && sk.img.length > 1 && <span className="text-[11px] text-slate-400 inline-flex items-center gap-0.5"><IconImage size={11} /> {sk.img.length} diagrams</span>}
                                </div>
                                {open && <ul className="mt-1 ml-1 space-y-0.5 border-l-2 pl-3" style={{ borderColor: color + "44" }}>{sk.cues.map((c, i) => <li key={i} className="text-xs text-slate-500 leading-snug">{c}</li>)}</ul>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="hidden lg:block sticky top-4"><SessionPlanCard {...sidebarProps} /></aside>
      </div>

      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20">
        <button onClick={() => setMobileOpen(true)} className="w-full text-white px-4 py-3 flex items-center justify-center gap-2 disp font-semibold shadow-lg" style={{ background: NAVY }}>
          <IconClipboard size={18} /> View session · {selectedList.length} skill{selectedList.length === 1 ? "" : "s"}
        </button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40 flex items-end" onClick={() => setMobileOpen(false)}>
          <div className="bg-slate-100 w-full max-h-[85vh] overflow-auto rounded-t-2xl p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setMobileOpen(false)} className="p-1.5"><IconX size={20} /></button></div>
            <SessionPlanCard {...sidebarProps} />
          </div>
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <div className="bg-white rounded-xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="disp font-bold text-slate-800 leading-tight">{lightbox.name}</div>
              <button onClick={() => setLightbox(null)} className="p-1 text-slate-400 hover:text-slate-700"><IconX size={20} /></button>
            </div>
            <div className="flex flex-wrap gap-3 justify-center">{lightbox.imgs.map((y, i) => <img key={i} src={imgSrc(y)} alt="" className="max-h-72 object-contain border border-slate-200 rounded-lg bg-white p-2" />)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------- session plan --
function SessionPlanCard({ level, focus, duration, orderedSections, bySection, selectedList, copyPlan, printPlan, clearAll, setSelected, setLightbox }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 text-white" style={{ background: NAVY }}>
        <div className="disp font-bold text-lg leading-tight">Session Plan</div>
        <div className="text-[12px] text-indigo-200">{level}{focus ? ` · ${focus}` : ""} · {duration} min · {selectedList.length} skill{selectedList.length === 1 ? "" : "s"}</div>
      </div>
      <div className="max-h-[52vh] overflow-auto p-3 space-y-3">
        {orderedSections.length === 0 && <p className="text-sm text-slate-400 text-center py-8">Tick skills to build the session.<br />They&rsquo;ll appear here grouped by section.</p>}
        {orderedSections.map((sec) => {
          const c = APP_COLORS[sec] || NAVY;
          return (
            <div key={sec}>
              <div className="disp text-[13px] font-bold uppercase tracking-wide mb-1 flex items-center gap-1.5" style={{ color: c }}>
                <span className="w-2 h-2 rounded-full" style={{ background: c }} />{sec}<span className="text-slate-400 font-medium">{bySection[sec].length}</span>
              </div>
              <ul className="space-y-1">
                {bySection[sec].map((sk) => (
                  <li key={sk.id} className="group flex items-start gap-2 text-[13px] text-slate-700">
                    {sk.img && sk.img.length > 0
                      ? <button onClick={() => setLightbox({ imgs: sk.img, name: sk.name })} className="mt-0.5 w-6 h-6 rounded border border-slate-200 overflow-hidden shrink-0 bg-white flex items-center justify-center"><img src={imgSrc(sk.img[0])} alt="" className="max-w-full max-h-full object-contain" /></button>
                      : <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: c }} />}
                    <span className="flex-1 leading-snug">{sk.name}</span>
                    <button onClick={() => setSelected((prev) => { const n = { ...prev }; delete n[sk.id]; return n; })} className="text-slate-300 hover:text-red-500 shrink-0 mt-0.5"><IconX size={14} /></button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-100 p-2.5 flex gap-2">
        <button onClick={printPlan} disabled={!selectedList.length} className="flex-1 disp font-semibold text-sm text-white rounded-lg py-2 flex items-center justify-center gap-1.5 disabled:opacity-40" style={{ background: NAVY }}><IconPrinter size={15} /> Print / PDF</button>
        <button onClick={copyPlan} disabled={!selectedList.length} className="px-3 rounded-lg border border-slate-300 text-slate-600 disabled:opacity-40" title="Copy as text"><IconCopy size={15} /></button>
        <button onClick={clearAll} disabled={!selectedList.length} className="px-3 rounded-lg border border-slate-300 text-slate-600 hover:text-red-500 disabled:opacity-40" title="Clear all"><IconTrash size={15} /></button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- ALP view -
function AlpView({ app, color, alpIdx, setAlpIdx, alpFilter, setAlpFilter, selected, toggleAlp, level }) {
  const cols = CHALK_ALP.cols || [];
  const entries = CHALK_ALP.apparatus[app] || [];
  const col = cols[alpIdx] || {};
  const grouped = {};
  entries.forEach((entry, i) => {
    const levels = Object.keys(entry.t).map(Number).sort((a, b) => a - b);
    let status = "none", score = null;
    if (entry.t[alpIdx] != null) { status = "current"; score = entry.t[alpIdx]; }
    else if (levels.length && levels[0] > alpIdx) { status = "stretch"; score = entry.t[levels[0]]; }
    else if (levels.length && levels[levels.length - 1] < alpIdx) { status = "support"; score = entry.t[levels[levels.length - 1]]; }
    const lo = levels.length ? levels[0] : null, hi = levels.length ? levels[levels.length - 1] : null;
    let show = true;
    if (alpFilter === "current") show = status === "current";
    else if (alpFilter === "range") show = status === "current" || (status === "stretch" && lo === alpIdx + 1) || (status === "support" && hi === alpIdx - 1);
    (grouped[entry.f] = grouped[entry.f] || []).push({ ...entry, i, status, score, show });
  });
  return (
    <div className="pb-24 lg:pb-4">
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-3">
        <div className="flex items-center gap-2 mb-2"><IconTarget size={15} style={{ color }} /><span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Group working level (ALP)</span></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAlpIdx(Math.max(0, alpIdx - 1))} disabled={alpIdx === 0} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 disabled:opacity-30"><IconChevronLeft size={16} /></button>
          <div className="flex-1 text-center"><div className="disp text-lg font-bold leading-none" style={{ color }}>{col.level}</div><div className="text-[11px] text-slate-500">{col.age} years</div></div>
          <button onClick={() => setAlpIdx(Math.min(cols.length - 1, alpIdx + 1))} disabled={alpIdx === cols.length - 1} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600 disabled:opacity-30"><IconChevronRight size={16} /></button>
        </div>
        <div className="flex gap-0.5 mt-2">{cols.map((c, i) => <button key={i} onClick={() => setAlpIdx(i)} title={`${c.level} · ${c.age}`} className="flex-1 h-1.5 rounded-full" style={{ background: i === alpIdx ? color : "#e2e8f0" }} />)}</div>
        <div className="flex items-center justify-between mt-3">
          <div className="flex gap-1">{[["current", "This level"], ["range", "± 1 level"], ["all", "Full pathway"]].map(([v, label]) => (
            <button key={v} onClick={() => setAlpFilter(v)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md border" style={alpFilter === v ? { background: color, borderColor: color, color: "#fff" } : { borderColor: "#e2e8f0", color: "#64748b" }}>{label}</button>
          ))}</div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">{[1, 2, 3, 4].map((s) => <span key={s} className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: SCORE_STYLE[s].bg }} />{SCORE_STYLE[s].label}</span>)}</div>
        </div>
      </div>
      <div className="space-y-4">
        {Object.entries(grouped).map(([fam, list]) => {
          const visible = list.filter((x) => x.show);
          if (!visible.length) return null;
          return (
            <div key={fam}>
              <div className="flex items-center gap-2 mb-1.5"><span className="w-1.5 h-4 rounded" style={{ background: color }} /><h3 className="disp text-[15px] font-bold uppercase tracking-wide text-slate-700">{fam}</h3><span className="text-[11px] text-slate-400">{visible.length}</span></div>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {visible.map((entry) => {
                  const key = `ALP::${app}::${entry.i}`;
                  const isSel = !!selected[key];
                  const tag = entry.status === "stretch" ? { t: "Stretch", c: "#7c3aed" } : entry.status === "support" ? { t: "Support", c: "#0d9488" } : null;
                  return (
                    <div key={key} className="px-3 py-2.5" style={{ opacity: entry.status === "none" ? 0.5 : 1 }}>
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleAlp(app, entry.i, entry, col.level)} aria-pressed={isSel} className="mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0" style={isSel ? { background: color, borderColor: color } : { borderColor: "#cbd5e1" }}>{isSel && <IconCheck size={14} color="#fff" strokeWidth={3} />}</button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => toggleAlp(app, entry.i, entry, col.level)} className="text-left text-sm font-medium text-slate-800 leading-snug">{entry.s}</button>
                            {entry.d && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "#f1f5f9", color: "#475569" }}>{entry.d}</span>}
                            {tag && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tag.c + "1a", color: tag.c }}>{tag.t}</span>}
                          </div>
                          <div className="flex gap-0.5 mt-1.5">{cols.map((c, ci) => { const s = entry.t[ci]; return <div key={ci} title={`${c.level} (${c.age}): ${s ? SCORE_STYLE[s].label : "—"}`} className="flex-1 h-5 rounded-sm flex items-center justify-center text-[9px] font-bold" style={{ background: s ? SCORE_STYLE[s].bg : "#f8fafc", color: s ? SCORE_STYLE[s].fg : "#cbd5e1", border: ci === alpIdx ? `2px solid ${color}` : "1px solid #eef2f6" }}>{s || ""}</div>; })}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------- GymOrgPro --
function GymOrgPanel(props) {
  const {
    gymorg, gymorgError, fileInputRef, handleFile,
    gBlockId, setGBlockId, gSquadId, setGSquadId,
    gSessions, gSessionIdx, goToSession, gWeek, setGWeek, weeksDiffer,
    gLegs, stationMap, setStationMap, gSquad, squadMap, setSquadMap,
    alpMap, setAlpMap, gAlpIdx, prefillMode, setPrefillMode,
    jumpToLeg, applyPrefillToRotation, nextLesson, prevLesson, activeTab,
  } = props;

  if (!gymorg) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <div className="flex items-center gap-2 mb-1"><IconLayers size={16} style={{ color: NAVY }} /><h3 className="disp font-bold text-slate-800">Import from GymOrgPro</h3></div>
        <p className="text-sm text-slate-500 mb-3">In GymOrgPro, go to <b>Organisation → Export backup</b> and download the .json file. Load it here to pick a Block and Squad and pull in that squad&rsquo;s rotation automatically.</p>
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="disp font-semibold text-sm text-white rounded-lg py-2 px-4 inline-flex items-center gap-1.5" style={{ background: NAVY }}><IconUpload size={15} /> Choose backup .json</button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />
        {gymorgError && <p className="text-sm text-red-600 mt-2">{gymorgError}</p>}
      </div>
    );
  }

  const blocks = gymorg.blocks;
  const squads = gymorg.squads;
  const gCurrent = gSessions[gSessionIdx];
  const stationsUsed = Array.from(new Set((gLegs || []).map((l) => l.stationId))).map((id) => gymorg.stations.find((s) => s.id === id)).filter(Boolean);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3"><IconLayers size={16} style={{ color: NAVY }} /><h3 className="disp font-bold text-slate-800">GymOrgPro{gymorg.gymName ? ` · ${gymorg.gymName}` : ""}</h3>
        <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="ml-auto text-[11px] text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"><IconUpload size={12} /> Replace file</button>
        <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFile} className="hidden" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1"><IconCalendar size={12} /> Block</span>
          <select value={gBlockId} onChange={(e) => setGBlockId(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {blocks.map((b) => <option key={b.id} value={b.id}>{b.name}{b.startDate ? ` (${b.startDate} – ${b.endDate})` : ""}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1"><IconUsers size={12} /> Squad</span>
          <select value={gSquadId} onChange={(e) => setGSquadId(e.target.value)} className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {squads.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
      </div>

      {gSquad && (
        <div className="flex flex-wrap gap-3 items-center mb-3 text-sm">
          <label className="flex items-center gap-1.5 text-slate-600">Maps to Chalk level:
            <select value={squadMap[gSquad.id] || ""} onChange={(e) => { const m = { ...squadMap, [gSquad.id]: e.target.value }; setSquadMap(m); LS.set("chalk-gymorg-squadmap", m); }} className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm">
              <option value="">— choose —</option>
              {ALL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-slate-600">ALP working level:
            <select value={gAlpIdx} onChange={(e) => { const m = { ...alpMap, [gSquad.id]: Number(e.target.value) }; setAlpMap(m); LS.set("chalk-gymorg-alpmap", m); }} className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm">
              {(CHALK_ALP.cols || []).map((c, i) => <option key={i} value={i}>{c.level}</option>)}
            </select>
          </label>
        </div>
      )}

      {!gSessions.length ? (
        <p className="text-sm text-slate-400 bg-slate-50 border border-dashed border-slate-300 rounded-lg p-3">This squad has no scheduled sessions in this block.</p>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={prevLesson} className="w-8 h-8 rounded-lg border border-slate-300 flex items-center justify-center text-slate-600"><IconChevronLeft size={16} /></button>
            <select value={gSessionIdx} onChange={(e) => goToSession(Number(e.target.value))} className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {gSessions.map((s, i) => <option key={i} value={i}>{GB.DAY_NAMES[s.weekday]} {GB.fmtTime(s.session.startTime)} · {s.session.duration} min{s.session.label && s.session.label !== "Session" ? ` (${s.session.label})` : ""}</option>)}
            </select>
            <button onClick={nextLesson} className="disp font-semibold text-sm text-white rounded-lg px-3 py-2 flex items-center gap-1" style={{ background: NAVY }}>Next lesson <IconChevronRight size={16} /></button>
          </div>

          {weeksDiffer && (
            <div className="flex gap-1 mb-3">
              {["week1", "week2"].map((w) => <button key={w} onClick={() => setGWeek(w)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md border" style={gWeek === w ? { background: NAVY, borderColor: NAVY, color: "#fff" } : { borderColor: "#e2e8f0", color: "#64748b" }}>{w === "week1" ? "Week 1" : "Week 2"}</button>)}
            </div>
          )}

          <div className="mb-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Rotation this session</div>
            <div className="flex flex-wrap gap-1.5">
              {gLegs.map((leg, i) => {
                const stName = GB.stationName(gymorg, leg.stationId) || "Unassigned";
                const appName = stationMap[leg.stationId];
                const active = appName === activeTab;
                const c = APP_COLORS[appName] || "#94a3b8";
                return (
                  <button key={i} onClick={() => jumpToLeg(leg.stationId)} disabled={!appName}
                    className="disp text-sm font-semibold px-3 py-1.5 rounded-full border flex items-center gap-1.5 disabled:opacity-50"
                    style={active ? { background: c, borderColor: c, color: "#fff" } : { background: "#fff", borderColor: "#e2e8f0", color: "#334155" }}>
                    {stName}{appName && appName !== stName ? ` → ${appName}` : ""} <span className="text-[10px] opacity-80">{leg.minutes}m</span>
                  </button>
                );
              })}
            </div>
            {stationsUsed.some((s) => !stationMap[s.id]) && (
              <div className="mt-2 space-y-1.5">
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">Map each station name to a Chalk apparatus tab so it links up:</div>
                {stationsUsed.filter((s) => !stationMap[s.id]).map((s) => (
                  <label key={s.id} className="flex items-center gap-2 text-sm text-slate-600">
                    {s.name} →
                    <select value={stationMap[s.id] || ""} onChange={(e) => { const m = { ...stationMap, [s.id]: e.target.value }; setStationMap(m); LS.set("chalk-gymorg-stationmap", m); }} className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-sm">
                      <option value="">— choose —</option>
                      {allChalkApparatus().map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[["fresh", "Fresh suggestions"], ["last", "Same as last time"]].map(([v, label]) => (
                <button key={v} onClick={() => setPrefillMode(v)} className="text-[11px] font-semibold px-2.5 py-1 rounded-md border" style={prefillMode === v ? { background: NAVY, borderColor: NAVY, color: "#fff" } : { borderColor: "#e2e8f0", color: "#64748b" }}>{label}</button>
              ))}
            </div>
            <button onClick={applyPrefillToRotation} className="ml-auto disp font-semibold text-sm rounded-lg px-3 py-1.5 border flex items-center gap-1.5 text-slate-700 border-slate-300 hover:border-slate-400"><IconRefresh size={14} /> Prefill this session</button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Tap a rotation chip to jump straight to that apparatus tab, filtered to this squad&rsquo;s working level. Ticked skills are saved automatically so &ldquo;Same as last time&rdquo; carries forward next visit.</p>
        </>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ChalkApp />);
