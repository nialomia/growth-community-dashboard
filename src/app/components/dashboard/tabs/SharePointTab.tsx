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
        <KpiCard label="Page views"      {...kpi.pageViews}     accent="blue"  definition="Total all-time site visits on the Growth Community SharePoint. Source: Overall Traffic sheet — SiteAnalyticsData_4-Aug,2026.xlsx." />
        <KpiCard label="Unique viewers"  {...kpi.uniqueViewers} accent="green" definition="Distinct authenticated users who visited at least once, all time (55). Source: Overall Traffic sheet — all-time row." />
        <KpiCard label="Avg. engagement" {...kpi.avgEngagement} accent="grey"  definition="Share of total all-time visits from desktop devices. 3,366 of 3,603 visits (93%) were desktop. Source: Usage by Device sheet." />
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
          title="Jul 28 call deck is the #1 member resource"
          summary="The Growth Community Jul 28 deck logged 42 visits from 8 unique viewers — the most-viewed document this week."
          explanation="The Jul 28 call deck (42 visits) and the homepage (36 visits) are the two most-used member-facing resources. The call recording also has 7 unique viewers — members are actively going back to review call content. Consider linking both from the Slack channel description."
        />
        <InsightCard
          tone="warning"
          title="Only 55 unique viewers all time across 3,603 visits"
          summary="High repeat visit rate — the same 55 people are driving almost all traffic."
          explanation="With 3,603 all-time visits and only 55 unique viewers, each viewer averages ~65 visits. The site is very useful to its existing audience but has almost no new discovery. Only 55 of 805 Slack members have ever visited. Adding the SharePoint link to the Slack channel header and new member welcome message is the highest-impact action to expand reach."
        />
        <InsightCard
          tone="positive"
          title="Strong week — 618 visits from 30 unique viewers in last 7 days"
          summary="Jul 29–Aug 4 was the most active week yet, with 613 site visits and 45 unique viewers."
          explanation="The Jul 29–Aug 4 week edged out the previous two high weeks (601 each). 30 unique viewers in the last 7 days shows the audience is actively engaged. The Jul 28 call recording and the Maximo showcase deck are likely driving the traffic spike."
        />
      </div>
    </div>
  );
}
