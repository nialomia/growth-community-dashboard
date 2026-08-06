#!/usr/bin/env node
/**
 * gcc-update.js  —  Growth Community Dashboard · Full Update Orchestrator
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs three agents in parallel (Slack, SharePoint, GCC Attendance), each
 * returning a validated patch object. An Overview agent then assembles
 * everything, cross-validates, and either writes the result or prints a dry-run
 * summary for approval.
 *
 * USAGE
 * ─────
 *   node scripts/gcc-update.js [--folder <path>] [--dry-run] [--approve]
 *
 * FLAGS
 * ─────
 *   --folder <path>   Desktop folder containing export files.
 *                     Defaults to ~/Desktop/Growth Dashboard
 *   --dry-run         Show the full change summary without writing anything.
 *                     Bob uses this to present what changed for your approval.
 *   --approve         Skip the approval prompt and write immediately.
 *                     Used after you say "approve".
 *
 * FILE AUTO-DETECTION (inside the folder)
 * ────────────────────────────────────────
 *   Slack member list   — any .xlsx/.csv matching: member|names|email
 *   SharePoint export   — any .xlsx matching: siteanalytics|analytics|sharepoint
 *   GCC attendance      — any .xlsx matching: attendance
 *
 * Each agent is independent — if a file is missing that agent is skipped and a
 * warning is shown. The others still run.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { resolve, join, basename } from "path";
import { homedir } from "os";

const ANALYTICS_PATH  = resolve(process.cwd(), "public/analytics.json");
const DEFAULT_FOLDER  = join(homedir(), "Desktop", "Growth Dashboard");

// ── CLI flags ─────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const flag      = (name) => { const i = args.indexOf(name); return i !== -1 ? args[i + 1] : null; };
const hasFlag   = (name) => args.includes(name);
const FOLDER    = flag("--folder") ?? DEFAULT_FOLDER;
const DRY_RUN   = hasFlag("--dry-run") || !hasFlag("--approve");
const APPROVE   = hasFlag("--approve");

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n) { return Number(n).toLocaleString("en-US"); }
function pct(a, b) { return b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "—"; }
function sign(n) { return n >= 0 ? `+${n}` : String(n); }

async function loadXlsx() {
  try {
    const mod = await import("xlsx");
    return mod.default ?? mod;
  } catch {
    console.error("❌  The 'xlsx' package is not installed.\n    Run: npm install --save-dev xlsx");
    process.exit(1);
  }
}

function readSheet(wb, XLSX, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) return null;
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
}

function findCol(header, ...aliases) {
  const h = header.map(c => String(c ?? "").toLowerCase().trim());
  for (const alias of aliases) {
    const idx = h.findIndex(c => c.includes(alias.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── File auto-detection ───────────────────────────────────────────────────────
function detectFiles(folder) {
  if (!existsSync(folder)) {
    console.error(`❌  Folder not found: ${folder}`);
    console.error(`    Create it or pass --folder <path>`);
    process.exit(1);
  }
  const files = readdirSync(folder).map(f => join(folder, f));

  const match = (patterns) =>
    files.find(f => patterns.some(p => basename(f).toLowerCase().match(p))) ?? null;

  return {
    slack:      match([/names[-_]?emails?/i, /member.*download/i, /members?[-_]/i, /names?.*\.docx?$/i, /names?.*\.xlsx?$/i]),
    sharepoint: match([/siteanalyticsdata/i, /site.?analytics/i, /sharepoint/i]),
    attendance: match([/attendance.*report/i, /attendance/i]),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 1 — Slack / Member Count
// ─────────────────────────────────────────────────────────────────────────────
async function slackAgent(filePath, currentAnalytics) {
  const label = "SLACK AGENT";

  if (!filePath) {
    return { agent: label, status: "skipped", reason: "No member file found in folder", patch: {} };
  }

  const warnings = [];
  const patch    = {};
  const XLSX     = await loadXlsx();

  try {
    let totalMembers = 0;

    if (filePath.endsWith(".docx")) {
      // Names-emails.docx: count names from the "Names;" section
      const { default: AdmZip } = await import("adm-zip").catch(() => {
        throw new Error("adm-zip not installed — run: npm install --save-dev adm-zip");
      });
      const zip  = new AdmZip(filePath);
      const xml  = zip.readAsText("word/document.xml");
      const texts = [...xml.matchAll(/<w:t[^>]*>([^<]+)<\/w:t>/g)].map(m => m[1]);
      const full  = texts.join(" ");
      const start = full.indexOf("Names;");
      if (start === -1) throw new Error("Could not find 'Names;' section in docx");
      const names = full.slice(start + 6).split(",").map(n => n.trim()).filter(n => n.length > 2);
      totalMembers = names.length;
    } else {
      // xlsx / csv member download
      const wb    = XLSX.readFile(filePath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      // Count non-empty data rows (skip header)
      totalMembers = rows.slice(1).filter(r => r.some(c => c !== "")).length;
    }

    if (totalMembers === 0) throw new Error("Member count came out as 0 — check the file format");

    // Previous total from analytics.json
    const prevStr = currentAnalytics.kpis?.overview?.totalMembers?.value ?? "0";
    const prevTotal = parseInt(prevStr.replace(/,/g, ""), 10) || 0;
    const delta = totalMembers - prevTotal;

    // Baseline (Jun 11 = 697)
    const baseline = currentAnalytics.growthTrend?.[0]?.members ?? 697;
    const deltaFromBaseline = totalMembers - baseline;

    // Build growth trend snapshot
    const today     = new Date();
    const monthLabel = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    patch.memberCount    = totalMembers;
    patch.prevCount      = prevTotal;
    patch.delta          = delta;
    patch.deltaBaseline  = deltaFromBaseline;
    patch.baseline       = baseline;
    patch.monthLabel     = monthLabel;
    patch.growthTrendEntry = { month: monthLabel, members: totalMembers, active: 0, sharepoint: 0 };

    patch.kpis_overview_totalMembers = {
      value: fmt(totalMembers),
      trend: delta >= 0 ? "up" : "down",
      delta: `${sign(deltaFromBaseline)} since Jun 11`,
    };
    patch.kpis_overview_monthlyGrowth = {
      value: sign(delta),
      trend: delta >= 0 ? "up" : "down",
      delta: `${sign(delta)} (${pct(Math.abs(delta), prevTotal)}) since last snapshot`,
    };

    return { agent: label, status: "ok", file: basename(filePath), patch, warnings };

  } catch (err) {
    return { agent: label, status: "error", reason: err.message, patch: {} };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 2 — SharePoint
// ─────────────────────────────────────────────────────────────────────────────
async function sharepointAgent(filePath) {
  const label = "SHAREPOINT AGENT";
  if (!filePath) return { agent: label, status: "skipped", reason: "No SharePoint file found in folder", patch: {} };

  const warnings = [];
  const patch    = {};
  const XLSX     = await loadXlsx();

  try {
    const wb = XLSX.readFile(filePath);

    // ── Overall traffic (all-time totals) ─────────────────────────────────────
    const overallSheet = wb.SheetNames.find(s => /overall.?traffic/i.test(s));
    if (overallSheet) {
      const rows = readSheet(wb, XLSX, overallSheet);
      // First 4 rows are aggregate summary: Last 7 days / Last 30 days / Last 90 days / All time
      // Columns: Duration | Unique viewers | Site visits
      const aggRows = rows.filter(r => r[0] && typeof r[0] === "string" && /last|all/i.test(r[0]));

      const allTimeRow   = aggRows.find(r => /all.?time/i.test(String(r[0])));
      const last7Row     = aggRows.find(r => /last.?7/i.test(String(r[0])));
      const last30Row    = aggRows.find(r => /last.?30/i.test(String(r[0])));

      if (allTimeRow) {
        patch.allTimeViews  = Number(allTimeRow[2]) || 0;
        patch.allTimeUnique = Number(allTimeRow[1]) || 0;
      }
      if (last7Row)  patch.last7Views    = Number(last7Row[2])  || 0;
      if (last30Row) { patch.last30Views = Number(last30Row[2]) || 0; patch.last30Unique = Number(last30Row[1]) || 0; }

      // Build weekly trend from daily rows
      // SharePoint exports dates as Excel serial numbers (e.g. 46150.04)
      // Excel epoch = Jan 1 1900; JS epoch = Jan 1 1970 → offset = 25569 days
      const excelSerialToDate = (s) => new Date((s - 25569) * 86400000);
      const dailyRows = rows.filter(r => typeof r[0] === "number" && r[0] > 40000);
      const weeks = {};
      for (const r of dailyRows) {
        const d = excelSerialToDate(r[0]);
        if (isNaN(d)) continue;
        const dow = d.getDay();
        const mon = new Date(d); mon.setDate(d.getDate() - ((dow + 6) % 7));
        const key = mon.toISOString().slice(0, 10);
        if (!weeks[key]) weeks[key] = { visits: 0, unique: 0 };
        weeks[key].visits += (Number(r[2]) || 0);
        weeks[key].unique += (Number(r[1]) || 0);
      }
      const sortedWeeks = Object.keys(weeks).sort().filter(k => weeks[k].visits > 0).slice(-6);
      patch.sharepointTrend = sortedWeeks.map(k => {
        const start = new Date(k);
        const end   = new Date(k); end.setDate(end.getDate() + 6);
        const fmtD  = (d) => `${d.toLocaleDateString("en-US", { month: "short" })} ${d.getDate()}`;
        return { month: `${fmtD(start)}–${fmtD(end)}`, views: weeks[k].visits, unique: weeks[k].unique };
      });

      if (sortedWeeks.length === 0) warnings.push("Could not extract weekly trend — check date format in SharePoint export");
    } else {
      warnings.push("Sheet 'Overall Traffic' not found");
    }

    // ── Popular content ───────────────────────────────────────────────────────
    const popSheet = wb.SheetNames.find(s => /popular/i.test(s));
    if (popSheet) {
      const rows    = readSheet(wb, XLSX, popSheet);
      const header  = rows[0] ?? [];
      const titleCol = findCol(header, "content", "title", "name");
      const visCol   = findCol(header, "last 7 days visits", "visits", "views");
      const uvCol    = findCol(header, "last 7 days unique", "unique");

      const resources = rows.slice(1)
        .filter(r => r[titleCol] && r[visCol] > 0)
        .map((r, i) => ({
          id:        `sp${i + 1}`,
          title:     String(r[titleCol]).trim(),
          type:      "Document",
          owner:     "Growth Community team",
          views:     Number(r[visCol]) || 0,
          downloads: 0,
          freshness: "Current",
          month:     new Date().toLocaleDateString("en-US", { month: "short" }),
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      patch.sharepointResources = resources;
    } else {
      warnings.push("Sheet 'Popular content' not found");
    }

    // ── Build KPI patches ─────────────────────────────────────────────────────
    if (patch.allTimeViews) {
      patch.kpis_sharepoint_pageViews   = { value: fmt(patch.allTimeViews),  trend: "up", delta: "All time" };
      patch.kpis_sharepoint_uniqueViewers = { value: fmt(patch.allTimeUnique), trend: "up", delta: "All time" };
    }
    if (patch.last30Views) {
      patch.kpis_overview_sharepointViews = { value: fmt(patch.allTimeViews), trend: "up", delta: `+${fmt(patch.last7Views)} last 7 days` };
    }

    return { agent: label, status: "ok", file: basename(filePath), patch, warnings };

  } catch (err) {
    return { agent: label, status: "error", reason: err.message, patch: {} };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT 3 — GCC Attendance
// ─────────────────────────────────────────────────────────────────────────────
async function gccAgent(filePath) {
  const label = "GCC AGENT";
  if (!filePath) return { agent: label, status: "skipped", reason: "No attendance file found in folder", patch: {} };

  const warnings = [];
  const patch    = {};
  const XLSX     = await loadXlsx();

  try {
    const wb    = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

    let callDate = null, duration = null, avgTime = null, totalAttendees = 0;
    let section = 0;
    const participants = [];

    for (const row of rows) {
      const cells = row.map(c => String(c ?? "").trim());
      const joined = cells.join(" ").toLowerCase();

      if (joined.includes("1. summary"))     { section = 1; continue; }
      if (joined.includes("2. participant")) { section = 2; continue; }
      if (joined.includes("3. in-meeting"))  { section = 3; break; }
      if (cells.every(c => c === ""))        continue;

      if (section === 1) {
        if (/attended participants/i.test(cells[0])) totalAttendees = parseInt(cells[1]) || 0;
        if (/start time/i.test(cells[0]))            callDate       = cells[1];
        if (/meeting duration/i.test(cells[0]))      duration       = cells[1];
        if (/average.*attendance/i.test(cells[0]))   avgTime        = cells[1];
      }
      if (section === 2) {
        if (/^name$/i.test(cells[0])) continue;
        if (cells[0] && cells[0].toLowerCase() !== "name") participants.push(cells[0]);
      }
    }

    if (totalAttendees === 0) totalAttendees = participants.length;
    if (totalAttendees === 0) throw new Error("Could not read attendee count from attendance report");

    // Parse call date for label
    const d = new Date(callDate);
    const dateLabel = !isNaN(d)
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "Unknown date";
    const fullDateLabel = !isNaN(d)
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Unknown date";
    const callKey = !isNaN(d)
      ? d.toLocaleDateString("en-US", { month: "short" }).toLowerCase() + d.getDate()
      : basename(filePath).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8);

    patch.callDate          = callDate;
    patch.dateLabel         = dateLabel;
    patch.fullDateLabel     = fullDateLabel;
    patch.callKey           = callKey;
    patch.totalAttendees    = totalAttendees;
    patch.duration          = duration;
    patch.avgAttendanceTime = avgTime;
    patch.participants      = participants;

    // meetingAttendance block
    patch.meetingAttendance = {
      meetingTitle:      "Growth Community Call (GCC)",
      meetingDate:       fullDateLabel,
      meetingDuration:   duration   || "—",
      totalAttendees,
      avgAttendanceTime: avgTime    || "—",
      newMemberCount:    0,    // updated by overview agent if Slack patch available
      newMembersAttended: 0,
      newMembersAbsent:  0,
      allAttendees: participants.map(name => ({
        name,
        joinTime:          "—",
        engagementActions: 0,
        isNewMember:       false,
      })),
      newMembers: [],
    };

    // gccCallOverview entry
    patch.gccCallEntry = {
      date:              callKey,
      fullDate:          fullDateLabel,
      attendees:         totalAttendees,
      duration:          duration   || "—",
      avgAttendanceTime: avgTime    || "—",
    };

    return { agent: label, status: "ok", file: basename(filePath), patch, warnings };

  } catch (err) {
    return { agent: label, status: "error", reason: err.message, patch: {} };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERVIEW AGENT — Assembles patches, cross-validates, merges into analytics
// ─────────────────────────────────────────────────────────────────────────────
function overviewAgent(results, currentAnalytics) {
  const analytics   = JSON.parse(JSON.stringify(currentAnalytics)); // deep clone
  const changes     = [];
  const warnings    = [];

  const slackResult = results.find(r => r.agent === "SLACK AGENT");
  const spResult    = results.find(r => r.agent === "SHAREPOINT AGENT");
  const gccResult   = results.find(r => r.agent === "GCC AGENT");

  // ── Apply Slack patch ──────────────────────────────────────────────────────
  if (slackResult?.status === "ok") {
    const p = slackResult.patch;

    // growthTrend: replace last entry if same month, otherwise append
    const lastEntry = analytics.growthTrend.at(-1);
    if (lastEntry && lastEntry.month === p.monthLabel) {
      lastEntry.members = p.memberCount;
      changes.push(`📊 growthTrend: updated "${p.monthLabel}" → ${fmt(p.memberCount)} members`);
    } else {
      analytics.growthTrend.push(p.growthTrendEntry);
      changes.push(`📊 growthTrend: added snapshot "${p.monthLabel}" → ${fmt(p.memberCount)} members`);
    }

    analytics.kpis.overview.totalMembers  = p.kpis_overview_totalMembers;
    analytics.kpis.overview.monthlyGrowth = p.kpis_overview_monthlyGrowth;
    changes.push(`👥 Total members: ${fmt(p.prevCount)} → ${fmt(p.memberCount)} (${sign(p.delta)})`);
    changes.push(`📈 Growth since Jun 11 baseline: ${sign(p.deltaBaseline)}`);

    // Cross-validation: warn if delta seems too large
    if (Math.abs(p.delta) > 200) {
      warnings.push(`⚠️  Member delta is ${sign(p.delta)} — unusually large. Verify the file is the correct export.`);
    }
  }

  // ── Apply SharePoint patch ─────────────────────────────────────────────────
  if (spResult?.status === "ok") {
    const p = spResult.patch;

    if (p.sharepointTrend?.length > 0) {
      analytics.sharepointTrend = p.sharepointTrend;
      changes.push(`🌐 sharepointTrend: ${p.sharepointTrend.length} weekly buckets updated`);
    }
    if (p.sharepointResources?.length > 0) {
      analytics.sharepointResources = p.sharepointResources;
      changes.push(`📄 sharepointResources: ${p.sharepointResources.length} top resources`);
    }
    if (p.kpis_sharepoint_pageViews) {
      analytics.kpis.sharepoint.pageViews     = p.kpis_sharepoint_pageViews;
      analytics.kpis.sharepoint.uniqueViewers = p.kpis_sharepoint_uniqueViewers;
      analytics.kpis.overview.sharepointViews = p.kpis_overview_sharepointViews ?? analytics.kpis.overview.sharepointViews;
      changes.push(`🌐 SharePoint all-time: ${fmt(p.allTimeViews)} views, ${fmt(p.allTimeUnique)} unique`);
      if (p.last7Views) changes.push(`🌐 Last 7 days: ${fmt(p.last7Views)} views`);
    }

    // Cross-validation: views should not decrease
    const prevViews = parseInt((analytics.kpis.sharepoint.pageViews?.value ?? "0").replace(/,/g, ""), 10);
    if (p.allTimeViews && p.allTimeViews < prevViews) {
      warnings.push(`⚠️  SharePoint views dropped from ${fmt(prevViews)} → ${fmt(p.allTimeViews)}. All-time views should only increase.`);
    }
  }

  // ── Apply GCC patch ────────────────────────────────────────────────────────
  if (gccResult?.status === "ok") {
    const p = gccResult.patch;
    const gcc = analytics.gccCallOverview;

    // Update meetingAttendance
    analytics.meetingAttendance = p.meetingAttendance;
    changes.push(`📅 meetingAttendance: ${p.fullDateLabel}, ${p.totalAttendees} attendees, avg ${p.avgAttendanceTime}`);

    // Update gccCallOverview
    if (gcc) {
      const existing = gcc.calls.findIndex(c => c.date === p.callKey);
      if (existing !== -1) {
        gcc.calls[existing] = p.gccCallEntry;
        changes.push(`📅 gccCallOverview: updated call "${p.callKey}"`);
      } else {
        gcc.calls.push(p.gccCallEntry);
        changes.push(`📅 gccCallOverview: added new call "${p.callKey}" (${p.totalAttendees} attendees)`);
      }

      // Rebuild attendee list key
      gcc[`${p.callKey}Attendees`] = p.participants;

      // Rebuild trend
      gcc.attendanceTrend = gcc.calls.map(c => ({ date: c.date, attendees: c.attendees }));

      // Recalculate summary
      const allKeys  = gcc.calls.map(c => c.date);
      const allLists = allKeys.map(k => (gcc[`${k}Attendees`] ?? []).map(n => n.toLowerCase()));
      const counts   = {};
      for (const list of allLists) for (const name of list) counts[name] = (counts[name] || 0) + 1;
      const n = allKeys.length;
      const allNames = Object.keys(counts);

      gcc.summary = {
        totalUnique:      allNames.length,
        avgAttendees:     Math.round(gcc.calls.reduce((s, c) => s + c.attendees, 0) / gcc.calls.length),
        [`attendedAll${n}`]: allNames.filter(nm => counts[nm] === n).length,
        attendedExactly2: allNames.filter(nm => counts[nm] === 2).length,
        attendedExactly1: allNames.filter(nm => counts[nm] === 1).length,
      };
      gcc.crossCallBreakdown = [];
      for (let k = n; k >= 1; k--) {
        gcc.crossCallBreakdown.push({
          label: k === n ? `All ${n} calls` : `Exactly ${k} call${k > 1 ? "s" : ""}`,
          count: allNames.filter(nm => counts[nm] === k).length,
        });
      }
      gcc.coreAttendees = Object.entries(counts)
        .filter(([, v]) => v === n)
        .map(([nameLower]) => {
          for (const k of allKeys) {
            const match = (gcc[`${k}Attendees`] ?? []).find(pn => pn.toLowerCase() === nameLower);
            if (match) return match;
          }
          return nameLower;
        });

      changes.push(`📅 gccCallOverview: ${allNames.length} unique across ${n} calls, ${gcc.coreAttendees.length} core attendees`);
    }
  }

  // ── Stamp metadata ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const sources = results.filter(r => r.status === "ok").map(r => r.file).join(", ");
  analytics._meta = {
    lastUpdated: today,
    updatedBy:   `gcc-update.js — ${sources}`,
    note:        [
      slackResult?.status === "ok" ? `${fmt(slackResult.patch.memberCount)} members` : null,
      gccResult?.status   === "ok" ? `${gccResult.patch.totalAttendees} attendees (${gccResult.patch.dateLabel})` : null,
      spResult?.status    === "ok" ? `SP ${fmt(spResult.patch.allTimeViews)} views` : null,
    ].filter(Boolean).join(". ") + ".",
  };

  return { analytics, changes, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║   Growth Community Dashboard — Full Update           ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log(`📁  Scanning folder: ${FOLDER}`);
  const files = detectFiles(FOLDER);

  console.log(`\n   Slack member file  : ${files.slack      ? basename(files.slack)      : "⚠️  not found"}`);
  console.log(`   SharePoint export  : ${files.sharepoint  ? basename(files.sharepoint)  : "⚠️  not found"}`);
  console.log(`   GCC attendance     : ${files.attendance  ? basename(files.attendance)  : "⚠️  not found"}`);

  if (!files.slack && !files.sharepoint && !files.attendance) {
    console.error("\n❌  No recognised files found in the folder. Nothing to do.");
    console.error("    Expected files matching:");
    console.error("      Slack      — *member*.xlsx / *names*.docx");
    console.error("      SharePoint — *SiteAnalyticsData*.xlsx");
    console.error("      Attendance — *attendance*.xlsx");
    process.exit(1);
  }

  // Load current analytics.json
  const currentAnalytics = JSON.parse(readFileSync(ANALYTICS_PATH, "utf-8"));

  // ── Run agents in parallel ─────────────────────────────────────────────────
  console.log("\n⚡  Running agents in parallel...\n");
  const [slackResult, spResult, gccResult] = await Promise.all([
    slackAgent(files.slack, currentAnalytics),
    sharepointAgent(files.sharepoint),
    gccAgent(files.attendance),
  ]);

  const results = [slackResult, spResult, gccResult];

  // Print agent status
  for (const r of results) {
    const icon = r.status === "ok" ? "✅" : r.status === "skipped" ? "⏭️ " : "❌";
    const detail = r.status === "ok" ? r.file : r.reason;
    console.log(`   ${icon}  ${r.agent.padEnd(20)} ${detail}`);
    if (r.warnings?.length) r.warnings.forEach(w => console.log(`         ${w}`));
  }

  if (results.every(r => r.status !== "ok")) {
    console.error("\n❌  All agents failed or were skipped. analytics.json not changed.");
    process.exit(1);
  }

  // ── Overview agent assembles everything ────────────────────────────────────
  console.log("\n🔀  Overview agent assembling patches...\n");
  const { analytics, changes, warnings } = overviewAgent(results, currentAnalytics);

  // ── Summary report ─────────────────────────────────────────────────────────
  console.log("┌─────────────────────────────────────────────────────┐");
  console.log("│  WHAT CHANGED                                        │");
  console.log("└─────────────────────────────────────────────────────┘");
  changes.forEach(c => console.log(`  ${c}`));

  if (warnings.length > 0) {
    console.log("\n┌─────────────────────────────────────────────────────┐");
    console.log("│  WARNINGS                                            │");
    console.log("└─────────────────────────────────────────────────────┘");
    warnings.forEach(w => console.log(`  ${w}`));
  }

  // ── Dry run or write ───────────────────────────────────────────────────────
  if (DRY_RUN && !APPROVE) {
    console.log("\n┌─────────────────────────────────────────────────────┐");
    console.log("│  DRY RUN — nothing written                           │");
    console.log("└─────────────────────────────────────────────────────┘");
    console.log("  Review the changes above.");
    console.log("  To apply: node scripts/gcc-update.js --approve");
    console.log("  Or tell Bob: \"approve\"\n");
  } else {
    writeFileSync(ANALYTICS_PATH, JSON.stringify(analytics, null, 2), "utf-8");
    console.log("\n✅  analytics.json written.");
    console.log("    Next: git add public/analytics.json && git commit -m \"Data update\" && git push\n");
  }
}

main().catch(err => {
  console.error("\n❌  Fatal error:", err.message);
  process.exit(1);
});
