#!/usr/bin/env node
/**
 * add-gcc-call.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Processes a GCC call's Teams attendance report and optionally updates the
 * new-member attendance tracking in public/analytics.json.
 *
 * USAGE
 * ─────
 *   # Add a new call to gccCallOverview (3-call July overview tab):
 *   node scripts/add-gcc-call.js --teams <attendance.xlsx> [--members <new-members.csv>]
 *
 *   # Update the new-member attendance tracking only (meetingAttendance block):
 *   node scripts/add-gcc-call.js --teams <attendance.xlsx> --members <new-members.csv> --tracking-only
 *
 * FLAGS
 * ─────
 *   --teams <file>       Path to the Teams attendance report xlsx (required)
 *   --members <file>     Path to the new-members CSV (optional — needed for new-member tracking)
 *   --date <YYYY-MM-DD>  Override call date (default: parsed from xlsx)
 *   --tracking-only      Only update meetingAttendance block, not gccCallOverview
 *   --dry-run            Print what would change without writing
 *
 * TEAMS XLSX FORMAT (standard download from Teams)
 * ─────────────────────────────────────────────────
 * Section 1 — Summary:     Meeting title | value rows (Total, Start/End/Duration, Avg time)
 * Section 2 — Participants: Name | First Join | Last Leave | In-Meeting Duration | Email (UPN)
 * Section 3 — In-Meeting Activities: Participant Name | Action | Timestamp
 * Section 4 — Audio and Video Consent: Name | Email
 *
 * NEW MEMBERS CSV FORMAT
 * ──────────────────────
 * Expected columns (case-insensitive): Name, Email, Joined (join date)
 * Any other columns are ignored.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ANALYTICS_PATH = resolve(process.cwd(), "public/analytics.json");

// ── Parse CLI flags ───────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
};
const hasFlag = (name) => args.includes(name);

const teamsFile    = flag("--teams");
const membersFile  = flag("--members");
const dateOverride = flag("--date");
const trackingOnly = hasFlag("--tracking-only");
const dryRun       = hasFlag("--dry-run");

if (!teamsFile) {
  console.error("❌  Usage: node scripts/add-gcc-call.js --teams <attendance.xlsx> [--members <new-members.csv>]");
  process.exit(1);
}

// ── Load xlsx + csv ───────────────────────────────────────────────────────────
async function loadXlsx() {
  try {
    const mod = await import("xlsx");
    return mod.default ?? mod;
  } catch {
    console.error("❌  The 'xlsx' package is not installed.\n    Run: npm install --save-dev xlsx");
    process.exit(1);
  }
}

function parseDate(raw) {
  // Teams uses formats like "7/14/2026 11:00 AM" or "Jul 14, 2026"
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}

function shortDate(d) {
  // "Jul 14" format
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fullDate(d) {
  // "Jul 14, 2026"
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

// ── Parse Teams attendance xlsx ───────────────────────────────────────────────
async function parseTeamsReport(xlsxPath) {
  const XLSX  = await loadXlsx();
  const wb    = XLSX.readFile(resolve(process.cwd(), xlsxPath));
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  const result = {
    title:           "Growth Community Call (GCC)",
    callDate:        null,
    duration:        null,
    avgAttendanceTime: null,
    totalAttendees:  0,
    participants:    [],  // { name, email, joinTime, durationSecs }
    activities:      [],  // { name, action }
  };

  let section = 0; // 0=preamble, 1=Summary, 2=Participants, 3=Activities, 4=Consent

  for (const row of rows) {
    const cells = row.map(c => String(c ?? "").trim());
    const joined = cells.join(" ").toLowerCase();

    // Detect section headers
    if (joined.includes("1. summary"))    { section = 1; continue; }
    if (joined.includes("2. participant")) { section = 2; continue; }
    if (joined.includes("3. in-meeting")) { section = 3; continue; }
    if (joined.includes("4. audio"))      { section = 4; continue; }

    if (cells.every(c => c === "")) continue; // blank row

    if (section === 1) {
      // Summary key-value pairs
      if (/meeting title/i.test(cells[0]) && cells[1]) result.title = cells[1];
      if (/start time/i.test(cells[0])    && cells[1]) result.callDate = parseDate(cells[1]);
      if (/meeting duration/i.test(cells[0]) && cells[1]) {
        // "1h 5m 00s" or "46m 14s" or raw seconds
        result.duration = cells[1].trim();
      }
      if (/average.*attendance/i.test(cells[0]) && cells[1]) {
        result.avgAttendanceTime = cells[1].trim();
      }
      if (/attended participants/i.test(cells[0]) && cells[1]) {
        result.totalAttendees = parseInt(cells[1]) || 0;
      }
    }

    if (section === 2) {
      // Skip the header row
      if (/name/i.test(cells[0]) && /join/i.test(cells[1])) continue;
      const name = cells[0];
      if (!name || name.toLowerCase() === "name") continue;
      const joinTime = cells[1] ? String(cells[1]).trim() : null;
      // Duration in "HH:MM:SS" or seconds
      let durationSecs = 0;
      const durStr = cells[3];
      if (durStr) {
        const parts = String(durStr).split(":").map(Number);
        if (parts.length === 3) durationSecs = parts[0]*3600 + parts[1]*60 + parts[2];
        else if (parts.length === 2) durationSecs = parts[0]*60 + parts[1];
        else durationSecs = Number(durStr) || 0;
      }
      const email = cells[4] || "";
      result.participants.push({ name, email, joinTime, durationSecs });
    }

    if (section === 3) {
      if (/participant/i.test(cells[0])) continue; // header
      const name = cells[0];
      if (!name) continue;
      result.activities.push({ name, action: cells[1] });
    }
  }

  // Fall back: if totalAttendees wasn't in summary, use participant count
  if (result.totalAttendees === 0) result.totalAttendees = result.participants.length;

  return result;
}

// ── Parse new-members CSV ─────────────────────────────────────────────────────
function parseMembersCsv(csvPath) {
  const text = readFileSync(resolve(process.cwd(), csvPath), "utf-8");
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.toLowerCase().replace(/[^a-z]/g, ""));

  const nameCol   = header.findIndex(h => h.includes("name"));
  const emailCol  = header.findIndex(h => h.includes("email") || h.includes("mail"));
  const joinedCol = header.findIndex(h => h.includes("join") || h.includes("date"));

  if (nameCol === -1) {
    console.error("❌  Members CSV must have a 'Name' column.");
    process.exit(1);
  }

  return lines.slice(1).map((line, i) => {
    const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
    return {
      id:          `nm${i + 1}`,
      name:        cols[nameCol]  || "",
      email:       emailCol  !== -1 ? (cols[emailCol]  || "") : "",
      joinedSlack: joinedCol !== -1 ? (cols[joinedCol] || "") : "",
    };
  }).filter(m => m.name);
}

// ── Cross-reference: who attended? ───────────────────────────────────────────
function crossReference(members, participants, activities) {
  const activityCount = {};
  for (const a of activities) {
    const key = a.name.toLowerCase().trim();
    activityCount[key] = (activityCount[key] || 0) + 1;
  }

  return members.map(m => {
    const nameLower = m.name.toLowerCase().trim();
    const match = participants.find(p => p.name.toLowerCase().trim() === nameLower);

    if (!match) {
      return { ...m, attended: false };
    }

    // Extract time-only from join timestamp (e.g. "7/14/2026 11:30 AM" → "11:30 AM")
    let joinTime = match.joinTime;
    if (joinTime) {
      const timeMatch = joinTime.match(/\d{1,2}:\d{2}\s*[AP]M/i);
      if (timeMatch) joinTime = timeMatch[0];
    }

    const engagementActions = activityCount[nameLower] || 0;
    return {
      ...m,
      attended:          true,
      joinTime,
      engagementActions,
    };
  });
}

// ── Build a label like "Jul14" for use as a filter key ────────────────────────
function callKey(d) {
  const mon = d.toLocaleDateString("en-US", { month: "short" }).toLowerCase();
  const day = d.getDate();
  return `${mon}${day}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Parse the Teams report
  const absTeams = resolve(process.cwd(), teamsFile);
  if (!existsSync(absTeams)) { console.error(`❌  File not found: ${absTeams}`); process.exit(1); }

  console.log(`📂  Parsing Teams attendance: ${teamsFile}`);
  const report = await parseTeamsReport(teamsFile);

  // Determine call date
  let callDate = report.callDate;
  if (dateOverride) callDate = new Date(dateOverride);
  if (!callDate || isNaN(callDate)) {
    console.error("❌  Could not determine call date from the xlsx. Use --date YYYY-MM-DD to set it manually.");
    process.exit(1);
  }

  console.log(`    Date     : ${fullDate(callDate)}`);
  console.log(`    Duration : ${report.duration}`);
  console.log(`    Attendees: ${report.totalAttendees}`);
  console.log(`    Avg time : ${report.avgAttendanceTime}`);

  // Parse new members if provided
  let members = [];
  if (membersFile) {
    const absMembers = resolve(process.cwd(), membersFile);
    if (!existsSync(absMembers)) { console.error(`❌  File not found: ${absMembers}`); process.exit(1); }
    console.log(`📂  Parsing new members: ${membersFile}`);
    members = parseMembersCsv(membersFile);
    console.log(`    New members: ${members.length}`);
  }

  // Cross-reference
  const newMembersWithAttendance = members.length > 0
    ? crossReference(members, report.participants, report.activities)
    : [];

  const attended = newMembersWithAttendance.filter(m => m.attended);
  const absent   = newMembersWithAttendance.filter(m => !m.attended);

  if (members.length > 0) {
    console.log(`    ↳ Attended any call : ${attended.length} (${Math.round(attended.length / members.length * 100)}%)`);
    console.log(`    ↳ Did not attend    : ${absent.length}`);
  }

  // ── Load analytics.json ──────────────────────────────────────────────────
  const analytics = JSON.parse(readFileSync(ANALYTICS_PATH, "utf-8"));
  const today     = new Date().toISOString().slice(0, 10);
  const cKey      = callKey(callDate); // e.g. "jul14"

  // ── Update meetingAttendance block ───────────────────────────────────────
  if (members.length > 0) {
    // Build the allAttendees list from the full participants list
    const attendeeNames = new Set(newMembersWithAttendance.filter(m => m.attended).map(m => m.name.toLowerCase()));
    const allAttendees = report.participants.map(p => ({
      name:              p.name,
      joinTime:          (() => {
        if (!p.joinTime) return "";
        const m = p.joinTime.match(/\d{1,2}:\d{2}\s*[AP]M/i);
        return m ? m[0] : p.joinTime;
      })(),
      engagementActions: (analytics.gccCallOverview?.coreAttendees ?? [])
        .reduce((_, __) => 0, 0), // will be recalculated
      isNewMember:       attendeeNames.has(p.name.toLowerCase()),
    }));

    // Recalculate engagement for allAttendees
    const actMap = {};
    for (const a of report.activities) {
      const k = a.name.toLowerCase().trim();
      actMap[k] = (actMap[k] || 0) + 1;
    }
    for (const a of allAttendees) {
      a.engagementActions = actMap[a.name.toLowerCase().trim()] || 0;
    }

    analytics.meetingAttendance = {
      meetingTitle:       report.title,
      meetingDate:        fullDate(callDate),
      meetingDuration:    report.duration    || "—",
      totalAttendees:     report.totalAttendees,
      avgAttendanceTime:  report.avgAttendanceTime || "—",
      newMemberCount:     members.length,
      newMembersAttended: attended.length,
      newMembersAbsent:   absent.length,
      newMembers:         newMembersWithAttendance,
      allAttendees,
    };
    console.log(`✅  meetingAttendance updated`);
  }

  // ── Update gccCallOverview block (unless --tracking-only) ────────────────
  if (!trackingOnly && analytics.gccCallOverview) {
    const gcc = analytics.gccCallOverview;

    // Check if this call date already exists
    const existing = gcc.calls.find(c => c.date === cKey);
    if (existing) {
      console.log(`ℹ️   Call '${cKey}' already exists in gccCallOverview — updating in place.`);
      existing.attendees        = report.totalAttendees;
      existing.duration         = report.duration    || existing.duration;
      existing.avgAttendanceTime = report.avgAttendanceTime || existing.avgAttendanceTime;
      existing.fullDate         = fullDate(callDate);
    } else {
      // Add new call
      gcc.calls.push({
        date:              cKey,
        fullDate:          fullDate(callDate),
        attendees:         report.totalAttendees,
        duration:          report.duration    || "—",
        avgAttendanceTime: report.avgAttendanceTime || "—",
      });
      console.log(`✅  gccCallOverview: added call '${cKey}'`);
    }

    // Add this call's attendee list as a named key (e.g. gcc["jul14Attendees"])
    const attendeeListKey = `${cKey}Attendees`;
    gcc[attendeeListKey] = report.participants.map(p => p.name);

    // Rebuild attendanceTrend from all calls
    gcc.attendanceTrend = gcc.calls.map(c => ({
      date:      c.date,
      attendees: c.attendees,
    }));

    // Recalculate summary stats (union across all call attendee lists)
    const allCallKeys  = gcc.calls.map(c => c.date);
    const listsPresent = allCallKeys.map(k => (gcc[`${k}Attendees`] ?? []).map(n => n.toLowerCase()));

    const attendanceCounts = {};
    for (const list of listsPresent) {
      for (const name of list) {
        attendanceCounts[name] = (attendanceCounts[name] || 0) + 1;
      }
    }

    const n = allCallKeys.length;
    const allNames = Object.keys(attendanceCounts);
    const totalUnique = allNames.length;

    const attended1 = allNames.filter(nm => attendanceCounts[nm] === 1).length;
    const attended2 = allNames.filter(nm => attendanceCounts[nm] === 2).length;
    const attendedAll = allNames.filter(nm => attendanceCounts[nm] === n).length;

    gcc.summary = {
      totalUnique,
      avgAttendees: Math.round(gcc.calls.reduce((s, c) => s + c.attendees, 0) / gcc.calls.length),
      attendedAll3:      attendedAll,
      attendedExactly2:  attended2,
      attendedExactly1:  attended1,
    };

    // Update cross-call breakdown
    gcc.crossCallBreakdown = [];
    for (let k = n; k >= 1; k--) {
      const count = allNames.filter(nm => attendanceCounts[nm] === k).length;
      gcc.crossCallBreakdown.push({
        label: k === n ? `All ${n} calls` : `Exactly ${k} call${k > 1 ? "s" : ""}`,
        count,
      });
    }

    // Update core attendees (attended all calls)
    gcc.coreAttendees = Object.entries(attendanceCounts)
      .filter(([, v]) => v === n)
      .map(([name]) => report.participants.find(p => p.name.toLowerCase() === name)?.name ?? name);

    console.log(`✅  gccCallOverview: ${totalUnique} unique, ${attendedAll} core, avg ${gcc.summary.avgAttendees}`);
  }

  // ── Stamp metadata ────────────────────────────────────────────────────────
  analytics._meta = {
    ...analytics._meta,
    lastUpdated: today,
    updatedBy:   `add-gcc-call.js — ${teamsFile.split("/").pop()}`,
  };

  // ── Dry run or write ──────────────────────────────────────────────────────
  if (dryRun) {
    console.log("\n🔎  Dry run — no file written. Resulting analytics.json would be:\n");
    console.log(JSON.stringify(analytics, null, 2).slice(0, 2000) + "\n...(truncated)");
  } else {
    writeFileSync(ANALYTICS_PATH, JSON.stringify(analytics, null, 2), "utf-8");
    console.log(`\n✅  analytics.json updated — ${today}`);
    console.log(`    Run 'npm run build' then push to deploy.`);
  }
}

main().catch(err => {
  console.error("❌ ", err.message);
  process.exit(1);
});
