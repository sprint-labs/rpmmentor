// GKHQ by RPM — illustrative preview dataset (Mock).
// Seeded from the February 2026 client list for interface work only.
// Not real operational records; every consumer surface is labelled Mock via
// src/lib/data-classification.tsx.

export type Status = "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4" | "Academy" | "Free Agent";
// Legacy alias — many components still import Tier.
export type Tier = Status;

export type Region = "UK Based" | "Overseas" | "Free Agent";

// RPM roster is grouped into four tiers. Detailed rules are managed
// separately; the placeholder mapping in deriveTierLevel() is league-based.
export type TierLevel = 1 | 2 | 3 | 4;

export interface TierDefinition {
  level: TierLevel;
  label: string;
  summary: string;
  leagues: readonly string[];
}

export const TIER_DEFINITIONS: TierDefinition[] = [
  {
    level: 1,
    label: "Elite senior",
    summary: "First-team regulars at the highest domestic level (Premier League).",
    leagues: ["Premier League"],
  },
  {
    level: 2,
    label: "High-level pro",
    summary: "Established professionals in top second tiers and major overseas leagues.",
    leagues: ["EFL Championship", "Serie A", "MLS"],
  },
  {
    level: 3,
    label: "Pro / developing",
    summary: "League One and comparable overseas first divisions.",
    leagues: ["EFL League One", "SPFL Premiership", "Danish Superliga", "Allsvenskan", "UAE Pro League", "Australian A League"],
  },
  {
    level: 4,
    label: "Emerging / lower tier",
    summary: "League Two, National Premier and other developing leagues.",
    leagues: ["EFL League Two", "Australian Nat Prem", "League of Ireland"],
  },
];

export type InteractionType =
  | "Live Match Observation"
  | "Training Ground Visit"
  | "Coffee Catch Up"
  | "Phone Call";


export type ReportType =
  | "Goalkeeper Development"
  | "Match Report"
  | "Training Report"
  | "Opposition GK"
  | "Recruitment";

export type StaffRole =
  | "Director"
  | "Managing Director & Mentor"
  | "Goalkeeper Mentor"
  | "Goalkeeper Intelligence Scout"
  | "Video Analyst"
  | "Recruitment Analyst"
  | "Operations Manager";

export interface Mentor {
  id: string;
  name: string;
  initials: string;
  region: string;
  role: StaffRole;
  email: string;
  phone?: string;
  assignedGks: string[];
  targetInteractions: number;
  completedThisMonth: number;
  yearsExperience: number;
}

export interface Goalkeeper {
  id: string;
  name: string;
  initials: string;
  status: Status;
  tier: Status; // alias for back-compat
  tierLevel: TierLevel;
  region: Region;
  mentorId: string;
  club: string;
  league: string;
  age: number;
  dob: string;
  nationality: string;
  contractUntil: string;
  height: string;
  foot: "Right" | "Left";
  lastInteraction: string;
  nextInteraction: string;
  rating: number;
  potential: number;
  recommendation: "Sign" | "Monitor" | "Pass" | "Loan" | "Develop" | "Retain";
  videoLinks: string[];
  developmentPlan?: string[];
  bio?: string;
}

export interface Interaction {
  id: string;
  gkId: string;
  mentorId: string;
  type: InteractionType;
  date: string;
  notes: string;
  outcome: string;
  followUp: string;
}

export interface Report {
  id: string;
  type: ReportType;
  gkId: string;
  authorId: string;
  date: string;
  rating: number;
  summary: string;
  scores: { handling: number; distribution: number; aerial: number; oneVone: number; communication: number };
}

export interface MediaItem {
  id: string; gkId: string; kind: "video" | "pdf" | "image" | "audio";
  title: string; uploadedBy: string; date: string; size: string;
}

export interface CalendarEvent {
  id: string; date: string; title: string;
  type: "Match" | "Observation" | "Mentor Visit" | "Meeting" | "Follow Up";
  gkId?: string; mentorId?: string;
}

// ---------- deterministic RNG ----------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(1907);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (a: number, b: number) => Math.floor(rand() * (b - a + 1)) + a;
const initialsOf = (n: string) => n.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
const daysFromNow = (d: number) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString(); };

// ---------- RPM Personnel ----------
// Current RPM mentor team + directors. Mentors work collaboratively across
// the entire client roster — there is no per-goalkeeper assignment.
export const mentors: Mentor[] = [
  // Leadership
  { id: "m-rich-lee", name: "Rich Lee", initials: "RL", region: "UK & Ireland", role: "Director", email: "rlee@gkhq.app", phone: "+44 7971 776776", assignedGks: [], targetInteractions: 6, completedThisMonth: 5, yearsExperience: 24 },

  // Mentor team (David Rouse also manages the mentor team)
  { id: "m-david-rouse", name: "David Rouse", initials: "DR", region: "UK & Ireland", role: "Managing Director & Mentor", email: "drouse@gkhq.app", assignedGks: [], targetInteractions: 12, completedThisMonth: 10, yearsExperience: 22 },
  { id: "m-dave-watson", name: "Dave Watson", initials: "DW", region: "North West", role: "Goalkeeper Mentor", email: "dwatson@gkhq.app", assignedGks: [], targetInteractions: 14, completedThisMonth: 11, yearsExperience: 30 },
  { id: "m-andy-marshall", name: "Andy Marshall", initials: "AM", region: "East", role: "Goalkeeper Mentor", email: "amarshall@gkhq.app", assignedGks: [], targetInteractions: 14, completedThisMonth: 12, yearsExperience: 25 },
  { id: "m-jack-stern", name: "Jack Stern", initials: "JS", region: "London & South", role: "Goalkeeper Mentor", email: "jstern@gkhq.app", assignedGks: [], targetInteractions: 12, completedThisMonth: 9, yearsExperience: 12 },
  { id: "m-alec-chamberlain", name: "Alec Chamberlain", initials: "AC", region: "Midlands", role: "Goalkeeper Mentor", email: "achamberlain@gkhq.app", assignedGks: [], targetInteractions: 12, completedThisMonth: 10, yearsExperience: 28 },
  { id: "m-martyn-margetson", name: "Martyn Margetson", initials: "MM", region: "Wales & South West", role: "Goalkeeper Mentor", email: "mmargetson@gkhq.app", assignedGks: [], targetInteractions: 12, completedThisMonth: 8, yearsExperience: 24 },
  { id: "m-martijn-middelbeek", name: "Martijn Middelbeek", initials: "MM", region: "Europe", role: "Goalkeeper Mentor", email: "mmiddelbeek@gkhq.app", assignedGks: [], targetInteractions: 10, completedThisMonth: 8, yearsExperience: 18 },
  { id: "m-matt-beadle", name: "Matt Beadle", initials: "MB", region: "South Coast", role: "Goalkeeper Mentor", email: "mbeadle@gkhq.app", assignedGks: [], targetInteractions: 12, completedThisMonth: 9, yearsExperience: 15 },
];

// Rotation pool used only to seed each goalkeeper's most-recent-contact mentor.
// Mentors are NOT assigned to specific goalkeepers — the whole team works the roster.
const ASSIGN_POOL = ["m-dave-watson", "m-andy-marshall", "m-jack-stern", "m-alec-chamberlain", "m-martyn-margetson", "m-martijn-middelbeek", "m-matt-beadle", "m-david-rouse"];

// ---------- Goalkeepers (illustrative preview only) ----------
// Reduced to two clearly-identifiable demo profiles — the wider roster is
// intentionally empty until it is sourced from the live Match Reports store.
type Seed = { name: string; dob: string; age: number; club: string; league: string; contract: string };
const SEED: Seed[] = [
  { name: "James Beadle", dob: "16/07/2004", age: 21, club: "Brighton & Hove Albion", league: "Premier League", contract: "June 2028" },
  { name: "Corey Addai", dob: "11/02/2000", age: 26, club: "Cambridge United", league: "EFL League Two", contract: "June 2027" },
];


const OVERSEAS_LEAGUES = new Set(["Serie A", "MLS", "Danish Superliga", "Allsvenskan", "UAE Pro League", "Australian A League", "Australian Nat Prem"]);

function deriveStatus(s: Seed): Status {
  if (s.league === "Free Agent") return "Free Agent";
  // Academy: goalkeepers currently playing at U15/U16/U17/U18 level.
  // Proxy in mock data: age <= 18 (no U-league seeds present).
  if (s.age <= 18) return "Academy";
  return `Tier ${deriveTierLevel(s)}` as Status;
}
function deriveRegion(s: Seed): Region {
  if (s.league === "Free Agent") return "Free Agent";
  return OVERSEAS_LEAGUES.has(s.league) ? "Overseas" : "UK Based";
}
function deriveTierLevel(s: Seed): TierLevel {
  if (s.league === "Premier League") return 1;
  if (s.league === "EFL Championship" || s.league === "Serie A" || s.league === "MLS") return 2;
  if (s.league === "EFL League One" || s.league === "SPFL Premiership" || s.league === "Danish Superliga" || s.league === "Allsvenskan" || s.league === "UAE Pro League" || s.league === "Australian A League") return 3;
  return 4;
}
function contractISO(c: string): string {
  if (c === "—") return "—";
  // "June 2028" / "December 2026" / "January 2026"
  const [mon, yr] = c.split(" ");
  const monthIdx: Record<string, string> = { January: "01", February: "02", March: "03", April: "04", May: "05", June: "06", July: "07", August: "08", September: "09", October: "10", November: "11", December: "12" };
  return `${yr}-${monthIdx[mon] ?? "06"}-30`;
}
function dobToISO(d: string): string {
  // dd/mm/yyyy
  const [dd, mm, yyyy] = d.split("/");
  return `${yyyy}-${mm}-${dd}`;
}
function inferNationality(s: Seed): string {
  if (s.club === "Como 1907") return "Sweden";
  if (s.club.includes("Göteborg")) return "Sweden";
  if (s.club === "Aarhus") return "Norway";
  if (s.club === "Al Nasr SC") return "UAE";
  if (s.club === "Brisbane Roar" || s.club === "Sydney FC" || s.club === "Oakleigh Cannons") return "Australia";
  if (s.club === "Houston Dynamo") return "England";
  if (s.league === "League of Ireland") return "Ireland";
  if (s.club === "Glentoran") return "Northern Ireland";
  if (s.league === "SPFL Premiership") return "Scotland";
  return "England";
}

// Custom rating bumps for hero profiles
const RATING_OVERRIDE: Record<string, { rating: number; potential: number; recommendation: Goalkeeper["recommendation"] }> = {
  "James Beadle": { rating: 84, potential: 93, recommendation: "Retain" },
  "Corey Addai": { rating: 79, potential: 88, recommendation: "Develop" },
};

export const goalkeepers: Goalkeeper[] = SEED.map((s, i) => {
  const status = deriveStatus(s);
  const region = deriveRegion(s);
  const mentorId = status === "Free Agent" ? "m-david-rouse" : ASSIGN_POOL[i % ASSIGN_POOL.length];
  const o = RATING_OVERRIDE[s.name];
  const baseRating = status === "Tier 1" ? between(78, 90) : status === "Tier 2" ? between(70, 84) : status === "Tier 3" ? between(64, 78) : status === "Academy" ? between(58, 72) : between(60, 75);
  const gk: Goalkeeper = {
    id: `gk-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: s.name,
    initials: initialsOf(s.name),
    status, tier: status,
    tierLevel: deriveTierLevel(s),
    region,
    mentorId,
    club: s.club, league: s.league,
    age: s.age, dob: dobToISO(s.dob),
    nationality: inferNationality(s),
    contractUntil: contractISO(s.contract),
    height: `${between(186, 200)}cm`,
    foot: rand() > 0.25 ? "Right" : "Left",
    lastInteraction: daysFromNow(-between(1, status === "Tier 1" ? 14 : 40)),
    nextInteraction: daysFromNow(between(-2, 28)),
    rating: o?.rating ?? baseRating,
    potential: o?.potential ?? Math.min(99, baseRating + between(4, 14)),
    recommendation: o?.recommendation ?? pick(["Sign", "Monitor", "Develop", "Retain", "Loan"] as const),
    videoLinks: [`https://video.rpmgk.com/${s.name.split(" ")[0].toLowerCase()}/highlights`],
  };
  return gk;
});

// Populate mentor.assignedGks
goalkeepers.forEach((gk) => {
  const m = mentors.find((x) => x.id === gk.mentorId);
  if (m) m.assignedGks.push(gk.id);
});

// ---------- Hero profile enrichment ----------
const beadle = goalkeepers.find((g) => g.name === "James Beadle")!;
beadle.bio = "Brighton & Hove Albion academy graduate, England U21 international. Loan spells have accelerated first-team readiness; RPM tracking pathway toward sustained Premier League minutes.";
beadle.developmentPlan = [
  "Increase distribution accuracy under high press (target 86%+).",
  "Quarterly tactical session on back-line organisation with Mark Halsey.",
  "Continue strength block (lower-limb power) through international break.",
  "Review opposition striker tendencies pre-match in dedicated video clinic.",
];
beadle.videoLinks.push("https://video.rpmgk.com/beadle/saves-2025-26", "https://video.rpmgk.com/beadle/distribution-block");

const corey = goalkeepers.find((g) => g.name === "Corey Addai")!;
corey.bio = "Experienced League Two number one. RPM development focus on shot-stopping consistency and progressing back into a Championship environment.";
corey.developmentPlan = [
  "Sustain set-piece dominance — review weekly with Chris Day.",
  "Add ball-playing range to attract higher-tier recruitment interest.",
  "Maintain availability — load monitoring with club S&C.",
  "Build profile pack with recruitment analyst for January window.",
];

// ---------- Interactions ----------
const NOTES = [
  "Strong vertical reach, commanded the box well on crosses.",
  "Distribution under pressure remains an area to refine.",
  "Excellent positional awareness in 1v1 situations.",
  "Composure visible from minute one — vocal organiser.",
  "Footwork drills paying off; smoother lateral shifts.",
  "Late dive on the second goal — discussed timing on follow-through.",
  "Mentality conversation: handling pressure after the early concession.",
  "Reviewed clips together; agreed on three focus points for next block.",
];
const OUTCOMES = ["On track", "Above expectation", "Below expectation", "Needs follow-up", "Action plan agreed"];
const FOLLOWUPS = ["Schedule video review", "Send technical drill pack", "Set up call with coach", "Plan club visit", "No action required"];
const ITYPES: InteractionType[] = ["Live Match Observation", "Training Ground Visit", "Coffee Catch Up", "Phone Call"];

// One illustrative interaction per demo goalkeeper. Real interactions
// arrive through the interactions store; do not seed more here.
export const interactions: Interaction[] = goalkeepers.map((gk, i) => ({
  id: `int-${gk.id}-demo`,
  gkId: gk.id,
  mentorId: gk.mentorId,
  type: ITYPES[i % ITYPES.length],
  date: daysFromNow(-14 - i * 7),
  notes: NOTES[i % NOTES.length],
  outcome: OUTCOMES[i % OUTCOMES.length],
  followUp: FOLLOWUPS[i % FOLLOWUPS.length],
}));

// ---------- Reports ----------
const REPORT_TYPES: ReportType[] = ["Goalkeeper Development", "Match Report", "Training Report", "Opposition GK", "Recruitment"];
// One illustrative report per demo goalkeeper. Real reports come from the
// Match Reports store; empty states are shown when none exist.
export const reports: Report[] = goalkeepers.map((gk, i) => ({
  id: `r-demo-${gk.id}`,
  type: REPORT_TYPES[i % REPORT_TYPES.length],
  gkId: gk.id,
  authorId: gk.mentorId,
  date: daysFromNow(-10 - i * 5),
  rating: 82 - i * 3,
  summary: gk.bio?.split(".")[0] ?? NOTES[i % NOTES.length],
  scores: { handling: 8, distribution: 8, aerial: 8, oneVone: 8, communication: 9 },
}));

// ---------- Media ----------
// One illustrative media item per demo goalkeeper.
export const media: MediaItem[] = goalkeepers.map((gk, i) => ({
  id: `med-${gk.id}-demo`,
  gkId: gk.id,
  kind: (i === 0 ? "video" : "pdf") as MediaItem["kind"],
  title: i === 0 ? "Match highlights (demo)" : "Scout pack (demo)",
  uploadedBy: mentors.find((m) => m.id === gk.mentorId)?.name ?? "RPM",
  date: daysFromNow(-5 - i * 4),
  size: `${12 + i * 30}MB`,
}));

// ---------- Calendar ----------
// Two illustrative events — one upcoming, one recent. Real events sync
// externally; the calendar renders an empty state until then.
export const calendarEvents: CalendarEvent[] = goalkeepers.slice(0, 2).map((gk, i) => ({
  id: `cal-demo-${i + 1}`,
  date: daysFromNow(i === 0 ? 3 : -2),
  title: i === 0 ? `Observation: ${gk.name}` : `Mentor visit — ${gk.club}`,
  type: i === 0 ? "Observation" : "Mentor Visit",
  gkId: gk.id,
  mentorId: gk.mentorId,
}));

// ---------- Alerts ----------
export interface Alert {
  id: string;
  severity: "high" | "medium" | "low";
  kind: "Overdue observation" | "Overdue contact" | "Missing report" | "Upcoming match" | "Expiring action";
  message: string;
  gkId?: string;
  date: string;
}
// Alerts are surfaced from live operational data. No mock alerts are seeded
// here — the Alerts page shows an empty state when nothing is outstanding.
export const alerts: Alert[] = [];

// ---------- Activity feed ----------
// Activity is driven by real events (report submissions, media uploads,
// role changes). No mock entries are seeded here.
export const activity: {
  id: string;
  actor: string;
  actorInitials: string;
  action: string;
  target: string;
  gkId: string;
  date: string;
}[] = [];



// ---------- helpers ----------
export const getMentor = (id: string) => mentors.find((m) => m.id === id);
export const getGk = (id: string) => goalkeepers.find((g) => g.id === id);

export function formatDate(iso: string) {
  if (!iso || iso === "—") return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
export function formatRelative(iso: string) {
  if (!iso || iso === "—") return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 0) {
    const ahead = Math.abs(Math.floor(diff));
    return ahead === 0 ? "Today" : `in ${ahead}d`;
  }
  const d = Math.floor(diff);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

// ---------- Duty-of-care status ----------
// Determined by the goalkeeper's confirmed tier and qualifying live interactions:
//   Tier 1 → 2 live contacts / month     (~15 day cadence)
//   Tier 2 → 1 live contact  / month     (~30 day cadence)
//   Tier 3 → 3-6 per season              (~60 day cadence)
//   Tier 4 → no formal duty of care
// Qualifying live interactions: Live Match Observation, Training Ground Visit, Coffee Catch Up.
// Phone Calls do not count toward duty of care.
export type DutyLevel =
  | "up_to_date"
  | "due_soon"
  | "overdue"
  | "not_required"
  | "not_enough_data";

export const DUTY_LABELS: Record<DutyLevel, string> = {
  up_to_date: "Up to date",
  due_soon: "Due soon",
  overdue: "Overdue",
  not_required: "Not required",
  not_enough_data: "Not enough data",
};

export interface DutyStatus { level: DutyLevel; label: string; days: number; }

const DUTY_QUALIFYING_TYPES: InteractionType[] = [
  "Live Match Observation",
  "Training Ground Visit",
  "Coffee Catch Up",
];

const DUTY_TIER_INTERVAL_DAYS: Partial<Record<Status, number>> = {
  "Tier 1": 15,
  "Tier 2": 30,
  "Tier 3": 60,
};

function dutyResult(level: DutyLevel, days: number): DutyStatus {
  return { level, label: DUTY_LABELS[level], days };
}

export function dutyStatusForGk(gk: Goalkeeper): DutyStatus {
  if (gk.status === "Tier 4") return dutyResult("not_required", 0);
  const interval = DUTY_TIER_INTERVAL_DAYS[gk.status];
  if (!interval) return dutyResult("not_enough_data", 0);
  const qualifying = interactions
    .filter((i) => i.gkId === gk.id && DUTY_QUALIFYING_TYPES.includes(i.type))
    .map((i) => new Date(i.date).getTime())
    .filter((t) => Number.isFinite(t));
  if (!qualifying.length) return dutyResult("not_enough_data", 0);
  const latest = Math.max(...qualifying);
  const days = Math.max(0, Math.floor((Date.now() - latest) / 86400000));
  if (days > interval) return dutyResult("overdue", days);
  if (days > Math.floor(interval * 0.75)) return dutyResult("due_soon", days);
  return dutyResult("up_to_date", days);
}

export function dutyStatusForMentor(mentorId: string): DutyStatus {
  const gks = goalkeepers.filter((g) => g.mentorId === mentorId);
  if (!gks.length) return dutyResult("not_enough_data", 0);
  const levels = gks.map((g) => dutyStatusForGk(g).level);
  if (levels.includes("overdue")) return dutyResult("overdue", 0);
  if (levels.includes("due_soon")) return dutyResult("due_soon", 0);
  if (levels.some((l) => l === "up_to_date")) return dutyResult("up_to_date", 0);
  if (levels.every((l) => l === "not_required")) return dutyResult("not_required", 0);
  return dutyResult("not_enough_data", 0);
}

export const dutyOverview = (() => {
  const counts: Record<DutyLevel, number> = {
    up_to_date: 0, due_soon: 0, overdue: 0, not_required: 0, not_enough_data: 0,
  };
  goalkeepers.forEach((g) => { counts[dutyStatusForGk(g).level]++; });
  return { ...counts, total: goalkeepers.length };
})();

const STATUSES: Status[] = ["Tier 1", "Tier 2", "Tier 3", "Tier 4", "Academy", "Free Agent"];

export const stats = {
  totalGks: goalkeepers.length,
  upcomingInteractions: goalkeepers.filter((g) => new Date(g.nextInteraction).getTime() >= Date.now() && (new Date(g.nextInteraction).getTime() - Date.now()) / 86400000 < 14).length,
  overdueInteractions: alerts.filter((a) => a.kind === "Overdue observation" || a.kind === "Overdue contact").length,
  reportsThisWeek: reports.filter((r) => (Date.now() - new Date(r.date).getTime()) / 86400000 < 7).length,
  activeMentors: mentors.filter((m) => m.role === "Goalkeeper Mentor" || m.role === "Goalkeeper Intelligence Scout" || m.role === "Managing Director & Mentor").length,
  // Back-compat: tierDistribution now reports the Status distribution
  tierDistribution: STATUSES.map((t) => ({ tier: t, count: goalkeepers.filter((g) => g.status === t).length })),
  statusDistribution: STATUSES.map((t) => ({ status: t, count: goalkeepers.filter((g) => g.status === t).length })),
  regionDistribution: (["UK Based", "Overseas", "Free Agent"] as Region[]).map((r) => ({ region: r, count: goalkeepers.filter((g) => g.region === r).length })),
};
