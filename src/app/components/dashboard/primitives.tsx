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
  TrendingUp,
  TrendingDown,
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

/* ── Trend arrow ── */
export function TrendArrow({ trend, value }: { trend: "up" | "down" | "flat"; value?: string }) {
  const map = {
    up:   { Icon: ArrowUpRight,   color: "text-[var(--gc-green)]",  label: "Up"   },
    down: { Icon: ArrowDownRight, color: "text-[var(--gc-red)]",    label: "Down" },
    flat: { Icon: Minus,          color: "text-[var(--gc-grey)]",   label: "Flat" },
  }[trend];
  const { Icon } = map;
  return (
    <span className={cn("inline-flex items-center gap-1", map.color)}>
      <Icon size={14} aria-hidden />
      <span className="tabular-nums text-[12px]">{value ?? map.label}</span>
      <span className="sr-only">{map.label} trend</span>
    </span>
  );
}

/* ── Status pill ── */
const statusStyles: Record<string, { bg: string; fg: string; Icon: typeof CheckCircle2 }> = {
  Thriving:    { bg: "bg-[var(--gc-green-soft)]",    fg: "text-[var(--gc-green)]",    Icon: CheckCircle2  },
  Healthy:     { bg: "bg-[var(--gc-green-soft)]",    fg: "text-[var(--gc-green)]",    Icon: CheckCircle2  },
  Steady:      { bg: "bg-[var(--gc-ibm-blue-soft)]", fg: "text-[var(--gc-ibm-blue)]", Icon: Circle        },
  Monitor:     { bg: "bg-[var(--gc-ibm-blue-soft)]", fg: "text-[var(--gc-ibm-blue)]", Icon: Circle        },
  "At risk":   { bg: "bg-red-50",                    fg: "text-[var(--gc-red)]",      Icon: AlertTriangle },
  "Needs work":{ bg: "bg-red-50",                    fg: "text-[var(--gc-red)]",      Icon: AlertTriangle },
};

export function StatusPill({ status }: { status: string }) {
  const s = statusStyles[status] ?? statusStyles.Steady;
  const { Icon } = s;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]", s.bg, s.fg)}>
      <Icon size={12} aria-hidden />
      {status}
    </span>
  );
}

/* ── Section heading ── */
export function SectionHeading({ title, description, action }: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[15px] text-[var(--gc-graphite)]" style={{ fontWeight: 650, letterSpacing: "-.2px" }}>
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-[12px] text-[var(--gc-grey)]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ── KPI card ── */
const accentConfig = {
  blue:   { bar: "bg-[var(--gc-ibm-blue)]",  badge: "bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]",  Icon: TrendingUp   },
  green:  { bar: "bg-[var(--gc-green)]",      badge: "bg-[var(--gc-green-soft)] text-[var(--gc-green)]",         Icon: TrendingUp   },
  purple: { bar: "bg-[var(--gc-purple)]",     badge: "bg-[var(--gc-purple-soft)] text-[var(--gc-purple)]",       Icon: TrendingUp   },
  grey:   { bar: "bg-[var(--gc-grey)]",       badge: "bg-[var(--gc-offwhite)] text-[var(--gc-grey)]",            Icon: TrendingDown },
};

export function KpiCard({
  label, value, trend, delta, accent = "blue", onDrill, compact = false, definition,
}: {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  delta?: string;
  accent?: "blue" | "green" | "purple" | "grey";
  onDrill?: () => void;
  compact?: boolean;
  definition?: string;
}) {
  const cfg = accentConfig[accent];

  return (
    <div
      tabIndex={onDrill ? 0 : undefined}
      role={onDrill ? "button" : undefined}
      onClick={onDrill}
      onKeyDown={(e) => { if (onDrill && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onDrill(); }}}
      className={cn(
        "group relative rounded-xl border border-[var(--border)] bg-white overflow-hidden transition-all",
        compact ? "p-4" : "p-5",
        onDrill
          ? "cursor-pointer hover:border-[var(--gc-ibm-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1"
          : "",
      )}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {/* Top accent bar */}
      <span className={cn("absolute left-0 top-0 h-[3px] w-full", cfg.bar)} aria-hidden />

      <div className="flex items-start justify-between gap-2 mt-1">
        <p className="text-[12px] font-medium text-[var(--gc-grey)] leading-tight">{label}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {definition && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-[var(--gc-grey)] opacity-40 hover:opacity-80 focus-visible:outline-none"
                    aria-label={`Definition: ${label}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Info size={12} />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[260px] text-[12px] leading-relaxed">
                  {definition}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <p
        className={cn("mt-2 tabular-nums text-[var(--gc-graphite)] leading-none", compact ? "text-[22px]" : "text-[28px]")}
        style={{ fontWeight: 700, letterSpacing: "-1px" }}
      >
        {value}
      </p>

      {trend && delta && (
        <div className="mt-2">
          <TrendArrow trend={trend} value={delta} />
        </div>
      )}

      {onDrill && (
        <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-[var(--gc-ibm-blue)] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          View details <ArrowUpRight size={12} />
        </span>
      )}
    </div>
  );
}

/* ── Insight card ── */
export function InsightCard({ title, summary, explanation, tone = "info" }: {
  title: string;
  summary: string;
  explanation: string;
  tone?: "info" | "positive" | "warning";
}) {
  const [open, setOpen] = useState(false);
  const styles = {
    info:     { dot: "bg-[var(--gc-ibm-blue)]", bg: "bg-[var(--gc-ibm-blue-soft)]/40",  border: "border-[var(--gc-ibm-blue-soft)]" },
    positive: { dot: "bg-[var(--gc-green)]",    bg: "bg-[var(--gc-green-soft)]/50",       border: "border-[var(--gc-green-soft)]"    },
    warning:  { dot: "bg-[var(--gc-amber)]",    bg: "bg-[var(--gc-amber-soft)]/50",       border: "border-[var(--gc-amber-soft)]"    },
  }[tone];

  return (
    <div
      className={cn("rounded-xl border p-4 transition-colors", styles.bg, styles.border)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-start gap-3">
        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", styles.dot)} aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-[var(--gc-graphite)] leading-snug" style={{ fontWeight: 600 }}>
            {title}
          </p>
          <p className="mt-1 text-[12px] text-[var(--gc-grey)]">{summary}</p>
          {open && (
            <p className="mt-2.5 rounded-lg bg-white/70 px-3 py-2.5 text-[12px] text-[var(--gc-graphite-soft)] leading-relaxed">
              {explanation}
            </p>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 rounded text-[11px] font-medium text-[var(--gc-ibm-blue)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <Info size={12} />
            {open ? "Hide" : "Explain this insight"}
            <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Hint tooltip ── */
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
