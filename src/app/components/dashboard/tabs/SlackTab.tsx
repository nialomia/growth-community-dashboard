import { useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight, HeartPulse } from "lucide-react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { KpiCard, SectionHeading, StatusPill, TrendArrow, InsightCard } from "../primitives";
import { TrendLineChart, SimpleBarChart } from "../charts";
import { StatefulCard } from "../StatefulCard";
import { useDashboard } from "../../../dashboard-context";

const PAGE_SIZE = 4;

export function SlackTab() {
  const { lowData, analytics } = useDashboard();
  const kpi = analytics.kpis.slack;
  const { slackGrowth, cohorts, segments, communityHealth } = analytics;

  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("All");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return segments.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) &&
        (region === "All" || s.region === region),
    );
  }, [query, region, segments]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-5">
      <SectionHeading title="Slack member growth" description="How the community is joining, staying and contributing." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="New members"        {...kpi.newMembers}         accent="green"  />
        <KpiCard label="Returning members"  {...kpi.returningMembers}   accent="blue"   />
        <KpiCard label="Inactive members"   {...kpi.inactiveMembers}    accent="grey"   />
        <KpiCard label="Active contributors"{...kpi.activeContributors} accent="purple" />
        <KpiCard label="Engagement rate"    {...kpi.engagementRate}     accent="blue"   />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Member movement over time" description="New, returning and inactive members" />
          <TrendLineChart
            data={slackGrowth}
            series={[
              { key: "newMembers", name: "New",      color: "green" },
              { key: "returning",  name: "Returning", color: "blue"  },
              { key: "inactive",   name: "Inactive",  color: "grey"  },
            ]}
          />
        </Card>

        {/* Community health indicator */}
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <div className="flex items-center gap-2">
            <HeartPulse size={16} className="text-[var(--gc-green)]" />
            <h3 className="text-[var(--gc-graphite)]">Community health</h3>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={communityHealth.status} />
            <span className="tabular-nums text-[var(--gc-graphite)]" style={{ fontSize: 22, fontWeight: 600 }}>
              {communityHealth.score}
            </span>
          </div>
          <div className="space-y-2">
            {communityHealth.signals.map((m) => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--gc-graphite-soft)]">{m.label}</span>
                  <StatusPill status={m.status} />
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gc-offwhite)]">
                  <div className="h-full rounded-full bg-[var(--gc-green)]" style={{ width: `${m.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Cohort analysis */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading title="Cohort retention" description="% of each joining cohort still active, by week" />
        {lowData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cohort</TableHead>
                <TableHead className="text-right">W1</TableHead>
                <TableHead className="text-right">W2</TableHead>
                <TableHead className="text-right">W3</TableHead>
                <TableHead className="text-right">W4</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohorts.map((c) => (
                <TableRow key={c.cohort}>
                  <TableCell>{c.cohort}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.w1}%</TableCell>
                  <TableCell className="text-right tabular-nums">{c.w2}%</TableCell>
                  <TableCell className="text-right tabular-nums">{c.w3}%</TableCell>
                  <TableCell className="text-right tabular-nums">{c.w4}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <SimpleBarChart
            data={cohorts}
            series={[
              { key: "w1", name: "Week 1", color: "blue"   },
              { key: "w2", name: "Week 2", color: "green"  },
              { key: "w3", name: "Week 3", color: "purple" },
              { key: "w4", name: "Week 4", color: "grey"   },
            ]}
            height={220}
          />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Segment table */}
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Member segments" />
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gc-grey)]" />
              <Input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                aria-label="Search segments"
                placeholder="Search segments…"
                className="h-8 w-48 pl-8"
              />
            </div>
            <Select value={region} onValueChange={(v) => { setRegion(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-[130px]" aria-label="Filter by region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["All", "AMER", "EMEA", "APAC"].map((r) => (
                  <SelectItem key={r} value={r}>{r === "All" ? "All regions" : r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead>Region</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-[13px] text-[var(--gc-grey)]">
                    No segments match your search.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell style={{ fontWeight: 500 }}>{s.name}</TableCell>
                    <TableCell className="text-[var(--gc-grey)]">{s.region}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.members.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center justify-end gap-1.5 tabular-nums">
                        {s.engagement}%
                        <TrendArrow trend={s.trend as any} value="" />
                      </span>
                    </TableCell>
                    <TableCell><StatusPill status={s.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-[13px] text-[var(--gc-grey)]">
            <span>{filtered.length} segments</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" className="h-7 w-7 p-0" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page">
                <ChevronLeft size={15} />
              </Button>
              <span className="px-1 tabular-nums">{current + 1} / {pages}</span>
              <Button variant="outline" className="h-7 w-7 p-0" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} aria-label="Next page">
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <StatefulCard />
          <InsightCard
            tone="warning"
            title="Inactive members creeping up"
            summary="Inactive count rose to 160 this month."
            explanation="Most inactivity is concentrated in members who joined 8+ weeks ago and never posted. A welcome-back prompt in week 3 historically recovers ~18%."
          />
        </div>
      </div>
    </div>
  );
}
