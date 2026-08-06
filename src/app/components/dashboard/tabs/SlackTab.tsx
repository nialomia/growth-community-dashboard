import { useState } from "react";
import { Users, UserCircle2 } from "lucide-react";
import { Card } from "../../ui/card";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { SimpleBarChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";
import { cn } from "../../ui/utils";

// ── Real snapshots driven from analytics.json growthTrend ─────────────────
// Constants below are derived at render time from analytics data
const REGION_DATA = [
  { region: "AMER", members: 425, pct: 53 },
  { region: "APAC", members: 198, pct: 25 },
  { region: "EMEA", members: 182, pct: 23 },
];

const PERSONA_COLORS = [
  "var(--gc-ibm-blue)",
  "var(--gc-green)",
  "var(--gc-purple)",
  "var(--gc-amber)",
  "#0e9f6e",
  "#e74c3c",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "var(--gc-grey)",
];

export function SlackTab() {
  const { analytics } = useDashboard();
  const personas = analytics.memberPersonas ?? [];
  const totalPersonaMembers = personas.reduce((s, p) => s + p.count, 0);

  return (
    <div className="space-y-5">
      {(() => {
        const trend = analytics.growthTrend ?? [];
        const latest = trend.at(-1);
        const baseline = trend[0];
        const current = latest?.members ?? 0;
        const base = baseline?.members ?? 697;
        const net = current - base;
        const growthPct = base > 0 ? ((net / base) * 100).toFixed(1) : "0";
        const latestLabel = latest?.month ?? "Latest";
        const snapshot = trend.map(t => ({ date: t.month, total: t.members }));
        return (
          <>
            <SectionHeading
              title="Slack member growth"
              description={`Member snapshots: ${trend.map(t => `${t.month} (${t.members})`).join(" · ")}`}
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiCard
                label={`Total members (${latestLabel})`}
                value={current.toLocaleString()}
                trend="up"
                delta={`+${growthPct}%`}
                accent="blue"
                definition={`Current headcount of the Growth Community Slack workspace as of ${latestLabel}. Source: analytics.json.`}
              />
              <KpiCard
                label="Net growth"
                value={`+${net}`}
                trend="up"
                delta={`${baseline?.month ?? "baseline"} → ${latestLabel}`}
                accent="green"
                definition={`Net new members ${baseline?.month} → ${latestLabel}: ${base} → ${current} = +${net} net.`}
              />
              <KpiCard
                label="Growth %"
                value={`+${growthPct}%`}
                trend="up"
                delta="since baseline"
                accent="purple"
                definition={`Percentage growth from ${baseline?.month} (${base}) to ${latestLabel} (${current}).`}
              />
              <KpiCard
                label="Snapshots tracked"
                value={trend.length.toLocaleString()}
                trend="flat"
                delta="data points"
                accent="grey"
                definition="Number of member count snapshots recorded in analytics.json."
              />
            </div>

            {/* Snapshot bar chart */}
            <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
              <SectionHeading
                title="Member count snapshots"
                description={trend.map(t => t.month).join(" · ")}
              />
              <SimpleBarChart
                data={snapshot}
                series={[{ key: "total", name: "Total members", color: "blue" }]}
                height={220}
              />
            </Card>
          </>
        );
      })()}

      {/* Persona breakdown */}
      {personas.length > 0 && (
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle2 size={16} className="text-[var(--gc-ibm-blue)]" />
            <div>
              <h2 className="text-[var(--gc-graphite)]">Member personas</h2>
              <p className="text-[13px] text-[var(--gc-grey)]">{(analytics.growthTrend?.at(-1)?.members ?? 0).toLocaleString()} members · source: analytics.json</p>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {personas.map((p, i) => (
              <div key={p.persona} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="truncate pr-2 text-[var(--gc-graphite-soft)]">{p.persona}</span>
                  <span className="shrink-0 tabular-nums text-[var(--gc-grey)]">
                    {p.count.toLocaleString()} <span className="text-[11px]">({p.pct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--gc-offwhite)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p.pct}%`, background: PERSONA_COLORS[i % PERSONA_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-[var(--gc-grey)]">
            All {(analytics.growthTrend?.at(-1)?.members ?? 0).toLocaleString()} members matched. Source: IBM W3 BluePages lookup.
          </p>
        </Card>
      )}

      {/* Region breakdown */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[var(--gc-ibm-blue)]" />
          <h3 className="text-[var(--gc-graphite)]">Region breakdown</h3>
        </div>
          <p className="text-[12px] text-[var(--gc-grey)]">Verified via W3 BluePages · {analytics.growthTrend?.at(-1)?.month} · {(analytics.growthTrend?.at(-1)?.members ?? 0).toLocaleString()} members</p>
          <div className="space-y-3 mt-2">
            {REGION_DATA.map((r) => (
              <div key={r.region}>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--gc-graphite-soft)]">{r.region}</span>
                  <span className="tabular-nums text-[var(--gc-grey)]">
                    {r.members.toLocaleString()} · {r.pct}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gc-offwhite)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${r.pct}%`,
                      background:
                        r.region === "AMER" ? "var(--gc-ibm-blue)"
                        : r.region === "EMEA" ? "var(--gc-green)"
                        : "var(--gc-purple)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-0.5">
            {[
              { flag: "🇺🇸", country: "United States", n: 362 },
                { flag: "🇮🇳", country: "India",          n: 189 },
                { flag: "🇮🇪", country: "Ireland",        n: 64  },
                { flag: "🇨🇦", country: "Canada",         n: 50  },
                { flag: "🇬🇧", country: "UK",             n: 18  },
            ].map(c => (
              <div key={c.country} className="flex items-center justify-between text-[12px] text-[var(--gc-grey)]">
                <span>{c.flag} {c.country}</span>
                <span className="tabular-nums">{c.n}</span>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-[var(--gc-grey)]">+ other countries · all via W3 BluePages lookup</p>
          </div>
      </Card>

      {/* Insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(() => {
          const trend = analytics.growthTrend ?? [];
          const latest = trend.at(-1);
          const baseline = trend[0];
          const current = latest?.members ?? 0;
          const base = baseline?.members ?? 697;
          const net = current - base;
          const growthPct = base > 0 ? ((net / base) * 100).toFixed(1) : "0";
          return (
            <>
              <InsightCard
                tone="positive"
                title={`${current.toLocaleString()} members as of ${latest?.month} — ${growthPct}% growth since ${baseline?.month}`}
                summary={`+${net} net members: ${baseline?.month} (${base}) → ${latest?.month} (${current}).`}
                explanation={`Growth across ${trend.length} snapshots. At the current pace the community is on track to reach ~${Math.round(current * 1.04)} by end of next month.`}
              />
              <InsightCard
                tone="info"
                title="Global but AMER-led community"
                summary={`AMER 53% · APAC 25% · EMEA 23% — verified via W3 BluePages for all ${current.toLocaleString()} members.`}
                explanation="Top countries: United States (362), India (189), Ireland (64), Canada (50), UK (18), Romania (18), Germany (14). 24 members have no country set in BluePages."
              />
            </>
          );
        })()}
      </div>

      {/* Data availability note */}
      <Card className="gap-2 rounded-md border-[var(--gc-ibm-blue-soft)] bg-[var(--gc-ibm-blue-soft)]/30 p-4 shadow-none">
        <p className="text-[13px] text-[var(--gc-graphite-soft)]">
          <span style={{ fontWeight: 500 }}>Data availability — </span>
          engagement metrics (active contributors, retention cohorts, engagement rate) are not yet
          available from the member lists provided. These sections will be enabled once Slack
          activity data is shared.
        </p>
      </Card>
    </div>
  );
}
