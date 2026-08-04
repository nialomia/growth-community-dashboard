import { Leaf, Gauge, Image as ImageIcon, Boxes, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import {
  KpiCard,
  SectionHeading,
  InsightCard,
} from "../primitives";
import { TrendLineChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";

const efficiencySignals = [
  { icon: Gauge, label: "Low-data mode available" },
  { icon: CheckCircle2, label: "Optimised charts" },
  { icon: ImageIcon, label: "Minimal media use" },
  { icon: Boxes, label: "Reusable components" },
];

const actions = [
  "Send a welcome message to the 95 new members who haven't attended any GCC call — include the next call date, calendar invite, and recording link.",
  "Promote the SharePoint site in the Slack channel description — only 55 of 805 members have visited it.",
  "Recognise the 13 core GCC members who attended all 3 July calls — speaker spotlights or a shout-out post builds community momentum.",
];

export function OverviewTab({ onDrill }: { onDrill: (t: any) => void }) {
  const { lowData, analytics } = useDashboard();
  const kpi = analytics.kpis.overview;

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Executive overview"
        description="A snapshot of community growth, engagement and content performance."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Slack members"         value="805"   trend="up"   delta="+108 since Jun 11" accent="blue"   onDrill={() => onDrill("slack")}       definition="Total active members in the Growth Community Slack workspace as of Aug 4, 2026. Source: 8.04 Member Download (805).xlsx." />
        <KpiCard label="New members (54 days)" value="+108"  trend="up"   delta="+15.5%"            accent="green"  onDrill={() => onDrill("slack")}       definition="Net new members Jun 11–Aug 4: 697 → 805 = +108 net (15.5% growth). Source: member download snapshots." />
        <KpiCard label="GCC call attendance"   value="14%"   trend="down" delta="16 of 111 new mbrs" accent="grey"   onDrill={() => onDrill("meeting")}     definition="% of new Slack members (Jul 10–Aug 4) who attended any July GCC call. 16 of 111 = 14%. Source: Teams attendance reports cross-referenced with Slack export." />
        <KpiCard label="SharePoint views"      value="3,603" trend="up"   delta="All time"          accent="blue"   onDrill={() => onDrill("sharepoint")}  definition="Total all-time site visits on the Growth Community SharePoint. Source: Overall Traffic sheet — SiteAnalyticsData_4-Aug,2026.xlsx." />
        <KpiCard label="Unique SP viewers"     value="55"    trend="up"   delta="All time"          accent="purple" onDrill={() => onDrill("sharepoint")}  definition="Distinct authenticated users who have ever visited the SharePoint site (55). Source: Overall Traffic sheet — SiteAnalyticsData_4-Aug,2026.xlsx." />
        <KpiCard label="GCC core members"      value="13"    trend="up"   delta="Attended all 3 July calls" accent="green"  onDrill={() => onDrill("meeting")}     definition="Members who attended every July GCC call (Jul 14, 21 & 28). These are the highest-engagement community members. Source: cross-reference of all 3 Teams attendance reports." />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trend chart */}
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading
            title="Community growth trend"
            description={lowData ? "Simplified for low-data mode" : "Members and active contributors, last 7 months"}
          />
          <TrendLineChart
            data={analytics.growthTrend}
            series={[
              { key: "members", name: "Members", color: "blue" },
              { key: "active", name: "Active contributors", color: "green" },
            ]}
            yFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
        </Card>

        {/* Key insights */}
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Key insights" />
          <div className="space-y-2.5">
            <InsightCard
              tone="positive"
              title="Slack growth — 15.5% in 54 days, 805 members"
              summary="805 members as of Aug 4, up from 697 on Jun 11."
              explanation="+108 net over 54 days: Jun 11→Jul 13 (+81), Jul 13→Jul 28 (+23), Jul 28→Aug 4 (+4). Top countries: US (222), India (169), Ireland (47)."
            />
            <InsightCard
              tone="warning"
              title="14% of new members attended a GCC call"
              summary="16 of 111 new members (Jul 10–Aug 4) attended at least one July GCC call."
              explanation="95 new members have not yet attended any GCC call. Many joined close to a call date with no time to learn about it. A same-day welcome message with the next call date and calendar invite would significantly improve first-call attendance."
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recommended actions */}
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Recommended actions" description="Practical next steps for community managers" />
          <ul className="space-y-2">
            {actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-md bg-[var(--gc-offwhite)] p-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--gc-ibm-blue)] text-[12px] text-white">
                  {i + 1}
                </span>
                <span className="flex-1 text-[14px] text-[var(--gc-graphite-soft)]">{a}</span>
                <Button variant="ghost" className="h-6 px-2 text-[12px] text-[var(--gc-ibm-blue)]">
                  Act <ArrowRight size={13} />
                </Button>
              </li>
            ))}
          </ul>
        </Card>

        {/* Efficiency micro-card */}
        <Card className="gap-3 rounded-md border-[var(--gc-green-soft)] bg-[var(--gc-green-soft)]/40 p-4 shadow-none">
          <div className="flex items-center gap-2">
            <Leaf size={16} className="text-[var(--gc-green)]" />
            <h3 className="text-[var(--gc-graphite)]">Dashboard efficiency</h3>
          </div>
          <ul className="space-y-1.5">
            {efficiencySignals.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-[13px] text-[var(--gc-graphite-soft)]">
                <Icon size={14} className="text-[var(--gc-green)]" />
                {label}
              </li>
            ))}
          </ul>
          <p className="text-[12px] text-[var(--gc-grey)]">
            This view is designed to minimise data transfer and energy use.
          </p>
        </Card>
      </div>
    </div>
  );
}
