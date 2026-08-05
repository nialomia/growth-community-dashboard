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
  rows.push("# Slack member growth snapshots");
  rows.push("Date,Total members");
  analytics.growthTrend.forEach((s) => rows.push(`"${s.month}",${s.members}`));
  rows.push("");
  rows.push("# SharePoint KPIs");
  rows.push("Metric,Value");
  Object.entries(analytics.kpis.sharepoint).forEach(([k, v]) => rows.push(`"${k}","${v.value}"`));
  rows.push("");
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
  const ma = analytics.meetingAttendance;
  if (ma) {
    rows.push("# New member GCC attendance — Jul 10–Aug 4");
    rows.push("Name,Email,Joined Slack,Attended any call");
    ma.newMembers.forEach((m) =>
      rows.push(`"${m.name}","${m.email}","${m.joinedSlack}",${m.attended ? "Yes" : "No"}`)
    );
    rows.push("");
  }
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
    <header
      className="sticky top-0 z-30 border-b border-[var(--border)] bg-white px-5 py-0 md:px-7"
      style={{ boxShadow: "var(--shadow-header)" }}
    >
      <div className="flex h-14 items-center gap-4">

        {/* Logo mark + name */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gc-ibm-blue)] text-white text-[13px]"
            style={{ fontWeight: 700, letterSpacing: "-.5px" }}
            aria-hidden
          >
            GC
          </div>
          <div className="leading-tight hidden sm:block">
            <p className="text-[14px] text-[var(--gc-graphite)]" style={{ fontWeight: 650 }}>
              Growth Community
            </p>
            <p className="text-[11px] text-[var(--gc-grey)]">Analytics</p>
          </div>
        </div>

        {/* Data freshness badge */}
        <div className="hidden lg:flex items-center">
          {analyticsStatus === "loading" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--gc-grey-light)] bg-[var(--gc-offwhite)] px-3 py-1 text-[11px] text-[var(--gc-grey)]">
              <RefreshCw size={11} className="animate-spin" aria-hidden />
              Loading data…
            </span>
          )}
          {analyticsStatus === "ready" && (
            <Hint text="Charts and payload are optimised to reduce energy use.">
              <span className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[var(--gc-green-soft)] bg-[var(--gc-green-soft)] px-3 py-1 text-[11px] text-[var(--gc-green)]">
                <Leaf size={11} aria-hidden />
                {lowData ? "Low-data mode" : `Updated ${lastUpdated}`}
              </span>
            </Hint>
          )}
          {analyticsStatus === "error" && (
            <Hint text="Could not load analytics.json — showing last known data.">
              <span className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-[var(--gc-amber-soft)] bg-[var(--gc-amber-soft)] px-3 py-1 text-[11px] text-[var(--gc-amber)]">
                <AlertCircle size={11} aria-hidden />
                Cached data
              </span>
            </Hint>
          )}
        </div>

        <div className="flex-1" />

        {/* Export */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg border-[var(--border)] text-[12px] text-[var(--gc-graphite-soft)] hover:bg-[var(--gc-offwhite)] hover:text-[var(--gc-graphite)]"
          onClick={() => exportCsv(analytics)}
        >
          <Download size={13} />
          <span className="hidden sm:inline">Export CSV</span>
        </Button>

        {/* Low-data toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--gc-offwhite)] px-3 py-1.5">
          <Switch id="low-data" checked={lowData} onCheckedChange={setLowData} aria-label="Toggle low-data mode" />
          <Label htmlFor="low-data" className="cursor-pointer text-[12px] text-[var(--gc-graphite-soft)] hidden sm:block">
            Low-data
          </Label>
        </div>

        {/* Avatar */}
        <Avatar className="h-8 w-8 ring-2 ring-[var(--gc-ibm-blue-soft)]">
          <AvatarFallback
            className="bg-[var(--gc-ibm-blue)] text-white text-[12px]"
            style={{ fontWeight: 650 }}
          >
            NL
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
