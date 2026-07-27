import { Search, Download, Leaf, Calendar, RefreshCw, AlertCircle } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import { useDashboard } from "../../dashboard-context";
import { filterOptions } from "../../data";
import { Hint } from "./primitives";

export function Header() {
  const { lowData, setLowData, filters, setFilter, analyticsStatus, lastUpdated } = useDashboard();

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

        {/* Global search */}
        <div className="relative hidden md:block">
          <Search
            size={15}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--gc-grey)]"
            aria-hidden
          />
          <Input
            type="search"
            aria-label="Search analytics"
            placeholder="Search metrics, members, resources…"
            className="h-9 w-56 rounded-md pl-8"
          />
        </div>

        {/* Date range */}
        <Select value={filters.dateRange} onValueChange={(v) => setFilter("dateRange", v)}>
          <SelectTrigger className="h-9 w-[150px]" aria-label="Date range">
            <Calendar size={14} className="text-[var(--gc-grey)]" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.dateRange.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export */}
        <Button
          variant="outline"
          className="h-9"
          onClick={() => toast.success("Export queued", { description: "A lightweight CSV will be emailed to you." })}
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export</span>
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
