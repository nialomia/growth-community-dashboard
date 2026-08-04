import { Download, Leaf, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { useDashboard } from "../../dashboard-context";
import { Hint } from "./primitives";

/** Build a CSV from whatever real analytics data we have and trigger a download. */
function exportCsv(analytics: ReturnType<typeof useDashboard>["analytics"]) {
  const rows: string[] = [];

  // ── Slack member snapshots ─────────────────────────────────────
  rows.push("# Slack member growth snapshots");
  rows.push("Date,Total members");
  const snapshots = analytics.growthTrend;
  snapshots.forEach((s) => rows.push(`"${s.month}",${s.members}`));
  rows.push("");

  // ── SharePoint KPIs ────────────────────────────────────────────
  rows.push("# SharePoint KPIs");
  rows.push("Metric,Value");
  const sp = analytics.kpis.sharepoint;
  Object.entries(sp).forEach(([k, v]) => rows.push(`"${k}","${v.value}"`));
  rows.push("");

  // ── GCC call overview ──────────────────────────────────────────
  const gcc = analytics.gccCallOverview;
  if (gcc) {
    rows.push("# GCC call overview — July 2026");
    rows.push("Call date,Attendees,Duration,Avg attendance time");
    gcc.calls.forEach((c) => rows.push(`"${c.fullDate}",${c.attendees},"${c.duration}","${c.avgAttendanceTime}"`));
    rows.push("");
    rows.push("# GCC cross-call breakdown");
    rows.push("Category,Count");
    gcc.crossCallBreakdown.forEach((r) => rows.push(`"${r.label}",${r.count}`));
    rows.push("");
  }

  // ── New member attendance (Jul 10–Aug 4) ──────────────────────
  const ma = analytics.meetingAttendance;
  if (ma) {
    rows.push("# New member GCC attendance — Jul 10–Aug 4");
    rows.push("Name,Email,Joined Slack,Attended any call");
    ma.newMembers.forEach((m) =>
      rows.push(`"${m.name}","${m.email}","${m.joinedSlack}",${m.attended ? "Yes" : "No"}`)
    );
    rows.push("");
  }

  // ── Member personas ────────────────────────────────────────────
  const personas = analytics.memberPersonas;
  if (personas) {
    rows.push("# Member personas (Aug 4, 2026)");
    rows.push("Persona,Count,Pct");
    personas.forEach((p) => rows.push(`"${p.persona}",${p.count},${p.pct}%`));
    rows.push("");
  }

  const csv = rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "growth-community-analytics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function Header() {
  const { lowData, setLowData, analyticsStatus, lastUpdated, analytics } = useDashboard();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 md:px-6">
        {/* Identity mark */}
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--gc-ibm-blue)] text-white"
            aria-hidden
          >
            <span style={{ fontWeight: 600 }}>G</span>
          </div>
          <div className="leading-tight">
            <p className="text-[var(--gc-graphite)]" style={{ fontWeight: 600 }}>
              Growth Community Analytics
            </p>
            <p className="hidden text-[12px] text-[var(--gc-grey)] sm:block">
              Internal community intelligence
            </p>
          </div>
        </div>

        {/* Data freshness badge */}
        {analyticsStatus === "loading" && (
          <span className="ml-1 hidden items-center gap-1.5 rounded-full border border-[var(--gc-grey-light)] bg-[var(--gc-offwhite)] px-2.5 py-1 text-[12px] text-[var(--gc-grey)] lg:inline-flex">
            <RefreshCw size={12} className="animate-spin" aria-hidden />
            Loading data…
          </span>
        )}
        {analyticsStatus === "ready" && (
          <Hint text="Charts, media and payload are optimised to reduce energy use.">
            <span className="ml-1 hidden items-center gap-1.5 rounded-full border border-[var(--gc-green-soft)] bg-[var(--gc-green-soft)] px-2.5 py-1 text-[12px] text-[var(--gc-green)] lg:inline-flex">
              <Leaf size={13} aria-hidden />
              {lowData ? "Low-data mode active" : `Data as of ${lastUpdated}`}
            </span>
          </Hint>
        )}
        {analyticsStatus === "error" && (
          <Hint text="Could not load analytics.json — showing last known data.">
            <span className="ml-1 hidden items-center gap-1.5 rounded-full border border-[#ffecd2] bg-[#ffecd2] px-2.5 py-1 text-[12px] text-[var(--gc-amber)] lg:inline-flex">
              <AlertCircle size={13} aria-hidden />
              Data unavailable — using cached values
            </span>
          </Hint>
        )}

        <div className="flex-1" />

        {/* Export — downloads a real CSV of all available data */}
        <Button
          variant="outline"
          className="h-9"
          onClick={() => exportCsv(analytics)}
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>

        {/* Low-data toggle */}
        <div className="flex items-center gap-2 rounded-md border border-[var(--border)] px-2.5 py-1.5">
          <Switch id="low-data" checked={lowData} onCheckedChange={setLowData} aria-label="Toggle low-data mode" />
          <Label htmlFor="low-data" className="cursor-pointer text-[13px] text-[var(--gc-graphite)]">
            Low-data mode
          </Label>
        </div>

        {/* Avatar */}
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[var(--gc-purple-soft)] text-[var(--gc-purple)]" style={{ fontWeight: 600 }}>
            CM
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
