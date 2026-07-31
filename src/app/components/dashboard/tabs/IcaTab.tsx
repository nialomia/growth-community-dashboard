import { MessageCircleQuestion, Bot, CheckCircle2, ArrowRight, Lightbulb } from "lucide-react";
import { Card } from "../../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { KpiCard, SectionHeading, StatusPill, TrendArrow, InsightCard } from "../primitives";
import { TrendLineChart } from "../charts";
import { useDashboard } from "../../../dashboard-context";

const journey = [
  { icon: MessageCircleQuestion, label: "Question asked",   detail: '"How do I join the Data guild?"', accent: "blue"   },
  { icon: Bot,                   label: "Agent response",   detail: "Shares join link + guidelines",     accent: "purple" },
  { icon: CheckCircle2,          label: "Action completed", detail: "Member joins channel",              accent: "green"  },
];

const opportunities = [
  { title: "Content gap",         detail: "Billing questions lack a dedicated help article."      },
  { title: "Unclear prompts",     detail: '"reset access" matches 3 different intents.'           },
  { title: "Repeated questions",  detail: "Event registration asked 1,320× — add a quick reply." },
  { title: "Low-confidence answers", detail: "SharePoint navigation confidence sits at 74%."      },
];

export function IcaTab() {
  const { analytics } = useDashboard();
  const kpi = analytics.kpis.ica;
  const { icaUsage, icaTopics } = analytics;

  return (
    <div className="space-y-5">
      <SectionHeading title="ICA agent analytics" description="Adoption, resolution quality and improvement opportunities." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Agent usage"   {...kpi.agentUsage}   accent="purple" definition="Total number of user interactions with the ICA (Intelligent Community Assistant) agent in the period." />
        <KpiCard label="Queries"       {...kpi.queries}      accent="blue"   definition="Count of distinct queries submitted to the ICA agent. One conversation may contain multiple queries." />
        <KpiCard label="Success rate"  {...kpi.successRate}  accent="green"  definition="Percentage of queries resolved without the user escalating or giving negative feedback. Calculated as successful queries ÷ total queries." />
        <KpiCard label="Fallback rate" {...kpi.fallbackRate} accent="grey"   definition="Percentage of queries the agent could not answer and fell back to a default or escalation response. Equals 100% minus success rate." />
        <KpiCard label="Repeat usage"  {...kpi.repeatUsage}  accent="blue"   definition="Percentage of users who returned to use the ICA agent more than once in the period, indicating ongoing utility." />
        <KpiCard label="Common topics" {...kpi.commonTopics} accent="purple" definition="Number of distinct intent/topic categories active in the period, derived from the ICA agent's intent classification logs." />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Queries vs. successful resolutions" description="Last 6 months" />
          <TrendLineChart
            data={icaUsage}
            series={[
              { key: "queries", name: "Queries",  color: "purple" },
              { key: "success", name: "Resolved", color: "green"  },
            ]}
            yFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
        </Card>

        {/* User journey */}
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <SectionHeading title="Typical journey" />
          <div className="space-y-2">
            {journey.map((step, i) => {
              const Icon = step.icon;
              const c = { blue: "var(--gc-ibm-blue)", purple: "var(--gc-purple)", green: "var(--gc-green)" }[step.accent]!;
              return (
                <div key={step.label}>
                  <div className="flex items-center gap-3 rounded-md border border-[var(--border)] p-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ background: `${c}1a`, color: c }}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>{step.label}</p>
                      <p className="text-[12px] text-[var(--gc-grey)]">{step.detail}</p>
                    </div>
                  </div>
                  {i < journey.length - 1 && (
                    <div className="flex justify-center py-0.5 text-[var(--gc-grey)]" aria-hidden>
                      <ArrowRight size={14} className="rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none lg:col-span-2">
          <SectionHeading title="Top intents & topics" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topic</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Success</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {icaTopics.map((t) => (
                <TableRow key={t.id}>
                  <TableCell style={{ fontWeight: 500 }}>{t.topic}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.queries.toLocaleString()}</TableCell>
                  <TableCell className="text-right tabular-nums">{t.success}%</TableCell>
                  <TableCell><TrendArrow trend={t.trend as any} /></TableCell>
                  <TableCell><StatusPill status={t.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Improvement opportunities */}
        <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-[var(--gc-amber)]" />
            <h3 className="text-[var(--gc-graphite)]">Improvement opportunities</h3>
          </div>
          <div className="space-y-2">
            {opportunities.map((o) => (
              <div key={o.title} className="rounded-md bg-[var(--gc-offwhite)] p-2.5">
                <p className="text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>{o.title}</p>
                <p className="text-[12px] text-[var(--gc-grey)]">{o.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <InsightCard
        tone="warning"
        title="Billing intent drags success rate"
        summary="Billing & invoices resolves at just 61%."
        explanation="This intent has the highest fallback rate. Publishing a concise billing FAQ and mapping common phrasings should lift resolution above 80% within a month."
      />
    </div>
  );
}
