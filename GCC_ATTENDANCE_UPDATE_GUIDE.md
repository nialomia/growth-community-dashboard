# GCC Call Attendance — Data Update Guide

How to update the **GCC Call Attendance** tab after each Growth Community Call.

---

## What you need

Two exports after every GCC call:

| File | Where to get it | Format |
|------|----------------|--------|
| **Teams attendance report** | Meeting organiser → Teams calendar → meeting details → **Attendance** → Download | `.xlsx` |
| **Slack member list** | Ask a Slack workspace admin to export the member list, or use the existing snapshot | `.xlsx` or `.numbers` |

---

## Step 1 — Get the Teams attendance report

1. Open **Microsoft Teams** and go to your **Calendar**.
2. Click the GCC meeting entry (after it has ended).
3. Select **Attendance** in the meeting details panel.
4. Click **Download attendance list** — this saves a `.xlsx` file.

The file contains four sections:
- **1. Summary** — total attendees, start/end time, duration, average attendance time
- **2. Participants** — name + first join time for every attendee
- **3. In-Meeting Activities** — per-person engagement actions (unmuted, camera on, reactions, raised hand)
- **4. Audio and Video Consent** — name + IBM email (UPN)

You only need sections **1**, **2**, and **3**.

---

## Step 2 — Get the new Slack members list

Get a list of everyone who joined the Slack channel **since the previous GCC call**.

If you are tracking this manually, note:
- **Name** (display name in Slack)
- **IBM email** (look up via [W3 BluePages](https://w3.ibm.com/bluepages) if needed)
- **Date joined Slack**

---

## Step 3 — Cross-reference attendees with new members

Go through your new member list and check each person against the Teams **Participants** section.

Mark each new member as:
- `"attended": true` — their name appears in the Teams participant list
- `"attended": false` — they are not in the Teams participant list

For those who attended, also note:
- `"joinTime"` — their first join time from the **Participants** section (e.g. `"11:30 AM"`)
- `"engagementActions"` — count of rows for that person in the **In-Meeting Activities** section (unmutes, camera ons, reactions, raised hands all count as 1 each)

---

## Step 4 — Edit `public/analytics.json`

Open the file at:

```
growth-community-dashboard/public/analytics.json
```

Find the `"meetingAttendance"` block near the bottom and replace it with your new data.

### Fields to update

```jsonc
"meetingAttendance": {
  "meetingTitle": "Growth Community Call (GCC)",   // leave as-is
  "meetingDate": "Aug 25, 2026",                   // ← date of this call
  "meetingDuration": "1h 15m 00s",                 // ← from Summary section
  "totalAttendees": 52,                             // ← "Attended participants" from Summary
  "avgAttendanceTime": "28m 10s",                  // ← from Summary section
  "newMemberCount": 18,                             // ← total new Slack members this period
  "newMembersAttended": 5,                          // ← how many of those attended
  "newMembersAbsent": 13,                           // ← newMemberCount minus newMembersAttended
  "newMembers": [ ... ]                             // ← see below
}
```

### How to write each member entry

```jsonc
// Member who ATTENDED:
{
  "id": "nm1",
  "name": "First Last",
  "email": "first.last@ibm.com",
  "joinedSlack": "Aug 15",               // date they joined Slack (Mon DD)
  "attended": true,
  "joinTime": "11:32 AM",               // from Teams Participants section
  "engagementActions": 3                // count of rows in In-Meeting Activities
},

// Member who DID NOT attend:
{
  "id": "nm2",
  "name": "First Last",
  "email": "first.last@ibm.com",
  "joinedSlack": "Aug 20",
  "attended": false
}
```

**Important:** give each member a unique `id` — use `nm1`, `nm2`, `nm3`… restarting from 1 for each new call.

---

## Step 5 — Save and verify

1. Save `public/analytics.json`.
2. The dev server picks up the change automatically — **refresh the browser**.
3. Go to the **GCC Call Attendance** tab and confirm:
   - KPI numbers match your counts
   - Attended members show green cards with the correct join time
   - Absent members show grey cards

---

## Tips

- **Name matching is case-insensitive** — "DIPALI DARJI" in Teams and "Dipali Darji" in your list are the same person. The cross-reference is done manually, so just use the cleaned-up name in the JSON.
- **Unverified attendees** — Teams sometimes marks external or guest accounts as `(Unverified)`. If the person is a new member, still mark them `attended: true` and note the name as-is.
- **Members who joined on call day** — people joining Slack on the same day as the call rarely attend (they had no notice). Flag them for a follow-up welcome message pointing to the next call date and the recording link.
- **engagementActions = 0** is fine — it means the person joined but did not unmute, turn on camera, react, or raise a hand. They are still counted as attended.

---

## Full example for a new call

```json
"meetingAttendance": {
  "meetingTitle": "Growth Community Call (GCC)",
  "meetingDate": "Aug 25, 2026",
  "meetingDuration": "1h 10m 22s",
  "totalAttendees": 50,
  "avgAttendanceTime": "29m 45s",
  "newMemberCount": 6,
  "newMembersAttended": 2,
  "newMembersAbsent": 4,
  "newMembers": [
    { "id": "nm1", "name": "Jane Smith",   "email": "jane.smith@ibm.com",   "joinedSlack": "Aug 12", "attended": true,  "joinTime": "11:31 AM", "engagementActions": 2 },
    { "id": "nm2", "name": "Carlos Ruiz",  "email": "carlos.ruiz@ibm.com",  "joinedSlack": "Aug 18", "attended": true,  "joinTime": "11:45 AM", "engagementActions": 0 },
    { "id": "nm3", "name": "Priya Nair",   "email": "priya.nair@in.ibm.com","joinedSlack": "Aug 20", "attended": false },
    { "id": "nm4", "name": "Tom Baker",    "email": "tom.baker@uk.ibm.com", "joinedSlack": "Aug 22", "attended": false },
    { "id": "nm5", "name": "Yuki Tanaka",  "email": "yuki.tanaka@ibm.com",  "joinedSlack": "Aug 24", "attended": false },
    { "id": "nm6", "name": "Sara Osei",    "email": "sara.osei@ibm.com",    "joinedSlack": "Aug 25", "attended": false }
  ]
}
```

---

## File locations

| File | Purpose |
|------|---------|
| `public/analytics.json` | Live data file — edit this to update the dashboard |
| `dist/analytics.json` | Built output — updated automatically when you run `npm run build` |
| `src/app/data.ts` | Fallback data used if the JSON fetch fails — update the `meetingAttendance` block here too for offline resilience |
| `src/app/components/dashboard/tabs/MeetingTab.tsx` | The tab UI — no changes needed for routine data updates |
