import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Users, CalendarDays, Zap, Search, X, Star } from "lucide-react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { useDashboard } from "../../../dashboard-context";
import { cn } from "../../ui/utils";

type Filter = "all" | "attended" | "absent";

export function MeetingTab() {
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

  return (
    <div className="space-y-5">
      <SectionHeading
        title="GCC call attendance by new members"
        description={`${ma.meetingTitle} · ${ma.meetingDate} · ${ma.meetingDuration}`}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="New Slack members"
          value={String(ma.newMemberCount)}
          trend="up"
          delta="Jul 10 – Jul 28"
          accent="blue"
        />
        <KpiCard
          label="Attended GCC call"
          value={String(ma.newMembersAttended)}
          trend="flat"
          delta={`${attendancePct}% of new members`}
          accent="green"
        />
        <KpiCard
          label="Did not attend"
          value={String(ma.newMembersAbsent)}
          trend="down"
          delta={`${absentPct}% of new members`}
          accent="grey"
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
          />
        </div>
        <KpiCard
          label="Avg attendance time"
          value={ma.avgAttendanceTime}
          trend="flat"
          delta={`of ${ma.meetingDuration}`}
          accent="blue"
        />
      </div>

      {/* Attendance summary bar */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="New member call participation"
          description="How many of the 35 new Slack members joined the Jul 28 GCC call"
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
          description="All Slack members who joined between Jul 10 – Jul 28"
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
          title="Only 11% of new members attended"
          summary={`4 of 35 new Slack members attended the Jul 28 GCC call.`}
          explanation="The majority of new members (31) joined the Slack channel but did not attend the Growth Community Call on the same day. This is a high-impact onboarding gap — new members joining on Jul 27–28 may not have had enough notice, and those joining Jul 10 may have forgotten by call day."
        />
        <InsightCard
          tone="info"
          title="Engaged attendees show strong participation"
          summary="3 of 4 attending new members took active engagement actions (unmuted, camera, reactions)."
          explanation="Kuber Saraswat was the most active new member with 7 engagement actions including 3 raised hands and camera on. Brayden Wisniewski had 4 actions. This signals that new members who do attend are highly motivated — the challenge is getting them there in the first place."
        />
        <InsightCard
          tone="positive"
          title="Recommend: welcome email on Slack join day"
          summary="A same-day nudge with the GCC calendar invite could raise new member call attendance significantly."
          explanation="Members joining Jul 27–28 had little to no time to learn about the call. Automating a welcome message via the ICA agent or a Slack bot — including the next GCC date and a calendar link — could convert a large portion of the 89% who currently miss the first call."
        />
        <InsightCard
          tone="info"
          title="Jul 28 cohort is the largest risk group"
          summary="2 members joined on the same day as the call (Jul 28) — zero attended."
          explanation="Joyce Huang and Nicole Ruedge joined Slack on Jul 28 itself, making it nearly impossible for them to have known about the call. These members are strong candidates for a personalised follow-up pointing them to the next GCC session and the recording."
        />
      </div>
    </div>
  );
}
