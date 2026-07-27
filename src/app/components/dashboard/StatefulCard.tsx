import { useState } from "react";
import { Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { SectionHeading, TrendArrow } from "./primitives";
import { cn } from "../ui/utils";

type State = "ready" | "loading" | "empty" | "error";

/**
 * Demonstrates accessible loading, empty and error states for an analytics card.
 * The state switcher makes each state inspectable from the UI.
 */
export function StatefulCard() {
  const [state, setState] = useState<State>("ready");

  return (
    <Card className="gap-3 rounded-md border-[var(--border)] p-4 shadow-none">
      <SectionHeading
        title="Real-time active users"
        description="Live signal — includes loading, empty and error states"
        action={
          <div className="flex gap-1" role="group" aria-label="Preview card state">
            {(["ready", "loading", "empty", "error"] as State[]).map((s) => (
              <button
                key={s}
                onClick={() => setState(s)}
                aria-pressed={state === s}
                className={cn(
                  "rounded px-2 py-0.5 text-[12px] capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  state === s
                    ? "bg-[var(--gc-ibm-blue-soft)] text-[var(--gc-ibm-blue)]"
                    : "text-[var(--gc-grey)] hover:bg-[var(--gc-offwhite)]",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        }
      />

      <div className="min-h-[104px]" aria-live="polite">
        {state === "ready" && (
          <div className="flex items-end justify-between">
            <div>
              <p className="tabular-nums text-[var(--gc-graphite)]" style={{ fontSize: 30, fontWeight: 600 }}>
                318
              </p>
              <p className="mt-1 text-[13px]">
                <TrendArrow trend="up" value="+24" /> in the last hour
              </p>
            </div>
            <div className="flex h-16 items-end gap-1" aria-hidden>
              {[40, 55, 48, 70, 62, 85, 78].map((h, i) => (
                <span
                  key={i}
                  className="w-2.5 rounded-t bg-[var(--gc-ibm-blue)]"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {state === "loading" && (
          <div className="space-y-2" aria-busy="true">
            <span className="inline-flex items-center gap-2 text-[13px] text-[var(--gc-grey)]">
              <Loader2 size={14} className="animate-spin" /> Loading live data…
            </span>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
        )}

        {state === "empty" && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-center">
            <Inbox size={22} className="text-[var(--gc-grey)]" />
            <p className="text-[14px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>
              No active users right now
            </p>
            <p className="text-[13px] text-[var(--gc-grey)]">Data will appear once members are online.</p>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-4 text-center">
            <AlertCircle size={22} className="text-[var(--gc-red)]" />
            <p className="text-[14px] text-[var(--gc-graphite)]" style={{ fontWeight: 500 }}>
              Couldn't load live data
            </p>
            <p className="text-[13px] text-[var(--gc-grey)]">The signal timed out. Please retry.</p>
            <Button variant="outline" className="mt-1 h-7 text-[13px]" onClick={() => setState("loading")}>
              <RefreshCw size={13} /> Retry
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
