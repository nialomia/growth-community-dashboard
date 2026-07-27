import { useState } from "react";
import { FileText, FileBarChart, LayoutTemplate, Download, ArrowUpRight } from "lucide-react";
import { Card } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { KpiCard, SectionHeading, StatusPill, InsightCard } from "../primitives";
import { SimpleBarChart, TrendLineChart } from "../charts";
import { filterOptions } from "../../../data";
import { useDashboard } from "../../../dashboard-context";

const typeIcon: Record<string, typeof FileText> = {
  Guide: FileText,
  Report: FileBarChart,
  Template: LayoutTemplate,
};

const freshnessStatus: Record<string, string> = {
  Fresh: "Healthy",
  Aging: "Monitor",
  Stale: "Needs work",
};

export function SharePointTab() {
  const { analytics } = useDashboard();
  const kpi = analytics.kpis.sharepoint;
  const { sharepointResources, sharepointTrend, sharepointFreshness } = analytics;

  const [type, setType] = useState("All content");
  const [month, setMonth] = useState("All months");

  const filtered = sharepointResources.filter(
    (r) => (type === "All content" || r.type === type) && (month === "All months" || r.month === month),
  );
  const ranked = [...filtered].sort((a, b) => b.views - a.views);

  return (
    <div className="space-y-5">
      <SectionHeading title="SharePoint analytics" description="How community resources are discovered and used." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Page views"          {...kpi.pageViews}         accent="blue"   />
        <KpiCard label="Unique viewers"      {...kpi.uniqueViewers}     accent="green"  />
        <KpiCard label="Downloads"           {...kpi.downloads}         accent="purple" />
        <KpiCard label="Avg. engagement"     {...kpi.avgEngagement}     accent="grey"   />
        <KpiCard label="Resource freshness"  {...kpi.resourceFreshness} accent="blue"   />
        <KpiCard label="Active resources"    {...kpi.activeResources}   accent="green"  />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Views & unique viewers" description="Last 6 months" />
          <TrendLineChart
            data={sharepointTrend}
            series={[
              { key: "views",  name: "Page views",     color: "blue"   },
              { key: "unique", name: "Unique viewers",  color: "purple" },
            ]}
            yFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
        </Card>

        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Downloads by resource" />
          <SimpleBarChart
            data={ranked.slice(0, 5).map((r) => ({ name: r.title.split(" ")[0], downloads: r.downloads }))}
            series={[{ key: "downloads", name: "Downloads", color: "green" }]}
            height={220}
          />
        </Card>
      </div>

      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="Most visited resources"
          description="Ranked by page views"
          action={
            <div className="flex gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8 w-[140px]" aria-label="Filter by content type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.content.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-8 w-[130px]" aria-label="Filter by month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["All months", "Jul", "Jun", "May", "Apr", "Feb"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        />
        {ranked.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-[var(--gc-grey)]">No resources match these filters.</p>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {ranked.map((r, i) => {
              const Icon = typeIcon[r.type] ?? FileText;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-md border border-[var(--border)] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]">
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>
                      #{i + 1} {r.title}
                    </p>
                    <p className="text-[12px] text-[var(--gc-grey)]">
                      {r.type} · {r.owner}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="inline-flex items-center gap-1 tabular-nums text-[14px] text-[var(--gc-graphite)]">
                      {r.views.toLocaleString()} <ArrowUpRight size={13} className="text-[var(--gc-grey)]" />
                    </p>
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[12px] text-[var(--gc-grey)]">
                      <Download size={12} /> {r.downloads.toLocaleString()}
                    </div>
                  </div>
                  <StatusPill status={freshnessStatus[r.freshness]} />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Content insights" description="Where to act next" />
          <div className="grid gap-2.5 md:grid-cols-2">
            <InsightCard
              tone="warning"
              title="Refresh: Brand Voice Guidelines"
              summary="Stale since February with declining views."
              explanation="Views dropped 22% over 3 months and it hasn't been updated in 5. Refreshing tone examples and re-linking from onboarding should lift discovery."
            />
            <InsightCard
              tone="info"
              title="Archive: Moderation Handbook"
              summary="Aging content with low downloads relative to views."
              explanation="High view-to-download ratio suggests readers aren't finding it actionable. Consider consolidating into the Onboarding Playbook."
            />
            <InsightCard
              tone="positive"
              title="Promote: Onboarding Playbook"
              summary="Top performer and fresh — expand its reach."
              explanation="Feature it in the Slack welcome flow and next community call to capitalise on strong engagement."
            />
            <InsightCard
              tone="info"
              title="Freshness dipping overall"
              summary="Only 68% of resources are marked fresh."
              explanation="Set a quarterly review cadence for Guides and Reports to keep the freshness score above 75%."
            />
          </div>
        </Card>

        <Card className="gap-2 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Resource freshness" />
          {sharepointFreshness.map((f) => (
            <div key={f.label} className="mt-2">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--gc-graphite-soft)]">{f.label}</span>
                <span className="tabular-nums text-[var(--gc-grey)]">{f.pct}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gc-offwhite)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${f.pct}%`,
                    background:
                      f.label === "Fresh" ? "var(--gc-green)" : f.label === "Aging" ? "var(--gc-amber)" : "var(--gc-red)",
                  }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
