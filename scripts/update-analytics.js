#!/usr/bin/env node
/**
 * update-analytics.js
 * ──────────────────────────────────────────────────────────────────────────
 * Daily data update script for the Growth Community Analytics dashboard.
 *
 * HOW TO USE
 * ──────────
 * 1. Open `public/analytics.json` and edit any numbers you want to update.
 *    OR supply a patch object via --patch flag (see examples below).
 *
 * 2. Run this script once per day to stamp the `_meta.lastUpdated` date
 *    and optionally apply a JSON patch to specific keys.
 *
 * EXAMPLES
 * ────────
 *  # Just refresh the date stamp (no data changes):
 *  node scripts/update-analytics.js
 *
 *  # Update a single KPI value inline (JSON patch):
 *  node scripts/update-analytics.js --patch '{"kpis":{"overview":{"totalMembers":{"value":"6,750","trend":"up","delta":"+4.1%"}}}}'
 *
 *  # Pipe in a full replacement file:
 *  cat my-new-data.json | node scripts/update-analytics.js --stdin
 *
 * AUTOMATION
 * ──────────
 * Add a cron entry to run daily at 06:00:
 *   0 6 * * * cd /path/to/growth-community-dashboard && node scripts/update-analytics.js
 *
 * Or add to package.json scripts:
 *   "update-data": "node scripts/update-analytics.js"
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { argv, stdin } from "process";

const FILE_PATH = resolve(process.cwd(), "public/analytics.json");

// ─── Parse flags ─────────────────────────────────────────────────────────────

const args = argv.slice(2);
const patchIdx = args.indexOf("--patch");
const useStdin = args.includes("--stdin");

// ─── Load existing analytics ─────────────────────────────────────────────────

function loadExisting() {
  try {
    return JSON.parse(readFileSync(FILE_PATH, "utf-8"));
  } catch {
    console.error(`❌  Could not read ${FILE_PATH}`);
    process.exit(1);
  }
}

// ─── Deep merge (shallow keys first, then descend) ───────────────────────────

function deepMerge(target, patch) {
  if (typeof patch !== "object" || patch === null) return patch;
  const result = { ...target };
  for (const key of Object.keys(patch)) {
    if (
      typeof patch[key] === "object" &&
      patch[key] !== null &&
      !Array.isArray(patch[key]) &&
      typeof result[key] === "object" &&
      result[key] !== null
    ) {
      result[key] = deepMerge(result[key], patch[key]);
    } else {
      result[key] = patch[key];
    }
  }
  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let analytics = loadExisting();

  if (useStdin) {
    // Accept piped JSON from stdin
    let raw = "";
    for await (const chunk of stdin) raw += chunk;
    try {
      analytics = JSON.parse(raw);
    } catch {
      console.error("❌  Stdin JSON is not valid.");
      process.exit(1);
    }
  } else if (patchIdx !== -1 && args[patchIdx + 1]) {
    // Apply a partial patch
    let patch;
    try {
      patch = JSON.parse(args[patchIdx + 1]);
    } catch {
      console.error("❌  --patch value is not valid JSON.");
      process.exit(1);
    }
    analytics = deepMerge(analytics, patch);
  }

  // Always stamp today's date
  const today = new Date().toISOString().slice(0, 10);
  analytics._meta = {
    ...analytics._meta,
    lastUpdated: today,
    updatedBy: analytics._meta?.updatedBy ?? "update-analytics.js",
  };

  writeFileSync(FILE_PATH, JSON.stringify(analytics, null, 2), "utf-8");
  console.log(`✅  analytics.json updated — lastUpdated: ${today}`);
}

main().catch((err) => {
  console.error("❌ ", err.message);
  process.exit(1);
});
