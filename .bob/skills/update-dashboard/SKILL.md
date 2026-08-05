---
name: update-dashboard
description: >
  Update the Growth Community Analytics dashboard with new data. Use when the user provides
  a data file (xlsx, csv) or pastes numbers and wants to update the dashboard. Trigger phrases:
  "update dashboard", "new data", "member download", "SharePoint export", "attendance report",
  "GCC call", "new numbers", "update analytics".
---

# Growth Community Dashboard — Update Workflow

You are the data update assistant for the Growth Community Analytics dashboard.
The project lives at `growth-community-dashboard/` relative to the workspace root.

When the user provides new data (a file path, pasted numbers, or a description of what changed),
follow this workflow exactly.

---

## Step 1 — Identify what type of data was provided

Ask the user (using `ask_followup_question`) **only if the type is ambiguous**. If the file name or
description makes it obvious, skip the question and go straight to Step 2.

| If the user provides… | Data type |
|---|---|
| A file matching `*Member Download*` or mentions "member count", "member list", "Slack export" | **Members** |
| A file matching `*SiteAnalytics*` or mentions "SharePoint", "page views", "site analytics" | **SharePoint** |
| A file matching `*attendance*` or mentions "GCC call", "Teams report", "who attended" | **GCC Call** |
| Pasted numbers / plain text with specific values | **Manual patch** |

---

## Step 2 — Run the correct script

Always `cd growth-community-dashboard` first. Scripts are in `scripts/`.

### Members xlsx (Slack member download)

```bash
cd growth-community-dashboard
node scripts/process-members.js "<path-to-xlsx>"
```

**What it updates:** `kpis.overview.totalMembers`, `memberPersonas`, `regionBreakdown`,
`topCountries`, `growthTrend` snapshot.

**After running:** read the console output to confirm member count and delta, then continue to Step 3.

If personas map incorrectly (all showing "Other"), open `scripts/process-members.js` and add a
matching regex to the `PERSONA_RULES` array before re-running.

---

### SharePoint analytics xlsx

```bash
cd growth-community-dashboard
node scripts/process-sharepoint.js "<path-to-xlsx>"
```

**What it updates:** `kpis.sharepoint.*`, `sharepointTrend` (last 4 weeks), `sharepointResources`
(member-facing pages only).

**If pages are missing** from the resource list, open `scripts/process-sharepoint.js` and add the
missing keyword to `MEMBER_FACING_PAGES`, then re-run.

---

### GCC call Teams attendance xlsx

```bash
cd growth-community-dashboard
node scripts/add-gcc-call.js --teams "<attendance.xlsx>" [--members "<new-members.csv>"]
```

**What it updates:** `gccCallOverview` (new call added, unique/core/breakdown recalculated),
`meetingAttendance` (new-member attendance tracking, only if `--members` is provided).

Always do a dry run first to preview:
```bash
node scripts/add-gcc-call.js --teams "<attendance.xlsx>" --dry-run
```

If the call date can't be parsed from the xlsx, add `--date YYYY-MM-DD`.

---

### Manual numbers (pasted values or specific KPI updates)

Use `update-analytics.js` with a `--patch` JSON:

```bash
cd growth-community-dashboard
node scripts/update-analytics.js --patch '<json>'
```

Example patches:
```bash
# Update total members
node scripts/update-analytics.js --patch '{"kpis":{"overview":{"totalMembers":{"value":"820","trend":"up","delta":"+15 since Aug 4"}}}}'

# Update SharePoint page views
node scripts/update-analytics.js --patch '{"kpis":{"sharepoint":{"pageViews":{"value":"3,800","trend":"up","delta":"+197"}}}}'
```

For any `KpiValue` field the shape is always: `{"value": "...", "trend": "up|down|flat", "delta": "..."}`.

---

## Step 3 — Verify the output

After any script runs, read `public/analytics.json` to confirm the relevant sections updated
correctly:

```bash
node -e "const d=JSON.parse(require('fs').readFileSync('growth-community-dashboard/public/analytics.json','utf8')); console.log(JSON.stringify({_meta:d._meta, overview:d.kpis?.overview?.totalMembers, personas:d.memberPersonas?.slice(0,3)},null,2))"
```

If anything looks wrong (wrong count, wrong date, missing section), fix it before deploying —
either re-run the script or apply a manual `--patch`.

---

## Step 4 — Build and deploy to personal GitHub Pages

```bash
cd growth-community-dashboard
npm run build
git add -A
git commit -m "data: <short description of what changed>"
git push origin main
```

GitHub Actions auto-deploys to personal Pages on every push to main.

Live at: `https://nialomia.github.io/growth-community-dashboard/`

---

## Step 5 — Report back

Tell the user:
- What was updated (which fields, what the new values are)
- Any warnings from the script (e.g. columns not found, pages not matched)
- Personal Pages URL: `https://nialomia.github.io/growth-community-dashboard/`

---

## Key rules — always follow these

1. **Never invent numbers.** Only write values that came directly from the file or from the user.
2. **Commit message format:** `data: <what changed>` — e.g. `data: Aug 18 member download (820 members)`.
3. **`analytics.json` is the source of truth.** `src/app/data.ts` has a `FALLBACK` object —
   only update it if the JSON schema changes (new top-level fields added).
4. **If a script fails** with `xlsx package not installed`, run `npm install --save-dev xlsx` first,
   then retry.

---

## File reference

| File | Purpose |
|---|---|
| `public/analytics.json` | Live data — the dashboard reads this at runtime |
| `scripts/process-members.js` | Slack member xlsx → member count, personas, regions |
| `scripts/process-sharepoint.js` | SharePoint analytics xlsx → page views, trend, resources |
| `scripts/add-gcc-call.js` | Teams attendance xlsx → GCC call data + new-member tracking |
| `scripts/update-analytics.js` | Apply a JSON patch or refresh the date stamp |
