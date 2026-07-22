/**
 * Canonical production domain for the app. All user-facing links generated
 * server-side or delivered by email (invites, password resets, OAuth redirects)
 * must resolve here so they work regardless of which preview/published origin
 * a session was initiated from.
 */
export const CANONICAL_ORIGIN = "https://www.rpmmentor.com";

export function canonicalUrl(path: string = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${CANONICAL_ORIGIN}${suffix}`;
}
