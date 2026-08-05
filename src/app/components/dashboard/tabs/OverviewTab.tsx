import { CheckCircle2, ArrowRight, Users, BarChart3, CalendarCheck, Globe } from "lucide-react";
import { Button } from "../../ui/button";
import {
  KpiCard,
  SectionHeading,
  InsightCard,
} from "../primitives";
import { TrendLineChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";

const actions = [
  {
    icon: Users,
    title: "Welcome new members",
    body: "Send a same-day welcome message to the 95 new members who haven't attended any GCC call — include the next call date, calendar invite, and recording link.",
    color: "text-[var(--gc-ibm-blue)]",
    bg: "bg-[var(--gc-ibm-blue-soft)]",
  },
  {
    icon: Globe,
    title: "Promote SharePoint",
    body: "Promote the SharePoint site in the Slack channel description — only 55 of 805 members have visited it.",
    color: "text-[var(--gc-purple)]",
    bg: "bg-[var(--gc-purple-soft)]",
  },
  {
    icon: CalendarCheck,
    title: "Recognise core members",
    body: "Recognise the 13 core GCC members who attended all 3 July calls — speaker spotlights or a shout-out post builds community momentum.",
    color: "text-[var(--gc-green)]",
    bg: "bg-[var(--gc-green-soft)]",
  },
];

export function OverviewTab({ onDrill }: { onDrill: (t: any) => void }) {
  const { lowData, analytics } = useDashboard();

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] text-[var(--gc-graphite)]" style={{ fontWeight: 700, letterSpacing: "-.4px" }}>
            Overview
          </h1>
          <p className="mt-1 text-[13px] text-[var(--gc-grey)]">
            Growth Community · Aug 4, 2026 snapshot
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[var(--gc-green-soft)] px-3 py-1.5 text-[12px] text-[var(--gc-green)]" style={{ fontWeight: 600 }}>
          <BarChart3 size={13} />
          805 members
        </span>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Slack members"
          value="805"
          trend="up"
          delta="+108 since Jun 11"
          accent="blue"
          onDrill={() => onDrill("slack")}
          definition="Total active members in the Growth Community Slack workspace as of Aug 4, 2026."
        />
        <KpiCard
          label="Growth (54 days)"
          value="+15.5%"
          trend="up"
          delta="697 → 805"
          accent="green"
          onDrill={() => onDrill("slack")}
          definition="Net growth Jun 11–Aug 4: 697 → 805 = +108 members (15.5%)."
        />
        <KpiCard
          label="GCC attendance"
          value="14%"
          trend="down"
          delta="16 of 111 new mbrs"
          accent="grey"
          onDrill={() => onDrill("meeting")}
          definition="% of new Slack members (Jul 10–Aug 4) who attended any July GCC call."
        />
        <KpiCard
          label="SharePoint views"
          value="3,603"
          trend="up"
          delta="All time"
          accent="blue"
          onDrill={() => onDrill("sharepoint")}
          definition="Total all-time site visits on the Growth Community SharePoint."
        />
        <KpiCard
          label="Unique SP viewers"
          value="55"
          trend="up"
          delta="All time"
          accent="purple"
          onDrill={() => onDrill("sharepoint")}
          definition="Distinct authenticated users who have ever visited the SharePoint site."
        />
        <KpiCard
          label="GCC core members"
          value="13"
          trend="up"
          delta="All 3 July calls"
          accent="green"
          onDrill={() => onDrill("meeting")}
          definition="Members who attended every July GCC call (Jul 14, 21 & 28)."
        />
      </div>

      {/* Chart + Insights row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div
          className="rounded-xl border border-[var(--border)] bg-white p-5 lg:col-span-2"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <SectionHeading
            title="Community growth"
            description={lowData ? "Simplified for low-data mode" : "Member count snapshots · Jun 11, Jul 13, Aug 4"}
          />
          <div className="mt-4">
            <TrendLineChart
              data={analytics.growthTrend}
              series={[{ key: "members", name: "Members", color: "blue" }]}
              yFormatter={(v) => String(v)}
            />
          </div>
        </div>

        <div
          className="rounded-xl border border-[var(--border)] bg-white p-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <SectionHeading title="Key insights" />
          <div className="mt-4 space-y-3">
            <InsightCard
              tone="positive"
              title="15.5% growth in 54 days"
              summary="805 members as of Aug 4, up from 697 on Jun 11."
              explanation="+108 net over 54 days: Jun 11→Jul 13 (+81), Jul 13→Aug 4 (+27). Top countries: US, India, Ireland."
            />
            <InsightCard
              tone="warning"
              title="Only 14% of new members attended a GCC call"
              summary="16 of 111 new members attended at least one July GCC call."
              explanation="95 new members have not attended any GCC call. A same-day welcome message with the next call date and calendar invite would significantly improve first-call attendance."
            />
          </div>
        </div>
      </div>

      {/* Recommended actions */}
      <div
        className="rounded-xl border border-[var(--border)] bg-white p-5"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <SectionHeading
          title="Recommended actions"
          description="Practical next steps for community managers"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {actions.map((a, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border)] p-4 transition-colors hover:border-[var(--gc-ibm-blue)]/40"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {/* Icon badge */}
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.bg}`}>
                <a.icon size={16} className={a.color} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 650 }}>
                  {a.title}
                </p>
                <p className="mt-1 text-[12px] text-[var(--gc-grey)] leading-relaxed">
                  {a.body}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-auto h-8 w-fit gap-1 px-3 text-[12px] text-[var(--gc-ibm-blue)] hover:bg-[var(--gc-ibm-blue-soft)] rounded-lg"
              >
                Take action <ArrowRight size={12} />
              </Button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
