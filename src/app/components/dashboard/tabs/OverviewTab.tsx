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
  "Re-engage the Ops Network segment with a targeted Slack campaign.",
  "Refresh 2 stale SharePoint guides flagged below.",
  "Promote the Builder Awards recap to sustain post-event momentum.",
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
        <KpiCard label="Total members"        {...kpi.totalMembers}       accent="blue"   onDrill={() => onDrill("slack")} />
        <KpiCard label="Monthly growth"       {...kpi.monthlyGrowth}      accent="green"  onDrill={() => onDrill("slack")} />
        <KpiCard label="Active contributors"  {...kpi.activeContributors} accent="purple" onDrill={() => onDrill("slack")} />
        <KpiCard label="SharePoint views"     {...kpi.sharepointViews}    accent="blue"   onDrill={() => onDrill("sharepoint")} />
        <KpiCard label="ICA agent usage"      {...kpi.icaAgentUsage}      accent="purple" onDrill={() => onDrill("ica")} />
        <KpiCard label="Engagement score"     {...kpi.engagementScore}    accent="grey"   onDrill={() => onDrill("events")} />
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
              title="Growth is accelerating"
              summary="Members grew 8.9% this month, the strongest rate of 2026."
              explanation="Net new members (+570) outpaced churn. AMER and EMEA drove 78% of the gain, largely from the Data & AI Guild and New Grads segments."
            />
            <InsightCard
              tone="warning"
              title="Two segments cooling"
              summary="Ops Network and Partner Community engagement is trending down."
              explanation="Weekly active rate fell below 45% for both. Consider a re-engagement nudge and reviewing the content mix relevant to these audiences."
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
