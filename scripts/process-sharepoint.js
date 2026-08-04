#!/usr/bin/env node
/**
 * process-sharepoint.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads a SharePoint "Site Analytics" xlsx export and patches the relevant
 * sections of public/analytics.json.
 *
 * USAGE
 * ─────
 *   node scripts/process-sharepoint.js <path-to-xlsx>
 *
 * EXAMPLE
 *   node scripts/process-sharepoint.js ~/Desktop/SiteAnalyticsData_4-Aug,2026.xlsx
 *
 * WHAT IT UPDATES IN analytics.json
 * ───────────────────────────────────
 *  kpis.sharepoint.pageViews      — all-time total views
 *  kpis.sharepoint.uniqueViewers  — all-time unique viewers
 *  kpis.sharepoint.avgEngagement  — desktop share (%)
 *  sharepointTrend                — weekly views + unique viewers (last 4 weeks)
 *  sharepointResources            — member-facing pages with view counts
 *  _meta.lastUpdated + updatedBy
 *
 * EXPECTED XLSX SHEETS
 * ─────────────────────
 *  "Overall Traffic"   — columns: Period | Views | Unique viewers
 *  "Usage by Device"   — columns: Device | Views | Unique viewers
 *  "Weekly Traffic"    — columns: Week | Views | Unique viewers  (most recent 4)
 *  "Pages"             — columns: Page title | URL | Views | Unique viewers
 *
 * These match the standard SharePoint "Site Analytics" export format.
 * If your export uses different column names, adjust COLUMN_MAP below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ANALYTICS_PATH = resolve(process.cwd(), "public/analytics.json");

// ── Column name aliases (lower-cased) ────────────────────────────────────────
const COLUMN_MAP = {
  period:        ["period", "date", "week", "month"],
  views:         ["views", "page views", "total views"],
  unique:        ["unique viewers", "unique users", "unique"],
  device:        ["device", "device type"],
  pageTitle:     ["page title", "title", "page name", "name"],
  url:           ["url", "page url", "path"],
};

function findCol(header, aliases) {
  const h = header.map(c => String(c ?? "").toLowerCase().trim());
  for (const alias of aliases) {
    const idx = h.indexOf(alias);
    if (idx !== -1) return idx;
  }
  // Substring match fallback
  for (const alias of aliases) {
    const idx = h.findIndex(c => c.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── Load xlsx via dynamic import (no compile step needed) ─────────────────────
async function loadXlsx() {
  try {
    const mod = await import("xlsx");
    return mod.default ?? mod;
  } catch {
    console.error(
      "❌  The 'xlsx' package is not installed.\n" +
      "    Run:  npm install --save-dev xlsx\n" +
      "    Then retry."
    );
    process.exit(1);
  }
}

function readSheet(workbook, XLSX, sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return null;
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
}

// ── Member-facing pages that should appear in the resources table ─────────────
// Add or remove pages here as the SharePoint site evolves.
// Keys are substrings of the page title (case-insensitive).
const MEMBER_FACING_PAGES = [
  "home",
  "homepage",
  "call",
  "recording",
  "resource",
  "guide",
  "about",
  "join",
  "event",
  "newsletter",
];

function isMemberFacing(title) {
  const t = String(title).toLowerCase();
  return MEMBER_FACING_PAGES.some(k => t.includes(k));
}

// ── Format a number as "3,603" ────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString("en-US");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2];
  if (!xlsxPath) {
    console.error("❌  Usage: node scripts/process-sharepoint.js <path-to-xlsx>");
    process.exit(1);
  }
  const absPath = resolve(process.cwd(), xlsxPath);
  if (!existsSync(absPath)) {
    console.error(`❌  File not found: ${absPath}`);
    process.exit(1);
  }

  console.log(`📂  Reading: ${absPath}`);
  const XLSX = await loadXlsx();
  const workbook = XLSX.readFile(absPath);

  console.log(`    Sheets found: ${workbook.SheetNames.join(", ")}`);

  // ── Load analytics.json ──────────────────────────────────────────────────
  const analytics = JSON.parse(readFileSync(ANALYTICS_PATH, "utf-8"));

  // ── 1. Overall Traffic (all-time totals) ─────────────────────────────────
  const overallRows = readSheet(workbook, XLSX, "Overall Traffic");
  if (overallRows && overallRows.length > 1) {
    const header = overallRows[0];
    const viCol = findCol(header, COLUMN_MAP.views);
    const uvCol = findCol(header, COLUMN_MAP.unique);

    // Find the "All time" or last row with highest views
    const dataRows = overallRows.slice(1).filter(r => r.some(c => c !== ""));
    let allTimeRow = dataRows.find(r => String(r[0]).toLowerCase().includes("all"));
    if (!allTimeRow) {
      // Fall back to highest-views row
      allTimeRow = dataRows.reduce((best, r) => (Number(r[viCol]) > Number(best[viCol]) ? r : best), dataRows[0]);
    }

    const totalViews   = Number(allTimeRow[viCol]) || 0;
    const totalUnique  = Number(allTimeRow[uvCol]) || 0;

    if (totalViews > 0) {
      analytics.kpis.sharepoint.pageViews = {
        value: fmt(totalViews),
        trend: "up",
        delta: "All time",
      };
      console.log(`✅  pageViews: ${fmt(totalViews)}`);
    }
    if (totalUnique > 0) {
      analytics.kpis.sharepoint.uniqueViewers = {
        value: fmt(totalUnique),
        trend: "up",
        delta: "All time",
      };
      console.log(`✅  uniqueViewers: ${fmt(totalUnique)}`);
    }
  } else {
    console.warn("⚠️   Sheet 'Overall Traffic' not found or empty — skipping totals.");
  }

  // ── 2. Usage by Device (desktop share) ───────────────────────────────────
  const deviceRows = readSheet(workbook, XLSX, "Usage by Device");
  if (deviceRows && deviceRows.length > 1) {
    const header = deviceRows[0];
    const devCol = findCol(header, COLUMN_MAP.device);
    const viCol  = findCol(header, COLUMN_MAP.views);

    const rows = deviceRows.slice(1).filter(r => r.some(c => c !== ""));
    const totalV = rows.reduce((s, r) => s + (Number(r[viCol]) || 0), 0);
    const desktopRow = rows.find(r => String(r[devCol]).toLowerCase().includes("desktop"));
    const desktopV = desktopRow ? (Number(desktopRow[viCol]) || 0) : 0;
    const desktopPct = totalV > 0 ? Math.round((desktopV / totalV) * 100) : 0;

    if (desktopPct > 0) {
      analytics.kpis.sharepoint.avgEngagement = {
        value: `${desktopPct}% desktop`,
        trend: "flat",
        delta: "of all visits",
      };
      console.log(`✅  avgEngagement (desktop %): ${desktopPct}%`);
    }
  } else {
    console.warn("⚠️   Sheet 'Usage by Device' not found — skipping device breakdown.");
  }

  // ── 3. Weekly Traffic (trend chart) ──────────────────────────────────────
  const weeklyRows = readSheet(workbook, XLSX, "Weekly Traffic");
  if (weeklyRows && weeklyRows.length > 1) {
    const header = weeklyRows[0];
    const perCol = findCol(header, COLUMN_MAP.period);
    const viCol  = findCol(header, COLUMN_MAP.views);
    const uvCol  = findCol(header, COLUMN_MAP.unique);

    const rows = weeklyRows.slice(1)
      .filter(r => r.some(c => c !== "") && r[perCol])
      .slice(-4); // last 4 weeks

    if (rows.length > 0) {
      analytics.sharepointTrend = rows.map(r => ({
        month:  String(r[perCol]).trim(),
        views:  Number(r[viCol]) || 0,
        unique: Number(r[uvCol]) || 0,
      }));
      console.log(`✅  sharepointTrend: ${rows.length} weekly buckets`);
    }
  } else {
    console.warn("⚠️   Sheet 'Weekly Traffic' not found — skipping trend chart.");
  }

  // ── 4. Pages (resource list) ──────────────────────────────────────────────
  const pagesRows = readSheet(workbook, XLSX, "Pages");
  if (pagesRows && pagesRows.length > 1) {
    const header   = pagesRows[0];
    const titleCol = findCol(header, COLUMN_MAP.pageTitle);
    const viCol    = findCol(header, COLUMN_MAP.views);
    const uvCol    = findCol(header, COLUMN_MAP.unique);

    const rows = pagesRows.slice(1)
      .filter(r => r.some(c => c !== "") && r[titleCol])
      .map(r => ({
        title:  String(r[titleCol]).trim(),
        views:  Number(r[viCol]) || 0,
        unique: Number(r[uvCol]) || 0,
      }))
      .filter(r => r.views > 0)
      .sort((a, b) => b.views - a.views);

    // Keep only member-facing pages (top 20 max)
    const memberPages = rows
      .filter(r => isMemberFacing(r.title))
      .slice(0, 20);

    if (memberPages.length > 0) {
      analytics.sharepointResources = memberPages.map((r, i) => ({
        id:        `sp${i + 1}`,
        title:     r.title,
        type:      "Guide",
        owner:     "Growth Community team",
        views:     r.views,
        downloads: 0,
        freshness: "Current",
        month:     "Jul",
      }));
      console.log(`✅  sharepointResources: ${memberPages.length} member-facing pages`);
    } else {
      console.warn("⚠️   No member-facing pages matched in the Pages sheet.");
      console.warn("    All page titles found:", rows.map(r => r.title).slice(0, 10).join(", "));
      console.warn("    Edit MEMBER_FACING_PAGES in this script to add matches.");
    }
  } else {
    console.warn("⚠️   Sheet 'Pages' not found — skipping resource list.");
  }

  // ── Stamp metadata ────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  analytics._meta = {
    ...analytics._meta,
    lastUpdated: today,
    updatedBy:   `process-sharepoint.js — ${xlsxPath.split("/").pop()}`,
  };

  // ── Write ─────────────────────────────────────────────────────────────────
  writeFileSync(ANALYTICS_PATH, JSON.stringify(analytics, null, 2), "utf-8");
  console.log(`\n✅  analytics.json updated — ${today}`);
  console.log(`    Run 'npm run build' then push to deploy.`);
}

main().catch(err => {
  console.error("❌ ", err.message);
  process.exit(1);
});
