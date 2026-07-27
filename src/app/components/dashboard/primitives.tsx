import { ReactNode, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Circle,
} from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../ui/utils";

/* ---------- Trend arrow (never colour alone: icon + text) ---------- */
export function TrendArrow({
  trend,
  value,
}: {
  trend: "up" | "down" | "flat";
  value?: string;
}) {
  const map = {
    up: { Icon: ArrowUpRight, color: "text-[var(--gc-green)]", label: "Up" },
    down: { Icon: ArrowDownRight, color: "text-[var(--gc-red)]", label: "Down" },
    flat: { Icon: Minus, color: "text-[var(--gc-grey)]", label: "Flat" },
  }[trend];
  const { Icon } = map;
  return (
    <span className={cn("inline-flex items-center gap-1", map.color)}>
      <Icon size={16} aria-hidden />
      <span className="tabular-nums">{value ?? map.label}</span>
      <span className="sr-only">{map.label} trend</span>
    </span>
  );
}

/* ---------- Status pill (icon + label + colour) ---------- */
const statusStyles: Record<
  string,
  { bg: string; fg: string; Icon: typeof CheckCircle2 }
> = {
  Thriving: { bg: "bg-[var(--gc-green-soft)]", fg: "text-[var(--gc-green)]", Icon: CheckCircle2 },
  Healthy: { bg: "bg-[var(--gc-green-soft)]", fg: "text-[var(--gc-green)]", Icon: CheckCircle2 },
  Steady: { bg: "bg-[var(--gc-ibm-blue-soft)]", fg: "text-[var(--gc-ibm-blue)]", Icon: Circle },
  Monitor: { bg: "bg-[var(--gc-ibm-blue-soft)]", fg: "text-[var(--gc-ibm-blue)]", Icon: Circle },
  "At risk": { bg: "bg-[#fff1f1]", fg: "text-[var(--gc-red)]", Icon: AlertTriangle },
  "Needs work": { bg: "bg-[#fff1f1]", fg: "text-[var(--gc-red)]", Icon: AlertTriangle },
};

export function StatusPill({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.Steady;
  const { Icon } = s;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        s.bg,
        s.fg,
      )}
    >
      <Icon size={13} aria-hidden />
      <span className="text-[13px]">{status}</span>
    </span>
  );
}

/* ---------- Section heading ---------- */
export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[var(--gc-graphite)]">{title}</h2>
        {description && (
          <p className="mt-0.5 text-[13px] text-[var(--gc-grey)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ---------- KPI card with hover + optional drill-down ---------- */
export function KpiCard({
  label,
  value,
  trend,
  delta,
  accent = "blue",
  onDrill,
  compact = false,
}: {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  delta?: string;
  accent?: "blue" | "green" | "purple" | "grey";
  onDrill?: () => void;
  compact?: boolean;
}) {
  const accentBar = {
    blue: "bg-[var(--gc-ibm-blue)]",
    green: "bg-[var(--gc-green)]",
    purple: "bg-[var(--gc-purple)]",
    grey: "bg-[var(--gc-grey)]",
  }[accent];

  return (
    <Card
      tabIndex={onDrill ? 0 : undefined}
      role={onDrill ? "button" : undefined}
      onClick={onDrill}
      onKeyDown={(e) => {
        if (onDrill && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onDrill();
        }
      }}
      className={cn(
        "group relative overflow-hidden gap-0 rounded-md border-[var(--border)] py-0 shadow-none transition-colors",
        onDrill &&
          "cursor-pointer hover:border-[var(--gc-ibm-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1",
        compact ? "p-3" : "p-4",
      )}
    >
      <span className={cn("absolute left-0 top-0 h-full w-[3px]", accentBar)} aria-hidden />
      <p className="text-[13px] text-[var(--gc-grey)]">{label}</p>
      <p
        className={cn(
          "mt-1 tabular-nums text-[var(--gc-graphite)]",
          compact ? "text-[20px]" : "text-[26px]",
        )}
        style={{ fontWeight: 600, lineHeight: 1.2 }}
      >
        {value}
      </p>
      {trend && delta && (
        <div className="mt-1 flex items-center gap-1 text-[13px]">
          <TrendArrow trend={trend} value={delta} />
          <span className="text-[var(--gc-grey)]">vs last period</span>
        </div>
      )}
      {onDrill && (
        <span className="mt-2 inline-flex items-center gap-1 text-[12px] text-[var(--gc-ibm-blue)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          View details <ArrowUpRight size={13} />
        </span>
      )}
    </Card>
  );
}

/* ---------- Insight card with expandable "Explain this insight" ---------- */
export function InsightCard({
  title,
  summary,
  explanation,
  tone = "info",
}: {
  title: string;
  summary: string;
  explanation: string;
  tone?: "info" | "positive" | "warning";
}) {
  const [open, setOpen] = useState(false);
  const dot = {
    info: "bg-[var(--gc-ibm-blue)]",
    positive: "bg-[var(--gc-green)]",
    warning: "bg-[var(--gc-amber)]",
  }[tone];
  return (
    <div className="rounded-md border border-[var(--border)] bg-white p-3">
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot)} aria-hidden />
        <div className="flex-1">
          <p className="text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>
            {title}
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--gc-grey)]">{summary}</p>
          {open && (
            <p className="mt-2 rounded bg-[var(--gc-offwhite)] p-2 text-[13px] text-[var(--gc-graphite-soft)]">
              {explanation}
            </p>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 rounded text-[12px] text-[var(--gc-ibm-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Info size={13} />
            {open ? "Hide explanation" : "Explain this insight"}
            <ChevronDown
              size={13}
              className={cn("transition-transform", open && "rotate-180")}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small labelled tooltip helper ---------- */
export function Hint({ text, children }: { text: string; children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { Card, Badge, Button };
