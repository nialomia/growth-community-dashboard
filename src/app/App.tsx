import { useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { DashboardProvider } from "./dashboard-context";
import { Header } from "./components/dashboard/Header";
import { SideNav, TabKey, GccSubKey } from "./components/dashboard/SideNav";
import { FilterBar } from "./components/dashboard/FilterBar";
import { OverviewTab } from "./components/dashboard/tabs/OverviewTab";
import { SlackTab } from "./components/dashboard/tabs/SlackTab";
import { SharePointTab } from "./components/dashboard/tabs/SharePointTab";
import { IcaTab } from "./components/dashboard/tabs/IcaTab";
import { MeetingTab } from "./components/dashboard/tabs/MeetingTab";
import { DataDictionaryTab } from "./components/dashboard/tabs/DataDictionaryTab";

export default function App() {
  const [tab, setTab] = useState<TabKey>("overview");
  const [gccSub, setGccSub] = useState<GccSubKey>("july-new-members");

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-[var(--gc-offwhite)] text-[var(--gc-graphite)]">
        <Header />
        <div className="flex flex-col md:flex-row">
          <SideNav active={tab} onChange={setTab} gccSub={gccSub} onGccSub={setGccSub} />
          <div className="min-w-0 flex-1">
            <FilterBar />
            <main className="mx-auto max-w-[1400px] p-4 md:p-6">
              {tab === "overview"    && <OverviewTab onDrill={setTab} />}
              {tab === "slack"       && <SlackTab />}
              {tab === "sharepoint"  && <SharePointTab />}
              {tab === "ica"         && <IcaTab />}
              {tab === "meeting"     && <MeetingTab gccSub={gccSub} onGccSub={setGccSub} />}
              {tab === "dictionary"  && <DataDictionaryTab />}
            </main>
          </div>
        </div>
        <Toaster position="bottom-right" />
      </div>
    </DashboardProvider>
  );
}
