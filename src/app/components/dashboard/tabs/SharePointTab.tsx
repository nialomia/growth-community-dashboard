import { useState } from "react";
import { FileText, FileBarChart, LayoutTemplate, ArrowUpRight } from "lucide-react";
import { Card } from "../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { TrendLineChart } from "../charts";
import { filterOptions } from "../../../data";
import { useDashboard } from "../../../dashboard-context";

const typeIcon: Record<string, typeof FileText> = {
  Guide: FileText,
  Report: FileBarChart,
  Template: LayoutTemplate,
};

export function SharePointTab() {
  const { analytics } = useDashboard();
  const kpi = analytics.kpis.sharepoint;
  const { sharepointResources, sharepointTrend } = analytics;

  const [type, setType] = useState("All content");
  const [month, setMonth] = useState("All months");

  const filtered = sharepointResources.filter(
    (r) => (type === "All content" || r.type === type) && (month === "All months" || r.month === month),
  );
  const ranked = [...filtered].sort((a, b) => b.views - a.views);

  return (
    <div className="space-y-5">
      <SectionHeading title="SharePoint analytics" description="How resources are discovered and used across the Growth Community" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Page views"      {...kpi.pageViews}     accent="blue"  definition="Total all-time site visits on the Growth Community SharePoint. Source: Overall Traffic sheet — SiteAnalyticsData_5-Aug,2026.xlsx." />
        <KpiCard label="Unique viewers"  {...kpi.uniqueViewers} accent="green" definition="Distinct authenticated users who visited at least once, all time (62). Source: Overall Traffic sheet — all-time row." />
        <KpiCard label="Avg. engagement" {...kpi.avgEngagement} accent="grey"  definition="Share of total all-time visits from desktop devices. 100% desktop. Source: Usage by Device sheet — SiteAnalyticsData_5-Aug,2026.xlsx." />
      </div>

      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading title="Views & unique viewers" description="Jul 8 – Aug 4, weekly" />
        <TrendLineChart
          data={sharepointTrend}
          series={[
            { key: "views",  name: "Page views",     color: "blue"   },
            { key: "unique", name: "Unique viewers (sum of daily)",  color: "purple" },
          ]}
        />
      </Card>

      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="Most visited resources"
          description="Member-facing content only · ranked by page views"
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <InsightCard
          tone="positive"
          title="Jul 29–Aug 4 was the strongest week yet — 923 views"
          summary="The last week hit 923 page views and 64 unique viewers — both all-time highs."
          explanation="Week-over-week growth has been consistent: Jul 8–14 (327) → Jul 15–21 (700) → Jul 22–28 (728) → Jul 29–Aug 4 (923). The Aug 4 GCC call drove a spike in views as members accessed call decks and recordings. Linking resources in the Slack call recap will sustain this momentum."
        />
        <InsightCard
          tone="warning"
          title="Only 62 unique viewers all time across 3,990 visits"
          summary="High repeat visit rate — the same 62 people are driving almost all traffic."
          explanation="With 3,990 all-time visits and only 62 unique viewers, each viewer averages ~64 visits. The site is highly useful to its existing audience but has almost no new discovery. Only 62 of 803 Slack members have ever visited (7.7%). Adding the SharePoint link to the Slack channel header and the new member welcome message is the highest-impact action to expand reach."
        />
        <InsightCard
          tone="positive"
          title="Viewer base grew — 62 unique viewers vs 55 the week before"
          summary="7 new unique visitors joined the site in the most recent week — the largest weekly increase yet."
          explanation="The jump from 55 to 62 unique viewers in a single week shows that the Aug 4 GCC call successfully drove new people to the SharePoint site. Replicating this pattern — linking resources in every call recap message — is the most reliable way to keep expanding the viewer base."
        />
      </div>
    </div>
  );
}
