/**
 * Compute which report types are still missing for a given goalkeeper
 * within a rolling window (default: 30 days before the reference date).
 *
 * The five tracked report types are:
 *   - Match Report                (from match_reports)
 *   - Live Match Observation      (from mentor_interactions)
 *   - Training Ground Visit       (from mentor_interactions)
 *   - Coffee Catch Up             (from mentor_interactions)
 *   - Phone Call                  (from mentor_interactions)
 *
 * The calendar currently reads mock/session-scoped data, so this helper
 * reads from the client-side session store to stay consistent.
 */

import {
  ALLOWED_INTERACTION_TYPES,
  getSessionInteractions,
  getSessionReports,
} from "@/lib/mentor-session-store";

export type TrackedReportType =
  | "Match Report"
  | (typeof ALLOWED_INTERACTION_TYPES)[number];

export const TRACKED_REPORT_TYPES: TrackedReportType[] = [
  "Match Report",
  ...ALLOWED_INTERACTION_TYPES,
];

const SHORT_LABEL: Record<TrackedReportType, string> = {
  "Match Report": "MR",
  "Live Match Observation": "LMO",
  "Training Ground Visit": "TGV",
  "Coffee Catch Up": "CCU",
  "Phone Call": "PC",
};

export function shortLabel(t: TrackedReportType): string {
  return SHORT_LABEL[t];
}

export interface MissingWindow {
  /** Reference date the window ends at (inclusive). Defaults to now. */
  referenceDate?: Date;
  /** Window length in days. Defaults to 30. */
  windowDays?: number;
}

/**
 * Returns the list of report types that have NOT been logged for the
 * given goalkeeper within the window.
 *
 * Matches by player_id first; falls back to case-insensitive player
 * name where the mock goalkeeper id doesn't align with stored rows.
 */
export function computeMissingReportTypes(
  gkId: string,
  gkName: string | undefined,
  { referenceDate = new Date(), windowDays = 30 }: MissingWindow = {},
): TrackedReportType[] {
  const end = referenceDate.getTime();
  const start = end - windowDays * 86_400_000;

  const nameKey = (gkName ?? "").trim().toLowerCase();
  const matchesGk = (rowPlayerId: string): boolean => {
    if (!gkId && !nameKey) return false;
    if (gkId && rowPlayerId === gkId) return true;
    // Session rows may store the name in player_id for mock/local inserts.
    if (nameKey && rowPlayerId.trim().toLowerCase() === nameKey) return true;
    return false;
  };

  const withinWindow = (iso: string): boolean => {
    const t = new Date(iso).getTime();
    return Number.isFinite(t) && t >= start && t <= end;
  };

  const seen = new Set<TrackedReportType>();

  for (const r of getSessionReports()) {
    if (!matchesGk(r.player_id)) continue;
    if (!withinWindow(r.occurred_at)) continue;
    seen.add("Match Report");
  }

  for (const i of getSessionInteractions()) {
    if (!matchesGk(i.player_id)) continue;
    if (!withinWindow(i.occurred_at)) continue;
    const t = i.interaction_type as TrackedReportType;
    if (TRACKED_REPORT_TYPES.includes(t)) seen.add(t);
  }

  return TRACKED_REPORT_TYPES.filter((t) => !seen.has(t));
}
