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
import { KpiCard, SectionHeading, StatusPill, InsightCard } from "../primitives";
import { TrendLineChart } from "../charts";
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
      <SectionHeading title="SharePoint analytics" description="How Resources Are Discovered, Used, and Maintained Across the Growth Community" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Page views"         {...kpi.pageViews}         accent="blue"   definition="Total site visits recorded on the Growth Community SharePoint site all time (2,862). Source: Overall Traffic sheet — Site visits column." />
        <KpiCard label="Unique viewers"     {...kpi.uniqueViewers}     accent="green"  definition="Distinct authenticated users who visited at least one page, all time. One person visiting 10 pages = 1 unique viewer. Source: Overall Traffic sheet." />
        <KpiCard label="Avg. engagement"    {...kpi.avgEngagement}     accent="grey"   definition="Share of total visits coming from desktop devices. 2,704 of 2,862 visits (94%) were desktop. Source: Usage by Device sheet." />
        <KpiCard label="Resource freshness" {...kpi.resourceFreshness} accent="blue"   definition="Percentage of tracked documents classified as Fresh (created or updated within 30 days). 18 of 20 resources = 90%. Source: Popular Content sheet." />
        <KpiCard label="Active resources"   {...kpi.activeResources}   accent="green"  definition="Total number of documents tracked in the Popular Content sheet of the SharePoint analytics export. Source: SiteAnalyticsData_28-Jul,2026.xlsx." />
      </div>

      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading title="Views & unique viewers" description="Jul 8–28, weekly" />
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
            {ranked.slice(0, 5).map((r, i) => {
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
              tone="positive"
              title="Themed Conversation Leader Kit is the #1 resource"
              summary="The Jul 28 Leader Kit logged 69 visits — nearly 3× the next most-visited document."
              explanation="The Themed Conversation Leader Kit (Jul 28) had 69 visits from 4 unique viewers, far outpacing the homepage (26 visits). This suggests members are returning repeatedly to use this resource actively. Keep it pinned prominently and create future call kits in the same format."
            />
            <InsightCard
              tone="warning"
              title="Only 38 unique viewers all time across 2,862 visits"
              summary="High repeat visit rate — the same 38 people are driving almost all traffic."
              explanation="With 2,862 total visits and only 38 unique viewers all time, each viewer averages ~75 visits. This signals the site is useful to its existing audience but has very low discovery. Adding the SharePoint link to the Slack channel header and new member welcome message is the highest-impact action to expand reach."
            />
            <InsightCard
              tone="info"
              title="94% of visits come from desktop"
              summary="2,704 of 2,862 total visits were from desktop — mobile and tablet usage is negligible."
              explanation="The SharePoint site is essentially desktop-only right now. This is typical for an internal knowledge site, but worth noting if content is ever shared during mobile-heavy contexts like Slack on mobile. No action needed unless mobile engagement becomes a goal."
            />
            <InsightCard
              tone="positive"
              title="20 active resources — strong content library"
              summary="The site has 20 tracked documents, 18 of which are Fresh (updated within 30 days)."
              explanation="The 90% freshness rate reflects strong content hygiene. The two non-fresh items are the 2025 Call Index (Aging) and a Jan 2025 PPM board update (Stale). Consider archiving the stale item or adding a note that it's for historical reference only."
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
