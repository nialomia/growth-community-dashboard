import { Bot, Clock } from "lucide-react";
import { Card } from "../../ui/card";
import { SectionHeading } from "../primitives";

const PLANNED = [
  { label: "Total interactions", detail: "Count of user sessions with the ICA agent" },
  { label: "Query volume",        detail: "Number of distinct questions submitted" },
  { label: "Resolution rate",     detail: "% of queries answered without escalation" },
  { label: "Fallback rate",       detail: "% of queries that hit the default/unknown intent" },
  { label: "Repeat usage",        detail: "% of users who returned more than once" },
  { label: "Top intents",         detail: "Most common question categories" },
];

export function IcaTab() {
  return (
    <div className="space-y-5">
      <SectionHeading
        title="ICA agent analytics"
        description="Data collection not yet started — metrics will appear here once the ICA agent is live."
      />

      {/* Placeholder KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {PLANNED.map((m) => (
          <div
            key={m.label}
            className="flex flex-col gap-1.5 rounded-md border border-dashed border-[var(--border)] bg-white p-4"
          >
            <p className="text-[12px] text-[var(--gc-grey)]">{m.label}</p>
            <p className="text-[22px] font-semibold text-[var(--gc-grey-light)]">—</p>
            <p className="text-[11px] text-[var(--gc-grey)]">{m.detail}</p>
          </div>
        ))}
      </div>

      {/* Status card */}
      <Card className="flex items-start gap-4 rounded-md border-[var(--border)] p-5 shadow-none">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--gc-ibm-blue-soft)]">
          <Bot size={20} className="text-[var(--gc-ibm-blue)]" />
        </span>
        <div className="space-y-1">
          <p className="text-[14px] text-[var(--gc-graphite)]" style={{ fontWeight: 600 }}>
            ICA agent data — coming soon
          </p>
          <p className="text-[13px] text-[var(--gc-grey)]">
            Once the ICA (Intelligent Community Assistant) agent is instrumented, this tab will
            show query volume, resolution rates, top intents, and improvement opportunities.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--gc-grey)]">
            <Clock size={13} /> No data available yet
          </p>
        </div>
      </Card>
    </div>
  );
}
