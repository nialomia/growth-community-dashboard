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
  "Share the Jul 28 call doc link in Slack — it's the #1 viewed resource and drives repeat visits.",
  "Send a welcome message to the 31 new members who joined but missed the GCC call, with the next call date and recording link.",
  "Promote the SharePoint site in the Slack channel description — only 38 of 801 members have visited.",
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
        <KpiCard label="Slack members"        value="801"   trend="up"   delta="+99 since Jul 10" accent="blue"   onDrill={() => onDrill("slack")} />
        <KpiCard label="New members (18 days)" value="+99"  trend="up"   delta="+14.1%"           accent="green"  onDrill={() => onDrill("slack")} />
        <KpiCard label="GCC call attendance"  value="11%"   trend="down" delta="4 of 35 new mbrs" accent="grey"   onDrill={() => onDrill("meeting")} />
        <KpiCard label="SharePoint views"     value="2,862" trend="up"   delta="+496% vs Jun"     accent="blue"   onDrill={() => onDrill("sharepoint")} />
        <KpiCard label="Unique SP viewers"    value="38"    trend="up"   delta="All time"          accent="purple" onDrill={() => onDrill("sharepoint")} />
        <KpiCard label="Resource freshness"   value="83%"   trend="up"   delta="5 of 6 fresh"     accent="green"  onDrill={() => onDrill("sharepoint")} />
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
              title="Strong Slack growth — 14.1% in 18 days"
              summary="801 members as of Jul 28, up from 702 on Jul 10. AMER leads at 54%."
              explanation="99 net new members joined in 18 days (108 added, 9 removed). At ~5.5 members/day the community is on track to reach ~900 by end of August. Top countries: US (222), India (169), Ireland (47)."
            />
            <InsightCard
              tone="warning"
              title="Only 11% of new members attended the GCC call"
              summary="4 of 35 new Slack members attended the Jul 28 call — 31 missed it."
              explanation="New members joining Jul 27–28 had no time to learn about the call. A same-day welcome message with the next call date and calendar link would significantly improve first-call attendance."
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
