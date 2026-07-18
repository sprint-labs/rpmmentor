// Well-known "source" values passed via the `source` search param from the
// mentor dashboard cards / outstanding-action rows. Used by destination
// pages to render dynamic breadcrumbs and page headings that reflect which
// card the user came from.

export const NAV_SOURCES = {
  "reports-submitted": {
    label: "Match Reports Submitted",
    title: "Match Reports",
    heading: "Match Reports Submitted",
  },
  "outstanding-actions": {
    label: "Outstanding Actions",
    title: "Outstanding Match Reports",
    heading: "Outstanding Actions",
  },
  "outstanding-report": {
    label: "Outstanding: Submit Report",
    title: "Submit Outstanding Report",
    heading: "Outstanding: Submit Report",
  },
  "interactions-logged": {
    label: "Interactions Logged",
    title: "Interactions Logged",
    heading: "Interactions Logged",
  },
  "clips-posted": {
    label: "Match Clips Posted",
    title: "Match Clips Posted",
    heading: "Match Clips Posted",
  },
  "outstanding-clip": {
    label: "Outstanding: Upload Clip",
    title: "Upload Outstanding Clip",
    heading: "Outstanding: Upload Clip",
  },
} as const;

export type NavSource = keyof typeof NAV_SOURCES;

export function getNavSource(value: string | undefined): (typeof NAV_SOURCES)[NavSource] | null {
  if (!value) return null;
  return (NAV_SOURCES as Record<string, (typeof NAV_SOURCES)[NavSource]>)[value] ?? null;
}
