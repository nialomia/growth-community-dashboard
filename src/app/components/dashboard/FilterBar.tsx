import { SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { useDashboard, Filters, defaultFilters } from "../../dashboard-context";
import { filterOptions } from "../../data";
import { cn } from "../ui/utils";

const CONTROLS: { key: keyof Filters; label: string; options: string[] }[] = [
  { key: "region", label: "Region", options: filterOptions.region },
  { key: "segment", label: "Community segment", options: filterOptions.segment },
  { key: "channel", label: "Engagement channel", options: filterOptions.channel },
  { key: "content", label: "Content type", options: filterOptions.content },
];

export function FilterBar() {
  const { filters, setFilter, resetFilters } = useDashboard();
  const activeCount = CONTROLS.filter((c) => filters[c.key] !== defaultFilters[c.key]).length;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] bg-white px-4 py-2.5 md:px-6">
      <span className="mr-1 inline-flex items-center gap-1.5 text-[13px] text-[var(--gc-grey)]">
        <SlidersHorizontal size={14} />
        Filters
      </span>
      {CONTROLS.map((c) => {
        const isActive = filters[c.key] !== defaultFilters[c.key];
        return (
          <Select key={c.key} value={filters[c.key]} onValueChange={(v) => setFilter(c.key, v)}>
            <SelectTrigger
              aria-label={c.label}
              className={cn(
                "h-8 w-auto justify-start gap-1.5 rounded-full border-dashed text-[13px]",
                isActive &&
                  "border-solid border-[var(--gc-ibm-blue)] bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]",
              )}
            >
              <span className="text-[var(--gc-grey)]">{c.label}:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {c.options.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
      {activeCount > 0 && (
        <Button
          variant="ghost"
          className="h-8 rounded-full px-2.5 text-[13px] text-[var(--gc-grey)]"
          onClick={resetFilters}
        >
          <X size={13} />
          Clear {activeCount} filter{activeCount > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}
