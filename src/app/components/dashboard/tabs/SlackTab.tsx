import { useState } from "react";
import { Users, UserCircle2 } from "lucide-react";
import { Card } from "../../ui/card";
import { KpiCard, SectionHeading, InsightCard } from "../primitives";
import { SimpleBarChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";
import { cn } from "../../ui/utils";

// ── Real data from list 1.xlsx (Jul 10, 702), list 2.xlsx (Jul 28, 801), new members CSV (Aug 4, 804) ──
const SNAPSHOT = [
  { date: "Jul 10", total: 702 },
  { date: "Jul 28", total: 801 },
  { date: "Aug 4",  total: 804 },
];

const REGION_DATA = [
  { region: "AMER", members: 430, pct: 54 },
  { region: "APAC", members: 209, pct: 26 },
  { region: "EMEA", members: 160, pct: 20 },
];

const JUL10      = 702;
const JUL28      = 801;
const AUG4       = 804;
const NET        = 102;   // 702 → 804
const NEW        = 111;   // 108 Jul + 3 post-Jul28
const REMOVED    = 9;
const GROWTH_PCT = "14.5";

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
        description="Member list snapshots: Jul 10 (702) · Jul 28 (801) · Aug 4 (804)"
      />

      {/* KPIs — only what the data supports */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard
          label="Total members (Aug 4)"
          value={AUG4.toLocaleString()}
          trend="up"
          delta={`+${GROWTH_PCT}%`}
          accent="blue"
          definition="Current headcount of the Growth Community Slack workspace as of Aug 4, 2026. Source: Growth_Community_New_Members CSV + Jul 28 Slack export."
        />
        <KpiCard
          label="Net growth (25 days)"
          value={`+${NET}`}
          trend="up"
          delta="Jul 10 → Aug 4"
          accent="green"
          definition="Net new members added Jul 10–Aug 4: 111 gross adds minus 9 removed/deactivated = +102. Source: diff of Slack exports + new members CSV."
        />
        <KpiCard
          label="New members added"
          value={NEW.toLocaleString()}
          trend="up"
          delta="since Jul 10"
          accent="purple"
          definition="Gross new members Jul 10–Aug 4: 108 joined by Jul 28 + 3 post-Jul 28 (Jaideep Advani Jul 30, Yurii Plakhtii Aug 3, Mariana Chiabotto Aug 3)."
        />
        <KpiCard
          label="Members removed"
          value={REMOVED.toLocaleString()}
          trend="down"
          delta="list cleanup"
          accent="grey"
          definition="Members who left or were deactivated between Jul 10 and Jul 28. Net growth = new added minus removed."
        />
      </div>

      {/* Snapshot bar chart */}
      <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
        <SectionHeading
          title="Member count snapshots"
          description="Jul 10 · Jul 28 · Aug 4"
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
              <p className="text-[13px] text-[var(--gc-grey)]">805 members · source: 7.23 Member Download + new members list</p>
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
            Personas sourced from IBM W3 BluePages via member download export.
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
          title="804 members as of Aug 4 — 14.5% growth since Jul 10"
          summary={`+${NET} net members over 25 days: 111 added, 9 removed.`}
          explanation={`108 members joined by Jul 28, plus 3 more since: Jaideep Advani (Jul 30), Yurii Plakhtii (Aug 3), and Mariana Chiabotto (Aug 3). At ~4 new members/day the community is on track to reach ~850 by end of August.`}
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
