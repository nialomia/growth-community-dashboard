# Growth Community Dashboard — Data Update Guide

How to keep the dashboard current. Pick the section for whatever data you have.

---

## Overview — what updates when

| Data source | How it updates | Frequency |
|---|---|---|
| **Slack member count** | Automatically — GitHub Actions runs every Monday 8am UTC | Weekly (auto) |
| **Slack member count (manual)** | Download member xlsx from Slack → run `process-members.js` | After any big download |
| **Member personas & regions** | Same member xlsx — `process-members.js` handles both | Monthly or after a new export |
| **SharePoint analytics** | Download xlsx from SharePoint admin → run `process-sharepoint.js` | Monthly |
| **GCC call attendance** | Download Teams attendance report → run `add-gcc-call.js` | After each GCC call |
| **Any KPI inline edit** | Edit `public/analytics.json` directly, or use `--patch` flag | Any time |

---

## One-time setup

### 1 — Install the xlsx processing dependency

The scripts that read Excel files need the `xlsx` package:

```bash
cd growth-community-dashboard
npm install --save-dev xlsx
```

### 2 — Add GitHub Secrets for auto-sync (Slack only)

If you want the Monday auto-sync to work, add these secrets in:
**GitHub → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|---|---|
| `SLACK_BOT_TOKEN` | `xoxb-...` token from your Slack App (see `scripts/SLACK_SETUP.md`) |
| `SLACK_CHANNEL_ID` | Channel ID of the Growth Community Slack (e.g. `C0123456789`) |

The `GITHUB_TOKEN` is provided automatically — no action needed.

---

## After each GCC call

**What you need:**
- Teams attendance report `.xlsx` — download from Teams calendar → meeting → Attendance → Download
- (Optional) New members CSV — names, emails, join dates since the last call

**Run:**

```bash
# Full update: new call + new member attendance tracking
node scripts/add-gcc-call.js \
  --teams ~/Desktop/GCC_Aug_11_attendance.xlsx \
  --members ~/Desktop/new-members-aug.csv

# Preview without writing:
node scripts/add-gcc-call.js --teams ~/Desktop/GCC_Aug_11_attendance.xlsx --dry-run
```

**What it updates:**
- `gccCallOverview` — adds the new call, recalculates unique attendees, core members, cross-call breakdown
- `meetingAttendance` — new-member tracking with attended/absent flags
- `_meta.lastUpdated`

**Then deploy:**
```bash
npm run build && git add -A && git commit -m "data: GCC Aug 11 attendance" && git push
```

---

## After a new Slack member download

**What you need:**
- Member download xlsx (the "8.04 - Member Download" style export from Slack admin)

**Run:**

```bash
node scripts/process-members.js ~/Desktop/"8.18 - Member Download (840).xlsx"
```

**What it updates:**
- `kpis.overview.totalMembers` — new count + delta from previous
- `memberPersonas` — persona breakdown (Product Manager, Designer, etc.)
- `regionBreakdown` — AMER / EMEA / APAC counts
- `topCountries` — top 10 countries by member count
- `growthTrend` — appends or updates this month's data point
- `_meta.lastUpdated`

**Persona mapping** is configured in the `PERSONA_RULES` array at the top of `scripts/process-members.js`. If a new role appears that isn't mapping correctly, add a regex line there.

---

## After a SharePoint analytics export

**What you need:**
- Site analytics xlsx from SharePoint admin: **Settings → Site analytics → Export**

**Run:**

```bash
node scripts/process-sharepoint.js ~/Desktop/"SiteAnalyticsData_18-Aug,2026.xlsx"
```

**What it updates:**
- `kpis.sharepoint.pageViews` — all-time total
- `kpis.sharepoint.uniqueViewers` — all-time unique
- `kpis.sharepoint.avgEngagement` — desktop share %
- `sharepointTrend` — last 4 weekly buckets
- `sharepointResources` — member-facing pages ranked by views
- `_meta.lastUpdated`

**Member-facing page filter** — the script only includes pages whose titles contain keywords like "home", "call", "recording", "guide", etc. If a page is missing, add its keyword to the `MEMBER_FACING_PAGES` array in `scripts/process-sharepoint.js`.

---

## Editing a single KPI inline

No file needed — just patch the specific value:

```bash
# Update SharePoint page views to 3,800
node scripts/update-analytics.js --patch \
  '{"kpis":{"sharepoint":{"pageViews":{"value":"3,800","trend":"up","delta":"+5%"}}}}'

# Refresh the date stamp only (no data changes)
node scripts/update-analytics.js
```

---

## Triggering the GitHub Actions workflow manually

The auto-sync workflow can also be triggered manually with options:

1. Go to **Actions → Update dashboard data → Run workflow**
2. Choose **sync target**:
   - `slack` — pull live member count from Slack API
   - `stamp-only` — just refresh the date, no API calls
3. Optionally paste a **JSON patch** to apply on top (same format as `--patch` above)
4. Click **Run workflow**

The workflow will commit updated `analytics.json` to `main` and redeploy to GitHub Pages automatically.

---

## Deploy commands reference

### Personal GitHub Pages (auto-deploys on push to `main`)
```bash
npm run build
git add -A && git commit -m "data: <description>" && git push
```

### IBM GitHub Pages (manual push to `gh-pages`)
```bash
DEPLOY_TARGET=ibm npm run build

git worktree remove /tmp/gh-pages-deploy --force 2>/dev/null || true
git worktree add /tmp/gh-pages-deploy gh-pages
rm -rf /tmp/gh-pages-deploy/*
cp dist/index.html dist/analytics.json /tmp/gh-pages-deploy/
cp -r dist/assets /tmp/gh-pages-deploy/
cd /tmp/gh-pages-deploy && git add -A && git commit -m "Deploy: <description>"
git push https://Nia-Lomia:<TOKEN>@github.ibm.com/Nia-Lomia/growth-community-dashboard.git gh-pages --force
cd - && git worktree remove /tmp/gh-pages-deploy --force
```

---

## File map

| File | What to edit |
|---|---|
| `public/analytics.json` | Live data — the dashboard reads this |
| `scripts/process-members.js` | Persona mapping rules, column name aliases |
| `scripts/process-sharepoint.js` | Member-facing page keywords |
| `scripts/add-gcc-call.js` | Teams xlsx column parsing (if format changes) |
| `scripts/sync-slack.js` | Slack API logic |
| `.github/workflows/update-dashboard.yml` | Auto-sync schedule, manual trigger options |
| `src/app/data.ts` | Fallback data (update if `analytics.json` schema changes) |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `xlsx package not installed` | Run `npm install --save-dev xlsx` |
| Personas all map to "Other" | Check the role column name; add/edit rules in `PERSONA_RULES` |
| Wrong page titles in SharePoint tab | Add keyword to `MEMBER_FACING_PAGES` in `process-sharepoint.js` |
| Teams xlsx not parsing | Try `--date YYYY-MM-DD` flag; check that section headers (1. Summary, 2. Participants, etc.) are present |
| GitHub Actions not triggering | Check that `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` secrets are set |
| IBM Pages shows old data | Confirm the `gh-pages` push succeeded; IBM GitHub Actions are disabled so you must push manually |
