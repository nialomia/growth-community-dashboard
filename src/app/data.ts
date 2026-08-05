/**
 * data.ts
 * ───────────────────────────────────────────────────────────────────────────
 * Single source of truth for all dashboard analytics.
 *
 * HOW LIVE DATA WORKS
 * ───────────────────
 * The dashboard loads `public/analytics.json` on every page load.
 * To push today's numbers, simply edit (or replace) that file — no code change
 * needed.  The JSON is fetched via `useAnalytics()` hook below and wired into
 * DashboardProvider so every tab receives the same fresh dataset.
 *
 * To automate daily updates see `scripts/update-analytics.js`.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";

// ─── Type definitions ────────────────────────────────────────────────────────

export type Segment = {
  id: string;
  name: string;
  region: string;
  members: number;
  engagement: number;
  trend: "up" | "down" | "flat";
  status: "Thriving" | "Steady" | "At risk";
};

export type KpiValue = {
  value: string;
  trend: "up" | "down" | "flat";
  delta: string;
};

export type NewMember = {
  id: string;
  name: string;
  email: string;
  joinedSlack: string;
  attended: boolean;
  joinTime?: string;
  engagementActions?: number;
};

export type Attendee = {
  name: string;
  joinTime: string;
  engagementActions: number;
  isNewMember: boolean;
};

export type MeetingAttendanceData = {
  meetingTitle: string;
  meetingDate: string;
  meetingDuration: string;
  totalAttendees: number;
  avgAttendanceTime: string;
  newMemberCount: number;
  newMembersAttended: number;
  newMembersAbsent: number;
  allAttendees?: Attendee[];
  newMembers: NewMember[];
};

export type GccCall = {
  date: string;
  fullDate: string;
  attendees: number;
  duration: string;
  avgAttendanceTime: string;
};

export type GccCallOverview = {
  calls: GccCall[];
  summary: {
    totalUnique: number;
    avgAttendees: number;
    attendedAll3: number;
    attendedExactly2: number;
    attendedExactly1: number;
  };
  crossCallBreakdown: { label: string; count: number }[];
  attendanceTrend: { date: string; attendees: number }[];
  coreAttendees: string[];
  jul14Attendees: string[];
  jul21Attendees: string[];
};

export type AnalyticsData = {
  _meta: { lastUpdated: string; updatedBy: string; note: string };
  growthTrend: { month: string; members: number; active: number; sharepoint: number }[];
  slackGrowth: { month: string; newMembers: number; returning: number; inactive: number }[];
  cohorts: { cohort: string; w1: number; w2: number; w3: number; w4: number }[];
  segments: Segment[];
  sharepointResources: {
    id: string; title: string; type: string; owner: string;
    views: number; downloads: number; freshness: string; month: string;
  }[];
  sharepointTrend: { month: string; views: number; unique: number }[];
  icaTopics: {
    id: string; topic: string; queries: number;
    success: number; trend: string; status: string;
  }[];
  icaUsage: { month: string; queries: number; success: number }[];
  events: { id: string; title: string; date: string; attendance: number; feedback: number }[];
  eventEngagement: { month: string; pre: number; post: number }[];
  timeline: { id: string; date: string; label: string; kind: string }[];
  kpis: {
    overview: Record<string, KpiValue>;
    slack: Record<string, KpiValue>;
    sharepoint: Record<string, KpiValue>;
    ica: Record<string, KpiValue>;
    events: Record<string, KpiValue>;
  };
  communityHealth: {
    score: string;
    status: string;
    signals: { label: string; value: number; status: string }[];
  };
  sharepointFreshness: { label: string; pct: number; status: string }[];
  upcomingEvents: { title: string; date: string }[];
  meetingAttendance?: MeetingAttendanceData;
  gccCallOverview?: GccCallOverview;
  memberPersonas?: { persona: string; count: number; pct: number }[];
};

// ─── Static fallback (used until the JSON fetch resolves) ────────────────────

export const FALLBACK: AnalyticsData = {
  _meta: { lastUpdated: "—", updatedBy: "—", note: "" },
  growthTrend: [
    { month: "Jan", members: 3820, active: 1180, sharepoint: 5400 },
    { month: "Feb", members: 4120, active: 1290, sharepoint: 5980 },
    { month: "Mar", members: 4510, active: 1440, sharepoint: 6720 },
    { month: "Apr", members: 4980, active: 1610, sharepoint: 7350 },
    { month: "May", members: 5340, active: 1720, sharepoint: 8010 },
    { month: "Jun", members: 5910, active: 1980, sharepoint: 8890 },
    { month: "Jul", members: 6480, active: 2210, sharepoint: 9620 },
  ],
  slackGrowth: [
    { month: "Jan", newMembers: 340, returning: 220, inactive: 90 },
    { month: "Feb", newMembers: 300, returning: 260, inactive: 110 },
    { month: "Mar", newMembers: 390, returning: 280, inactive: 130 },
    { month: "Apr", newMembers: 470, returning: 320, inactive: 120 },
    { month: "May", newMembers: 360, returning: 350, inactive: 150 },
    { month: "Jun", newMembers: 570, returning: 410, inactive: 140 },
    { month: "Jul", newMembers: 570, returning: 460, inactive: 160 },
  ],
  cohorts: [
    { cohort: "Joined Jan", w1: 82, w2: 61, w3: 48, w4: 41 },
    { cohort: "Joined Feb", w1: 79, w2: 58, w3: 45, w4: 39 },
    { cohort: "Joined Mar", w1: 85, w2: 66, w3: 52, w4: 44 },
    { cohort: "Joined Apr", w1: 88, w2: 70, w3: 57, w4: 49 },
    { cohort: "Joined May", w1: 84, w2: 63, w3: 50, w4: 43 },
  ],
  segments: [
    { id: "s1", name: "Product Builders",  region: "EMEA", members: 1240, engagement: 74, trend: "up",   status: "Thriving" },
    { id: "s2", name: "Data & AI Guild",   region: "AMER", members: 980,  engagement: 68, trend: "up",   status: "Thriving" },
    { id: "s3", name: "Design Circle",     region: "APAC", members: 640,  engagement: 52, trend: "flat", status: "Steady"   },
    { id: "s4", name: "Ops Network",       region: "EMEA", members: 520,  engagement: 41, trend: "down", status: "At risk"  },
    { id: "s5", name: "New Grads",         region: "AMER", members: 780,  engagement: 63, trend: "up",   status: "Steady"   },
    { id: "s6", name: "Partner Community", region: "APAC", members: 410,  engagement: 38, trend: "down", status: "At risk"  },
    { id: "s7", name: "Leadership Forum",  region: "AMER", members: 290,  engagement: 71, trend: "up",   status: "Thriving" },
    { id: "s8", name: "Support Champions", region: "EMEA", members: 350,  engagement: 55, trend: "flat", status: "Steady"   },
  ],
  sharepointResources: [
    { id: "r1",  title: "Home.aspx",                                                                             type: "Site Page", owner: "Growth Community", views: 26, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r2",  title: "Growth Community - 2Q26 Showcase - Guardium Data Protection + Compliance Express.pptx", type: "Document",  owner: "Growth Community", views: 23, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r3",  title: "Growth Community - Themed Conversation Leader Kit - 2026 July 28.pptx",                 type: "Document",  owner: "Growth Community", views: 69, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r4",  title: "Growth Community Call-Meeting Recording - July 21 2026.mp4",                            type: "Document",  owner: "Growth Community", views: 5,  downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r5",  title: "Growth Community - 2Q26 Showcase - Maximo.pptx",                                       type: "Document",  owner: "Growth Community", views: 32, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r6",  title: "Growth Community - 2Q26 Showcase - Trial Registration Form Redesign.pptx",             type: "Document",  owner: "Growth Community", views: 14, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r7",  title: "Growth Community - Themed Conversation Leader Kit - TEMPLATE.pptx",                    type: "Document",  owner: "Growth Community", views: 20, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r8",  title: "UserEmailFormat13.07.xlsx",                                                             type: "Document",  owner: "Growth Community", views: 52, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r9",  title: "Growth Community - Themed Conversation Leader Kit - 2026 Aug 11.pptx",                  type: "Document",  owner: "Growth Community", views: 11, downloads: 0, freshness: "Fresh", month: "Aug" },
    { id: "r10", title: "Growth Community Call - 2026 July 21.pptx",                                            type: "Document",  owner: "Growth Community", views: 9,  downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r11", title: "Growth Community AI Workflow (Draft).pptx",                                             type: "Document",  owner: "Growth Community", views: 6,  downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r12", title: "Growth-Community-Redesign-Pitch.pptx",                                                  type: "Document",  owner: "Growth Community", views: 39, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r13", title: "Growth Community - Quarterly Showcase - TEMPLATE.pptx",                                 type: "Document",  owner: "Growth Community", views: 14, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r14", title: "Growth Community - 2026 July 28.pptx",                                                  type: "Document",  owner: "Growth Community", views: 11, downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r15", title: "2025-26 Growth Community Call Index.xlsx",                                              type: "Document",  owner: "Growth Community", views: 3,  downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r16", title: "validation_report (copilot).csv",                                                       type: "Document",  owner: "Growth Community", views: 1,  downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r17", title: "cleaned_community_knowledge_base (copilot).csv",                                        type: "Document",  owner: "Growth Community", views: 1,  downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r18", title: "2026 Updated Bob Version.xlsx",                                                         type: "Document",  owner: "Growth Community", views: 1,  downloads: 0, freshness: "Fresh", month: "Jul" },
    { id: "r19", title: "2025 Growth Community Call Index.xlsx",                                                  type: "Document",  owner: "Growth Community", views: 1,  downloads: 0, freshness: "Aging", month: "Jun" },
    { id: "r20", title: "1-7-25 PPM Summary Board Update with Product Master (1.17.25).xlsx",                    type: "Document",  owner: "Growth Community", views: 7,  downloads: 0, freshness: "Stale", month: "Jan" },
  ],
  sharepointTrend: [
    { month: "Jul 8–14",  views: 218, unique: 13 },
    { month: "Jul 15–21", views: 601, unique: 36 },
    { month: "Jul 22–28", views: 601, unique: 33 },
  ],
  icaTopics: [
    { id: "t1", topic: "Membership & access",   queries: 1840, success: 92, trend: "up",   status: "Healthy"    },
    { id: "t2", topic: "Event registration",    queries: 1320, success: 88, trend: "up",   status: "Healthy"    },
    { id: "t3", topic: "SharePoint navigation", queries: 980,  success: 74, trend: "flat", status: "Monitor"    },
    { id: "t4", topic: "Billing & invoices",    queries: 620,  success: 61, trend: "down", status: "Needs work" },
    { id: "t5", topic: "Content submission",    queries: 540,  success: 69, trend: "flat", status: "Monitor"    },
  ],
  icaUsage: [
    { month: "Feb", queries: 3200, success: 2560 },
    { month: "Mar", queries: 3600, success: 2952 },
    { month: "Apr", queries: 4100, success: 3444 },
    { month: "May", queries: 4400, success: 3740 },
    { month: "Jun", queries: 5000, success: 4350 },
    { month: "Jul", queries: 5600, success: 4984 },
  ],
  events: [
    { id: "e1", title: "Community Kickoff 2026", date: "Feb 2026", attendance: 640,  feedback: 4.6 },
    { id: "e2", title: "Data & AI Summit",       date: "Apr 2026", attendance: 880,  feedback: 4.8 },
    { id: "e3", title: "Design Systems Jam",     date: "May 2026", attendance: 520,  feedback: 4.4 },
    { id: "e4", title: "Mid-year Town Hall",     date: "Jun 2026", attendance: 1240, feedback: 4.7 },
    { id: "e5", title: "Builder Awards",         date: "Jul 2026", attendance: 760,  feedback: 4.9 },
  ],
  eventEngagement: [
    { month: "Feb", pre: 62, post: 78 },
    { month: "Apr", pre: 70, post: 88 },
    { month: "May", pre: 58, post: 74 },
    { month: "Jun", pre: 74, post: 92 },
    { month: "Jul", pre: 68, post: 90 },
  ],
  timeline: [
    { id: "tl1", date: "Jan 2026", label: "Reached 4,000 members",               kind: "Milestone" },
    { id: "tl2", date: "Feb 2026", label: "Community Kickoff — 640 attendees",    kind: "Event"     },
    { id: "tl3", date: "Apr 2026", label: "Launched ICA Agent v2",                kind: "Launch"    },
    { id: "tl4", date: "Jun 2026", label: "Crossed 5,900 members",                kind: "Milestone" },
    { id: "tl5", date: "Jul 2026", label: "Builder Awards — record 4.9 feedback", kind: "Event"     },
  ],
  kpis: {
    overview: {
      totalMembers:       { value: "803",      trend: "up",   delta: "+106 since Jun 11" },
      monthlyGrowth:      { value: "+25",      trend: "up",   delta: "+3.2% since Jul 13" },
      activeContributors: { value: "2,210",    trend: "up",   delta: "+11%"  },
      sharepointViews:    { value: "9,620",    trend: "up",   delta: "+8.2%" },
      icaAgentUsage:      { value: "5,600",    trend: "up",   delta: "+12%"  },
      engagementScore:    { value: "72 / 100", trend: "flat", delta: "±0"    },
    },
    slack: {
      newMembers:         { value: "570",   trend: "up",   delta: "+18%" },
      returningMembers:   { value: "460",   trend: "up",   delta: "+12%" },
      inactiveMembers:    { value: "160",   trend: "down", delta: "-6%"  },
      activeContributors: { value: "2,210", trend: "up",   delta: "+11%" },
      engagementRate:     { value: "34%",   trend: "flat", delta: "±0"   },
    },
    sharepoint: {
      pageViews:          { value: "9,620",  trend: "up",   delta: "+8.2%" },
      uniqueViewers:      { value: "3,810",  trend: "up",   delta: "+9.5%" },
      downloads:          { value: "4,250",  trend: "up",   delta: "+6.1%" },
      avgEngagement:      { value: "3m 12s", trend: "flat", delta: "±0"    },
      resourceFreshness:  { value: "68%",    trend: "down", delta: "-4%"   },
      activeResources:    { value: "142",    trend: "up",   delta: "+5"    },
    },
    ica: {
      agentUsage:    { value: "5,600", trend: "up",   delta: "+12%" },
      queries:       { value: "5,600", trend: "up",   delta: "+12%" },
      successRate:   { value: "89%",   trend: "up",   delta: "+3%"  },
      fallbackRate:  { value: "11%",   trend: "down", delta: "-3%"  },
      repeatUsage:   { value: "46%",   trend: "up",   delta: "+5%"  },
      commonTopics:  { value: "12",    trend: "flat", delta: "±0"   },
    },
    events: {
      eventAttendance:     { value: "4,040",   trend: "up", delta: "+14%"   },
      repeatAttendees:     { value: "1,760",   trend: "up", delta: "+9%"    },
      feedbackScore:       { value: "4.7 / 5", trend: "up", delta: "+0.2"   },
      postEventEngagement: { value: "+31%",    trend: "up", delta: "+6%"    },
      topSession:          { value: "4.9 / 5", trend: "up", delta: "Awards" },
    },
  },
  communityHealth: {
    score: "78 / 100",
    status: "Thriving",
    signals: [
      { label: "Participation",  value: 82, status: "Healthy"  },
      { label: "Responsiveness", value: 74, status: "Monitor"  },
      { label: "Retention",      value: 69, status: "Monitor"  },
    ],
  },
  sharepointFreshness: [
    { label: "Fresh", pct: 68, status: "Healthy"    },
    { label: "Aging", pct: 22, status: "Monitor"    },
    { label: "Stale", pct: 10, status: "Needs work" },
  ],
  upcomingEvents: [
    { title: "Autumn Builders Meetup", date: "Sep 2026" },
    { title: "Data & AI Summit v2",    date: "Oct 2026" },
    { title: "Year-end Town Hall",     date: "Dec 2026" },
  ],
  meetingAttendance: {
    meetingTitle: "Growth Community Call (GCC)",
    meetingDate: "Jul 28, 2026",
    meetingDuration: "1h 33m 57s",
    totalAttendees: 47,
    avgAttendanceTime: "31m 38s",
    newMemberCount: 35,
    newMembersAttended: 4,
    newMembersAbsent: 31,
    newMembers: [
      { id: "nm1",  name: "Dipali Darji",          email: "ddarji@us.ibm.com",               joinedSlack: "Jul 10", attended: true,  joinTime: "11:29 AM", engagementActions: 2 },
      { id: "nm2",  name: "Brayden Wisniewski",     email: "brayden@ibm.com",                 joinedSlack: "Jul 10", attended: true,  joinTime: "11:30 AM", engagementActions: 4 },
      { id: "nm3",  name: "Kuber Saraswat",         email: "Kuber@ibm.com",                   joinedSlack: "Jul 10", attended: true,  joinTime: "11:36 AM", engagementActions: 7 },
      { id: "nm4",  name: "Sri Muralidharan",       email: "smuralid@in.ibm.com",             joinedSlack: "Jul 10", attended: true,  joinTime: "11:32 AM", engagementActions: 0 },
      { id: "nm5",  name: "Hi Patel",               email: "hipatel@ibm.com",                 joinedSlack: "Jul 10", attended: false },
      { id: "nm6",  name: "Paolo Bocci",            email: "paolo.bocci@ibm.com",             joinedSlack: "Jul 10", attended: false },
      { id: "nm7",  name: "Marjorie (CA)",          email: "marjorie@ca.ibm.com",             joinedSlack: "Jul 10", attended: false },
      { id: "nm8",  name: "Eric Lam",               email: "Eric.Lam1@ibm.com",               joinedSlack: "Jul 10", attended: false },
      { id: "nm9",  name: "Abhilasha Prdnt",        email: "Abhilasha.Prdnt1@ibm.com",        joinedSlack: "Jul 10", attended: false },
      { id: "nm10", name: "Murugesan Karunakaran",  email: "murugesan.karunakaran@in.ibm.com",joinedSlack: "Jul 10", attended: false },
      { id: "nm11", name: "Shalini Bade",           email: "Shalini.Bade@ibm.com",            joinedSlack: "Jul 10", attended: false },
      { id: "nm12", name: "Kelton",                 email: "kelton@ibm.com",                  joinedSlack: "Jul 10", attended: false },
      { id: "nm13", name: "Alista",                 email: "alista@ibm.com",                  joinedSlack: "Jul 10", attended: false },
      { id: "nm14", name: "Joshua Kim",             email: "Joshua.Kim3@ibm.com",             joinedSlack: "Jul 10", attended: false },
      { id: "nm15", name: "Shobhit Gupta",          email: "Shobhit.Gupta10@ibm.com",         joinedSlack: "Jul 10", attended: false },
      { id: "nm16", name: "Jenna Jae Lee",          email: "jennajaelee@ibm.com",             joinedSlack: "Jul 13", attended: false },
      { id: "nm17", name: "Nandini V",              email: "nandiniv@ibm.com",                joinedSlack: "Jul 13", attended: false },
      { id: "nm18", name: "Kasey Hogan",            email: "Kasey.L.Hog@ibm.com",             joinedSlack: "Jul 13", attended: false },
      { id: "nm19", name: "Andreina Dyer",          email: "andreina.dyer@ibm.com",           joinedSlack: "Jul 13", attended: false },
      { id: "nm20", name: "Sampath Dechu",          email: "sampath.dechu@ibm.com",           joinedSlack: "Jul 27", attended: false },
      { id: "nm21", name: "Ketan Deshmukh",         email: "Ketan.Deshmukh@ibm.com",          joinedSlack: "Jul 27", attended: false },
      { id: "nm22", name: "Thomas Yang",            email: "thomas.yang@ibm.com",             joinedSlack: "Jul 27", attended: false },
      { id: "nm23", name: "Ramona Sartip",          email: "ramona.sartip@ibm.com",           joinedSlack: "Jul 27", attended: false },
      { id: "nm24", name: "JT Thomas",              email: "JT.Thomas@ibm.com",               joinedSlack: "Jul 27", attended: false },
      { id: "nm25", name: "Nate Myer",              email: "natemyer@ibm.com",                joinedSlack: "Jul 27", attended: false },
      { id: "nm26", name: "Manish Siddamsetty",     email: "Manish.Siddamsetty@ibm.com",      joinedSlack: "Jul 27", attended: false },
      { id: "nm27", name: "Ajay AI",                email: "Ajay.AI@ibm.com",                 joinedSlack: "Jul 27", attended: false },
      { id: "nm28", name: "Brian Cop",              email: "briancop@uk.ibm.com",             joinedSlack: "Jul 27", attended: false },
      { id: "nm29", name: "J Cal",                  email: "jcal@ibm.com",                    joinedSlack: "Jul 27", attended: false },
      { id: "nm30", name: "Avi Karunakaran",        email: "aviakaruman@ibm.com",             joinedSlack: "Jul 27", attended: false },
      { id: "nm31", name: "Gauri Dasgupta",         email: "gauri.dasgupta1@ibm.com",         joinedSlack: "Jul 27", attended: false },
      { id: "nm32", name: "Melita Saville",         email: "melita_saville@ibm.com",          joinedSlack: "Jul 27", attended: false },
      { id: "nm33", name: "Sadhana Rao",            email: "Sadhana.Rao1@ibm.com",            joinedSlack: "Jul 27", attended: false },
      { id: "nm34", name: "Joyce Huang",            email: "Joyce.Huang2@ibm.com",            joinedSlack: "Jul 28", attended: false },
      { id: "nm35", name: "Nicole Ruedge",          email: "nicole.ruedge@ibm.com",           joinedSlack: "Jul 28", attended: false },
    ],
  },
};

// ─── useAnalytics hook ───────────────────────────────────────────────────────
// Fetches /analytics.json on mount; falls back to FALLBACK while loading
// or if the network request fails.

export type AnalyticsStatus = "loading" | "ready" | "error";

export function useAnalytics(): { data: AnalyticsData; status: AnalyticsStatus; lastUpdated: string } {
  const [data, setData] = useState<AnalyticsData>(FALLBACK);
  const [status, setStatus] = useState<AnalyticsStatus>("loading");

  useEffect(() => {
    // Cache-bust with today's date so the browser always fetches the latest file.
    // Use import.meta.env.BASE_URL so it works under any base path (GitHub Pages subpath, IBM Pages, etc.)
    const today = new Date().toISOString().slice(0, 10);
    fetch(`${import.meta.env.BASE_URL}analytics.json?v=${today}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<AnalyticsData>;
      })
      .then((json) => {
        setData(json);
        setStatus("ready");
      })
      .catch(() => {
        // Keep FALLBACK data; surface error state so the header can show it.
        setStatus("error");
      });
  }, []);

  return { data, status, lastUpdated: data._meta?.lastUpdated ?? "—" };
}

// ─── Static filter option labels (never change at runtime) ───────────────────

export const filterOptions = {
  region:    ["All regions", "AMER", "EMEA", "APAC"],
  segment:   ["All segments", "Product Builders", "Data & AI Guild", "Design Circle", "Ops Network"],
  channel:   ["All channels", "Slack", "SharePoint", "ICA Agent", "Events"],
  content:   ["All content", "Guide", "Report", "Template", "Discussion"],
  dateRange: ["Last 7 days", "Last 30 days", "Last 90 days", "Year to date"],
};

// ─── Legacy named exports (kept for backward compatibility with any imports) ──

export const {
  growthTrend,
  slackGrowth,
  cohorts,
  segments,
  sharepointResources,
  sharepointTrend,
  icaTopics,
  icaUsage,
  events,
  eventEngagement,
  timeline,
} = FALLBACK;
