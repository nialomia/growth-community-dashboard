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
  { key: "overview",   label: "Overview",             icon: LayoutDashboard },
  { key: "slack",      label: "Slack Members",        icon: Users },
  { key: "sharepoint", label: "SharePoint",           icon: FileText },
  { key: "ica",        label: "ICA Agent",            icon: Bot },
  { key: "meeting",    label: "GCC Attendance",       icon: Video },
  { key: "dictionary", label: "Data Dictionary",      icon: BookOpen },
];

const GCC_SUB_TABS: { key: GccSubKey; label: string }[] = [
  { key: "july-meetings",    label: "Jul–Aug (4 calls)" },
  { key: "july-new-members", label: "New Member Tracking"  },
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
      className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-[var(--border)] bg-white px-2 md:h-[calc(100vh-56px)] md:w-56 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-5"
    >
      {/* Section label — desktop only */}
      <p className="hidden md:block mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--gc-grey)]">
        Navigation
      </p>

      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <div key={key}>
            <button
              onClick={() => onChange(key)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex w-full shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                isActive
                  ? "bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                  : "text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)] hover:text-[var(--gc-graphite-soft)]",
              )}
              style={isActive ? { fontWeight: 600 } : undefined}
            >
              {/* Active left indicator — desktop only */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:block h-5 w-[3px] rounded-r-full bg-[var(--gc-ibm-blue)]"
                  aria-hidden
                />
              )}
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-[var(--gc-ibm-blue)]" : "text-[var(--gc-grey)] group-hover:text-[var(--gc-graphite-soft)]"
                )}
              />
              <span className="whitespace-nowrap">{label}</span>
            </button>

            {/* GCC sub-nav */}
            {key === "meeting" && isActive && (
              <div className="mt-1 mb-1 hidden md:block">
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--gc-grey)]">
                  Sub-views
                </p>
                {GCC_SUB_TABS.map((sub) => (
                  <button
                    key={sub.key}
                    onClick={() => onGccSub(sub.key)}
                    aria-current={gccSub === sub.key ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center rounded-lg py-2 pl-9 pr-3 text-left text-[12px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                      gccSub === sub.key
                        ? "bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                        : "text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)] hover:text-[var(--gc-graphite-soft)]",
                    )}
                    style={gccSub === sub.key ? { fontWeight: 600 } : undefined}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom tag */}
      <div className="mt-auto hidden md:block rounded-xl bg-[var(--gc-ibm-blue-soft)] p-3.5">
        <p className="text-[11px] text-[var(--gc-ibm-blue)]" style={{ fontWeight: 600 }}>
          Growth Community
        </p>
        <p className="text-[11px] text-[var(--gc-ibm-blue)] opacity-70 mt-0.5">
          Analytics dashboard · Aug 2026
        </p>
      </div>
    </nav>
  );
}
