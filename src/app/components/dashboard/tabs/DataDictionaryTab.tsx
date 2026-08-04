import { useState } from "react";
import { Search, Database, Calculator, FileSpreadsheet, FileText, Users, Video, Bot, LayoutDashboard, BookOpen } from "lucide-react";
import { Card } from "../../ui/card";
import { Input } from "../../ui/input";
import { SectionHeading } from "../primitives";
import { cn } from "../../ui/utils";

type Section = "all" | "overview" | "slack" | "sharepoint" | "meeting" | "ica";

type Metric = {
  name: string;
  section: Exclude<Section, "all">;
  definition: string;
  calculation: string;
  source: string;
  files: string[];
  notes?: string;
};

const METRICS: Metric[] = [
  // ── Overview ──────────────────────────────────────────────────────────────
  {
    name: "Slack members",
    section: "overview",
    definition: "Total number of people currently in the Growth Community Slack workspace.",
    calculation: "Row count of the member download export, excluding deactivated/removed accounts. As of Aug 4, 2026: 805 members.",
    source: "IBM W3 BluePages member download export",
    files: ["8.04 - Member Download (805).xlsx", "analytics.json → kpis.overview.totalMembers"],
    notes: "Value is as of the export date. Updated manually each reporting period.",
  },
  {
    name: "New members (54 days)",
    section: "overview",
    definition: "Net new Slack members added between Jun 11 and Aug 4, 2026.",
    calculation: "Members as of Aug 4 (805) minus members as of Jun 11 (697) = +108 net. Snapshots: Jun 11 (697), Jul 13 (778), Aug 4 (805).",
    source: "IBM W3 BluePages member download exports — three snapshots compared",
    files: ["6.11 - Member Download (697).xlsx", "7.13 - Member Download (778).xlsx", "8.04 - Member Download (805).xlsx"],
  },
  {
    name: "GCC call attendance (Overview)",
    section: "overview",
    definition: "Percentage of new Slack members (Jul 10–Aug 4) who attended at least one July GCC call.",
    calculation: "New members who attended any call ÷ total new members = 16 ÷ 111 = 14%.",
    source: "All 3 Teams attendance reports cross-referenced with Slack member list",
    files: ["Growth Community Call (GCC) - Attendance report 7-14-26.xlsx", "Growth Community Call - Attendance report 7-21-26.xlsx", "Growth Community Call (GCC) - Attendance report 7-28-26.xlsx"],
  },
  {
    name: "SharePoint views (Overview)",
    section: "overview",
    definition: "Total all-time SharePoint page views for the Growth Community site.",
    calculation: "All-time site visits from the Overall Traffic sheet: 3,603 total as of Aug 4, 2026.",
    source: "SharePoint site analytics export",
    files: ["SiteAnalyticsData_4-Aug,2026.xlsx", "analytics.json → kpis.sharepoint.pageViews"],
  },
  {
    name: "Unique SP viewers",
    section: "overview",
    definition: "Number of distinct individuals who have visited the Growth Community SharePoint site, all time.",
    calculation: "All-time unique viewer count from SharePoint analytics export: 55 as of Aug 4, 2026.",
    source: "SharePoint site analytics export",
    files: ["SiteAnalyticsData_4-Aug,2026.xlsx", "analytics.json → kpis.sharepoint.uniqueViewers"],
  },
  {
    name: "GCC core members",
    section: "overview",
    definition: "Members who attended all 3 July GCC calls — the highest-engagement segment.",
    calculation: "Intersection of Jul 14 ∩ Jul 21 ∩ Jul 28 attendee sets = 13 members.",
    source: "All three Teams attendance reports",
    files: ["analytics.json → gccCallOverview.coreAttendees"],
  },

  // ── Slack ──────────────────────────────────────────────────────────────────
  {
    name: "Total Slack members",
    section: "slack",
    definition: "Current headcount of the Growth Community Slack workspace.",
    calculation: "Row count of the member download export, filtered to active members only. Aug 4, 2026: 805 members.",
    source: "IBM W3 BluePages member download export",
    files: ["8.04 - Member Download (805).xlsx"],
    notes: "Export is requested manually from Slack Workspace Admin → Member management → Export.",
  },
  {
    name: "New members added",
    section: "slack",
    definition: "Members who joined the workspace within the reporting window (Jun 11–Aug 4).",
    calculation: "Members present in the Aug 4 export but absent from the Jun 11 export. Gross adds ~116; net +108 after ~8 removed.",
    source: "Diff of member download exports",
    files: ["6.11 - Member Download (697).xlsx", "8.04 - Member Download (805).xlsx"],
  },
  {
    name: "Members removed",
    section: "slack",
    definition: "Members who left or were deactivated within the reporting window.",
    calculation: "Gross adds minus net growth: ~116 added - 108 net = ~8 removed/deactivated Jun 11–Aug 4.",
    source: "Diff of member download exports",
    files: ["6.11 - Member Download (697).xlsx", "8.04 - Member Download (805).xlsx"],
  },
  {
    name: "Join date",
    section: "slack",
    definition: "The date a member first joined the Growth Community Slack workspace.",
    calculation: "Taken from the 'New Member Date' column in the Growth Community new members tracking CSV.",
    source: "Growth_Community_New_Members CSV / Slack member export",
    files: ["Growth_Community_New_Members (1).csv → New Member Date column"],
  },
  {
    name: "Region breakdown (AMER / EMEA / APAC)",
    section: "slack",
    definition: "Geographic distribution of 805 Slack members by IBM region.",
    calculation: "AMER 53% (425), APAC 25% (198), EMEA 23% (182) = 805. Top countries: US (362), IN (189), IE (64), CA (50), GB (18), RO (18), DE (14). 24 members have no BluePages country set.",
    source: "IBM W3 BluePages member download export — W3country column",
    files: ["8.04 - Member Download (805).xlsx → W3country column"],
    notes: "Country mapping to region: US + CA + LATAM = AMER; Europe + MEA = EMEA; Asia Pacific = APAC. 24 members have numeric '0' in W3country field — BluePages data gap.",
  },

  // ── SharePoint ─────────────────────────────────────────────────────────────
  {
    name: "Page views",
    section: "sharepoint",
    definition: "Total all-time page view events on the Growth Community SharePoint site.",
    calculation: "All-time site visits from the Overall Traffic aggregate row: 3,603 as of Aug 4, 2026.",
    source: "SharePoint site analytics export (.xlsx)",
    files: ["SiteAnalyticsData_4-Aug,2026.xlsx → Overall traffic sheet → All time row"],
  },
  {
    name: "Unique viewers",
    section: "sharepoint",
    definition: "Number of distinct authenticated users who viewed at least one page on the site, all time.",
    calculation: "All-time unique viewer count from Overall Traffic sheet: 55 as of Aug 4, 2026.",
    source: "SharePoint site analytics export (.xlsx)",
    files: ["SiteAnalyticsData_4-Aug,2026.xlsx → Overall traffic sheet → All time row"],
  },
  {
    name: "Desktop visits %",
    section: "sharepoint",
    definition: "Percentage of all-time site visits that came from a desktop device.",
    calculation: "Desktop visits ÷ total visits = 3,366 ÷ 3,603 = 93%.",
    source: "SharePoint site analytics export (.xlsx) — Usage by device sheet",
    files: ["SiteAnalyticsData_4-Aug,2026.xlsx → Usage by device sheet"],
  },
  {
    name: "Views & unique viewers trend",
    section: "sharepoint",
    definition: "Weekly time-series of page views and unique viewers, used to visualise traffic growth.",
    calculation: "4 weekly buckets: Jul 8–14 (218), Jul 15–21 (601), Jul 22–28 (601), Jul 29–Aug 4 (613).",
    source: "SharePoint site analytics export (.xlsx) — Overall traffic daily rows, grouped by week",
    files: ["SiteAnalyticsData_4-Aug,2026.xlsx → Overall traffic sheet", "analytics.json → sharepointTrend"],
    notes: "Data prior to Jul 8 is excluded as it reflects the Growth Team folder period, not the public Growth Community site.",
  },
  {
    name: "Most visited resources",
    section: "sharepoint",
    definition: "Member-facing SharePoint documents ranked by total page views (last 7 days).",
    calculation: "sharepointResources sorted descending by views. Admin-only and presenter-only documents excluded.",
    source: "SharePoint site analytics export (.xlsx) — Popular content sheet",
    files: ["SiteAnalyticsData_4-Aug,2026.xlsx → Popular content sheet", "analytics.json → sharepointResources"],
  },

  // ── GCC Call Attendance ────────────────────────────────────────────────────
  {
    name: "Total call attendees",
    section: "meeting",
    definition: "Number of unique participants who joined a GCC Teams call.",
    calculation: "Row count of the '2. Participants' section in the Teams attendance report, after deduplication.",
    source: "Microsoft Teams attendance report (.xlsx)",
    files: [
      "Growth Community Call (GCC) - Attendance report 7-14-26.xlsx",
      "Growth Community Call - Attendance report 7-21-26.xlsx",
      "Growth Community Call (GCC) - Attendance report 7-28-26.xlsx",
    ],
    notes: "Teams exports one row per join event; if someone rejoined, they appear twice. The dashboard deduplicates by name.",
  },
  {
    name: "Meeting duration",
    section: "meeting",
    definition: "Total length of the GCC call from first join to last leave.",
    calculation: "Taken directly from the '1. Summary' section of the Teams attendance report — 'Meeting duration' field.",
    source: "Microsoft Teams attendance report (.xlsx) → Summary section",
    files: ["Attendance report .xlsx files → Meeting duration row"],
  },
  {
    name: "Avg. attendance time",
    section: "meeting",
    definition: "Average time each participant spent in the call.",
    calculation: "Taken directly from the '1. Summary' section of the Teams attendance report — 'Average attendance time' field.",
    source: "Microsoft Teams attendance report (.xlsx) → Summary section",
    files: ["Attendance report .xlsx files → Average attendance time row"],
  },
  {
    name: "New Slack members (GCC tab)",
    section: "meeting",
    definition: "Members who joined the Slack workspace between Jul 10 and Aug 4, 2026 — tracked for GCC call attendance.",
    calculation: "All 111 members who joined Jul 10–Aug 4, cross-referenced against all 3 July GCC attendance reports.",
    source: "Member download exports + Teams attendance reports",
    files: ["8.04 - Member Download (805).xlsx", "6.11 - Member Download (697).xlsx", "analytics.json → meetingAttendance.newMembers"],
  },
  {
    name: "New members attended / absent",
    section: "meeting",
    definition: "Cross-reference of 111 new Slack members (Jul 10–Aug 4) against all 3 July GCC attendance reports.",
    calculation: "Each new member's name matched against Jul 14, Jul 21, and Jul 28 attendee lists. Attended any = 16 (14%); absent = 95 (86%).",
    source: "Member download exports + all 3 Teams attendance reports",
    files: [
      "8.04 - Member Download (805).xlsx",
      "Growth Community Call (GCC) - Attendance report 7-14-26.xlsx",
      "Growth Community Call - Attendance report 7-21-26.xlsx",
      "Growth Community Call (GCC) - Attendance report 7-28-26.xlsx",
      "analytics.json → meetingAttendance.newMembers[].attended",
    ],
  },
  {
    name: "Total unique attendees (July overview)",
    section: "meeting",
    definition: "Distinct individuals who attended at least one of the three July GCC calls.",
    calculation: "Union of all three attendee name sets (Jul 14 ∪ Jul 21 ∪ Jul 28), deduplicated by normalised lowercase name.",
    source: "All three Teams attendance reports",
    files: [
      "Growth Community Call (GCC) - Attendance report 7-14-26.xlsx",
      "Growth Community Call - Attendance report 7-21-26.xlsx",
      "Growth Community Call (GCC) - Attendance report 7-28-26.xlsx",
    ],
  },
  {
    name: "Core members (attended all 3)",
    section: "meeting",
    definition: "Attendees who were present at every one of the three July GCC calls.",
    calculation: "Intersection of all three attendee name sets (Jul 14 ∩ Jul 21 ∩ Jul 28), matched by normalised name.",
    source: "All three Teams attendance reports",
    files: [
      "Growth Community Call (GCC) - Attendance report 7-14-26.xlsx",
      "Growth Community Call - Attendance report 7-21-26.xlsx",
      "Growth Community Call (GCC) - Attendance report 7-28-26.xlsx",
      "analytics.json → gccCallOverview.coreAttendees",
    ],
  },
  {
    name: "Cross-call breakdown",
    section: "meeting",
    definition: "How many unique attendees came to exactly which combination of the three July calls.",
    calculation: "Set logic on the three attendee lists: e.g., 'Jul 14 only' = in Jul 14 set AND NOT in Jul 21 OR Jul 28.",
    source: "All three Teams attendance reports — computed via set operations",
    files: ["analytics.json → gccCallOverview.crossCallBreakdown"],
  },
  {
    name: "Engagement actions",
    section: "meeting",
    definition: "Count of active participation events a person performed during a call (reactions, raised hand, camera on, unmute, etc.).",
    calculation: "Taken directly from the '3. In-Meeting Activities' section of the Teams attendance report — one event per row per person.",
    source: "Microsoft Teams attendance report (.xlsx) → In-Meeting Activities section",
    files: ["Attendance report .xlsx files → In-Meeting Activities section", "analytics.json → meetingAttendance.allAttendees[].engagementActions"],
  },

  // ── ICA Agent ──────────────────────────────────────────────────────────────
  {
    name: "ICA agent usage / queries",
    section: "ica",
    definition: "Total number of user queries submitted to the ICA (Intelligent Community Assistant) agent in the period.",
    calculation: "Count of query events from ICA usage logs for the reporting month.",
    source: "ICA agent telemetry / usage logs",
    files: ["analytics.json → icaUsage[].queries", "analytics.json → kpis.ica.queries"],
    notes: "ICA data is currently illustrative — replace with live telemetry export when available.",
  },
  {
    name: "Success rate",
    section: "ica",
    definition: "Percentage of ICA queries that were resolved without the user escalating or providing negative feedback.",
    calculation: "Successful queries ÷ total queries × 100. Taken from icaUsage[].success / icaUsage[].queries.",
    source: "ICA agent telemetry",
    files: ["analytics.json → icaUsage[].success"],
  },
  {
    name: "Fallback rate",
    section: "ica",
    definition: "Percentage of ICA queries that the agent could not answer and fell back to a default response or escalation.",
    calculation: "100% − success rate.",
    source: "ICA agent telemetry",
    files: ["analytics.json → kpis.ica.fallbackRate"],
  },
  {
    name: "Top query topics",
    section: "ica",
    definition: "The most common subject areas users ask the ICA agent about.",
    calculation: "Queries grouped by intent/topic category from ICA logs, ranked by volume.",
    source: "ICA agent telemetry — intent classification",
    files: ["analytics.json → icaTopics"],
    notes: "Topic labels are derived from intent classification in the ICA system.",
  },
];

const SECTION_META: Record<Exclude<Section, "all">, { label: string; icon: typeof LayoutDashboard; color: string }> = {
  overview:   { label: "Overview",             icon: LayoutDashboard, color: "var(--gc-ibm-blue)"   },
  slack:      { label: "Slack Member Growth",  icon: Users,           color: "var(--gc-green)"      },
  sharepoint: { label: "SharePoint Analytics", icon: FileText,        color: "var(--gc-purple)"     },
  meeting:    { label: "GCC Call Attendance",  icon: Video,           color: "var(--gc-amber)"      },
  ica:        { label: "ICA Agent Analytics",  icon: Bot,             color: "var(--gc-ibm-blue)"   },
};

const SECTION_FILTERS: { key: Section; label: string }[] = [
  { key: "all",        label: "All metrics"          },
  { key: "overview",   label: "Overview"             },
  { key: "slack",      label: "Slack"                },
  { key: "sharepoint", label: "SharePoint"           },
  { key: "meeting",    label: "GCC Attendance"       },
  { key: "ica",        label: "ICA Agent"            },
];

export function DataDictionaryTab() {
  const [section, setSection] = useState<Section>("all");
  const [search, setSearch] = useState("");

  const filtered = METRICS.filter((m) => {
    const matchSection = section === "all" || m.section === section;
    const q = search.toLowerCase();
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.definition.toLowerCase().includes(q) || m.source.toLowerCase().includes(q);
    return matchSection && matchSearch;
  });

  // Group by section for display
  const grouped = (["overview", "slack", "sharepoint", "meeting", "ica"] as Exclude<Section, "all">[])
    .map((s) => ({ section: s, items: filtered.filter((m) => m.section === s) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Data dictionary"
        description="Definitions, calculations, and data sources for every metric in this dashboard"
      />

      {/* Search + filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by section">
          {SECTION_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setSection(f.key)}
              aria-pressed={section === f.key}
              className={cn(
                "rounded-full border px-3 py-1 text-[12px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                section === f.key
                  ? "border-[var(--gc-ibm-blue)] bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                  : "border-[var(--border)] text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)]",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gc-grey)]" />
          <Input
            type="search"
            placeholder="Search metrics…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full pl-7 text-[13px] sm:w-52"
            aria-label="Search metrics"
          />
        </div>
      </div>

      {filtered.length === 0 && (
        <p className="py-10 text-center text-[13px] text-[var(--gc-grey)]">No metrics match your search.</p>
      )}

      {/* Grouped sections */}
      {grouped.map(({ section: sec, items }) => {
        const meta = SECTION_META[sec];
        const Icon = meta.icon;
        return (
          <div key={sec} className="space-y-2">
            {/* Section header */}
            <div className="flex items-center gap-2 pb-1 pt-2">
              <Icon size={15} style={{ color: meta.color }} />
              <h3 className="text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 600 }}>{meta.label}</h3>
              <span className="rounded-full bg-[var(--gc-offwhite)] px-2 py-0.5 text-[11px] text-[var(--gc-grey)]">{items.length} metric{items.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="grid gap-2.5">
              {items.map((m) => (
                <Card key={m.name} className="gap-0 rounded-md border-[var(--border)] p-0 shadow-none overflow-hidden">
                  {/* Metric name header */}
                  <div className="flex items-center gap-2.5 border-b border-[var(--border)] bg-[var(--gc-offwhite)] px-4 py-2.5">
                    <Database size={13} style={{ color: meta.color }} className="shrink-0" />
                    <span className="text-[14px] text-[var(--gc-graphite)]" style={{ fontWeight: 600 }}>{m.name}</span>
                  </div>

                  {/* Detail rows */}
                  <div className="divide-y divide-[var(--border)]">
                    <Row icon={<BookOpen size={13} />} label="Definition" value={m.definition} />
                    <Row icon={<Calculator size={13} />} label="Calculation" value={m.calculation} />
                    <Row icon={<Database size={13} />} label="Data source" value={m.source} />
                    <div className="grid grid-cols-[120px_1fr] items-start gap-3 px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[12px] text-[var(--gc-grey)]">
                        <FileSpreadsheet size={13} />
                        Files / fields
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.files.map((f, fi) => (
                          <span key={fi} className="inline-flex items-center rounded bg-[var(--gc-offwhite)] border border-[var(--border)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--gc-graphite-soft)]">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    {m.notes && (
                      <div className="grid grid-cols-[120px_1fr] items-start gap-3 bg-[var(--gc-amber-soft,#fffbeb)] px-4 py-2.5">
                        <span className="text-[12px] text-[var(--gc-amber,#d97706)]">⚠ Note</span>
                        <span className="text-[12px] text-[var(--gc-graphite-soft)]">{m.notes}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {/* Footer summary */}
      <Card className="gap-2 rounded-md border-[var(--border)] bg-[var(--gc-offwhite)] p-4 shadow-none">
        <p className="text-[13px] text-[var(--gc-graphite)]" style={{ fontWeight: 600 }}>Source file index</p>
        <div className="grid gap-1 sm:grid-cols-2">
          {[
            ["slack-members-Jul-28.csv",                                     "Slack workspace member export — Jul 28, 2026"],
            ["slack-members-Jul-10.csv",                                     "Slack workspace member export — Jul 10, 2026"],
            ["SiteAnalyticsData_28-Jul,2026.xlsx",                           "SharePoint site analytics export — Jul 28, 2026"],
            ["Growth Community Call (GCC) - Attendance report 7-14-26.xlsx", "Teams attendance report — Jul 14, 2026"],
            ["Growth Community Call - Attendance report 7-21-26.xlsx",       "Teams attendance report — Jul 21, 2026"],
            ["Growth Community Call (GCC) - Attendance report 7-28-26.xlsx", "Teams attendance report — Jul 28, 2026"],
            ["analytics.json",                                               "Dashboard data file (public/analytics.json) — manually updated"],
          ].map(([file, desc]) => (
            <div key={file} className="flex items-start gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2">
              <FileSpreadsheet size={13} className="mt-0.5 shrink-0 text-[var(--gc-grey)]" />
              <div>
                <p className="font-mono text-[11px] text-[var(--gc-graphite-soft)]">{file}</p>
                <p className="text-[11px] text-[var(--gc-grey)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-start gap-3 px-4 py-3">
      <span className="flex items-center gap-1.5 text-[12px] text-[var(--gc-grey)]">
        {icon}
        {label}
      </span>
      <span className="text-[13px] text-[var(--gc-graphite-soft)]">{value}</span>
    </div>
  );
}
