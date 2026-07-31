import {
  LayoutDashboard,
  Users,
  FileText,
  Bot,
  Video,
  BookOpen,
  LucideIcon,
} from "lucide-react";
import { cn } from "../ui/utils";

export type TabKey =
  | "overview"
  | "slack"
  | "sharepoint"
  | "ica"
  | "meeting"
  | "dictionary";

export type GccSubKey = "july-meetings" | "july-new-members";

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview",    label: "Overview",              icon: LayoutDashboard },
  { key: "slack",       label: "Slack Member Growth",   icon: Users },
  { key: "sharepoint",  label: "SharePoint Analytics",  icon: FileText },
  { key: "ica",         label: "ICA Agent Analytics",   icon: Bot },
  { key: "meeting",     label: "GCC Call Attendance",   icon: Video },
  { key: "dictionary",  label: "Data Dictionary",       icon: BookOpen },
];

const GCC_SUB_TABS: { key: GccSubKey; label: string }[] = [
  { key: "july-meetings",    label: "July (3 meetings)"  },
  { key: "july-new-members", label: "July New Members"   },
];

export function SideNav({
  active,
  onChange,
  gccSub,
  onGccSub,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  gccSub: GccSubKey;
  onGccSub: (s: GccSubKey) => void;
}) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--border)] bg-white px-2 md:h-[calc(100vh-53px)] md:w-60 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-4"
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <div key={key}>
            <button
              onClick={() => onChange(key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex w-full shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                isActive
                  ? "bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                  : "text-[var(--gc-graphite-soft)] hover:bg-[var(--gc-offwhite)]",
              )}
              style={isActive ? { fontWeight: 500 } : undefined}
            >
              <Icon size={17} className={cn(isActive ? "text-[var(--gc-ibm-blue)]" : "text-[var(--gc-grey)]")} />
              <span className="whitespace-nowrap">{label}</span>
            </button>

            {/* GCC Call Overview sub-nav — only visible on desktop when meeting tab is active */}
            {key === "meeting" && isActive && (
              <div className="mt-1 hidden md:block">
                {/* Group label */}
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--gc-grey)]">
                  GCC Call Overview
                </p>
                {GCC_SUB_TABS.map((sub) => (
                  <button
                    key={sub.key}
                    onClick={() => onGccSub(sub.key)}
                    aria-current={gccSub === sub.key ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center rounded-md py-1.5 pl-8 pr-3 text-left text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                      gccSub === sub.key
                        ? "bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                        : "text-[var(--gc-graphite-soft)] hover:bg-[var(--gc-offwhite)]",
                    )}
                    style={gccSub === sub.key ? { fontWeight: 500 } : undefined}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
      <div className="mt-auto hidden rounded-md bg-[var(--gc-offwhite)] p-3 md:block">
        <p className="text-[12px] text-[var(--gc-grey)]">
          Built with reusable components and efficient charts to keep this dashboard
          lightweight.
        </p>
      </div>
    </nav>
  );
}
