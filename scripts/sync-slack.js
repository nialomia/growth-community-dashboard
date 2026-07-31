#!/usr/bin/env node
/**
 * sync-slack.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches Growth Community Slack channel analytics and updates
 * public/analytics.json with real member counts and growth data.
 *
 * Run manually:     node scripts/sync-slack.js
 * Run via npm:      npm run sync-slack
 * Run via cron:     0 8 * * * cd /path/to/dashboard && node scripts/sync-slack.js
 *
 * Required environment variables (set in .env or your CI/CD secrets):
 *   SLACK_BOT_TOKEN   - xoxb-... token from your Slack App
 *   SLACK_CHANNEL_ID  - e.g. C0123456789 (the Growth Community channel)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── Load env from .env file if present ───────────────────────────────────────
try {
  const env = readFileSync(".env", "utf-8");
  for (const line of env.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
    }
  }
} catch { /* .env not present — rely on real env vars */ }

const TOKEN      = process.env.SLACK_BOT_TOKEN;
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
const JSON_PATH  = resolve("public/analytics.json");

if (!TOKEN || !CHANNEL_ID) {
  console.error("❌  Missing SLACK_BOT_TOKEN or SLACK_CHANNEL_ID environment variables.");
  console.error("    See scripts/SLACK_SETUP.md for setup instructions.");
  process.exit(1);
}

// ── Slack API helpers ─────────────────────────────────────────────────────────

async function slackGet(method, params = {}) {
  const url = new URL(`https://slack.com/api/${method}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error on ${method}: ${data.error}`);
  return data;
}

async function getAllMembers() {
  const members = [];
  let cursor = undefined;
  do {
    const params = { channel: CHANNEL_ID, limit: 200 };
    if (cursor) params.cursor = cursor;
    const data = await slackGet("conversations.members", params);
    members.push(...data.members);
    cursor = data.response_metadata?.next_cursor;
  } while (cursor);
  return members;
}

async function getChannelInfo() {
  const data = await slackGet("conversations.info", { channel: CHANNEL_ID, include_num_members: true });
  return data.channel;
}

// ── Get message activity for the last 30 days ─────────────────────────────────

async function getRecentActivity() {
  const oldest = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const messages = [];
  let cursor = undefined;
  do {
    const params = { channel: CHANNEL_ID, limit: 200, oldest: String(oldest) };
    if (cursor) params.cursor = cursor;
    const data = await slackGet("conversations.history", params);
    messages.push(...(data.messages ?? []));
    cursor = data.response_metadata?.next_cursor;
    // Stay within rate limits
    if (cursor) await new Promise(r => setTimeout(r, 500));
  } while (cursor);
  return messages;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔄  Fetching Slack data…");

  const [channelInfo, members, messages] = await Promise.all([
    getChannelInfo(),
    getAllMembers(),
    getRecentActivity(),
  ]);

  const totalMembers = members.length;
  const today = new Date().toISOString().slice(0, 10);

  // Active members = unique users who posted in last 30 days
  const activeUsers = new Set(messages.filter(m => m.subtype !== "bot_message").map(m => m.user).filter(Boolean));
  const activeCount = activeUsers.size;
  const engagementRate = totalMembers > 0 ? Math.round((activeCount / totalMembers) * 100) : 0;

  // Posts per week (last 4 weeks)
  const now = Date.now();
  const weeks = [0, 1, 2, 3].map(i => {
    const start = now - (i + 1) * 7 * 24 * 60 * 60 * 1000;
    const end   = now - i * 7 * 24 * 60 * 60 * 1000;
    return messages.filter(m => {
      const ts = parseFloat(m.ts) * 1000;
      return ts >= start && ts < end && m.subtype !== "bot_message";
    }).length;
  }).reverse();

  // ── Load and patch analytics.json ─────────────────────────────────────────
  const analytics = JSON.parse(readFileSync(JSON_PATH, "utf-8"));

  // Update metadata
  analytics._meta.lastUpdated = today;
  analytics._meta.updatedBy   = "sync-slack.js";

  // Update Slack KPIs
  analytics.kpis.slack.activeContributors = {
    value: activeCount.toLocaleString(),
    trend: activeCount > 0 ? "up" : "flat",
    delta: `Last 30d`,
  };
  analytics.kpis.slack.engagementRate = {
    value: `${engagementRate}%`,
    trend: engagementRate > 30 ? "up" : "flat",
    delta: "of members",
  };

  // Update overview total members KPI
  analytics.kpis.overview.totalMembers = {
    value: totalMembers.toLocaleString(),
    trend: "up",
    delta: `as of ${today}`,
  };

  // Append today's snapshot to growthTrend if the month isn't already there
  const monthLabel = new Date().toLocaleString("en-US", { month: "short" });
  const existingMonth = analytics.growthTrend.find(d => d.month === monthLabel);
  if (existingMonth) {
    existingMonth.members = totalMembers;
    existingMonth.active  = activeCount;
  } else {
    analytics.growthTrend.push({ month: monthLabel, members: totalMembers, active: activeCount, sharepoint: 0 });
  }

  // Update slackGrowth trend (last 4 weeks as monthly proxy)
  const slackEntry = analytics.slackGrowth.find(d => d.month === monthLabel);
  if (slackEntry) {
    slackEntry.newMembers = weeks[3] > 0 ? weeks[3] : slackEntry.newMembers;
  }

  writeFileSync(JSON_PATH, JSON.stringify(analytics, null, 2), "utf-8");
  console.log(`✅  analytics.json updated — ${today}`);
  console.log(`    Total members : ${totalMembers}`);
  console.log(`    Active (30d)  : ${activeCount} (${engagementRate}%)`);
  console.log(`    Messages/wk   : ${weeks.join(", ")}`);
}

main().catch(err => {
  console.error("❌ ", err.message);
  process.exit(1);
});
