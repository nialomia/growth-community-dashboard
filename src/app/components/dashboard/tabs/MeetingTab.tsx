import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Users, CalendarDays, Zap, Search, X, Star } from "lucide-react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { useDashboard } from "../../../dashboard-context";
import { cn } from "../../ui/utils";
import type { GccSubKey } from "../../dashboard/SideNav";
import { GccOverviewTab } from "./GccOverviewTab";

type Filter = "all" | "attended" | "absent";

export function MeetingTab({
  gccSub,
  onGccSub,
}: {
  gccSub: GccSubKey;
  onGccSub: (s: GccSubKey) => void;
}) {
  const { analytics } = useDashboard();
  const ma = analytics.meetingAttendance;
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showAllAttendees, setShowAllAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");

  if (!ma) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <CalendarDays size={36} className="text-[var(--gc-grey)]" />
        <p className="text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>No meeting data yet</p>
        <p className="max-w-xs text-[13px] text-[var(--gc-grey)]">
          Add a <code className="rounded bg-[var(--gc-offwhite)] px-1">meetingAttendance</code> block
          to <code className="rounded bg-[var(--gc-offwhite)] px-1">analytics.json</code> to see this view.
        </p>
      </div>
    );
  }

  const attendancePct = Math.round((ma.newMembersAttended / ma.newMemberCount) * 100);
  const absentPct = 100 - attendancePct;

  const filtered = ma.newMembers.filter((m) => {
    const matchFilter =
      filter === "all" || (filter === "attended" ? m.attended : !m.attended);
    const matchSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const FILTER_OPTS: { key: Filter; label: string; count: number }[] = [
    { key: "all",      label: "All members",  count: ma.newMemberCount },
    { key: "attended", label: "Attended",      count: ma.newMembersAttended },
    { key: "absent",   label: "Not attended",  count: ma.newMembersAbsent },
  ];

  const GCC_SUB_LABELS: Record<GccSubKey, string> = {
    "july-meetings":    "Jul–Aug (4 calls)",
    "july-new-members": "New Member Tracking",
  };

  return (
    <div className="space-y-5">
      {/* Dynamic heading per sub-tab */}
      {gccSub === "july-meetings" ? (
        <SectionHeading
          title="GCC calls — overview"
          description="Attendance and retention across all 4 Growth Community Calls (Jul 14, 21, 28 · Aug 4)"
        />
      ) : (
        <SectionHeading
          title="New member call attendance"
          description={`Jul 10 – Aug 4, 2026 · ${ma.newMemberCount} new members tracked`}
        />
      )}

      {/* Mobile-only sub-tab pills (desktop uses SideNav) */}
      <div className="flex gap-1.5 md:hidden" role="tablist" aria-label="GCC overview sub-tabs">
        {(["july-meetings", "july-new-members"] as GccSubKey[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={gccSub === k}
            onClick={() => onGccSub(k)}
            className={cn(
              "rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
              gccSub === k
                ? "border-[var(--gc-ibm-blue)] bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                : "border-[var(--border)] text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)]",
            )}
          >
            {GCC_SUB_LABELS[k]}
          </button>
        ))}
      </div>

      {/* ── July (3 meetings) ─────────────────────────────────────── */}
      {gccSub === "july-meetings" && <GccOverviewTab />}

      {/* ── July New Members content ───────────────────────────────── */}
      {gccSub === "july-new-members" && <>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="New Slack members"
          value={String(ma.newMemberCount)}
          trend="up"
          delta="Jul 10 – Aug 4"
          accent="blue"
          definition="Members who joined the Growth Community Slack workspace between Jul 10 and Aug 4. Source: Slack member export diff + new members CSV."
        />
        <KpiCard
          label="Attended any GCC call"
          value={String(ma.newMembersAttended)}
          trend="flat"
          delta={`${attendancePct}% of new members`}
          accent="green"
          definition="New members (Jul 10–Aug 4) who appeared in any of the 3 July GCC Teams attendance reports (Jul 14, 21, 28). Cross-referenced by name. Source: Teams attendance reports + Slack export."
        />
        <KpiCard
          label="Did not attend"
          value={String(ma.newMembersAbsent)}
          trend="down"
          delta={`${absentPct}% of new members`}
          accent="grey"
          definition="New members who did not appear in any of the 3 July GCC attendance reports. = Total new members minus those who attended at least one call."
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => setShowAllAttendees(true)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setShowAllAttendees(true)}
          className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 rounded-md"
          aria-label="View all attendees"
        >
          <KpiCard
            label="Total call attendees"
            value={String(ma.totalAttendees)}
            trend="up"
            delta={`${ma.meetingDate} · tap to view`}
            accent="purple"
            definition="Total unique participants who joined the Jul 28 GCC Teams call. Source: Teams attendance report — 2. Participants section."
          />
        </div>
        <KpiCard
          label="Avg attendance time"
          value={ma.avgAttendanceTime}
          trend="flat"
          delta={`of ${ma.meetingDuration}`}
          accent="blue"
          definition="Average time each participant spent in the call. Taken directly from the Summary section of the Teams attendance report."
        />
      </div>

      {/* Attendance summary bar */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="New member call participation"
          description={`How many of the ${ma.newMemberCount} new Slack members attended any July GCC call`}
        />
        <div className="flex items-center gap-3">
          <div className="flex h-6 flex-1 overflow-hidden rounded-full">
            <div
              className="flex items-center justify-center bg-[var(--gc-green)] text-[11px] text-white transition-all"
              style={{ width: `${attendancePct}%` }}
            >
              {attendancePct}%
            </div>
            <div
              className="flex items-center justify-center bg-[var(--gc-offwhite)] text-[11px] text-[var(--gc-grey)] transition-all"
              style={{ width: `${absentPct}%` }}
            >
              {absentPct}%
            </div>
          </div>
          <span className="shrink-0 text-[13px] text-[var(--gc-grey)]">
            {ma.newMembersAttended} of {ma.newMemberCount}
          </span>
        </div>
        <div className="flex gap-4 text-[12px] text-[var(--gc-grey)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--gc-green)]" />
            Attended ({ma.newMembersAttended})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--gc-grey-light)]" />
            Not attended ({ma.newMembersAbsent})
          </span>
        </div>
      </Card>

      {/* Member table with filter + search */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="New member list"
          description="All Slack members who joined between Jul 10 – Aug 4"
          action={
            <div className="relative hidden sm:block">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gc-grey)]" />
              <Input
                type="search"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-48 pl-7 text-[13px]"
                aria-label="Search members"
              />
            </div>
          }
        />

        {/* Filter pills */}
        <div className="flex gap-1.5" role="group" aria-label="Filter by attendance">
          {FILTER_OPTS.map((o) => (
            <button
              key={o.key}
              onClick={() => setFilter(o.key)}
              aria-pressed={filter === o.key}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                filter === o.key
                  ? "border-[var(--gc-ibm-blue)] bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                  : "border-[var(--border)] text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)]",
              )}
            >
              {o.label}
              <span className="ml-1.5 tabular-nums">{o.count}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[var(--gc-grey)]">No members match your search.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex items-start gap-3 rounded-md border p-3",
                  m.attended ? "border-[var(--gc-green-soft)] bg-[var(--gc-green-soft)]/30" : "border-[var(--border)] bg-white",
                )}
              >
                {/* Attended icon */}
                <span className="mt-0.5 shrink-0">
                  {m.attended
                    ? <CheckCircle2 size={17} className="text-[var(--gc-green)]" />
                    : <XCircle size={17} className="text-[var(--gc-grey-light)]" />
                  }
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>{m.name}</p>
                  <p className="truncate text-[11px] text-[var(--gc-grey)]">{m.email}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[var(--gc-grey)]">
                      <Users size={11} /> Joined Slack {m.joinedSlack}
                    </span>
                    {m.attended && m.joinTime && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--gc-green)]">
                        <Clock size={11} /> Joined call {m.joinTime}
                      </span>
                    )}
                    {m.attended && m.engagementActions != null && m.engagementActions > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[var(--gc-purple)]">
                        <Zap size={11} /> {m.engagementActions} engagement action{m.engagementActions !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── All-attendees modal ─────────────────────────────────────── */}
      {showAllAttendees && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="All call attendees"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setShowAllAttendees(false); setAttendeeSearch(""); }}
          />

          {/* Panel */}
          <div className="relative flex w-full max-w-2xl flex-col rounded-lg border border-[var(--border)] bg-white shadow-xl"
               style={{ maxHeight: "85vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <p className="text-[var(--gc-graphite)]" style={{ fontWeight: 600 }}>
                  All attendees — {ma.meetingTitle}
                </p>
                <p className="text-[12px] text-[var(--gc-grey)]">
                  {ma.meetingDate} · {ma.meetingDuration} · {ma.totalAttendees} attendees
                </p>
              </div>
              <button
                onClick={() => { setShowAllAttendees(false); setAttendeeSearch(""); }}
                className="rounded-md p-1.5 text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-[var(--border)] px-5 py-3">
              <div className="relative">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gc-grey)]" />
                <Input
                  type="search"
                  placeholder="Search attendees…"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  className="h-8 w-full pl-7 text-[13px]"
                  aria-label="Search attendees"
                  autoFocus
                />
              </div>
              <div className="mt-2 flex gap-3 text-[12px] text-[var(--gc-grey)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--gc-green)]" /> New member
                </span>
                <span className="flex items-center gap-1.5">
                  <Star size={11} className="text-[var(--gc-amber)]" /> High engagement (3+ actions)
                </span>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              {(() => {
                const list = (ma.allAttendees ?? []).filter(
                  (a) => !attendeeSearch || a.name.toLowerCase().includes(attendeeSearch.toLowerCase())
                );
                if (list.length === 0) {
                  return <p className="py-8 text-center text-[13px] text-[var(--gc-grey)]">No attendees match your search.</p>;
                }
                return (
                  <div className="space-y-1.5">
                    {list.map((a, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5",
                          a.isNewMember
                            ? "border border-[var(--gc-green-soft)] bg-[var(--gc-green-soft)]/30"
                            : "border border-transparent hover:bg-[var(--gc-offwhite)]",
                        )}
                      >
                        {/* Row number */}
                        <span className="w-5 shrink-0 text-right text-[12px] tabular-nums text-[var(--gc-grey)]">
                          {i + 1}
                        </span>

                        {/* Name + new member badge */}
                        <div className="min-w-0 flex-1">
                          <span className="text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: a.isNewMember ? 500 : 400 }}>
                            {a.name}
                          </span>
                          {a.isNewMember && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-[var(--gc-green-soft)] px-1.5 py-0.5 text-[11px] text-[var(--gc-green)]">
                              New member
                            </span>
                          )}
                        </div>

                        {/* Join time */}
                        <span className="flex shrink-0 items-center gap-1 text-[12px] text-[var(--gc-grey)]">
                          <Clock size={11} /> {a.joinTime}
                        </span>

                        {/* Engagement */}
                        {a.engagementActions > 0 && (
                          <span className={cn(
                            "flex shrink-0 items-center gap-1 text-[12px]",
                            a.engagementActions >= 3 ? "text-[var(--gc-amber)]" : "text-[var(--gc-grey)]",
                          )}>
                            {a.engagementActions >= 3 && <Star size={11} />}
                            <Zap size={11} /> {a.engagementActions}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3">
              <p className="text-[12px] text-[var(--gc-grey)]">
                Avg attendance time: <span style={{ fontWeight: 500 }}>{ma.avgAttendanceTime}</span>
              </p>
              <Button
                variant="outline"
                className="h-8 text-[13px]"
                onClick={() => { setShowAllAttendees(false); setAttendeeSearch(""); }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="grid gap-3 md:grid-cols-2">
        <InsightCard
          tone="warning"
          title="80% of new members haven't attended any GCC call"
          summary="89 of 111 new members (Jul 10–Aug 4) have not attended any of the 4 GCC calls."
          explanation="This is the biggest onboarding gap in the community. Most new members join Slack but never make it to a live call. Many joined close to a call date with no advance notice. A same-day welcome message with the next call date and a calendar invite is the highest-leverage action available."
        />
        <InsightCard
          tone="positive"
          title="22 new members did attend — improving trend"
          summary="Attendance rate improved from 14% (after July calls) to 20% after Aug 4 — 22 of 111 new members."
          explanation="New members who do attend are highly motivated. The 6 additional new member attendees on Aug 4 show the community is getting better at on-ramping newcomers. The challenge remains discovery — most new members still never hear about the call after joining Slack."
        />
        <InsightCard
          tone="positive"
          title="Recommend: welcome message on Slack join day"
          summary="A same-day nudge with the GCC calendar invite could convert a large share of the 89 who haven't attended."
          explanation="Automating a welcome message via the ICA agent or a Slack bot — including the next GCC date, recording link, and calendar invite — would give every new member an immediate path to the community call. This single action could move the 20% attendance rate to 35%+ within a month."
        />
        <InsightCard
          tone="info"
          title="Aug 4 was a record call — 63 attendees, 1h 40m"
          summary="The Aug 4 GCC call hit a new attendance record with 63 participants and the longest run time yet."
          explanation="63 attendees (up from 52 on Jul 28) makes Aug 4 the highest-attended call of the series. The longer duration (1h 40m vs 1h 24m) reflects high engagement. Core members who attended all 4 calls: Kristen Yerardi, Jasmine Westbrooks, Nicole Keyes, Greg Bender, Liz Barker, Rithvik Siddam, Otilia Mihai."
        />
      </div>
      </>}
    </div>
  );
}
