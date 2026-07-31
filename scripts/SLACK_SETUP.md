# Slack Integration Setup Guide
## For the Growth Community Analytics Dashboard

---

## What this does

Once set up, running `npm run sync-slack` will automatically:
- Pull the current member count from the Growth Community Slack channel
- Count active contributors (members who posted in the last 30 days)
- Calculate engagement rate
- Update `public/analytics.json` with live data
- The dashboard refreshes automatically next time it loads

---

## Step 1 — Create a Slack App (Admin required)

1. Go to **https://api.slack.com/apps**
2. Click **"Create New App"** → choose **"From scratch"**
3. Name it: `Growth Community Analytics`
4. Select your IBM Growth Community workspace
5. Click **Create App**

---

## Step 2 — Add permissions

In the app settings, go to **OAuth & Permissions → Scopes → Bot Token Scopes** and add:

| Permission | Why |
|---|---|
| `channels:read` | Read channel info and member count |
| `channels:history` | Read recent messages for activity metrics |
| `users:read` | Look up member details |

> If the Growth Community channel is a **private** channel, use `groups:read` and `groups:history` instead.

---

## Step 3 — Install the app to your workspace

1. Go to **OAuth & Permissions** → click **"Install to Workspace"**
2. Click **Allow**
3. Copy the **Bot User OAuth Token** — it starts with `xoxb-...`

---

## Step 4 — Invite the bot to the channel

In Slack, go to the Growth Community channel and type:
```
/invite @Growth Community Analytics
```

---

## Step 5 — Get the channel ID

1. In Slack, right-click the Growth Community channel name
2. Click **"View channel details"**
3. Scroll to the bottom — you'll see the **Channel ID** (e.g. `C0123456789`)

---

## Step 6 — Set environment variables

Create a `.env` file in the dashboard root (already in `.gitignore` so it won't be pushed to GitHub):

```bash
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C0123456789
```

---

## Step 7 — Test it

```bash
cd /path/to/growth-community-dashboard
npm run sync-slack
```

You should see:
```
🔄  Fetching Slack data…
✅  analytics.json updated — 2026-07-28
    Total members : 801
    Active (30d)  : 312 (39%)
    Messages/wk   : 45, 52, 61, 48
```

---

## Step 8 — Automate daily (optional)

Add a cron job to run every morning at 8am:

```bash
# Open crontab
crontab -e

# Add this line
0 8 * * * cd /path/to/growth-community-dashboard && npm run sync-slack
```

Or if deploying to a server, add it as a GitHub Actions scheduled workflow — ask the dashboard developer to set this up.

---

## Troubleshooting

| Error | Fix |
|---|---|
| `missing_scope` | Add the missing permission in Step 2 and reinstall the app |
| `channel_not_found` | Double-check the channel ID in Step 5 |
| `not_in_channel` | Invite the bot to the channel (Step 4) |
| `invalid_auth` | Token is wrong or expired — regenerate in Step 3 |

---

## Contact

For questions about the dashboard, contact the Growth Community analytics team.
