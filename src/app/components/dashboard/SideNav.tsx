import {
  LayoutDashboard,
  Users,
  FileText,
  Bot,
  CalendarDays,
  LucideIcon,
} from "lucide-react";
import { cn } from "../ui/utils";

export type TabKey =
  | "overview"
  | "slack"
  | "sharepoint"
  | "ica"
  | "events";

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "slack", label: "Slack Member Growth", icon: Users },
  { key: "sharepoint", label: "SharePoint Analytics", icon: FileText },
  { key: "ica", label: "ICA Agent Analytics", icon: Bot },
  { key: "events", label: "Events & Engagement", icon: CalendarDays },
];

export function SideNav({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--border)] bg-white px-2 md:h-[calc(100vh-53px)] md:w-60 md:flex-col md:overflow-visible md:border-b-0 md:border-r md:px-3 md:py-4"
    >
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] md:w-full",
              isActive
                ? "bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                : "text-[var(--gc-graphite-soft)] hover:bg-[var(--gc-offwhite)]",
            )}
            style={isActive ? { fontWeight: 500 } : undefined}
          >
            <Icon size={17} className={cn(isActive ? "text-[var(--gc-ibm-blue)]" : "text-[var(--gc-grey)]")} />
            <span className="whitespace-nowrap">{label}</span>
          </button>
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
