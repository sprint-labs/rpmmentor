import { describe, expect, it } from "vitest";
import type { MatchReportRow } from "./schema";
import { normaliseReportDate, sortMatchReportsByDate } from "./date";

function report(report_id: string, match_date: string | null): MatchReportRow {
  return {
    report_id,
    row_index: null,
    goalkeeper: "Test Goalkeeper",
    coach: "Coach",
    team: null,
    opponent: null,
    competition: null,
    match_date,
    scores: {
      protect_goal: null,
      protect_space: null,
      protect_air: null,
      control_play: null,
      change_play: null,
      psych: null,
      physical: null,
    },
    average: null,
    comments: "",
  };
}

describe("Match Report dates", () => {
  it("normalises valid ISO and day/month/year dates", () => {
    expect(normaliseReportDate("2026-07-22")).toBe("2026-07-22");
    expect(normaliseReportDate("22/07/2026")).toBe("2026-07-22");
    expect(normaliseReportDate("7/2/2026")).toBe("2026-02-07");
  });

  it("rejects malformed and impossible dates", () => {
    for (const value of [
      "2026-13-40",
      "31/02/2026",
      "2026-02-30",
      "2026-2-01",
      "2026-02-01T00:00:00Z",
      "2026/02/01",
    ]) {
      expect(normaliseReportDate(value)).toBeNull();
    }
  });

  it("sorts valid dates newest first and stable-invalid dates last", () => {
    const sorted = sortMatchReportsByDate([
      report("old", "2026-01-01"),
      report("invalid-a", "31/02/2026"),
      report("missing", null),
      report("new", "02/07/2026"),
      report("invalid-b", "2026-13-40"),
    ]);

    expect(sorted.map((r) => r.report_id)).toEqual([
      "new",
      "old",
      "invalid-a",
      "missing",
      "invalid-b",
    ]);
    expect(sorted.slice(2).every((r) => r.match_date === null)).toBe(true);
  });
});
