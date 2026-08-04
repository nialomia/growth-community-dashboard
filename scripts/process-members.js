#!/usr/bin/env node
/**
 * process-members.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads a Slack member download xlsx (the "8.04 - Member Download" format)
 * and updates analytics.json with:
 *   - A new member count snapshot in kpis.overview + kpis.slack
 *   - Persona breakdown (memberPersonas)
 *   - Region breakdown from W3country column
 *   - A new data point appended to slackGrowth
 *
 * USAGE
 * ─────
 *   node scripts/process-members.js <path-to-xlsx> [--date YYYY-MM-DD]
 *
 * EXAMPLE
 *   node scripts/process-members.js ~/Desktop/"8.04 - Member Download (805).xlsx"
 *
 * EXPECTED XLSX COLUMNS (in any order, case-insensitive)
 * ────────────────────────────────────────────────────────
 *   Display Name       — full name (used for dedup)
 *   Email / Username   — IBM email
 *   W3country          — 2-letter country code from BluePages
 *   Job Role / Persona — free-text role; mapped to standard personas below
 *
 * If a column is missing the script still runs and just skips that section.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const ANALYTICS_PATH = resolve(process.cwd(), "public/analytics.json");

// ── Country → Region mapping ──────────────────────────────────────────────────
// Source: IBM regional structure (AMER / EMEA / APAC)
const REGION_MAP = {
  // AMER
  US: "AMER", CA: "AMER", MX: "AMER", BR: "AMER", AR: "AMER", CO: "AMER",
  CL: "AMER", PE: "AMER", VE: "AMER", EC: "AMER", BO: "AMER", PY: "AMER",
  UY: "AMER", GT: "AMER", CR: "AMER", PA: "AMER", DO: "AMER", CU: "AMER",
  // EMEA
  IE: "EMEA", GB: "EMEA", DE: "EMEA", FR: "EMEA", ES: "EMEA", IT: "EMEA",
  NL: "EMEA", BE: "EMEA", CH: "EMEA", SE: "EMEA", NO: "EMEA", DK: "EMEA",
  FI: "EMEA", PL: "EMEA", RO: "EMEA", CZ: "EMEA", HU: "EMEA", AT: "EMEA",
  PT: "EMEA", GR: "EMEA", ZA: "EMEA", EG: "EMEA", NG: "EMEA", KE: "EMEA",
  AE: "EMEA", SA: "EMEA", IL: "EMEA", TR: "EMEA", RU: "EMEA", UA: "EMEA",
  // APAC
  IN: "APAC", AU: "APAC", JP: "APAC", CN: "APAC", KR: "APAC", SG: "APAC",
  NZ: "APAC", MY: "APAC", TH: "APAC", PH: "APAC", ID: "APAC", VN: "APAC",
  BD: "APAC", PK: "APAC", LK: "APAC", HK: "APAC", TW: "APAC",
};

// ── Persona normalisation rules ───────────────────────────────────────────────
// Order matters — first match wins. Edit/extend as needed.
const PERSONA_RULES = [
  [/product\s+manag(er|ing|ment)|pm\b/i,        "Product Manager"],
  [/product\s+design/i,                          "Product Designer"],
  [/product\s+market/i,                          "Product Marketing Manager"],
  [/ux\s+research|user\s+research/i,             "UX Researcher"],
  [/content\s+design/i,                          "Content Designer"],
  [/data\s+scien|data\s+anal|analyst/i,          "Data Scientist/Analyst"],
  [/engineer(ing\s+manag|ing\s+lead|ing\s+dir)/i,"Engineering Manager"],
  [/software\s+engineer|developer|engineer/i,    "Engineer"],
  [/customer\s+success|csm\b/i,                  "Customer Success"],
  [/sales|account\s+exec|ae\b/i,                 "Sales"],
];

function normalisePersona(raw) {
  for (const [regex, label] of PERSONA_RULES) {
    if (regex.test(raw)) return label;
  }
  return "Other";
}

// ── Column finder ─────────────────────────────────────────────────────────────
function findCol(headers, ...aliases) {
  const h = headers.map(c => String(c ?? "").toLowerCase().trim());
  for (const alias of aliases) {
    const idx = h.findIndex(c => c.includes(alias.toLowerCase()));
    if (idx !== -1) return idx;
  }
  return -1;
}

// ── Load xlsx ─────────────────────────────────────────────────────────────────
async function loadXlsx() {
  try {
    const mod = await import("xlsx");
    return mod.default ?? mod;
  } catch {
    console.error("❌  The 'xlsx' package is not installed.\n    Run: npm install --save-dev xlsx");
    process.exit(1);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const xlsxPath = process.argv[2];
  if (!xlsxPath) {
    console.error("❌  Usage: node scripts/process-members.js <path-to-xlsx> [--date YYYY-MM-DD]");
    process.exit(1);
  }
  const absPath = resolve(process.cwd(), xlsxPath);
  if (!existsSync(absPath)) {
    console.error(`❌  File not found: ${absPath}`);
    process.exit(1);
  }

  const dateArg  = process.argv.includes("--date")
    ? process.argv[process.argv.indexOf("--date") + 1]
    : null;
  const snapDate = dateArg ? new Date(dateArg) : new Date();
  const dateStr  = snapDate.toISOString().slice(0, 10);
  const monthLabel = snapDate.toLocaleString("en-US", { month: "short" });

  console.log(`📂  Reading: ${absPath}`);
  const XLSX = await loadXlsx();
  const wb   = XLSX.readFile(absPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

  if (rows.length < 2) {
    console.error("❌  Spreadsheet appears empty.");
    process.exit(1);
  }

  const header = rows[0].map(c => String(c ?? "").trim());
  console.log(`    Columns: ${header.join(", ")}`);

  // Locate columns
  const nameCol    = findCol(header, "display name", "name", "full name");
  const emailCol   = findCol(header, "email", "username", "user name");
  const countryCol = findCol(header, "w3country", "country");
  const roleCol    = findCol(header, "job role", "persona", "role", "title", "function");

  const dataRows = rows.slice(1).filter(r => r.some(c => c !== ""));
  const totalMembers = dataRows.length;
  console.log(`    Total rows: ${totalMembers}`);

  // ── Persona counts ────────────────────────────────────────────────────────
  const personaCounts = {};
  if (roleCol !== -1) {
    for (const row of dataRows) {
      const raw = String(row[roleCol] ?? "").trim();
      const persona = raw ? normalisePersona(raw) : "Other";
      personaCounts[persona] = (personaCounts[persona] || 0) + 1;
    }
  } else {
    console.warn("⚠️   No role/persona column found — skipping persona breakdown.");
  }

  // ── Region + country counts ───────────────────────────────────────────────
  const regionCounts = { AMER: 0, EMEA: 0, APAC: 0, Unknown: 0 };
  const countryCounts = {};
  if (countryCol !== -1) {
    for (const row of dataRows) {
      const raw     = String(row[countryCol] ?? "").trim().toUpperCase();
      const region  = REGION_MAP[raw] ?? "Unknown";
      regionCounts[region]++;
      if (raw && raw !== "0") {
        countryCounts[raw] = (countryCounts[raw] || 0) + 1;
      }
    }
  } else {
    console.warn("⚠️   No W3country/country column found — skipping region breakdown.");
  }

  // ── Compute stats ─────────────────────────────────────────────────────────
  const personaArray = Object.entries(personaCounts)
    .map(([persona, count]) => ({
      persona,
      count,
      pct: Math.round((count / totalMembers) * 100 * 10) / 10,
    }))
    .sort((a, b) => b.count - a.count);

  const topCountries = Object.entries(countryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([code, count]) => ({ code, count }));

  // ── Load analytics.json ───────────────────────────────────────────────────
  const analytics = JSON.parse(readFileSync(ANALYTICS_PATH, "utf-8"));

  // ── Update member KPIs ────────────────────────────────────────────────────
  const prevTotal = parseInt(
    (analytics.kpis.overview.totalMembers?.value ?? "0").replace(/,/g, "")
  ) || 0;
  const delta = totalMembers - prevTotal;
  const deltaPct = prevTotal > 0 ? ((delta / prevTotal) * 100).toFixed(1) : "0";

  analytics.kpis.overview.totalMembers = {
    value: totalMembers.toLocaleString(),
    trend: delta >= 0 ? "up" : "down",
    delta: delta >= 0 ? `+${delta} (+${deltaPct}%)` : `${delta} (${deltaPct}%)`,
  };

  analytics.kpis.slack = analytics.kpis.slack ?? {};
  analytics.kpis.slack.newMembers = {
    value: String(delta > 0 ? delta : totalMembers),
    trend: "up",
    delta: `since last snapshot`,
  };

  console.log(`✅  kpis.overview.totalMembers: ${totalMembers.toLocaleString()} (${delta >= 0 ? "+" : ""}${delta})`);

  // ── Update persona breakdown ──────────────────────────────────────────────
  if (personaArray.length > 0) {
    analytics.memberPersonas = personaArray;
    console.log(`✅  memberPersonas: ${personaArray.length} categories`);
    personaArray.slice(0, 5).forEach(p =>
      console.log(`    ${p.persona.padEnd(32)} ${p.count} (${p.pct}%)`)
    );
  }

  // ── Update region breakdown (stored in segments or a new regionBreakdown key) ─
  if (regionCounts.AMER + regionCounts.EMEA + regionCounts.APAC > 0) {
    const covered = regionCounts.AMER + regionCounts.EMEA + regionCounts.APAC;
    analytics.regionBreakdown = [
      { region: "AMER", count: regionCounts.AMER, pct: Math.round(regionCounts.AMER / covered * 100) },
      { region: "EMEA", count: regionCounts.EMEA, pct: Math.round(regionCounts.EMEA / covered * 100) },
      { region: "APAC", count: regionCounts.APAC, pct: Math.round(regionCounts.APAC / covered * 100) },
    ];
    analytics.topCountries = topCountries;
    console.log(`✅  regionBreakdown: AMER ${regionCounts.AMER}, EMEA ${regionCounts.EMEA}, APAC ${regionCounts.APAC}`);
    console.log(`    Top countries: ${topCountries.slice(0, 5).map(c => `${c.code}(${c.count})`).join(", ")}`);
  }

  // ── Append/update growthTrend snapshot ───────────────────────────────────
  const existing = analytics.growthTrend.find(d => d.month === monthLabel);
  if (existing) {
    existing.members = totalMembers;
    console.log(`✅  growthTrend: updated ${monthLabel} → ${totalMembers}`);
  } else {
    analytics.growthTrend.push({ month: monthLabel, members: totalMembers, active: 0, sharepoint: 0 });
    console.log(`✅  growthTrend: appended ${monthLabel} → ${totalMembers}`);
  }

  // ── Stamp metadata ────────────────────────────────────────────────────────
  analytics._meta = {
    ...analytics._meta,
    lastUpdated: dateStr,
    updatedBy:   `process-members.js — ${xlsxPath.split("/").pop()}`,
  };

  // ── Write ─────────────────────────────────────────────────────────────────
  writeFileSync(ANALYTICS_PATH, JSON.stringify(analytics, null, 2), "utf-8");
  console.log(`\n✅  analytics.json updated — ${dateStr}`);
  console.log(`    Run 'npm run build' then push to deploy.`);
}

main().catch(err => {
  console.error("❌ ", err.message);
  process.exit(1);
});
