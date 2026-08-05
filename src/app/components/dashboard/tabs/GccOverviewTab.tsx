import { useState } from "react";
import { Users, Clock, Timer, CalendarDays, Star, Search } from "lucide-react";
// CalendarDays kept for the empty-state fallback below
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { SimpleBarChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";
import { cn } from "../../ui/utils";

type CallFilter = "all" | "jul14" | "jul21" | "jul28" | "aug4";

const CALL_FILTERS: { key: CallFilter; label: string }[] = [
  { key: "all",   label: "Core members" },
  { key: "jul14", label: "July 14"      },
  { key: "jul21", label: "July 21"      },
  { key: "jul28", label: "July 28"      },
  { key: "aug4",  label: "Aug 4"        },
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
  const jul28Attendees = (ma?.allAttendees ?? []).map(a => a.name);
  const aug4Attendees  = (gcc as any).aug4Attendees as string[] ?? [];

  // Which attendee list to show
  const listToShow: string[] =
    callFilter === "jul14" ? jul14Attendees :
    callFilter === "jul21" ? jul21Attendees :
    callFilter === "jul28" ? jul28Attendees :
    callFilter === "aug4"  ? aug4Attendees  :
    coreAttendees; // "all" → core members

  const filteredList = listToShow.filter(n =>
    !coreSearch || n.toLowerCase().includes(coreSearch.toLowerCase())
  );

  // Use attendedAll4 if present, fall back to attendedAll3
  const coreCount = (summary as any).attendedAll4 ?? (summary as any).attendedAll3 ?? 0;
  const retentionPct = Math.round((coreCount / summary.totalUnique) * 100);
  const repeatPct    = Math.round(((coreCount + summary.attendedExactly2) / summary.totalUnique) * 100);

  // Bar chart — label nicely
  const barData = attendanceTrend.map(d => ({
    label: d.date === "jul14" ? "Jul 14" :
           d.date === "jul21" ? "Jul 21" :
           d.date === "jul28" ? "Jul 28" :
           d.date === "aug4"  ? "Aug 4"  : d.date,
    value: d.attendees
  }));

  return (
    <div className="space-y-5">

      {/* ── KPI row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total unique attendees"
          value={String(summary.totalUnique)}
          trend="up"
          delta={`Across all ${calls.length} calls`}
          accent="blue"
          definition={`Distinct individuals who attended at least one of the ${calls.length} GCC calls. Deduplicated by name across all Teams attendance reports.`}
        />
        <KpiCard
          label="Avg. per call"
          value={String(summary.avgAttendees)}
          trend="up"
          delta={calls.map(c => c.attendees).join(" / ")}
          accent="grey"
          definition={`Simple average of all ${calls.length} call attendee counts. Source: Teams attendance reports.`}
        />
        <KpiCard
          label={`Core members (all ${calls.length})`}
          value={String(coreCount)}
          trend="up"
          delta={`${retentionPct}% of unique attendees`}
          accent="green"
          definition={`Attendees who appeared in all ${calls.length} GCC attendance reports. These are your most engaged community members.`}
        />
        <KpiCard
          label="Attended 2+ calls"
          value={String(coreCount + summary.attendedExactly2)}
          trend="up"
          delta={`${repeatPct}% repeat attendance`}
          accent="purple"
          definition="Count of attendees who appeared in 2 or more GCC attendance reports."
        />
        <KpiCard
          label="Single-call attendees"
          value={String(summary.attendedExactly1)}
          trend="down"
          delta={`${100 - repeatPct}% attended once`}
          accent="grey"
          definition="Attendees who appeared in exactly one attendance report. These one-time visitors are the largest re-engagement opportunity."
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
          <SectionHeading title="Attendance per call" description="Jul 14 → Jul 21 → Jul 28 → Aug 4" />
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
              const isCore = row.label === "All 4 calls";
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
              ? `Core members only — attended all ${calls.length} calls (${coreCount} people)`
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
                   f.key === "aug4"  ? `(${aug4Attendees.length})` :
                   `(${jul28Attendees.length})`}
                </span>
              )}
              {f.key === "all" && <span className="ml-1.5 tabular-nums text-[11px]">({coreCount})</span>}
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
          title="Aug 4 was the biggest call yet — 63 attendees"
          summary="Aug 4 had the highest attendance of all 4 calls, recovering strongly from the Jul 28 dip (44)."
          explanation="After dipping to 44 on Jul 28, the Aug 4 call rebounded to 63 — the highest of the series. SharePoint also spiked to 310 visits on Aug 4 alone, suggesting strong content interest. The Retrospective doc received 95 views in the last 7 days."
        />
        <InsightCard
          tone="positive"
          title="7 core members attended all 4 calls"
          summary="Kristen Yerardi, Jasmine Westbrooks, Nicole Keyes, Greg Bender, Liz Barker, Rithvik Siddam, Otilia Mihai attended every single GCC call."
          explanation="These 7 members have been present at every GCC call — Jul 14, 21, 28, and Aug 4. They are your highest-value community members and ideal candidates for speaker spotlights or ambassador roles. 10 more attended 3 of the 4 calls."
        />
        <InsightCard
          tone="info"
          title="111 of 146 unique attendees (76%) came to only one call"
          summary="Most people tried one call but haven't returned — a large re-engagement opportunity."
          explanation="With 146 unique attendees across 4 calls, 76% attended only once. These warm leads have shown interest but need a reason to return. A personalised follow-up after their first call — recording link, next call date, calendar invite — could significantly lift repeat attendance."
        />
        <InsightCard
          tone="positive"
          title="Call duration holding strong — 1h 40m on Aug 4"
          summary="The Aug 4 call ran for 1h 40m with an average attendance time of 43m 47s."
          explanation="Participants are staying engaged throughout. The Aug 4 call duration (1h 40m) is consistent with the Jul 28 call length. Nicole Keyes had 18 engagement actions, Mariana Chiabotto 10, Jasmine Westbrooks 9 — the content is generating active participation."
        />
      </div>
    </div>
  );
}
