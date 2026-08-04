import { useState } from "react";
import { Users, UserCircle2 } from "lucide-react";
import { Card } from "../../ui/card";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { SimpleBarChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";
import { cn } from "../../ui/utils";

// ── Real snapshots from member download files ─────────────────────────────
// Jun 11 (697) · Jul 13 (778) · Jul 28 (801) · Aug 4 (805)
const SNAPSHOT = [
  { date: "Jun 11", total: 697 },
  { date: "Jul 13", total: 778 },
  { date: "Jul 28", total: 801 },
  { date: "Aug 4",  total: 805 },
];

const REGION_DATA = [
  { region: "AMER", members: 430, pct: 54 },
  { region: "APAC", members: 209, pct: 26 },
  { region: "EMEA", members: 160, pct: 20 },
];

const JUN11      = 697;
const AUG4       = 805;
const NET        = 108;   // 697 → 805
const NEW        = 116;   // gross adds Jun 11 → Aug 4
const REMOVED    = 8;     // 116 added - 108 net = 8 removed
const GROWTH_PCT = "15.5"; // (805-697)/697

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
      <SectionHeading
        title="Slack member growth"
        description="Member download snapshots: Jun 11 (697) · Jul 13 (778) · Jul 28 (801) · Aug 4 (805)"
      />

      {/* KPIs — only what the data supports */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total members (Aug 4)"
          value={AUG4.toLocaleString()}
          trend="up"
          delta={`+${GROWTH_PCT}%`}
          accent="blue"
          definition="Current headcount of the Growth Community Slack workspace as of Aug 4, 2026. Source: 8.04 Member Download (805).xlsx."
        />
        <KpiCard
          label="Net growth (54 days)"
          value={`+${NET}`}
          trend="up"
          delta="Jun 11 → Aug 4"
          accent="green"
          definition="Net new members Jun 11–Aug 4: 697 → 805 = +108 net. Source: diff of member download files."
        />
        <KpiCard
          label="New members added"
          value={NEW.toLocaleString()}
          trend="up"
          delta="since Jun 11"
          accent="purple"
          definition="Gross new members Jun 11–Aug 4: ~116 added, ~8 removed/deactivated = +108 net. Source: member download snapshots."
        />
        <KpiCard
          label="Members removed"
          value={REMOVED.toLocaleString()}
          trend="down"
          delta="list cleanup"
          accent="grey"
          definition="Estimated members who left or were deactivated Jun 11–Aug 4. Gross adds minus net growth."
        />
      </div>

      {/* Snapshot bar chart */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="Member count snapshots"
          description="Jun 11 · Jul 13 · Jul 28 · Aug 4"
        />
        <SimpleBarChart
          data={SNAPSHOT}
          series={[{ key: "total", name: "Total members", color: "blue" }]}
          height={220}
        />
      </Card>

      {/* Persona breakdown */}
      {personas.length > 0 && (
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <div className="flex items-center gap-2 mb-1">
            <UserCircle2 size={16} className="text-[var(--gc-ibm-blue)]" />
            <div>
              <h2 className="text-[var(--gc-graphite)]">Member personas</h2>
              <p className="text-[13px] text-[var(--gc-grey)]">805 members · source: 8.04 Member Download (805).xlsx</p>
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
            All 805 members matched. Source: IBM W3 BluePages via 8.04 Member Download (805).xlsx.
          </p>
        </Card>
      )}

      {/* Region breakdown */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-[var(--gc-ibm-blue)]" />
          <h3 className="text-[var(--gc-graphite)]">Region breakdown</h3>
        </div>
          <p className="text-[12px] text-[var(--gc-grey)]">Verified via W3 BluePages · Jul 28 · 801 members</p>
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
              { flag: "🇺🇸", country: "United States", n: 222 },
              { flag: "🇮🇳", country: "India",          n: 169 },
              { flag: "🇮🇪", country: "Ireland",        n: 47  },
              { flag: "🇨🇦", country: "Canada",         n: 27  },
              { flag: "🇬🇧", country: "UK",             n: 8   },
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
        <InsightCard
            tone="positive"
            title="805 members as of Aug 4 — 15.5% growth since Jun 11"
            summary={`+${NET} net members over 54 days: Jun 11 (697) → Aug 4 (805).`}
            explanation={`Growth across 3 periods: Jun 11→Jul 13 (+81), Jul 13→Jul 28 (+23), Jul 28→Aug 4 (+4). The fastest growth was in the Jul 13 window. At the current pace the community is on track to reach ~850 by end of August.`}
          />
        <InsightCard
          tone="info"
          title="Global but AMER-led community"
          summary="AMER 54% · APAC 26% · EMEA 20% — verified via W3 BluePages for all 801 members."
          explanation="Top countries: United States (222), India (169), Ireland (47), Canada (27), UK (8), Germany (7), Romania (7). APAC is stronger than the email domain alone suggested — India accounts for most of that. EMEA is well represented with Ireland as the #3 country overall."
        />
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
