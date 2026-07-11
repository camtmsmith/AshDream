// ============================================================================
// GymOrgPro bridge — turns a GymOrgPro "backup" JSON export into the plain
// data Chalk needs to build a lesson: which squads/blocks/sessions exist,
// and — for any given session — the ordered rotation of stations (apparatus)
// the squad moves through, with minutes-per-leg.
//
// This file does NOT talk to GymOrgPro live. GymOrgPro and Chalk are separate
// artifacts/files, each with their own sandboxed storage, so the bridge is a
// file: in GymOrgPro use the "Export backup" button (Organisation tab), then
// load that .json here with the "Import from GymOrgPro" panel.
//
// Nothing here mutates the parsed data — every function is a pure read.
// ============================================================================
(function (global) {
  "use strict";

  function toMinutes(hhmm) {
    var parts = String(hhmm || "00:00").split(":").map(Number);
    var h = parts[0] || 0, m = parts[1] || 0;
    return h * 60 + m;
  }

  function weekdayOf(dayIndex) {
    return dayIndex % 7;
  }

  var DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Parses the raw JSON text from a GymOrgPro "Export backup" download.
  // Throws a friendly Error if the file doesn't look like a GymOrgPro backup.
  function parseBackup(jsonText) {
    var raw;
    try {
      raw = JSON.parse(jsonText);
    } catch (e) {
      throw new Error("That file isn't valid JSON. Use GymOrgPro's Organisation → Export backup file.");
    }
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.squads) || !Array.isArray(raw.stations)) {
      throw new Error("That JSON doesn't look like a GymOrgPro backup (missing squads/stations).");
    }
    var blocks = Array.isArray(raw.calendarBlocks) ? raw.calendarBlocks.slice() : [];
    blocks.sort(function (a, b) {
      return (a.startDate || "").localeCompare(b.startDate || "");
    });
    // Older single-location backups keep schedule/allocations/rotationLength
    // at the top level with no blocks at all — synthesize one block so the
    // rest of the bridge only ever has to deal with "a block".
    if (blocks.length === 0 && raw.schedule) {
      blocks.push({
        id: "__top_level__",
        name: "Current schedule",
        startDate: "",
        endDate: "",
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
      blocks: blocks,
    };
  }

  function squadName(parsed, squadId) {
    var s = (parsed.squads || []).find(function (x) { return x.id === squadId; });
    return s ? s.name : squadId;
  }

  function stationName(parsed, stationId) {
    var s = (parsed.stations || []).find(function (x) { return x.id === stationId; });
    return s ? s.name : "";
  }

  // Every scheduled session for one squad in one block, across the whole
  // 7-day weekly template (a squad can train the same weekday in both weeks
  // of a fortnight — those are returned as two entries with different
  // rotation results if the rotation grid differs week to week).
  function sessionsForSquad(block, squadId) {
    var out = [];
    var sched = (block.schedule || {})[squadId] || {};
    for (var wd = 0; wd < 7; wd++) {
      var sessions = sched[wd] || sched[String(wd)] || [];
      sessions.forEach(function (session) {
        out.push({ weekday: wd, session: session });
      });
    }
    out.sort(function (a, b) {
      if (a.weekday !== b.weekday) return a.weekday - b.weekday;
      return toMinutes(a.session.startTime) - toMinutes(b.session.startTime);
    });
    return out;
  }

  // The ordered rotation for one occurrence of a session (one specific
  // dayIndex 0-13). Consecutive ticks on the same station are merged into a
  // single "leg" with a combined duration.
  function legsForDayIndex(block, squadId, dayIndex, session) {
    var rl = block.rotationLength || 15;
    var startTick = Math.round(toMinutes(session.startTime) / rl);
    var endTick = startTick + Math.round((session.duration || rl) / rl);
    var legs = [];
    for (var tick = startTick; tick < endTick; tick++) {
      var day = (block.allocations || {})[dayIndex] || (block.allocations || {})[String(dayIndex)] || {};
      var atTick = day[tick] || day[String(tick)] || {};
      var stationId = atTick[squadId] || "";
      var last = legs[legs.length - 1];
      if (last && last.stationId === stationId) {
        last.ticks += 1;
      } else {
        legs.push({ stationId: stationId, ticks: 1 });
      }
    }
    return legs.map(function (l) {
      return { stationId: l.stationId, minutes: l.ticks * rl };
    });
  }

  // A session occurs on weekday `wd` in BOTH weeks of the 14-day rotation
  // cycle (dayIndex = wd and wd+7). The rotation can differ between the two
  // weeks (that's the whole point of a fortnightly cycle), so this returns
  // both, labelled "Week 1" / "Week 2".
  function rotationForSession(block, squadId, weekday, session) {
    return {
      week1: legsForDayIndex(block, squadId, weekday, session),
      week2: legsForDayIndex(block, squadId, weekday + 7, session),
    };
  }

  // Stable identity for a scheduled session, used as the key for prefill
  // history (what was ticked last time) and for "next/previous lesson" nav.
  function sessionKey(blockId, squadId, weekday, sessionId) {
    return [blockId, squadId, weekday, sessionId].join("::");
  }

  // Given the full list from sessionsForSquad (already sorted), find the
  // entry after/before the current one, wrapping around.
  function adjacentSession(list, currentSessionId, direction) {
    if (!list.length) return null;
    var idx = list.findIndex(function (x) { return x.session.id === currentSessionId; });
    if (idx === -1) idx = 0;
    var next = (idx + direction + list.length) % list.length;
    return list[next];
  }

  function fmtTime(hhmm) {
    var m = toMinutes(hhmm);
    var h24 = Math.floor(m / 60), mm = m % 60;
    var h12 = ((h24 + 11) % 12) + 1;
    var ampm = h24 < 12 ? "am" : "pm";
    return h12 + (mm ? ":" + String(mm).padStart(2, "0") : "") + ampm;
  }

  global.GymOrgBridge = {
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
  };
})(window);
