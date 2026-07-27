import { CalendarDays, Rocket, Flag, Star, ArrowRight } from "lucide-react";
import { Card } from "../../ui/card";
import { KpiCard, SectionHeading, StatusPill, InsightCard } from "../primitives";
import { SimpleBarChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";

const kindIcon: Record<string, typeof Flag> = {
  Milestone: Flag,
  Event: CalendarDays,
  Launch: Rocket,
};

export function EventsTab() {
  const { analytics } = useDashboard();
  const kpi = analytics.kpis.events;
  const { events, eventEngagement, timeline, upcomingEvents } = analytics;

  const topSessions = [...events].sort((a, b) => b.feedback - a.feedback).slice(0, 3);

  return (
    <div className="space-y-5">
      <SectionHeading title="Events & engagement insights" description="Attendance, participation and the impact of community moments." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Event attendance"       {...kpi.eventAttendance}     accent="blue"   />
        <KpiCard label="Repeat attendees"       {...kpi.repeatAttendees}     accent="green"  />
        <KpiCard label="Feedback score"         {...kpi.feedbackScore}       accent="purple" />
        <KpiCard label="Post-event engagement"  {...kpi.postEventEngagement} accent="blue"   />
        <KpiCard label="Top session"            {...kpi.topSession}          accent="green"  />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Engagement before vs. after events" description="Community activity index" />
          <SimpleBarChart
            data={eventEngagement}
            series={[
              { key: "pre",  name: "Before", color: "grey"  },
              { key: "post", name: "After",  color: "green" },
            ]}
            height={220}
          />
        </Card>

        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Top-performing sessions" />
          <div className="space-y-2">
            {topSessions.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 rounded-md border border-[var(--border)] p-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--gc-purple-soft)] text-[var(--gc-purple)] text-[13px]" style={{ fontWeight: 600 }}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>{s.title}</p>
                  <p className="text-[12px] text-[var(--gc-grey)]">{s.date} · {s.attendance} attendees</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[13px] text-[var(--gc-graphite)]">
                  <Star size={13} className="text-[var(--gc-amber)]" /> {s.feedback}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading title="Growth Community timeline" description="Major moments this year" />
        <ol className="relative ml-2 border-l border-[var(--border)]">
          {timeline.map((t) => {
            const Icon = kindIcon[t.kind] ?? Flag;
            return (
              <li key={t.id} className="mb-4 ml-5 last:mb-0">
                <span className="absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-white text-[var(--gc-ibm-blue)]">
                  <Icon size={13} />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] text-[var(--gc-grey)]">{t.date}</p>
                  <StatusPill status="Steady" />
                </div>
                <p className="text-[14px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>{t.label}</p>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Upcoming opportunities" />
          <div className="space-y-2">
            {upcomingEvents.map((u) => (
              <div key={u.title} className="flex items-center justify-between rounded-md bg-[var(--gc-offwhite)] p-2.5">
                <div>
                  <p className="text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>{u.title}</p>
                  <p className="text-[12px] text-[var(--gc-grey)]">{u.date}</p>
                </div>
                <ArrowRight size={14} className="text-[var(--gc-ibm-blue)]" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Event impact insights" />
          <div className="grid gap-2.5 md:grid-cols-2">
            <InsightCard
              tone="positive"
              title="Town halls drive the biggest lift"
              summary="Mid-year Town Hall lifted post-event activity by 92 index points."
              explanation="Attendees were 2.3× more likely to post in Slack the following week. Recurring town halls are the strongest retention lever available."
            />
            <InsightCard
              tone="info"
              title="Repeat attendance is climbing"
              summary="44% of attendees now join more than one event."
              explanation="Series-style events (Summit → Jam → Awards) build habit. Bundling event invites into a single calendar subscription should push this higher."
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
