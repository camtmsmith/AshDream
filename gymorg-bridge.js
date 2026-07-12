// ============================================================================
// GymOrgPro bridge (V5) — turns a GymOrgPro "backup" JSON export into the plain
// data Chalk needs to individualise a lesson.
//
// V5 is a SUPERSET of V4: every V4 function is kept with the same signature, so
// existing Chalk code keeps working untouched. What's new is everything Chalk
// needs to stop thinking in "one repeating fortnight" and instead work off the
// REAL calendar, and to reuse what GymOrgPro already owns (headers, warm-ups,
// staff) rather than re-asking for it:
//
//   • datedSessions(parsed, block) — expands a block's start→end date range into
//     every actual dated session (not just a 14-day cycle), each with its
//     resolved rotation. This is the spine of "one plan per real lesson".
//   • resolveHeader / headerDataUri — which banner image a squad's plan uses,
//     with a sensible name-based guess until GymOrgPro stores it explicitly.
//   • warmupItems / warmdownItems / staffName — read GymOrgPro's own lesson-plan
//     setup so Chalk doesn't duplicate it.
//
// This file does NOT talk to GymOrgPro live. GymOrgPro exports a backup .json;
// Chalk reads it here. Every function is a pure read — nothing is mutated.
//
// KEY ANCHORING ASSUMPTION (see notes for GymOrgPro): the 14-day rotation grid
// (allocations, keyed by dayIndex 0-13) is anchored so that dayIndex 0 === the
// block's startDate. Chalk therefore maps a real date to its rotation with
// dayIndex = (date - startDate) days, mod 14 — and maps it to a session time
// with the date's own weekday (Mon=0). These are computed INDEPENDENTLY, so a
// block that starts on a day other than Monday still resolves correctly.
// ============================================================================
(function (global) {
  "use strict";

  var DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  var MS_PER_DAY = 86400000;

  // ---- small helpers --------------------------------------------------------

  function toMinutes(hhmm) {
    var parts = String(hhmm || "00:00").split(":").map(Number);
    var h = parts[0] || 0, m = parts[1] || 0;
    return h * 60 + m;
  }

  function weekdayOf(dayIndex) {
    return dayIndex % 7;
  }

  // Parse "YYYY-MM-DD" as a UTC midnight Date (avoids timezone/DST drift when we
  // subtract dates to count whole days).
  function parseISO(dstr) {
    var p = String(dstr || "").split("-").map(Number);
    if (p.length < 3 || !p[0]) return null;
    return new Date(Date.UTC(p[0], (p[1] || 1) - 1, p[2] || 1));
  }

  function isoOf(date) {
    return date.toISOString().slice(0, 10);
  }

  // Weekday with Monday=0 .. Sunday=6, matching GymOrgPro's schedule keys.
  function realWeekday(date) {
    return (date.getUTCDay() + 6) % 7;
  }

  function daysBetween(a, b) {
    return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
  }

  function fmtTime(hhmm) {
    var m = toMinutes(hhmm);
    var h24 = Math.floor(m / 60), mm = m % 60;
    var h12 = ((h24 + 11) % 12) + 1;
    var ampm = h24 < 12 ? "am" : "pm";
    return h12 + (mm ? ":" + String(mm).padStart(2, "0") : "") + ampm;
  }

  // ---- parse ----------------------------------------------------------------

  // Parses the raw JSON text from GymOrgPro's "Export backup" download. Throws a
  // friendly Error if the file doesn't look like a GymOrgPro backup. Returns a
  // normalised, read-only view. All V4 keys are preserved; V5 adds headers,
  // warmup, warmdown, staff, squadHeaderMap, activeBlockId, rotationLength.
  function parseBackup(jsonText) {
    var raw;
    try {
      raw = typeof jsonText === "string" ? JSON.parse(jsonText) : jsonText;
    } catch (e) {
      throw new Error("That file isn't valid JSON. Use GymOrgPro's Organisation \u2192 Export backup file.");
    }
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.squads) || !Array.isArray(raw.stations)) {
      throw new Error("That JSON doesn't look like a GymOrgPro backup (missing squads/stations).");
    }

    var blocks = Array.isArray(raw.calendarBlocks) ? raw.calendarBlocks.slice() : [];
    blocks.sort(function (a, b) {
      return String(a.startDate || "").localeCompare(String(b.startDate || ""));
    });
    // Older single-location backups keep schedule/allocations/rotationLength at
    // the top level with no blocks — synthesize one block so everything below
    // only ever has to deal with "a block".
    if (blocks.length === 0 && raw.schedule) {
      blocks.push({
        id: "__top_level__",
        name: "Current schedule",
        startDate: "",
        endDate: "",
        squadIds: Object.keys(raw.schedule || {}),
        schedule: raw.schedule || {},
        allocations: raw.allocations || {},
        rotationLength: raw.rotationLength || 15,
      });
    }

    return {
      gymName: raw.gymName || "",
      squads: raw.squads,
      squadTypes: raw.squadTypes || [],
      stations: raw.stations,
      staff: raw.staff || raw.coaches || [],
      headers: raw.lessonPlanHeaders || [],
      warmup: raw.lessonPlanWarmup || [],
      warmdown: raw.lessonPlanWarmdown || [],
      // Explicit squad->header map if GymOrgPro ever stores one (see notes).
      // Accepts either a top-level {squadId: headerId} map or a headerId on the
      // squad itself; resolveHeader() checks both, then falls back to a guess.
      squadHeaderMap: raw.squadHeaderMap || raw.lessonPlanSquadHeaders || {},
      // GymOrgPro's own lesson-plan entries: { [date]: { [squadId]: { [sessionId]:
      // { circuits:[{stationId, skillIds, kcp, safety}], warmDown, updatedAt } } } }
      // Chalk reads the coach's typed notes out of here (see lessonPlanFor).
      lessonPlans: raw.lessonPlans || {},
      blocks: blocks,
      activeBlockId: raw.activeScheduleBlockId || (blocks[0] && blocks[0].id) || null,
      rotationLength: raw.rotationLength || 15,
    };
  }

  // ---- lookups (V4) ---------------------------------------------------------

  function squadName(parsed, squadId) {
    var s = (parsed.squads || []).find(function (x) { return x.id === squadId; });
    return s ? s.name : squadId;
  }

  function stationName(parsed, stationId) {
    var s = (parsed.stations || []).find(function (x) { return x.id === stationId; });
    return s ? s.name : "";
  }

  function staffName(parsed, staffId) {
    if (!staffId) return "";
    var s = (parsed.staff || []).find(function (x) { return x.id === staffId; });
    return s ? s.name : "";
  }

  function blockById(parsed, id) {
    return (parsed.blocks || []).find(function (b) { return b.id === id; }) || null;
  }

  function activeBlock(parsed) {
    return blockById(parsed, parsed.activeBlockId) || (parsed.blocks || [])[0] || null;
  }

  // ---- rotation resolution (V4 core, reused by V5) --------------------------

  // The ordered rotation for one occurrence of a session on a specific dayIndex
  // (0-13). Consecutive ticks on the same station merge into one "leg". A leg
  // with an empty stationId is an unallocated gap (free time / break) and is
  // returned as { stationId:"", stationName:"", minutes, gap:true } so callers
  // can render it as "\u2014" rather than a mystery station.
  function legsForDayIndex(parsed, block, squadId, dayIndex, session) {
    var rl = block.rotationLength || parsed.rotationLength || 15;
    var startTick = Math.round(toMinutes(session.startTime) / rl);
    var endTick = startTick + Math.round((session.duration || rl) / rl);
    var acc = [];
    for (var tick = startTick; tick < endTick; tick++) {
      var day = (block.allocations || {})[dayIndex] || (block.allocations || {})[String(dayIndex)] || {};
      var atTick = day[tick] || day[String(tick)] || {};
      var stationId = atTick[squadId] || "";
      var last = acc[acc.length - 1];
      if (last && last.stationId === stationId) last.ticks += 1;
      else acc.push({ stationId: stationId, ticks: 1 });
    }
    return acc.map(function (l) {
      var name = l.stationId ? stationName(parsed, l.stationId) : "";
      return {
        stationId: l.stationId,
        stationName: name,
        minutes: l.ticks * rl,
        gap: !l.stationId,
      };
    });
  }

  // V4 signature kept for backward compatibility. Internally delegates to the
  // parsed-aware version by resolving station names against the block's own
  // squads/stations is unnecessary here (stationName needs `parsed`), so this
  // legacy variant returns stationId + minutes only, exactly as V4 did.
  function legsForDayIndexLegacy(block, squadId, dayIndex, session) {
    var rl = block.rotationLength || 15;
    var startTick = Math.round(toMinutes(session.startTime) / rl);
    var endTick = startTick + Math.round((session.duration || rl) / rl);
    var legs = [];
    for (var tick = startTick; tick < endTick; tick++) {
      var day = (block.allocations || {})[dayIndex] || (block.allocations || {})[String(dayIndex)] || {};
      var atTick = day[tick] || day[String(tick)] || {};
      var stationId = atTick[squadId] || "";
      var last = legs[legs.length - 1];
      if (last && last.stationId === stationId) last.ticks += 1;
      else legs.push({ stationId: stationId, ticks: 1 });
    }
    return legs.map(function (l) { return { stationId: l.stationId, minutes: l.ticks * rl }; });
  }

  // V4: every scheduled session for one squad across the weekly template.
  function sessionsForSquad(block, squadId) {
    var out = [];
    var sched = (block.schedule || {})[squadId] || {};
    for (var wd = 0; wd < 7; wd++) {
      var sessions = sched[wd] || sched[String(wd)] || [];
      sessions.forEach(function (session) { out.push({ weekday: wd, session: session }); });
    }
    out.sort(function (a, b) {
      if (a.weekday !== b.weekday) return a.weekday - b.weekday;
      return toMinutes(a.session.startTime) - toMinutes(b.session.startTime);
    });
    return out;
  }

  // V4: week1/week2 rotations for a template session (fortnight view).
  function rotationForSession(block, squadId, weekday, session) {
    return {
      week1: legsForDayIndexLegacy(block, squadId, weekday, session),
      week2: legsForDayIndexLegacy(block, squadId, weekday + 7, session),
    };
  }

  function sessionKey(blockId, squadId, weekday, sessionId) {
    return [blockId, squadId, weekday, sessionId].join("::");
  }

  function adjacentSession(list, currentSessionId, direction) {
    if (!list.length) return null;
    var idx = list.findIndex(function (x) { return x.session.id === currentSessionId; });
    if (idx === -1) idx = 0;
    var next = (idx + direction + list.length) % list.length;
    return list[next];
  }

  // ---- V5: real dated sessions ----------------------------------------------

  // Stable key for one real lesson occurrence — matches GymOrgPro's lessonPlans
  // nesting (date -> squad -> session) so saved plans line up on both sides.
  function datedKey(dateStr, squadId, sessionId) {
    return [dateStr, squadId, sessionId].join("::");
  }

  // Expand a block's start->end date range into EVERY actual dated session, each
  // with its resolved rotation. Returns a flat, sorted array of:
  //   { date, dow, weekday, dayIndex, week, squadId, squadName, session,
  //     sessionId, startTime, endTime, duration, coachName, assistantName,
  //     legs:[{stationId, stationName, minutes, gap}], key }
  // Sorted by date, then start time, then squad name. `week` is 1 or 2 (which
  // half of the fortnight the rotation came from) — informational only.
  function datedSessions(parsed, block) {
    block = block || activeBlock(parsed);
    if (!block) return [];
    var start = parseISO(block.startDate);
    var end = parseISO(block.endDate);
    if (!start || !end) return [];

    var squadIds = Array.isArray(block.squadIds) && block.squadIds.length
      ? block.squadIds
      : Object.keys(block.schedule || {});
    var rl = block.rotationLength || parsed.rotationLength || 15;
    var out = [];

    for (var d = new Date(start.getTime()); d.getTime() <= end.getTime(); d = new Date(d.getTime() + MS_PER_DAY)) {
      var weekday = realWeekday(d);
      var dayIndex = ((daysBetween(d, start) % 14) + 14) % 14;
      var dateStr = isoOf(d);
      for (var s = 0; s < squadIds.length; s++) {
        var sqId = squadIds[s];
        var daySessions = (block.schedule || {})[sqId] || {};
        var sessions = daySessions[weekday] || daySessions[String(weekday)] || [];
        for (var i = 0; i < sessions.length; i++) {
          var ses = sessions[i];
          out.push({
            date: dateStr,
            dow: DAY_NAMES[weekday],
            weekday: weekday,
            dayIndex: dayIndex,
            week: dayIndex < 7 ? 1 : 2,
            squadId: sqId,
            squadName: squadName(parsed, sqId),
            session: ses,
            sessionId: ses.id,
            startTime: ses.startTime,
            endTime: minutesToHHMM(toMinutes(ses.startTime) + (ses.duration || rl)),
            duration: ses.duration || rl,
            coachName: staffName(parsed, ses.coachId),
            assistantName: staffName(parsed, ses.assistantCoachId),
            legs: legsForDayIndex(parsed, block, sqId, dayIndex, ses),
            key: datedKey(dateStr, sqId, ses.id),
          });
        }
      }
    }

    out.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      var ta = toMinutes(a.startTime), tb = toMinutes(b.startTime);
      if (ta !== tb) return ta - tb;
      return a.squadName.localeCompare(b.squadName);
    });
    return out;
  }

  function minutesToHHMM(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  // Next / previous real lesson in a datedSessions list. Clamps at the ends
  // (real calendars have a first and last lesson) — returns null past an edge so
  // the UI can disable the button rather than wrap silently.
  function adjacentDated(list, index, direction) {
    var next = index + direction;
    if (next < 0 || next >= list.length) return null;
    return { index: next, item: list[next] };
  }

  // Only the sessions for one squad, from an already-built datedSessions list.
  function datedForSquad(list, squadId) {
    return list.filter(function (x) { return x.squadId === squadId; });
  }

  // ---- V5: headers ----------------------------------------------------------

  function headerById(parsed, headerId) {
    return (parsed.headers || []).find(function (h) { return h.id === headerId; }) || null;
  }

  function firstWord(s) {
    return String(s || "").trim().toLowerCase().split(/\s+/)[0] || "";
  }

  // Best-guess header for a squad by name, used to pre-fill the mapping before a
  // coach confirms it (and until GymOrgPro stores an explicit map). Matches when
  // the squad name starts with, or shares its first word with, a header name;
  // prefers the most specific (longest) matching header name. Returns a headerId
  // or null. e.g. "Fundamentals Blue" -> Fundamentals, "Springers" -> Springers,
  // "Competitive 3" -> null (no header family matches -> ask the coach).
  function guessHeaderId(parsed, squadId) {
    var sn = squadName(parsed, squadId).toLowerCase();
    var snFirst = firstWord(sn);
    var best = null, bestLen = -1;
    (parsed.headers || []).forEach(function (h) {
      var hn = String(h.name || "").trim().toLowerCase();
      if (!hn) return;
      var hit = sn === hn || sn.indexOf(hn) === 0 || snFirst === firstWord(hn);
      if (hit && hn.length > bestLen) { best = h.id; bestLen = hn.length; }
    });
    return best;
  }

  // Resolve which header a squad's plan should use, in priority order:
  //   1. explicit map in the backup (squadHeaderMap[squadId], or squad.headerId)
  //   2. a Chalk-side override map the coach has set   {squadId: headerId}
  //   3. the name-based guess
  // Returns the header object (with imageBase64/ext/width/height) or null.
  function resolveHeader(parsed, squadId, overrideMap) {
    var sq = (parsed.squads || []).find(function (x) { return x.id === squadId; }) || {};
    var id =
      (parsed.squadHeaderMap && parsed.squadHeaderMap[squadId]) ||
      sq.headerId ||
      (overrideMap && overrideMap[squadId]) ||
      guessHeaderId(parsed, squadId);
    return id ? headerById(parsed, id) : null;
  }

  // A data: URI for a header image, ready to drop into <img src> or a docx image.
  function headerDataUri(header) {
    if (!header || !header.imageBase64) return "";
    var ext = String(header.ext || "png").toLowerCase();
    if (ext === "jpg") ext = "jpeg";
    return "data:image/" + ext + ";base64," + header.imageBase64;
  }

  // ---- V5.7: GymOrgPro's own lesson-plan notes ------------------------------

  // The lesson plan a coach typed into GymOrgPro for ONE dated session, or null.
  // Shape: { circuits: [{stationId, skillIds, kcp, safety}], warmDown, updatedAt }
  // The circuits array is in rotation order, one per station block of that day.
  function lessonPlanFor(parsed, dateStr, squadId, sessionId) {
    var byDate = (parsed.lessonPlans || {})[dateStr] || {};
    var bySquad = byDate[squadId] || {};
    return bySquad[sessionId] || null;
  }

  // Line up GymOrgPro's circuits with Chalk's resolved legs. They're built from
  // the same allocation grid so index order normally matches exactly; where it
  // doesn't (e.g. a squad with two sessions in one day), fall back to matching on
  // stationId so a note still lands on the right rotation rather than the wrong
  // one. Returns an array the same length as legs, holding a circuit or null.
  function circuitsForLegs(plan, legs) {
    var cs = (plan && plan.circuits) || [];
    var used = {};
    return (legs || []).map(function (leg, i) {
      var c = cs[i];
      if (c && (!c.stationId || !leg.stationId || c.stationId === leg.stationId)) { used[i] = 1; return c; }
      var j = -1;
      for (var k = 0; k < cs.length; k++) {
        if (!used[k] && cs[k] && cs[k].stationId && cs[k].stationId === leg.stationId) { j = k; break; }
      }
      if (j >= 0) { used[j] = 1; return cs[j]; }
      return null;
    });
  }

  // ---- V5: warm-up / warm-down ---------------------------------------------

  function warmupItems(parsed) { return (parsed.warmup || []).slice(); }
  function warmdownItems(parsed) { return (parsed.warmdown || []).slice(); }

  // ---- export ---------------------------------------------------------------

  global.GymOrgBridge = {
    // V4 (unchanged signatures)
    parseBackup: parseBackup,
    squadName: squadName,
    stationName: stationName,
    sessionsForSquad: sessionsForSquad,
    rotationForSession: rotationForSession,
    sessionKey: sessionKey,
    adjacentSession: adjacentSession,
    weekdayOf: weekdayOf,
    toMinutes: toMinutes,
    fmtTime: fmtTime,
    DAY_NAMES: DAY_NAMES,
    // V5 additions
    blockById: blockById,
    activeBlock: activeBlock,
    datedSessions: datedSessions,
    datedForSquad: datedForSquad,
    adjacentDated: adjacentDated,
    datedKey: datedKey,
    staffName: staffName,
    headerById: headerById,
    guessHeaderId: guessHeaderId,
    resolveHeader: resolveHeader,
    headerDataUri: headerDataUri,
    warmupItems: warmupItems,
    warmdownItems: warmdownItems,
    lessonPlanFor: lessonPlanFor,
    circuitsForLegs: circuitsForLegs,
    realWeekday: realWeekday,
  };
})(typeof window !== "undefined" ? window : this);
