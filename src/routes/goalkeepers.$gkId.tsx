import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, TierBadge, Avatar, Pill, SectionTitle, ProgressBar } from "@/components/primitives";
import { goalkeepers, interactions, media, formatDate, formatRelative } from "@/lib/mock-data";
import { ArrowLeft, Info, Video, FileText, Phone, Eye, Users as UsersIcon } from "lucide-react";
import { listMatchReports } from "@/lib/match-reports/reports.functions";
import { PILLAR_IDS, PILLAR_LABELS, type MatchReportRow, type PillarId } from "@/lib/match-reports/schema";

/** Inclusive 1–5 finite numeric guard for report scores/averages. */
function isValidScore(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= 1 && v <= 5;
}

export const Route = createFileRoute("/goalkeepers/$gkId")({
  loader: ({ params }) => {
    const gk = goalkeepers.find((g) => g.id === params.gkId);
    if (!gk) throw notFound();
    return { gk };
  },
  component: GkDetail,
  notFoundComponent: () => <div className="p-8 text-sm text-muted-foreground">Goalkeeper not found.</div>,
  errorComponent: ({ error }) => <div className="p-8 text-sm text-destructive">{error.message}</div>,
});

const TYPE_ICON: Record<string, typeof Video> = {
  "Live Match Observation": Eye, "Training Ground Visit": UsersIcon,
  "Coffee Catch Up": UsersIcon, "Phone Call": Phone,
};

function normaliseName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function GkDetail() {
  const { gk } = Route.useLoaderData();
  const gkInteractions = interactions.filter((i) => i.gkId === gk.id).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const gkMedia = media.filter((m) => m.gkId === gk.id);

  const listFn = useServerFn(listMatchReports);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["match-reports", "all"],
    queryFn: () => listFn(),
    staleTime: 60_000,
  });

  const gkReports = useMemo<MatchReportRow[]>(() => {
    const target = normaliseName(gk.name);
    const all = data?.reports ?? [];
    return all
      .filter((r) => normaliseName(r.goalkeeper) === target)
      .sort((a, b) => {
        if (!a.match_date && !b.match_date) return 0;
        if (!a.match_date) return 1;
        if (!b.match_date) return -1;
        return a.match_date < b.match_date ? 1 : a.match_date > b.match_date ? -1 : 0;
      });
  }, [data, gk.name]);

  const averageRating = useMemo(() => {
    const vals = gkReports.map((r) => r.average).filter(isValidScore);
    if (!vals.length) return null;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    return Math.round(mean * 10) / 10;
  }, [gkReports]);

  const pillarAverages = useMemo(() => {
    const last5 = gkReports.slice(0, 5);
    const out: Record<PillarId, number | null> = {
      protect_goal: null, protect_space: null, protect_air: null,
      control_play: null, change_play: null, psych: null, physical: null,
    };
    for (const id of PILLAR_IDS) {
      const vals = last5
        .map((r) => r.scores[id])
        .filter(isValidScore);
      out[id] = vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    }
    return out;
  }, [gkReports]);

  return (
    <div className="space-y-5">
      <Link to="/goalkeepers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Goalkeepers</Link>

      <div className="flex flex-wrap items-start gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Avatar initials={gk.initials} size={56} />
          <div>
            <div className="flex items-center gap-2.5"><h1 className="text-2xl font-semibold tracking-tight">{gk.name}</h1><TierBadge tier={gk.tier} /></div>
            <div className="text-sm text-muted-foreground mt-1">{gk.club} · {gk.league} · {gk.nationality} · {gk.age} yrs · {gk.height} · {gk.foot} foot</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium">Log Interaction</button>
          <button className="h-9 px-3 rounded-md border border-border text-sm">Submit Report</button>
        </div>
      </div>

      <div
        role="note"
        className="flex items-start gap-2.5 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-[12px] leading-snug text-muted-foreground"
      >
        <Info className="size-4 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold text-[12px] leading-snug text-foreground">Data sources on this profile</div>
          <div className="opacity-90 mt-0.5">
            Rating, Match Reports and Skill Scores are live data from the GKHQ Match Reports source. The remaining profile fields (bio, club/league/age, contract, interaction history and media library) are preview data and not real operational records.
          </div>
        </div>
      </div>

      {gk.bio && (
        <Card className="p-4">
          <SectionTitle>Profile</SectionTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">{gk.bio}</p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
        <Card className="p-3">
          <div className="text-[10px] uppercase text-muted-foreground">Rating (avg of Match Reports)</div>
          <div className="text-xl font-semibold tabular-nums font-mono mt-1">
            {isLoading ? <span className="text-muted-foreground text-sm font-sans font-normal">Loading…</span>
              : isError ? <span className="text-destructive text-sm font-sans font-normal">Unavailable</span>
              : averageRating != null ? `${averageRating.toFixed(1)}/5`
              : <span className="text-muted-foreground text-sm font-sans font-normal">No reports yet</span>}
          </div>
        </Card>
        <Card className="p-3"><div className="text-[10px] uppercase text-muted-foreground">Contract</div><div className="text-sm font-medium mt-1">{gk.contractUntil}</div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <SectionTitle>Activity Timeline</SectionTitle>
          <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-border">
            {gkInteractions.map((i) => {
              const Icon = TYPE_ICON[i.type] ?? FileText;
              return (
                <div key={i.id} className="relative">
                  <div className="absolute -left-[15px] top-1 size-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm font-medium"><Icon className="size-3.5 text-muted-foreground" />{i.type}</div>
                    <div className="text-[11px] text-muted-foreground tabular-nums font-mono">{formatDate(i.date)} · {formatRelative(i.date)}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">{i.notes}</div>
                  <div className="flex gap-1.5 mt-1.5"><Pill>{i.outcome}</Pill><Pill tone="info">↳ {i.followUp}</Pill></div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <SectionTitle>Match Reports ({isLoading ? "…" : gkReports.length})</SectionTitle>
              {isError && (
                <button onClick={() => refetch()} className="text-[11px] text-primary hover:underline">Retry</button>
              )}
            </div>
            {isLoading ? (
              <div className="text-xs text-muted-foreground italic py-2">Loading real Match Reports…</div>
            ) : isError ? (
              <div className="text-xs text-destructive py-2">
                Couldn't load Match Reports. {isFetching ? "Retrying…" : "Try again."}
              </div>
            ) : gkReports.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-2">No Match Reports recorded for this goalkeeper yet.</div>
            ) : (
              <div className="space-y-2">
                {gkReports.slice(0, 5).map((r) => (
                  <Link
                    key={r.report_id}
                    to="/reports/$reportId"
                    params={{ reportId: r.report_id }}
                    className="flex items-center gap-2 p-2 rounded-md bg-accent/20 border border-border/40 hover:border-primary/40"
                  >
                    <FileText className="size-3.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        Match Report{r.opponent ? ` · Opponent: ${r.opponent}` : ""}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Date: {r.match_date ? formatDate(r.match_date) : "not recorded"}
                        {r.competition ? ` · Competition: ${r.competition}` : ""}
                      </div>
                    </div>
                    <span className="text-xs font-semibold tabular-nums font-mono">
                      {r.average != null ? `Avg: ${r.average.toFixed(1)}/5` : "—"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <SectionTitle>Skill Scores (last 5 match reports)</SectionTitle>
            {isLoading ? (
              <div className="text-xs text-muted-foreground italic py-2">Loading…</div>
            ) : isError ? (
              <div className="text-xs text-destructive py-2">Couldn't load skill scores.</div>
            ) : gkReports.length === 0 ? (
              <div className="text-xs text-muted-foreground italic py-2">No skill scores available — no Match Reports for this goalkeeper.</div>
            ) : (
              <div className="space-y-2.5">
                {PILLAR_IDS.map((id) => {
                  const v = pillarAverages[id];
                  return (
                    <div key={id}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">{PILLAR_LABELS[id]}</span>
                        <span className="tabular-nums font-mono font-medium">
                          {v != null ? `${v.toFixed(1)}/5` : <span className="text-muted-foreground italic">not recorded</span>}
                        </span>
                      </div>
                      <ProgressBar value={v != null ? (v / 5) * 100 : 0} />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <SectionTitle>Media ({gkMedia.length})</SectionTitle>
            <div className="space-y-1.5">
              {gkMedia.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs gap-2">
                  <span className="truncate">{m.title}</span>
                  <Pill>{m.kind}</Pill>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
