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
        <KpiCard label="Page views"          {...kpi.pageViews}         accent="blue"   />
        <KpiCard label="Unique viewers"      {...kpi.uniqueViewers}     accent="green"  />
        <KpiCard label="Avg. engagement"     {...kpi.avgEngagement}     accent="grey"   />
        <KpiCard label="Resource freshness"  {...kpi.resourceFreshness} accent="blue"   />
        <KpiCard label="Active resources"    {...kpi.activeResources}   accent="green"  />
      </div>

      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading title="Views & unique viewers" description="Jul 21 – Jul 28" />
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
            {ranked.slice(0, 3).map((r, i) => {
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
              title="Jul 28 call doc is the #1 resource"
              summary="Growth Community - 2026 July 28 leads with 11 views and is the most downloaded resource this period."
              explanation="The most recent call document consistently attracts the most traffic, suggesting members return to SharePoint specifically after each call. Pin the latest call doc to the site home page and share the link in the Slack recap post to maximise views."
            />
            <InsightCard
              tone="positive"
              title="Traffic grew 496% from Jun to Jul"
              summary="Page views jumped from 378 in June to 2,255 in July — the site is gaining strong momentum."
              explanation="The July spike aligns with the GCC calls and showcase sessions. To sustain this growth, maintain a regular posting cadence after each call and promote the SharePoint link consistently in Slack and during the weekly call itself."
            />
            <InsightCard
              tone="warning"
              title="Only 38 unique viewers all time"
              summary="Total audience reach is still very limited — the site has 801 Slack members but only 38 have visited SharePoint."
              explanation="Less than 5% of the Slack community has discovered the SharePoint site. Add the site link to the Slack channel description, include it in the new member welcome message, and reference it in ICA agent responses when members ask about resources or past calls."
            />
            <InsightCard
              tone="info"
              title="Call recordings need better labelling"
              summary="3 of the top 6 resources are call recordings or duplicates from July 21 — consolidation would improve navigation."
              explanation="The 2025–26 Call Index is the right place to centralise all recordings, but it only has 3 views. Promote the index doc as the single destination for past calls rather than linking individual recordings. Archive or merge the duplicate July 21 entries to reduce clutter."
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
