import { useState } from "react";
import { Users, Clock, Timer, CalendarDays, Star, Search } from "lucide-react";
// CalendarDays kept for the empty-state fallback below
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { SimpleBarChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";
import { cn } from "../../ui/utils";

type CallFilter = "all" | "jul14" | "jul21" | "jul28";

const CALL_FILTERS: { key: CallFilter; label: string }[] = [
  { key: "all",   label: "Core members" },
  { key: "jul14", label: "July 14"      },
  { key: "jul21", label: "July 21"      },
  { key: "jul28", label: "July 28"      },
];

export function GccOverviewTab() {
  const { analytics } = useDashboard();
  const gcc = analytics.gccCallOverview;
  const ma  = analytics.meetingAttendance; // Jul 28 detailed data

  const [callFilter, setCallFilter] = useState<CallFilter>("all");
  const [coreSearch, setCoreSearch] = useState("");

  if (!gcc) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <CalendarDays size={36} className="text-[var(--gc-grey)]" />
        <p className="text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>No GCC overview data yet</p>
        <p className="max-w-xs text-[13px] text-[var(--gc-grey)]">
          Add a <code className="rounded bg-[var(--gc-offwhite)] px-1">gccCallOverview</code> block
          to <code className="rounded bg-[var(--gc-offwhite)] px-1">analytics.json</code> to see this view.
        </p>
      </div>
    );
  }

  const { calls, summary, crossCallBreakdown, attendanceTrend, coreAttendees, jul14Attendees, jul21Attendees } = gcc;
  const jul28Attendees = ma?.allAttendees?.map(a => a.name) ?? [];

  // Which attendee list to show
  const listToShow: string[] =
    callFilter === "jul14" ? jul14Attendees :
    callFilter === "jul21" ? jul21Attendees :
    callFilter === "jul28" ? jul28Attendees :
    coreAttendees; // "all" → show core (all 3 calls)

  const filteredList = listToShow.filter(n =>
    !coreSearch || n.toLowerCase().includes(coreSearch.toLowerCase())
  );

  const retentionPct = Math.round((summary.attendedAll3 / summary.totalUnique) * 100);
  const repeatPct    = Math.round(((summary.attendedAll3 + summary.attendedExactly2) / summary.totalUnique) * 100);

  // Bar chart data — attendance per call
  const barData = attendanceTrend.map(d => ({ label: d.date, value: d.attendees }));

  return (
    <div className="space-y-5">

      {/* ── KPI row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total unique attendees"
          value={String(summary.totalUnique)}
          trend="up"
          delta="Across all 3 calls"
          accent="blue"
          definition="Distinct individuals who attended at least one of the 3 July GCC calls (Jul 14, 21, 28). Deduplicated by name across all 3 Teams attendance reports."
        />
        <KpiCard
          label="Avg. per call"
          value={String(summary.avgAttendees)}
          trend="flat"
          delta="Jul 14 / 21 / 28"
          accent="grey"
          definition="Simple average of the 3 call attendee counts (62 + 56 + 44) ÷ 3. Source: Teams attendance report — Participants section."
        />
        <KpiCard
          label="Core members (all 3)"
          value={String(summary.attendedAll3)}
          trend="up"
          delta={`${retentionPct}% of unique attendees`}
          accent="green"
          definition="Attendees who appeared in all 3 July Teams attendance reports (Jul 14, 21, and 28). Cross-referenced by exact name match. These are your most engaged community members."
        />
        <KpiCard
          label="Attended 2+ calls"
          value={String(summary.attendedAll3 + summary.attendedExactly2)}
          trend="up"
          delta={`${repeatPct}% repeat attendance`}
          accent="purple"
          definition="Count of attendees who appeared in 2 or all 3 July GCC attendance reports. Includes core members (all 3) plus those who attended exactly 2 calls."
        />
        <KpiCard
          label="Single-call attendees"
          value={String(summary.attendedExactly1)}
          trend="down"
          delta={`${100 - repeatPct}% attended once`}
          accent="grey"
          definition="Attendees who appeared in exactly one of the 3 July attendance reports. These one-time visitors represent the largest re-engagement opportunity."
        />
      </div>

      {/* ── Per-call summary cards ───────────────────────────────── */}
      <div className="grid gap-3 md:grid-cols-3">
        {calls.map((c) => (
          <Card key={c.date} className="gap-2 rounded-md border-[var(--border)] p-4 shadow-none">
            <p className="text-[13px] text-[var(--gc-grey)]">{c.fullDate}</p>
            <p className="text-[22px] text-[var(--gc-graphite)]" style={{ fontWeight: 700 }}>
              {c.attendees}
              <span className="ml-1 text-[14px] font-normal text-[var(--gc-grey)]">attendees</span>
            </p>
            <div className="mt-1 space-y-1 text-[12px] text-[var(--gc-grey)]">
                <span className="flex items-center gap-1.5"><Timer size={12} /> {c.duration}</span>
                <span className="flex items-center gap-1.5"><Clock size={12} /> Avg. {c.avgAttendanceTime}</span>
              </div>
          </Card>
        ))}
      </div>

      {/* ── Attendance trend bar + cross-call breakdown ──────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Attendance per call" description="Jul 14 → Jul 21 → Jul 28" />
          <SimpleBarChart
            data={barData}
            series={[{ key: "value", name: "Attendees", color: "blue" }]}
          />
        </Card>

        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Cross-call attendance breakdown" description={`${summary.totalUnique} unique attendees`} />
          <div className="space-y-2">
            {crossCallBreakdown.map((row) => {
              const pct = Math.round((row.count / summary.totalUnique) * 100);
              const isCore = row.label === "All 3 calls";
              return (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className={cn("flex items-center gap-1.5", isCore ? "text-[var(--gc-graphite)]" : "text-[var(--gc-graphite-soft)]")} style={isCore ? { fontWeight: 500 } : undefined}>
                      {isCore && <Star size={12} className="text-[var(--gc-amber)]" />}
                      {row.label}
                    </span>
                    <span className="tabular-nums text-[var(--gc-grey)]">{row.count} <span className="text-[11px]">({pct}%)</span></span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gc-offwhite)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isCore ? "var(--gc-green)" : "var(--gc-ibm-blue)",
                        opacity: isCore ? 1 : 0.55,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* ── Attendee list with call filter ──────────────────────── */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="Attendee list"
          description={
            callFilter === "all"
              ? `Core members only — attended all 3 July calls (${summary.attendedAll3} people)`
              : `All attendees — ${CALL_FILTERS.find(f => f.key === callFilter)?.label}`
          }
          action={
            <div className="relative hidden sm:block">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gc-grey)]" />
              <Input
                type="search"
                placeholder="Search name…"
                value={coreSearch}
                onChange={(e) => setCoreSearch(e.target.value)}
                className="h-8 w-44 pl-7 text-[13px]"
                aria-label="Search attendees"
              />
            </div>
          }
        />
        {/* Call filter pills */}
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by call">
          {CALL_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setCallFilter(f.key); setCoreSearch(""); }}
              aria-pressed={callFilter === f.key}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                callFilter === f.key
                  ? "border-[var(--gc-ibm-blue)] bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                  : "border-[var(--border)] text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)]",
              )}
            >
              {f.label}
              {f.key !== "all" && (
                <span className="ml-1.5 tabular-nums text-[11px]">
                  {f.key === "jul14" ? `(${gcc.jul14Attendees.length})` :
                   f.key === "jul21" ? `(${gcc.jul21Attendees.length})` :
                   `(${jul28Attendees.length})`}
                </span>
              )}
              {f.key === "all" && <span className="ml-1.5 tabular-nums text-[11px]">({summary.attendedAll3})</span>}
            </button>
          ))}
        </div>

        {filteredList.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[var(--gc-grey)]">No attendees match your search.</p>
        ) : (
          <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredList.map((name, i) => {
              const isCore = callFilter !== "all" && coreAttendees.some(c => c.toLowerCase() === name.toLowerCase());
              return (
                <div key={i} className={cn(
                  "flex items-center gap-2.5 rounded-md border px-3 py-2",
                  isCore ? "border-[var(--gc-green-soft)] bg-[var(--gc-green-soft)]/30" : "border-[var(--border)] bg-white"
                )}>
                  <Users size={14} className={isCore ? "text-[var(--gc-green)]" : "text-[var(--gc-grey-light)]"} />
                  <span className="truncate text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: isCore ? 500 : 400 }}>
                    {name}
                  </span>
                  {isCore && (
                    <span className="ml-auto shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--gc-green-soft)] px-1.5 py-0.5 text-[10px] text-[var(--gc-green)]">
                      <Star size={9} /> Core
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── Insights ────────────────────────────────────────────── */}
      <div className="grid gap-3 md:grid-cols-2">
        <InsightCard
          tone="positive"
          title="13 core members attended all 3 July calls"
          summary="11% of unique attendees showed up to every single July GCC call — a strong engaged core."
          explanation="Kristen Yerardi, Jasmine Westbrooks, Nicole Keyes, Greg Bender, and 9 others were present at all three July calls. These are your highest-value community members and ideal candidates for speaker spotlights, feedback sessions, or community ambassador roles."
        />
        <InsightCard
          tone="warning"
          title="Attendance declined each week — 62 → 56 → 44"
          summary="Total call attendance dropped 29% from July 14 to July 28 despite the community growing."
          explanation="The July 14 call had the highest attendance at 62, while July 28 had just 44 — a 29% drop over 3 weeks. This could reflect calendar conflicts, summer schedules, or a need to re-promote the calls. Cross-referencing with new Slack member join dates shows the July 28 dip coincides with a large influx of members who hadn't yet engaged."
        />
        <InsightCard
          tone="info"
          title="85 attendees (73%) only showed up once"
          summary="Most attendees came to exactly one call — a large re-engagement opportunity exists."
          explanation="73% of the 117 unique attendees in July attended only one call. These single-visit attendees are warm leads — they've shown initial interest but haven't returned. A targeted Slack message or personalised follow-up after their first call could significantly improve repeat attendance."
        />
        <InsightCard
          tone="positive"
          title="Call duration is growing — community is staying longer"
          summary="Average call length grew from 46m (Jul 14) to 1h 34m (Jul 28), a 2× increase in depth."
          explanation="The GCC calls are getting substantially longer as content becomes richer. The July 28 call was over 3× longer than July 14. This signals increasing content value and presenter confidence. Keep tracking whether longer calls correlate with higher or lower repeat attendance."
        />
      </div>
    </div>
  );
}
