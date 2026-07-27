import { createContext, useContext, useState, ReactNode } from "react";
import { useAnalytics, AnalyticsData, AnalyticsStatus, FALLBACK } from "./data";

export type Filters = {
  dateRange: string;
  region: string;
  segment: string;
  channel: string;
  content: string;
};

type DashboardState = {
  /** Live analytics data fetched from /public/analytics.json */
  analytics: AnalyticsData;
  /** "loading" | "ready" | "error" */
  analyticsStatus: AnalyticsStatus;
  /** ISO date string of last analytics update (from analytics.json _meta) */
  lastUpdated: string;
  lowData: boolean;
  setLowData: (v: boolean) => void;
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
  resetFilters: () => void;
};

const defaultFilters: Filters = {
  dateRange: "Last 30 days",
  region: "All regions",
  segment: "All segments",
  channel: "All channels",
  content: "All content",
};

const DashboardContext = createContext<DashboardState | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [lowData, setLowData] = useState(false);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const { data: analytics, status: analyticsStatus, lastUpdated } = useAnalytics();

  const setFilter = (key: keyof Filters, value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const resetFilters = () => setFilters(defaultFilters);

  return (
    <DashboardContext.Provider
      value={{
        analytics,
        analyticsStatus,
        lastUpdated,
        lowData,
        setLowData,
        filters,
        setFilter,
        resetFilters,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

export { defaultFilters, FALLBACK };
